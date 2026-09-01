import cv2
import numpy as np
from fastapi import APIRouter, Depends, File, UploadFile, Form
from typing import Optional

from app.core.deps import get_current_user
from app.services.detection import detect_frame
from app.services.location import resolve_location
from app.services.supabase_storage import upload_file

router = APIRouter()


@router.post("/image_processing")
async def image_processing(
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    city: Optional[str] = Form(None),
    region: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
):
    contents = await file.read()

    file_url = None
    try:
        file_url = await upload_file(contents, file.filename, file.content_type)
    except Exception:
        pass

    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return {"error": "Could not read image"}

    detection, _ = detect_frame(frame)

    location = await resolve_location(latitude, longitude, city, region, country)

    return {
        "success": True,
        "fire_detected": detection.fire_detected,
        "smoke_detected": detection.smoke_detected,
        "fire_confidence": detection.fire_confidence,
        "smoke_confidence": detection.smoke_confidence,
        "status": detection.status,
        "incident_type": detection.status if detection.fire_detected else None,
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "city": location["city"],
        "region": location["region"],
        "country": location["country"],
        "file_url": file_url,
    }
