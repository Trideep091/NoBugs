import re
from typing import Tuple, Dict, Any

# Regular expressions for sensitive tokens and personal data
RE_BEARER = re.compile(r'Bearer\s+[A-Za-z0-9\-_=.]+', re.IGNORECASE)
RE_API_KEY = re.compile(r'(?:api_key|apikey|api-token|access_token|secret_key|secret)\s*[:=]\s*["\']?([A-Za-z0-9_\-]{16,})["\']?', re.IGNORECASE)
RE_GENERIC_KEY = re.compile(r'\b(sk_(?:live|test)_[A-Za-z0-9]{20,})\b')
RE_JWT = re.compile(r'\beyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\b')
RE_PASSWORD = re.compile(r'(?:password|passwd|pwd)\s*[:=]\s*["\']?([^\s"\',]{4,})["\']?', re.IGNORECASE)
RE_EMAIL = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b')
RE_IPV4 = re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b')
RE_CREDIT_CARD = re.compile(r'\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b')

def redact_sensitive_text(text: str) -> Tuple[str, int, Dict[str, int]]:
    """
    Redacts sensitive keys, tokens, JWTs, passwords, emails, IPs, and credit card numbers.
    Returns:
        redacted_text (str)
        total_redactions (int)
        breakdown (dict)
    """
    counts = {
        "tokens": 0,
        "jwts": 0,
        "passwords": 0,
        "emails": 0,
        "ips": 0,
        "cards": 0
    }

    # Redact Bearer & API keys
    def sub_bearer(m):
        counts["tokens"] += 1
        return "Bearer [REDACTED_TOKEN]"
    text = RE_BEARER.sub(sub_bearer, text)

    def sub_api_key(m):
        counts["tokens"] += 1
        return f"{m.group(0).split(':')[0]}: [REDACTED_TOKEN]"
    text = RE_API_KEY.sub(sub_api_key, text)

    def sub_sk(m):
        counts["tokens"] += 1
        return "[REDACTED_TOKEN]"
    text = RE_GENERIC_KEY.sub(sub_sk, text)

    # Redact JWTs
    def sub_jwt(m):
        counts["jwts"] += 1
        return "[REDACTED_JWT]"
    text = RE_JWT.sub(sub_jwt, text)

    # Redact Passwords
    def sub_pwd(m):
        counts["passwords"] += 1
        prefix = m.group(0).split('=')[0] if '=' in m.group(0) else m.group(0).split(':')[0]
        return f"{prefix}=[REDACTED_PASSWORD]"
    text = RE_PASSWORD.sub(sub_pwd, text)

    # Redact Credit Cards
    def sub_card(m):
        counts["cards"] += 1
        return "[REDACTED_CARD]"
    text = RE_CREDIT_CARD.sub(sub_card, text)

    # Redact Emails
    def sub_email(m):
        counts["emails"] += 1
        return "[REDACTED_EMAIL]"
    text = RE_EMAIL.sub(sub_email, text)

    # Redact IPv4 (preserve 0.0.0.0 and 127.0.0.1 for local debugging context if desired, or redact all)
    def sub_ip(m):
        counts["ips"] += 1
        return "[REDACTED_IP]"
    text = RE_IPV4.sub(sub_ip, text)

    total = sum(counts.values())
    return text, total, counts
