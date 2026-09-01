from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import image, video, auth, alert, route, incidents, profile, live_alerts, weather, fire_spread, notifications
from app.models.yolo import get_model
from app.config import download_model

app = FastAPI(
    title="Fire & Smoke Detection API",
    description="YOLO-based Fire and Smoke Detection System",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(image.router)
app.include_router(video.router)
app.include_router(alert.router)
app.include_router(route.router)
app.include_router(incidents.router)
app.include_router(profile.router)
app.include_router(live_alerts.router)
app.include_router(weather.router)
app.include_router(fire_spread.router)
app.include_router(notifications.router)


@app.on_event("startup")
async def load_model():
    await download_model()
    get_model()
    print("Model loaded successfully")


@app.get("/")
def root():
    return {
        "message": "Fire & Smoke Detection API is running",
        "version": "3.0.0",
        "endpoints": {
            "signup": "POST /auth/signup",
            "login": "POST /auth/login",
            "image": "POST /image_processing",
            "video": "POST /video_processing",
            "fire_alert": "POST /fire_alert",
            "nearest_fire": "POST /nearest_fire",
            "fire_spread_predict": "POST /fire-spread/predict",
            "incidents_list": "GET /incidents",
            "incidents_detail": "GET /incidents/{id}",
            "incidents_update": "PUT /incidents/{id}",
            "incidents_delete": "DELETE /incidents/{id}",
            "docs": "/docs",
        },
    }
