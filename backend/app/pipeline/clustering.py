import re
import time
from typing import List, Dict, Any
from drain3 import TemplateMiner
from drain3.template_miner_config import TemplateMinerConfig
from drain3.masking import MaskingInstruction

def get_drain_miner() -> TemplateMiner:
    config = TemplateMinerConfig()
    config.drain_sim_th = 0.5
    config.drain_depth = 4
    config.drain_max_children = 100
    config.drain_max_clusters = 1024
    config.mask_prefix = "<"
    config.mask_suffix = ">"
    
    # Configure masking instructions directly
    config.masking_instructions = [
        MaskingInstruction(pattern=r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b", mask_with="*"),
        MaskingInstruction(pattern=r"\b\d+\.\d+\.\d+\.\d+\b", mask_with="*"),
        MaskingInstruction(pattern=r"\b0x[0-9a-fA-F]+\b", mask_with="*"),
        MaskingInstruction(pattern=r"\b\d+ms\b", mask_with="*"),
        MaskingInstruction(pattern=r"\b\d+\b", mask_with="*")
    ]
    return TemplateMiner(config=config)

def cluster_logs(parsed_logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Runs Drain3 template mining over parsed logs.
    Groups lines into clusters, identifies template signature with <*>,
    and attaches sample lines and timestamps.
    """
    miner = get_drain_miner()

    # Track cluster data
    clusters_map: Dict[int, Dict[str, Any]] = {}

    for log in parsed_logs:
        content = log["message"]
        # Mine template
        result = miner.add_log_message(content)
        cluster_id = result["cluster_id"]
        template = result["template_mined"]

        if cluster_id not in clusters_map:
            clusters_map[cluster_id] = {
                "cluster_id": cluster_id,
                "template": template,
                "log_count": 0,
                "services": set(),
                "levels": set(),
                "first_seen": log["timestamp"],
                "last_seen": log["timestamp"],
                "first_seen_epoch": log["epoch"] or time.time(),
                "last_seen_epoch": log["epoch"] or time.time(),
                "sample_lines": [],
            }

        cluster = clusters_map[cluster_id]
        cluster["log_count"] += 1
        if log["service"] and log["service"] != "unknown":
            cluster["services"].add(log["service"])
        if log["level"]:
            cluster["levels"].add(log["level"])
        
        # Update temporal bounds
        if log["epoch"] and (cluster["first_seen_epoch"] == 0 or log["epoch"] < cluster["first_seen_epoch"]):
            cluster["first_seen_epoch"] = log["epoch"]
            cluster["first_seen"] = log["timestamp"]
        if log["epoch"] and log["epoch"] > cluster["last_seen_epoch"]:
            cluster["last_seen_epoch"] = log["epoch"]
            cluster["last_seen"] = log["timestamp"]

        # Keep up to 5 representative samples
        if len(cluster["sample_lines"]) < 5:
            cluster["sample_lines"].append({
                "timestamp": log["timestamp"],
                "service": log["service"],
                "level": log["level"],
                "message": log["message"],
                "raw": log["raw"]
            })

    # Normalize sets to lists
    cluster_list = []
    for c in clusters_map.values():
        c["services"] = sorted(list(c["services"])) if c["services"] else ["app"]
        c["levels"] = sorted(list(c["levels"]))
        cluster_list.append(c)

    return cluster_list
