from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.config import settings

def make_jwt(sub: str, wallet: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "iss": settings.JWT_ISS,
        "aud": settings.JWT_AUD,
        "iat": int(nok.timestamp()),
        "exp": int((now + timedelta(minutes=settings.JWT_EXPIRE_MIN)).timestamp()),
        "sub": sub,
        "wallet": wallet.lower(),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
