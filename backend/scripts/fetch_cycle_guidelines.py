"""Fetch and index public menstrual-health guidance for the Cycle Agent.

Run from backend/: ``python scripts/fetch_cycle_guidelines.py``
The script stores only extracted text, source metadata, and retrieval chunks.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

BACKEND_DIR = Path(__file__).resolve().parents[1]
OUTPUT = BACKEND_DIR / "data" / "cycle_guidelines.json"

SOURCES = [
    {
        "title": "WHO — Menstrual health",
        "url": "https://www.who.int/news-room/fact-sheets/detail/menstrual-health",
    },
    {
        "title": "UNICEF — Guidance on Menstrual Health and Hygiene",
        "url": "https://www.unicef.org/documents/guidance-menstrual-health-and-hygiene",
    },
    {
        "title": "CDC — Healthy Habits: Menstrual Hygiene",
        "url": "https://www.cdc.gov/hygiene/about/menstrual-hygiene.html",
    },
    {
        "title": "ACOG — The Menstrual Cycle",
        "url": "https://www.acog.org/womens-health/infographics/the-menstrual-cycle",
    },
    {
        "title": "ACOG — Heavy and Abnormal Periods",
        "url": "https://www.acog.org/womens-health/faqs/heavy-and-abnormal-periods",
    },
]


def clean_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg", "nav", "footer"]):
        tag.decompose()
    text = soup.get_text(" ")
    return re.sub(r"\s+", " ", text).strip()


def chunks(text: str, words: int = 180, overlap: int = 30) -> list[str]:
    tokens = text.split()
    result = []
    step = max(1, words - overlap)
    for start in range(0, len(tokens), step):
        part = " ".join(tokens[start : start + words]).strip()
        if len(part) >= 80:
            result.append(part)
        if start + words >= len(tokens):
            break
    return result


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    indexed: list[dict[str, str]] = []
    fetched_at = datetime.now(timezone.utc).isoformat()
    headers = {"User-Agent": "WomensHealthSIH-CycleAgent/1.0 (educational demo)"}

    for source in SOURCES:
        try:
            response = requests.get(source["url"], headers=headers, timeout=20)
            response.raise_for_status()
            text = clean_text(response.text)
            if len(text) < 200:
                raise ValueError("page returned too little readable text")
            for index, chunk in enumerate(chunks(text)):
                indexed.append(
                    {
                        "id": f"{source['title'].lower().replace(' ', '-')}-{index}",
                        "title": source["title"],
                        "url": source["url"],
                        "fetched_at": fetched_at,
                        "text": chunk,
                    }
                )
            print(f"Indexed {source['title']}: {len(chunks(text))} chunks")
        except Exception as exc:
            print(f"Skipped {source['title']}: {exc}")

    OUTPUT.write_text(json.dumps(indexed, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(indexed)} chunks to {OUTPUT}")


if __name__ == "__main__":
    main()
