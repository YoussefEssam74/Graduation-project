"""
jsonl_to_csv.py
===============
Converts mns_plans_v2.jsonl to mns_plans_v2.csv.

Nested fields (workout_days, schedule_examples, equipment, recommended_supps,
categories, target_output_schema) are serialized as JSON strings so all data
is preserved in a flat CSV that Excel / pandas can read.
"""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_JSONL  = PROJECT_ROOT / "mns_plans_v3.jsonl"
OUTPUT_CSV   = PROJECT_ROOT / "mns_plans_v3.csv"

# Scalar fields — written as plain strings
SCALAR_FIELDS = [
    "url",
    "title",
    "main_goal",
    "workout_type",
    "training_level",
    "program_duration",
    "days_per_week",
    "time_per_workout",
    "target_gender",
    "pdf_url",
    "pdf_text",
    "description",
    "overview",
    "nutrition_notes",
    "cardio_notes",
    "recovery_notes",
    "author",
    "source_csv",
    "scrape_timestamp",
]

# Nested fields — serialized as compact JSON strings
JSON_FIELDS = [
    "equipment",
    "recommended_supps",
    "schedule_examples",
    "workout_days",
    "target_output_schema",
    "categories",
]

ALL_COLUMNS = SCALAR_FIELDS + JSON_FIELDS


def record_to_row(record: dict) -> dict:
    row: dict = {}
    for field in SCALAR_FIELDS:
        val = record.get(field, "")
        row[field] = val if val is not None else ""
    for field in JSON_FIELDS:
        val = record.get(field)
        if val is None or val == [] or val == {}:
            row[field] = ""
        else:
            row[field] = json.dumps(val, ensure_ascii=False)
    return row


def main() -> None:
    print(f"Reading {INPUT_JSONL.name} ...")
    with open(INPUT_JSONL, encoding="utf-8") as f:
        records = [json.loads(line) for line in f if line.strip()]
    print(f"  {len(records)} records loaded.")

    print(f"Writing {OUTPUT_CSV.name} ...")
    with open(OUTPUT_CSV, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=ALL_COLUMNS)
        writer.writeheader()
        for record in records:
            writer.writerow(record_to_row(record))

    print(f"Done. Output: {OUTPUT_CSV}")
    print(f"Rows: {len(records)} | Columns: {len(ALL_COLUMNS)}")


if __name__ == "__main__":
    main()
