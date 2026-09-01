from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.services.supabase_auth import get_user

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials

    try:
        user = await get_user(token)
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    user_id = user.get("id")
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token payload",
        )

    return {
        "id": user_id,
        "email": user.get("email", ""),
        "full_name": user.get("user_metadata", {}).get("full_name"),
    }
