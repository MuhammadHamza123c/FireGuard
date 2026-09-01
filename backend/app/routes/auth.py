from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.schemas.auth import SignupRequest, LoginRequest, AuthResponse, UserResponse
from app.services.supabase_auth import signup, login, refresh_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse)
async def signup_user(req: SignupRequest):
    try:
        data = await signup(req.email, req.password, req.full_name)

        user = data.get("user", {})
        return AuthResponse(
            access_token=data["access_token"],
            refresh_token=data["refresh_token"],
            expires_in=data.get("expires_in", 3600),
            user=UserResponse(
                id=user.get("id", ""),
                email=user.get("email", ""),
                full_name=user.get("user_metadata", {}).get("full_name"),
                created_at=user.get("created_at"),
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login_user(req: LoginRequest):
    try:
        data = await login(req.email, req.password)

        user = data.get("user", {})
        return AuthResponse(
            access_token=data["access_token"],
            refresh_token=data["refresh_token"],
            expires_in=data.get("expires_in", 3600),
            user=UserResponse(
                id=user.get("id", ""),
                email=user.get("email", ""),
                full_name=user.get("user_metadata", {}).get("full_name"),
                created_at=user.get("created_at"),
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/refresh")
async def refresh_user_token(req: RefreshRequest):
    try:
        data = await refresh_token(req.refresh_token)
        return {
            "access_token": data["access_token"],
            "refresh_token": data["refresh_token"],
            "expires_in": data.get("expires_in", 3600),
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
