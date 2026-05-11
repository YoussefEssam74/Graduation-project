"""
clean_nutrition_sft.py
----------------------
Post-generation data cleaning for nutrition_sft_train.csv / nutrition_sft_eval.csv.

Runs THREE passes in priority order:

  Priority 1 — Remove contaminated rows
    Rows where system prompt says "Output ONLY valid JSON" but the assistant
    response is NOT valid JSON (plain-text or small allergen-only JSON that
    is NOT a 3-day plan structure).

  Priority 2 — Fix Vegetable Oil calorie corruption
    Rows whose plan has any day with total_calories > MAX_DAY_KCAL (caused
    by corrupted oil entries that somehow survived the generator clamping).
    These rows are dropped outright; the generator clamping already prevents
    new corruption, so this is a safety net for any edge cases.

  Priority 3 — Remove rows with calorie deviation > 20% from stated target
    Extracts the per-day calorie target from the user message, computes the
    average of the plan's day totals, and drops the row if the deviation
    exceeds DEVIATION_THRESHOLD.  Helps the model learn accurate planning.

Usage:
    python clean_nutrition_sft.py

Outputs (in-place overwrite of originals):
    nutrition_sft_train.csv  (cleaned)
    nutrition_sft_eval.csv   (cleaned)
    clean_report.txt         (summary of what was removed and why)
"""

import os
import re
import json
import csv
import io

BASE = os.path.dirname(__file__)
FILES = {
    "train": os.path.join(BASE, "nutrition_sft_train.csv"),
    "eval":  os.path.join(BASE, "nutrition_sft_eval.csv"),
}

# ── Thresholds ───────────────────────────────────────────────────────────────
MAX_DAY_KCAL = 6_000   # any day > 6000 kcal is almost certainly corrupted
MIN_DAY_KCAL = 500     # any day < 500 kcal is degenerate
DEVIATION_THRESHOLD = 0.20   # 20 % deviation from stated target triggers removal

# ── Helpers ──────────────────────────────────────────────────────────────────
# Prefer the explicit label used by every plan generator so we never
# accidentally parse BMR or other incidental kcal figures (e.g. the inbody
# plan puts "BMR 1800 kcal" before "Daily calorie target: 2400 kcal").
_TARGET_LABEL_RE = re.compile(
    r"[Dd]aily calorie target:\s*(\d[\d,]+)",
)
_TARGET_RE = re.compile(
    r"(\d[\d,]+)\s*(?:kcal|calories|calorie|\u0643\u064a\u0644\u0648|kcals)",
    re.IGNORECASE,
)


def _parse_target_kcal(user_msg: str) -> float | None:
    """Extract the daily calorie target from a user message.
    Prefers the labelled 'Daily calorie target: N' phrase so we never pick
    up BMR or other incidental kcal figures that appear earlier in the text."""
    m = _TARGET_LABEL_RE.search(user_msg)
    if m:
        return float(m.group(1).replace(",", ""))
    # Fallback for rows that don't use the standard label
    m = _TARGET_RE.search(user_msg)
    if m:
        return float(m.group(1).replace(",", ""))
    return None


def _is_3day_plan(obj: dict) -> bool:
    """Return True if obj looks like a 3-day nutrition plan."""
    return isinstance(obj, dict) and "days" in obj and isinstance(obj["days"], list)


def _day_calories(plan: dict) -> list[float]:
    """Return a list of per-day total_calories values from a plan dict."""
    cals = []
    for day in plan.get("days", []):
        tc = day.get("total_calories") or day.get(
            "totalCalories") or day.get("calories")
        if tc is not None:
            try:
                cals.append(float(tc))
            except (ValueError, TypeError):
                pass
    return cals


# ── Row-level classifier ─────────────────────────────────────────────────────
def classify_row(messages_json: str) -> tuple[str, str]:
    """
    Classify one CSV row.

    Returns (verdict, reason):
        verdict = "keep" | "drop"
        reason  = human-readable explanation (empty string if keeping)
    """
    # --- parse messages column ---
    try:
        msgs = json.loads(messages_json)
    except json.JSONDecodeError:
        return "drop", "messages column is not valid JSON"

    sys_content = next((m["content"]
                       for m in msgs if m["role"] == "system"),    "")
    user_content = next((m["content"]
                        for m in msgs if m["role"] == "user"),      "")
    asst_content = next((m["content"]
                        for m in msgs if m["role"] == "assistant"), "")

    if not asst_content:
        return "drop", "missing assistant content"

    asst_stripped = asst_content.strip()

    # ── Priority 1: contamination check ──────────────────────────────────────
    # Identify rows that carry the JSON-plan system prompt but whose assistant
    # response is NOT a 3-day plan.
    demands_json_plan = "Output ONLY valid JSON" in sys_content

    if demands_json_plan:
        # Must be parseable JSON
        try:
            plan_obj = json.loads(asst_stripped)
        except json.JSONDecodeError:
            return "drop", "P1:contamination — system demands JSON plan but assistant response is not JSON"

        # Must be a 3-day plan structure, not just a small allergen/nutrition object
        if not _is_3day_plan(plan_obj):
            return "drop", "P1:contamination — system demands 3-day plan but assistant returned non-plan JSON"

        # ── Priority 2: oil / calorie corruption check ────────────────────────
        day_cals = _day_calories(plan_obj)
        if day_cals:
            max_cal = max(day_cals)
            min_cal = min(day_cals)
            if max_cal > MAX_DAY_KCAL:
                return "drop", f"P2:oil_corruption — day total {max_cal:.0f} kcal > {MAX_DAY_KCAL}"
            if min_cal < MIN_DAY_KCAL:
                return "drop", f"P2:degenerate — day total {min_cal:.0f} kcal < {MIN_DAY_KCAL}"

        # ── Priority 3: calorie deviation check ───────────────────────────────
        target_kcal = _parse_target_kcal(user_content)
        if target_kcal and day_cals:
            avg_day = sum(day_cals) / len(day_cals)
            deviation = abs(avg_day - target_kcal) / max(target_kcal, 1)
            if deviation > DEVIATION_THRESHOLD:
                return "drop", (
                    f"P3:calorie_deviation — target={target_kcal:.0f} kcal "
                    f"avg_day={avg_day:.0f} kcal deviation={deviation * 100:.1f}%"
                )

    # ── All checks passed ─────────────────────────────────────────────────────
    return "keep", ""


# ── Per-file cleaning ────────────────────────────────────────────────────────
def clean_file(path: str, report_lines: list[str]) -> dict:
    if not os.path.exists(path):
        report_lines.append(f"SKIP  {path}  (file not found)\n")
        return {}

    with open(path, encoding="utf-8", newline="") as fh:
        reader = csv.DictReader(fh)
        rows = list(reader)
        fieldnames = reader.fieldnames or []

    total = len(rows)
    kept_rows = []
    drop_counts = {"P1:contamination": 0, "P1:contamination_non_plan_json": 0,
                   "P2:oil_corruption": 0, "P2:degenerate": 0,
                   "P3:calorie_deviation": 0, "other": 0}
    dropped_examples: list[str] = []   # up to 3 per category for the report

    for row in rows:
        messages_json = row.get("messages", "")
        verdict, reason = classify_row(messages_json)
        if verdict == "keep":
            kept_rows.append(row)
        else:
            # Bucket by priority prefix
            bucket = next(
                (k for k in drop_counts if reason.startswith(k)), "other")
            drop_counts[bucket] += 1
            if len(dropped_examples) < 15:
                dropped_examples.append(f"  [{bucket}] {reason}")

    # Write cleaned file (overwrite original)
    with open(path, "w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(kept_rows)

    kept = len(kept_rows)
    dropped = total - kept
    fname = os.path.basename(path)

    report_lines.append(f"{'='*60}")
    report_lines.append(f"File    : {fname}")
    report_lines.append(f"Before  : {total:,} rows")
    report_lines.append(f"After   : {kept:,} rows")
    report_lines.append(
        f"Dropped : {dropped:,} rows  ({dropped / max(total, 1) * 100:.1f}%)")
    report_lines.append("")
    report_lines.append("  By priority:")
    for k, v in drop_counts.items():
        if v:
            report_lines.append(f"    {k:<40} {v:>6}")
    if dropped_examples:
        report_lines.append("")
        report_lines.append("  Sample dropped rows:")
        report_lines.extend(dropped_examples)
    report_lines.append("")

    return {"file": fname, "before": total, "after": kept, "dropped": dropped,
            "drop_counts": drop_counts}


# ── Main ─────────────────────────────────────────────────────────────────────
def main():
    report_lines: list[str] = [
        "nutrition_sft — Post-generation cleaning report",
        f"MAX_DAY_KCAL={MAX_DAY_KCAL}  MIN_DAY_KCAL={MIN_DAY_KCAL}  "
        f"DEVIATION_THRESHOLD={DEVIATION_THRESHOLD*100:.0f}%",
        "",
    ]

    summaries = []
    for split, path in FILES.items():
        print(f"\nCleaning {split} set: {path}")
        summary = clean_file(path, report_lines)
        if summary:
            summaries.append(summary)
            print(f"  {summary['before']:,} -> {summary['after']:,} rows "
                  f"(dropped {summary['dropped']:,})")

    # Write report
    report_path = os.path.join(BASE, "clean_report.txt")
    with open(report_path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(report_lines))
    print(f"\nReport written to: {report_path}")

    # Final sanity check
    total_kept = sum(s["after"] for s in summaries)
    total_dropped = sum(s["dropped"] for s in summaries)
    if total_kept < 5000:
        print(
            f"\n[WARN] Only {total_kept:,} rows remain — consider lowering thresholds.")
    else:
        print(
            f"\n[OK]  Cleaning complete.  {total_kept:,} rows kept  |  {total_dropped:,} dropped.")


if __name__ == "__main__":
    main()
