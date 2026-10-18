import os
from typing import Dict, List

from inference_sdk import InferenceConfiguration, InferenceHTTPClient


ROBOFLOW_MODEL_ID = "fire-and-smoke-bkm84-k2p7v/1"
ROBOFLOW_API_URL = "https://serverless.roboflow.com"

_client = None


def get_client() -> InferenceHTTPClient:
    global _client
    if _client is None:
        api_key = os.getenv("ROBOFLOW_API_KEY")
        if not api_key:
            raise RuntimeError("ROBOFLOW_API_KEY must be set to use fire detection")

        _client = InferenceHTTPClient(
            api_url=ROBOFLOW_API_URL,
            api_key=api_key,
        ).configure(
            InferenceConfiguration(api_key_transport="header")
        )
    return _client


def infer_frame(frame) -> List[Dict]:
    result = get_client().infer(frame, model_id=ROBOFLOW_MODEL_ID)
    if not isinstance(result, dict) or "predictions" not in result:
        raise RuntimeError("Roboflow returned an invalid inference response")
    return result["predictions"]
