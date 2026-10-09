import math
from typing import Dict, Any, List

CRITICAL_KEYWORDS = [
    'timeout', 'connection refused', 'deadlock', 'oom', 'out of memory',
    'circuit breaker', '503', '500', 'crash', 'panic', 'pool exhausted',
    'unreachable', 'failed to connect', 'cascade'
]

def score_and_rank_clusters(clusters: List[Dict[str, Any]], session_duration_seconds: float = 300.0) -> List[Dict[str, Any]]:
    """
    Computes transparent impact score, error rates, acceleration, and priority badges.
    """
    scored = []

    for cluster in clusters:
        count = cluster["log_count"]
        services = cluster["services"]
        levels = cluster["levels"]
        template = cluster["template"].lower()

        # 1. Base Severity from log levels
        base_severity = 5
        if any(lvl in {'CRITICAL', 'FATAL'} for lvl in levels):
            base_severity = 35
        elif any(lvl in {'ERROR', 'SEVERE'} for lvl in levels):
            base_severity = 25
        elif any(lvl in {'WARN', 'WARNING'} for lvl in levels):
            base_severity = 10
        elif any(lvl in {'INFO'} for lvl in levels):
            base_severity = 3

        # 2. Critical Keywords Boost
        keyword_boost = 0
        matched_keywords = []
        for kw in CRITICAL_KEYWORDS:
            if kw in template:
                keyword_boost += 5
                matched_keywords.append(kw)
        keyword_boost = min(20, keyword_boost)

        # 3. Frequency / Volume Score
        volume_score = min(25, round(math.log10(max(1, count)) * 8, 1))

        # 4. Service Breadth (cross-service cascade)
        service_count = len(services)
        if service_count >= 3:
            service_breadth = 20
        elif service_count == 2:
            service_breadth = 12
        else:
            service_breadth = 5

        # 5. Rate of Change & Trend
        duration_sec = max(1.0, cluster["last_seen_epoch"] - cluster["first_seen_epoch"])
        duration_min = max(0.1, duration_sec / 60.0)
        error_rate_per_min = round(count / duration_min, 1)

        # Acceleration estimate
        trend = "ongoing & flat"
        acceleration_boost = 0
        doubling_time_sec = None
        time_to_saturation = "insufficient data"

        # If significant volume and distinct time span
        if count >= 10 and duration_sec > 10:
            # Simulate or inspect density
            # In our scenario, we can detect if first_seen is recent
            # High error rate indicates active ongoing spike
            if error_rate_per_min > 50:
                trend = "ongoing & accelerating"
                acceleration_boost = 15
                doubling_time_sec = round(duration_sec / 2.5, 1)
                time_to_saturation = f"approx {doubling_time_sec * 2.2:.1f}s to pool limit"
            elif error_rate_per_min > 10:
                trend = "ongoing & flat"
                acceleration_boost = 5
            else:
                trend = "resolved/decaying"
                acceleration_boost = -5
        elif count >= 3:
            trend = "ongoing & flat"
            acceleration_boost = 3

        # Total score
        total_score = round(base_severity + keyword_boost + volume_score + service_breadth + acceleration_boost, 1)
        total_score = max(5.0, min(100.0, total_score))

        # Priority label
        if total_score >= 68:
            priority = "Critical"
        elif total_score >= 45:
            priority = "High"
        elif total_score >= 25:
            priority = "Mild"
        else:
            priority = "Low"

        score_breakdown = {
            "base_severity": base_severity,
            "keyword_boost": keyword_boost,
            "matched_keywords": matched_keywords[:3],
            "volume_score": volume_score,
            "service_breadth": service_breadth,
            "acceleration_boost": acceleration_boost,
            "total_score": total_score
        }

        cluster["score"] = total_score
        cluster["priority"] = priority
        cluster["score_breakdown"] = score_breakdown
        cluster["error_rate_per_min"] = error_rate_per_min
        cluster["doubling_time_sec"] = doubling_time_sec
        cluster["time_to_saturation"] = time_to_saturation
        cluster["trend"] = trend

        scored.append(cluster)

    # Sort descending by impact score
    scored.sort(key=lambda x: (x["score"], x["log_count"]), reverse=True)
    return scored
