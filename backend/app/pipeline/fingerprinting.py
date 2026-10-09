import hashlib
import json
from typing import List, Dict, Any, Optional

def compute_incident_fingerprint(
    template: str,
    services: List[str],
    trend: str,
    error_rate: float
) -> Dict[str, Any]:
    """
    Computes a signature representation of an incident pattern.
    """
    normalized_tmpl = " ".join(template.lower().split())
    # Signature hash
    hash_input = f"{normalized_tmpl}|{sorted(services)}|{trend}"
    sig_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:16]

    # Keyword tokens
    words = set([w for w in normalized_tmpl.replace("<*>", "").split() if len(w) > 3])

    return {
        "hash": sig_hash,
        "template": template,
        "services": services,
        "keywords": list(words),
        "trend": trend,
        "rate": error_rate
    }

def calculate_jaccard_similarity(set1: set, set2: set) -> float:
    if not set1 or not set2:
        return 0.0
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return intersection / union if union > 0 else 0.0

def match_fingerprint_to_ledger(
    incident_template: str,
    incident_services: List[str],
    ledger_entries: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """
    Finds the highest-similarity past incident from the ledger.
    Returns matched ledger entry and match percentage if score >= 0.45.
    """
    target_words = set([w for w in incident_template.lower().split() if len(w) > 3])
    target_services = set([s.lower() for s in incident_services])

    best_match = None
    highest_score = 0.0

    for entry in ledger_entries:
        entry_text = f"{entry.get('title', '')} {entry.get('problem', '')} {entry.get('root_cause', '')}".lower()
        entry_words = set([w for w in entry_text.split() if len(w) > 3])
        entry_services = set([s.lower() for s in entry.get('services_affected', [])])

        word_sim = calculate_jaccard_similarity(target_words, entry_words)
        svc_sim = calculate_jaccard_similarity(target_services, entry_services)

        # Composite score
        score = (word_sim * 0.6) + (svc_sim * 0.4)

        if score > highest_score and score >= 0.25:
            highest_score = score
            best_match = {
                "ledger_id": entry.get("id"),
                "title": entry.get("title"),
                "problem": entry.get("problem"),
                "root_cause": entry.get("root_cause"),
                "fix_applied": entry.get("fix_applied"),
                "outcome": entry.get("outcome"),
                "similarity_score": round(score * 100, 1)
            }

    return best_match
