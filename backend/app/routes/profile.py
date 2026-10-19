from fastapi import APIRouter, Depends

from app.core.deps import get_current_user
from app.services.supabase_db import get_user_profile, recalculate_points

router = APIRouter()


@router.get("/profile/me")
async def get_my_profile(user: dict = Depends(get_current_user)):
    # Always recalculate to reflect latest incident changes
    profile = await recalculate_points(user["id"])

    return {
        "success": True,
        "profile": profile,
    }
