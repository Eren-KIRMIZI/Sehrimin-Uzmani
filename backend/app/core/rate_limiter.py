import time
from collections import defaultdict
from fastapi import Request, HTTPException


class RateLimiter:
    def __init__(self):
        self._requests: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str, max_requests: int = 5, window_seconds: int = 300):
        now = time.time()
        cutoff = now - window_seconds

        self._requests[key] = [t for t in self._requests[key] if t > cutoff]

        if len(self._requests[key]) >= max_requests:
            raise HTTPException(
                status_code=429,
                detail=f"Cok fazla deneme. {window_seconds} saniye icinde en fazla {max_requests} hakkiniz var.",
            )

        self._requests[key].append(now)


rate_limiter = RateLimiter()


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
