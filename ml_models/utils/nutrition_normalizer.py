"""Normalize ingredient text and nutritional values (stub)."""
from typing import Dict


def normalize_ingredient(text: str) -> Dict:
    # stubbed normalization: parse name and return placeholder macros
    return {'name': text.strip().lower(), 'calories': None, 'protein_g': None}
