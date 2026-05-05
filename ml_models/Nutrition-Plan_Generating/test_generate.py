"""
Quick test script for the nutrition plan API.
Run with: python test_generate.py
"""
import json
import urllib.request
import urllib.error
import time
import sys

BASE = "http://localhost:5301"


def post(endpoint, body):
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        BASE + endpoint,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=1200) as resp:
        return json.loads(resp.read())


def get(endpoint):
    with urllib.request.urlopen(BASE + endpoint, timeout=30) as resp:
        return json.loads(resp.read())


# ── Health ────────────────────────────────────────────────────────────────────
print("=" * 60)
print("1. GET /health")
h = get("/health")
print(json.dumps(h, indent=2))

# ── Test 1: Weight loss, Egyptian male, no restrictions ───────────────────────
print("\n" + "=" * 60)
print("2. POST /generate — weight_loss / male / Egyptian")
t0 = time.time()
try:
    r1 = post("/generate", {
        "member_id": "test_001",
        "gender": "male",
        "age": 25,
        "weight_kg": 90.0,
        "height_cm": 178.0,
        "goal": "weight_loss",
        "activity_level": "moderate",
        "cuisine_preference": "egyptian",
        "health_conditions": [],
        "allergies": [],
    })
    elapsed = time.time() - t0
    print(f"  Status: SUCCESS  ({elapsed:.1f}s)")
    print(f"  daily_calories : {r1['daily_calories']}")
    print(f"  generation_ms  : {r1['generation_ms']}")
    plan = r1["plan"]
    days = plan.get("days", [])
    print(f"  plan days      : {len(days)}")
    print(f"  foods_to_avoid : {plan.get('foods_to_avoid', [])}")
    for d in days:
        meals = list(d.get("meals", {}).keys())
        kcal = d.get("total_calories", "?")
        macros = d.get("macros", {})
        print(f"    Day {d.get('day','?')} ({kcal} kcal) | meals: {meals}")
        print(
            f"      macros → protein:{macros.get('protein_g','?')}g  carbs:{macros.get('carbs_g','?')}g  fat:{macros.get('fat_g','?')}g")
    with open("test1_result.json", "w", encoding="utf-8") as f:
        json.dump(r1, f, ensure_ascii=False, indent=2)
    print("  Saved → test1_result.json")
except urllib.error.HTTPError as e:
    print(f"  ERROR {e.code}: {e.read().decode()}")
except Exception as e:
    print(f"  ERROR: {e}")

# ── Test 2: Diabetes + hypertension, female, muscle gain ─────────────────────
print("\n" + "=" * 60)
print("3. POST /generate — maintenance / female / diabetes + hypertension")
t0 = time.time()
try:
    r2 = post("/generate", {
        "member_id": "test_002",
        "gender": "female",
        "age": 45,
        "weight_kg": 75.0,
        "height_cm": 162.0,
        "goal": "maintenance",
        "activity_level": "light",
        "cuisine_preference": "egyptian",
        "health_conditions": ["diabetes", "hypertension"],
        "allergies": [],
    })
    elapsed = time.time() - t0
    print(f"  Status: SUCCESS  ({elapsed:.1f}s)")
    print(f"  daily_calories : {r2['daily_calories']}")
    print(f"  generation_ms  : {r2['generation_ms']}")
    plan = r2["plan"]
    days = plan.get("days", [])
    print(f"  plan days      : {len(days)}")
    print(f"  foods_to_avoid : {plan.get('foods_to_avoid', [])}")
    for d in days:
        meals = list(d.get("meals", {}).keys())
        kcal = d.get("total_calories", "?")
        macros = d.get("macros", {})
        print(f"    Day {d.get('day','?')} ({kcal} kcal) | meals: {meals}")
        print(
            f"      macros → protein:{macros.get('protein_g','?')}g  carbs:{macros.get('carbs_g','?')}g  fat:{macros.get('fat_g','?')}g")
    with open("test2_result.json", "w", encoding="utf-8") as f:
        json.dump(r2, f, ensure_ascii=False, indent=2)
    print("  Saved → test2_result.json")
except urllib.error.HTTPError as e:
    print(f"  ERROR {e.code}: {e.read().decode()}")
except Exception as e:
    print(f"  ERROR: {e}")

# ── Test 3: Muscle gain, gluten allergy ──────────────────────────────────────
print("\n" + "=" * 60)
print("4. POST /generate — muscle_gain / male / gluten allergy")
t0 = time.time()
try:
    r3 = post("/generate", {
        "member_id": "test_003",
        "gender": "male",
        "age": 28,
        "weight_kg": 75.0,
        "height_cm": 180.0,
        "goal": "muscle_gain",
        "activity_level": "active",
        "cuisine_preference": "egyptian",
        "health_conditions": [],
        "allergies": ["gluten"],
    })
    elapsed = time.time() - t0
    print(f"  Status: SUCCESS  ({elapsed:.1f}s)")
    print(f"  daily_calories : {r3['daily_calories']}")
    print(f"  generation_ms  : {r3['generation_ms']}")
    plan = r3["plan"]
    days = plan.get("days", [])
    print(f"  plan days      : {len(days)}")
    print(f"  foods_to_avoid : {plan.get('foods_to_avoid', [])}")
    for d in days:
        meals = list(d.get("meals", {}).keys())
        kcal = d.get("total_calories", "?")
        macros = d.get("macros", {})
        print(f"    Day {d.get('day','?')} ({kcal} kcal) | meals: {meals}")
        print(
            f"      macros → protein:{macros.get('protein_g','?')}g  carbs:{macros.get('carbs_g','?')}g  fat:{macros.get('fat_g','?')}g")
    with open("test3_result.json", "w", encoding="utf-8") as f:
        json.dump(r3, f, ensure_ascii=False, indent=2)
    print("  Saved → test3_result.json")
except urllib.error.HTTPError as e:
    print(f"  ERROR {e.code}: {e.read().decode()}")
except Exception as e:
    print(f"  ERROR: {e}")

# ── Food search ───────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("5. GET /foods/search?q=chicken")
try:
    fs = get("/foods/search?q=chicken&limit=5")
    print(f"  count: {fs['count']}")
    for food in fs["foods"][:5]:
        print(f"    - {food['name']} ({food['source']})")
except Exception as e:
    print(f"  ERROR: {e}")

print("\n" + "=" * 60)
print("All tests complete.")
