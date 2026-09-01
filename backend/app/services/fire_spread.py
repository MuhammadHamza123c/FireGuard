import math

TERRAIN_MULTIPLIERS = {
    "forest": 22,
    "grassland": 16,
    "urban": 10,
    "mountain": 14,
    "wetland": 8,
    "dryland": 18,
}


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def _normalize_terrain(terrain_type: str | None) -> str:
    if not terrain_type:
        return "forest"
    value = terrain_type.strip().lower()
    return value if value in TERRAIN_MULTIPLIERS else "forest"


def _direction_label(degrees: float) -> str:
    directions = [
        "NORTH",
        "NORTH-NORTHEAST",
        "NORTHEAST",
        "EAST-NORTHEAST",
        "EAST",
        "EAST-SOUTHEAST",
        "SOUTHEAST",
        "SOUTH-SOUTHEAST",
        "SOUTH",
        "SOUTH-SOUTHWEST",
        "SOUTHWEST",
        "WEST-SOUTHWEST",
        "WEST",
        "WEST-NORTHWEST",
        "NORTHWEST",
        "NORTH-NORTHWEST",
    ]
    normalized = (degrees % 360 + 360) % 360
    index = round(normalized / 22.5) % len(directions)
    return directions[index]


def _spread_bearing(wind_direction: float | None, wind_speed: float | None) -> float:
    base = float(wind_direction) if wind_direction is not None else 270.0
    if wind_speed is not None:
        base += max(0.0, min(25.0, wind_speed * 0.4))
    return (base + 180.0) % 360.0


def _offset_coordinates(latitude: float, longitude: float, distance_km: float, bearing_deg: float):
    earth_radius_km = 6371.0
    lat_rad = math.radians(latitude)
    lon_rad = math.radians(longitude)
    angular_distance = distance_km / earth_radius_km
    bearing = math.radians(bearing_deg)

    new_lat = math.asin(
        math.sin(lat_rad) * math.cos(angular_distance)
        + math.cos(lat_rad) * math.sin(angular_distance) * math.cos(bearing)
    )
    new_lon = lon_rad + math.atan2(
        math.sin(bearing) * math.sin(angular_distance) * math.cos(lat_rad),
        math.cos(angular_distance) - math.sin(lat_rad) * math.sin(new_lat),
    )

    return math.degrees(new_lat), math.degrees(new_lon)


def _risk_level(score: float) -> str:
    if score >= 80:
        return "critical"
    if score >= 60:
        return "high"
    if score >= 35:
        return "moderate"
    return "low"


def predict_fire_spread(
    latitude: float,
    longitude: float,
    wind_speed: float | None = None,
    wind_direction: float | None = None,
    humidity: float | None = None,
    temperature: float | None = None,
    terrain_type: str | None = "forest",
    fire_confidence: float | None = 0.0,
    smoke_confidence: float | None = 0.0,
):
    normalized_terrain = _normalize_terrain(terrain_type)
    speed = float(wind_speed) if wind_speed is not None else 12.0
    humidity_value = float(humidity) if humidity is not None else 35.0
    temperature_value = float(temperature) if temperature is not None else 32.0
    fire_conf = float(fire_confidence) if fire_confidence is not None else 0.7
    smoke_conf = float(smoke_confidence) if smoke_confidence is not None else 0.5

    spread_bearing = _spread_bearing(wind_direction, speed)
    spread_label = _direction_label(spread_bearing)

    dryness_score = _clamp((100.0 - humidity_value) * 0.7, 0.0, 50.0)
    temperature_score = _clamp((temperature_value - 20.0) * 2.2, 0.0, 35.0)
    wind_score = _clamp(speed * 1.6, 0.0, 40.0)
    fire_score = _clamp(fire_conf * 55.0, 0.0, 45.0)
    smoke_score = _clamp(smoke_conf * 30.0, 0.0, 20.0)
    terrain_score = TERRAIN_MULTIPLIERS.get(normalized_terrain, 18)

    risk_score = _clamp(
        dryness_score + temperature_score + wind_score + fire_score + smoke_score + terrain_score,
        0.0,
        100.0,
    )

    next_hotspots = []
    hotspot_distances = [0.8, 1.6, 2.8]
    hotspot_severity = ["high", "medium", "watch"]

    for distance_km, level in zip(hotspot_distances, hotspot_severity):
        hotspot_lat, hotspot_lon = _offset_coordinates(latitude, longitude, distance_km, spread_bearing)
        hotspot_risk = _clamp(risk_score * (0.9 - (distance_km * 0.08)), 20.0, 99.0)
        next_hotspots.append(
            {
                "latitude": round(hotspot_lat, 6),
                "longitude": round(hotspot_lon, 6),
                "distance_km": round(distance_km, 1),
                "direction": spread_label,
                "risk_score": round(hotspot_risk, 1),
                "severity": level,
            }
        )

    vulnerable_zones = [
        {
            "zone": "Forest edge",
            "direction": spread_label,
            "distance_km": 1.2,
            "risk": "high",
            "reason": "Dry vegetation and wind support fast flame movement.",
        },
        {
            "zone": "Residential cluster",
            "direction": spread_label,
            "distance_km": 2.2,
            "risk": "moderate",
            "reason": "Structures and fuel storage increase exposure to embers.",
        },
        {
            "zone": "Road corridor",
            "direction": spread_label,
            "distance_km": 3.4,
            "risk": "watch",
            "reason": "Access routes may become blocked if the fire intensifies.",
        },
    ]

    predicted_zone = "firefront"
    if normalized_terrain in {"urban", "dryland"}:
        predicted_zone = "urban edge"
    elif normalized_terrain == "forest":
        predicted_zone = "forest corridor"

    return {
        "risk_score": round(risk_score, 1),
        "risk_level": _risk_level(risk_score),
        "spread_direction": {
            "label": spread_label,
            "bearing_degrees": round(spread_bearing, 1),
            "wind_direction": round(float(wind_direction) % 360, 1) if wind_direction is not None else None,
        },
        "predicted_zone": predicted_zone,
        "next_hotspots": next_hotspots,
        "vulnerable_zones": vulnerable_zones,
    }
