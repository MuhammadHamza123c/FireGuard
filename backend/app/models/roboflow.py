import base64
import os
from typing import Any, Dict, List

import cv2
import httpx


ROBOFLOW_MODEL_ID = "fire-and-smoke-bkm84-k2p7v/1"
ROBOFLOW_API_URL = "https://serverless.roboflow.com"

_client: httpx.Client | None = None


def get_client() -> httpx.Client:
    global _client
    if _client is None:
        api_key = os.getenv("ROBOFLOW_API_KEY")
        if not api_key:
            raise RuntimeError("ROBOFLOW_API_KEY must be set to use fire detection")

        _client = httpx.Client(
            timeout=30.0,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )
    return _client


def infer_frame(frame) -> List[Dict[str, Any]]:
    success, encoded_frame = cv2.imencode(".jpg", frame)
    if not success:
        raise RuntimeError("Could not encode frame for Roboflow inference")

    image_base64 = base64.b64encode(encoded_frame.tobytes()).decode("ascii")
    result = get_client().post(
        f"{ROBOFLOW_API_URL}/{ROBOFLOW_MODEL_ID}",
        content=image_base64,
    )
    result.raise_for_status()
    result = result.json()
    predictions = result.get("predictions") if isinstance(result, dict) else None
    if not isinstance(predictions, list) or not all(
        isinstance(prediction, dict) for prediction in predictions
    ):
        raise RuntimeError("Roboflow returned an invalid inference response")
    return predictions
