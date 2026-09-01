import httpx
from typing import Optional


async def reverse_geocode(lat: float, lng: float) -> Optional[dict]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={
                    "lat": lat,
                    "lon": lng,
                    "format": "json",
                    "zoom": 10,
                },
                headers={"User-Agent": "FireGuard/1.0"},
            )

            if res.status_code != 200:
                return None

            data = res.json()
            addr = data.get("address", {})

            return {
                "city": addr.get("city") or addr.get("town") or addr.get("village") or addr.get("county") or "",
                "region": addr.get("state") or addr.get("region") or "",
                "country": addr.get("country") or "",
            }
    except Exception:
        return None


def get_ip_location() -> Optional[dict]:
    try:
        response = httpx.get("https://ipwho.is/", timeout=5)
        data = response.json()

        if not data.get("success"):
            return None

        return {
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "city": data.get("city"),
            "region": data.get("region"),
            "country": data.get("country"),
        }
    except Exception:
        return None


async def resolve_location(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    city: Optional[str] = None,
    region: Optional[str] = None,
    country: Optional[str] = None,
) -> dict:
    if city and region and country:
        return {
            "latitude": latitude,
            "longitude": longitude,
            "city": city,
            "region": region,
            "country": country,
        }

    if latitude and longitude:
        geo = await reverse_geocode(latitude, longitude)
        if geo:
            return {
                "latitude": latitude,
                "longitude": longitude,
                "city": city or geo["city"],
                "region": region or geo["region"],
                "country": country or geo["country"],
            }
        return {
            "latitude": latitude,
            "longitude": longitude,
            "city": city or "",
            "region": region or "",
            "country": country or "",
        }

    ip_loc = get_ip_location()
    if ip_loc:
        return ip_loc

    return {
        "latitude": None,
        "longitude": None,
        "city": "",
        "region": "",
        "country": "",
    }
