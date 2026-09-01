import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

OPEN_METEO = "https://api.open-meteo.com/v1/forecast"

WMO_CODES = {
    0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
    55: "Dense drizzle", 56: "Freezing drizzle", 57: "Dense freezing drizzle",
    61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
    66: "Freezing rain", 67: "Heavy freezing rain",
    71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow",
    77: "Snow grains", 80: "Slight showers", 81: "Moderate showers",
    82: "Violent showers", 85: "Slight snow showers", 86: "Heavy snow showers",
    95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with heavy hail",
}


class WeatherRequest(BaseModel):
    latitude: float
    longitude: float


@router.post("/weather")
async def get_weather(req: WeatherRequest):
    try:
        params = {
            "latitude": req.latitude,
            "longitude": req.longitude,
            "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code",
            "timezone": "auto",
        }
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(OPEN_METEO, params=params)
            resp.raise_for_status()
            data = resp.json()

        current = data.get("current", {})
        code = current.get("weather_code", 0)

        return {
            "temperature": current.get("temperature_2m"),
            "humidity": current.get("relative_humidity_2m"),
            "wind_speed": current.get("wind_speed_10m"),
            "wind_direction": current.get("wind_direction_10m"),
            "weather_code": code,
            "weather_desc": WMO_CODES.get(code, "Unknown"),
            "unit": {
                "temperature": data.get("current_units", {}).get("temperature_2m", "°C"),
                "humidity": "%",
                "wind_speed": data.get("current_units", {}).get("wind_speed_10m", "km/h"),
            },
        }
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail="Weather service unavailable")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
