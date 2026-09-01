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


async def update_incident(incident_id: str, data: dict) -> dict | None:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.patch(
            f"{SUPABASE_URL}/rest/v1/fire_detections"
            f"?id=eq.{incident_id}",
            json=data,
            headers=DB_HEADERS,
        )

        if res.status_code != 200:
            raise Exception(f"DB update failed: {res.text}")

        records = res.json()
        return records[0] if records else None


async def delete_incident(incident_id: str) -> bool:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.delete(
            f"{SUPABASE_URL}/rest/v1/fire_detections"
            f"?id=eq.{incident_id}",
            headers=DB_HEADERS,
        )

        if res.status_code != 200:
            raise Exception(f"DB delete failed: {res.text}")

        return True


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
    level = calculate_level(points)

    profile_data = {
        "user_id": user_id,
        "total_reports": total_reports,
        "verified_reports": verified,
        "false_reports": false_reports,
        "points": points,
        "level": level,
    }

    return await upsert_user_profile(profile_data)


# ─── Push Tokens ────────────────────────────────────────────────


async def get_all_push_tokens() -> list:
    async with httpx.AsyncClient(timeout=30.0) as client:
        res = await client.get(
            f"{SUPABASE_URL}/rest/v1/push_tokens"
            "?select=fcm_token",
            headers=DB_HEADERS,
        )
        if res.status_code != 200:
            return []
        records = res.json()
        return [r["fcm_token"] for r in records if r.get("fcm_token")]


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


async def save_push_token(user_id: str, fcm_token: str) -> dict:
    async with httpx.AsyncClient(timeout=30.0) as client:
        existing = await client.get(
            f"{SUPABASE_URL}/rest/v1/push_tokens"
            f"?user_id=eq.{user_id}&fcm_token=eq.{fcm_token}&select=id",
            headers=DB_HEADERS,
        )
        if existing.status_code == 200 and existing.json():
            return {"id": existing.json()[0]["id"]}

        res = await client.post(
            f"{SUPABASE_URL}/rest/v1/push_tokens",
            json={"user_id": user_id, "fcm_token": fcm_token},
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
