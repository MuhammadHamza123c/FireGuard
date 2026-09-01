from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional

from app.core.deps import get_current_user
from app.services.supabase_db import insert_detection, recalculate_points, get_all_push_tokens, delete_token_by_value
from app.services.supabase_storage import upload_file, upload_audio_file
from app.services.location import resolve_location
from app.routes.live_alerts import broadcast_fire_alert
from app.services.push_notify import send_fire_alert

router = APIRouter()


class FireAlertRequest(BaseModel):
    incident_type: str
    fire_confidence: float
    smoke_confidence: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    region: Optional[str] = None
    country: Optional[str] = None
    source: str
    file_url: Optional[str] = None
    audio_url: Optional[str] = None
    message: str


@router.post("/fire_alert")
async def fire_alert(
    req: FireAlertRequest,
    user: dict = Depends(get_current_user),
):
    try:
        location = await resolve_location(
            req.latitude, req.longitude, req.city, req.region, req.country
        )

        record = await insert_detection({
            "user_id": user["id"],
            "user_name": user.get("full_name") or user.get("email", ""),
            "incident_type": req.incident_type,
            "fire_confidence": req.fire_confidence,
            "smoke_confidence": req.smoke_confidence,
            "status": "DETECTED",
            "latitude": location["latitude"],
            "longitude": location["longitude"],
            "city": location["city"],
            "region": location["region"],
            "country": location["country"],
            "message": req.message,
            "source": req.source,
            "file_url": req.file_url,
            "audio_url": req.audio_url,
        })

        profile = await recalculate_points(user["id"])

        await broadcast_fire_alert(record)

        try:
            tokens = await get_all_push_tokens()
            if tokens:
                result = send_fire_alert(tokens, record)
                for failed_token in result.get("failed", []):
                    await delete_token_by_value(failed_token)
        except Exception:
            pass

        return {
            "success": True,
            "message": req.message,
            "record": record,
            "profile": profile,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload_audio")
async def upload_audio(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    try:
        content = await file.read()

        ext = "webm"
        if file.filename and "." in file.filename:
            ext = file.filename.rsplit(".", 1)[-1]

        url = await upload_audio_file(content, f"audio.{ext}")
        return {"success": True, "audio_url": url}
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Audio upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
