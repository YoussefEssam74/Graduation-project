"""
scrape_mns_workouts_v3.py
=========================
Production-grade scraper for MuscleAndStrength.com workout plans (Version 3).
Bypasses Cloudflare using `curl_cffi`.
Ensures full data extraction (including author, pdf_text, schedule, workout_days).

Output
------
  mns_plans_v3.jsonl  (project root) — one JSON object per line.
"""

from __future__ import annotations

import csv
import io
import json
import logging
import os
import random
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

# Force UTF-8 on stdout
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import pypdf
from bs4 import BeautifulSoup
from curl_cffi import requests as cffi_requests

# ── Configuration ────────────────────────────────────────────────────────────
BASE_URL      = "https://www.muscleandstrength.com"

PROJECT_ROOT      = Path(__file__).resolve().parent.parent
OUTPUT_JSONL      = PROJECT_ROOT / "mns_plans_v3.jsonl"
CHECKPOINT_FILE   = PROJECT_ROOT / "mns_plans_v3_checkpoint.txt"
FAILURE_LOG       = PROJECT_ROOT / "mns_plans_v3_failures.csv"

PAGE_LOAD_TIMEOUT  = 30
MIN_DELAY          = 0.5
MAX_DELAY          = 1.5
PDF_REQUEST_TIMEOUT = 30
CHECKPOINT_INTERVAL = 10

PDF_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
}

# ── Logging ──────────────────────────────────────────────────────────────────
LOG_FILE = PROJECT_ROOT / "mns_scrape_v3.log"

for h in logging.root.handlers[:]:
    logging.root.removeHandler(h)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
#  URL discovery
# ─────────────────────────────────────────────────────────────────────────────
URL_LIST_FILE = PROJECT_ROOT / "mns_plan_urls.txt"
EXISTING_CSV = PROJECT_ROOT / "mns_workout_plans_flat.csv"
ROUTINES_CSV = PROJECT_ROOT / "muscle_and_strength_routines.csv"

def load_all_plan_urls() -> list[str]:
    seen: set[str] = set()
    urls: list[str] = []

    def _add(url: str) -> None:
        url = url.strip()
        if url and url not in seen:
            seen.add(url)
            urls.append(url)

    if URL_LIST_FILE.exists():
        for line in URL_LIST_FILE.read_text(encoding="utf-8").splitlines():
            _add(line)

    if EXISTING_CSV.exists():
        with open(EXISTING_CSV, encoding="utf-8-sig", errors="ignore") as f:
            for row in csv.DictReader(f):
                _add(row.get("routine_url", ""))

    if ROUTINES_CSV.exists():
        with open(ROUTINES_CSV, encoding="utf-8-sig", errors="ignore") as f:
            for row in csv.DictReader(f):
                _add(row.get("URL", ""))

    log.info("Loaded %d unique plan URLs.", len(urls))
    return urls


# ─────────────────────────────────────────────────────────────────────────────
#  PDF extraction
# ─────────────────────────────────────────────────────────────────────────────
def extract_pdf_text(session, pdf_url: str) -> str | None:
    if not pdf_url:
        return None
    try:
        resp = session.get(pdf_url, timeout=PDF_REQUEST_TIMEOUT, impersonate="chrome110")
        if resp.status_code != 200:
            return None
        buf = io.BytesIO(resp.content)
        reader = pypdf.PdfReader(buf)
        parts = [pg.extract_text() for pg in reader.pages if pg.extract_text()]
        return "\n\n".join(parts) or None
    except Exception as exc:
        log.warning("PDF extraction error for %s: %s", pdf_url, exc)
    return None


# ─────────────────────────────────────────────────────────────────────────────
#  HTML parsing helpers
# ─────────────────────────────────────────────────────────────────────────────
def _clean(tag: Any) -> str:
    if tag is None:
        return ""
    if isinstance(tag, str):
        return re.sub(r"\s+", " ", tag).strip()
    return re.sub(r"\s+", " ", tag.get_text(separator=" ")).strip()


def _section_text(soup: BeautifulSoup, pattern: str) -> str:
    for h in soup.find_all(re.compile(r"^h[1-6]$")):
        if re.search(pattern, h.get_text(), re.I):
            level = int(h.name[1])
            parts: list[str] = []
            for sib in h.find_next_siblings():
                if sib.name and re.match(r"^h[1-6]$", sib.name) and int(sib.name[1]) <= level:
                    break
                t = _clean(sib)
                if t:
                    parts.append(t)
            return " ".join(parts)
    return ""


def _parse_summary(soup: BeautifulSoup) -> dict[str, str]:
    result: dict[str, str] = {}
    LABEL_MAP = {
        "main goal":          "main_goal",
        "workout type":       "workout_type",
        "training level":     "training_level",
        "program duration":   "program_duration",
        "days per week":      "days_per_week",
        "time per workout":   "time_per_workout",
        "equipment required": "equipment",
        "target gender":      "target_gender",
    }

    stats_block = soup.find(class_="node-stats-block")
    if stats_block:
        for li in stats_block.find_all("li"):
            label_tag = li.find("span", class_="row-label")
            if not label_tag:
                continue
            label_text = label_tag.get_text(strip=True).lower()

            matched_key = None
            for lbl, key in LABEL_MAP.items():
                if label_text == lbl or label_text.startswith(lbl):
                    matched_key = key
                    break
            if matched_key is None:
                continue

            field_item = li.find(class_="field-item")
            if field_item:
                val = _clean(field_item)
            else:
                full_text = li.get_text(separator=" ", strip=True)
                label_part = label_tag.get_text(strip=True)
                val = full_text[len(label_part):].strip()

            if val and len(val) < 300:
                result[matched_key] = val

        if "equipment" not in result:
            for li in stats_block.find_all("li"):
                lbl = li.find("span", class_="row-label")
                if lbl and "equipment" in lbl.get_text(strip=True).lower():
                    items = [_clean(fi) for fi in li.find_all(class_="field-item")]
                    result["equipment"] = ", ".join(i for i in items if i)
                    break

        supps: list[str] = []
        for span in stats_block.find_all("span", class_="supplement"):
            s = _clean(span)
            if s and s not in supps:
                supps.append(s)
        if supps:
            result["recommended_supps"] = ", ".join(supps)

    # Fallback
    if not result:
        for span in soup.find_all("span", class_="row-label"):
            label_text = span.get_text(strip=True).lower()
            for lbl, key in LABEL_MAP.items():
                if label_text.startswith(lbl) and key not in result:
                    li = span.find_parent("li")
                    if li:
                        fi = li.find(class_="field-item")
                        val = _clean(fi) if fi else li.get_text(strip=True).replace(span.get_text(strip=True), "").strip()
                        if val:
                            result[key] = val

    pdf_a = soup.find("a", href=re.compile(r"\.pdf($|\?)", re.I))
    if pdf_a:
        result["pdf_url"] = urljoin(BASE_URL, pdf_a["href"])

    return result


def _parse_exercise_tables(soup: BeautifulSoup) -> list[dict[str, Any]]:
    days: list[dict[str, Any]] = []

    for table in soup.find_all("table"):
        day_label = ""
        for prev_h in table.find_all_previous(re.compile(r"^h[2-6]$")):
            t = _clean(prev_h)
            if t:
                day_label = t
                break

        thead = table.find("thead")
        headers: list[str] = [_clean(th) for th in thead.find_all(["th", "td"])] if thead else []

        exercises: list[dict[str, str]] = []
        tbody = table.find("tbody") or table
        for tr in tbody.find_all("tr"):
            cells = [_clean(td) for td in tr.find_all(["td", "th"])]
            if not any(cells):
                continue

            ex: dict[str, str] = {k: "" for k in ("name", "sets", "reps", "rest", "notes", "tempo", "rpe")}

            if headers:
                for i, h in enumerate(headers):
                    if i >= len(cells):
                        break
                    hl = h.lower()
                    if "exercise" in hl or (i == 0 and not ex["name"]):
                        ex["name"] = cells[i]
                    elif "set" in hl:
                        ex["sets"] = cells[i]
                    elif "rep" in hl:
                        ex["reps"] = cells[i]
                    elif "rest" in hl:
                        ex["rest"] = cells[i]
                    elif "note" in hl or "comment" in hl:
                        ex["notes"] = cells[i]
                    elif "tempo" in hl:
                        ex["tempo"] = cells[i]
                    elif "rpe" in hl or "intensity" in hl:
                        ex["rpe"] = cells[i]
            else:
                for i, k in enumerate(["name", "sets", "reps", "rest", "notes"]):
                    if i < len(cells):
                        ex[k] = cells[i]

            if ex["name"] and ex["name"].lower() not in ("exercise", ""):
                exercises.append(ex)

        if exercises:
            days.append({
                "day_label": day_label or f"Workout {len(days) + 1}",
                "exercises": exercises,
            })

    return days


_DAY_RE = re.compile(r"\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|day \d+)\b", re.I)

def _parse_schedules(soup: BeautifulSoup) -> list[list[str]]:
    schedules: list[list[str]] = []
    for ul in soup.find_all(["ul", "ol"]):
        items = [_clean(li) for li in ul.find_all("li")]
        if sum(1 for it in items if _DAY_RE.search(it)) >= 3:
            cleaned = [it for it in items if it]
            if cleaned not in schedules:
                schedules.append(cleaned)
    return schedules


def _parse_author(soup: BeautifulSoup) -> str:
    a = soup.find("a", href=re.compile(r"/authors/", re.I))
    if a:
        return _clean(a)
    for tag in soup.find_all(["span", "div", "p", "a"]):
        txt = tag.get_text(strip=True)
        m = re.match(r"(?:written\s+by|by)\s+([A-Z][^,\n<]{2,60})", txt, re.I)
        if m:
            return m.group(1).strip()
    return ""


def _parse_categories(soup: BeautifulSoup) -> list[str]:
    cats: list[str] = []
    for a in soup.find_all("a", href=re.compile(r"/workouts/[^/]+$", re.I)):
        t = _clean(a)
        if t and t.lower() not in ("view all", "workouts", "home", "workout-routines"):
            if t not in cats:
                cats.append(t)
    return cats[:8]


def scrape_plan(session, url: str) -> dict[str, Any] | None:
    try:
        resp = session.get(url, timeout=PAGE_LOAD_TIMEOUT, impersonate="chrome110")
        if resp.status_code != 200:
            log.warning("HTTP %s for %s", resp.status_code, url)
            return None
        html = resp.text
    except Exception as exc:
        log.warning("Request error [%s]: %s", url, exc)
        return None

    soup = BeautifulSoup(html, "html.parser")

    title = ""
    for h1 in soup.find_all("h1"):
        t = _clean(h1)
        if t and "muscleandstrength.com" not in t.lower() and len(t) > 5:
            title = t
            break
    if not title:
        og = soup.find("meta", property="og:title")
        if og:
            title = og.get("content", "").strip()

    summary   = _parse_summary(soup)
    equip_raw = summary.get("equipment", "")
    equipment = [e.strip() for e in re.split(r"[,\n]", equip_raw) if e.strip()]
    supps_raw = summary.get("recommended_supps", "")
    supps     = [s.strip() for s in re.split(r"[,\n]", supps_raw) if s.strip()]

    pdf_url  = summary.get("pdf_url", "")
    pdf_text = extract_pdf_text(session, pdf_url) if pdf_url else None

    # Construct target_output_schema natively based on the retrieved metadata
    target_schema = {
        "title": title,
        "goal": summary.get("main_goal", ""),
        "workout_type": summary.get("workout_type", ""),
        "training_level": summary.get("training_level", ""),
        "program_duration": summary.get("program_duration", ""),
        "days_per_week": summary.get("days_per_week", ""),
        "time_per_workout": summary.get("time_per_workout", ""),
        "equipment_required": equip_raw,
        "target_gender": summary.get("target_gender", ""),
        "recommended_supps": supps_raw
    }

    return {
        "url":               url,
        "title":             title,
        "main_goal":         summary.get("main_goal", ""),
        "workout_type":      summary.get("workout_type", ""),
        "training_level":    summary.get("training_level", ""),
        "program_duration":  summary.get("program_duration", ""),
        "days_per_week":     summary.get("days_per_week", ""),
        "time_per_workout":  summary.get("time_per_workout", ""),
        "equipment":         equipment,
        "target_gender":     summary.get("target_gender", ""),
        "recommended_supps": supps,
        "pdf_url":           pdf_url or None,
        "pdf_text":          pdf_text,
        "description":       _section_text(soup, r"workout\s+description"),
        "overview":          _section_text(soup, r"overview"),
        "nutrition_notes":   _section_text(soup, r"^nutrition"),
        "cardio_notes":      _section_text(soup, r"^cardio|the\s+cardio"),
        "recovery_notes":    _section_text(soup, r"^recovery"),
        "schedule_examples": _parse_schedules(soup),
        "workout_days":      _parse_exercise_tables(soup),
        "target_output_schema": target_schema,
        "author":            _parse_author(soup),
        "categories":        _parse_categories(soup),
        "scrape_timestamp":  datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Main Loop
# ─────────────────────────────────────────────────────────────────────────────
def load_checkpoint() -> set[str]:
    if not CHECKPOINT_FILE.exists():
        return set()
    return {ln.strip() for ln in CHECKPOINT_FILE.read_text(encoding="utf-8").splitlines() if ln.strip()}

def save_checkpoint(url: str) -> None:
    with open(CHECKPOINT_FILE, "a", encoding="utf-8") as f:
        f.write(url + "\n")

def append_record(record: dict[str, Any]) -> None:
    with open(OUTPUT_JSONL, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

def log_failure(url: str, reason: str) -> None:
    write_header = not FAILURE_LOG.exists()
    with open(FAILURE_LOG, "a", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        if write_header:
            w.writerow(["url", "reason", "timestamp"])
        w.writerow([url, reason[:300], datetime.now(timezone.utc).isoformat()])


def main() -> None:
    log.info("=" * 60)
    log.info("MuscleAndStrength Workout Plan Scraper v3 (curl_cffi)")
    log.info("Output  : %s", OUTPUT_JSONL)
    log.info("=" * 60)

    done = load_checkpoint()
    log.info("Checkpoint: %d plans already done.", len(done))

    all_urls = load_all_plan_urls()
    remaining = [u for u in all_urls if u not in done]

    log.info("URLs: %d total | %d to scrape | %d already done.", len(all_urls), len(remaining), len(all_urls) - len(remaining))

    if not remaining:
        log.info("Nothing new to scrape. Exiting.")
        return

    session = cffi_requests.Session(impersonate="chrome110")
    success = failed = 0

    for i, url in enumerate(remaining, start=1):
        log.info("[%d/%d] %s", i, len(remaining), url)
        try:
            record = scrape_plan(session, url)

            if record is None:
                log.warning("  => No data returned (timeout / nav error).")
                log_failure(url, "no_data")
                failed += 1
            elif not record["title"]:
                log.warning("  => Empty title - possible redirect or block.")
                log_failure(url, "empty_title")
                failed += 1
            else:
                append_record(record)
                save_checkpoint(url)
                success += 1
                log.info(
                    "  OK | %s | pdf_text=%s | days=%d",
                    record["title"][:40],
                    "yes" if record["pdf_text"] else "no",
                    len(record["workout_days"])
                )
        except Exception as exc:
            log.exception("  => Unhandled error: %s", exc)
            log_failure(url, str(exc)[:300])
            failed += 1

        time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))

        if i % CHECKPOINT_INTERVAL == 0:
            log.info("--- Progress: %d ok | %d failed | %d remaining ---", success, failed, len(remaining) - i)

    log.info("=" * 60)
    log.info("DONE.  Success: %d  |  Failed: %d", success, failed)
    log.info("=" * 60)


if __name__ == "__main__":
    main()
