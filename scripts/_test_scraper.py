"""Quick batch test - scrape 5 plans to validate the full pipeline in batch mode."""
import sys, json, time, random
sys.path.insert(0, 'scripts')
sys.stdout.reconfigure(encoding='utf-8')

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeoutError
from scrape_mns_workouts_v2 import scrape_plan, _get_soup, PAGE_LOAD_TIMEOUT

TEST_URLS = [
    'https://www.muscleandstrength.com/workouts/muscle-strength-full-body-workout-routine',
    'https://www.muscleandstrength.com/workouts/beginner-fat-loss-workout',
    'https://www.muscleandstrength.com/workouts/phul-workout',
    'https://www.muscleandstrength.com/workouts/10-week-mass-building-program.html',
    'https://www.muscleandstrength.com/workouts/muscle-and-strength-womens-workout',
]

WARMUP_URL = 'https://www.muscleandstrength.com/workouts/beginner-fat-loss-workout'

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    ctx = browser.new_context(
        viewport={"width": 1280, "height": 900},
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        locale='en-US'
    )
    page = ctx.new_page()

    # Warmup
    print("Warming up...")
    page.goto(WARMUP_URL, timeout=PAGE_LOAD_TIMEOUT, wait_until='load')
    page.wait_for_selector('.node-stats-block', timeout=10000)
    print("Warmup done.")

    for i, url in enumerate(TEST_URLS, 1):
        slug = url.split('/')[-1]
        r = scrape_plan(page, url)
        if r:
            print(f"[{i}] {slug}")
            print(f"     title={r['title'][:55]}")
            print(f"     goal={r['main_goal']} | level={r['training_level']} | days={len(r['workout_days'])} | pdf={bool(r['pdf_url'])}")
        else:
            print(f"[{i}] FAILED: {slug}")
        time.sleep(random.uniform(2, 3))

    ctx.close()
    browser.close()
print("Batch test complete.")
