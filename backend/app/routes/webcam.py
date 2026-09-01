import json
import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Optional

from app.services.detection import detect_frame, FireVerifier
from app.services.incident import store_incident
from app.services.location import resolve_location

router = APIRouter()


@router.websocket("/webcam")
async def webcam_stream(websocket: WebSocket):
    await websocket.accept()

    verifier = FireVerifier()
    frame_number = 0

    try:
        while True:
            data = await websocket.receive_bytes()

            nparr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is None:
                continue

            frame_number += 1
            detection, _ = detect_frame(frame)
            confirmed = verifier.update(detection, frame_number)

            response = {
                "fire_detected": detection.fire_detected,
                "smoke_detected": detection.smoke_detected,
                "fire_confidence": detection.fire_confidence,
                "smoke_confidence": detection.smoke_confidence,
                "status": detection.status,
                "incident_confirmed": confirmed,
                "incident_type": verifier.incident_type if confirmed else None,
                "frame": frame_number,
                "fire_verification": f"{verifier.fire_count}/5",
            }

            await websocket.send_text(json.dumps(response))

            if confirmed and not getattr(websocket, "_incident_sent", False):
                client_loc = await _try_receive_location(websocket)
                location = resolve_location(
                    latitude=client_loc.get("latitude") if client_loc else None,
                    longitude=client_loc.get("longitude") if client_loc else None,
                    city=client_loc.get("city") if client_loc else None,
                    region=client_loc.get("region") if client_loc else None,
                    country=client_loc.get("country") if client_loc else None,
                )
                store_incident(
                    incident_type=verifier.incident_type,
                    fire_confidence=verifier.best_fire_confidence,
                    smoke_confidence=verifier.best_smoke_confidence,
                    frame=verifier.incident_frame,
                    latitude=location["latitude"],
                    longitude=location["longitude"],
                    city=location["city"],
                    region=location["region"],
                    country=location["country"],
                )
                websocket._incident_sent = True

    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        verifier.reset()


async def _try_receive_location(websocket: WebSocket) -> Optional[dict]:
    try:
        msg = await websocket.receive_text()
        data = json.loads(msg)

        if "latitude" in data and "longitude" in data:
            return {
                "latitude": data.get("latitude"),
                "longitude": data.get("longitude"),
                "city": data.get("city"),
                "region": data.get("region"),
                "country": data.get("country"),
            }
    except Exception:
        pass

    return None
