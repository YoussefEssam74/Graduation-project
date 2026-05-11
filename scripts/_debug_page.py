"""Test requests with full browser headers to bypass 403."""
import sys, requests
sys.stdout.reconfigure(encoding='utf-8')
from bs4 import BeautifulSoup

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
}

session = requests.Session()
session.headers.update(HEADERS)

URL = 'https://www.muscleandstrength.com/workouts/muscle-strength-full-body-workout-routine'

# First visit homepage to get cookies
print("Visiting homepage...")
r = session.get('https://www.muscleandstrength.com/', timeout=15)
print(f"Homepage status: {r.status_code}")
print(f"Cookies set: {dict(session.cookies)}")

# Now visit the plan page
import time; time.sleep(2)
print("\nVisiting plan page...")
r2 = session.get(URL, timeout=15)
print(f"Plan page status: {r2.status_code}")

if r2.status_code == 200:
    soup = BeautifulSoup(r2.text, 'html.parser')
    h1s = [h.get_text(strip=True)[:80] for h in soup.find_all('h1')]
    print("H1s:", h1s[:3])
    stats = soup.find(class_='node-stats-block')
    print("node-stats-block:", stats is not None)
    og = soup.find('meta', property='og:title')
    print("og:title:", og.get('content') if og else 'NOT FOUND')
else:
    print("Response text preview:", r2.text[:300])
