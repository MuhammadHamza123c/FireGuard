from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.supabase_db import get_all_fires
from app.services.routing import find_nearest_fire, get_osrm_route, haversine

router = APIRouter()


class NearestFireRequest(BaseModel):
    latitude: float
    longitude: float


@router.post("/nearest_fire")
async def nearest_fire(req: NearestFireRequest):
    try:
        fires = await get_all_fires()

        if not fires:
            return {
                "success": True,
                "message": "No fire incidents found in the database",
                "nearest_fire": None,
                "nearby_fires": [],
                "route": None,
            }

        fire = find_nearest_fire(req.latitude, req.longitude, fires)

        if not fire:
            return {
                "success": True,
                "message": "No fire with valid coordinates found",
                "nearest_fire": None,
                "nearby_fires": [],
                "route": None,
            }

        route = await get_osrm_route(
            req.latitude, req.longitude, fire["latitude"], fire["longitude"]
        )

        nearby_fires = []
        for f in fires:
            if f.get("latitude") and f.get("longitude"):
                dist = haversine(req.latitude, req.longitude, f["latitude"], f["longitude"])
                if dist <= 10000:
                    nearby_fires.append({
                        "id": f.get("id"),
                        "incident_type": f.get("incident_type"),
                        "fire_confidence": f.get("fire_confidence"),
                        "smoke_confidence": f.get("smoke_confidence"),
                        "status": f.get("status"),
                        "latitude": f.get("latitude"),
                        "longitude": f.get("longitude"),
                        "city": f.get("city"),
                        "region": f.get("region"),
                        "message": f.get("message"),
                        "file_url": f.get("file_url"),
                        "audio_url": f.get("audio_url"),
                        "user_name": f.get("user_name"),
                        "distance_meters": round(dist),
                    })

        nearby_fires.sort(key=lambda x: x["distance_meters"])

        return {
            "success": True,
            "nearest_fire": {
                "id": fire.get("id"),
                "incident_type": fire.get("incident_type"),
                "fire_confidence": fire.get("fire_confidence"),
                "smoke_confidence": fire.get("smoke_confidence"),
                "status": fire.get("status"),
                "latitude": fire.get("latitude"),
                "longitude": fire.get("longitude"),
                "city": fire.get("city"),
                "region": fire.get("region"),
                "country": fire.get("country"),
                "message": fire.get("message"),
                "source": fire.get("source"),
                "file_url": fire.get("file_url"),
                "audio_url": fire.get("audio_url"),
                "user_name": fire.get("user_name"),
                "created_at": fire.get("created_at"),
                "distance_meters": fire.get("distance_meters"),
            },
            "nearby_fires": nearby_fires,
            "route": route,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
