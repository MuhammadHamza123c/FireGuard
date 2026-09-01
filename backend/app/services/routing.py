import math
import httpx


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def find_nearest_fire(user_lat: float, user_lng: float, fires: list) -> dict | None:
    if not fires:
        return None

    nearest = None
    min_dist = float("inf")

    for fire in fires:
        f_lat = fire.get("latitude")
        f_lng = fire.get("longitude")
        if f_lat is None or f_lng is None:
            continue
        dist = haversine(user_lat, user_lng, f_lat, f_lng)
        if dist < min_dist:
            min_dist = dist
            nearest = {**fire, "distance_meters": round(dist)}

    return nearest


async def get_osrm_route(
    user_lat: float, user_lng: float, fire_lat: float, fire_lng: float
) -> dict | None:
    url = (
        f"https://router.project-osrm.org/route/v1/driving/"
        f"{user_lng},{user_lat};{fire_lng},{fire_lat}"
        f"?overview=full&geometries=geojson"
    )

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(url)
        data = res.json()

        if data.get("code") != "Ok" or not data.get("routes"):
            return None

        route = data["routes"][0]
        coords = route["geometry"]["coordinates"]

        return {
            "distance_km": round(route["distance"] / 1000, 1),
            "duration_min": round(route["duration"] / 60),
            "coordinates": coords,
        }
