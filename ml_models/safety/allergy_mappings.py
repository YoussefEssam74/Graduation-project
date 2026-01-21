"""
Allergy → Food Mappings for PulseGym AI
=======================================

This module defines which foods are UNSAFE for specific allergies/intolerances.
These mappings are used as HARD FILTERS - foods are completely excluded
from nutrition plans if the user has the corresponding allergy.

CRITICAL: This is a safety-first approach. Allergies can be life-threatening.
When in doubt, exclude the food.
"""

from typing import List, Set, Dict

# =============================================================================
# ALLERGY → UNSAFE FOODS MAPPING
# =============================================================================
# Key: allergy type (lowercase, normalized)
# Value: list of food names/patterns to EXCLUDE
# =============================================================================

ALLERGY_FOOD_MAP: Dict[str, List[str]] = {
    # ----- DAIRY / LACTOSE -----
    "dairy": [
        "milk", "whole_milk", "skim_milk", "2%_milk",
        "cheese", "cheddar", "mozzarella", "parmesan", "swiss", "feta", "cottage_cheese",
        "yogurt", "greek_yogurt", "kefir",
        "butter", "ghee", "cream", "heavy_cream", "sour_cream",
        "ice_cream", "gelato",
        "whey_protein", "whey", "casein", "casein_protein",
        "cream_cheese", "ricotta",
        "milkshake", "latte", "cappuccino",
        "custard", "pudding",
        "ranch_dressing", "alfredo_sauce", "bechamel",
    ],

    "lactose": [
        # Same as dairy but may tolerate some aged cheeses
        "milk", "whole_milk", "skim_milk",
        "fresh_cheese", "cottage_cheese", "ricotta",
        "yogurt",  # Some tolerate fermented
        "cream", "ice_cream",
        "whey_protein",
    ],

    # ----- GLUTEN / CELIAC -----
    "gluten": [
        "bread", "white_bread", "whole_wheat_bread", "rye_bread", "sourdough",
        "pasta", "spaghetti", "penne", "macaroni", "noodles",
        "wheat", "whole_wheat", "wheat_flour",
        "barley", "rye", "spelt", "kamut", "triticale",
        "oats", "oatmeal",  # Often cross-contaminated
        "cereal", "granola",
        "cookie", "cookies", "cake", "pastry", "muffin", "croissant",
        "cracker", "crackers", "pretzel",
        "beer", "ale",
        "soy_sauce",  # Contains wheat
        "teriyaki_sauce",
        "breaded",  # Breaded anything
        "flour_tortilla",
        "couscous", "bulgur",
        "seitan",  # Pure gluten
        "panko", "breadcrumb",
    ],

    "celiac": [
        # Stricter than gluten sensitivity
        "bread", "pasta", "wheat", "barley", "rye",
        "oats",  # Must be certified GF
        "soy_sauce", "teriyaki",
        "beer",
        "breaded",
        "communion_wafer",  # Even trace amounts
        "cross_contaminated",
    ],

    # ----- NUTS -----
    "nuts": [
        "almond", "almonds", "almond_butter", "almond_milk", "almond_flour",
        "peanut", "peanuts", "peanut_butter", "peanut_oil",
        "walnut", "walnuts",
        "cashew", "cashews", "cashew_butter",
        "pecan", "pecans",
        "pistachio", "pistachios",
        "hazelnut", "hazelnuts", "nutella",
        "macadamia", "macadamia_nuts",
        "brazil_nut", "brazil_nuts",
        "pine_nut", "pine_nuts", "pesto",  # Contains pine nuts
        "chestnut", "chestnuts",
        "mixed_nuts", "nut_butter", "nut_milk",
        "marzipan", "praline",
        "granola",  # Often contains nuts
        "trail_mix",
    ],

    "peanut": [
        "peanut", "peanuts", "peanut_butter", "peanut_oil",
        "groundnut",
        "arachis_oil",  # Scientific name
        "satay", "satay_sauce",
        "some_asian_dishes",  # General warning
    ],

    "tree_nuts": [
        "almond", "almonds",
        "walnut", "walnuts",
        "cashew", "cashews",
        "pecan", "pecans",
        "pistachio", "pistachios",
        "hazelnut", "hazelnuts",
        "macadamia",
        "brazil_nut",
        "pine_nut", "pesto",
        "chestnut",
    ],

    # ----- EGGS -----
    "eggs": [
        "egg", "eggs", "egg_white", "egg_yolk",
        "omelet", "omelette", "scrambled_eggs", "fried_egg", "poached_egg",
        "mayonnaise", "mayo", "aioli",
        "meringue", "macarons",
        "custard", "quiche",
        "some_protein_bars",  # Check labels
        "egg_noodles",
        "french_toast",
        "brioche",
        "cake",  # Most contain eggs
        "cookie",  # Most contain eggs
        "muffin",
        "pancakes", "waffles",
        "hollandaise",
    ],

    # ----- SOY -----
    "soy": [
        "soy", "soybean", "soybeans",
        "tofu", "firm_tofu", "silken_tofu",
        "edamame",
        "soy_milk", "soy_sauce", "tamari",  # Tamari may be GF but has soy
        "tempeh",
        "miso", "miso_soup",
        "soy_protein", "soy_protein_isolate",
        "textured_vegetable_protein", "tvp",
        "soybean_oil",
        "soy_lecithin",  # Common additive
        "teriyaki",  # Contains soy sauce
        "hoisin_sauce",
        "vegetarian_meat",  # Many contain soy
    ],

    # ----- SHELLFISH -----
    "shellfish": [
        "shrimp", "prawns",
        "crab", "crab_meat", "imitation_crab",
        "lobster",
        "crayfish", "crawfish",
        "scallop", "scallops",
        "clam", "clams", "clam_chowder",
        "mussel", "mussels",
        "oyster", "oysters",
        "squid", "calamari",
        "octopus",
        "abalone",
        "snail", "escargot",
        "fish_sauce",  # May contain shellfish
        "oyster_sauce",
        "paella",
        "cioppino",
        "bouillabaisse",
        "seafood_mix",
    ],

    # ----- FISH -----
    "fish": [
        "salmon", "smoked_salmon", "lox",
        "tuna", "canned_tuna", "tuna_steak",
        "cod", "tilapia", "halibut", "mahi_mahi",
        "trout", "bass", "perch",
        "sardine", "sardines", "anchovy", "anchovies",
        "mackerel", "herring",
        "swordfish", "shark",
        "catfish", "snapper",
        "fish_oil", "omega_3_fish_oil", "cod_liver_oil",
        "fish_sauce",
        "caesar_dressing",  # Contains anchovies
        "worcestershire_sauce",  # Contains anchovies
        "fish_and_chips",
        "sushi",  # Many contain fish
        "sashimi",
    ],

    # ----- SEAFOOD (both fish and shellfish) -----
    "seafood": [
        # Combine fish and shellfish
        "fish", "salmon", "tuna", "cod",
        "shrimp", "crab", "lobster",
        "shellfish",
        "sushi", "sashimi",
        "fish_sauce", "oyster_sauce",
    ],

    # ----- SESAME -----
    "sesame": [
        "sesame", "sesame_seed", "sesame_seeds",
        "sesame_oil",
        "tahini", "hummus",  # Contains tahini
        "halvah", "halva",
        "falafel",  # Often contains sesame
        "burger_bun",  # Often has sesame seeds
        "bagel",  # May have sesame
        "asian_dishes",  # General warning
    ],

    # ----- MUSTARD -----
    "mustard": [
        "mustard", "mustard_seed", "dijon_mustard", "yellow_mustard",
        "honey_mustard",
        "mustard_greens",
        "hot_dog",  # Often served with mustard
        "salad_dressing",  # Many contain mustard
    ],

    # ----- SULFITES -----
    "sulfites": [
        "wine", "red_wine", "white_wine",
        "dried_fruit", "dried_apricots", "raisins",
        "grape_juice",
        "lemon_juice",  # Bottled
        "lime_juice",  # Bottled
        "sauerkraut",
        "pickles",
        "vinegar",
        "beer",
    ],

    # ----- CORN -----
    "corn": [
        "corn", "sweet_corn", "corn_on_cob",
        "cornmeal", "polenta", "grits",
        "corn_tortilla", "tortilla_chips", "corn_chips",
        "popcorn",
        "corn_syrup", "high_fructose_corn_syrup",
        "corn_starch", "cornstarch",
        "corn_oil",
        "cornflakes",
        "bourbon",  # Made from corn
    ],

    # ----- NIGHTSHADES (autoimmune/inflammatory) -----
    "nightshade": [
        "tomato", "tomatoes", "tomato_sauce", "marinara", "ketchup",
        "potato", "potatoes", "french_fries", "hash_browns",
        "bell_pepper", "green_pepper", "red_pepper",
        "eggplant", "aubergine",
        "paprika", "cayenne", "chili", "chili_pepper",
        "goji_berry",
    ],

    # ----- FODMAP (IBS/Digestive) -----
    "fodmap": [
        "onion", "onions", "garlic",
        "wheat", "rye", "barley",
        "beans", "lentils", "chickpeas",
        "apple", "pear", "mango", "watermelon",
        "milk", "yogurt", "ice_cream",
        "honey", "agave",
        "mushroom", "mushrooms",
        "cauliflower", "artichoke",
        "high_fodmap",
    ],

    # ----- HISTAMINE (histamine intolerance) -----
    "histamine": [
        "aged_cheese", "parmesan", "blue_cheese",
        "fermented_food", "sauerkraut", "kimchi",
        "wine", "beer",
        "cured_meat", "salami", "pepperoni", "bacon",
        "smoked_fish", "smoked_salmon",
        "canned_fish", "canned_tuna",
        "tomato", "tomatoes",
        "spinach", "eggplant", "avocado",
        "vinegar",
        "chocolate",
        "citrus", "orange", "lemon",
    ],

    # ----- VEGETARIAN (not an allergy but dietary restriction) -----
    "vegetarian": [
        "meat", "beef", "pork", "lamb", "veal",
        "chicken", "turkey", "duck",
        "fish", "salmon", "tuna",
        "shellfish", "shrimp", "crab",
        "bacon", "ham", "sausage",
        "hot_dog", "burger",  # Unless veggie
        "gelatin",
        "lard",
        "chicken_broth", "beef_broth",
    ],

    # ----- VEGAN -----
    "vegan": [
        # All vegetarian plus
        "meat", "beef", "chicken", "fish",
        "egg", "eggs",
        "milk", "dairy", "cheese", "butter",
        "yogurt", "whey", "casein",
        "honey",
        "gelatin",
        "mayonnaise",
    ],

    # ----- HALAL (religious dietary restriction) -----
    "halal": [
        "pork", "ham", "bacon", "sausage",  # Pork-based
        "pepperoni",  # Usually pork
        "gelatin",  # Unless halal-certified
        "alcohol", "wine", "beer",
        "non_halal_meat",
    ],

    # ----- KOSHER (religious dietary restriction) -----
    "kosher": [
        "pork", "ham", "bacon",
        "shellfish", "shrimp", "crab", "lobster",
        "mixing_meat_dairy",
        "non_kosher_meat",
    ],
}

# =============================================================================
# ALIASES - Map common variations to main allergy types
# =============================================================================
ALLERGY_ALIASES: Dict[str, str] = {
    "dairy allergy": "dairy",
    "milk allergy": "dairy",
    "lactose intolerant": "lactose",
    "lactose intolerance": "lactose",

    "gluten allergy": "gluten",
    "gluten intolerant": "gluten",
    "gluten intolerance": "gluten",
    "celiac disease": "celiac",
    "coeliac": "celiac",
    "wheat allergy": "gluten",

    "nut allergy": "nuts",
    "peanut allergy": "peanut",
    "tree nut allergy": "tree_nuts",

    "egg allergy": "eggs",

    "soy allergy": "soy",
    "soya": "soy",

    "shellfish allergy": "shellfish",
    "crustacean": "shellfish",

    "fish allergy": "fish",

    "seafood allergy": "seafood",

    "sesame allergy": "sesame",

    "vegetarian diet": "vegetarian",
    "no meat": "vegetarian",

    "vegan diet": "vegan",
    "plant based": "vegan",
    "plant-based": "vegan",

    "halal diet": "halal",
    "muslim": "halal",

    "kosher diet": "kosher",
    "jewish": "kosher",

    "ibs": "fodmap",
    "irritable bowel": "fodmap",

    "histamine intolerance": "histamine",

    "nightshade sensitivity": "nightshade",
}


def normalize_allergy(allergy: str) -> str:
    """Normalize allergy string to match mapping keys."""
    normalized = allergy.lower().strip()
    return ALLERGY_ALIASES.get(normalized, normalized)


def get_unsafe_foods(allergies: List[str]) -> Set[str]:
    """
    Get all foods that should be EXCLUDED for a list of allergies.

    Args:
        allergies: List of allergy descriptions (e.g., ["dairy", "nuts"])

    Returns:
        Set of food names to EXCLUDE

    Example:
        >>> get_unsafe_foods(["dairy", "gluten"])
        {'milk', 'cheese', 'bread', 'pasta', 'wheat', ...}
    """
    unsafe = set()

    for allergy in allergies:
        normalized = normalize_allergy(allergy)

        if normalized in ALLERGY_FOOD_MAP:
            unsafe.update(ALLERGY_FOOD_MAP[normalized])
        else:
            # Log unknown allergy for review
            print(
                f"WARNING: Unknown allergy type '{allergy}' (normalized: '{normalized}')")

    return unsafe


def is_food_safe(food_name: str, allergies: List[str]) -> bool:
    """
    Check if a specific food is safe for user with given allergies.

    Args:
        food_name: Name of the food
        allergies: List of user's allergies

    Returns:
        True if food is safe, False if it should be excluded
    """
    unsafe_foods = get_unsafe_foods(allergies)

    # Check exact match
    if food_name.lower() in unsafe_foods:
        return False

    # Check partial match (e.g., "greek yogurt" contains "yogurt")
    food_lower = food_name.lower()
    for unsafe in unsafe_foods:
        if unsafe in food_lower or food_lower in unsafe:
            return False

    return True


def filter_foods(
    foods: List[Dict],
    allergies: List[str],
    name_field: str = "name"
) -> List[Dict]:
    """
    Filter a list of food dictionaries, removing unsafe ones.

    Args:
        foods: List of food dicts with name field
        allergies: List of user's allergies
        name_field: Key name for food name in dict

    Returns:
        Filtered list with only safe foods
    """
    if not allergies:
        return foods

    unsafe = get_unsafe_foods(allergies)
    filtered = []

    for food in foods:
        name = food.get(name_field, "").lower()

        # Check if food name matches any unsafe food
        is_unsafe = False
        for unsafe_name in unsafe:
            if unsafe_name in name or name in unsafe_name:
                is_unsafe = True
                break

        if not is_unsafe:
            filtered.append(food)

    return filtered


def get_safe_alternatives(allergies: List[str]) -> Dict[str, List[str]]:
    """
    Get safe food alternatives for common allergens.

    Args:
        allergies: List of user's allergies

    Returns:
        Dict mapping food categories to safe alternatives
    """
    alternatives = {}

    if "dairy" in [normalize_allergy(a) for a in allergies]:
        alternatives["dairy_alternatives"] = [
            "almond_milk", "oat_milk", "coconut_milk", "soy_milk",
            "coconut_yogurt", "cashew_cheese", "nutritional_yeast"
        ]

    if "gluten" in [normalize_allergy(a) for a in allergies]:
        alternatives["gluten_alternatives"] = [
            "rice", "quinoa", "buckwheat", "corn_tortilla",
            "rice_noodles", "gluten_free_oats", "almond_flour"
        ]

    if "eggs" in [normalize_allergy(a) for a in allergies]:
        alternatives["egg_alternatives"] = [
            "flax_egg", "chia_egg", "applesauce", "banana",
            "silken_tofu", "aquafaba"
        ]

    if "nuts" in [normalize_allergy(a) for a in allergies]:
        alternatives["nut_alternatives"] = [
            "sunflower_seeds", "pumpkin_seeds", "sunflower_butter",
            "coconut", "hemp_seeds"
        ]

    return alternatives
