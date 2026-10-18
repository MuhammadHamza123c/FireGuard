import re
import uuid
from pathlib import Path, PurePosixPath
from typing import Optional

import cv2
from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
)
from pydantic import BaseModel

from app.config import OUTPUT_DIR, FRAME_SKIP
from app.core.deps import get_current_user
from app.services.detection import detect_frame, annotate_frame, FireVerifier
from app.services.location import resolve_location
from app.services.supabase_storage import (
    create_video_upload_target,
    download_storage_file,
    get_public_file_url,
    upload_file,
    upload_storage_file,
)

router = APIRouter()


class VideoUploadRequest(BaseModel):
    file_name: str


def _get_access_token(request: Request) -> str:
    authorization = request.headers.get("authorization", "")
    scheme, separator, token = authorization.partition(" ")
    if not separator or scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Bearer token required")
    return token


@router.post("/video_upload")
async def create_video_upload(
    req: VideoUploadRequest,
    user: dict = Depends(get_current_user),
):
    return create_video_upload_target(user["id"], req.file_name)


@router.post("/video_processing")
async def video_processing(
    request: Request,
    file: Optional[UploadFile] = File(None),
    storage_path: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    city: Optional[str] = Form(None),
    region: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
):
    if not storage_path and file is None:
        raise HTTPException(
            status_code=400,
            detail="Upload a video to storage or provide a video file",
        )

    file_id = str(uuid.uuid4())
    access_token = _get_access_token(request)

    if storage_path:
        path_parts = PurePosixPath(storage_path).parts
        if (
            len(path_parts) != 2
            or path_parts[0] != user["id"]
            or not re.fullmatch(r"[0-9a-f]{32}\.[a-z0-9]{1,8}", path_parts[1])
        ):
            raise HTTPException(status_code=403, detail="Video path is not owned by user")

        suffix = Path(storage_path).suffix.lower() or ".video"
        input_path = OUTPUT_DIR / f"{file_id}{suffix}"
        await download_storage_file(storage_path, input_path, access_token)
        file_url = get_public_file_url(storage_path)
    else:
        input_path = OUTPUT_DIR / f"{file_id}_{Path(file.filename or 'video').name}"
        content = await file.read()
        with input_path.open("wb") as buffer:
            buffer.write(content)

        file_url = None
        try:
            file_url = await upload_file(
                content, file.filename or "video", file.content_type or "video/mp4"
            )
        except Exception:
            pass

    cap = cv2.VideoCapture(str(input_path))

    if not cap.isOpened():
        input_path.unlink(missing_ok=True)
        return {"error": "Could not open video"}

    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    output_path = OUTPUT_DIR / f"{file_id}_result.mp4"
    out = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))
    if not out.isOpened():
        cap.release()
        input_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="Could not create processed video")

    verifier = FireVerifier()
    frame_number = 0
    last_detection = None
    last_results = None

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break

            frame_number += 1

            if frame_number % FRAME_SKIP == 0 or last_detection is None:
                detection, results = detect_frame(frame)
                last_detection = detection
                last_results = results
            else:
                detection = last_detection
                results = last_results

            confirmed = verifier.update(detection, frame_number)

            annotated_frame = annotate_frame(frame, results, detection)

            cv2.putText(annotated_frame, f"Fire verification: {verifier.fire_count}/5", (20, 80),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

            if confirmed:
                cv2.putText(annotated_frame, "INCIDENT CONFIRMED!", (20, 125),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)

            out.write(annotated_frame)
    except Exception:
        output_path.unlink(missing_ok=True)
        raise
    finally:
        cap.release()
        out.release()
        input_path.unlink(missing_ok=True)

    output_video = None
    if verifier.incident_confirmed:
        output_storage_path = f"{user['id']}/{file_id}_result.mp4"
        try:
            await upload_storage_file(
                output_storage_path,
                output_path,
                access_token,
                "video/mp4",
            )
        finally:
            output_path.unlink(missing_ok=True)
        output_video = get_public_file_url(output_storage_path)
    else:
        output_path.unlink(missing_ok=True)

    location = await resolve_location(latitude, longitude, city, region, country)

    return {
        "success": True,
        "frames_processed": frame_number,
        "incident_confirmed": verifier.incident_confirmed,
        "incident_type": verifier.incident_type,
        "incident_frame": verifier.incident_frame,
        "fire_confidence": verifier.best_fire_confidence,
        "smoke_confidence": verifier.best_smoke_confidence,
        "output_video": output_video,
        "file_url": file_url,
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "city": location["city"],
        "region": location["region"],
        "country": location["country"],
    }
