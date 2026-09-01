from pathlib import Path
import os
import httpx

BASE_DIR = Path(__file__).resolve().parent.parent

FIRE_MODEL_URL = os.getenv("FIRE_MODEL_URL", "")

if FIRE_MODEL_URL:
    MODEL_PATH = Path("/tmp/best.pt")
else:
    MODEL_PATH = BASE_DIR / "best.pt"

CONFIDENCE_THRESHOLD = 0.40

VERIFY_FRAMES = 5

FRAME_SKIP = 3

UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

OUTPUT_DIR = BASE_DIR / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://vvbthoewffpbytgdcbzs.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2YnRob2V3ZmZwYnl0Z2RjYnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4Nzc4OTAsImV4cCI6MjEwMzQ1Mzg5MH0.OHOu5uh9XNQp2aj79J6seYcJzFsEGFgusQpD8dkHVF0")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "fire-media")


async def download_model():
    if FIRE_MODEL_URL and not MODEL_PATH.exists():
        print(f"Downloading model from {FIRE_MODEL_URL}...")
        async with httpx.AsyncClient(timeout=120) as client:
            r = await client.get(FIRE_MODEL_URL)
            r.raise_for_status()
            MODEL_PATH.write_bytes(r.content)
        print(f"Model saved to {MODEL_PATH}")
    elif not FIRE_MODEL_URL and not MODEL_PATH.exists():
        print("WARNING: No FIRE_MODEL_URL set and best.pt not found locally")
