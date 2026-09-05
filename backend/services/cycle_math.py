"""
cycle_math.py — deterministic cycle-day / phase / prediction calculation.

This is the piece that was missing before: cycle_agent.py only ever passed
raw logged history into an LLM prompt and let it freeform-respond — nothing
computed an actual "Day 14" / "ovulation window" the Home or Cycle screens
could bind to. That's why the UI "wasn't moving": there was no deterministic
state driving it, only conversational text.

This module is pure date math — no LLM involved — so it's fast, free, and
auditable (matches the project's "rules over guesses for anything
safety/state-critical" principle already used for red-flag detection).
"""
from __future__ import annotations

from datetime import date, datetime, timedelta
from statistics import mean
from typing import Any

DEFAULT_CYCLE_LENGTH = 28
DEFAULT_PERIOD_LENGTH = 5
MIN_CYCLE_LENGTH = 21
MAX_CYCLE_LENGTH = 45


def _parse_date(value: str) -> date:
    return datetime.fromisoformat(value).date()


def compute_cycle_state(period_start_dates: list[str], today: date | None = None) -> dict[str, Any]:
    """
    Computes the user's current cycle day, phase, and predictions from a list
    of logged period start dates (ISO strings, most recent last).

    Returns a dict that is safe to store back into shared_memory under
    "cycle_state" and safe to send directly to the frontend for the Home/
    Cycle screens to render without any further computation on their end.
    """
    today = today or date.today()

    if not period_start_dates:
        return {
            "has_data": False,
            "message": "Log your first period start date to begin cycle tracking.",
        }

    dates = sorted(_parse_date(d) for d in period_start_dates)
    last_period_start = dates[-1]

    # Average cycle length from consecutive logged starts, clamped to a
    # medically sane range so one mis-logged date doesn't wildly skew the
    # prediction (PRD §8.4: irregular is relative to the user's own history).
    if len(dates) >= 2:
        gaps = [(dates[i] - dates[i - 1]).days for i in range(1, len(dates))]
        plausible_gaps = [g for g in gaps if MIN_CYCLE_LENGTH <= g <= MAX_CYCLE_LENGTH]
        avg_cycle_length = round(mean(plausible_gaps)) if plausible_gaps else DEFAULT_CYCLE_LENGTH
        is_irregular = len(plausible_gaps) < len(gaps)  # some gap(s) fell outside a normal range
    else:
        avg_cycle_length = DEFAULT_CYCLE_LENGTH
        is_irregular = False

    cycle_day = (today - last_period_start).days + 1
    # If we've drifted past a predicted cycle length, we're likely into a new
    # (unlogged) cycle — recompute cycle_day relative to the estimated start.
    if cycle_day > avg_cycle_length:
        cycles_elapsed = cycle_day // avg_cycle_length
        estimated_start = last_period_start + timedelta(days=cycles_elapsed * avg_cycle_length)
        cycle_day = (today - estimated_start).days + 1

    ovulation_day = avg_cycle_length - 14  # luteal phase is consistently ~14 days
    next_period_date = last_period_start + timedelta(days=avg_cycle_length)
    while next_period_date <= today:
        next_period_date += timedelta(days=avg_cycle_length)

    if cycle_day <= DEFAULT_PERIOD_LENGTH:
        phase = "menstrual"
    elif cycle_day < ovulation_day - 2:
        phase = "follicular"
    elif ovulation_day - 2 <= cycle_day <= ovulation_day + 1:
        phase = "ovulatory"
    else:
        phase = "luteal"

    fertile_window_start = last_period_start + timedelta(days=max(ovulation_day - 5, 0))
    fertile_window_end = last_period_start + timedelta(days=ovulation_day + 1)

    return {
        "has_data": True,
        "cycle_day": cycle_day,
        "phase": phase,
        "avg_cycle_length_days": avg_cycle_length,
        "is_irregular": is_irregular,
        "last_period_start": last_period_start.isoformat(),
        "predicted_next_period": next_period_date.isoformat(),
        "predicted_ovulation_day": ovulation_day,
        "fertile_window": {
            "start": fertile_window_start.isoformat(),
            "end": fertile_window_end.isoformat(),
        },
        "note": (
            "Estimates based on your own logged history — cycles vary, and this is not a guarantee."
            if not is_irregular else
            "Your recent cycle lengths have varied more than usual — patterns like this are worth "
            "mentioning to a clinician if they continue."
        ),
    }
