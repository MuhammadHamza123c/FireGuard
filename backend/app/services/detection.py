import cv2
from app.models.yolo import get_model, get_class_names
from app.config import CONFIDENCE_THRESHOLD, VERIFY_FRAMES
from app.schemas.incident import DetectionResult


def detect_frame(frame):
    model = get_model()
    names = get_class_names()

    results = model.predict(
        source=frame,
        conf=CONFIDENCE_THRESHOLD,
        verbose=False,
    )

    fire_detected = False
    smoke_detected = False
    fire_confidence = 0.0
    smoke_confidence = 0.0

    if results and results[0].boxes is not None:
        for box in results[0].boxes:
            class_id = int(box.cls[0])
            confidence = float(box.conf[0])
            class_name = names[class_id].lower().strip()

            if class_name == "fire":
                fire_detected = True
                fire_confidence = max(fire_confidence, confidence)

            elif class_name == "smoke":
                smoke_detected = True
                smoke_confidence = max(smoke_confidence, confidence)

    status = _get_status(fire_detected, smoke_detected)

    detection = DetectionResult(
        fire_detected=fire_detected,
        smoke_detected=smoke_detected,
        fire_confidence=round(fire_confidence, 4),
        smoke_confidence=round(smoke_confidence, 4),
        status=status,
    )

    return detection, results


def annotate_frame(frame, detection: DetectionResult) -> any:
    model = get_model()
    results = model.predict(
        source=frame,
        conf=CONFIDENCE_THRESHOLD,
        verbose=False,
    )
    annotated = results[0].plot()

    color = (
        (0, 0, 255) if detection.fire_detected
        else (0, 255, 255) if detection.smoke_detected
        else (0, 255, 0)
    )

    cv2.putText(
        annotated,
        detection.status,
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        color,
        2,
    )

    return annotated


class FireVerifier:
    def __init__(self):
        self.fire_count = 0
        self.incident_confirmed = False
        self.incident_type = None
        self.incident_frame = None
        self.best_fire_confidence = 0.0
        self.best_smoke_confidence = 0.0

    def update(self, detection: DetectionResult, frame_number: int = None):
        if detection.fire_detected:
            self.fire_count += 1
        else:
            self.fire_count = 0

        self.best_fire_confidence = max(
            self.best_fire_confidence, detection.fire_confidence
        )
        self.best_smoke_confidence = max(
            self.best_smoke_confidence, detection.smoke_confidence
        )

        if not self.incident_confirmed and self.fire_count >= VERIFY_FRAMES:
            self.incident_confirmed = True
            self.incident_frame = frame_number

            if detection.smoke_detected:
                self.incident_type = "FIRE + SMOKE"
            else:
                self.incident_type = "FIRE"

        return self.incident_confirmed

    def reset(self):
        self.fire_count = 0
        self.incident_confirmed = False
        self.incident_type = None
        self.incident_frame = None
        self.best_fire_confidence = 0.0
        self.best_smoke_confidence = 0.0


def _get_status(fire_detected: bool, smoke_detected: bool) -> str:
    if fire_detected and smoke_detected:
        return "FIRE + SMOKE"
    elif fire_detected:
        return "FIRE DETECTED"
    elif smoke_detected:
        return "SMOKE WARNING"
    return "NO INCIDENT"
