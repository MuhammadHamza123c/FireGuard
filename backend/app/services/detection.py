import cv2
from app.models.roboflow import infer_frame
from app.config import CONFIDENCE_THRESHOLD, VERIFY_FRAMES
from app.schemas.incident import DetectionResult


def detect_frame(frame):
    predictions = infer_frame(frame)

    fire_detected = False
    smoke_detected = False
    fire_confidence = 0.0
    smoke_confidence = 0.0

    for prediction in predictions:
        confidence = float(prediction["confidence"])
        if confidence < CONFIDENCE_THRESHOLD:
            continue

        class_name = prediction["class"].lower().strip()

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

    return detection, predictions


def annotate_frame(frame, predictions, detection: DetectionResult):
    annotated = frame.copy()

    for prediction in predictions:
        confidence = float(prediction["confidence"])
        if confidence < CONFIDENCE_THRESHOLD:
            continue

        x = float(prediction["x"])
        y = float(prediction["y"])
        width = float(prediction["width"])
        height = float(prediction["height"])
        x1 = int(x - width / 2)
        y1 = int(y - height / 2)
        x2 = int(x + width / 2)
        y2 = int(y + height / 2)
        label = f'{prediction["class"]} {confidence:.0%}'
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 2)
        cv2.putText(
            annotated,
            label,
            (x1, max(y1 - 8, 16)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 0, 255),
            2,
        )

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
