import httpx
from app.config import SUPABASE_URL, SUPABASE_ANON_KEY

DB_HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


def generate_message(incident_type: str, city: str = None, region: str = None) -> str:
    location = f"{city}, {region}" if city and region else city or region or "unknown location"

    if incident_type == "FIRE + SMOKE":
        return f"Fire and smoke detected at {location}. Immediate evacuation required. Call emergency services."
    elif incident_type == "FIRE DETECTED":
        return f"Fire detected at {location}. Please evacuate immediately and call emergency services."
    elif incident_type == "SMOKE WARNING":
        return f"Smoke detected at {location}. Check for fire sources and evacuate if necessary."
    return f"Potential hazard detected at {location}. Please investigate immediately."


async def get_all_fires() -> list:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/fire_detections"
            "?select=*&latitude=not.is.null&longitude=not.is.null"
            "&status=neq.RESOLVED"
            "&order=created_at.desc",
            headers=DB_HEADERS,
        )

        if res.status_code != 200:
            raise Exception(f"DB fetch failed: {res.text}")

        return res.json()


async def insert_detection(data: dict) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.post(
            f"{SUPABASE_URL}/rest/v1/fire_detections",
            json=data,
            headers=DB_HEADERS,
        )

        if res.status_code not in (200, 201):
            raise Exception(f"DB insert failed: {res.text}")

        records = res.json()
        return records[0] if records else data


async def get_user_incidents(user_id: str) -> list:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/fire_detections"
            f"?user_id=eq.{user_id}"
            f"&order=created_at.desc",
            headers=DB_HEADERS,
        )

        if res.status_code != 200:
            raise Exception(f"DB fetch failed: {res.text}")

        return res.json()


async def get_incident_by_id(incident_id: str) -> dict | None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/fire_detections"
            f"?id=eq.{incident_id}&select=*",
            headers=DB_HEADERS,
        )

        if res.status_code != 200:
            raise Exception(f"DB fetch failed: {res.text}")

        records = res.json()
        return records[0] if records else None


async def update_incident(incident_id: str, user_id: str, data: dict) -> dict | None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        # First verify the incident exists and belongs to user
        check = await client.get(
            f"{SUPABASE_URL}/rest/v1/fire_detections"
            f"?id=eq.{incident_id}&user_id=eq.{user_id}&select=id",
            headers=DB_HEADERS,
        )
        if check.status_code != 200 or not check.json():
            return None  # Incident doesn't exist or doesn't belong to user

        res = await client.patch(
            f"{SUPABASE_URL}/rest/v1/fire_detections"
            f"?id=eq.{incident_id}&user_id=eq.{user_id}",
            json=data,
            headers=DB_HEADERS,
        )

        if res.status_code not in (200, 204):
            raise Exception(f"DB update failed: {res.text}")

        if res.status_code == 204 or not res.text:
            # Re-fetch to get updated record
            verify = await client.get(
                f"{SUPABASE_URL}/rest/v1/fire_detections"
                f"?id=eq.{incident_id}&select=*",
                headers=DB_HEADERS,
            )
            if verify.status_code == 200 and verify.json():
                return verify.json()[0]
            return None

        records = res.json()
        return records[0] if records else None


async def delete_incident(incident_id: str, user_id: str) -> bool:
    async with httpx.AsyncClient(timeout=30.0) as client:
        # First verify the incident exists and belongs to user
        check = await client.get(
            f"{SUPABASE_URL}/rest/v1/fire_detections"
            f"?id=eq.{incident_id}&user_id=eq.{user_id}&select=id",
            headers=DB_HEADERS,
        )
        if check.status_code != 200 or not check.json():
            return False  # Incident doesn't exist or doesn't belong to user

        # Delete the incident
        res = await client.delete(
            f"{SUPABASE_URL}/rest/v1/fire_detections"
            f"?id=eq.{incident_id}&user_id=eq.{user_id}",
            headers=DB_HEADERS,
        )

        if res.status_code not in (200, 204):
            raise Exception(f"DB delete failed: {res.text}")

        # Verify deletion
        verify = await client.get(
            f"{SUPABASE_URL}/rest/v1/fire_detections"
            f"?id=eq.{incident_id}&select=id",
            headers=DB_HEADERS,
        )
        if verify.status_code == 200:
            return not bool(verify.json())  # True if deleted (empty result)
        return True  # Assume deleted if can't verify


# ─── User Profiles ───────────────────────────────────────────────


LEVEL_THRESHOLDS = [
    ("Platinum", 300),
    ("Gold", 150),
    ("Silver", 50),
    ("Bronze", 0),
]


def calculate_level(points: int) -> str:
    for level, threshold in LEVEL_THRESHOLDS:
        if points >= threshold:
            return level
    return "Bronze"


async def get_user_profile(user_id: str) -> dict | None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/user_profiles"
            f"?user_id=eq.{user_id}&select=*",
            headers=DB_HEADERS,
        )
        if res.status_code != 200:
            return None
        records = res.json()
        return records[0] if records else None


async def upsert_user_profile(data: dict) -> dict:
    existing = await get_user_profile(data["user_id"])

    async with httpx.AsyncClient(timeout=30.0) as client:
        if existing:
            res = await client.patch(
                f"{SUPABASE_URL}/rest/v1/user_profiles"
                f"?user_id=eq.{data['user_id']}",
                json=data,
                headers=DB_HEADERS,
            )
        else:
            res = await client.post(
                f"{SUPABASE_URL}/rest/v1/user_profiles",
                json=data,
                headers=DB_HEADERS,
            )

        if res.status_code not in (200, 201):
            raise Exception(f"Profile upsert failed: {res.text}")
        records = res.json()
        return records[0] if records else data


async def recalculate_points(user_id: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/fire_detections"
            f"?user_id=eq.{user_id}&select=id,incident_type,fire_confidence,smoke_confidence,status,created_at",
            headers=DB_HEADERS,
        )
        if res.status_code != 200:
            raise Exception(f"DB fetch failed: {res.text}")

        incidents = res.json()

    total_reports = len(incidents)
    verified = sum(1 for i in incidents if i["status"] in ("IN_PROGRESS", "RESOLVED"))
    false_reports = sum(1 for i in incidents if i["status"] == "DETECTED")
    points = 0

    for inc in incidents:
        fire_c = inc.get("fire_confidence") or 0
        smoke_c = inc.get("smoke_confidence") or 0

        points += 10

        if fire_c > 0.7 or smoke_c > 0.7:
            points += 5

        if inc["status"] == "IN_PROGRESS":
            points += 15
        elif inc["status"] == "RESOLVED":
            points += 25

        if inc["status"] == "DETECTED":
            points -= 20

    points = max(0, points)

    # Preserve existing points (append-only: never decrease)
    existing = await get_user_profile(user_id)
    existing_points = (existing.get("points") or 0) if existing else 0
    # Only use calculated points if profile doesn't exist yet
    if not existing:
        final_points = points
    else:
        final_points = existing_points  # Keep existing, don't overwrite

    level = calculate_level(final_points)

    profile_data = {
        "user_id": user_id,
        "total_reports": total_reports,
        "verified_reports": verified,
        "false_reports": false_reports,
        "points": final_points,
        "level": level,
    }

    return await upsert_user_profile(profile_data)


async def add_points(user_id: str, amount: int) -> dict:
    """Add points to user profile (append-only, never decreases)."""
    existing = await get_user_profile(user_id)
    if not existing:
        # Create profile with initial points
        profile_data = {
            "user_id": user_id,
            "total_reports": 0,
            "verified_reports": 0,
            "false_reports": 0,
            "points": max(0, amount),
            "level": calculate_level(max(0, amount)),
        }
        return await upsert_user_profile(profile_data)

    new_points = (existing.get("points") or 0) + amount
    new_points = max(0, new_points)
    profile_data = {
        "user_id": user_id,
        "total_reports": existing.get("total_reports", 0),
        "verified_reports": existing.get("verified_reports", 0),
        "false_reports": existing.get("false_reports", 0),
        "points": new_points,
        "level": calculate_level(new_points),
    }
    return await upsert_user_profile(profile_data)


# ─── Push Tokens ────────────────────────────────────────────────


async def get_all_push_tokens() -> list:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/push_tokens"
            "?select=fcm_token,latitude,longitude",
            headers=DB_HEADERS,
        )
        if res.status_code != 200:
            return []
        records = res.json()
        return [
            {
                "fcm_token": r["fcm_token"],
                "latitude": r.get("latitude"),
                "longitude": r.get("longitude"),
            }
            for r in records
            if r.get("fcm_token")
        ]


async def get_user_push_tokens(user_id: str) -> list:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/push_tokens"
            f"?user_id=eq.{user_id}&select=fcm_token",
            headers=DB_HEADERS,
        )
        if res.status_code != 200:
            return []
        records = res.json()
        return [r["fcm_token"] for r in records if r.get("fcm_token")]


async def save_push_token(user_id: str, fcm_token: str, latitude: float = None, longitude: float = None) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        existing = await client.get(
            f"{SUPABASE_URL}/rest/v1/push_tokens"
            f"?user_id=eq.{user_id}&fcm_token=eq.{fcm_token}&select=id",
            headers=DB_HEADERS,
        )
        if existing.status_code == 200 and existing.json():
            # Update location if provided
            if latitude is not None and longitude is not None:
                await client.patch(
                    f"{SUPABASE_URL}/rest/v1/push_tokens"
                    f"?user_id=eq.{user_id}&fcm_token=eq.{fcm_token}",
                    json={"latitude": latitude, "longitude": longitude},
                    headers=DB_HEADERS,
                )
            return {"id": existing.json()[0]["id"]}

        payload = {"user_id": user_id, "fcm_token": fcm_token}
        if latitude is not None and longitude is not None:
            payload["latitude"] = latitude
            payload["longitude"] = longitude

        res = await client.post(
            f"{SUPABASE_URL}/rest/v1/push_tokens",
            json=payload,
            headers=DB_HEADERS,
        )
        if res.status_code not in (200, 201):
            raise Exception(f"Failed to save push token: {res.text}")
        records = res.json()
        return records[0] if records else {"user_id": user_id}


async def delete_push_token(user_id: str, fcm_token: str) -> bool:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.delete(
            f"{SUPABASE_URL}/rest/v1/push_tokens"
            f"?user_id=eq.{user_id}&fcm_token=eq.{fcm_token}",
            headers=DB_HEADERS,
        )
        return res.status_code == 200


async def delete_token_by_value(fcm_token: str) -> bool:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.delete(
            f"{SUPABASE_URL}/rest/v1/push_tokens"
            f"?fcm_token=eq.{fcm_token}",
            headers=DB_HEADERS,
        )
        return res.status_code == 200
