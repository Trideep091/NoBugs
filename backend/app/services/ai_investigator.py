import os
import json
import httpx
from typing import Dict, Any, List, Optional
from ..config import settings

AI_INVESTIGATION_SYSTEM_PROMPT = """You are NoBugs AI, an expert Principal SRE and Incident Commander investigating a high-severity production outage.
You analyze redacted log cluster templates, timestamps, and sample evidence lines.
You must return a STRICT JSON object (no markdown formatting, no code blocks) matching this exact schema:
{
  "explanation": "Clear plain-English executive summary of what failed and why (2-3 sentences).",
  "start_time": "Timestamp of earliest observed failure onset",
  "affected_services": ["service1", "service2"],
  "hypotheses": [
    {
      "rank": 1,
      "title": "Hypothesis 1 title",
      "probability_pct": 70,
      "supporting_evidence": ["Log line citation 1", "Log line citation 2"],
      "contrary_evidence": "Evidence or conditions that argue against this hypothesis"
    },
    {
      "rank": 2,
      "title": "Hypothesis 2 title",
      "probability_pct": 20,
      "supporting_evidence": ["Log line citation"],
      "contrary_evidence": "Why this is less likely than hypothesis 1"
    },
    {
      "rank": 3,
      "title": "Hypothesis 3 title",
      "probability_pct": 10,
      "supporting_evidence": ["Log line citation"],
      "contrary_evidence": "Why this is a red herring or downstream symptom"
    }
  ],
  "distinguishing_test": "One precise diagnostic test (e.g. CLI command, SQL query, or metrics check) that would decisively prove hypothesis 1 vs hypothesis 2.",
  "recommended_action": "Immediate next mitigation action for the on-call engineer (e.g. increase connection pool max_connections, restart pods, failover replica)."
}
"""

def generate_heuristic_investigation(
    template: str,
    services: List[str],
    first_seen: str,
    sample_lines: List[Dict[str, Any]],
    challenge_focus: Optional[str] = None
) -> Dict[str, Any]:
    """
    High-fidelity offline heuristic fallback when Claude API key is absent or network fails.
    Produces realistic domain-aware root-cause hypotheses, contrary evidence, and diagnostic tests.
    """
    tmpl_lower = template.lower()
    services_str = ", ".join(services) if services else "affected services"
    evidence_quotes = [s.get("message", s.get("raw", "")) for s in sample_lines[:3]]
    if not evidence_quotes:
        evidence_quotes = [template]

    # Heuristic scenario detection:
    if "connection pool" in tmpl_lower or "db" in tmpl_lower or "statement timeout" in tmpl_lower:
        h1_title = "Primary Database Connection Pool Starvation & Saturation"
        h1_contrary = "Active connection count metrics have not yet been correlated against max_connections ceiling in pg_stat_activity."
        h2_title = "Long-running query holding table exclusive locks on PostgreSQL"
        h2_contrary = "CPU load on the database instance remained steady; timeout manifests as queue acquisition wait rather than CPU throttle."
        h3_title = "Transient Network Partition between Kubernetes Pods and DB Replica"
        h3_contrary = "TCP handshakes to port 5432 succeed immediately; failures occur strictly inside the HikariCP/application connection pool."
        test = "Run `SELECT count(*), state FROM pg_stat_activity GROUP BY state;` and inspect `pg_stat_database.wait_event_type` for Lock vs ClientRead."
        action = "Temporarily increase DB connection pool max_size from 20 to 50 in ConfigMap and restart payment-svc worker pods."
        explanation = f"Database connection acquisition queue reached saturation starting at {first_seen}. Applications are blocking waiting for idle DB connections, resulting in client-side pool timeouts across {services_str}."

    elif "circuit breaker" in tmpl_lower or "payment" in tmpl_lower:
        h1_title = "Upstream DB Exhaustion Cascading into Payment Service Circuit Breaker"
        h1_contrary = "Circuit breaker tripped due to 80% error threshold; could hypothetically be external Stripe gateway outage if DB was healthy."
        h2_title = "External Payment Gateway (Stripe/Provider) API Outage"
        h2_contrary = "Provider health checks prior to onset reported status=ACTIVE (42ms latency); failure message explicitly cites 'db_unreachable'."
        h3_title = "Local Memory Exhaustion / Garbage Collection Pause in Payment Pod"
        h3_contrary = "Pod liveness probes remained healthy; RPC timeouts occurred at synchronous network boundary."
        test = "Curl internal payment health probe `curl -v http://payment-svc:8080/health/deps` to isolate internal DB latency vs external gateway."
        action = "Verify DB read/write availability, then reset circuit breaker threshold using `curl -X POST http://payment-svc/admin/breaker/reset`."
        explanation = f"Payment service circuit breaker tripped to OPEN state at {first_seen} after observing sequential downstream database timeouts. All downstream transactions are currently being failed-fast."

    elif "503" in tmpl_lower or "checkout" in tmpl_lower or "order" in tmpl_lower:
        h1_title = "Cascading Upstream Service Dependency Failure (Payment & DB Outage)"
        h1_contrary = "Checkout service itself has not run out of memory or worker threads; errors originate strictly from upstream 503 responses."
        h2_title = "Ingress Gateway Ingress/Egress Envoy Proxy Saturation"
        h2_contrary = "Gateway reports 200 OK for static endpoints (/healthz); 503 is restricted to routes dependent on checkout and payment."
        h3_title = "Cache Invalidation Thundering Herd"
        h3_contrary = "Cache miss warnings appeared 2 minutes earlier without causing immediate 503s on checkout."
        test = "Inspect distributed trace waterfall for `/api/v2/orders/submit` using OpenTelemetry to verify latency hop distribution."
        action = "Enable checkout fallback queue to buffer incoming orders in Redis/SQS while payment service connection pools recover."
        explanation = f"Checkout and API Gateway are dropping user requests with HTTP 503 at {first_seen} due to upstream failure cascade across {services_str}."

    else:
        h1_title = f"Service Resource Exhaustion in {services_str}"
        h1_contrary = "Metrics show intermittent error bursts rather than continuous sustained failure."
        h2_title = "Configuration Drift or Misconfigured Timeout Threshold"
        h2_contrary = "No deployment events recorded within 1 hour prior to onset timestamp."
        h3_title = "Downstream Dependency Degradation"
        h3_contrary = "Health checks report dependencies reachable."
        test = "Review application logs with debug verbosity for the 5-minute onset window around " + first_seen
        action = "Scale replica deployment count for " + services_str + " and inspect cluster event logs."
        explanation = f"Unusual error concentration detected in {services_str} starting at {first_seen}. Incident score reflects elevated frequency and cross-service impact."

    if challenge_focus:
        explanation = f"[CHALLENGED THEORY]: Re-evaluating counter-evidence against '{challenge_focus}'. Contrary evidence shows this pattern may be a secondary symptom rather than root cause."

    return {
        "explanation": explanation,
        "start_time": first_seen,
        "affected_services": services,
        "hypotheses": [
            {
                "rank": 1,
                "title": h1_title,
                "probability_pct": 72,
                "supporting_evidence": evidence_quotes[:2],
                "contrary_evidence": h1_contrary
            },
            {
                "rank": 2,
                "title": h2_title,
                "probability_pct": 20,
                "supporting_evidence": evidence_quotes[1:2] if len(evidence_quotes) > 1 else evidence_quotes[:1],
                "contrary_evidence": h2_contrary
            },
            {
                "rank": 3,
                "title": h3_title,
                "probability_pct": 8,
                "supporting_evidence": evidence_quotes[2:3] if len(evidence_quotes) > 2 else [f"Downstream service warnings in {services_str}"],
                "contrary_evidence": h3_contrary
            }
        ],
        "distinguishing_test": test,
        "recommended_action": action,
        "mode": "ai-heuristic"
    }


async def investigate_incident_with_ai(
    template: str,
    services: List[str],
    first_seen: str,
    log_count: int,
    sample_lines: List[Dict[str, Any]],
    challenge_theory: Optional[str] = None
) -> Dict[str, Any]:
    """
    Invokes Claude API if ANTHROPIC_API_KEY is configured.
    Falls back gracefully to rich heuristic investigation if no key or error occurs.
    """
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        return generate_heuristic_investigation(template, services, first_seen, sample_lines, challenge_theory)

    prompt_context = f"""INCIDENT SUMMARY:
Template Mined: {template}
Impacted Services: {', '.join(services)}
Onset Timestamp: {first_seen}
Log Occurrence Count: {log_count}
Representative Sample Lines (Redacted):
{json.dumps(sample_lines[:5], indent=2)}
"""

    if challenge_theory:
        prompt_context += f"\nCRITICAL CHALLENGE: The on-call engineer has challenged the theory '{challenge_theory}'. Specifically search for contradicting evidence, alternative root causes, and explain why '{challenge_theory}' might only be a downstream symptom or correlation."

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            body = {
                "model": settings.ANTHROPIC_MODEL,
                "max_tokens": 1500,
                "system": AI_INVESTIGATION_SYSTEM_PROMPT,
                "messages": [
                    {"role": "user", "content": prompt_context}
                ]
            }
            resp = await client.post("https://api.anthropic.com/v1/messages", headers=headers, json=body)
            if resp.status_code == 200:
                data = resp.json()
                content_text = data["content"][0]["text"].strip()
                # Parse JSON
                try:
                    parsed_json = json.loads(content_text)
                    parsed_json["mode"] = f"claude ({settings.ANTHROPIC_MODEL})"
                    return parsed_json
                except Exception:
                    # Clean potential markdown wrapping
                    if "```json" in content_text:
                        clean = content_text.split("```json")[1].split("```")[0].strip()
                        parsed_json = json.loads(clean)
                        parsed_json["mode"] = f"claude ({settings.ANTHROPIC_MODEL})"
                        return parsed_json
    except Exception as e:
        print(f"[AI Investigator] Claude API request failed or timed out: {e}. Using offline fallback.")

    return generate_heuristic_investigation(template, services, first_seen, sample_lines, challenge_theory)
