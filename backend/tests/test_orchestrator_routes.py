import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents.orchestrator import route_request
from services.shared_memory import clear_memory_for_tests

clear_memory_for_tests()

cycle = route_request({"message": "How do I track my period?", "user_phone": "route-cycle"})
assert cycle["agent"] == "cycle"

report = route_request({"message": "Please read my report", "user_phone": "route-report", "ocr_text": "Hemoglobin: 11.2 g/dL"})
assert report["agent"] == "report_reader"

care = route_request({"message": "Please give me a care plan", "user_phone": "route-care"})
assert care["agent"] == "care_plan"

print("Orchestrator route verification passed")
