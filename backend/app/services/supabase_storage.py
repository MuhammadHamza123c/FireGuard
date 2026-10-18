import uuid
from pathlib import Path
from urllib.parse import quote, urlsplit, urlunsplit

import httpx
from app.config import SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_STORAGE_BUCKET

AUDIO_BUCKET = "fire-audio"

STORAGE_HEADERS = {
    "apikey": SUPABASE_ANON_KEY,
    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
}


def create_video_upload_target(user_id: str, file_name: str) -> dict:
    suffix = Path(file_name).suffix.lower()
    if not suffix or len(suffix) > 12 or not suffix[1:].isalnum():
        suffix = ".mp4"

    path = f"{user_id}/{uuid.uuid4().hex}{suffix}"
    parsed_url = urlsplit(SUPABASE_URL)
    hostname = parsed_url.hostname
    if hostname and hostname.endswith(".supabase.co"):
        storage_hostname = hostname.removesuffix(".supabase.co") + ".storage.supabase.co"
        netloc = storage_hostname
        if parsed_url.port:
            netloc = f"{netloc}:{parsed_url.port}"
        parsed_url = parsed_url._replace(netloc=netloc)

    return {
        "endpoint": urlunsplit(
            parsed_url._replace(path="/storage/v1/upload/resumable", query="", fragment="")
        ),
        "bucket": SUPABASE_STORAGE_BUCKET,
        "object_path": path,
        "apikey": SUPABASE_ANON_KEY,
    }


def get_public_file_url(path: str) -> str:
    bucket = quote(SUPABASE_STORAGE_BUCKET, safe="")
    object_path = quote(path, safe="/")
    return f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{object_path}"


def _user_storage_headers(access_token: str) -> dict:
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {access_token}",
    }


async def download_storage_file(
    path: str, destination: Path, access_token: str
) -> None:
    bucket = quote(SUPABASE_STORAGE_BUCKET, safe="")
    object_path = quote(path, safe="/")
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{object_path}"

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "GET", url, headers=_user_storage_headers(access_token)
        ) as response:
            response.raise_for_status()
            with destination.open("wb") as output:
                async for chunk in response.aiter_bytes():
                    output.write(chunk)


async def upload_storage_file(
    path: str, source: Path, access_token: str, content_type: str
) -> None:
    bucket = quote(SUPABASE_STORAGE_BUCKET, safe="")
    object_path = quote(path, safe="/")
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{object_path}"

    async def file_chunks():
        with source.open("rb") as input_file:
            while chunk := input_file.read(1024 * 1024):
                yield chunk

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            url,
            content=file_chunks(),
            headers={
                **_user_storage_headers(access_token),
                "Content-Type": content_type,
                "x-upsert": "false",
            },
        )
        response.raise_for_status()


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
