"""Optional Google Cloud Vision OCR adapter."""
from __future__ import annotations

import os


def extract_text_from_image(content: bytes) -> str:
    """Extract text with Vision when configured; fail clearly otherwise."""
    api_key = os.getenv("GOOGLE_CLOUD_VISION_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_CLOUD_VISION_API_KEY is not configured")
    import requests
    response = requests.post(
        "https://vision.googleapis.com/v1/images:annotate",
        params={"key": api_key},
        json={"requests": [{"image": {"content": __import__('base64').b64encode(content).decode()}, "features": [{"type": "DOCUMENT_TEXT_DETECTION"}]}]},
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    return data["responses"][0].get("fullTextAnnotation", {}).get("text", "")
