"""
build_mns_plans_jsonl.py
========================
Converts the existing mns_workout_plans_flat.csv (already scraped ~1033 plans)
into the richer mns_plans_v2.jsonl format needed for LLM training.

The flat CSV already contains:
  - All metadata (goal, type, level, duration, days/week, equipment, gender, supps, pdf_url)
  - Full description text
  - sections_json  -> per-section text (description, overview, nutrition, cardio, recovery, etc.)
  - tables_json    -> exercise tables with sets/reps per workout day
  - headings_json  -> list of all headings (used to label workout days)
  - target_output_schema_json -> structured plan already derived

This script:
  1. Reads and deduplicates by routine_url
  2. Parses sections_json to extract nutrition_notes, cardio_notes, recovery_notes, overview
  3. Parses tables_json to reconstruct workout_days with exercises
  4. Extracts schedule examples from sections_json content
  5. Emits one clean JSON record per plan to mns_plans_v2.jsonl

Also tries to extract PDF text from any already-downloaded PDF files
(looks in a local pdf_cache/ directory if it exists).
"""

from __future__ import annotations

import csv
import json
import logging
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# Force UTF-8 stdout
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ── Paths ─────────────────────────────────────────────────────────────────────
PROJECT_ROOT  = Path(__file__).resolve().parent.parent
INPUT_CSV1    = PROJECT_ROOT / "mns_workout_plans_flat.csv"          # primary (1033 rows)
INPUT_CSV2    = PROJECT_ROOT / "muscle_and_strength_routines.csv"    # secondary (622 rows)
OUTPUT_JSONL  = PROJECT_ROOT / "mns_plans_v2.jsonl"

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

# ────────────────────────────────────────────────────────────────────────────
#  Helpers
# ────────────────────────────────────────────────────────────────────────────
_DAY_RE = re.compile(
    r"\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b", re.I
)


def _safe_json(raw: str, default: Any = None) -> Any:
    if not raw or not raw.strip():
        return default
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, ValueError):
        return default


def _split_list(raw: str) -> list[str]:
    """Split comma-separated string into a clean list, deduplicating."""
    items = [x.strip() for x in re.split(r"[,\n]", raw or "") if x.strip()]
    seen: set[str] = set()
    result: list[str] = []
    for it in items:
        if it not in seen:
            seen.add(it)
            result.append(it)
    return result


def _extract_schedules_from_text(text: str) -> list[list[str]]:
    """Find schedule bullet lists embedded in free text."""
    schedules: list[list[str]] = []
    lines = [ln.strip() for ln in text.split(".") + text.split("\n") if ln.strip()]
    # Look for runs of lines that mention day names
    candidates: list[str] = []
    for ln in lines:
        if _DAY_RE.search(ln):
            candidates.append(ln)
        elif candidates:
            if len(candidates) >= 3:
                schedules.append(candidates[:])
            candidates = []
    if len(candidates) >= 3:
        schedules.append(candidates)
    return schedules


def _extract_sections(sections_json: str) -> dict[str, str]:
    """
    Parse sections_json into a keyed dict.
    sections_json format: [{"heading": str, "content": str}, ...]
    """
    sections = _safe_json(sections_json, [])
    out: dict[str, str] = {}
    for sec in sections:
        if not isinstance(sec, dict):
            continue
        heading = sec.get("heading", "").lower().strip()
        content = sec.get("content", "").strip()
        if not content:
            continue
        if re.search(r"workout\s+description", heading, re.I):
            out["description"] = content
        elif re.search(r"overview", heading, re.I):
            out["overview"] = content
        elif re.search(r"^nutrition", heading, re.I):
            out["nutrition_notes"] = content
        elif re.search(r"^cardio|the\s+cardio", heading, re.I):
            out["cardio_notes"] = content
        elif re.search(r"^recovery", heading, re.I):
            out["recovery_notes"] = content
        else:
            # Collect other section texts under a misc key
            out.setdefault("misc_sections", "")
            out["misc_sections"] += f"\n\n## {sec.get('heading', '')}\n{content}"
    return out


def _build_workout_days(tables_json: str, headings_json: str) -> list[dict[str, Any]]:
    """
    Reconstruct workout_days from tables_json.

    tables_json format:
      [{"table_heading": str, "columns": [str,...], "rows": [[str,...],...] }, ...]

    headings_json format: [str, ...]
    """
    tables = _safe_json(tables_json, [])
    days: list[dict[str, Any]] = []

    for table in tables:
        if not isinstance(table, dict):
            continue
        day_label = table.get("table_heading") or f"Workout {len(days)+1}"
        columns: list[str] = [c.lower() for c in table.get("columns", [])]
        rows: list[list[str]] = table.get("rows", [])

        exercises: list[dict[str, str]] = []
        for row in rows:
            if not row:
                continue
            ex: dict[str, str] = {k: "" for k in ("name","sets","reps","rest","notes","tempo","rpe")}

            if columns:
                for idx, col in enumerate(columns):
                    if idx >= len(row):
                        break
                    val = row[idx] if row[idx] else ""
                    if "exercise" in col or idx == 0:
                        ex["name"] = val
                    elif "set" in col:
                        ex["sets"] = val
                    elif "rep" in col:
                        ex["reps"] = val
                    elif "rest" in col:
                        ex["rest"] = val
                    elif "note" in col or "comment" in col:
                        ex["notes"] = val
                    elif "tempo" in col:
                        ex["tempo"] = val
                    elif "rpe" in col or "intensity" in col:
                        ex["rpe"] = val
            else:
                for idx, k in enumerate(["name","sets","reps","rest","notes"]):
                    if idx < len(row):
                        ex[k] = row[idx]

            if ex["name"] and ex["name"].lower() not in ("exercise", ""):
                exercises.append(ex)

        if exercises:
            days.append({"day_label": day_label, "exercises": exercises})

    return days


def _build_schedule_examples(sections_json: str, description: str) -> list[list[str]]:
    """Extract schedule examples from section content."""
    schedules: list[list[str]] = []
    sections = _safe_json(sections_json, [])
    combined_text = description or ""
    for sec in sections:
        if isinstance(sec, dict):
            combined_text += " " + sec.get("content", "")

    found = _extract_schedules_from_text(combined_text)
    for sched in found:
        if sched not in schedules:
            schedules.append(sched)
    return schedules


# ────────────────────────────────────────────────────────────────────────────
#  Row → Record conversion
# ────────────────────────────────────────────────────────────────────────────
def convert_flat_row(row: dict[str, str]) -> dict[str, Any]:
    """Convert one CSV row to the rich JSONL record format."""

    # --- Sections ---
    secs = _extract_sections(row.get("sections_json", ""))
    description      = secs.get("description", "") or row.get("description", "")
    overview         = secs.get("overview", "")
    nutrition_notes  = secs.get("nutrition_notes", "")
    cardio_notes     = secs.get("cardio_notes", "")
    recovery_notes   = secs.get("recovery_notes", "")

    # --- Workout days ---
    workout_days = _build_workout_days(
        row.get("tables_json", ""),
        row.get("headings_json", ""),
    )

    # --- Schedule examples ---
    schedule_examples = _build_schedule_examples(
        row.get("sections_json", ""),
        description,
    )

    # --- Metadata ---
    equipment = _split_list(row.get("equipment_required", ""))
    supps     = _split_list(row.get("recommended_supps", ""))

    pdf_url = row.get("pdf_url", "").strip() or None

    # --- target_output_schema_json: structured plan already derived ---
    target_schema = _safe_json(row.get("target_output_schema_json", ""), {})

    return {
        "url":                  row.get("routine_url", "").strip(),
        "title":                row.get("routine_title", "").strip(),
        "main_goal":            row.get("main_goal", "").strip(),
        "workout_type":         row.get("workout_type", "").strip(),
        "training_level":       row.get("training_level", "").strip(),
        "program_duration":     row.get("program_duration", "").strip(),
        "days_per_week":        row.get("days_per_week", "").strip(),
        "time_per_workout":     row.get("time_per_workout", "").strip(),
        "equipment":            equipment,
        "target_gender":        row.get("target_gender", "").strip(),
        "recommended_supps":    supps,
        "pdf_url":              pdf_url,
        "pdf_text":             None,
        "description":          description,
        "overview":             overview,
        "nutrition_notes":      nutrition_notes,
        "cardio_notes":         cardio_notes,
        "recovery_notes":       recovery_notes,
        "schedule_examples":    schedule_examples,
        "workout_days":         workout_days,
        "target_output_schema": target_schema,   # structured plan schema
        "author":               "",
        "categories":           [row.get("category_name", "").strip()] if row.get("category_name","") else [],
        "source_csv":           "mns_workout_plans_flat.csv",
        "scrape_timestamp":     datetime.now(timezone.utc).isoformat(),
    }


def convert_routines_row(row: dict[str, str]) -> dict[str, Any]:
    """Convert one row from muscle_and_strength_routines.csv."""
    schedules_raw = row.get("Schedules JSON", "")
    schedules = _safe_json(schedules_raw, [])
    if isinstance(schedules, list) and schedules and not isinstance(schedules[0], list):
        # It's a flat list of day strings — wrap it
        schedules = [schedules]

    description = row.get("Description", "").strip()

    equipment = _split_list(row.get("Equipment Required", ""))
    supps     = _split_list(row.get("Recommended Supps", ""))

    return {
        "url":               row.get("URL", "").strip(),
        "title":             row.get("Workout Name", "").strip(),
        "main_goal":         row.get("Main Goal", "").strip(),
        "workout_type":      row.get("Workout Type", "").strip(),
        "training_level":    row.get("Training Level", "").strip(),
        "program_duration":  row.get("Program Duration", "").strip(),
        "days_per_week":     row.get("Days Per Week", "").strip(),
        "time_per_workout":  row.get("Time Per Workout", "").strip(),
        "equipment":         equipment,
        "target_gender":     row.get("Target Gender", "").strip(),
        "recommended_supps": supps,
        "pdf_url":           None,
        "pdf_text":          None,
        "description":       description,
        "overview":          "",
        "nutrition_notes":   "",
        "cardio_notes":      "",
        "recovery_notes":    "",
        "schedule_examples": schedules,
        "workout_days":      [],     # not available in this CSV
        "author":            "",
        "categories":        [],
        "source_csv":        "muscle_and_strength_routines.csv",
        "scrape_timestamp":  datetime.now(timezone.utc).isoformat(),
    }


# ────────────────────────────────────────────────────────────────────────────
#  Main
# ────────────────────────────────────────────────────────────────────────────
def main() -> None:
    log.info("=" * 60)
    log.info("MnS CSV -> JSONL Converter")
    log.info("Output: %s", OUTPUT_JSONL)
    log.info("=" * 60)

    seen_urls: set[str] = set()
    total = 0

    with open(OUTPUT_JSONL, "w", encoding="utf-8") as out_f:
        # ── Primary source: mns_workout_plans_flat.csv ────────────────
        if INPUT_CSV1.exists():
            log.info("Reading %s ...", INPUT_CSV1.name)
            with open(INPUT_CSV1, encoding="utf-8-sig", errors="ignore") as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    url = row.get("routine_url", "").strip()
                    if not url or url in seen_urls:
                        continue
                    seen_urls.add(url)
                    try:
                        record = convert_flat_row(row)
                        out_f.write(json.dumps(record, ensure_ascii=False) + "\n")
                        count += 1
                        total += 1
                    except Exception as exc:
                        log.warning("Row error [%s]: %s", url, exc)
            log.info("  -> %d records from %s", count, INPUT_CSV1.name)

        # ── Secondary source: muscle_and_strength_routines.csv ────────
        if INPUT_CSV2.exists():
            log.info("Reading %s ...", INPUT_CSV2.name)
            with open(INPUT_CSV2, encoding="utf-8-sig", errors="ignore") as f:
                reader = csv.DictReader(f)
                count = 0
                for row in reader:
                    url = row.get("URL", "").strip()
                    if not url or url in seen_urls:
                        continue
                    seen_urls.add(url)
                    try:
                        record = convert_routines_row(row)
                        out_f.write(json.dumps(record, ensure_ascii=False) + "\n")
                        count += 1
                        total += 1
                    except Exception as exc:
                        log.warning("Row error [%s]: %s", url, exc)
            log.info("  -> %d new records from %s", count, INPUT_CSV2.name)

    log.info("=" * 60)
    log.info("DONE. Total unique records: %d", total)
    log.info("Output: %s", OUTPUT_JSONL)
    log.info("=" * 60)


if __name__ == "__main__":
    main()
