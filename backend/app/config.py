from pathlib import Path
import os
import tempfile
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(tempfile.gettempdir()) / "fireguard" if os.getenv("VERCEL") else BASE_DIR

CONFIDENCE_THRESHOLD = 0.40

VERIFY_FRAMES = 5

FRAME_SKIP = 3

UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_DIR = DATA_DIR / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://vvbthoewffpbytgdcbzs.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2YnRob2V3ZmZwYnl0Z2RjYnpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4Nzc4OTAsImV4cCI6MjEwMzQ1Mzg5MH0.OHOu5uh9XNQp2aj79J6seYcJzFsEGFgusQpD8dkHVF0")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "fire-media")
