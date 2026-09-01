from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.deps import get_current_user
from app.services.supabase_db import (
    get_user_push_tokens,
    save_push_token,
    delete_push_token,
)

router = APIRouter()


class SubscribeRequest(BaseModel):
    fcm_token: str


class UnsubscribeRequest(BaseModel):
    fcm_token: str


@router.post("/notifications/subscribe")
async def subscribe_notifications(
    req: SubscribeRequest,
    user: dict = Depends(get_current_user),
):
    try:
        await save_push_token(user["id"], req.fcm_token)
        return {"success": True, "message": "Push notifications enabled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/notifications/unsubscribe")
async def unsubscribe_notifications(
    req: UnsubscribeRequest,
    user: dict = Depends(get_current_user),
):
    try:
        await delete_push_token(user["id"], req.fcm_token)
        return {"success": True, "message": "Push notifications disabled"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notifications/status")
async def notification_status(
    user: dict = Depends(get_current_user),
):
    try:
        tokens = await get_user_push_tokens(user["id"])
        return {"enabled": len(tokens) > 0, "token_count": len(tokens)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
