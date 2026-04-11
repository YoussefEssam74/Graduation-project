"""
scrape_mns_workouts_v2.py
=========================
Production-grade scraper for MuscleAndStrength.com workout plans.
Uses Playwright (headless Chromium) to bypass anti-bot 403 blocks.

URL Source
----------
Reads plan URLs from the existing `mns_workout_plans_flat.csv` (1033 plans already
discovered). Optionally also crawls the XML sitemap for any missed URLs.

Output
------
  mns_plans_v2.jsonl  (project root) — one JSON object per line.

Record Schema
-------------
{
  "url", "title", "main_goal", "workout_type", "training_level",
  "program_duration", "days_per_week", "time_per_workout",
  "equipment":         [str],
  "target_gender",
  "recommended_supps": [str],
  "pdf_url",           str | null,
  "pdf_text",          str | null,
  "description",       # Workout Description section
  "overview",          # Overview section
  "nutrition_notes",
  "cardio_notes",
  "recovery_notes",
  "schedule_examples": [[str]],
  "workout_days": [
      {"day_label": str, "exercises": [{"name","sets","reps","rest","notes","tempo","rpe"}]}
  ],
  "author",
  "categories": [str],
  "scrape_timestamp"
}
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
from urllib.parse import urljoin, urlparse

# Force UTF-8 on stdout
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import requests
from bs4 import BeautifulSoup, Tag

# ── Optional PDF extraction ──────────────────────────────────────────────────
try:
    import pdfplumber
    PDF_BACKEND = "pdfplumber"
except ImportError:
    pdfplumber = None
    try:
        import pypdf
        PDF_BACKEND = "pypdf"
    except ImportError:
        pypdf = None
        PDF_BACKEND = None

# ── Playwright ───────────────────────────────────────────────────────────────
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeoutError

# ── Configuration ────────────────────────────────────────────────────────────
BASE_URL      = "https://www.muscleandstrength.com"

PROJECT_ROOT      = Path(__file__).resolve().parent.parent
EXISTING_CSV      = PROJECT_ROOT / "mns_workout_plans_flat.csv"    # URL source
OUTPUT_JSONL      = PROJECT_ROOT / "mns_plans_v2.jsonl"
CHECKPOINT_FILE   = PROJECT_ROOT / "mns_plans_v2_checkpoint.txt"
FAILURE_LOG       = PROJECT_ROOT / "mns_plans_v2_failures.csv"

PAGE_LOAD_TIMEOUT  = 30_000   # ms
WAIT_AFTER_NAV     = 2_500    # ms for JS to settle
MIN_DELAY          = 2.0      # seconds between plan pages
MAX_DELAY          = 4.0
PDF_REQUEST_TIMEOUT = 45      # seconds
CHECKPOINT_INTERVAL = 25      # log progress every N plans

PDF_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
}

# ── Logging ──────────────────────────────────────────────────────────────────
LOG_FILE = PROJECT_ROOT / "mns_scrape_v2.log"

# Remove old handlers if re-running in interactive context
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
#  URL discovery: read from existing flat CSV + optional sitemap supplement
# ─────────────────────────────────────────────────────────────────────────────
URL_LIST_FILE = PROJECT_ROOT / "mns_plan_urls.txt"
ROUTINES_CSV  = PROJECT_ROOT / "muscle_and_strength_routines.csv"


def load_all_plan_urls() -> list[str]:
    """
    Collect unique plan URLs from all available sources:
      1. mns_plan_urls.txt  (pre-built combined list)
      2. mns_workout_plans_flat.csv  (routine_url column)
      3. muscle_and_strength_routines.csv  (URL column)
    """
    seen: set[str] = set()
    urls: list[str] = []

    def _add(url: str) -> None:
        url = url.strip()
        if url and url not in seen:
            seen.add(url)
            urls.append(url)

    # Source 1: pre-built URL list
    if URL_LIST_FILE.exists():
        for line in URL_LIST_FILE.read_text(encoding="utf-8").splitlines():
            _add(line)

    # Source 2: flat CSV
    if EXISTING_CSV.exists():
        with open(EXISTING_CSV, encoding="utf-8-sig", errors="ignore") as f:
            for row in csv.DictReader(f):
                _add(row.get("routine_url", ""))

    # Source 3: routines CSV
    if ROUTINES_CSV.exists():
        with open(ROUTINES_CSV, encoding="utf-8-sig", errors="ignore") as f:
            for row in csv.DictReader(f):
                _add(row.get("URL", ""))

    log.info("Loaded %d unique plan URLs from all sources.", len(urls))
    return urls


def fetch_sitemap_urls() -> list[str]:
    """Try to get additional plan URLs from the XML sitemap."""
    extras: list[str] = []
    sitemap_urls = [
        "https://www.muscleandstrength.com/sitemap.xml",
        "https://www.muscleandstrength.com/workouts-sitemap.xml",
    ]
    for sm_url in sitemap_urls:
        try:
            resp = requests.get(sm_url, headers=PDF_HEADERS, timeout=15)
            if resp.status_code != 200:
                continue
            # Extract <loc> tags containing /workouts/
            locs = re.findall(r"<loc>(https?://[^<]+/workouts/[^<]+)</loc>", resp.text)
            log.info("Sitemap %s: %d workout URLs found.", sm_url, len(locs))
            extras.extend(locs)
        except Exception as exc:
            log.debug("Sitemap fetch failed for %s: %s", sm_url, exc)
    return extras


# ─────────────────────────────────────────────────────────────────────────────
#  PDF extraction
# ─────────────────────────────────────────────────────────────────────────────
def extract_pdf_text(pdf_url: str) -> str | None:
    if not pdf_url or PDF_BACKEND is None:
        return None
    try:
        resp = requests.get(pdf_url, headers=PDF_HEADERS, timeout=PDF_REQUEST_TIMEOUT)
        if resp.status_code != 200:
            return None
        buf = io.BytesIO(resp.content)
        if PDF_BACKEND == "pdfplumber":
            with pdfplumber.open(buf) as pdf:
                parts = [p.extract_text() for p in pdf.pages if p.extract_text()]
            return "\n\n".join(parts) or None
        elif PDF_BACKEND == "pypdf":
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
    """Return all text under a heading matching pattern, until next same/higher heading."""
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
    """
    Extract Workout Summary metadata.

    Drupal HTML structure:
      <div class="node-stats-block">
        <ul>
          <li>
            <span class="row-label">Main Goal</span>
            <div class="field-item even">Lose Fat</div>
          </li>
          <li><span class="row-label">Program Duration</span> 8 weeks</li>
          ...
        </ul>
        <span class="supplement"><a>Protein</a></span> ...
      </div>
    """
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

        # Equipment: collect ALL field-item values (multi-valued field)
        if "equipment" not in result:
            for li in stats_block.find_all("li"):
                lbl = li.find("span", class_="row-label")
                if lbl and "equipment" in lbl.get_text(strip=True).lower():
                    items = [_clean(fi) for fi in li.find_all(class_="field-item")]
                    result["equipment"] = ", ".join(i for i in items if i)
                    break

        # Recommended Supps: <span class="supplement">
        supps: list[str] = []
        for span in stats_block.find_all("span", class_="supplement"):
            s = _clean(span)
            if s and s not in supps:
                supps.append(s)
        if supps:
            result["recommended_supps"] = ", ".join(supps)

    # Fallback: scan any span.row-label on the page
    if not result:
        for span in soup.find_all("span", class_="row-label"):
            label_text = span.get_text(strip=True).lower()
            for lbl, key in LABEL_MAP.items():
                if label_text.startswith(lbl) and key not in result:
                    li = span.find_parent("li")
                    if li:
                        fi = li.find(class_="field-item")
                        val = _clean(fi) if fi else \
                              li.get_text(strip=True).replace(span.get_text(strip=True), "").strip()
                        if val:
                            result[key] = val

    # PDF link — anywhere on page
    pdf_a = soup.find("a", href=re.compile(r"\.pdf($|\?)", re.I))
    if pdf_a:
        result["pdf_url"] = urljoin(BASE_URL, pdf_a["href"])

    return result


def _parse_exercise_tables(soup: BeautifulSoup) -> list[dict[str, Any]]:
    """Extract exercise tables paired with their nearest preceding heading."""
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

            # Skip pure header rows that re-appear in tbody
            if ex["name"] and ex["name"].lower() not in ("exercise", ""):
                exercises.append(ex)

        if exercises:
            days.append({
                "day_label": day_label or f"Workout {len(days) + 1}",
                "exercises": exercises,
            })

    return days


_DAY_RE = re.compile(
    r"\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b", re.I
)


def _parse_schedules(soup: BeautifulSoup) -> list[list[str]]:
    """Extract training schedule option lists."""
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


# ─────────────────────────────────────────────────────────────────────────────
#  Playwright helpers
# ─────────────────────────────────────────────────────────────────────────────
def _get_soup(page, url: str) -> BeautifulSoup | None:
    try:
        # 'load' fires reliably; networkidle can hang under Cloudflare challenge
        page.goto(url, timeout=PAGE_LOAD_TIMEOUT, wait_until="load")
        # Extra wait for the article stats block as a content-ready signal
        try:
            page.wait_for_selector(".node-stats-block", timeout=6_000)
        except PWTimeoutError:
            pass  # proceed even without the stats block (older plan formats)
        return BeautifulSoup(page.content(), "html.parser")
    except PWTimeoutError:
        log.warning("Timeout: %s", url)
        return None
    except Exception as exc:
        log.warning("Page error [%s]: %s", url, exc)
        return None


def scrape_plan(page, url: str) -> dict[str, Any] | None:
    soup = _get_soup(page, url)
    if soup is None:
        return None

    # The site has a header logo <h1> containing "www.muscleandstrength.com"
    # The actual article title is in an <h1 itemprop="name"> or the first h1
    # that does NOT contain the domain name
    title = ""
    for h1 in soup.find_all("h1"):
        t = _clean(h1)
        if t and "muscleandstrength.com" not in t.lower() and len(t) > 5:
            title = t
            break
    # Fallback: og:title meta tag
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
    pdf_text: str | None = None
    if pdf_url:
        pdf_text = extract_pdf_text(pdf_url)

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
        "author":            _parse_author(soup),
        "categories":        _parse_categories(soup),
        "scrape_timestamp":  datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
#  Checkpoint / persistence
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


# ─────────────────────────────────────────────────────────────────────────────
#  Main
# ─────────────────────────────────────────────────────────────────────────────
def main() -> None:
    log.info("=" * 60)
    log.info("MuscleAndStrength Workout Plan Scraper v2 (Playwright)")
    log.info("Output  : %s", OUTPUT_JSONL)
    log.info("PDF lib : %s", PDF_BACKEND or "None - install pdfplumber")
    log.info("=" * 60)

    # ── Load checkpoint ───────────────────────────────────────────────────
    done = load_checkpoint()
    log.info("Checkpoint: %d plans already done.", len(done))

    # ── Build URL list ────────────────────────────────────────────────────
    all_urls: list[str] = []
    seen_urls: set[str] = set()

    # Primary sources: existing CSVs + pre-built URL list
    for url in load_all_plan_urls():
        if url not in seen_urls:
            seen_urls.add(url)
            all_urls.append(url)

    # Supplement: sitemap (adds any new plans published after the CSV was built)
    for url in fetch_sitemap_urls():
        norm = url.rstrip("/")
        if norm not in seen_urls:
            seen_urls.add(norm)
            all_urls.append(norm)

    remaining = [u for u in all_urls if u not in done]
    log.info(
        "URLs: %d total | %d to scrape | %d already done.",
        len(all_urls), len(remaining), len(all_urls) - len(remaining),
    )

    if not remaining:
        log.info("Nothing new to scrape. Exiting.")
        return

    # ── Playwright scraping ───────────────────────────────────────────────
    CONTEXT_REFRESH_EVERY = 50   # create a fresh browser context every N plans
    WARMUP_URL = "https://www.muscleandstrength.com/workouts/beginner-fat-loss-workout"

    def _make_context(browser):
        ctx = browser.new_context(
            viewport={"width": 1280, "height": 900},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            locale="en-US",
        )
        pg = ctx.new_page()
        # Homepage warmup: establish session cookies / pass Cloudflare handshake
        try:
            pg.goto(WARMUP_URL, timeout=PAGE_LOAD_TIMEOUT, wait_until="load")
            pg.wait_for_selector(".node-stats-block", timeout=10_000)
            log.info("  [warmup] Browser context ready.")
        except Exception:
            log.warning("  [warmup] Warmup page did not fully load - continuing anyway.")
        return ctx, pg

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context, page = _make_context(browser)

        success = failed = 0

        for i, url in enumerate(remaining, start=1):
            # Periodic context refresh to prevent session expiry / bot detection
            if i > 1 and (i - 1) % CONTEXT_REFRESH_EVERY == 0:
                log.info("--- Refreshing browser context after %d plans ---", i - 1)
                try:
                    context.close()
                except Exception:
                    pass
                context, page = _make_context(browser)
                time.sleep(3)

            log.info("[%d/%d] %s", i, len(remaining), url)
            try:
                record = scrape_plan(page, url)

                # Retry once with a fresh context on empty-title failures
                if record is not None and not record["title"]:
                    log.warning("  => Empty title on first attempt - retrying with fresh context.")
                    try:
                        context.close()
                    except Exception:
                        pass
                    context, page = _make_context(browser)
                    time.sleep(2)
                    record = scrape_plan(page, url)

                if record is None:
                    log.warning("  => No data returned (timeout / nav error).")
                    log_failure(url, "no_data")
                    failed += 1
                elif not record["title"]:
                    log.warning("  => Empty title after retry - skipping.")
                    log_failure(url, "empty_title_retry")
                    failed += 1
                else:
                    append_record(record)
                    save_checkpoint(url)
                    success += 1
                    log.info(
                        "  OK | %r | days=%d | pdf=%s",
                        record["title"][:60],
                        len(record["workout_days"]),
                        "yes" if record["pdf_url"] else "no",
                    )
            except Exception as exc:
                log.exception("  => Unhandled error: %s", exc)
                log_failure(url, str(exc)[:300])
                failed += 1

            time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))

            if i % CHECKPOINT_INTERVAL == 0:
                log.info("--- Progress: %d ok | %d failed | %d remaining ---",
                         success, failed, len(remaining) - i)

        try:
            context.close()
        except Exception:
            pass
        browser.close()

    log.info("=" * 60)
    log.info("DONE.  Success: %d  |  Failed: %d", success, failed)
    log.info("Output: %s", OUTPUT_JSONL)
    log.info("=" * 60)


if __name__ == "__main__":
    main()
