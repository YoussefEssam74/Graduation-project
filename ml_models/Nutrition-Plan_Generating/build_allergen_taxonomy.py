"""
build_allergen_taxonomy.py
--------------------------
Builds allergen_taxonomy.json from:
  PRIMARY: foods_allergens.csv  (3,332 foods with boolean allergen flags)

Output: allergen_taxonomy.json — dict keyed by normalised food name.

Run:
    python build_allergen_taxonomy.py
"""

import pandas as pd
import json
import os

BASE = os.path.dirname(__file__)
DATASET_DIR = os.path.join(BASE, "Dataset")
OUTPUT_PATH = os.path.join(BASE, "allergen_taxonomy.json")

ALLERGEN_COLS = [
    "contains_gluten",
    "contains_dairy",
    "contains_nuts",
    "contains_soy",
    "contains_eggs",
    "contains_fish",
]

# Normalise boolean-ish values to True/False/None


def to_bool(val):
    if pd.isna(val):
        return None
    s = str(val).strip().lower()
    if s in ("1", "true", "yes", "t", "y"):
        return True
    if s in ("0", "false", "no", "f", "n"):
        return False
    return None


print("[1/2] Loading foods_allergens.csv...")
path = os.path.join(DATASET_DIR, "foods_allergens.csv")
df = pd.read_csv(path, encoding="utf-8", low_memory=False)
df.columns = [c.strip() for c in df.columns]

print(f"      Rows: {len(df):,}  |  Cols: {list(df.columns)}")

# Build lookup: normalised_name → allergen flags
taxonomy = {}
skipped = 0

for _, row in df.iterrows():
    name = str(row.get("product_name", "")).strip()
    if not name or name.lower() == "nan":
        skipped += 1
        continue

    key = name.lower()
    flags = {}
    for col in ALLERGEN_COLS:
        if col in df.columns:
            flags[col.replace("contains_", "")] = to_bool(row.get(col))

    # Keep brands as metadata if present
    brand = str(row.get("brands", "")).strip()
    entry = {
        "name": name,
        "allergens": flags,
    }
    if brand and brand.lower() != "nan":
        entry["brand"] = brand

    # If duplicate name, merge (keep True flags)
    if key in taxonomy:
        existing = taxonomy[key]["allergens"]
        for k, v in flags.items():
            if v is True:
                existing[k] = True
            elif v is None and existing.get(k) is None:
                existing[k] = None
    else:
        taxonomy[key] = entry

print(f"      Unique food entries: {len(taxonomy):,}  |  Skipped: {skipped}")

print("[2/2] Writing allergen_taxonomy.json...")
with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(taxonomy, f, ensure_ascii=False, indent=2)

print(f"\n✅  Done → {OUTPUT_PATH}")
print(f"   Total allergen entries: {len(taxonomy):,}")
