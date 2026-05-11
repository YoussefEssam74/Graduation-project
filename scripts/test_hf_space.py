"""
Quick test script to verify HF Space SSE queue protocol.
Run: python scripts/test_hf_space.py
"""
import requests
import json
import time
import random
import string

BASE = "https://youssefeemad-nutrition-generator.hf.space"

def random_session():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))

request_data = {
    "member_id": "test1",
    "gender": "male",
    "age": 25,
    "weight_kg": 75.0,
    "height_cm": 175.0,
    "goal": "weight_loss",
    "activity_level": "moderate",
    "cuisine_preference": "egyptian",
    "health_conditions": [],
    "allergies": [],
    "dietary_preferences": []
}

session_hash = random_session()
print(f"Session hash: {session_hash}")

# Step 1: Join queue
join_payload = {
    "data": [json.dumps(request_data)],
    "fn_index": 0,
    "session_hash": session_hash
}
print("Joining queue...")
r = requests.post(f"{BASE}/queue/join", json=join_payload, timeout=30)
print(f"Join status: {r.status_code}")
print(f"Join response: {r.text[:500]}")

# Step 2: Read SSE stream
print("\nListening to SSE stream (timeout 30s to see events)...")
start = time.time()
try:
    with requests.get(
        f"{BASE}/queue/data?session_hash={session_hash}",
        stream=True,
        timeout=30,
        headers={"Accept": "text/event-stream"}
    ) as resp:
        print(f"SSE status: {resp.status_code}")
        for line in resp.iter_lines(decode_unicode=True):
            if time.time() - start > 30:
                print("30s limit reached, stopping")
                break
            if line:
                print(f"  SSE line: {line[:300]}")
                if "process_completed" in line or "complete" in line.lower():
                    print("GOT COMPLETION EVENT")
                    break
except Exception as e:
    print(f"SSE error: {e}")
