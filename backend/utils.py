from __future__ import annotations

import re
from typing import List


def split_into_clauses(text: str, max_len: int = 1200) -> List[str]:
    # naive split by double newline or numbered clauses; then size-limit
    parts = re.split(r"\n\s*\n|\n\d+\.|\n- ", text)
    clauses: List[str] = []
    current = []
    current_len = 0
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if current_len + len(part) > max_len and current:
            clauses.append(" ".join(current).strip())
            current = [part]
            current_len = len(part)
        else:
            current.append(part)
            current_len += len(part)
    if current:
        clauses.append(" ".join(current).strip())
    return [c for c in clauses if c]


def simple_retrieve_context(text: str, question: str, window: int = 800) -> str:
    # very naive: find sentence containing any keyword from question
    keywords = [w.lower() for w in re.findall(r"\w+", question) if len(w) > 3]
    if not keywords:
        return text[:window]

    best_idx = 0
    best_score = -1
    lower = text.lower()
    for i in range(0, max(1, len(lower) - 50), 50):
        chunk = lower[i : i + window]
        score = sum(1 for k in keywords if k in chunk)
        if score > best_score:
            best_score = score
            best_idx = i
    return text[best_idx : best_idx + window]


