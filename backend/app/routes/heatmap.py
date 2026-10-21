from fastapi import APIRouter, HTTPException

from app.services.supabase_db import get_all_fires

router = APIRouter()


@router.get("/heatmap")
async def get_heatmap_data():
    try:
        fires = await get_all_fires()
        points = []
        for f in fires:
            lat = f.get("latitude")
            lng = f.get("longitude")
            if lat and lng:
                intensity = f.get("fire_confidence") or 0.5
                # Boost intensity for active fires
                if f.get("status") == "DETECTED":
                    intensity = max(intensity, 0.7)
                points.append({
                    "lat": lat,
                    "lng": lng,
                    "intensity": round(intensity, 2),
                    "status": f.get("status"),
                })
        return {"points": points, "total": len(points)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
