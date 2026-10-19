import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

NEARBY_AMENITIES = {
    "hospital": "hospital",
    "fire_station": "fire_station",
    "police": "police",
    "pharmacy": "pharmacy",
}


class NearbyRequest(BaseModel):
    latitude: float
    longitude: float
    type: str  # hospital, fire_station, police, pharmacy


@router.post("/nearby_places")
async def get_nearby_places(req: NearbyRequest):
    if req.type not in NEARBY_AMENITIES:
        raise HTTPException(status_code=400, detail="Invalid type")

    delta = 0.08
    # Nominatim viewbox: left,top,right,bottom (lon,lat,lon,lat)
    viewbox = f"{req.longitude - delta},{req.latitude - delta},{req.longitude + delta},{req.latitude + delta}"

    params = {
        "format": "json",
        "amenity": NEARBY_AMENITIES[req.type],
        "bounded": "1",
        "viewbox": viewbox,
        "limit": "10",
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                NOMINATIM_URL,
                params=params,
                headers={"User-Agent": "FireGuard/1.0"},
            )
            if resp.status_code == 200:
                data = resp.json()
                elements = []
                for item in data:
                    name = item.get("display_name", "").split(",")[0].strip()
                    elements.append({
                        "id": item.get("place_id", 0),
                        "lat": float(item.get("lat", 0)),
                        "lon": float(item.get("lon", 0)),
                        "tags": {
                            "name": name,
                            "amenity": NEARBY_AMENITIES[req.type],
                        },
                    })
                return {"elements": elements}
    except Exception:
        pass

    return {"elements": []}
