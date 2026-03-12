"""
combine_all_datasets.py
========================
Combines ALL exercise datasets into a single, deduplicated, validated CSV.

Sources (priority order — earlier sources preferred when merging):
  1. exercises_final.json          (2187 exercises, richest per-exercise data)
  2. exercise_master_clean.csv     (same 2187, used for cross-validation)
  3. IntelliFit_AI_Ready_8000_Exercises.csv  (3035 rows, ~1783 NEW)
  4. exercisedb_v2_full.json       (1494 rows, ~243 NEW)
  5. Gym Exercises Dataset.csv     (471 rows, ~167 NEW)

Skipped (redundant):
  - Dataset_Workout_plans.csv     (strict subset of IntelliFit_AI_Ready)
  - exercises_complete_dataset.csv (strict subset of exercises_final.json)
  - exercises_all_fields.csv       (export of exercises_final.json)
  - gym_members_exercise_tracking.csv (user tracking, not exercise definitions)
  - gym recommendation.xlsx       (user recommendation data, not exercises)

Output:
  data/exercises_combined_final.csv  — single flat CSV with all unique exercises
"""

import csv
import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR / "data"
OUTPUT_CSV = DATA_DIR / "exercises_combined_final.csv"

# ============================================================================
# STANDARDIZATION MAPS (reused from build_exercise_db.py)
# ============================================================================

VALID_MUSCLES = {
    "abdominals", "abductors", "adductors", "biceps", "calves",
    "chest", "forearms", "glutes", "hamstrings", "lats",
    "lower back", "middle back", "neck", "quadriceps",
    "shoulders", "traps", "triceps"
}

MUSCLE_ALIASES = {
    "abdominal": "abdominals", "abs": "abdominals",
    "oblique": "abdominals", "obliques": "abdominals",
    "bicep": "biceps", "calf": "calves",
    "forearm": "forearms", "forearm - inner": "forearms",
    "forearm - outer": "forearms",
    "glute": "glutes", "gluteus maximus": "glutes",
    "gluteus medius": "glutes",
    "hamstring": "hamstrings", "lat": "lats",
    "latissimus dorsi": "lats",
    "quad": "quadriceps", "quads": "quadriceps",
    "shoulder": "shoulders", "shoulder - front": "shoulders",
    "shoulder - back": "shoulders", "shoulder - side": "shoulders",
    "deltoid": "shoulders", "anterior deltoid": "shoulders",
    "posterior deltoid": "shoulders", "lateral deltoid": "shoulders",
    "rotator cuff": "shoulders",
    "trap": "traps", "trapezius": "traps",
    "tricep": "triceps",
    "pectoral": "chest", "pectorals": "chest",
    "thigh - inner": "adductors", "inner thigh": "adductors",
    "thigh - outer": "abductors", "outer thigh": "abductors",
    "hip flexor": "quadriceps", "hip flexors": "quadriceps",
    "erector spinae": "lower back", "rhomboids": "middle back",
    "serratus anterior": "chest",
    # ExerciseDB v2 uppercase mappings
    "upper back": "middle back",
    "spine": "lower back",
    "upper arms": "triceps",
    "lower arms": "forearms",
    "lower legs": "calves",
    "upper legs": "quadriceps",
    "cardio": None,
    "waist": "abdominals",
    "back": "lats",
    "delts": "shoulders",
    "pecs": "chest",
    "levator scapulae": "traps",
    "infraspinatus": "shoulders",
    "teres major": "lats",
    "teres minor": "shoulders",
    "brachialis": "biceps",
    "brachioradialis": "forearms",
    "wrist extensors": "forearms",
    "wrist flexors": "forearms",
    "serratus anterior": "chest",
    "hip flexors": "quadriceps",
    "tensor fasciae latae": "abductors",
    "iliopsoas": "quadriceps",
    "sartorius": "quadriceps",
    "gracilis": "adductors",
    "popliteus": "calves",
    "tibialis anterior": "calves",
    "soleus": "calves",
    "gastrocnemius": "calves",
    "rectus femoris": "quadriceps",
    "vastus lateralis": "quadriceps",
    "vastus medialis": "quadriceps",
    "biceps femoris": "hamstrings",
    "semitendinosus": "hamstrings",
    "semimembranosus": "hamstrings",
    "gluteus minimus": "glutes",
    "adductor longus": "adductors",
    "adductor brevis": "adductors",
    "adductor magnus": "adductors",
    "pectineus": "adductors",
    "rectus abdominis": "abdominals",
    "transverse abdominis": "abdominals",
    "external oblique": "abdominals",
    "internal oblique": "abdominals",
    "pectoralis major": "chest",
    "pectoralis minor": "chest",
    "sternal": "chest",
    "clavicular": "chest",
    "anterior deltoid": "shoulders",
    "lateral deltoid": "shoulders",
    "posterior deltoid": "shoulders",
    "supraspinatus": "shoulders",
    "subscapularis": "shoulders",
    "biceps brachii": "biceps",
    "triceps brachii": "triceps",
    "latissimus dorsi": "lats",
    "trapezius": "traps",
    "upper trapezius": "traps",
    "middle trapezius": "traps",
    "lower trapezius": "traps",
    "rhomboid major": "middle back",
    "rhomboid minor": "middle back",
    "sternocleidomastoid": "neck",
}


def standardize_muscle(name: str) -> str | None:
    n = name.lower().strip()
    if n in VALID_MUSCLES:
        return n
    return MUSCLE_ALIASES.get(n)


# Equipment normalization
EQUIP_NORM = {
    "bands": "band", "cables": "cable", "kettlebells": "kettlebell",
    "dumbbells": "dumbbell", "barbells": "barbell",
    "machines": "machine", "skierg machine": "machine",
    "sled machine": "machine", "hammer": "other",
    "roller": "other", "weighted": "other",
    "body weight": "body only", "bodyweight": "body only",
    "leverage machine": "machine", "smith machine": "machine",
    "assisted": "machine", "resistance band": "band",
    "stability ball": "exercise ball", "bosu ball": "exercise ball",
    "rope": "cable", "ez barbell": "e-z curl bar",
    "ez-bar": "e-z curl bar", "olympic barbell": "barbell",
    "trap bar": "barbell", "foam roller": "foam roll",
    # IntelliFit / ExerciseDB v2 equipment variants
    "lever": "machine", "lever (plate loaded)": "machine",
    "lever (selectorized)": "machine",
    "sled": "machine", "sled (plate loaded)": "machine",
    "sled (selectorized)": "machine",
    "smith": "machine",
    "suspended": "other", "suspension": "other",
    "assisted (machine)": "machine", "assisted (partner)": "other",
    "band resistive": "band", "band-assisted": "band",
    "self-assisted": "body only",
    "plyometric": "body only", "isometric": "body only",
    "elliptical machine": "machine", "stepmill machine": "machine",
    "stationary bike": "machine",
    "upper body ergometer": "machine",
    "wheel roller": "other", "tire": "other",
    "cable (pull side)": "cable",
    "weighted": "other", "none": "body only",
}

EQUIPMENT_NAME_HINTS = [
    ("e-z curl bar", "e-z curl bar"), ("ez-bar", "e-z curl bar"),
    ("ez bar", "e-z curl bar"), ("barbell", "barbell"),
    ("dumbbell", "dumbbell"), ("kettlebell", "kettlebell"),
    ("cable", "cable"), ("machine", "machine"), ("band", "band"),
    ("smith", "machine"), ("medicine ball", "medicine ball"),
    ("exercise ball", "exercise ball"), ("stability ball", "exercise ball"),
    ("foam roll", "foam roll"), ("trx", "other"), ("landmine", "barbell"),
    ("pulldown", "cable"), ("pull-down", "cable"), ("lat pull", "cable"),
    ("crossover", "cable"), ("pec deck", "machine"),
    ("leg press", "machine"), ("hack squat", "machine"),
    ("preacher", "e-z curl bar"), ("pendlay", "barbell"),
    ("t-bar", "barbell"), ("snatch", "barbell"),
    ("clean and", "barbell"), ("bench press", "barbell"),
    ("arnold press", "dumbbell"), ("rack pull", "barbell"),
    ("front squat", "barbell"), ("skull crush", "barbell"),
    ("good morning", "barbell"), ("overhead press", "barbell"),
]


def normalize_equipment(equip: str) -> str:
    # Remove zero-width spaces and other invisible Unicode characters
    e = re.sub(r"[\u200b\u200c\u200d\ufeff\u00a0]", "", equip).lower().strip()
    if not e:
        return "body only"
    # Direct lookup
    if e in EQUIP_NORM:
        return EQUIP_NORM[e]
    # Handle compound equipment names like "Lever (selectorized)  Chest Dip"
    # or "Cable  Standing Fly" — extract just the equipment part before double space
    if "  " in e:
        e = e.split("  ")[0].strip()
        if e in EQUIP_NORM:
            return EQUIP_NORM[e]
    for known_equip in sorted(EQUIP_NORM.keys(), key=len, reverse=True):
        if e.startswith(known_equip):
            return EQUIP_NORM[known_equip]
    # Check if it's already a valid normalized value
    valid_equips = {"body only", "barbell", "dumbbell", "cable", "machine",
                    "kettlebell", "band", "e-z curl bar", "exercise ball",
                    "medicine ball", "foam roll", "other"}
    if e in valid_equips:
        return e
    return e


def infer_equipment(name: str, current_equip: str) -> str:
    if current_equip and current_equip not in ("body only", "other", ""):
        return current_equip
    nl = name.lower()
    for hint, equip in EQUIPMENT_NAME_HINTS:
        if hint in nl:
            return equip
    return current_equip or "body only"


# Mechanic detection
ISOLATION_PATTERNS = [
    r"\bcurls?\b", r"\braises?\b", r"\bflys?\b", r"\bflyes?\b", r"\bflies\b",
    r"\bkickbacks?\b", r"\bpushdowns?\b", r"\bpullovers?\b",
    r"\bshrugs?\b", r"\bwrist\b", r"\bforearm\b",
    r"\bcalf raise\b", r"\bcalf press\b",
    r"\bleg extension\b", r"\bquad extension\b",
    r"\bleg curl\b", r"\bhamstring curl\b",
    r"\bface pull\b", r"\brear delt\b",
    r"\blateral\b.*\braise\b", r"\bfront\b.*\braise\b",
    r"\bcable crossover\b", r"\bpec deck\b", r"\bpec fly\b",
    r"\bconcentration\b", r"\bpreacher\b",
    r"\bhip adduction\b", r"\bhip abduction\b",
    r"\binternal rotation\b", r"\bexternal rotation\b",
    r"\bneck\b.*\bflexion\b", r"\bneck\b.*\bextension\b",
    r"\bisometric\b", r"\bsqueeze\b",
    r"\bextension\b(?!.*(?:press|push|squat))",
]
COMPOUND_PATTERNS = [
    r"\bpress\b", r"\bsquat\b", r"\bdeadlift\b",
    r"\brow\b", r"\bpull[- ]?up\b", r"\bchin[- ]?up\b",
    r"\bdip\b", r"\blunge\b", r"\bstep[- ]?up\b",
    r"\bclean\b", r"\bsnatch\b", r"\bjerk\b",
    r"\bthrust\b", r"\bpush[- ]?up\b",
    r"\bgood morning\b", r"\bhyperextension\b",
]


def fix_mechanic(name: str, current: str) -> str:
    nl = name.lower()
    for pat in ISOLATION_PATTERNS:
        if re.search(pat, nl):
            return "isolation"
    for pat in COMPOUND_PATTERNS:
        if re.search(pat, nl):
            return "compound"
    return current if current in ("compound", "isolation") else "compound"


# Movement pattern detection
PATTERN_KEYWORDS = {
    "knee_extension": ["leg extension", "quad extension", "knee extension"],
    "knee_flexion": ["leg curl", "hamstring curl", "lying curl", "prone curl"],
    "calf": ["calf raise", "calf press", "donkey calf", "seated calf", "standing calf"],
    "squat": ["squat", "leg press", "hack squat", "goblet", "pistol", "box jump"],
    "lunge": ["lunge", "step-up", "step up", "split squat", "bulgarian"],
    "hip_hinge": [
        "deadlift", "romanian", "good morning", "hip thrust", "glute bridge",
        "hyperextension", "back extension", "pull through", "hip hinge",
        "glute kickback", "kettlebell swing", "rack pull",
    ],
    "horizontal_push": [
        "bench press", "push-up", "push up", "pushup", "dip",
        "chest press", "floor press", "chest fly", "cable crossover", "pec",
    ],
    "vertical_push": [
        "overhead press", "military press", "shoulder press",
        "arnold press", "pike push", "jerk", "push press",
    ],
    "horizontal_pull": [
        "row", "bent over", "cable row", "seated row", "t-bar",
        "face pull", "inverted row",
    ],
    "vertical_pull": [
        "pull-up", "pullup", "chin-up", "chinup", "lat pulldown",
        "pulldown", "muscle up", "muscle-up",
    ],
    "elbow_flexion": ["curl", "bicep", "biceps", "hammer curl", "preacher"],
    "elbow_extension": [
        "tricep extension", "triceps extension", "skull crusher",
        "pushdown", "tricep kickback", "overhead extension",
    ],
    "shoulder_raise": [
        "lateral raise", "front raise", "rear delt", "upright row",
        "shrug", "reverse fly", "reverse flye",
    ],
    "core_flexion": [
        "crunch", "sit-up", "situp", "plank", "ab wheel", "leg raise",
        "hanging knee", "russian twist", "wood chop", "flutter kick",
        "mountain climber", "v-up", "toe touch",
    ],
}

MOVEMENT_PATTERN_RULES = {
    ("push", "compound", "chest"): "horizontal_push",
    ("push", "compound", "shoulders"): "vertical_push",
    ("push", "compound", "triceps"): "horizontal_push",
    ("push", "compound", "quadriceps"): "squat",
    ("push", "isolation", "triceps"): "elbow_extension",
    ("push", "isolation", "shoulders"): "shoulder_raise",
    ("push", "isolation", "quadriceps"): "knee_extension",
    ("push", "isolation", "chest"): "horizontal_push",
    ("push", "isolation", "calves"): "calf",
    ("pull", "compound", "lats"): "vertical_pull",
    ("pull", "compound", "middle back"): "horizontal_pull",
    ("pull", "compound", "lower back"): "hip_hinge",
    ("pull", "compound", "hamstrings"): "hip_hinge",
    ("pull", "compound", "glutes"): "hip_hinge",
    ("pull", "compound", "biceps"): "vertical_pull",
    ("pull", "compound", "traps"): "horizontal_pull",
    ("pull", "isolation", "biceps"): "elbow_flexion",
    ("pull", "isolation", "lats"): "vertical_pull",
    ("pull", "isolation", "middle back"): "horizontal_pull",
    ("pull", "isolation", "hamstrings"): "knee_flexion",
    ("pull", "isolation", "forearms"): "elbow_flexion",
    ("pull", "isolation", "abdominals"): "core_flexion",
    ("pull", "isolation", "glutes"): "hip_hinge",
    ("pull", "isolation", "lower back"): "hip_hinge",
    ("pull", "isolation", "traps"): "shoulder_raise",
    ("static", "compound", "abdominals"): "core_flexion",
    ("static", "isolation", "abdominals"): "core_flexion",
    ("static", "compound", "quadriceps"): "squat",
    ("static", "compound", "shoulders"): "vertical_push",
    ("static", "compound", "glutes"): "hip_hinge",
    ("static", "compound", "chest"): "horizontal_push",
}


def detect_movement_pattern(name: str, force: str, mechanic: str, primary_muscle: str) -> str:
    nl = name.lower()
    for pattern, keywords in PATTERN_KEYWORDS.items():
        if any(kw in nl for kw in keywords):
            return pattern
    f = (force or "").lower()
    m = (mechanic or "").lower()
    p = (primary_muscle or "").lower()
    key = (f, m, p)
    if key in MOVEMENT_PATTERN_RULES:
        return MOVEMENT_PATTERN_RULES[key]
    for (fk, mk, pk), pat in MOVEMENT_PATTERN_RULES.items():
        if fk == f and pk == p:
            return pat
    return "other"


# Movement pattern alias mapping for IntelliFit patterns
PATTERN_ALIASES = {
    "vertical_push": "vertical_push",
    "horizontal_push": "horizontal_push",
    "vertical_pull": "vertical_pull",
    "horizontal_pull": "horizontal_pull",
    "hip_hinge": "hip_hinge",
    "squat": "squat",
    "lunge": "lunge",
    "elbow_flexion": "elbow_flexion",
    "elbow_extension": "elbow_extension",
    "shoulder_raise": "shoulder_raise",
    "knee_extension": "knee_extension",
    "knee_flexion": "knee_flexion",
    "calf": "calf",
    "core_flexion": "core_flexion",
    "core": "core_flexion",
    "general": "other",
    "isolation": "other",
    "compound": "other",
    "other": "other",
    "": "other",
}


def normalize_pattern(pattern: str) -> str:
    p = pattern.lower().strip()
    return PATTERN_ALIASES.get(p, p if p in PATTERN_ALIASES.values() else "other")


# ============================================================================
# SCIENCE-BASED FIELD COMPUTATION (from build_exercise_db.py)
# ============================================================================

REP_RANGES = {
    "Strength": {"min_reps": 3, "max_reps": 6, "rest_seconds": 180, "sets": 4},
    "Muscle": {"min_reps": 8, "max_reps": 12, "rest_seconds": 90, "sets": 3},
    "WeightLoss": {"min_reps": 12, "max_reps": 20, "rest_seconds": 45, "sets": 3},
    "Endurance": {"min_reps": 15, "max_reps": 25, "rest_seconds": 30, "sets": 3},
    "General": {"min_reps": 8, "max_reps": 15, "rest_seconds": 60, "sets": 3},
}
REP_RANGES_ISOLATION = {
    "Strength": {"min_reps": 6, "max_reps": 10, "rest_seconds": 120, "sets": 3},
    "Muscle": {"min_reps": 10, "max_reps": 15, "rest_seconds": 60, "sets": 3},
    "WeightLoss": {"min_reps": 15, "max_reps": 25, "rest_seconds": 30, "sets": 3},
    "Endurance": {"min_reps": 20, "max_reps": 30, "rest_seconds": 20, "sets": 2},
    "General": {"min_reps": 10, "max_reps": 15, "rest_seconds": 60, "sets": 3},
}
GOAL_SUITABILITY = {
    "compound": {"Strength": 9, "Muscle": 8, "WeightLoss": 7, "Endurance": 6, "General": 8},
    "isolation": {"Strength": 5, "Muscle": 9, "WeightLoss": 7, "Endurance": 8, "General": 7},
}

BASE_FATIGUE_BY_PATTERN = {
    "hip_hinge": 8, "squat": 7, "lunge": 6, "horizontal_push": 5,
    "vertical_push": 5, "horizontal_pull": 5, "vertical_pull": 4,
    "elbow_flexion": 2, "elbow_extension": 2, "shoulder_raise": 2,
    "knee_extension": 3, "knee_flexion": 3, "calf": 2, "core_flexion": 2, "other": 3,
}
FATIGUE_EQUIP_MODIFIER = {
    "barbell": +2, "dumbbell": +1, "kettlebell": +1, "cable": -1,
    "machine": -2, "band": -1, "body only": 0, "e-z curl bar": +1,
    "exercise ball": 0, "medicine ball": 0, "foam roll": -2, "other": 0,
}
BASE_STIMULUS_BY_PATTERN = {
    "hip_hinge": 9, "squat": 9, "lunge": 7, "horizontal_push": 8,
    "vertical_push": 7, "horizontal_pull": 8, "vertical_pull": 8,
    "elbow_flexion": 6, "elbow_extension": 6, "shoulder_raise": 6,
    "knee_extension": 6, "knee_flexion": 6, "calf": 5, "core_flexion": 5, "other": 5,
}
BASE_AXIAL_LOAD_BY_PATTERN = {
    "hip_hinge": 9, "squat": 8, "lunge": 5, "horizontal_push": 2,
    "vertical_push": 6, "horizontal_pull": 5, "vertical_pull": 1,
    "elbow_flexion": 0, "elbow_extension": 0, "shoulder_raise": 1,
    "knee_extension": 0, "knee_flexion": 0, "calf": 3, "core_flexion": 1, "other": 2,
}
AXIAL_EQUIP_MODIFIER = {
    "machine": -3, "cable": -1, "barbell": +1, "dumbbell": 0,
    "body only": 0, "kettlebell": 0, "e-z curl bar": 0,
    "band": -1, "exercise ball": 0, "medicine ball": 0, "foam roll": -2, "other": 0,
}
RECOVERY_HOURS_BY_PATTERN = {
    "hip_hinge": 72, "squat": 72, "lunge": 48, "horizontal_push": 48,
    "vertical_push": 48, "horizontal_pull": 48, "vertical_pull": 48,
    "elbow_flexion": 24, "elbow_extension": 24, "shoulder_raise": 24,
    "knee_extension": 36, "knee_flexion": 36, "calf": 24, "core_flexion": 24, "other": 36,
}
CONTRAINDICATION_RULES = {
    "hip_hinge": ["lower_back_injury", "disc_herniation", "sciatica"],
    "squat": ["knee_injury", "lower_back_injury", "hip_impingement"],
    "lunge": ["knee_injury", "ankle_injury", "hip_impingement"],
    "horizontal_push": ["shoulder_impingement", "rotator_cuff_tear", "pec_tear"],
    "vertical_push": ["shoulder_impingement", "rotator_cuff_tear", "neck_injury"],
    "horizontal_pull": ["lower_back_injury", "bicep_tendinitis"],
    "vertical_pull": ["shoulder_impingement", "rotator_cuff_tear"],
    "elbow_flexion": ["bicep_tendinitis", "elbow_tendinitis", "golfers_elbow"],
    "elbow_extension": ["elbow_tendinitis", "tennis_elbow", "tricep_tendinitis"],
    "shoulder_raise": ["shoulder_impingement", "rotator_cuff_tear"],
    "knee_extension": ["knee_injury", "patellar_tendinitis", "acl_injury"],
    "knee_flexion": ["knee_injury", "hamstring_strain"],
    "calf": ["achilles_tendinitis", "ankle_injury", "plantar_fasciitis"],
    "core_flexion": ["lower_back_injury", "disc_herniation", "diastasis_recti"],
}
HIGH_RISK_EXERCISE_CONTRAINDICATIONS = {
    "behind the neck": ["shoulder_impingement", "rotator_cuff_tear", "cervical_disc"],
    "upright row": ["shoulder_impingement", "rotator_cuff_tear"],
    "good morning": ["lower_back_injury", "disc_herniation", "sciatica"],
    "sissy squat": ["knee_injury", "patellar_tendinitis"],
    "skull crusher": ["elbow_tendinitis", "tennis_elbow"],
    "barbell row": ["lower_back_injury", "disc_herniation"],
    "sumo deadlift": ["hip_impingement", "adductor_strain", "lower_back_injury"],
    "hack squat": ["knee_injury", "lower_back_injury"],
    "leg extension": ["patellar_tendinitis", "acl_injury"],
    "snatch": ["shoulder_impingement", "wrist_injury", "lower_back_injury"],
    "clean and jerk": ["shoulder_impingement", "wrist_injury", "lower_back_injury"],
    "kipping": ["shoulder_impingement", "rotator_cuff_tear"],
}

ADVANCED_EXERCISE_KEYWORDS = [
    "snatch", "clean and jerk", "power clean", "hang clean",
    "muscle up", "muscle-up", "pistol squat", "pistol",
    "front squat", "zercher", "deficit deadlift", "sumo deadlift",
    "dragon flag", "l-sit", "handstand", "planche",
    "atlas stone", "tire flip", "log press",
    "turkish get", "windmill", "bottoms up",
]
BEGINNER_EXERCISE_KEYWORDS = [
    "machine", "cable curl", "lat pulldown", "pulldown",
    "leg press", "leg extension", "leg curl",
    "pec deck", "chest fly - machine", "seated row",
    "assisted", "smith machine", "band", "wall sit",
]


def compute_fatigue(name, pattern, equipment, mechanic):
    base = BASE_FATIGUE_BY_PATTERN.get(pattern, 3)
    eq_mod = FATIGUE_EQUIP_MODIFIER.get(equipment, 0)
    mech_mod = 1 if mechanic == "compound" else -1
    score = base + eq_mod + mech_mod
    nl = name.lower()
    if "deadlift" in nl and "romanian" not in nl:
        score = max(score, 9)
    elif "squat" in nl and equipment == "barbell":
        score = max(score, 8)
    elif any(k in nl for k in ("clean", "snatch", "jerk")):
        score = max(score, 8)
    return max(1, min(10, score))


def compute_stimulus(name, pattern, equipment, mechanic):
    base = BASE_STIMULUS_BY_PATTERN.get(pattern, 5)
    nl = name.lower()
    if mechanic == "compound" and equipment in ("barbell", "dumbbell"):
        base = min(10, base + 1)
    if mechanic == "isolation" and equipment in ("cable", "machine"):
        base = min(10, base + 1)
    if "squat" in nl and equipment == "barbell":
        base = max(base, 9)
    elif "bench press" in nl:
        base = max(base, 8)
    elif any(k in nl for k in ("pull-up", "pullup", "chin-up")):
        base = max(base, 8)
    return max(1, min(10, base))


def compute_axial_load(name, pattern, equipment):
    base = BASE_AXIAL_LOAD_BY_PATTERN.get(pattern, 2)
    eq_mod = AXIAL_EQUIP_MODIFIER.get(equipment, 0)
    score = base + eq_mod
    nl = name.lower()
    if "deadlift" in nl:
        score = max(score, 9)
    elif "back squat" in nl or ("squat" in nl and equipment == "barbell"):
        score = max(score, 9)
    elif "front squat" in nl:
        score = max(score, 8)
    elif "good morning" in nl:
        score = max(score, 9)
    elif any(k in nl for k in ("seated", "lying", "incline")):
        score = max(0, score - 2)
    elif "leg press" in nl:
        score = max(score, 3)
    return max(0, min(10, score))


def compute_recovery(pattern, mechanic, difficulty):
    base = RECOVERY_HOURS_BY_PATTERN.get(pattern, 36)
    if difficulty >= 5:
        base += 12
    elif difficulty <= 2:
        base -= 12
    if mechanic == "isolation":
        base = min(base, 48)
    return max(24, min(96, base))


def compute_skill_level(name, difficulty, mechanic):
    nl = name.lower()
    for kw in ADVANCED_EXERCISE_KEYWORDS:
        if kw in nl:
            return "advanced"
    for kw in BEGINNER_EXERCISE_KEYWORDS:
        if kw in nl:
            return "beginner"
    if difficulty >= 5:
        return "advanced"
    elif difficulty <= 2:
        return "beginner"
    return "intermediate"


def compute_contraindications(name, pattern):
    contras = set()
    contras.update(CONTRAINDICATION_RULES.get(pattern, []))
    nl = name.lower()
    for keyword, extra in HIGH_RISK_EXERCISE_CONTRAINDICATIONS.items():
        if keyword in nl:
            contras.update(extra)
    return sorted(contras)


# ============================================================================
# HELPERS
# ============================================================================

def normalize_key(name: str) -> str:
    n = name.lower().strip()
    n = unicodedata.normalize("NFKD", n)
    n = re.sub(r"[^a-z0-9 ]", " ", n)
    n = re.sub(r"\s+", " ", n).strip()
    return n


def parse_pipe_list(val: str) -> list:
    if not val or not val.strip():
        return []
    return [v.strip() for v in val.split("|") if v.strip()]


def standardize_muscle_list(raw_list: list) -> list:
    result = []
    seen = set()
    for m in raw_list:
        std = standardize_muscle(m)
        if std and std not in seen:
            result.append(std)
            seen.add(std)
    return result


def parse_instructions(raw: str) -> list:
    if not raw or not raw.strip():
        return []
    raw = raw.strip()
    parts = re.split(r"Step:\d+\s*", raw)
    parts = [p.strip().rstrip("|").strip() for p in parts if p.strip()]
    if not parts:
        sentences = [s.strip() for s in raw.split(". ") if s.strip()]
        return [s + ("." if not s.endswith(".") else "") for s in sentences]
    return parts


def safe_int(val, default=0):
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default


def safe_float(val, default=0.0):
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


# ============================================================================
# BUILD UNIFIED EXERCISE RECORD
# ============================================================================

def build_full_record(name, primary, secondary, equipment, mechanic, force,
                      movement_pattern, difficulty, category, instructions,
                      gif_url="", image_url=""):
    ex_type = mechanic if mechanic in ("compound", "isolation") else "compound"
    rep_ranges = REP_RANGES if ex_type == "compound" else REP_RANGES_ISOLATION
    suitability = GOAL_SUITABILITY.get(ex_type, GOAL_SUITABILITY["compound"])
    order_priority = 2 if ex_type == "compound" else 5

    pattern = movement_pattern or detect_movement_pattern(name, force, ex_type, primary[0] if primary else "")

    fatigue = compute_fatigue(name, pattern, equipment, ex_type)
    stimulus = compute_stimulus(name, pattern, equipment, ex_type)
    sfr = round(stimulus / max(fatigue, 1), 2)
    axial = compute_axial_load(name, pattern, equipment)
    recovery = compute_recovery(pattern, ex_type, difficulty)
    skill = compute_skill_level(name, difficulty, ex_type)
    contras = compute_contraindications(name, pattern)

    return {
        "name": name,
        "primaryMuscles": primary,
        "secondaryMuscles": secondary,
        "equipment": equipment,
        "mechanic": ex_type,
        "force": force,
        "movement_pattern": pattern,
        "difficulty_level": difficulty,
        "category": category or "strength",
        "skill_level": skill,
        "fatigue_score": fatigue,
        "stimulus_score": stimulus,
        "sfr_ratio": sfr,
        "axial_load": axial,
        "recovery_time_hours": recovery,
        "order_priority": order_priority,
        "goal_suitability": suitability,
        "rep_ranges_by_goal": rep_ranges,
        "contraindications": contras,
        "instructions": instructions,
        "gifUrl": gif_url or image_url or "",
    }


def merge_records(existing, new_data):
    """Merge new_data into existing, preferring non-empty values from either."""
    merged = dict(existing)
    for field in ("force", "movement_pattern", "category", "gifUrl"):
        if not merged.get(field) and new_data.get(field):
            merged[field] = new_data[field]
    for field in ("primaryMuscles", "secondaryMuscles", "instructions", "contraindications"):
        ev = merged.get(field) or []
        nv = new_data.get(field) or []
        if not ev and nv:
            merged[field] = nv
        elif nv and len(nv) > len(ev):
            merged[field] = nv
    for field in ("fatigue_score", "stimulus_score", "sfr_ratio",
                   "axial_load", "recovery_time_hours", "order_priority"):
        ev = merged.get(field, 0) or 0
        nv = new_data.get(field, 0) or 0
        if not ev and nv:
            merged[field] = nv
    rr_e = merged.get("rep_ranges_by_goal") or {}
    rr_n = new_data.get("rep_ranges_by_goal") or {}
    if rr_n and not rr_e:
        merged["rep_ranges_by_goal"] = rr_n
    gs_e = merged.get("goal_suitability") or {}
    gs_n = new_data.get("goal_suitability") or {}
    if gs_n and not gs_e:
        merged["goal_suitability"] = gs_n
    return merged


# ============================================================================
# LOAD EACH SOURCE
# ============================================================================

def load_exercises_final():
    """Source 1: exercises_final.json — the current gold standard."""
    path = DATA_DIR / "exercises_final.json"
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    print(f"[Source 1] exercises_final.json: {len(data)} exercises")
    return data


def load_intellifit_ai_ready():
    """Source 3: IntelliFit_AI_Ready_8000_Exercises.csv — richest new source."""
    path = DATA_DIR / "IntelliFit_AI_Ready_8000_Exercises.csv"
    results = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get("name", "").strip()
            if not name:
                continue

            target = row.get("targetMuscles", "").strip()
            primary_raw = [target] if target else []
            secondary_raw = parse_pipe_list(row.get("secondaryMuscles", ""))
            primary = standardize_muscle_list(primary_raw)
            secondary = standardize_muscle_list(secondary_raw)

            if not primary:
                body_part = row.get("bodyParts", "").strip()
                if body_part:
                    bp_std = standardize_muscle(body_part)
                    if bp_std:
                        primary = [bp_std]

            if not primary:
                continue

            equip_raw = row.get("equipments", "").strip()
            equipment = normalize_equipment(equip_raw)
            equipment = infer_equipment(name, equipment)

            ex_type = row.get("exercise_type", "compound").strip().lower()
            mechanic = fix_mechanic(name, ex_type if ex_type in ("compound", "isolation") else "compound")

            raw_pattern = row.get("movement_pattern", "").strip()
            pattern = normalize_pattern(raw_pattern) if raw_pattern else ""

            diff_map = {"beginner": 2, "intermediate": 3, "advanced": 5}
            difficulty = diff_map.get(row.get("difficulty_level", "intermediate").strip().lower(), 3)

            instructions = parse_instructions(row.get("instructions", ""))

            rec = build_full_record(
                name=name, primary=primary, secondary=secondary,
                equipment=equipment, mechanic=mechanic, force="",
                movement_pattern=pattern, difficulty=difficulty,
                category="strength", instructions=instructions,
            )

            rep_min = safe_int(row.get("recommended_rep_min"), 0)
            rep_max = safe_int(row.get("recommended_rep_max"), 0)
            rest_sec = safe_int(row.get("rest_seconds"), 0)
            if rep_min and rep_max and rest_sec:
                rec["rep_ranges_by_goal"]["General"] = {
                    "min_reps": rep_min, "max_reps": rep_max,
                    "rest_seconds": rest_sec, "sets": 3,
                }

            results.append(rec)

    print(f"[Source 3] IntelliFit_AI_Ready: {len(results)} exercises loaded")
    return results


def load_exercisedb_v2():
    """Source 4: exercisedb_v2_full.json — ExerciseDB v2 with GIFs/videos."""
    path = DATA_DIR / "exercisedb_v2_full.json"
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    results = []
    for ex in data:
        name = ex.get("name", "").strip()
        if not name:
            continue

        ex_type_raw = ex.get("exerciseType", "").strip().upper()
        if ex_type_raw and ex_type_raw not in ("STRENGTH", "POWERLIFTING",
                                                 "OLYMPIC WEIGHTLIFTING",
                                                 "STRONGMAN", "PLYOMETRICS",
                                                 "STRETCHING"):
            pass

        target_raw = ex.get("targetMuscles", [])
        secondary_raw = ex.get("secondaryMuscles", [])
        primary = standardize_muscle_list([m.lower() for m in target_raw])
        secondary = standardize_muscle_list([m.lower() for m in secondary_raw])

        if not primary:
            body_parts = ex.get("bodyParts", [])
            for bp in body_parts:
                std = standardize_muscle(bp.lower())
                if std:
                    primary.append(std)
                    break

        if not primary:
            continue

        equip_list = ex.get("equipments", [])
        equip_raw = equip_list[0].lower() if equip_list else "body only"
        equipment = normalize_equipment(equip_raw)
        equipment = infer_equipment(name, equipment)

        mechanic = fix_mechanic(name, "compound")

        instr_raw = ex.get("instructions", [])
        instructions = []
        for step in instr_raw:
            cleaned = re.sub(r"^Step:\d+\s*", "", step).strip()
            if cleaned:
                instructions.append(cleaned)

        gif_url = ex.get("imageUrl", "") or ""
        difficulty = 3
        skill = compute_skill_level(name, difficulty, mechanic)
        if skill == "advanced":
            difficulty = 5
        elif skill == "beginner":
            difficulty = 2

        rec = build_full_record(
            name=name, primary=primary, secondary=secondary,
            equipment=equipment, mechanic=mechanic, force="",
            movement_pattern="", difficulty=difficulty,
            category="strength", instructions=instructions,
            gif_url=gif_url,
        )
        results.append(rec)

    print(f"[Source 4] exercisedb_v2_full.json: {len(results)} exercises loaded")
    return results


def load_gym_exercises_dataset():
    """Source 5: Gym Exercises Dataset — simple but has unique exercises."""
    path = DATA_DIR / "Gym Exercises Dataset - Sheet1 COPY export 2026-02-13 08-13-10.csv"
    results = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.get("Exercise_Name", "").strip()
            if not name:
                continue

            muscle_gp = row.get("muscle_gp", "").strip()
            primary = standardize_muscle_list([muscle_gp]) if muscle_gp else []
            if not primary:
                continue

            equip_raw = row.get("Equipment", "").strip()
            equipment = normalize_equipment(equip_raw)
            equipment = infer_equipment(name, equipment)

            mechanic = fix_mechanic(name, "compound")
            difficulty = 3

            rec = build_full_record(
                name=name, primary=primary, secondary=[],
                equipment=equipment, mechanic=mechanic, force="",
                movement_pattern="", difficulty=difficulty,
                category="strength", instructions=[],
            )
            results.append(rec)

    print(f"[Source 5] Gym Exercises Dataset: {len(results)} exercises loaded")
    return results


# ============================================================================
# VALIDATION
# ============================================================================

def validate_exercise(ex: dict) -> list:
    """Validate a single exercise record, return list of issues found."""
    issues = []
    name = ex.get("name", "")
    nl = name.lower()

    if not ex.get("primaryMuscles"):
        issues.append("missing primaryMuscles")

    eq = ex.get("equipment", "")
    if eq == "body only":
        for hint, correct_eq in EQUIPMENT_NAME_HINTS:
            if hint in nl:
                issues.append(f"equipment should be '{correct_eq}' not 'body only'")
                ex["equipment"] = correct_eq
                break

    mech = ex.get("mechanic", "")
    correct_mech = fix_mechanic(name, mech)
    if correct_mech != mech:
        issues.append(f"mechanic corrected: {mech} -> {correct_mech}")
        ex["mechanic"] = correct_mech

    pattern = ex.get("movement_pattern", "")
    if not pattern or pattern == "other":
        pm = ex["primaryMuscles"][0] if ex.get("primaryMuscles") else ""
        detected = detect_movement_pattern(name, ex.get("force", ""), ex.get("mechanic", ""), pm)
        if detected != "other" and detected != pattern:
            issues.append(f"movement_pattern refined: {pattern} -> {detected}")
            ex["movement_pattern"] = detected

    for field in ("fatigue_score", "stimulus_score", "recovery_time_hours"):
        if not ex.get(field):
            issues.append(f"missing {field}")

    return issues


# ============================================================================
# MAIN
# ============================================================================

def main():
    print("=" * 70)
    print("  COMBINING ALL EXERCISE DATASETS INTO ONE UNIFIED FILE")
    print("=" * 70)
    print()

    # ── Step 1: Load base dataset ──
    base_exercises = load_exercises_final()

    exercises_by_key = {}
    for ex in base_exercises:
        # Normalize equipment in base data
        ex["equipment"] = normalize_equipment(ex.get("equipment", "body only"))
        ex["equipment"] = infer_equipment(ex["name"], ex["equipment"])
        key = normalize_key(ex["name"])
        exercises_by_key[key] = ex

    print(f"  Base: {len(exercises_by_key)} unique exercises")
    print()

    # ── Step 2: Add from IntelliFit_AI_Ready (richest new source) ──
    intellifit = load_intellifit_ai_ready()
    added_intellifit = 0
    enriched_intellifit = 0
    for ex in intellifit:
        key = normalize_key(ex["name"])
        if key in exercises_by_key:
            exercises_by_key[key] = merge_records(exercises_by_key[key], ex)
            enriched_intellifit += 1
        else:
            exercises_by_key[key] = ex
            added_intellifit += 1
    print(f"  IntelliFit: +{added_intellifit} new, {enriched_intellifit} enriched")

    # ── Step 3: Add from ExerciseDB v2 ──
    edb_v2 = load_exercisedb_v2()
    added_edb = 0
    enriched_edb = 0
    for ex in edb_v2:
        key = normalize_key(ex["name"])
        if key in exercises_by_key:
            exercises_by_key[key] = merge_records(exercises_by_key[key], ex)
            enriched_edb += 1
        else:
            exercises_by_key[key] = ex
            added_edb += 1
    print(f"  ExerciseDB v2: +{added_edb} new, {enriched_edb} enriched")

    # ── Step 4: Add from Gym Exercises Dataset ──
    gym_ex = load_gym_exercises_dataset()
    added_gym = 0
    enriched_gym = 0
    for ex in gym_ex:
        key = normalize_key(ex["name"])
        if key in exercises_by_key:
            exercises_by_key[key] = merge_records(exercises_by_key[key], ex)
            enriched_gym += 1
        else:
            exercises_by_key[key] = ex
            added_gym += 1
    print(f"  Gym Dataset: +{added_gym} new, {enriched_gym} enriched")

    print()
    print(f"  TOTAL before validation: {len(exercises_by_key)} unique exercises")
    print()

    # ── Step 5: Validate every row ──
    print("Validating each exercise...")
    total_issues = 0
    fixed_count = 0
    removed = []
    all_exercises = list(exercises_by_key.values())

    for ex in all_exercises:
        issues = validate_exercise(ex)
        if issues:
            total_issues += len(issues)
            fixed_count += 1
        if not ex.get("primaryMuscles"):
            removed.append(ex["name"])

    for name in removed:
        key = normalize_key(name)
        if key in exercises_by_key:
            del exercises_by_key[key]

    print(f"  Validation: {fixed_count} exercises had issues ({total_issues} total fixes)")
    print(f"  Removed {len(removed)} exercises with no primary muscles")
    print()

    # ── Step 6: Recompute derived fields for consistency ──
    print("Recomputing science-based fields for all exercises...")
    for ex in exercises_by_key.values():
        name = ex["name"]
        equipment = ex["equipment"]
        mechanic = ex["mechanic"]
        pattern = ex["movement_pattern"]
        difficulty = ex.get("difficulty_level", 3)

        ex["fatigue_score"] = compute_fatigue(name, pattern, equipment, mechanic)
        ex["stimulus_score"] = compute_stimulus(name, pattern, equipment, mechanic)
        ex["sfr_ratio"] = round(ex["stimulus_score"] / max(ex["fatigue_score"], 1), 2)
        ex["axial_load"] = compute_axial_load(name, pattern, equipment)
        ex["recovery_time_hours"] = compute_recovery(pattern, mechanic, difficulty)
        ex["skill_level"] = compute_skill_level(name, difficulty, mechanic)
        ex["contraindications"] = compute_contraindications(name, pattern)

        ex_type = mechanic if mechanic in ("compound", "isolation") else "compound"
        ex["order_priority"] = 2 if ex_type == "compound" else 5
        ex["goal_suitability"] = GOAL_SUITABILITY.get(ex_type, GOAL_SUITABILITY["compound"])
        if not ex.get("rep_ranges_by_goal") or len(ex["rep_ranges_by_goal"]) < 5:
            ex["rep_ranges_by_goal"] = REP_RANGES if ex_type == "compound" else REP_RANGES_ISOLATION

    # ── Step 7: Sort and export ──
    final_list = sorted(exercises_by_key.values(), key=lambda x: x["name"])
    print(f"  FINAL: {len(final_list)} unique exercises")
    print()

    # ── Write CSV ──
    GOALS = ["Strength", "Muscle", "WeightLoss", "Endurance", "General"]
    header = [
        "name", "primaryMuscles", "secondaryMuscles", "equipment",
        "mechanic", "force", "movement_pattern", "difficulty_level",
        "category", "skill_level",
        "fatigue_score", "stimulus_score", "sfr_ratio",
        "axial_load", "recovery_time_hours", "order_priority",
        "gifUrl",
        "goal_Strength", "goal_Muscle", "goal_WeightLoss",
        "goal_Endurance", "goal_General",
    ]
    for goal in GOALS:
        header += [
            f"{goal}_min_reps", f"{goal}_max_reps",
            f"{goal}_rest_seconds", f"{goal}_sets",
        ]
    header += ["contraindications", "instructions"]

    with open(OUTPUT_CSV, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(header)

        for ex in final_list:
            gs = ex.get("goal_suitability") or {}
            rr = ex.get("rep_ranges_by_goal") or {}
            row = [
                ex.get("name", ""),
                "|".join(ex.get("primaryMuscles", [])),
                "|".join(ex.get("secondaryMuscles", [])),
                ex.get("equipment", ""),
                ex.get("mechanic", ""),
                ex.get("force", ""),
                ex.get("movement_pattern", ""),
                ex.get("difficulty_level", ""),
                ex.get("category", ""),
                ex.get("skill_level", ""),
                ex.get("fatigue_score", ""),
                ex.get("stimulus_score", ""),
                ex.get("sfr_ratio", ""),
                ex.get("axial_load", ""),
                ex.get("recovery_time_hours", ""),
                ex.get("order_priority", ""),
                ex.get("gifUrl", ""),
                gs.get("Strength", ""),
                gs.get("Muscle", ""),
                gs.get("WeightLoss", ""),
                gs.get("Endurance", ""),
                gs.get("General", ""),
            ]
            for goal in GOALS:
                r = rr.get(goal, {})
                row += [
                    r.get("min_reps", ""),
                    r.get("max_reps", ""),
                    r.get("rest_seconds", ""),
                    r.get("sets", ""),
                ]
            row += [
                "|".join(ex.get("contraindications", [])),
                " | ".join(ex.get("instructions", [])),
            ]
            w.writerow(row)

    print(f"Saved: {OUTPUT_CSV}")
    print()

    # ── Stats ──
    print("=" * 70)
    print("  DATASET SUMMARY")
    print("=" * 70)

    by_muscle = defaultdict(int)
    by_pattern = defaultdict(int)
    by_mechanic = defaultdict(int)
    by_equipment = defaultdict(int)
    by_skill = defaultdict(int)
    has_gif = 0
    has_instr = 0
    has_contra = 0

    for ex in final_list:
        for m in ex.get("primaryMuscles", []):
            by_muscle[m] += 1
        by_pattern[ex.get("movement_pattern", "other")] += 1
        by_mechanic[ex.get("mechanic", "compound")] += 1
        by_equipment[ex.get("equipment", "body only")] += 1
        by_skill[ex.get("skill_level", "intermediate")] += 1
        if ex.get("gifUrl"):
            has_gif += 1
        if ex.get("instructions"):
            has_instr += 1
        if ex.get("contraindications"):
            has_contra += 1

    print(f"\nTotal exercises: {len(final_list)}")
    print(f"\nBy primary muscle:")
    for m in sorted(by_muscle, key=by_muscle.get, reverse=True):
        print(f"  {m}: {by_muscle[m]}")
    print(f"\nBy movement pattern:")
    for p in sorted(by_pattern, key=by_pattern.get, reverse=True):
        print(f"  {p}: {by_pattern[p]}")
    print(f"\nBy mechanic: {dict(by_mechanic)}")
    print(f"By skill level: {dict(by_skill)}")
    print(f"\nBy equipment:")
    for e in sorted(by_equipment, key=by_equipment.get, reverse=True):
        print(f"  {e}: {by_equipment[e]}")
    print(f"\nWith GIF URL: {has_gif}/{len(final_list)} ({100*has_gif/len(final_list):.1f}%)")
    print(f"With instructions: {has_instr}/{len(final_list)} ({100*has_instr/len(final_list):.1f}%)")
    print(f"With contraindications: {has_contra}/{len(final_list)} ({100*has_contra/len(final_list):.1f}%)")


if __name__ == "__main__":
    main()
