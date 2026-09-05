"""Per-user rate limiting to protect free-tier quotas (Gemini, SMS, server)."""
from __future__ import annotations

import time

_last_request: dict[str, float] = {}
MIN_SECONDS_BETWEEN_REQUESTS = 3


def check_rate_limit(user_id: str) -> bool:
    """Returns True if the request is permitted, or False if rate-limited."""
    now = time.time()
    last = _last_request.get(user_id, 0.0)
    if now - last < MIN_SECONDS_BETWEEN_REQUESTS:
        return False
    _last_request[user_id] = now
    return True


def reset_rate_limit(user_id: str | None = None) -> None:
    """Helper to clear rate limit state during tests."""
    global _last_request
    if user_id:
        _last_request.pop(user_id, None)
    else:
        _last_request.clear()
