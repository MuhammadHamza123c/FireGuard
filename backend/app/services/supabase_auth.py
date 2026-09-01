import httpx
from app.config import SUPABASE_URL, SUPABASE_ANON_KEY

HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
}


async def signup(email: str, password: str, full_name: str = None) -> dict:
    async with httpx.AsyncClient() as client:
        payload = {"email": email, "password": password}
        if full_name:
            payload["data"] = {"full_name": full_name}

        res = await client.post(
            f"{SUPABASE_URL}/auth/v1/signup",
            json=payload,
            headers=HEADERS,
        )

        data = res.json()

        if res.status_code not in (200, 201):
            error_msg = data.get("msg", data.get("error_description", data.get("message", str(data))))
            raise Exception(error_msg)

        if "access_token" not in data:
            error_msg = data.get("msg", data.get("error_description", data.get("message", "No access token returned. Check if email confirmation is disabled in Supabase.")))
            raise Exception(error_msg)

        return data


async def login(email: str, password: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            json={"email": email, "password": password},
            headers=HEADERS,
        )

        data = res.json()

        if res.status_code != 200:
            error_msg = data.get("error_description", data.get("msg", "Invalid credentials"))
            raise Exception(error_msg)

        return data


async def refresh_token(refresh_tok: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token",
            json={"refresh_token": refresh_tok},
            headers=HEADERS,
        )

        data = res.json()

        if res.status_code != 200:
            error_msg = data.get("error_description", data.get("msg", "Refresh failed"))
            raise Exception(error_msg)

        return data


async def get_user(token: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                **HEADERS,
                "Authorization": f"Bearer {token}",
            },
        )

        data = res.json()

        if res.status_code != 200:
            raise Exception("Invalid or expired token")

        return data
