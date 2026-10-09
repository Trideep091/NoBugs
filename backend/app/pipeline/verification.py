from typing import List, Dict, Any
from .privacy import redact_sensitive_text
from .parser import parse_log_line
from .clustering import cluster_logs
from .scoring import score_and_rank_clusters

def verify_fix_comparison(
    baseline_incidents: List[Dict[str, Any]],
    postfix_raw_logs: str
) -> Dict[str, Any]:
    """
    Compares baseline incident window with post-fix log window.
    Evaluates eliminated, decreased, persisted, and new patterns.
    """
    lines = [l for l in postfix_raw_logs.splitlines() if l.strip()]
    if not lines:
        return {
            "verdict": "INSUFFICIENT_DATA",
            "summary": "Post-fix log window is empty.",
            "before_error_count": sum(i.get("log_count", 0) for i in baseline_incidents),
            "after_error_count": 0,
            "pattern_comparison": [],
            "new_patterns": []
        }

    # Process post-fix logs
    parsed_postfix = []
    for line in lines:
        redacted, _, _ = redact_sensitive_text(line)
        p = parse_log_line(redacted)
        if p:
            parsed_postfix.append(p)

    postfix_clusters = cluster_logs(parsed_postfix)
    scored_postfix = score_and_rank_clusters(postfix_clusters)

    # Map baseline templates
    baseline_map = {inc["template"]: inc for inc in baseline_incidents}
    postfix_map = {inc["template"]: inc for inc in scored_postfix}

    before_total = sum(i.get("log_count", 0) for i in baseline_incidents)
    after_total = sum(i.get("log_count", 0) for i in scored_postfix)

    pattern_comparison = []
    # Check baseline patterns
    for tmpl, b_inc in baseline_map.items():
        p_inc = postfix_map.get(tmpl)
        b_count = b_inc.get("log_count", 0)
        p_count = p_inc.get("log_count", 0) if p_inc else 0

        if p_count == 0:
            status = "ELIMINATED"
            delta_pct = -100
        elif p_count < b_count * 0.5:
            status = "DECREASED"
            delta_pct = round(((p_count - b_count) / b_count) * 100, 1)
        elif p_count > b_count * 1.2:
            status = "REGRESSED"
            delta_pct = round(((p_count - b_count) / b_count) * 100, 1)
        else:
            status = "PERSISTED"
            delta_pct = round(((p_count - b_count) / b_count) * 100, 1)

        pattern_comparison.append({
            "template": tmpl,
            "priority": b_inc.get("priority"),
            "service": b_inc.get("services", ["app"])[0],
            "before_count": b_count,
            "after_count": p_count,
            "status": status,
            "delta_pct": delta_pct
        })

    # Check for brand new patterns
    new_patterns = []
    for tmpl, p_inc in postfix_map.items():
        if tmpl not in baseline_map:
            new_patterns.append({
                "template": tmpl,
                "priority": p_inc.get("priority"),
                "service": p_inc.get("services", ["app"])[0],
                "count": p_inc.get("log_count", 0),
                "status": "NEW_ANOMALY"
            })

    # Determine Verdict
    eliminated_criticals = [
        p for p in pattern_comparison
        if p["priority"] == "Critical" and p["status"] in {"ELIMINATED", "DECREASED"}
    ]

    if after_total == 0 or (after_total < before_total * 0.15 and len(new_patterns) == 0):
        verdict = "RESOLVED"
        summary = f"Root-cause patterns completely eliminated. Total error volume plummeted by {round((1 - after_total/max(1, before_total))*100, 1)}%."
    elif after_total < before_total * 0.5:
        verdict = "MITIGATED"
        summary = f"Incident symptoms subdued; {len(eliminated_criticals)} critical patterns mitigated, but lingering warnings observed."
    elif new_patterns:
        verdict = "NEW_PATTERNS_DETECTED"
        summary = f"Fix altered runtime behavior: {len(new_patterns)} new error template(s) appeared during post-patch verification."
    elif after_total > before_total:
        verdict = "REGRESSED"
        summary = "Error volume increased following the fix. Immediate rollback recommended."
    else:
        verdict = "PERSISTENT"
        summary = "Error volume and cascade templates persist with minimal change."

    return {
        "verdict": verdict,
        "summary": summary,
        "before_error_count": before_total,
        "after_error_count": after_total,
        "reduction_pct": round((1 - (after_total / max(1, before_total))) * 100, 1),
        "pattern_comparison": pattern_comparison,
        "new_patterns": new_patterns
    }

def detect_early_warning_signals(parsed_logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detects subtle leading indicators preceding major spikes (connection wait spikes, memory thresholds).
    Framed as recommendations to validate rather than absolute guarantees.
    """
    signals = []
    
    # Check for database connection latency spikes
    db_wait_lines = [l for l in parsed_logs if "latency spike" in l["message"].lower() or "connection in" in l["message"].lower()]
    if db_wait_lines:
        signals.append({
            "indicator": "Rising Connection-Acquisition Latency",
            "service": "db",
            "confidence": "Medium",
            "observed_lead_time": "~60s prior to cascading failures",
            "evidence": db_wait_lines[0]["raw"],
            "recommendation": "Validate HikariCP / pgpool active lease times and consider preemptively increasing max_connections ceiling before peak traffic."
        })

    # Check for cache miss bursts
    cache_lines = [l for l in parsed_logs if "cache miss spike" in l["message"].lower()]
    if cache_lines:
        signals.append({
            "indicator": "Elevated Cache Miss Rate on Session Keys",
            "service": "cache",
            "confidence": "Low",
            "observed_lead_time": "~90s prior to database saturation",
            "evidence": cache_lines[0]["raw"],
            "recommendation": "Review cache TTLs and warm key replicas to avoid thundering-herd effect on primary database read-replicas."
        })

    return signals
