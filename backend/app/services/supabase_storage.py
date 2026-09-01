import uuid
import httpx
from app.config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_STORAGE_BUCKET

AUDIO_BUCKET = "fire-audio"

STORAGE_HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
}


async def upload_file(file_bytes: bytes, file_name: str, content_type: str) -> str:
    ext = file_name.rsplit(".", 1)[-1] if "." in file_name else "bin"
    unique_name = f"{uuid.uuid4().hex}.{ext}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.put(
            f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_STORAGE_BUCKET}/{unique_name}",
            content=file_bytes,
            headers={
                **STORAGE_HEADERS,
                "Content-Type": content_type,
            },
        )

        if res.status_code not in (200, 201):
            raise Exception(f"Storage upload failed: {res.text}")

    return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_STORAGE_BUCKET}/{unique_name}"


async def upload_audio_file(file_bytes: bytes, file_name: str) -> str:
    ext = file_name.rsplit(".", 1)[-1] if "." in file_name else "webm"
    unique_name = f"{uuid.uuid4().hex}.{ext}"

    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.put(
            f"{SUPABASE_URL}/storage/v1/object/{AUDIO_BUCKET}/{unique_name}",
            content=file_bytes,
            headers={
                **STORAGE_HEADERS,
                "Content-Type": "audio/webm",
            },
        )

        if res.status_code not in (200, 201):
            raise Exception(f"Audio storage upload failed: {res.text}")

    return f"{SUPABASE_URL}/storage/v1/object/public/{AUDIO_BUCKET}/{unique_name}"
