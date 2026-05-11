"""
build_disease_rules.py
----------------------
Builds disease_rules.json from:
  Food_and_Nutrition__.csv  (1,698 rows, 19 cols, 0 nulls)

That CSV has columns (actual schema):
  Ages, Gender, Height, Weight, Activity Level, Dietary Preference,
  Daily Calorie Target, Protein, Sugar, Sodium, Calories, Carbohydrates,
  Fiber, Fat, Breakfast Suggestion, Lunch Suggestion, Dinner Suggestion,
  Snack Suggestion, Disease

Output: disease_rules.json — keyed by disease name, with:
  - calorie ranges (min/max)
  - macronutrient targets
  - allowed/avoided food categories
  - hydration and supplement notes
  - representative meal suggestions (for SFT prompt building)
  - medical notes

Run:
    python build_disease_rules.py
"""

import pandas as pd
import json
import os
import re

BASE = os.path.dirname(__file__)
DATASET_DIR = os.path.join(BASE, "Dataset")
OUTPUT_PATH = os.path.join(BASE, "disease_rules.json")


def safe_float(val):
    try:
        f = float(str(val).replace(",", "").strip())
        return round(f, 1) if not pd.isna(f) else None
    except (ValueError, TypeError):
        return None


def listify(val: str):
    """Split comma/semicolon/newline-separated strings into clean list."""
    if not val or str(val).strip().lower() in ("nan", "none", ""):
        return []
    parts = re.split(r"[;,\n•\-]+", str(val))
    return [p.strip() for p in parts if len(p.strip()) > 2]


print("[1/2] Loading Food_and_Nutrition__.csv...")
path = os.path.join(DATASET_DIR, "Food_and_Nutrition__.csv")
df = pd.read_csv(path, encoding="utf-8", low_memory=False)
df.columns = [c.strip() for c in df.columns]

print(f"      Rows: {len(df):,}  |  Cols: {list(df.columns)}")

# ── Group by Disease and accumulate all rules ───────────────────────────────
disease_map = {}

for _, row in df.iterrows():
    disease = str(row.get("Disease", "")).strip()
    if not disease or disease.lower() == "nan":
        continue

    key = disease.lower()
    if key not in disease_map:
        disease_map[key] = {
            "disease": disease,
            "calorie_ranges": [],
            "macro_profiles": [],
            "meal_plan_examples": [],
            "recommended_foods": set(),
            "foods_to_avoid": set(),
            "hydration_notes": [],
            "supplement_notes": [],
            "medical_notes": [],
            "special_notes": [],
            "dietary_preferences": set(),
        }

    entry = disease_map[key]

    # Calorie info — "Daily Calorie Target" is a numeric column
    cal_target = safe_float(row.get("Daily Calorie Target", ""))
    if cal_target:
        entry["calorie_ranges"].append(
            {"min_kcal": int(cal_target), "max_kcal": int(cal_target)}
        )

    # Macro profile — derived from Protein (g), Carbohydrates (g), Fat (g)
    protein_g = safe_float(row.get("Protein", 0)) or 0
    carbs_g   = safe_float(row.get("Carbohydrates", 0)) or 0
    fat_g     = safe_float(row.get("Fat", 0)) or 0
    total_macro_kcal = protein_g * 4 + carbs_g * 4 + fat_g * 9
    if total_macro_kcal > 0:
        entry["macro_profiles"].append({
            "protein_pct": round(protein_g * 4 / total_macro_kcal * 100, 1),
            "carbs_pct":   round(carbs_g   * 4 / total_macro_kcal * 100, 1),
            "fat_pct":     round(fat_g     * 9 / total_macro_kcal * 100, 1),
        })

    # Meal plan examples from Breakfast/Lunch/Dinner/Snack Suggestion columns
    breakfast = str(row.get("Breakfast Suggestion", "")).strip()
    lunch     = str(row.get("Lunch Suggestion",     "")).strip()
    dinner    = str(row.get("Dinner Suggestion",    "")).strip()
    snack     = str(row.get("Snack Suggestion",     "")).strip()
    _clean = lambda s: None if s.lower() in ("nan", "none", "") else s
    has_meal = any(_clean(s) for s in [breakfast, lunch, dinner, snack])
    if has_meal and len(entry["meal_plan_examples"]) < 10:
        entry["meal_plan_examples"].append({
            "breakfast": _clean(breakfast),
            "lunch":     _clean(lunch),
            "dinner":    _clean(dinner),
            "snack":     _clean(snack),
            "age":       safe_float(row.get("Ages", None)),
            "gender":    str(row.get("Gender",          "")).strip() or None,
            "activity":  str(row.get("Activity Level",  "")).strip() or None,
        })

    # Populate recommended_foods from all meal suggestion columns
    for suggestion_col in [breakfast, lunch, dinner, snack]:
        for food_item in listify(suggestion_col):
            entry["recommended_foods"].add(food_item)

    diet_pref = str(row.get("Dietary Preference", "")).strip()
    if diet_pref and diet_pref.lower() not in ("nan", "none"):
        entry["dietary_preferences"].add(diet_pref)


# ── Aggregate calorie ranges to a single min/max ────────────────────────────
def aggregate_calories(ranges):
    mins = [r["min_kcal"] for r in ranges if r["min_kcal"]]
    maxs = [r["max_kcal"] for r in ranges if r["max_kcal"]]
    if not mins:
        return {"min_kcal": None, "max_kcal": None}
    return {
        "min_kcal": int(sum(mins) / len(mins)),
        "max_kcal": int(sum(maxs) / len(maxs)) if maxs else None,
        "range_count": len(ranges),
    }


def aggregate_macros(profiles):
    if not profiles:
        return {}
    agg = {}
    for k in ["carbs_pct", "protein_pct", "fat_pct", "fiber_pct"]:
        vals = [p[k] for p in profiles if k in p]
        if vals:
            agg[k] = round(sum(vals) / len(vals), 1)
    return agg


# Convert sets to sorted lists and aggregate numeric fields
output = {}
for key, entry in disease_map.items():
    entry["calorie_target"] = aggregate_calories(entry.pop("calorie_ranges"))
    entry["macro_target"] = aggregate_macros(entry.pop("macro_profiles"))
    entry["recommended_foods"] = sorted(entry["recommended_foods"])
    entry["foods_to_avoid"] = sorted(entry["foods_to_avoid"])
    entry["dietary_preferences"] = sorted(entry["dietary_preferences"])
    output[key] = entry

print(f"      Unique diseases found: {len(output)}")
print(f"      Diseases: {sorted(output.keys())}")

print("[2/2] Writing disease_rules.json...")
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"\n✅  Done → {OUTPUT_PATH}")
print(f"   Total disease entries: {len(output)}")
