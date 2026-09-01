import uuid
import cv2
from fastapi import APIRouter, Depends, File, UploadFile, Form
from typing import Optional

from app.config import OUTPUT_DIR, FRAME_SKIP
from app.core.deps import get_current_user
from app.services.detection import detect_frame, FireVerifier
from app.services.location import resolve_location
from app.services.supabase_storage import upload_file

router = APIRouter()


@router.post("/video_processing")
async def video_processing(
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    city: Optional[str] = Form(None),
    region: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    user: dict = Depends(get_current_user),
):
    file_id = str(uuid.uuid4())
    input_path = OUTPUT_DIR / f"{file_id}_{file.filename}"

    content = await file.read()
    with open(input_path, "wb") as buffer:
        buffer.write(content)

    file_url = None
    try:
        file_url = await upload_file(content, file.filename, file.content_type)
    except Exception:
        pass

    cap = cv2.VideoCapture(str(input_path))

    if not cap.isOpened():
        return {"error": "Could not open video"}

    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    output_path = OUTPUT_DIR / f"{file_id}_result.mp4"
    out = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

    verifier = FireVerifier()
    frame_number = 0
    last_detection = None
    last_results = None

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

        annotated_frame = results[0].plot()

        color = (
            (0, 0, 255) if detection.fire_detected
            else (0, 255, 255) if detection.smoke_detected
            else (0, 255, 0)
        )

        cv2.putText(annotated_frame, detection.status, (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)
        cv2.putText(annotated_frame, f"Fire verification: {verifier.fire_count}/5", (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        if confirmed:
            cv2.putText(annotated_frame, "INCIDENT CONFIRMED!", (20, 125),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)

        out.write(annotated_frame)

    cap.release()
    out.release()

    location = await resolve_location(latitude, longitude, city, region, country)

    return {
        "success": True,
        "frames_processed": frame_number,
        "incident_confirmed": verifier.incident_confirmed,
        "incident_type": verifier.incident_type,
        "incident_frame": verifier.incident_frame,
        "fire_confidence": verifier.best_fire_confidence,
        "smoke_confidence": verifier.best_smoke_confidence,
        "output_video": str(output_path) if verifier.incident_confirmed else None,
        "file_url": file_url,
        "latitude": location["latitude"],
        "longitude": location["longitude"],
        "city": location["city"],
        "region": location["region"],
        "country": location["country"],
    }
