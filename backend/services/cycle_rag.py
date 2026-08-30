"""Lightweight retrieval-augmented generation for the Cycle Agent."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parents[1]
CORPUS_PATH = BASE_DIR / "data" / "cycle_guidelines.json"

_SYNONYMS: dict[str, set[str]] = {
    "cramp": {"cramp", "cramps", "cramping"},
    "cramps": {"cramp", "cramps", "cramping"},
    "cramping": {"cramp", "cramps", "cramping"},
    "pain": {"pain", "painful", "ache", "aching"},
    "period": {"period", "periods", "menstrual", "menstruation", "menstruate"},
    "periods": {"period", "periods", "menstrual", "menstruation", "menstruate"},
    "bleeding": {"bleeding", "bleed", "blood", "flow"},
    "irregular": {"irregular", "unpredictable", "inconsistent"},
    "mood": {"mood", "moods", "anxious", "anxiety", "irritability"},
    "heavy": {"heavy", "excessive"},
    "mild": {"mild", "manageable", "usually"},
    "today": set(),
}

_ROUTINE_TOPIC_WORDS = {"cramp", "cramps", "cramping", "period", "periods", "cycle",
                         "bleeding", "pain", "mood", "track", "tracking", "normal"}


def _tokens(text: str) -> set[str]:
    raw = {t for t in re.findall(r"[a-zA-Z][a-zA-Z'-]{2,}", text.lower())}
    expanded = set(raw)
    for tok in raw:
        expanded |= _SYNONYMS.get(tok, set())
    return expanded


def load_corpus() -> list[dict[str, Any]]:
    if not CORPUS_PATH.exists():
        return []
    try:
        data = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def retrieve(query: str, top_k: int = 4) -> list[dict[str, Any]]:
    query_tokens = _tokens(query)
    lowered = query.lower()
    is_routine_cycle_question = bool(query_tokens & _ROUTINE_TOPIC_WORDS)

    scored: list[tuple[float, dict[str, Any]]] = []
    for chunk in load_corpus():
        chunk_tokens = _tokens(chunk.get("text", ""))
        overlap = len(query_tokens & chunk_tokens)
        phrase_bonus = 0.0
        for phrase in ("heavy bleeding", "severe pain", "irregular period", "menstrual cycle",
                       "seek care", "menstrual pain", "menstrual cramps", "cramping"):
            if phrase in lowered and phrase in chunk.get("text", "").lower():
                phrase_bonus += 2.0
        score = overlap + phrase_bonus
        if score > 0:
            scored.append((score, chunk))

    scored.sort(key=lambda item: item[0], reverse=True)
    results = [chunk for _, chunk in scored[:top_k]]

    if not results and is_routine_cycle_question:
        corpus = load_corpus()
        results = corpus[:top_k]

    return results


def format_context(chunks: list[dict[str, Any]]) -> str:
    return "\n\n".join(
        f"[{i}] {c['title']} ({c['url']})\n{c['text']}"
        for i, c in enumerate(chunks, start=1)
    )


def citation_list(chunks: list[dict[str, Any]]) -> list[dict[str, str]]:
    return [{"title": c["title"], "url": c["url"]} for c in chunks]
