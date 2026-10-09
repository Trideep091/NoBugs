import json
from typing import List, Dict, Any, Tuple

DEFAULT_SERVICE_DEPENDENCIES = {
    "db": ["payment", "checkout", "auth"],
    "payment": ["checkout", "api-gateway"],
    "checkout": ["api-gateway"],
    "cache": ["checkout", "api-gateway"],
    "auth": ["api-gateway", "checkout"],
}

ALL_TOPOLOGY_SERVICES = ["db", "payment", "checkout", "api-gateway", "cache", "auth", "inventory", "notifications"]

def infer_causality_and_blast_radius(
    incidents: List[Dict[str, Any]],
    custom_dependencies: Dict[str, List[str]] = None
) -> Dict[str, Any]:
    """
    Constructs an inferred causality graph and blast radius.
    Never claims correlation as proven causation - all edges marked as 'inferred'.
    """
    deps = custom_dependencies or DEFAULT_SERVICE_DEPENDENCIES

    # Sort incidents by earliest onset epoch
    sorted_inc = sorted(incidents, key=lambda x: (x.get("first_seen_epoch", 0), -x.get("score", 0)))
    
    # 1. Identify confirmed services
    confirmed_services = set()
    service_to_incidents: Dict[str, List[Dict[str, Any]]] = {}

    for inc in sorted_inc:
        for s in inc.get("services", []):
            if s and s != "unknown":
                confirmed_services.add(s)
                service_to_incidents.setdefault(s, []).append(inc)

    # 2. Identify predicted downstream services (reachable in topology but not yet failing)
    predicted_services = set()
    for active_svc in confirmed_services:
        downstream = deps.get(active_svc, [])
        for d in downstream:
            if d not in confirmed_services:
                predicted_services.add(d)

    # 3. Construct Inferred Edges
    edges = []
    edge_id = 1

    # Link incidents across dependency boundaries
    for i in range(len(sorted_inc)):
        parent = sorted_inc[i]
        p_services = parent.get("services", [])
        p_epoch = parent.get("first_seen_epoch", 0)

        for j in range(i + 1, len(sorted_inc)):
            child = sorted_inc[j]
            c_services = child.get("services", [])
            c_epoch = child.get("first_seen_epoch", 0)

            time_lag_sec = max(0, c_epoch - p_epoch)

            # Check if any parent service is upstream to any child service
            is_upstream = False
            for ps in p_services:
                if any(cs in deps.get(ps, []) for cs in c_services):
                    is_upstream = True
                    break

            if is_upstream and time_lag_sec <= 240:
                confidence = "High" if 10 <= time_lag_sec <= 180 else "Medium"
                reason = f"Upstream dependency ({', '.join(p_services)} \u2192 {', '.join(c_services)}) with onset lag of {time_lag_sec:.0f}s"

                edges.append({
                    "id": f"edge-{edge_id}",
                    "source": str(parent["id"]),
                    "target": str(child["id"]),
                    "source_service": p_services[0] if p_services else "unknown",
                    "target_service": c_services[0] if c_services else "unknown",
                    "confidence": confidence,
                    "status": "inferred",
                    "time_lag_sec": round(time_lag_sec, 1),
                    "reason": reason,
                    "source_first_seen": parent.get("first_seen"),
                    "target_first_seen": child.get("first_seen"),
                    "source_sample": (parent.get("sample_lines") or [{}])[0].get("message", parent.get("template")),
                    "target_sample": (child.get("sample_lines") or [{}])[0].get("message", child.get("template")),
                })
                edge_id += 1
            elif not is_upstream and 5 <= time_lag_sec <= 60 and (p_services != c_services):
                # Temporal co-occurrence
                edges.append({
                    "id": f"edge-{edge_id}",
                    "source": str(parent["id"]),
                    "target": str(child["id"]),
                    "source_service": p_services[0] if p_services else "unknown",
                    "target_service": c_services[0] if c_services else "unknown",
                    "confidence": "Low",
                    "status": "inferred",
                    "time_lag_sec": round(time_lag_sec, 1),
                    "reason": f"Temporal co-occurrence within {time_lag_sec:.0f}s (no explicit dependency)",
                    "source_first_seen": parent.get("first_seen"),
                    "target_first_seen": child.get("first_seen"),
                    "source_sample": (parent.get("sample_lines") or [{}])[0].get("message", parent.get("template")),
                    "target_sample": (child.get("sample_lines") or [{}])[0].get("message", child.get("template")),
                })
                edge_id += 1

    # Format nodes for React Flow
    nodes = []
    # Layout positions
    service_order = ["db", "cache", "auth", "payment", "checkout", "api-gateway"]
    svc_y_pos = {
        "db": 50,
        "cache": 180,
        "auth": 310,
        "payment": 100,
        "checkout": 150,
        "api-gateway": 180
    }
    svc_x_pos = {
        "db": 50,
        "cache": 50,
        "auth": 50,
        "payment": 320,
        "checkout": 600,
        "api-gateway": 880
    }

    # Add confirmed incident nodes
    service_slot_counts = {}
    for idx, inc in enumerate(sorted_inc):
        primary_svc = inc.get("services", ["unknown"])[0]
        slot = service_slot_counts.get(primary_svc, 0)
        service_slot_counts[primary_svc] = slot + 1

        base_x = svc_x_pos.get(primary_svc, 100 + (idx % 3) * 250)
        base_y = svc_y_pos.get(primary_svc, 100)
        x = base_x + (slot % 2) * 15
        y = base_y + slot * 135

        nodes.append({
            "id": str(inc["id"]),
            "type": "incidentNode",
            "position": {"x": x, "y": y},
            "data": {
                "id": inc["id"],
                "template": inc["template"],
                "priority": inc["priority"],
                "score": inc["score"],
                "service": primary_svc,
                "services": inc.get("services", []),
                "log_count": inc["log_count"],
                "first_seen": inc.get("first_seen"),
                "trend": inc.get("trend"),
                "impact_type": "confirmed",
                "sample_lines": inc.get("sample_lines", [])
            }
        })

    # Add predicted downstream nodes
    pred_idx = 0
    for pred_svc in sorted(list(predicted_services)):
        x = 900 + (pred_idx * 180)
        y = 120 + (pred_idx * 90)
        nodes.append({
            "id": f"pred-{pred_svc}",
            "type": "predictedNode",
            "position": {"x": x, "y": y},
            "data": {
                "id": f"pred-{pred_svc}",
                "template": f"Downstream reachability: {pred_svc} at risk",
                "priority": "Mild",
                "score": 30.0,
                "service": pred_svc,
                "services": [pred_svc],
                "log_count": 0,
                "first_seen": "Predicted",
                "trend": "predicted exposure",
                "impact_type": "predicted",
                "sample_lines": []
            }
        })
        pred_idx += 1

    # Critical path trace (longest path with High confidence)
    critical_path_edges = [e["id"] for e in edges if e["confidence"] == "High"]

    return {
        "nodes": nodes,
        "edges": edges,
        "blast_radius": {
            "confirmed_services": sorted(list(confirmed_services)),
            "predicted_services": sorted(list(predicted_services)),
            "total_impacted_services": len(confirmed_services) + len(predicted_services)
        },
        "critical_path_edges": critical_path_edges
    }
