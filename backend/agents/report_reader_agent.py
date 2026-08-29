"""Report-Reader Agent: OCR extraction with safe, non-diagnostic output."""
from __future__ import annotations

import re
from pathlib import Path
from services.shared_memory import update_context


def _extract_values(text: str) -> list[dict]:
    values = []
    pattern = re.compile(r"([A-Za-z][A-Za-z0-9 /()-]{1,40})\s*[:=-]\s*([<>]?\s*\d+(?:\.\d+)?)\s*([A-Za-z/%^0-9.-]*)", re.I)
    for match in pattern.finditer(text):
        values.append({"test": match.group(1).strip(), "value": match.group(2).strip(), "unit": match.group(3).strip()})
    return values[:40]


def run(payload: dict) -> dict:
    user_id = payload.get("user_id") or payload.get("user_phone")
    if not user_id:
        return {"error": "user_id is required", "agent": "report_reader"}
    ocr_text = (payload.get("ocr_text") or payload.get("text") or "").strip()
    if not ocr_text and payload.get("file_path"):
        try:
            from services.vision_client import extract_text_from_image
            ocr_text = extract_text_from_image(Path(payload["file_path"]).read_bytes())
        except Exception as exc:
            return {"error": f"Unable to read report: {exc}", "agent": "report_reader"}
    if not ocr_text:
        return {"error": "Provide ocr_text or file_path", "agent": "report_reader"}
    findings = _extract_values(ocr_text)
    interpretation = "These extracted values need clinical interpretation in the context of your symptoms and the report's reference ranges."
    try:
        from services.gemini_client import call_gemini_structured
        vlm = call_gemini_structured(f"""Extract laboratory findings from this OCR text. Return JSON with exactly one key, findings, containing objects with test, value, unit, reference_range, and needs_review. Do not diagnose or prescribe. OCR text: {ocr_text[:6000]}""")
        if isinstance(vlm, dict) and isinstance(vlm.get("findings"), list):
            findings = vlm["findings"][:40]
            interpretation = "The report text was structured by a vision-language model; values still require clinician review and comparison with the report's own reference ranges."
    except Exception:
        pass
    result = {
        "agent": "report_reader",
        "findings": findings,
        "raw_text_preview": ocr_text[:1000],
        "interpretation": interpretation,
        "needs_doctor_review": True,
        "disclaimer": "This is document extraction, not a diagnosis.",
    }
    update_context(user_id, {"report_history": [{"findings": findings, "raw_text_preview": ocr_text[:1000]}]})
    return result
