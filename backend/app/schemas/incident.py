from pydantic import BaseModel
from typing import Optional


class DetectionResult(BaseModel):
    fire_detected: bool
    smoke_detected: bool
    fire_confidence: float
    smoke_confidence: float
    status: str
