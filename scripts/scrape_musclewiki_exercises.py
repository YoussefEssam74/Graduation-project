"""
scrape_musclewiki_exercises.py
==============================
Scrapes the entire MuscleWiki.com exercise database via their public /api-next/ JSON API.
Bypasses Cloudflare block using `curl_cffi`.

Outputs data to:
  musclewiki_exercises.jsonl
  musclewiki_exercises.csv
"""

import csv
import json
import logging
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from curl_cffi import requests as cffi_requests

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_JSONL = PROJECT_ROOT / "musclewiki_exercises.jsonl"
OUTPUT_CSV = PROJECT_ROOT / "musclewiki_exercises.csv"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)

def fetch_all_exercises():
    session = cffi_requests.Session(impersonate="chrome110")
    limit = 50
    offset = 0
    total_fetched = 0
    all_data = []
    
    while True:
        url = f"https://musclewiki.com/api-next/exercises?limit={limit}&offset={offset}"
        log.info(f"Fetching {url}")
        
        resp = session.get(url, timeout=20)
        if resp.status_code != 200:
            log.error(f"Failed to fetch data: HTTP {resp.status_code}")
            break
            
        data = resp.json()
        results = data.get("results", [])
        if not results:
            break
            
        for ex in results:
            parsed = parse_exercise(ex)
            all_data.append(parsed)
            # Write to JSONL
            with open(OUTPUT_JSONL, "a", encoding="utf-8") as f:
                f.write(json.dumps(parsed, ensure_ascii=False) + "\n")
                
        total_fetched += len(results)
        log.info(f"Fetched {len(results)} exercises. Total so far: {total_fetched} / {data.get('count', 'Unknown')}")
        
        offset += len(results)
        time.sleep(1)
        
    return all_data

def parse_exercise(r: dict) -> dict:
    def strip_html(html_str):
        if not html_str: return ""
        return BeautifulSoup(html_str, "html.parser").get_text(separator=" ", strip=True)
    
    steps = ""
    for step in sorted(r.get("correct_steps", []), key=lambda x: x.get("order", 0)):
        steps += f"{step.get('order', '')}. {step.get('text', '')}\n"

    yt_link = ""
    for video in r.get("long_form_content", []):
        if video.get("youtube_link"):
            yt_link = video.get("youtube_link")
            break
            
    branded_video = ""
    for img in r.get("images", {}).get("male", []):
        if img.get("branded_video"):
            branded_video = img.get("branded_video")
            break

    return {
        "id": r.get("id"),
        "name": r.get("name"),
        "slug": r.get("slug"),
        "primary_muscles": ", ".join([m.get("name") for m in r.get("muscles_primary", [])]),
        "secondary_muscles": ", ".join([m.get("name") for m in r.get("muscles_secondary", [])]),
        "tertiary_muscles": ", ".join([m.get("name") for m in r.get("muscles_tertiary", [])]),
        "category_equipment": r.get("category", {}).get("name") if r.get("category") else "",
        "grips": ", ".join([g.get("name") for g in r.get("grips", [])]),
        "difficulty": r.get("difficulty", {}).get("name") if r.get("difficulty") else "",
        "force_type": r.get("force", {}).get("name") if r.get("force") else "",
        "mechanic": r.get("mechanic", {}).get("name") if r.get("mechanic") else "",
        "description": strip_html(r.get("description")),
        "steps": steps.strip(),
        "video_youtube": yt_link,
        "video_direct": branded_video,
        "scrape_timestamp": datetime.now(timezone.utc).isoformat()
    }

def convert_to_csv():
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
    if OUTPUT_JSONL.exists():
        OUTPUT_JSONL.unlink()
        
    log.info("Starting MuscleWiki API ETL Process")
    fetch_all_exercises()
    convert_to_csv()
    log.info("Done.")

if __name__ == "__main__":
    main()
