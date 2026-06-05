import os
import re
import json
import sys
from decimal import Decimal
import psycopg2
from psycopg2 import extras

# Set base path configurations
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SCRIPT_DIR)
NUTRITION_DIR = os.path.join(BASE_DIR, "ml_models", "Nutrition-Plan_Generating")

# Allergen taxonomy path
ALLERGEN_PATH = os.path.join(NUTRITION_DIR, "allergen_taxonomy.json")
# Halal food database path
FOOD_DB_PATH = os.path.join(NUTRITION_DIR, "food_db_halal.json")
# Disease rules path
DISEASE_RULES_PATH = os.path.join(NUTRITION_DIR, "disease_rules.json")
# Env file path
ENV_PATH = os.path.join(BASE_DIR, ".env")


def parse_csharp_connection_string(conn_str):
    """Parses an ASP.NET Connection String into psycopg2 parameters."""
    params = {}
    for part in conn_str.split(";"):
        if not part.strip():
            continue
        if "=" not in part:
            continue
        key, val = part.split("=", 1)
        key = key.strip().lower()
        val = val.strip()
        if key in ("host", "server"):
            params["host"] = val
        elif key in ("database", "db"):
            params["dbname"] = val
        elif key in ("username", "user", "uid"):
            params["user"] = val
        elif key in ("password", "pwd"):
            params["password"] = val
        elif key == "port":
            params["port"] = int(val)
        elif key in ("ssl mode", "sslmode"):
            val_lower = val.lower()
            if val_lower == "require":
                params["sslmode"] = "require"
            elif val_lower == "disable":
                params["sslmode"] = "disable"
            elif val_lower == "prefer":
                params["sslmode"] = "prefer"
            elif val_lower == "allow":
                params["sslmode"] = "allow"
    return params


def get_db_connection():
    """Reads .env first for ConnectionStrings__DefaultConnection, falls back to localhost."""
    conn_str = None
    if os.path.exists(ENV_PATH):
        print("Reading connection string from .env...")
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("ConnectionStrings__DefaultConnection="):
                    conn_str = line.split("=", 1)[1]
                    break

    if conn_str:
        try:
            params = parse_csharp_connection_string(conn_str)
            print(f"Connecting to database host: {params.get('host')}...")
            conn = psycopg2.connect(**params)
            return conn
        except Exception as e:
            print(f"[WARNING] Connection to Neon failed, falling back to local: {e}")

    # Fallback to local default parameters
    local_params = {
        "host": "localhost",
        "port": 5432,
        "dbname": "PulseGym_v1.0.1",
        "user": "postgres",
        "password": "123",
    }
    print("Connecting to local database (localhost)...")
    return psycopg2.connect(**local_params)


def run_ddl_extensions(cursor):
    """Adds allergen columns and food_role to ingredients, and creates disease rule tables."""
    print("Running database DDL extensions...")

    # 1. Alter ingredients table for allergens and food role
    columns_to_add = [
        ('ContainsDairy', 'BOOLEAN DEFAULT FALSE'),
        ('ContainsGluten', 'BOOLEAN DEFAULT FALSE'),
        ('ContainsNuts', 'BOOLEAN DEFAULT FALSE'),
        ('ContainsSoy', 'BOOLEAN DEFAULT FALSE'),
        ('ContainsEggs', 'BOOLEAN DEFAULT FALSE'),
        ('ContainsFish', 'BOOLEAN DEFAULT FALSE'),
        ('FoodRole', 'VARCHAR(50)'),
    ]

    for col_name, col_type in columns_to_add:
        # Check if column exists in information_schema (case sensitive!)
        cursor.execute(
            """
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name = 'ingredients' 
                AND column_name = %s
            )
        """,
            (col_name,),
        )
        exists = cursor.fetchone()[0]
        if not exists:
            print(f"  - Adding column \"{col_name}\" to ingredients table...")
            cursor.execute(f'ALTER TABLE ingredients ADD COLUMN "{col_name}" {col_type};')
        else:
            print(f"  - Column \"{col_name}\" already exists in ingredients table.")

    # 2. Create disease_rules table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS disease_rules (
            disease_rule_id SERIAL PRIMARY KEY,
            disease_key VARCHAR(100) UNIQUE NOT NULL,
            disease_name VARCHAR(150) NOT NULL,
            min_kcal INT,
            max_kcal INT,
            median_kcal INT,
            calorie_source VARCHAR(250),
            calorie_sample_size INT,
            protein_pct DECIMAL(5,2),
            carbs_pct DECIMAL(5,2),
            fat_pct DECIMAL(5,2),
            protein_g_avg DECIMAL(6,2),
            carbs_g_avg DECIMAL(6,2),
            fat_g_avg DECIMAL(6,2),
            macro_source VARCHAR(250),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """
    )
    print("  - Table \"disease_rules\" ready.")

    # 3. Create disease_avoided_ingredients junction table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS disease_avoided_ingredients (
            disease_rule_id INT REFERENCES disease_rules(disease_rule_id) ON DELETE CASCADE,
            ingredient_id INT REFERENCES ingredients("IngredientId") ON DELETE CASCADE,
            PRIMARY KEY (disease_rule_id, ingredient_id)
        );
    """
    )
    print("  - Table \"disease_avoided_ingredients\" ready.")

    # 4. Create disease_recommended_ingredients junction table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS disease_recommended_ingredients (
            disease_rule_id INT REFERENCES disease_rules(disease_rule_id) ON DELETE CASCADE,
            ingredient_id INT REFERENCES ingredients("IngredientId") ON DELETE CASCADE,
            PRIMARY KEY (disease_rule_id, ingredient_id)
        );
    """
    )
    print("  - Table \"disease_recommended_ingredients\" ready.")


def load_allergen_taxonomy():
    """Loads allergen taxonomy file."""
    if not os.path.exists(ALLERGEN_PATH):
        print(f"[WARNING] Allergen taxonomy file not found at {ALLERGEN_PATH}. Using fallback heuristics only.")
        return {}
    print(f"Loading allergen taxonomy from {ALLERGEN_PATH}...")
    with open(ALLERGEN_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def get_allergens_for_food(name, brand, allergen_taxonomy):
    """Retrieves allergens using taxonomy lookup or fallback heuristics."""
    name_lower = name.lower()
    
    # Try exact lookup in taxonomy first
    if name_lower in allergen_taxonomy:
        return allergen_taxonomy[name_lower]["allergens"]

    # Fallback heuristics
    allergens = {
        "gluten": False,
        "dairy": False,
        "nuts": False,
        "soy": False,
        "eggs": False,
        "fish": False,
    }

    # Substring rule checks
    dairy_kw = ["milk", "cheese", "yogurt", "butter", "cream", "labneh", "zabadi", "lait", "dairy", "whey", "casein", "ghee", "mozzarella", "cheddar", "feta"]
    gluten_kw = ["wheat", "flour", "bread", "gluten", "barley", "rye", "oat", "semolina", "pasta", "spaghetti", "macaroni", "noodle"]
    nuts_kw = ["peanut", "almond", "walnut", "cashew", "hazelnut", "pistachio", "pecan", "nut"]
    soy_kw = ["soy", "tofu", "edamame", "soya"]
    eggs_kw = ["egg", "oeuf", "albumin"]
    fish_kw = ["fish", "salmon", "tuna", "cod", "sardine", "mackerel", "shrimp", "prawn", "crab", "lobster", "seafood"]

    if any(kw in name_lower for kw in dairy_kw):
        allergens["dairy"] = True
    if any(kw in name_lower for kw in gluten_kw):
        allergens["gluten"] = True
    if any(kw in name_lower for kw in nuts_kw):
        allergens["nuts"] = True
    if any(kw in name_lower for kw in soy_kw):
        allergens["soy"] = True
    if any(kw in name_lower for kw in eggs_kw):
        allergens["eggs"] = True
    if any(kw in name_lower for kw in fish_kw):
        allergens["fish"] = True

    return allergens


def seed_ingredients(cursor, allergen_taxonomy):
    """Seeds ingredients from food_db_halal.json using a temp staging table for maximum performance."""
    if not os.path.exists(FOOD_DB_PATH):
        print(f"[ERROR] Halal Food Database not found at {FOOD_DB_PATH}")
        sys.exit(1)

    print(f"Loading foods from {FOOD_DB_PATH}...")
    with open(FOOD_DB_PATH, "r", encoding="utf-8") as f:
        foods = json.load(f)

    # 1. Create temporary staging table
    cursor.execute("""
        CREATE TEMP TABLE temp_ingredients (
            name VARCHAR(500),
            category VARCHAR(255),
            calories INT,
            protein NUMERIC(6,2),
            carbs NUMERIC(6,2),
            fats NUMERIC(6,2),
            is_active BOOLEAN,
            contains_dairy BOOLEAN,
            contains_gluten BOOLEAN,
            contains_nuts BOOLEAN,
            contains_soy BOOLEAN,
            contains_eggs BOOLEAN,
            contains_fish BOOLEAN,
            food_role VARCHAR(50)
        ) ON COMMIT DROP;
    """)

    # 2. Build rows for staging table
    temp_rows = []
    for item in foods:
        name = item.get("name", "").strip()
        if not name:
            continue
        
        brand = item.get("brand", "")
        allergens = get_allergens_for_food(name, brand, allergen_taxonomy)

        per_100g = item.get("per_100g", {})
        calories = int(per_100g.get("calories_kcal") or 0)
        protein = Decimal(str(per_100g.get("protein_g") or 0))
        carbs = Decimal(str(per_100g.get("carbs_g") or 0))
        fats = Decimal(str(per_100g.get("fat_g") or 0))
        category = item.get("food_category")
        food_role = item.get("food_role")

        temp_rows.append((
            name,
            category,
            calories,
            protein,
            carbs,
            fats,
            True,  # IsActive
            allergens.get("dairy", False),
            allergens.get("gluten", False),
            allergens.get("nuts", False),
            allergens.get("soy", False),
            allergens.get("eggs", False),
            allergens.get("fish", False),
            food_role
        ))

    # 3. Batch insert into temporary table
    print(f"Uploading {len(temp_rows)} foods to staging table...")
    insert_temp_query = """
        INSERT INTO temp_ingredients (
            name, category, calories, protein, carbs, fats, is_active,
            contains_dairy, contains_gluten, contains_nuts, contains_soy, contains_eggs, contains_fish, food_role
        ) VALUES %s
    """
    extras.execute_values(cursor, insert_temp_query, temp_rows)

    # 4. Bulk update existing ingredients
    print("Performing bulk update/enrichment on existing ingredients...")
    cursor.execute("""
        UPDATE ingredients i
        SET "Category" = t.category,
            "CaloriesPer100g" = t.calories,
            "ProteinPer100g" = t.protein,
            "CarbsPer100g" = t.carbs,
            "FatsPer100g" = t.fats,
            "ContainsDairy" = t.contains_dairy,
            "ContainsGluten" = t.contains_gluten,
            "ContainsNuts" = t.contains_nuts,
            "ContainsSoy" = t.contains_soy,
            "ContainsEggs" = t.contains_eggs,
            "ContainsFish" = t.contains_fish,
            "FoodRole" = t.food_role
        FROM temp_ingredients t
        WHERE LOWER(i."Name") = LOWER(t.name);
    """)
    updated_count = cursor.rowcount

    # 5. Bulk insert missing ingredients
    print("Inserting missing ingredients...")
    cursor.execute("""
        INSERT INTO ingredients (
            "Name", "Category", "CaloriesPer100g", "ProteinPer100g", "CarbsPer100g", "FatsPer100g", "IsActive",
            "ContainsDairy", "ContainsGluten", "ContainsNuts", "ContainsSoy", "ContainsEggs", "ContainsFish", "FoodRole"
        )
        SELECT t.name, t.category, t.calories, t.protein, t.carbs, t.fats, t.is_active,
               t.contains_dairy, t.contains_gluten, t.contains_nuts, t.contains_soy, t.contains_eggs, t.contains_fish, t.food_role
        FROM temp_ingredients t
        LEFT JOIN ingredients i ON LOWER(i."Name") = LOWER(t.name)
        WHERE i."IngredientId" IS NULL;
    """)
    inserted_count = cursor.rowcount

    print(f"Ingredients finished: Seeded {inserted_count} new, updated/enriched {updated_count}.")

    # Build fresh map of all lowercased names to ingredient IDs
    cursor.execute('SELECT "IngredientId", "Name" FROM ingredients')
    return {row[1].strip().lower(): row[0] for row in cursor.fetchall()}


def find_matching_ingredients_bulk(foods_list, ingredient_map):
    """Uses a combined boundary regular expression to match a list of food terms in a single pass."""
    if not foods_list:
        return set()

    patterns = []
    for food in foods_list:
        term = food.strip().lower()
        if not term:
            continue
        # singular/plural variations
        if term.endswith("s") and len(term) > 3:
            term_alt = term[:-1]
        else:
            term_alt = term + "s"
        patterns.append(re.escape(term))
        patterns.append(re.escape(term_alt))

    if not patterns:
        return set()

    # Match with word boundaries
    combined_pattern = re.compile(rf"\b({'|'.join(patterns)})\b", re.IGNORECASE)

    matches = set()
    for name, ing_id in ingredient_map.items():
        if combined_pattern.search(name):
            matches.add(ing_id)

    return matches


def seed_disease_rules(cursor, disease_rules_path, ingredient_map):
    """Seeds disease rules and populates junction tables."""
    if not os.path.exists(disease_rules_path):
        print(f"[ERROR] Disease Rules JSON not found at {disease_rules_path}")
        sys.exit(1)

    print(f"Loading disease rules from {disease_rules_path}...")
    with open(disease_rules_path, "r", encoding="utf-8") as f:
        rules_data = json.load(f)

    for key, val in rules_data.items():
        disease_name = val.get("disease", key.capitalize())
        print(f"Processing disease: {disease_name} ({key})...")

        # Calorie Targets
        cal_target = val.get("calorie_target", {})
        min_kcal = cal_target.get("min_kcal")
        max_kcal = cal_target.get("max_kcal")
        median_kcal = cal_target.get("median_kcal")
        cal_source = cal_target.get("source")
        cal_sample = cal_target.get("sample_size")

        # Macro Targets
        macro_target = val.get("macro_target", {})
        protein_pct = macro_target.get("protein_pct")
        carbs_pct = macro_target.get("carbs_pct")
        fat_pct = macro_target.get("fat_pct")
        protein_g = macro_target.get("protein_g_avg")
        carbs_g = macro_target.get("carbs_g_avg")
        fat_g = macro_target.get("fat_g_avg")
        macro_source = macro_target.get("source")

        # Insert or Update Disease Rule
        cursor.execute(
            """
            INSERT INTO disease_rules (
                disease_key, disease_name, min_kcal, max_kcal, median_kcal, calorie_source, calorie_sample_size,
                protein_pct, carbs_pct, fat_pct, protein_g_avg, carbs_g_avg, fat_g_avg, macro_source
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (disease_key) 
            DO UPDATE SET
                disease_name = EXCLUDED.disease_name,
                min_kcal = EXCLUDED.min_kcal,
                max_kcal = EXCLUDED.max_kcal,
                median_kcal = EXCLUDED.median_kcal,
                calorie_source = EXCLUDED.calorie_source,
                calorie_sample_size = EXCLUDED.calorie_sample_size,
                protein_pct = EXCLUDED.protein_pct,
                carbs_pct = EXCLUDED.carbs_pct,
                fat_pct = EXCLUDED.fat_pct,
                protein_g_avg = EXCLUDED.protein_g_avg,
                carbs_g_avg = EXCLUDED.carbs_g_avg,
                fat_g_avg = EXCLUDED.fat_g_avg,
                macro_source = EXCLUDED.macro_source
            RETURNING disease_rule_id;
        """,
            (
                key,
                disease_name,
                min_kcal,
                max_kcal,
                median_kcal,
                cal_source,
                cal_sample,
                protein_pct,
                carbs_pct,
                fat_pct,
                protein_g,
                carbs_g,
                fat_g,
                macro_source,
            ),
        )
        disease_rule_id = cursor.fetchone()[0]

        # Clear existing junctions to prevent duplicate keys on re-run
        cursor.execute("DELETE FROM disease_avoided_ingredients WHERE disease_rule_id = %s", (disease_rule_id,))
        cursor.execute("DELETE FROM disease_recommended_ingredients WHERE disease_rule_id = %s", (disease_rule_id,))

        # Match and populate recommended foods in bulk
        recommended_foods = val.get("recommended_foods", [])
        recommended_ids = find_matching_ingredients_bulk(recommended_foods, ingredient_map)

        if recommended_ids:
            rec_junctions = [(disease_rule_id, ing_id) for ing_id in recommended_ids]
            extras.execute_values(
                cursor,
                "INSERT INTO disease_recommended_ingredients (disease_rule_id, ingredient_id) VALUES %s",
                rec_junctions,
            )
            print(f"  - Linked {len(recommended_ids)} recommended ingredients.")

        # Match and populate avoided foods in bulk
        foods_to_avoid = val.get("foods_to_avoid", [])
        avoided_ids = find_matching_ingredients_bulk(foods_to_avoid, ingredient_map)

        if avoided_ids:
            avoid_junctions = [(disease_rule_id, ing_id) for ing_id in avoided_ids]
            extras.execute_values(
                cursor,
                "INSERT INTO disease_avoided_ingredients (disease_rule_id, ingredient_id) VALUES %s",
                avoid_junctions,
            )
            print(f"  - Linked {len(avoided_ids)} avoided ingredients.")


def main():
    print("==================================================")
    print("Starting IntelliFit Nutrition & Disease Seeding")
    print("==================================================")

    conn = None
    try:
        conn = get_db_connection()
        conn.autocommit = False  # Use transactional execution
        cursor = conn.cursor()

        # 1. Run DDL extensions
        run_ddl_extensions(cursor)

        # 2. Load taxonomies and data
        allergen_taxonomy = load_allergen_taxonomy()

        # 3. Seed ingredients and fetch map of Name -> ID
        ingredient_map = seed_ingredients(cursor, allergen_taxonomy)

        # 4. Seed disease rules and link mapping
        seed_disease_rules(cursor, DISEASE_RULES_PATH, ingredient_map)

        # Commit changes
        conn.commit()
        print("\n[SUCCESS] Seeding and connecting database successfully completed!")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"\n[ERROR] Error during database seeding: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    main()
