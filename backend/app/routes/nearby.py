import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]

NEARBY_AMENITIES = {
    "hospital": 'amenity="hospital"',
    "fire_station": 'amenity="fire_station"',
    "police": 'amenity="police"',
    "pharmacy": 'amenity="pharmacy"',
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
    bbox = f"{req.latitude - delta},{req.longitude - delta},{req.latitude + delta},{req.longitude + delta}"
    amenity_filter = NEARBY_AMENITIES[req.type]
    query = f'[out:json][timeout:15];(node[{amenity_filter}]({bbox});way[{amenity_filter}]({bbox}););out center 10;'

    for endpoint in OVERPASS_ENDPOINTS:
        try:
            async with httpx.AsyncClient(timeout=12) as client:
                resp = await client.post(
                    endpoint,
                    content=f"data={query}",
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("elements"):
                        return data
        except Exception:
            continue

    return {"elements": []}
