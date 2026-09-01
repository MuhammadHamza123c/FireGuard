import logging
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, messaging

logger = logging.getLogger(__name__)

_cred = None
_initialized = False


def _get_cred():
    global _cred, _initialized
    if _initialized:
        return _cred

    key_path = Path(__file__).resolve().parent.parent.parent / "firebase-adminsdk.json"

    if key_path.exists():
        try:
            _cred = credentials.Certificate(str(key_path))
            firebase_admin.initialize_app(_cred)
            _initialized = True
            logger.info("Firebase Admin initialized with service account key")
        except Exception as e:
            logger.warning(f"Failed to init Firebase Admin: {e}")
            _initialized = True
    else:
        logger.warning(f"Firebase service account key not found at {key_path}")
        _initialized = True

    return _cred


def send_push_notification(token: str, title: str, body: str, image: str = None, data: dict = None) -> bool:
    cred = _get_cred()
    if not cred:
        return False

    try:
        notification = messaging.Notification(
            title=title,
            body=body,
        )
        if image:
            notification.image = image

        message = messaging.Message(
            notification=notification,
            data=data or {},
            token=token,
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    icon="/icon.png",
                    badge="/icon.png",
                    tag="fire-alert",
                    image=image,
                    actions=[
                        messaging.WebpushNotificationAction(
                            action="open_map",
                            title="View on Map",
                        ),
                    ],
                ),
            ),
        )
        messaging.send(message)
        return True
    except messaging.UnregisteredError:
        logger.info(f"Token unregistered: {token[:20]}...")
        return False
    except messaging.SenderIdMismatchError:
        logger.warning(f"Sender ID mismatch: {token[:20]}...")
        return False
    except Exception as e:
        logger.warning(f"Failed to send push: {e}")
        return False


def send_fire_alert(tokens: list[str], fire_data: dict) -> dict:
    city = fire_data.get("city") or fire_data.get("region") or "Unknown area"
    fire_conf = fire_data.get("fire_confidence", 0)
    smoke_conf = fire_data.get("smoke_confidence", 0)
    incident_type = fire_data.get("incident_type", "FIRE DETECTED")
    file_url = fire_data.get("file_url") or None

    message = fire_data.get("message", "")

    title = f"\U0001f525 {incident_type} \u2014 {city}"
    body = f"Fire: {(fire_conf * 100):.1f}% | Smoke: {(smoke_conf * 100):.1f}%"
    if message:
        body += f" \u2014 {message}"

    data = {
        "fire_id": str(fire_data.get("id", "")),
        "lat": str(fire_data.get("latitude", "")),
        "lng": str(fire_data.get("longitude", "")),
        "city": city,
        "incident_type": incident_type,
        "file_url": file_url or "",
        "audio_url": fire_data.get("audio_url") or "",
        "url": "/map",
    }

    sent = 0
    failed_tokens = []

    for token in tokens:
        success = send_push_notification(token, title, body, image=file_url, data=data)
        if success:
            sent += 1
        else:
            failed_tokens.append(token)

    return {"sent": sent, "failed": failed_tokens, "total": len(tokens)}
