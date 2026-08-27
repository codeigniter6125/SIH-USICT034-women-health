# Cycle Agent RAG Implementation Guide

## Purpose

The Cycle Agent now uses retrieval-augmented generation (RAG) to ground general menstrual-health responses in current public guidance rather than relying only on model memory. The first corpus is sourced from the World Health Organization, UNICEF, the Centers for Disease Control and Prevention, and the American College of Obstetricians and Gynecologists. These sources provide public educational and clinical guidance about menstrual health, hygiene, cycle tracking, abnormal bleeding, and when to seek care.

This feature is an **educational information layer**. It does not diagnose conditions, prescribe medication, replace a clinician, or override the hard-coded Escalation Agent.

## What the RAG system retrieves

| Source | Topic coverage | URL |
|---|---|---|
| WHO | Menstrual health, pain, heavy or irregular bleeding, stigma, access to care | <https://www.who.int/news-room/fact-sheets/detail/menstrual-health> |
| UNICEF | Menstrual health and hygiene guidance | <https://www.unicef.org/documents/guidance-menstrual-health-and-hygiene> |
| CDC | Menstrual hygiene and product-use habits | <https://www.cdc.gov/hygiene/about/menstrual-hygiene.html> |
| ACOG | Menstrual-cycle education and cycle tracking | <https://www.acog.org/womens-health/infographics/the-menstrual-cycle> |
| ACOG | Heavy and abnormal periods | <https://www.acog.org/womens-health/faqs/heavy-and-abnormal-periods> |

## Data flow

```text
Public guidance URLs
        │
        ▼
fetch_cycle_guidelines.py
        │  HTML extraction + text cleanup + chunking
        ▼
backend/data/cycle_guidelines.json
        │
        ▼
cycle_rag.retrieve(user question)
        │  lexical overlap + health phrase boosts
        ▼
Cycle Agent
        │
        ├── Gemini configured: grounded structured response
        └── Gemini unavailable: safe cited fallback response
        │
        ▼
/api/chat response with reply, sources, and disclaimer
```

## Installation and refresh

From the `backend` directory, install dependencies and fetch the corpus:

```bash
pip install -r requirements.txt
python scripts/fetch_cycle_guidelines.py
```

The ingestion script is safe to rerun. It refreshes the fetch timestamp and rewrites the local corpus. Refresh the corpus before a demo or release, and review source changes with a qualified medical advisor before production use.

## API usage

The existing endpoint remains:

```text
POST /api/chat
```

Example request:

```json
{
  "message": "How can I track irregular periods?",
  "user_phone": "+91XXXXXXXXXX",
  "language": "English",
  "cycle_history": {
    "recent_period_start_dates": ["2026-07-01", "2026-07-31"]
  }
}
```

The response includes the following RAG fields:

```json
{
  "reply": "...",
  "agent": "cycle",
  "retrieval_used": true,
  "sources": [
    {
      "title": "WHO — Menstrual health",
      "url": "https://www.who.int/news-room/fact-sheets/detail/menstrual-health"
    }
  ],
  "disclaimer": "Educational information only; not a diagnosis or substitute for clinical care."
}
```

## Safety and governance

The Escalation Agent still runs before the routine Cycle Agent path on every chat turn. A retrieved passage cannot downgrade an urgent case. Cycle Agent prompts explicitly prohibit definitive diagnosis and medication prescribing. The frontend should display the source links and disclaimer whenever `retrieval_used` is true.

The local corpus contains public guidance text and metadata only. Do not put patient-identifying data, uploaded reports, phone numbers, or private Firestore records into the corpus. Patient cycle history is passed as request context to the Cycle Agent and should remain in the project’s protected memory store.

## Verification

Run the included smoke test:

```bash
python tests/test_cycle_rag.py
```

The test confirms that a cycle-health question retrieves authoritative chunks, produces a Cycle Agent response, exposes source metadata, and includes the non-diagnostic disclaimer.

## Limitations and next improvements

The first implementation uses a dependency-light lexical retriever so the hackathon build can run locally and remain understandable. It is not semantic vector search. A later production iteration can add embeddings, a managed vector store, document versioning, scheduled refreshes, content deduplication, multilingual chunks, and a clinician review workflow. Any such upgrade must retain source citations, corpus provenance, and the Escalation Agent’s hard-coded safety precedence.

## References

[1]: <https://www.who.int/news-room/fact-sheets/detail/menstrual-health> "WHO — Menstrual health"
[2]: <https://www.unicef.org/documents/guidance-menstrual-health-and-hygiene> "UNICEF — Guidance on Menstrual Health and Hygiene"
[3]: <https://www.cdc.gov/hygiene/about/menstrual-hygiene.html> "CDC — Healthy Habits: Menstrual Hygiene"
[4]: <https://www.acog.org/womens-health/infographics/the-menstrual-cycle> "ACOG — The Menstrual Cycle"
[5]: <https://www.acog.org/womens-health/faqs/heavy-and-abnormal-periods> "ACOG — Heavy and Abnormal Periods"
