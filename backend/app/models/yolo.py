from ultralytics import YOLO
from app.config import MODEL_PATH


_model = None


def get_model() -> YOLO:
    global _model
    if _model is None:
        _model = YOLO(str(MODEL_PATH))
    return _model


def get_class_names() -> dict:
    return get_model().names
