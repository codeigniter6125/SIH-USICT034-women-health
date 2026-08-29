import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agents import care_plan_agent, cycle_agent, report_reader_agent
from services.auth_service import create_demo_token, verify_token
from services.shared_memory import clear_memory_for_tests, get_context


def test_cycle_agent():
    result = cycle_agent.run({"user_id": "cycle-test", "message": "How do I track my period?"})
    assert result["agent"] == "cycle"
    assert result["retrieval_used"] is True
    assert get_context("cycle-test")["last_cycle_interaction"]


def test_report_reader_agent():
    result = report_reader_agent.run({"user_id": "report-test", "ocr_text": "Hemoglobin: 11.2 g/dL\nTSH: 2.1 mIU/L"})
    assert result["agent"] == "report_reader"
    assert len(result["findings"]) == 2
    assert get_context("report-test")["report_history"]


def test_care_plan_agent():
    result = care_plan_agent.run({"user_id": "care-test"})
    assert result["agent"] == "care_plan"
    assert result["actions"]
    assert get_context("care-test")["care_plans"]


def test_demo_login():
    token = create_demo_token("login-test")
    assert verify_token(token)["uid"] == "login-test"


if __name__ == "__main__":
    clear_memory_for_tests()
    test_cycle_agent()
    test_report_reader_agent()
    test_care_plan_agent()
    test_demo_login()
    print("Remaining-agent isolation tests passed")
