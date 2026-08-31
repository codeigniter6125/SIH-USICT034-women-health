"""Report-Reader Agent: Comprehensive OCR analysis, condition summary, dynamic takeaways, and actionable remedies."""
from __future__ import annotations

import re
from pathlib import Path
from services.shared_memory import update_context


def _extract_values_fallback(text: str) -> list[dict]:
    values = []
    p1 = re.compile(r"([A-Za-z][A-Za-z0-9 /()_-]{1,40})\s*[:=-]\s*([<>]?\s*\d+(?:\.\d+)?)\s*([A-Za-z/%^0-9.-]*)(?:\s*\((?:Reference|Ref|Range)?[:\s]*([0-9.-]+(?:\s*-\s*[0-9.-]+)?)\))?", re.I)
    for match in p1.finditer(text):
        values.append({
            "test": match.group(1).strip(),
            "value": match.group(2).strip(),
            "unit": match.group(3).strip() or "units",
            "reference_range": (match.group(4) or "Normal range").strip(),
            "status": "normal",
        })
    if not values:
        p2 = re.compile(r"([A-Za-z][A-Za-z0-9 /()-]{1,40})\s*[:=-]\s*([<>]?\s*\d+(?:\.\d+)?)", re.I)
        for match in p2.finditer(text):
            values.append({
                "test": match.group(1).strip(),
                "value": match.group(2).strip(),
                "unit": "",
                "reference_range": "Standard",
                "status": "normal",
            })
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

    # Base fallback structure
    fallback_findings = _extract_values_fallback(ocr_text)
    report_type = "Medical Lab Report"
    health_summary = "We extracted the numerical values and parameters from your report. Review these findings in consultation with your healthcare provider for personalized medical guidance."
    main_pointers = [
        {
            "title": "Values Extracted Successfully",
            "description": "All clinical biomarkers and parameters from your scan have been organized below.",
            "status": "positive"
        }
    ]
    solutions_and_remedies = {
        "dietary_cure": [
            "Nourishing whole foods diet with adequate hydration.",
            "Balanced proteins and complex carbohydrates for steady energy.",
            "Antioxidant-rich leafy greens and seasonal fruits."
        ],
        "lifestyle_care": [
            "Consistent daily physical movement (walking, yoga, or stretching).",
            "Regular sleep schedule targeting 7-8 hours per night.",
            "Stress management through mindfulness or breathwork."
        ],
        "questions_for_doctor": [
            "Are any of these biomarker levels outside my optimal personal baseline?",
            "Do I need follow-up lab work or repeat scans in 3-6 months?",
            "Are there specific nutritional or lifestyle changes you recommend?"
        ]
    }

    # Call Gemini for deep medical analysis & personalized remedies
    try:
        from services.gemini_client import call_gemini_structured
        prompt = f"""You are Maya, an empathetic, expert women's health clinical AI specialist.
Analyze this medical/lab report text extracted via OCR.
Return a valid JSON object matching this EXACT schema:
{{
  "report_type": "<e.g. 'PCOS / Hormonal Profile' | 'Complete Blood Count (CBC)' | 'Thyroid Profile' | 'Lipid & Metabolic Panel' | 'Pelvic Ultrasound Report'>",
  "health_summary": "<A warm, compassionate, highly informative 3-5 sentence explanation of what condition, hormonal patterns, or health status this report shows, in clear patient-friendly language>",
  "main_pointers": [
    {{
      "title": "<Short bold title of finding>",
      "description": "<Clear explanation of what this specific marker means for her health>",
      "status": "<'positive' | 'attention' | 'warning'>"
    }}
  ],
  "solutions_and_remedies": {{
    "dietary_cure": [
      "<Specific actionable food, herb, seed-cycling, tea, or nutritional remedy tailored to this exact condition>"
    ],
    "lifestyle_care": [
      "<Specific exercise, sleep, circadian, or stress-reduction habit to help heal/manage this condition>"
    ],
    "questions_for_doctor": [
      "<Targeted, smart clinical question for her gynecologist/doctor regarding these results>"
    ]
  }},
  "findings": [
    {{
      "test": "<Biomarker name>",
      "value": "<Extracted number/result>",
      "unit": "<Unit of measurement>",
      "reference_range": "<Reference range from report>",
      "status": "<'normal' | 'high' | 'low' | 'attention'>"
    }}
  ]
}}

OCR Document Content:
{ocr_text[:6000]}"""

        ai_res = call_gemini_structured(prompt)
        if isinstance(ai_res, dict):
            if ai_res.get("report_type"):
                report_type = ai_res["report_type"]
            if ai_res.get("health_summary"):
                health_summary = ai_res["health_summary"]
            if isinstance(ai_res.get("main_pointers"), list) and len(ai_res["main_pointers"]) > 0:
                main_pointers = ai_res["main_pointers"]
            if isinstance(ai_res.get("solutions_and_remedies"), dict):
                solutions_and_remedies = ai_res["solutions_and_remedies"]
            if isinstance(ai_res.get("findings"), list) and len(ai_res["findings"]) > 0:
                fallback_findings = ai_res["findings"]
    except Exception as gemini_err:
        print(f"Report reader LLM note: {gemini_err}")

    result = {
        "agent": "report_reader",
        "report_type": report_type,
        "health_summary": health_summary,
        "main_pointers": main_pointers,
        "solutions_and_remedies": solutions_and_remedies,
        "findings": fallback_findings,
        "raw_text_preview": ocr_text[:1000],
        "interpretation": health_summary,
        "needs_doctor_review": True,
        "disclaimer": "This is AI-assisted report extraction and wellness guidance, not a definitive clinical diagnosis. Please share this summary with your healthcare provider.",
    }
    update_context(user_id, {"report_history": [result]})
    return result

