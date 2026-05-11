"""
build_food_db.py
----------------
Builds food_db_halal.json from two datasets:
  PRIMARY:   egyptian-nutrition-dataset-overview.csv   (20,470 Egyptian foods, 21 cols)
  SECONDARY: comprehensive_foods_usda.csv              (40,000 USDA foods, 24 cols)

Halal filtering removes any food whose name contains pork/lard/gelatin/alcohol keywords.
Output: food_db_halal.json — list of dicts with unified schema.

Run:
    python build_food_db.py
"""

import pandas as pd
import json
import os
import re

BASE = os.path.dirname(__file__)
DATASET_DIR = os.path.join(BASE, "Dataset")
OUTPUT_PATH = os.path.join(BASE, "food_db_halal.json")

# ── Halal blocklist (case-insensitive substring match) ──────────────────────
HARAM_KEYWORDS = [
    "pork", "pig", "bacon", "ham", "lard", "prosciutto", "salami",
    "pepperoni", "gelatin", "gelatine", "beer", "wine", "alcohol",
    "liquor", "whiskey", "vodka", "rum", "sake", "brandy",
    "blood sausage", "black pudding",
]


def is_halal(food_name: str) -> bool:
    name_lower = str(food_name).lower()
    return not any(kw in name_lower for kw in HARAM_KEYWORDS)


# ── Schema normalisation ────────────────────────────────────────────────────
def safe_float(val, default=None):
    try:
        f = float(val)
        return round(f, 2) if not pd.isna(f) else default
    except (ValueError, TypeError):
        return default


def safe_int(val, default=None):
    try:
        f = float(val)
        return int(f) if not pd.isna(f) else default
    except (ValueError, TypeError):
        return default


# ── Meal-type and food-role heuristics ──────────────────────────────────────
_USDA_CAT_META = {
    "Breakfast Cereals":                   {"meal_type": ["breakfast"],           "food_role": "carb"},
    "Cereal Grains and Pasta":             {"meal_type": ["lunch", "dinner"],     "food_role": "carb"},
    "Baked Products":                      {"meal_type": ["breakfast", "snack"],  "food_role": "carb"},
    "Beef Products":                       {"meal_type": ["lunch", "dinner"],     "food_role": "protein"},
    "Poultry Products":                    {"meal_type": ["lunch", "dinner"],     "food_role": "protein"},
    "Lamb, Veal, and Game Products":       {"meal_type": ["lunch", "dinner"],     "food_role": "protein"},
    "Finfish and Shellfish Products":      {"meal_type": ["lunch", "dinner"],     "food_role": "protein"},
    "Legumes and Legume Products":         {"meal_type": ["lunch", "dinner"],     "food_role": "protein"},
    "Dairy and Egg Products":              {"meal_type": ["breakfast", "snack"],  "food_role": "dairy"},
    "Vegetables and Vegetable Products":   {"meal_type": ["lunch", "dinner"],     "food_role": "vegetable"},
    "Fruits and Fruit Juices":             {"meal_type": ["breakfast", "snack"],  "food_role": "fruit"},
    "Nut and Seed Products":               {"meal_type": ["snack"],               "food_role": "fat"},
    "Fats and Oils":                       {"meal_type": [],                      "food_role": "fat"},
    "Sweets":                              {"meal_type": ["snack"],               "food_role": "carb"},
    "Beverages":                           {"meal_type": [],                      "food_role": None},
    "Soups, Sauces, and Gravies":          {"meal_type": ["lunch", "dinner"],     "food_role": "carb"},
    "Spices and Herbs":                    {"meal_type": [],                      "food_role": None},
    "Snacks":                              {"meal_type": ["snack"],               "food_role": "carb"},
    "Fast Foods":                          {"meal_type": ["lunch", "dinner"],     "food_role": "protein"},
    "Restaurant Foods":                    {"meal_type": ["lunch", "dinner"],     "food_role": "protein"},
    "Meals, Entrees, and Side Dishes":     {"meal_type": ["lunch", "dinner"],     "food_role": "carb"},
    "American Indian/Alaska Native Foods": {"meal_type": ["lunch", "dinner"],     "food_role": "carb"},
    "Pork Products":                       {"meal_type": [],                      "food_role": None},
}
_USDA_DEFAULT_META = {"meal_type": ["lunch", "dinner"], "food_role": "carb"}

_EGY_MT_KEYWORDS = {
    "breakfast": ["labneh", "foul", "ful medames", "baladi bread", "aish baladi",
                  "gibna", "cheese", "beid", "egg", "halawa", "tahini", "feteer",
                  "oatmeal", "yogurt", "zabadi", "keshk", "honey", "jam"],
    "lunch":     ["kofta", "kebab", "mahshi", "fattah", "koshari", "molokhia",
                  "fatta", "grilled chicken", "fried fish", "samak", "lamb", "roz",
                  "rice", "pasta", "macarona", "lentil", "adas", "hawawshi",
                  "shawerma", "mulukhiyah", "chicken", "beef", "liver", "kibda"],
    "snack":     ["biscuit", "cake", "basbousa", "om ali", "konafa", "ghorayeba",
                  "kahk", "dates", "banana", "apple", "orange", "nuts", "juice", "chocolate"],
    "dinner":    ["salad", "soup", "shorbat", "grilled vegetable", "baked"],
}
_ROLE_KEYWORDS = {
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


def _infer_meal_type_egy(name: str) -> list:
    n = name.lower()
    return [meal for meal, kws in _EGY_MT_KEYWORDS.items()
            if any(kw in n for kw in kws)] or ["lunch", "dinner"]


def _infer_food_role(name: str, per_100g: dict) -> str:
    n = name.lower()
    for role, kws in _ROLE_KEYWORDS.items():
        if any(kw in n for kw in kws):
            return role
    p = per_100g.get("protein_g") or 0
    c = per_100g.get("carbs_g") or 0
    f = per_100g.get("fat_g") or 0
    if p >= c and p >= f and p > 0:
        return "protein"
    if f > c and f > p and f > 0:
        return "fat"
    return "carb"


# ── Step 1: Load Egyptian dataset (PRIMARY) ─────────────────────────────────
print("[1/3] Loading Egyptian nutrition dataset...")
egy_path = os.path.join(DATASET_DIR, "egyptian-nutrition-dataset-overview.csv")
df_egy = pd.read_csv(egy_path, encoding="utf-8", low_memory=False)

print(f"      Rows: {len(df_egy):,}  |  Cols: {list(df_egy.columns)}")

# Normalise column names (strip whitespace, upper)
df_egy.columns = [c.strip() for c in df_egy.columns]

# The Egyptian CSV columns (actual):
# FOOD, REFUSE(%), WATER (g), ENERGY (Kcal), PROTEIN (g), FAT (g), ASH (g),
# FIBER (g), CARBOHYDRATE (g), SODIUM (mg), POTASSIUM (mg), CALCIUM (mg),
# PHOSPHORUS (mg), MAGNESIUM (mg), IRON (mg), ZINC (mg), COPPER (mg),
# VITAMIN A (ugre), VITAMIN C (mg), THIAMIN (mg), REBOFLAVIN (mg)

egy_records = []
skipped_haram = 0
for _, row in df_egy.iterrows():
    name = str(row.get("FOOD", "")).strip()
    if not name or name.lower() == "nan":
        continue
    if not is_halal(name):
        skipped_haram += 1
        continue

    _p100g = {
        "calories_kcal":   safe_float(row.get("ENERGY (Kcal)")),
        "protein_g":       safe_float(row.get("PROTEIN (g)")),
        "fat_g":           safe_float(row.get("FAT (g)")),
        "carbs_g":         safe_float(row.get("CARBOHYDRATE (g)")),
        "fiber_g":         safe_float(row.get("FIBER (g)")),
        "water_g":         safe_float(row.get("WATER (g)")),
        "sodium_mg":       safe_float(row.get("SODIUM (mg)")),
        "potassium_mg":    safe_float(row.get("POTASSIUM (mg)")),
        "calcium_mg":      safe_float(row.get("CALCIUM (mg)")),
        "phosphorus_mg":   safe_float(row.get("PHOSPHORUS (mg)")),
        "magnesium_mg":    safe_float(row.get("MAGNESIUM (mg)")),
        "iron_mg":         safe_float(row.get("IRON (mg)")),
        "zinc_mg":         safe_float(row.get("ZINC (mg)")),
        "copper_mg":       safe_float(row.get("COPPER (mg)")),
        "vitamin_a_ug":    safe_float(row.get("VITAMIN A (ugre)")),
        "vitamin_c_mg":    safe_float(row.get("VITAMIN C (mg)")),
        "thiamin_mg":      safe_float(row.get("THIAMIN (mg)")),
        "riboflavin_mg":   safe_float(row.get("REBOFLAVIN (mg)")),
    }
    egy_records.append({
        "id": f"egy_{len(egy_records):05d}",
        "name": name,
        "source": "egyptian",
        "per_100g": _p100g,
        "food_category": None,
        "health_score": None,
        "meal_type": _infer_meal_type_egy(name),
        "food_role": _infer_food_role(name, _p100g),
    })

print(
    f"      Egyptian records: {len(egy_records):,}  |  Haram skipped: {skipped_haram}")


# ── Step 2: Load USDA dataset (SECONDARY) ──────────────────────────────────
print("[2/3] Loading USDA comprehensive foods dataset...")
usda_path = os.path.join(DATASET_DIR, "comprehensive_foods_usda.csv")
df_usda = pd.read_csv(usda_path, encoding="utf-8", low_memory=False)
df_usda.columns = [c.strip() for c in df_usda.columns]

print(f"      Rows: {len(df_usda):,}  |  Cols: {list(df_usda.columns)}")

# USDA CSV columns (from analysis):
# fdc_id, food_name, data_type, food_category, brand_owner, brand_name,
# ingredients, serving_size, serving_unit, household_serving,
# calories, carbs_g, calcium_mg, fat_g, protein_g, saturated_fat_g,
# vitamin_c_mg, fiber_g, iron_mg, sodium_mg, sugar_g, cholesterol_mg,
# health_score, food_type

# Build a set of normalised names already in Egyptian DB to skip duplicates
egy_names_set = {r["name"].lower() for r in egy_records}

usda_records = []
skipped_haram_usda = 0
skipped_dup = 0

for _, row in df_usda.iterrows():
    name = str(row.get("food_name", "")).strip()
    if not name or name.lower() == "nan":
        continue
    if not is_halal(name):
        skipped_haram_usda += 1
        continue
    # Skip if a very similar name exists in Egyptian DB
    if name.lower() in egy_names_set:
        skipped_dup += 1
        continue

    _category = str(row.get("food_category", "")).strip() or None
    _cat_meta = _USDA_CAT_META.get(_category, _USDA_DEFAULT_META)
    _p100g = {
        "calories_kcal":      safe_float(row.get("calories")),
        "protein_g":          safe_float(row.get("protein_g")),
        "fat_g":              safe_float(row.get("fat_g")),
        "carbs_g":            safe_float(row.get("carbs_g")),
        "fiber_g":            safe_float(row.get("fiber_g")),
        "water_g":            None,
        "sodium_mg":          safe_float(row.get("sodium_mg")),
        "potassium_mg":       None,
        "calcium_mg":         safe_float(row.get("calcium_mg")),
        "phosphorus_mg":      None,
        "magnesium_mg":       None,
        "iron_mg":            safe_float(row.get("iron_mg")),
        "zinc_mg":            None,
        "copper_mg":          None,
        "vitamin_a_ug":       None,
        "vitamin_c_mg":       safe_float(row.get("vitamin_c_mg")),
        "thiamin_mg":         None,
        "riboflavin_mg":      None,
        "saturated_fat_g":    safe_float(row.get("saturated_fat_g")),
        "sugar_g":            safe_float(row.get("sugar_g")),
        "cholesterol_mg":     safe_float(row.get("cholesterol_mg")),
    }
    usda_records.append({
        "id": f"usda_{len(usda_records):05d}",
        "name": name,
        "source": "usda",
        "per_100g": _p100g,
        "food_category": _category,
        "health_score":  safe_float(row.get("health_score")),
        "food_type":     str(row.get("food_type", "")).strip() or None,
        "meal_type": _cat_meta["meal_type"],
        "food_role": _cat_meta["food_role"] or _infer_food_role(name, _p100g),
    })

print(
    f"      USDA records: {len(usda_records):,}  |  Haram: {skipped_haram_usda}  |  Dups: {skipped_dup}")


# ── Step 3: Merge and write ─────────────────────────────────────────────────
print("[3/3] Merging and writing food_db_halal.json...")
all_records = egy_records + usda_records
print(f"      Total records: {len(all_records):,}")

with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(all_records, f, ensure_ascii=False, indent=2)

print(f"\n✅  Done → {OUTPUT_PATH}")
print(f"   Egyptian foods : {len(egy_records):,}")
print(f"   USDA foods     : {len(usda_records):,}")
print(f"   Total          : {len(all_records):,}")
