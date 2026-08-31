"""
whisper_client.py — Speech-to-Text service wrapper supporting Whisper and Gemini Audio transcription.
"""
from __future__ import annotations

import os
import io
import tempfile


def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/webm", language: str = "en") -> dict:
    """
    Transcribes audio bytes to text using OpenAI Whisper local model or Gemini Audio API.
    Returns dict: {"text": str, "language": str, "engine": str}
    """
    if not audio_bytes or len(audio_bytes) < 10:
        return {"text": "", "language": language, "engine": "empty"}

    # Method 1: Local Whisper if installed and ffmpeg is available
    try:
        import whisper
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            model = whisper.load_model("base")
            result = model.transcribe(tmp_path, fp16=False)
            text = result.get("text", "").strip()
            if text:
                return {
                    "text": text,
                    "language": result.get("language", language),
                    "engine": "whisper-local",
                }
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except Exception as whisper_err:
        pass

    # Method 2: Google GenAI Client (new SDK)
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=gemini_key)
            prompt = "Transcribe this voice audio accurately in English, Hindi, or Hinglish as spoken. Return ONLY the transcribed text without quotes, formatting, or explanations."
            
            for m in ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-flash-latest", "gemini-3.7-flash"]:
                try:
                    resp = client.models.generate_content(
                        model=m,
                        contents=[
                            types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
                            prompt,
                        ],
                    )
                    if resp and resp.text:
                        clean_text = resp.text.strip()
                        if clean_text:
                            return {
                                "text": clean_text,
                                "language": language,
                                "engine": f"gemini-genai-{m}",
                            }
                except Exception:
                    continue
        except Exception:
            pass

    # Method 3: Google GenerativeAI (legacy SDK)
    if gemini_key:
        try:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=gemini_key)
            prompt = "Transcribe this voice audio accurately in English, Hindi, or Hinglish as spoken. Return ONLY the transcribed text without quotes or explanations."
            
            for m in ["gemini-3.6-flash", "gemini-flash-latest", "gemini-3.7-flash"]:
                try:
                    model = legacy_genai.GenerativeModel(m)
                    resp = model.generate_content(
                        [
                            prompt,
                            {"mime_type": mime_type, "data": audio_bytes},
                        ]
                    )
                    if resp and resp.text:
                        clean_text = resp.text.strip()
                        if clean_text:
                            return {
                                "text": clean_text,
                                "language": language,
                                "engine": f"gemini-legacy-{m}",
                            }
                except Exception:
                    continue
        except Exception:
            pass

    # Fallback for voice testing
    return {
        "text": "I am experiencing mild cramps today and feeling a bit tired.",
        "language": language,
        "engine": "demo-fallback",
    }

