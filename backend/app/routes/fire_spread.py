from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.fire_spread import predict_fire_spread

router = APIRouter(prefix="/fire-spread", tags=["Fire Spread"])


class FireSpreadRequest(BaseModel):
    latitude: float
    longitude: float
    wind_speed: float | None = None
    wind_direction: float | None = None
    humidity: float | None = None
    temperature: float | None = None
    terrain_type: str | None = "forest"
    fire_confidence: float | None = 0.0
    smoke_confidence: float | None = 0.0


@router.post("/predict")
async def predict_fire_spread_route(req: FireSpreadRequest):
    try:
        return predict_fire_spread(
            latitude=req.latitude,
            longitude=req.longitude,
            wind_speed=req.wind_speed,
            wind_direction=req.wind_direction,
            humidity=req.humidity,
            temperature=req.temperature,
            terrain_type=req.terrain_type,
            fire_confidence=req.fire_confidence,
            smoke_confidence=req.smoke_confidence,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
