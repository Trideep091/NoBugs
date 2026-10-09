import re
import json
import datetime
from typing import Dict, Any, Optional

RE_ISO_TIMESTAMP = re.compile(r'(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)')
RE_SYSLOG_TIMESTAMP = re.compile(r'([A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})')
RE_LEVEL = re.compile(r'\b(CRITICAL|FATAL|ERROR|SEVERE|WARNING|WARN|INFO|DEBUG|TRACE)\b', re.IGNORECASE)

KNOWN_SERVICES = {
    'api-gateway', 'gateway', 'checkout', 'payment', 'payment-svc', 
    'db', 'postgres', 'database', 'cache', 'redis', 'auth', 'auth-svc',
    'worker', 'order-svc', 'inventory', 'notification', 'ingress'
}

def parse_epoch(ts_str: Optional[str]) -> float:
    if not ts_str:
        return 0.0
    try:
        # Try ISO format
        cleaned = ts_str.replace('Z', '+00:00').strip()
        if 'T' in cleaned:
            dt = datetime.datetime.fromisoformat(cleaned)
        elif ' ' in cleaned:
            dt = datetime.datetime.strptime(cleaned.split('.')[0], "%Y-%m-%d %H:%M:%S")
        else:
            return 0.0
        return dt.timestamp()
    except Exception:
        return 0.0

def parse_log_line(line: str) -> Dict[str, Any]:
    """
    Parses a single log line into structured components:
    timestamp, epoch, level, service, message, raw, parsed_status
    """
    raw_line = line.strip()
    if not raw_line:
        return None

    # 1. Try JSON log format
    if raw_line.startswith('{') and raw_line.endswith('}'):
        try:
            data = json.loads(raw_line)
            ts = data.get('timestamp') or data.get('time') or data.get('@timestamp') or ''
            level = (data.get('level') or data.get('severity') or 'INFO').upper()
            service = data.get('service') or data.get('app') or data.get('logger') or 'app'
            msg = data.get('message') or data.get('msg') or data.get('event') or json.dumps(data)
            return {
                "timestamp": str(ts),
                "epoch": parse_epoch(str(ts)),
                "level": level,
                "service": str(service).lower(),
                "message": str(msg).strip(),
                "raw": raw_line,
                "parsed": True,
                "format": "json"
            }
        except Exception:
            pass

    # 2. Try common regex formats
    # Format: 2026-10-10 03:00:01 ERROR payment-svc Connection pool timeout...
    ts_match = RE_ISO_TIMESTAMP.search(raw_line)
    ts_str = ts_match.group(1) if ts_match else None
    
    level_match = RE_LEVEL.search(raw_line)
    level = level_match.group(1).upper() if level_match else 'INFO'

    # Extract service name
    service = "unknown"
    # Look for known services first
    lower_line = raw_line.lower()
    for s in KNOWN_SERVICES:
        if s in lower_line:
            service = s
            break
            
    # Try pattern like: [service] or service: or service -
    if service == "unknown":
        svc_match = re.search(r'\[([a-zA-Z0-9_\-]+)\]', raw_line)
        if svc_match and svc_match.group(1).lower() not in {'info', 'warn', 'error', 'debug', 'fatal'}:
            service = svc_match.group(1).lower()

    # Extract message part by removing timestamp and level if found
    clean_msg = raw_line
    if ts_str:
        clean_msg = clean_msg.replace(ts_str, '', 1)
    if level_match:
        clean_msg = re.sub(rf'\b{level_match.group(1)}\b', '', clean_msg, count=1, flags=re.IGNORECASE)
    
    # Strip brackets, dashes, colons from start of message
    clean_msg = re.sub(r'^[ \t\-\:\[\]\|]+', '', clean_msg).strip()
    if not clean_msg:
        clean_msg = raw_line

    return {
        "timestamp": ts_str or datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "epoch": parse_epoch(ts_str),
        "level": level,
        "service": service,
        "message": clean_msg,
        "raw": raw_line,
        "parsed": ts_match is not None,
        "format": "regex" if ts_match else "unstructured"
    }
