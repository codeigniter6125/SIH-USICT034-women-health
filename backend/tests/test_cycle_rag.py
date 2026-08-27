import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents.cycle_agent import run
from services.cycle_rag import retrieve

chunks = retrieve("What should I do about heavy bleeding and severe period pain?", top_k=3)
assert chunks, "Expected guideline chunks"
assert any("WHO" in chunk["title"] or "ACOG" in chunk["title"] for chunk in chunks)

result = run({"message": "How can I track my menstrual cycle?", "language": "English"})
assert result["agent"] == "cycle"
assert result["retrieval_used"] is True
assert result["sources"]
assert result["disclaimer"]
print("Cycle RAG verification passed")
