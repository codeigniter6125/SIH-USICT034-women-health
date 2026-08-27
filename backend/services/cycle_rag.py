"""Lightweight retrieval-augmented generation for the Cycle Agent.

The corpus is built from public guidance pages listed in ``sources.json`` and
stored as local JSON chunks. Retrieval is intentionally dependency-light and
uses lexical overlap, making the demo easy to run offline after ingestion.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parents[1]
CORPUS_PATH = BASE_DIR / "data" / "cycle_guidelines.json"


def _tokens(text: str) -> set[str]:
    return {t for t in re.findall(r"[a-zA-Z][a-zA-Z'-]{2,}", text.lower())}


def load_corpus() -> list[dict[str, Any]]:
    if not CORPUS_PATH.exists():
        return []
    try:
        data = json.loads(CORPUS_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except (OSError, json.JSONDecodeError):
        return []


def retrieve(query: str, top_k: int = 4) -> list[dict[str, Any]]:
    """Return the most relevant guideline chunks for a user question."""
    query_tokens = _tokens(query)
    scored: list[tuple[float, dict[str, Any]]] = []
    for chunk in load_corpus():
        chunk_tokens = _tokens(chunk.get("text", ""))
        overlap = len(query_tokens & chunk_tokens)
        phrase_bonus = 0.0
        lowered = query.lower()
        for phrase in ("heavy bleeding", "severe pain", "irregular period", "menstrual cycle", "seek care"):
            if phrase in lowered and phrase in chunk.get("text", "").lower():
                phrase_bonus += 2.0
        score = overlap + phrase_bonus
        if score > 0:
            scored.append((score, chunk))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [chunk for _, chunk in scored[:top_k]]


def format_context(chunks: list[dict[str, Any]]) -> str:
    return "\n\n".join(
        f"[{i}] {c['title']} ({c['url']})\n{c['text']}"
        for i, c in enumerate(chunks, start=1)
    )


def citation_list(chunks: list[dict[str, Any]]) -> list[dict[str, str]]:
    return [{"title": c["title"], "url": c["url"]} for c in chunks]
