"""
generate_nutrition_sft.py
--------------------------
Generates 12,000–15,000 supervised fine-tuning (SFT) training pairs for the
Nutrition Plan Generator (Qwen2.5-3B-Instruct + QLoRA).

Sources used:
  1. smolified-smolmeal-adaptive-daily-meal-planner.csv       (7,571 SFT pairs — style reference)
  2. smolified-smart-food-safety-allergy-detector-training.csv (2,890 allergen SFT pairs)
  3. Food_and_Nutrition__.csv                                  (disease rules, meal examples)
  4. food_db_halal.json                                        (Egyptian + USDA food DB)
  5. allergen_taxonomy.json                                    (allergen flags)
  6. disease_rules.json                                        (disease constraints)
  7. Personalized_Diet_Recommendations.csv                     (macro targets)
  8. recipes.csv                                               (recipe lookup, sample 20K)
  Synthetic InBody rules generated from InBodyMeasurement model fields.

Output:
  nutrition_sft_train.csv   — 90% split (train)  [columns: prompt, response]
  nutrition_sft_eval.csv    — 10% split (eval)   [columns: prompt, response]
  Each line: {"messages": [{"role":"system",...},{"role":"user",...},{"role":"assistant",...}]}

Run:
    python generate_nutrition_sft.py
"""

import json
import math
import os
import random
import re

import pandas as pd

BASE = os.path.dirname(__file__)
DATASET_DIR = os.path.join(BASE, "Dataset")
OUTPUT_TRAIN = os.path.join(BASE, "nutrition_sft_train.csv")
OUTPUT_EVAL = os.path.join(BASE, "nutrition_sft_eval.csv")

random.seed(42)


def safe_float(val, default=None):
    """Return float(val) or default if val is None / NaN / non-numeric."""
    try:
        f = float(val)
        return default if math.isnan(f) else f
    except (TypeError, ValueError):
        return default

# ── Load pre-built artefacts ────────────────────────────────────────────────


def load_json(path, default=None):
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    print(f"  [WARN] {path} not found — some features disabled.")
    return default if default is not None else {}


FOOD_DB = load_json(os.path.join(BASE, "food_db_halal.json"), [])
ALLERGEN_TAX = load_json(os.path.join(BASE, "allergen_taxonomy.json"), {})
DISEASE_RULES = load_json(os.path.join(BASE, "disease_rules.json"), {})

# Index food DB by source for quick sampling
FOOD_EGY = [f for f in FOOD_DB if f.get("source") == "egyptian"]
FOOD_USDA = [f for f in FOOD_DB if f.get("source") == "usda"]
print(f"Food DB loaded: {len(FOOD_EGY):,} Egyptian + {len(FOOD_USDA):,} USDA")

# ── Runtime meal-type / food-role enrichment (works with old + new food DBs) ─
_RT_ROLE_KWS = {
    "protein":   ["chicken", "beef", "lamb", "fish", "egg", "liver", "tuna", "salmon",
                  "shrimp", "kofta", "kebab", "lentil", "adas", "beans", "foul", "ful",
                  "turkey", "duck", "sardine", "lobster", "crab", "meat"],
    "carb":      ["rice", "roz", "pasta", "bread", "aish", "macarona", "oats",
                  "koshari", "potato", "batata", "sweet potato", "corn", "couscous",
                  "bulgur", "quinoa", "pita", "feteer", "cereal", "noodle"],
    "vegetable": ["salad", "vegetable", "cucumber", "tomato", "lettuce", "spinach",
                  "broccoli", "carrot", "pepper", "zucchini", "eggplant", "molokhia",
                  "mulukhiyah", "beet", "cabbage", "mushroom", "kale"],
    "fat":       ["oil", "olive", "butter", "ghee", "avocado", "tahini",
                  "almond", "walnut", "peanut", "cashew", "hazelnut"],
    "fruit":     ["banana", "apple", "orange", "watermelon", "mango", "grape", "date",
                  "strawberry", "cherry", "peach", "pear", "fig", "pomegranate", "guava"],
    "dairy":     ["milk", "laban", "cheese", "gibna", "labneh", "yogurt", "zabadi",
                  "cream", "halloumi", "mozzarella", "cheddar", "feta"],
}
_RT_EGY_MT_KWS = {
    "breakfast": ["labneh", "foul", "ful medames", "baladi bread", "aish baladi",
                  "gibna", "cheese", "beid", "egg", "halawa", "tahini", "feteer",
                  "oatmeal", "yogurt", "zabadi", "keshk", "honey", "jam"],
    "lunch":     ["kofta", "kebab", "mahshi", "fattah", "koshari", "molokhia", "fatta",
                  "grilled chicken", "fried fish", "samak", "lamb", "roz", "rice",
                  "pasta", "macarona", "lentil", "adas", "hawawshi", "shawerma",
                  "mulukhiyah", "chicken", "beef", "liver", "kibda"],
    "snack":     ["biscuit", "cake", "basbousa", "om ali", "konafa", "ghorayeba",
                  "kahk", "dates", "banana", "apple", "orange", "nuts", "juice", "chocolate"],
    "dinner":    ["salad", "soup", "shorbat", "grilled vegetable", "baked"],
}
_RT_USDA_CAT_MT = {
    "Breakfast Cereals": ["breakfast"],        "Dairy and Egg Products": ["breakfast", "snack"],
    "Baked Products": ["breakfast", "snack"],  "Fruits and Fruit Juices": ["breakfast", "snack"],
    "Nut and Seed Products": ["snack"],        "Sweets": ["snack"],
    "Snacks": ["snack"],                       "Beef Products": ["lunch", "dinner"],
    "Poultry Products": ["lunch", "dinner"],   "Lamb, Veal, and Game Products": ["lunch", "dinner"],
    "Finfish and Shellfish Products": ["lunch", "dinner"],
    "Legumes and Legume Products": ["lunch", "dinner"],
    "Cereal Grains and Pasta": ["lunch", "dinner"],
    "Vegetables and Vegetable Products": ["lunch", "dinner"],
    "Soups, Sauces, and Gravies": ["lunch", "dinner"],
    "Fast Foods": ["lunch", "dinner"],         "Restaurant Foods": ["lunch", "dinner"],
    "Meals, Entrees, and Side Dishes": ["lunch", "dinner"],
    "Fats and Oils": [],  "Beverages": [],  "Spices and Herbs": [],  "Pork Products": [],
}


def _rt_infer_role(name: str, per_100g: dict) -> str:
    n = name.lower()
    for role, kws in _RT_ROLE_KWS.items():
        if any(kw in n for kw in kws):
            return role
    p = per_100g.get("protein_g") or 0
    c = per_100g.get("carbs_g") or 0
    f = per_100g.get("fat_g") or 0
    if p == 0 and c == 0 and f == 0:
        return "other"  # unknown macros — don't pretend it's a carb
    if p >= c and p >= f and p > 0:
        return "protein"
    if f > c and f > p and f > 0:
        return "fat"
    return "carb"


def _rt_infer_meal_type(food: dict) -> list:
    if food.get("meal_type"):
        return food["meal_type"]
    if food.get("source") == "egyptian":
        n = food["name"].lower()
        matches = [m for m, kws in _RT_EGY_MT_KWS.items() if any(kw in n for kw in kws)]
        return matches or ["lunch", "dinner"]
    cat = food.get("food_category") or ""
    return _RT_USDA_CAT_MT.get(cat, ["lunch", "dinner"])


# Enrich food DB entries in-place and build O(1) lookup index
for _f in FOOD_DB:
    if not _f.get("meal_type"):
        _f["meal_type"] = _rt_infer_meal_type(_f)
    if not _f.get("food_role"):
        _f["food_role"] = _rt_infer_role(_f["name"], _f.get("per_100g", {}))

FOOD_INDEX: dict = {f["name"].lower(): f for f in FOOD_DB}
print(f"Food index built: {len(FOOD_INDEX):,} entries enriched with meal_type + food_role")

# Maps user-facing allergy names to the boolean flag keys in allergen_taxonomy.json
# Note: build_allergen_taxonomy.py strips the "contains_" prefix, so keys are bare names
ALLERGY_FLAG_MAP: dict[str, str] = {
    "dairy":  "dairy",
    "gluten": "gluten",
    "nuts":   "nuts",
    "soy":    "soy",
    "eggs":   "eggs",
    "fish":   "fish",
}

# ── System prompt ────────────────────────────────────────────────────────────
SYSTEM_PROMPT = (
    "You are IntelliFit Nutrition Coach — an expert Egyptian sports nutritionist. "
    "You create personalised 3-day halal nutrition plans (valid JSON, no markdown). "
    "Each plan has 3 unique days, each with breakfast, lunch, dinner, and one snack. "
    "Plans respect the user's health conditions, allergies, fitness goal, and InBody data. "
    "Output ONLY valid JSON in the exact schema requested. "
    "Use Egyptian food names whenever possible. All food is halal. "
    "When the user mentions a previous or recent plan, generate a completely new plan "
    "with different meals, different food items, and different meal compositions — "
    "never repeat the same foods from the previous plan."
)


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

# ── Meal composition templates (role → count) ────────────────────────────────
MEAL_TEMPLATES = {
    "breakfast": [
        {"protein": 1, "carb": 1, "dairy": 1},
        {"protein": 1, "carb": 1, "fruit": 1},
        {"dairy": 1, "carb": 1, "fruit": 1},
        {"protein": 2, "carb": 1},
    ],
    "lunch": [
        {"protein": 1, "carb": 1, "vegetable": 1},
        {"protein": 1, "carb": 1, "vegetable": 2},
        {"protein": 2, "carb": 1},
        {"protein": 1, "carb": 2, "vegetable": 1},
    ],
    "dinner": [
        {"protein": 1, "vegetable": 2},
        {"protein": 1, "carb": 1, "vegetable": 1},
        {"vegetable": 3},
        {"protein": 1, "dairy": 1, "vegetable": 1},
    ],
    "snack": [
        {"fruit": 1, "dairy": 1},
        {"fruit": 2},
        {"fat": 1, "fruit": 1},
        {"dairy": 1},
    ],
}


def _keyword_allergen_check(food_name: str, active_flags: list[str]) -> bool:
    """Keyword-based allergen fallback for foods not in allergen_taxonomy.json.
    Returns True if the food is SAFE (no allergen keywords matched)."""
    _ALLERGEN_KWS = {
        "dairy":  ["milk", "laban", "cheese", "gibna", "labneh", "yogurt", "zabadi",
                   "cream", "halloumi", "mozzarella", "cheddar", "feta", "butter", "ghee",
                   "whey", "casein", "ricotta", "parmesan", "brie"],
        "gluten": ["wheat", "bread", "aish", "pasta", "macarona", "noodle", "cereal",
                   "flour", "barley", "rye", "couscous", "bulgur", "pita", "feteer",
                   "biscuit", "cake", "pastry", "cracker"],
        "nuts":   ["almond", "walnut", "peanut", "cashew", "hazelnut", "pistachio",
                   "pecan", "macadamia", "nut"],
        "soy":    ["soy", "tofu", "tempeh", "edamame", "miso"],
        "eggs":   ["egg", "beid", "omelette", "frittata", "mayonnaise"],
        "fish":   ["fish", "samak", "tuna", "salmon", "sardine", "shrimp", "lobster",
                   "crab", "anchovy", "cod", "tilapia", "mackerel", "shellfish"],
    }
    n = food_name.lower()
    for flag in active_flags:
        kws = _ALLERGEN_KWS.get(flag, [])
        if any(kw in n for kw in kws):
            return False  # allergen keyword matched — NOT safe
    return True


def sample_meal_foods(meal_type: str, cuisine: str = "egyptian",
                      allergies: list = None,
                      avoid_keywords: list = None) -> list | None:
    """Sample foods for a specific meal type using role templates for coherence.
    Returns None if no safe foods are available (allergen constraints, empty pool).

    avoid_keywords: list of food-name substrings to exclude (from disease rules).
    """
    pool = FOOD_EGY if cuisine == "egyptian" and FOOD_EGY else FOOD_USDA
    if not pool:
        return None

    # Filter to foods that belong to this meal type
    typed = [f for f in pool if meal_type in f.get("meal_type", [])]
    if len(typed) < 4:
        typed = pool  # fallback if meal_type enrichment too sparse

    # Disease avoid-foods filter (keyword substring match)
    if avoid_keywords:
        filtered = [f for f in typed
                    if not any(kw in f["name"].lower() for kw in avoid_keywords)]
        if len(filtered) >= 4:
            typed = filtered

    # Allergen hard-filter (taxonomy lookup + keyword fallback)
    if allergies:
        active_flags = [ALLERGY_FLAG_MAP[a] for a in allergies if a in ALLERGY_FLAG_MAP]
        if active_flags:
            def _safe(food: dict) -> bool:
                # First check the taxonomy DB
                entry = ALLERGEN_TAX.get(food["name"].lower(), None)
                if entry is not None:
                    flags = entry.get("allergens", {}) if isinstance(entry, dict) else {}
                    return not any(flags.get(flag, False) for flag in active_flags)
                # Fallback: keyword-based check for foods not in taxonomy
                return _keyword_allergen_check(food["name"], active_flags)
            filtered = [f for f in typed if _safe(f)]
            if filtered:
                typed = filtered
            else:
                return None  # no safe foods — discard this sample

    # Pick a role template and sample one food per slot
    template = random.choice(MEAL_TEMPLATES.get(meal_type, [{"protein": 1, "carb": 1}]))
    selected: list = []
    seen: set = set()
    for role, count in template.items():
        role_pool = [f for f in typed if f.get("food_role") == role]
        if not role_pool:
            role_pool = typed  # fallback if role not represented
        picks = random.sample(role_pool, min(count, len(role_pool)))
        for f in picks:
            if f["name"] not in seen:
                seen.add(f["name"])
                selected.append(f["name"])
    return selected or None  # None signals caller to discard this sample


def pick_disease_foods(disease_key: str, n_good: int = 3, n_bad: int = 2):
    """Return recommended and avoided foods for a given disease.
    Checks the individual-disease index first, then falls back to the
    composite DISEASE_RULES for backward compatibility."""
    key = disease_key.strip().lower()
    rule = _INDIVIDUAL_DISEASES.get(key) or DISEASE_RULES.get(key, {})
    rec = rule.get("recommended_foods", [])
    avoid = rule.get("foods_to_avoid", [])
    return (
        random.sample(rec, min(n_good, len(rec))) if rec else [],
        random.sample(avoid, min(n_bad, len(avoid))) if avoid else [],
    )


def calorie_target(goal: str, weight_kg: float, body_fat_pct: float = None,
                   activity: str = "moderate", gender: str = "male",
                   height_cm: float = 170.0, age: int = 30) -> int:
    """TDEE estimate.  Uses Katch-McArdle when body_fat_pct is available
    (more accurate for known body composition), falls back to Mifflin-St Jeor."""
    if body_fat_pct is not None and 3 < body_fat_pct < 60:
        # Katch-McArdle: BMR = 370 + 21.6 × lean_mass_kg
        lean_mass = weight_kg * (1 - body_fat_pct / 100)
        bmr = 370 + 21.6 * lean_mass
    elif gender == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    multipliers = {"sedentary": 1.2, "light": 1.375, "moderate": 1.55,
                   "active": 1.725, "very_active": 1.9}
    tdee = bmr * multipliers.get(activity, 1.55)
    if goal == "weight_loss":
        return int(tdee * 0.80)
    elif goal == "muscle_gain":
        return int(tdee * 1.10)
    elif goal == "maintenance":
        return int(tdee)
    elif goal == "body_recomposition":
        return int(tdee * 0.95)
    return int(tdee)


def portion_foods(food_names: list, target_kcal: int,
                  protein_pct: float = 25, carbs_pct: float = 50,
                  fat_pct: float = 25) -> list:
    """Compute gram portions for each food to hit target_kcal while respecting
    the macro split (protein_pct / carbs_pct / fat_pct).
    Foods are bucketed by food_role and assigned a calorie budget proportional
    to the macro they primarily supply (protein → protein budget, carb/vegetable
    /fruit → carbs budget, fat → fat budget).  Per-item calories are derived
    from the final rounded macros (protein*4 + carbs*4 + fat*9) to eliminate
    floating-point drift between grams and nutritional values.
    """
    if not food_names:
        return []

    # Calorie budget per macro bucket
    protein_budget = target_kcal * (protein_pct / 100)
    carbs_budget   = target_kcal * (carbs_pct   / 100)
    fat_budget     = target_kcal * (fat_pct     / 100)

    ROLE_BUCKET = {
        "protein":   "protein",
        "carb":      "carb",
        "fat":       "fat",
        "vegetable": "carb",
        "fruit":     "carb",
        "condiment": "carb",
        "dairy":     "protein",  # dairy is protein-dominant
    }
    budgets = {"protein": protein_budget, "carb": carbs_budget, "fat": fat_budget}

    # Count foods per bucket to divide the budget evenly within each bucket
    bucket_counts: dict[str, int] = {"protein": 0, "carb": 0, "fat": 0, "other": 0}
    for name in food_names:
        entry = FOOD_INDEX.get(name.lower())
        role  = (entry or {}).get("food_role", "other")
        bucket_counts[ROLE_BUCKET.get(role, "other")] += 1

    kcal_other = max(target_kcal / len(food_names), 1)  # equal share for untagged foods
    items = []
    for name in food_names:
        entry        = FOOD_INDEX.get(name.lower())
        p100         = entry["per_100g"] if entry else {}
        cal_per_100g = p100.get("calories_kcal") or 150
        if cal_per_100g <= 0:
            cal_per_100g = 150

        role   = (entry or {}).get("food_role", "other")
        bucket = ROLE_BUCKET.get(role, "other")

        if bucket != "other" and bucket_counts[bucket] > 0:
            kcal_for_this = budgets[bucket] / bucket_counts[bucket]
        else:
            kcal_for_this = kcal_other

        grams = int(round((kcal_for_this / cal_per_100g) * 100))
        grams = max(20, min(grams, 450))          # clamp to sensible portion range
        ratio     = grams / 100
        protein_g = round((p100.get("protein_g") or 0) * ratio, 1)
        carbs_g   = round((p100.get("carbs_g")   or 0) * ratio, 1)
        fat_g     = round((p100.get("fat_g")     or 0) * ratio, 1)
        # Derive calories from macros — keeps dataset mathematically self-consistent
        macro_cal = round(protein_g * 4 + carbs_g * 4 + fat_g * 9)
        # Guard against corrupted DB rows where macros far exceed declared calories_kcal
        # (e.g. a "diet soda" row with carbs_g=525/100g → macro_cal ≈ 10 000 kcal).
        # When macro_cal > 1.5× the calorie-based estimate, scale macros down to match.
        direct_cal = round(grams * cal_per_100g / 100)
        if direct_cal > 0 and macro_cal > direct_cal * 1.5:
            # Corrupted DB row: macros far exceed declared calories — scale down
            scale     = direct_cal / macro_cal
            protein_g = round(protein_g * scale, 1)
            carbs_g   = round(carbs_g   * scale, 1)
            fat_g     = round(fat_g     * scale, 1)
            macro_cal = direct_cal
        elif macro_cal == 0 and direct_cal > 0:
            # Missing macro data: skip this food entirely — fabricating macros would
            # corrupt training labels (e.g. olive oil showing as pure carbohydrate).
            continue
        elif direct_cal > 50 and macro_cal > 0 and macro_cal < direct_cal * 0.5:
            # Partial null macros: some macro columns are None, causing understated
            # calories (e.g. cheese with fat_g=None → macro_cal ≈ 105 vs actual 403).
            continue
        items.append({
            "name":      name,
            "grams":     grams,
            "calories":  macro_cal,
            "protein_g": protein_g,
            "carbs_g":   carbs_g,
            "fat_g":     fat_g,
        })
    return items


def build_meal_json(meal_type: str, foods: list | None, target_kcal: int,
                    protein_pct: float = 25, carbs_pct: float = 50,
                    fat_pct: float = 25) -> dict | None:
    """Build a meal entry with macro-aware portioning and mathematically consistent
    calorie totals.  Returns None if foods is None (no safe foods found for this
    meal under the current allergen/disease constraints)."""
    if foods is None:
        return None
    items = portion_foods(foods, target_kcal, protein_pct, carbs_pct, fat_pct)
    actual_protein = round(sum(item.get("protein_g", 0) for item in items), 1)
    actual_carbs   = round(sum(item.get("carbs_g",   0) for item in items), 1)
    actual_fat     = round(sum(item.get("fat_g",     0) for item in items), 1)
    # total_calories derived from rounded macros — eliminates floating-point drift
    actual_kcal = round(actual_protein * 4 + actual_carbs * 4 + actual_fat * 9) if items else target_kcal
    return {
        "items": items,
        "total_calories": actual_kcal,
        "macros": {
            "protein_g": actual_protein,
            "carbs_g":   actual_carbs,
            "fat_g":     actual_fat,
        },
        "prep_notes": random.choice([
            "Grilled or boiled preferred.",
            "Steam vegetables to preserve nutrients.",
            "Season with herbs and lemon — avoid heavy sauces.",
            "Can be prepped the night before.",
            "Serve with a glass of water.",
        ]),
    }


def build_3day_plan(daily_kcal: int, protein_pct: float, carbs_pct: float, fat_pct: float,
                    cuisine: str = "egyptian", disease_key: str = None,
                    allergies: list[str] = None) -> dict | None:
    """Generate a 3-day JSON nutrition plan with allergen-safe food sampling.
    Returns None if any meal cannot be built due to strict dietary constraints."""
    days = []
    meal_splits = {"breakfast": 0.25, "snack": 0.10,
                   "lunch": 0.40, "dinner": 0.25}

    rec_foods, avoid_foods = [], []
    if disease_key:
        rec_foods, avoid_foods = pick_disease_foods(disease_key)

    # Build lowercase keyword list from avoid_foods for meal-sampling filter
    avoid_keywords = [kw.lower() for kw in avoid_foods] if avoid_foods else None

    for day_n in range(1, 4):
        meals = {}
        day_actual_kcal = 0
        day_protein, day_carbs, day_fat = 0.0, 0.0, 0.0
        for meal_name, fraction in meal_splits.items():
            target_kcal = int(daily_kcal * fraction)
            foods = sample_meal_foods(meal_name, cuisine, allergies,
                                      avoid_keywords=avoid_keywords)
            if foods is None:
                return None  # no safe foods — discard this sample
            if rec_foods and random.random() < 0.5:
                foods = list(foods) + [random.choice(rec_foods)]
            meal_dict = build_meal_json(meal_name, foods, target_kcal,
                                        protein_pct, carbs_pct, fat_pct)
            if meal_dict is None:
                return None
            meals[meal_name] = meal_dict
            day_actual_kcal += meal_dict["total_calories"]
            day_protein += meal_dict["macros"]["protein_g"]
            day_carbs   += meal_dict["macros"]["carbs_g"]
            day_fat     += meal_dict["macros"]["fat_g"]

        days.append({
            "day": day_n,
            "total_calories": day_actual_kcal,
            "macros": {                     # actual from food DB — not demographic estimate
                "protein_g": round(day_protein, 1),
                "carbs_g":   round(day_carbs,   1),
                "fat_g":     round(day_fat,     1),
            },
            "meals": meals,
            "hydration_ml": random.choice([2000, 2500, 3000]),
        })

    return {
        "foods_to_avoid": avoid_foods,
        "days": days,
    }


# ══════════════════════════════════════════════════════════════════════════════
# GENERATOR FUNCTIONS (each returns a list of {messages: [...]} dicts)
# ══════════════════════════════════════════════════════════════════════════════

GOALS = ["weight_loss", "muscle_gain", "maintenance", "body_recomposition"]
GENDERS = ["male", "female"]
ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active", "very_active"]
ALLERGENS_LIST = ["gluten", "dairy", "nuts", "soy", "eggs", "fish"]

# ── Decompose composite disease keys into single-disease index ───────────────
# The CSV stores multi-disease bundles like "diabetes, acne, weight gain, ..."
# We extract individual disease names and merge rules from all composites that
# contain that disease.  This lets the model train on single-disease prompts.
_INDIVIDUAL_DISEASES: dict[str, dict] = {}
if DISEASE_RULES:
    for composite_key, rule in DISEASE_RULES.items():
        parts = [p.strip().lower() for p in composite_key.split(",")]
        for part in parts:
            if part in ("acne",):  # skip irrelevant-to-nutrition conditions
                continue
            if part not in _INDIVIDUAL_DISEASES:
                _INDIVIDUAL_DISEASES[part] = {
                    "disease": part.title(),
                    "recommended_foods": set(),
                    "foods_to_avoid": set(),
                    "calorie_targets": [],
                    "macro_profiles": [],
                    "medical_notes": [],
                }
            entry = _INDIVIDUAL_DISEASES[part]
            entry["recommended_foods"].update(rule.get("recommended_foods", []))
            entry["foods_to_avoid"].update(rule.get("foods_to_avoid", []))
            ct = rule.get("calorie_target", {})
            if ct.get("min_kcal"):
                entry["calorie_targets"].append(ct)
            mt = rule.get("macro_target", {})
            if mt:
                entry["macro_profiles"].append(mt)
            entry["medical_notes"].extend(rule.get("medical_notes", [])[:2])
    # Finalize: convert sets to lists, average calorie/macro targets
    for key, entry in _INDIVIDUAL_DISEASES.items():
        entry["recommended_foods"] = sorted(entry["recommended_foods"])
        entry["foods_to_avoid"] = sorted(entry["foods_to_avoid"])
        cals = entry.pop("calorie_targets")
        if cals:
            entry["calorie_target"] = {
                "min_kcal": int(sum(c["min_kcal"] for c in cals) / len(cals)),
                "max_kcal": int(sum(c.get("max_kcal", c["min_kcal"]) for c in cals) / len(cals)),
            }
        else:
            entry["calorie_target"] = {}
        macros = entry.pop("macro_profiles")
        if macros:
            entry["macro_target"] = {
                k: round(sum(m.get(k, 0) for m in macros) / len(macros), 1)
                for k in ["protein_pct", "carbs_pct", "fat_pct"] if any(k in m for m in macros)
            }
        else:
            entry["macro_target"] = {}
        entry["medical_notes"] = list(set(entry["medical_notes"]))[:5]
    print(f"Individual disease index: {sorted(_INDIVIDUAL_DISEASES.keys())}")

DISEASES = list(_INDIVIDUAL_DISEASES.keys()) if _INDIVIDUAL_DISEASES else [
    "diabetes", "hypertension", "obesity", "heart disease", "kidney disease"
]

# ALLERGY_FLAG_MAP is defined near line 144 (after FOOD_INDEX) to avoid
# forward-reference fragility.  Do not re-define it here.


def make_basic_plan(n: int = 2000) -> list:
    """Basic demographic profiles — weight/goal/age/gender."""
    samples = []
    for _ in range(n):
        gender = random.choice(GENDERS)
        age = random.randint(18, 65)
        weight = round(random.uniform(50, 120), 1)
        height = round(random.uniform(155, 190), 1)
        goal = random.choice(GOALS)
        activity = random.choice(ACTIVITY_LEVELS)

        protein_pct = random.choice(
            [25, 30, 35]) if goal == "muscle_gain" else random.choice([20, 25])
        fat_pct = random.choice([25, 30])
        carbs_pct = 100 - protein_pct - fat_pct

        daily_kcal = calorie_target(goal, weight, activity=activity,
                                     gender=gender, height_cm=height, age=age)

        user_msg = (
            f"Create a 3-day halal nutrition plan for a {age}-year-old {gender}, "
            f"weight {weight} kg, height {height} cm. "
            f"Goal: {goal.replace('_', ' ')}, activity: {activity}. "
            f"Health conditions: none. "
            f"Allergies: none. "
            f"Cuisine preference: egyptian. "
            f"Daily calorie target: {daily_kcal} kcal. "
            f"Macro targets \u2014 protein: {protein_pct}%, carbs: {carbs_pct}%, fat: {fat_pct}%. "
            f"Return only a valid JSON 3-day nutrition plan with breakfast, lunch, dinner, and snack per day."
        )

        plan = build_3day_plan(daily_kcal, protein_pct, carbs_pct, fat_pct)
        if plan is None:
            continue
        samples.append({"messages": [
            {"role": "system",    "content": SYSTEM_PROMPT},
            {"role": "user",      "content": user_msg},
            {"role": "assistant", "content": json.dumps(
                plan, ensure_ascii=False)},
        ]})
    return samples


def make_disease_plan(n: int = 2000) -> list:
    """Disease-specific plans drawn from disease_rules.json."""
    samples = []
    if not DISEASE_RULES:
        print("  [WARN] No disease rules — skipping disease plans.")
        return samples

    for _ in range(n):
        disease_key = random.choice(DISEASES)
        rule = DISEASE_RULES[disease_key]
        disease_name = rule.get("disease", disease_key.title())

        gender = random.choice(GENDERS)
        age = random.randint(30, 70)
        weight = round(random.uniform(60, 110), 1)
        goal = random.choice(["weight_loss", "maintenance"])

        cal_range = rule.get("calorie_target", {})
        macro_t = rule.get("macro_target", {})
        daily_kcal = random.randint(
            cal_range.get("min_kcal", 1600),
            cal_range.get("max_kcal", 2200),
        ) if cal_range.get("min_kcal") else calorie_target(goal, weight,
                                                              gender=gender, age=age)

        protein_pct = macro_t.get("protein_pct", 25)
        carbs_pct = macro_t.get("carbs_pct", 50)
        fat_pct = macro_t.get("fat_pct", 25)

        rec, avoid = pick_disease_foods(disease_key, n_good=3, n_bad=3)

        notes = rule.get("medical_notes", [])
        height = round(random.uniform(155, 190), 1)
        activity = random.choice(ACTIVITY_LEVELS)

        disease_notes_str = ""
        if rec:
            disease_notes_str += f"Recommended for {disease_name}: {', '.join(rec)}. "
        if avoid:
            disease_notes_str += f"Avoid for {disease_name}: {', '.join(avoid)}. "
        if notes:
            disease_notes_str += f"Medical note: {notes[0]}. "

        user_msg = (
            f"Create a 3-day halal nutrition plan for a {age}-year-old {gender}, "
            f"weight {weight} kg, height {height} cm. "
            f"Goal: {goal.replace('_', ' ')}, activity: {activity}. "
            f"Health conditions: {disease_name}. "
            f"Allergies: none. "
            f"Cuisine preference: egyptian. "
            f"Daily calorie target: {daily_kcal} kcal. "
            f"Macro targets \u2014 protein: {protein_pct}%, carbs: {carbs_pct}%, fat: {fat_pct}%. "
            + (disease_notes_str if disease_notes_str else "")
            + "Return only a valid JSON 3-day nutrition plan with breakfast, lunch, dinner, and snack per day."
        )

        plan = build_3day_plan(daily_kcal, protein_pct, carbs_pct, fat_pct,
                               disease_key=disease_key)
        if plan is None:
            continue
        samples.append({"messages": [
            {"role": "system",    "content": SYSTEM_PROMPT},
            {"role": "user",      "content": user_msg},
            {"role": "assistant", "content": json.dumps(
                plan, ensure_ascii=False)},
        ]})
    return samples


def make_inbody_plan(n: int = 2500) -> list:
    """
    Synthetic InBody-aware plans using InBodyMeasurement fields:
      Weight, BodyFatPercentage, MuscleMass, VisceralFatLevel, Bmr
    Rules:
      - body_fat_pct > 30%  → deficit 20%, reduce fat_pct to 20%
      - muscle_mass < 25 kg → push protein to 35%
      - visceral_fat >= 10  → restrict sodium, push fiber
    """
    samples = []
    for _ in range(n):
        gender = random.choice(GENDERS)
        age = random.randint(20, 65)
        weight = round(random.uniform(55, 130), 1)
        height = round(random.uniform(155, 190), 1)
        body_fat = round(random.uniform(8, 45), 1)
        muscle_mass = round(random.uniform(15, 60), 1)
        visceral_fat = random.randint(1, 20)
        bmr = round(random.uniform(1200, 2200), 0)
        goal = random.choice(GOALS)
        activity = random.choice(ACTIVITY_LEVELS)

        # Apply InBody rules
        daily_kcal = calorie_target(goal, weight, body_fat, activity,
                                     gender=gender, height_cm=height, age=age)
        protein_pct = 25
        fat_pct = 25
        carbs_pct = 50
        flags = []

        if body_fat > 30:
            if goal != "weight_loss":    # avoid double-deficit (weight_loss already -20%)
                daily_kcal = int(daily_kcal * 0.80)
                flags.append(
                    f"high body fat ({body_fat}%) — 20% calorie deficit applied")
            else:
                flags.append(
                    f"high body fat ({body_fat}%) — deficit already applied via weight-loss goal")
            daily_kcal = max(1200, daily_kcal)   # safety floor
            fat_pct = 20
            carbs_pct = 45
            protein_pct = 35

        if muscle_mass < 25:
            protein_pct = max(protein_pct, 35)
            fat_pct = 20
            carbs_pct = 100 - protein_pct - fat_pct
            flags.append(
                f"low muscle mass ({muscle_mass} kg) — protein target elevated to {protein_pct}%")

        if visceral_fat >= 10:
            flags.append(
                f"visceral fat level {visceral_fat} — low-sodium, high-fiber foods preferred")

        sodium_note = " Restrict sodium to < 1500 mg/day." if visceral_fat >= 10 else ""
        flag_str = " | ".join(flags) if flags else "normal InBody reading"

        user_msg = (
            f"Create a 3-day halal nutrition plan for a {age}-year-old {gender}, "
            f"weight {weight} kg, height {height} cm. "
            f"Goal: {goal.replace('_', ' ')}, activity: {activity}. "
            f"Health conditions: none. "
            f"Allergies: none. "
            f"Cuisine preference: egyptian. "
            f"InBody snapshot: body fat {body_fat}%, muscle mass {muscle_mass} kg, "
            f"visceral fat level {visceral_fat}, BMR {int(bmr)} kcal. "
            f"InBody adjustments: {flag_str}.{sodium_note} "
            f"Daily calorie target: {daily_kcal} kcal. "
            f"Macro targets \u2014 protein: {protein_pct}%, carbs: {carbs_pct}%, fat: {fat_pct}%. "
            f"Return only a valid JSON 3-day nutrition plan with breakfast, lunch, dinner, and snack per day."
        )

        plan = build_3day_plan(daily_kcal, protein_pct, carbs_pct, fat_pct)
        if plan is None:
            continue
        samples.append({"messages": [
            {"role": "system",    "content": SYSTEM_PROMPT},
            {"role": "user",      "content": user_msg},
            {"role": "assistant", "content": json.dumps(
                plan, ensure_ascii=False)},
        ]})
    return samples


def make_allergen_plan(n: int = 1500) -> list:
    """Plans with explicit allergen restrictions."""
    samples = []
    attempts = 0
    while len(samples) < n and attempts < n * 3:
        attempts += 1
        gender = random.choice(GENDERS)
        age = random.randint(18, 60)
        weight = round(random.uniform(50, 110), 1)
        goal = random.choice(GOALS)
        allergies = random.sample(ALLERGENS_LIST, random.randint(1, 3))
        height = round(random.uniform(155, 190), 1)
        activity = random.choice(ACTIVITY_LEVELS)
        daily_kcal = calorie_target(goal, weight, activity=activity,
                                     gender=gender, height_cm=height, age=age)
        protein_pct, carbs_pct, fat_pct = 25, 50, 25

        allergy_str = ", ".join(allergies)
        user_msg = (
            f"Create a 3-day halal nutrition plan for a {age}-year-old {gender}, "
            f"weight {weight} kg, height {height} cm. "
            f"Goal: {goal.replace('_', ' ')}, activity: {activity}. "
            f"Health conditions: none. "
            f"Allergies: {allergy_str}. "
            f"Cuisine preference: egyptian. "
            f"Daily calorie target: {daily_kcal} kcal. "
            f"Macro targets \u2014 protein: {protein_pct}%, carbs: {carbs_pct}%, fat: {fat_pct}%. "
            f"Return only a valid JSON 3-day nutrition plan with breakfast, lunch, dinner, and snack per day."
        )

        plan = build_3day_plan(daily_kcal, protein_pct, carbs_pct, fat_pct,
                               allergies=allergies)
        if plan is None:
            continue
        plan["allergen_free"] = allergies
        samples.append({"messages": [
            {"role": "system",    "content": SYSTEM_PROMPT},
            {"role": "user",      "content": user_msg},
            {"role": "assistant", "content": json.dumps(
                plan, ensure_ascii=False)},
        ]})
    return samples


def make_edge_case_plan(n: int = 500) -> list:
    """Edge cases: extreme obesity, severe underweight, multiple diseases, elderly,
    elite athletes — profiles missing from normal generators."""
    EDGE_SCENARIOS = [
        # (tag, weight_range, bf_range, diseases, kcal_modifier, description)
        # Disease keys must match _INDIVIDUAL_DISEASES index (single-disease)
        ("extreme_obesity",    (100, 160), (40, 55), ["weight gain"],       0.70,
         "extreme obesity (BMI > 40) — aggressive deficit, low-carb approach"),
        ("severe_underweight", (35,  50),  (5,  12), [],                   1.25,
         "severe underweight — high-calorie, high-protein recovery diet"),
        ("elderly_diabetic",   (60,  90),  (25, 40), ["diabetes"],         0.85,
         "elderly diabetic (age 65-80) — low-GI carbs, moderate protein"),
        ("hypertension_obese", (90, 130),  (35, 50), ["hypertension"],     0.75,
         "hypertension with obesity — DASH principles, low sodium"),
        ("elite_athlete",      (65, 100),  (6,  15), [],                   1.35,
         "elite competitive athlete bulking — very high calorie and protein"),
        ("kidney_disease",     (55,  85),  (15, 30), ["kidney disease"],   0.80,
         "chronic kidney disease — low phosphorus, restricted protein"),
    ]
    per_scenario = max(1, n // len(EDGE_SCENARIOS))
    samples = []
    for tag, w_range, bf_range, diseases, kcal_mod, description in EDGE_SCENARIOS:
        for _ in range(per_scenario):
            gender = random.choice(GENDERS)
            age = random.randint(65, 80) if "elderly" in tag else random.randint(18, 60)
            weight = round(random.uniform(*w_range), 1)
            height = round(random.uniform(155, 190), 1)
            body_fat = round(random.uniform(*bf_range), 1)
            activity = "sedentary" if "obesity" in tag else random.choice(ACTIVITY_LEVELS[:3])
            if kcal_mod < 1.0:
                goal = "weight_loss"
            elif kcal_mod > 1.15:
                goal = "muscle_gain"
            else:
                goal = "maintenance"

            # Use "maintenance" as the base so kcal_mod is the SOLE deficit/surplus
            # mechanism.  Previously, goal="weight_loss" already applied 0.80× inside
            # calorie_target, and then kcal_mod (e.g. 0.70) stacked on top → 0.56× TDEE,
            # which is a dangerously aggressive 44% deficit.
            daily_kcal = int(calorie_target("maintenance", weight, body_fat, activity,
                                            gender=gender, height_cm=height, age=age) * kcal_mod)
            daily_kcal = max(1200, min(daily_kcal, 4500))  # safety clamp (1200 = clinical minimum)

            disease_key = random.choice(diseases) if diseases else None
            protein_pct = 35 if tag in ("severe_underweight", "elite_athlete") else 25
            fat_pct = 20 if tag in ("extreme_obesity", "hypertension_obese") else 25
            carbs_pct = 100 - protein_pct - fat_pct

            rec, avoid = pick_disease_foods(disease_key) if disease_key else ([], [])

            conditions_str = ", ".join(diseases) if diseases else "none"
            disease_notes_str = ""
            if rec:
                disease_notes_str += f"Recommended for {conditions_str}: {', '.join(rec)}. "
            if avoid:
                disease_notes_str += f"Avoid for {conditions_str}: {', '.join(avoid)}. "
            user_msg = (
                f"Create a 3-day halal nutrition plan for a {age}-year-old {gender}, "
                f"weight {weight} kg, height {height} cm. "
                f"Goal: {goal.replace('_', ' ')}, activity: {activity}. "
                f"Health conditions: {conditions_str}. "
                f"Allergies: none. "
                f"Cuisine preference: egyptian. "
                f"Daily calorie target: {daily_kcal} kcal. "
                f"Macro targets \u2014 protein: {protein_pct}%, carbs: {carbs_pct}%, fat: {fat_pct}%. "
                + (disease_notes_str if disease_notes_str else "")
                + "Return only a valid JSON 3-day nutrition plan with breakfast, lunch, dinner, and snack per day."
            )

            plan = build_3day_plan(daily_kcal, protein_pct, carbs_pct, fat_pct,
                                   disease_key=disease_key)
            if plan is None:
                continue
            samples.append({"messages": [
                {"role": "system",    "content": SYSTEM_PROMPT},
                {"role": "user",      "content": user_msg},
                {"role": "assistant", "content": json.dumps(plan, ensure_ascii=False)},
            ]})
    return samples


def make_history_plan(n: int = 1500) -> list:
    """Plans where the user references a previous plan so the model learns to
    generate fresh variety instead of repeating the same meals.

    Training signal: given 'I had X last week', produce a different 3-day plan.
    The previous plan's foods are summarised (not the full JSON) to stay inside
    the 2048-token budget and mirror how the app will call the model.
    """
    samples = []
    PREV_INTROS = [
        "IMPORTANT: I already followed this plan last week — please generate a COMPLETELY DIFFERENT plan with different meals and foods.",
        "NOTE: My previous plan had these foods: {prev_foods}. I need variety — generate a fresh plan that avoids repeating those same foods.",
        "I followed a plan recently that included: {prev_foods}. Please create a new different plan so I don't get bored eating the same things.",
        "My last 3-day plan included meals with: {prev_foods}. I want a different set of meals this time.",
        "Previous plan already used: {prev_foods}. Generate a new plan with different food choices for the same calorie target.",
    ]

    for _ in range(n):
        gender    = random.choice(GENDERS)
        age       = random.randint(18, 65)
        weight    = round(random.uniform(50, 120), 1)
        height    = round(random.uniform(155, 190), 1)
        goal      = random.choice(GOALS)
        activity  = random.choice(ACTIVITY_LEVELS)

        protein_pct = random.choice([25, 30, 35]) if goal == "muscle_gain" else random.choice([20, 25])
        fat_pct     = random.choice([25, 30])
        carbs_pct   = 100 - protein_pct - fat_pct

        daily_kcal  = calorie_target(goal, weight, activity=activity,
                                     gender=gender, height_cm=height, age=age)

        # ── Build a "previous" plan just to extract food names ─────────────
        prev_plan   = build_3day_plan(daily_kcal, protein_pct, carbs_pct, fat_pct)
        if prev_plan is None:
            continue  # no valid previous plan — skip this sample entirely
        prev_foods_set: set = set()
        try:
            for day_data in prev_plan.get("days", [])[:2]:          # summarise 2 days
                for meal_data in day_data.get("meals", {}).values():
                    for item in meal_data.get("items", [])[:2]:     # 2 items per meal
                        if item.get("name"):
                            prev_foods_set.add(item["name"])
        except Exception:
            pass
        prev_foods_str = ", ".join(sorted(prev_foods_set)[:8]) or "various Egyptian foods"

        # ── Build the NEW (target) plan — different random seed = different foods ─
        new_plan = build_3day_plan(daily_kcal, protein_pct, carbs_pct, fat_pct)
        if new_plan is None:
            continue
        base_msg = (
            f"Create a 3-day halal nutrition plan for a {age}-year-old {gender}, "
            f"weight {weight} kg, height {height} cm. "
            f"Goal: {goal.replace('_', ' ')}, activity: {activity}. "
            f"Health conditions: none. "
            f"Allergies: none. "
            f"Cuisine preference: egyptian. "
            f"Daily calorie target: {daily_kcal} kcal. "
            f"Macro targets \u2014 protein: {protein_pct}%, carbs: {carbs_pct}%, fat: {fat_pct}%. "
        )
        history_note = random.choice(PREV_INTROS).format(prev_foods=prev_foods_str)
        user_msg = base_msg + history_note + " Return only a valid JSON 3-day nutrition plan with breakfast, lunch, dinner, and snack per day."

        samples.append({"messages": [
            {"role": "system",    "content": SYSTEM_PROMPT},
            {"role": "user",      "content": user_msg},
            {"role": "assistant", "content": json.dumps(new_plan, ensure_ascii=False)},
        ]})
    return samples


def load_smolmeal_sft(n: int = 2000) -> list:
    """
    Load pre-built SFT pairs from smolified-smolmeal-adaptive-daily-meal-planner.csv
    Columns: system, user, assistant  (or similar)
    """
    path = os.path.join(DATASET_DIR,
                        "smolified-smolmeal-adaptive-daily-meal-planner.csv")
    if not os.path.exists(path):
        print("  [WARN] smolmeal CSV not found — skipping.")
        return []

    df = pd.read_csv(path, encoding="utf-8", low_memory=False)
    df.columns = [c.strip().lower() for c in df.columns]
    print(f"  smolmeal CSV: {len(df):,} rows, cols={list(df.columns)}")

    samples = []
    sys_col = next((c for c in df.columns if "system" in c), None)
    user_col = next(
        (c for c in df.columns if "user" in c or "input" in c), None)
    asst_col = next(
        (c for c in df.columns if "assistant" in c or "output" in c or "response" in c), None)

    if not (user_col and asst_col):
        print(f"  [WARN] Could not find user/assistant columns in smolmeal CSV.")
        return []

    df = df.dropna(subset=[user_col, asst_col])
    df = df.sample(min(n, len(df)), random_state=42)

    for _, row in df.iterrows():
        user_content = str(row[user_col]).strip()
        asst_content = str(row[asst_col]).strip()
        if not user_content or not asst_content:
            continue
        samples.append({"messages": [
            {"role": "system",    "content": SYSTEM_PROMPT},
            {"role": "user",      "content": user_content},
            {"role": "assistant", "content": asst_content},
        ]})
    print(f"  smolmeal samples loaded: {len(samples):,}")
    return samples


def load_allergen_sft(n: int = 1500) -> list:
    """
    Load allergen SFT pairs from smolified-smart-food-safety-allergy-detector-training.csv
    """
    path = os.path.join(DATASET_DIR,
                        "smolified-smart-food-safety-allergy-detector-training.csv")
    if not os.path.exists(path):
        print("  [WARN] allergen SFT CSV not found — skipping.")
        return []

    df = pd.read_csv(path, encoding="utf-8", low_memory=False)
    df.columns = [c.strip().lower() for c in df.columns]
    print(f"  allergen SFT CSV: {len(df):,} rows, cols={list(df.columns)}")

    sys_col = next((c for c in df.columns if "system" in c), None)
    user_col = next(
        (c for c in df.columns if "user" in c or "input" in c), None)
    asst_col = next(
        (c for c in df.columns if "assistant" in c or "output" in c or "response" in c), None)

    if not (user_col and asst_col):
        print(f"  [WARN] allergen SFT: could not find user/assistant columns.")
        return []

    df = df.dropna(subset=[user_col, asst_col])
    df = df.sample(min(n, len(df)), random_state=42)

    samples = []
    for _, row in df.iterrows():
        user_content = str(row[user_col]).strip()
        asst_content = str(row[asst_col]).strip()
        if not user_content or not asst_content:
            continue
        samples.append({"messages": [
            {"role": "system",    "content": SYSTEM_PROMPT},
            {"role": "user",      "content": user_content},
            {"role": "assistant", "content": asst_content},
        ]})
    print(f"  allergen SFT samples: {len(samples):,}")
    return samples


def load_food_nutrition_sft(n: int = 800) -> list:
    """
    Convert Food_and_Nutrition__.csv rows into SFT pairs.
    Each row becomes: user asks for a plan for that condition, assistant returns
    a structured 3-day plan using the row's Meal_Plan and Food_Items as a guide.
    """
    path = os.path.join(DATASET_DIR, "Food_and_Nutrition__.csv")
    if not os.path.exists(path):
        print("  [WARN] Food_and_Nutrition__ CSV not found — skipping.")
        return []

    df = pd.read_csv(path, encoding="utf-8", low_memory=False)
    df.columns = [c.strip() for c in df.columns]
    df = df.dropna(subset=["Disease"])
    df = df.sample(min(n, len(df)), random_state=42)

    samples = []
    for _, row in df.iterrows():
        disease  = str(row.get("Disease", "")).strip()
        age_val  = safe_float(row.get("Ages", None))
        age_group = f"{int(age_val)}-year-old" if age_val else "adult"
        gender   = str(row.get("Gender", "")).strip().lower()
        activity = str(row.get("Activity Level", "moderate")).strip()
        daily_kcal = int(safe_float(row.get("Daily Calorie Target", 2000)) or 2000)

        # Meal suggestions from CSV columns
        breakfast = str(row.get("Breakfast Suggestion", "")).strip()
        lunch     = str(row.get("Lunch Suggestion",     "")).strip()
        dinner    = str(row.get("Dinner Suggestion",    "")).strip()
        snack     = str(row.get("Snack Suggestion",     "")).strip()
        _clean = lambda s: s if s and s.lower() not in ("nan", "none") else ""
        meal_suggestion_str = ""
        if _clean(breakfast): meal_suggestion_str += f"Breakfast example: {_clean(breakfast)}. "
        if _clean(lunch):     meal_suggestion_str += f"Lunch example: {_clean(lunch)}. "
        if _clean(dinner):    meal_suggestion_str += f"Dinner example: {_clean(dinner)}. "
        if _clean(snack):     meal_suggestion_str += f"Snack example: {_clean(snack)}. "

        # Derive macro percentages from gram data
        protein_g = safe_float(row.get("Protein",       0)) or 0
        carbs_g   = safe_float(row.get("Carbohydrates", 0)) or 0
        fat_g     = safe_float(row.get("Fat",           0)) or 0
        total_macro_kcal = protein_g * 4 + carbs_g * 4 + fat_g * 9
        if total_macro_kcal > 0:
            protein_pct = round(protein_g * 4 / total_macro_kcal * 100)
            carbs_pct   = round(carbs_g   * 4 / total_macro_kcal * 100)
            fat_pct     = 100 - protein_pct - carbs_pct
        else:
            protein_pct, carbs_pct, fat_pct = 25, 50, 25

        gender_str = gender if gender in (
            "male", "female") else random.choice(GENDERS)
        weight = round(random.uniform(60, 100), 1)

        user_msg = (
            f"Create a 3-day halal nutrition plan for a {age_group} {gender_str} "
            f"weighing {weight} kg with {disease}. "
            f"Goal: weight management, activity: {activity}. "
            f"Health conditions: {disease}. "
            f"Allergies: none. "
            f"Cuisine preference: egyptian. "
            f"Daily calorie target: {daily_kcal} kcal. "
            f"Macro targets \u2014 protein: {protein_pct}%, carbs: {carbs_pct}%, fat: {fat_pct}%. "
            + (meal_suggestion_str if meal_suggestion_str else "")
            + "Return only a valid JSON 3-day nutrition plan with breakfast, lunch, dinner, and snack per day."
        )

        # Build assistant response guided by dataset row
        plan = build_3day_plan(
            daily_kcal=daily_kcal,
            protein_pct=protein_pct, carbs_pct=carbs_pct, fat_pct=fat_pct,
            disease_key=disease.lower()
        )
        if plan is None:
            continue
        # Attach meal suggestions as reference data in the plan
        ref = {k: v for k, v in {
            "breakfast": _clean(breakfast),
            "lunch":     _clean(lunch),
            "dinner":    _clean(dinner),
            "snack":     _clean(snack),
        }.items() if v}
        if ref:
            plan["reference_suggestions"] = ref

        samples.append({"messages": [
            {"role": "system",    "content": SYSTEM_PROMPT},
            {"role": "user",      "content": user_msg},
            {"role": "assistant", "content": json.dumps(
                plan, ensure_ascii=False)},
        ]})
    print(f"  Food_and_Nutrition__ SFT samples: {len(samples):,}")
    return samples



# ══════════════════════════════════════════════════════════════════════════════
# MAIN ASSEMBLY
# ══════════════════════════════════════════════════════════════════════════════

print("\n[GENERATING SFT DATASET]")
all_samples = []

def _tag(samples: list, category: str) -> list:
    """Stamp a _category key so stratified_split can bucket by source."""
    for s in samples:
        s["_category"] = category
    return samples


def stratified_split(samples: list, train_frac: float = 0.90):
    """90/10 split that preserves per-category proportions.

    Without this, a simple random slice can leave entire categories
    under-represented in eval (e.g. if disease plans happened to cluster
    at the end of the list before shuffling).
    """
    from collections import defaultdict
    buckets: dict = defaultdict(list)
    for s in samples:
        buckets[s.get("_category", "unknown")].append(s)

    train, eval_ = [], []
    print("\nStratified split breakdown:")
    for cat, items in sorted(buckets.items()):
        random.shuffle(items)
        n_train = max(1, int(len(items) * train_frac))
        train.extend(items[:n_train])
        eval_.extend(items[n_train:])
        print(f"  {cat:<22} total={len(items):>5}  train={n_train:>5}  eval={len(items)-n_train:>4}")

    random.shuffle(train)
    random.shuffle(eval_)
    return train, eval_


print("Generating basic demographic plans...")
all_samples += _tag(make_basic_plan(n=2000), "basic")
print(f"  → {len(all_samples):,} total")

print("Generating disease-specific plans...")
all_samples += _tag(make_disease_plan(n=2000), "disease")
print(f"  → {len(all_samples):,} total")

print("Generating InBody-aware plans...")
all_samples += _tag(make_inbody_plan(n=2500), "inbody")
print(f"  → {len(all_samples):,} total")

print("Generating allergen-restricted plans...")
all_samples += _tag(make_allergen_plan(n=1500), "allergen")
print(f"  → {len(all_samples):,} total")

print("Generating edge-case plans...")
all_samples += _tag(make_edge_case_plan(n=500), "edge_case")
print(f"  → {len(all_samples):,} total")

print("Generating plan-history / variety plans...")
all_samples += _tag(make_history_plan(n=1500), "history")
print(f"  → {len(all_samples):,} total")

print("Loading smolmeal SFT pairs...")
all_samples += _tag(load_smolmeal_sft(n=2000), "smolmeal")
print(f"  → {len(all_samples):,} total")

print("Loading allergen SFT pairs...")
all_samples += _tag(load_allergen_sft(n=1500), "allergen_sft")
print(f"  → {len(all_samples):,} total")

print("Converting Food_and_Nutrition__ rows to SFT...")
all_samples += _tag(load_food_nutrition_sft(n=800), "food_nutrition")
print(f"  → {len(all_samples):,} total")

# ── Stratified shuffle and split ─────────────────────────────────────────────
train_set, eval_set = stratified_split(all_samples, train_frac=0.90)

print(f"\nTotal samples : {len(all_samples):,}")
print(f"Train split   : {len(train_set):,}")
print(f"Eval split    : {len(eval_set):,}")

# ── Write CSV files ──────────────────────────────────────────────────────────


def validate_sample(item: dict) -> bool:
    """Return True if sample has valid chat messages and (for JSON-producing
    generators) a structurally correct 3-day plan.  Smolmeal/allergen SFT rows
    that return plain text pass without the JSON structure check."""
    msgs = item.get("messages", [])
    if len(msgs) < 3:
        return False
    roles = {m.get("role") for m in msgs}
    if not {"system", "user", "assistant"}.issubset(roles):
        return False
    asst = next((m["content"] for m in msgs if m["role"] == "assistant"), "")
    if not asst.strip():
        return False
    # Validate JSON structure only for synthetic plan generators.
    # Non-plan JSON responses (e.g. allergen detection: {"ingredients":..., "allergens":...})
    # have no "days" key — they must NOT be rejected by the plan-structure check.
    if asst.strip().startswith("{"):
        try:
            plan = json.loads(asst)
            days = plan.get("days")          # None if key absent (allergen/other JSON)
            if days is not None:             # only validate structure for plan responses
                if len(days) < 3:
                    return False
                for day in days:
                    if "meals" not in day or len(day["meals"]) < 3:
                        return False
        except (json.JSONDecodeError, KeyError, TypeError):
            return False
    return True


def write_csv(data: list, path: str):
    """Validate every sample, then save full messages as a JSON-encoded string.
    The training script calls json.loads(example['messages']) to recover the
    exact system/user/assistant structure — no hardcoded system prompt needed.
    """
    rows = []
    skipped = 0
    for item in data:
        if not validate_sample(item):
            skipped += 1
            continue
        rows.append({"messages": json.dumps(item["messages"], ensure_ascii=False)})
    if skipped:
        print(f"  [INFO] Validation filtered {skipped} malformed samples")
    df = pd.DataFrame(rows)
    df.to_csv(path, index=False, encoding="utf-8")
    print(
        f"  Written: {path}  ({len(df):,} rows, {os.path.getsize(path)/1e6:.1f} MB)")


print("\nWriting CSV files...")
write_csv(train_set, OUTPUT_TRAIN)
write_csv(eval_set,  OUTPUT_EVAL)

print(f"\n[OK] Done.")
print(f"   Train: {OUTPUT_TRAIN}")
print(f"   Eval : {OUTPUT_EVAL}")
