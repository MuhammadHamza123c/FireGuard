from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send

from app.routes import image, video, auth, alert, route, incidents, profile, live_alerts, weather, fire_spread, notifications, nearby, heatmap
from app.models.roboflow import get_client


class StripApiPrefixMiddleware:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(
        self, scope: Scope, receive: Receive, send: Send
    ) -> None:
        if scope["type"] in ("http", "websocket"):
            path = scope["path"]
            if path == "/api" or path.startswith("/api/"):
                scope = dict(scope)
                scope["path"] = path[4:] or "/"
                raw_path = scope.get("raw_path", b"")
                if raw_path == b"/api":
                    scope["raw_path"] = b"/"
                elif raw_path.startswith(b"/api/"):
                    scope["raw_path"] = raw_path[4:]
        await self.app(scope, receive, send)


app = FastAPI(
    title="Fire & Smoke Detection API",
    description="Roboflow-based Fire and Smoke Detection System",
    version="3.0.0",
)

app.add_middleware(StripApiPrefixMiddleware)

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
app.include_router(nearby.router)
app.include_router(heatmap.router)


@app.on_event("startup")
def initialize_roboflow():
    get_client()
    print("Roboflow API client ready")


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
