"""
scrape_mns_exercises.py
=========================
Production-grade scraper for MuscleAndStrength.com Exercises.
Bypasses Cloudflare using `curl_cffi`.

Outputs data to:
  mns_exercises.jsonl
  mns_exercises.csv
"""

import csv
import json
import logging
import random
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from bs4 import BeautifulSoup
from curl_cffi import requests as cffi_requests

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_JSONL = PROJECT_ROOT / "mns_exercises.jsonl"
OUTPUT_CSV = PROJECT_ROOT / "mns_exercises.csv"
CHECKPOINT_FILE = PROJECT_ROOT / "mns_exercises_checkpoint.txt"

BASE_URL = "https://www.muscleandstrength.com"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)


def _clean(tag: Any) -> str:
    if tag is None:
        return ""
    if isinstance(tag, str):
        return re.sub(r"\s+", " ", tag).strip()
    return re.sub(r"\s+", " ", tag.get_text(separator=" ")).strip()


def extract_section(soup: BeautifulSoup, pattern: str) -> str:
    for h in soup.find_all(re.compile(r"^h[1-6]$")):
        if re.search(pattern, h.get_text(), re.I):
            level = int(h.name[1])
            parts = []
            for sib in h.find_next_siblings():
                if sib.name and re.match(r"^h[1-6]$", sib.name) and int(sib.name[1]) <= level:
                    break
                t = _clean(sib)
                if t:
                    parts.append(t)
            return " ".join(parts)
    return ""


def gather_exercise_urls(session) -> list[str]:
    log.info("Discovering all exercise categories from main page...")
    main_url = "https://www.muscleandstrength.com/exercises"
    resp = session.get(main_url, impersonate="chrome110")
    if resp.status_code != 200:
        log.error("Failed to load main exercises page.")
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    category_links = set()
    
    # Grab all links that go to /exercises/* but not .html directly since those are specific exercises
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("/exercises/") and not href.endswith(".html") and href != "/exercises/":
            category_links.add(urljoin(BASE_URL, href))
            
    # Add main muscle categories explicitly to be safe
    for muscle in ['biceps', 'triceps', 'chest', 'back', 'shoulders', 'abs', 'glutes', 'quads', 'hamstrings', 'calves', 'traps', 'forearms', 'neck', 'abductors', 'adductors', 'lats', 'lower-back', 'middle-back']:
        category_links.add(f"{BASE_URL}/exercises/{muscle}")

    log.info(f"Found {len(category_links)} categories to crawl.")
    
    all_exercise_urls = set()
    
    for cat_url in sorted(category_links):
        page = 1
        while True:
            url = cat_url if page == 1 else f"{cat_url}?page={page}"
            log.info(f" Crawling {url} ...")
            try:
                r = session.get(url, impersonate="chrome110", timeout=15)
                if r.status_code != 200:
                    break
                
                cat_soup = BeautifulSoup(r.text, "html.parser")
                found_on_page = 0
                for a in cat_soup.select(".cell a, .node-exercise a"):
                    href = a.get("href", "")
                    if href.startswith("/exercises/") and href.endswith(".html"):
                        all_exercise_urls.add(urljoin(BASE_URL, href))
                        found_on_page += 1
                
                if found_on_page == 0:
                    break  # No more exercises on this page
                    
                # Check pagination
                pager = cat_soup.find(class_="pager")
                if not pager:
                    break
                
                next_btn = pager.find("li", class_="pager-next")
                if not next_btn:
                    break  # No 'Next' button means we're on the last page
                
                page += 1
                time.sleep(0.5)
            except Exception as e:
                log.warning(f"Error crawling {url}: {e}")
                break
                
    log.info(f"Total unique exercises found: {len(all_exercise_urls)}")
    return list(all_exercise_urls)


def scrape_exercise(session, url: str) -> dict[str, str]:
    try:
        resp = session.get(url, impersonate="chrome110", timeout=15)
        if resp.status_code != 200:
            return None
        soup = BeautifulSoup(resp.text, "html.parser")
    except Exception as e:
        log.warning(f"Error fetching {url}: {e}")
        return None

    title = ""
    for h1 in soup.find_all("h1"):
        t = _clean(h1)
        if t and "muscleandstrength" not in t.lower():
            title = t
            break
            
    if not title: return None

    # Meta
    meta = {
        "Target Muscle Group": "",
        "Exercise Type": "",
        "Equipment Required": "",
        "Mechanics": "",
        "Force Type": "",
        "Experience Level": "",
        "Secondary Muscles": ""
    }
    
    stats_block = soup.find(class_="node-stats-block")
    if stats_block:
        for li in stats_block.find_all("li"):
            label_tag = li.find("span", class_="row-label")
            if not label_tag:
                continue
            lbl = label_tag.get_text(strip=True).replace(":", "")
            val_text = li.get_text(separator=" ", strip=True)
            val = val_text[len(lbl):].strip()
            
            # Find the closest match in our predefined keys
            for k in meta.keys():
                if k.lower() in lbl.lower():
                    meta[k] = val
                    break

    instructions = extract_section(soup, r"instructions")
    tips = extract_section(soup, r"tips")
    
    # Video
    video_url = ""
    iframe = soup.find("iframe", src=re.compile(r"youtube\.com|vimeo\.com"))
    if iframe:
        video_url = iframe.get("src", "")
        if video_url and video_url.startswith("//"):
            video_url = "https:" + video_url

    return {
        "url": url,
        "title": title,
        "target_muscle_group": meta["Target Muscle Group"],
        "exercise_type": meta["Exercise Type"],
        "equipment_required": meta["Equipment Required"],
        "mechanics": meta["Mechanics"],
        "force_type": meta["Force Type"],
        "experience_level": meta["Experience Level"],
        "secondary_muscles": meta["Secondary Muscles"],
        "instructions": instructions,
        "tips": tips,
        "video_url": video_url,
        "scrape_timestamp": datetime.now(timezone.utc).isoformat()
    }

def convert_jsonl_to_csv() -> None:
    records = []
    if not OUTPUT_JSONL.exists(): return
    with open(OUTPUT_JSONL, encoding="utf-8") as f:
        for line in f:
            if line.strip():
                records.append(json.loads(line))
    
    if not records: return
    
    with open(OUTPUT_CSV, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(records[0].keys()))
        writer.writeheader()
        writer.writerows(records)
    log.info(f"Saved {len(records)} to {OUTPUT_CSV.name}")

def main():
    log.info("Starting Exercise Scraper")
    session = cffi_requests.Session(impersonate="chrome110")
    
    urls = gather_exercise_urls(session)
    if not urls:
        log.error("No URLs found. Exiting.")
        return
        
    done = set()
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
            done = {l.strip() for l in f if l.strip()}
            
    remaining = [u for u in urls if u not in done]
    log.info(f"Need to scrape {len(remaining)} exercises out of {len(urls)} total.")
    
    success = failed = 0
    for i, url in enumerate(remaining, start=1):
        log.info(f"[{i}/{len(remaining)}] {url}")
        record = scrape_exercise(session, url)
        if record:
            with open(OUTPUT_JSONL, "a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
            with open(CHECKPOINT_FILE, "a", encoding="utf-8") as f:
                f.write(url + "\n")
            success += 1
        else:
            log.warning(f"  Empty or failed: {url}")
            failed += 1
            
        time.sleep(random.uniform(0.5, 1.0))
        
        if success % 25 == 0:
            convert_jsonl_to_csv()

    convert_jsonl_to_csv()
    log.info(f"Done. Success: {success}, Failed: {failed}")

if __name__ == "__main__":
    main()
