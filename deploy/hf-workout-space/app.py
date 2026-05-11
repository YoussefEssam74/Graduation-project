"""
IntelliFit Workout Plan Generator — Hugging Face Spaces (Gradio SDK, CPU)
=========================================================================
Adapted from: ml_models/Workout-Plan_Generating/workout_api_direct.py

Changes for HF Spaces:
  - Model loaded from HF Hub (MODEL_REPO secret) instead of local path
  - Dataset CSVs loaded from HF Hub snapshot instead of local Dataset/ folder
  - asyncpg / DB removed (no DB access on Spaces)
  - FastAPI replaced with Gradio wrapper (Gradio SDK requirement)
  - All core logic (prompts, parsing, enrichment, injury filter) preserved intact

Environment Secrets:
  HF_TOKEN   — HF read token (to download private repos)
  MODEL_REPO — e.g. youssefeemad/intellifit-workout-v3
"""

import csv as _csv
import json
import time
import re
import os
import sys
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import random as _rand
import torch
import gradio as gr
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from peft import PeftModel
from huggingface_hub import snapshot_download

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("workout-space")

# ── Config ────────────────────────────────────────────────────────────────────
HF_TOKEN   = os.environ.get("HF_TOKEN")
MODEL_REPO = os.environ.get("MODEL_REPO", "youssefeemad/intellifit-workout-v3")
BASE_MODEL = "google/flan-t5-small"
MODEL_VERSION = "v3.0.0"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ── Download model + datasets from HF Hub ────────────────────────────────────
log.info(f"Downloading model repo {MODEL_REPO}...")
MODEL_DIR = snapshot_download(repo_id=MODEL_REPO, token=HF_TOKEN, cache_dir="/tmp/models")
DATASET_DIR = os.path.join(MODEL_DIR, "Dataset")
log.info(f"Model dir: {MODEL_DIR}")

# ── Load model ────────────────────────────────────────────────────────────────
torch_dtype = torch.float16 if DEVICE == "cuda" else torch.float32
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
base_model = AutoModelForSeq2SeqLM.from_pretrained(BASE_MODEL, torch_dtype=torch_dtype)
model = PeftModel.from_pretrained(base_model, MODEL_DIR)
model = model.to(DEVICE)
model.eval()
log.info("Model ready.")

# ══════════════════════════════════════════════════════════════════════════════
# Dataset Loaders  (mirrors workout_api_direct.py)
# ══════════════════════════════════════════════════════════════════════════════

_MECHANICS_FORCE_TO_PATTERN: Dict[str, str] = {
    "compound_push": "horizontal_push",
    "compound_pull": "horizontal_pull",
    "isolation_push": "elbow_extension",
    "isolation_pull": "elbow_flexion",
}
_MUSCLE_TO_PATTERN: Dict[str, str] = {
    "quads": "squat", "hamstrings": "hip_hinge", "glutes": "hip_hinge",
    "calves": "calf", "abs": "core_flexion", "shoulders": "vertical_push",
    "chest": "horizontal_push", "back": "horizontal_pull", "lats": "vertical_pull",
    "biceps": "elbow_flexion", "triceps": "elbow_extension",
}
_GOAL_REP_SCHEMES: Dict[str, Dict[str, Any]] = {
    "Strength":   {"min_reps": 3,  "max_reps": 6,  "rest_seconds": 180, "sets": 5},
    "Muscle":     {"min_reps": 8,  "max_reps": 12, "rest_seconds": 90,  "sets": 4},
    "WeightLoss": {"min_reps": 12, "max_reps": 15, "rest_seconds": 60,  "sets": 3},
    "Endurance":  {"min_reps": 15, "max_reps": 20, "rest_seconds": 45,  "sets": 3},
}

def _derive_movement_pattern(mechanics: str, force_type: str, target_muscle: str) -> str:
    m, f, t = mechanics.strip().lower(), force_type.strip().lower(), target_muscle.strip().lower()
    key = f"{m}_{f}"
    if key in _MECHANICS_FORCE_TO_PATTERN:
        return _MECHANICS_FORCE_TO_PATTERN[key]
    for muscle_kw, pattern in _MUSCLE_TO_PATTERN.items():
        if muscle_kw in t:
            return pattern
    if "push" in f: return "horizontal_push"
    if "pull" in f: return "horizontal_pull"
    return "general"

EXERCISE_DB: List[Dict[str, Any]] = []
_UNIQUE_EXERCISES_CSV = os.path.join(DATASET_DIR, "unique_exercises.csv")
try:
    with open(_UNIQUE_EXERCISES_CSV, "r", encoding="utf-8") as _f:
        reader = _csv.DictReader(_f)
        for row in reader:
            mechanics = row.get("mechanics", "").strip()
            force_type = row.get("force_type", "").strip()
            target_muscle = row.get("target_muscle", "").strip()
            difficulty = row.get("difficulty", "Intermediate").strip().lower()
            difficulty_level = {"beginner": 1, "intermediate": 2, "advanced": 3}.get(difficulty, 2)
            exercise_type = "compound" if mechanics.lower() == "compound" else "isolation"
            secondary_raw = row.get("secondary_muscles", "")
            secondary_muscles = [m.strip() for m in secondary_raw.split(",") if m.strip()]
            movement_pattern = _derive_movement_pattern(mechanics, force_type, target_muscle)
            goal_suit = ({"Strength": 8, "Muscle": 8, "WeightLoss": 7, "Endurance": 6}
                         if exercise_type == "compound"
                         else {"Strength": 4, "Muscle": 7, "WeightLoss": 6, "Endurance": 7})
            ex = {
                "name": row.get("exercise_name", "").strip(),
                "targetMuscles": [target_muscle] if target_muscle else [],
                "bodyParts": [target_muscle] if target_muscle else [],
                "equipments": [row.get("equipment", "Bodyweight").strip() or "Bodyweight"],
                "secondaryMuscles": secondary_muscles,
                "instructions": row.get("instructions", ""),
                "video_url": row.get("video_url", ""),
                "movement_pattern": movement_pattern,
                "difficulty_level": difficulty_level,
                "exercise_type": exercise_type,
                "goal_suitability": goal_suit,
                "rep_ranges_by_goal": {g: dict(v) for g, v in _GOAL_REP_SCHEMES.items()},
            }
            if ex["name"]:
                EXERCISE_DB.append(ex)
    log.info(f"Loaded {len(EXERCISE_DB)} exercises from unique_exercises.csv")
except Exception as e:
    log.warning(f"Could not load unique_exercises.csv: {e}")

EXERCISE_DB_BY_NAME: Dict[str, Dict] = {}
DB_BY_MUSCLE: Dict[str, List[Dict]] = {}
for _ex in EXERCISE_DB:
    _nm = _ex.get("name", "").lower().strip()
    if _nm:
        EXERCISE_DB_BY_NAME[_nm] = _ex
    for _m in _ex.get("targetMuscles", []):
        DB_BY_MUSCLE.setdefault(_m.lower(), []).append(_ex)


# ── Exercise-picker (ported from workout_api_direct.py) ───────────────────────
def _pick_exercises_for_focus(focus_areas: List[str], goal: str, level: str,
                              n: int = 5, exclude: set = None,
                              equipment: List[str] = None) -> List[Dict[str, Any]]:
    """Return *n* exercises from EXERCISE_DB matching the given focus areas."""
    exclude = exclude or set()
    goal_key = goal if goal in ["Strength", "Muscle", "WeightLoss", "Endurance", "Power"] else "Muscle"

    FOCUS_KEYWORDS: Dict[str, List[str]] = {
        "chest":      ["chest", "pectoral"],
        "shoulders":  ["shoulder", "delt"],
        "triceps":    ["tricep"],
        "back":       ["back", "lat", "rhomboid", "trap"],
        "biceps":     ["bicep"],
        "quads":      ["quad"],
        "hamstrings": ["hamstring"],
        "glutes":     ["glute"],
        "core":       ["abs", "abdomin", "oblique", "core", "waist"],
        "calves":     ["calf", "calves", "soleus", "gastrocnemius"],
        "rear delts": ["rear delt", "posterior delt", "upper back"],
        "legs":       ["quad", "hamstring", "glute", "calf", "upper legs", "lower legs"],
        "lats":       ["lat"],
    }

    PUSH_FOCUSES = {"chest", "shoulders", "triceps", "front delts"}
    PULL_FOCUSES = {"back", "biceps", "rear delts", "lats"}
    LEG_FOCUSES  = {"quads", "hamstrings", "glutes", "calves", "legs"}
    focus_set = {f.lower() for f in focus_areas}

    LEG_MUSCLES  = {"glutes", "quads", "hamstrings", "calves", "adductors", "abductors"}
    PUSH_MUSCLES = {"pectorals", "delts", "triceps", "serratus anterior"}
    PULL_MUSCLES = {"lats", "traps", "upper back", "biceps", "forearms"}

    excluded_patterns: set = set()
    excluded_body_parts: set = set()
    excluded_target_muscles: set = set()

    if focus_set & PULL_FOCUSES and not (focus_set & PUSH_FOCUSES) and not (focus_set & LEG_FOCUSES):
        excluded_patterns = {"push", "elbow_extension", "horizontal_push", "vertical_push",
                             "squat", "lunge", "hinge", "plyometric"}
        excluded_body_parts = {"upper legs", "lower legs"}
        excluded_target_muscles = LEG_MUSCLES
    elif focus_set & PUSH_FOCUSES and not (focus_set & PULL_FOCUSES) and not (focus_set & LEG_FOCUSES):
        excluded_patterns = {"pull", "elbow_flexion", "horizontal_pull", "vertical_pull",
                             "squat", "lunge", "hinge", "plyometric"}
        excluded_body_parts = {"upper legs", "lower legs"}
        excluded_target_muscles = LEG_MUSCLES
    elif focus_set & LEG_FOCUSES and not (focus_set & (PUSH_FOCUSES | PULL_FOCUSES)):
        excluded_patterns = {"horizontal_push", "vertical_push", "horizontal_pull",
                             "vertical_pull", "elbow_extension", "elbow_flexion"}
        excluded_target_muscles = PUSH_MUSCLES | PULL_MUSCLES

    user_equipment: set = set()
    if equipment:
        for eq in equipment:
            eq_low = eq.lower().strip()
            user_equipment.add(eq_low)
            if "dumbbell" in eq_low:        user_equipment.add("dumbbell")
            if "barbell" in eq_low:         user_equipment.add("barbell")
            if "cable" in eq_low:           user_equipment.add("cable")
            if "machine" in eq_low:         user_equipment.update({"machine", "leverage machine", "smith machine"})
    user_equipment.add("body weight")

    candidates: List[Dict] = []
    for focus in focus_areas:
        keywords = FOCUS_KEYWORDS.get(focus.lower(), [focus.lower()])
        for ex in EXERCISE_DB:
            target_muscles = ex.get("targetMuscles", [])
            real_muscles = [m for m in target_muscles if m and m.strip()]
            if not real_muscles:
                continue
            body_parts = ex.get("bodyParts", [])
            if any(bp.lower() in ("full body", "other", "cardio") for bp in body_parts):
                continue
            ex_pattern = ex.get("movement_pattern", "").lower()
            if excluded_patterns and any(excl in ex_pattern for excl in excluded_patterns):
                continue
            if excluded_body_parts and any(bp.lower() in excluded_body_parts for bp in body_parts):
                continue
            if excluded_target_muscles and any(m.lower().strip() in excluded_target_muscles for m in real_muscles):
                continue
            combined_text = " ".join([
                " ".join(real_muscles),
                " ".join(body_parts),
                ex_pattern,
            ]).lower()
            if any(kw in combined_text for kw in keywords):
                candidates.append(ex)

    def _base_name(n: str) -> str:
        n = n.lower().strip()
        n = re.sub(r'\s*v\.?\s*\d+\s*$', '', n)
        n = re.sub(r'\s*\(.*?\)\s*$', '', n)
        return n.strip()

    seen: set = set()
    unique: List[Dict] = []
    for ex in candidates:
        base = _base_name(ex["name"])
        if base not in seen and ex["name"].lower() not in exclude:
            seen.add(base)
            unique.append(ex)

    if level.lower() == "beginner":
        filtered = [ex for ex in unique if ex.get("difficulty_level", 3) <= 2]
        unique = filtered if filtered else unique

    if user_equipment:
        equip_match, equip_other = [], []
        for ex in unique:
            ex_equips = [e.lower() for e in ex.get("equipments", ["body weight"])]
            has_match = any(
                ueq in ex_eq or ex_eq in ueq
                for ex_eq in ex_equips for ueq in user_equipment
            )
            (equip_match if has_match else equip_other).append(ex)
        unique = equip_match + equip_other

    def _score(ex):
        goal_score    = ex.get("goal_suitability", {}).get(goal_key, 5)
        compound_bonus = 3 if ex.get("exercise_type") == "compound" else 0
        equip_bonus = 0
        if user_equipment:
            ex_equips = [e.lower() for e in ex.get("equipments", ["body weight"])]
            if any(ueq in ex_eq or ex_eq in ueq
                   for ex_eq in ex_equips for ueq in user_equipment if ueq != "body weight"):
                equip_bonus = 2
        return goal_score + compound_bonus + equip_bonus

    unique.sort(key=_score, reverse=True)
    pool = unique[:max(n * 3, 15)]
    if len(pool) > n:
        top, rest = pool[:2], pool[2:]
        _rand.shuffle(rest)
        pool = top + rest

    selected = pool[:n]
    formatted: List[Dict[str, Any]] = []
    for ex in selected:
        rep_config = ex.get("rep_ranges_by_goal", {}).get(goal_key, {
            "min_reps": 8, "max_reps": 12, "rest_seconds": 90, "sets": 3
        })
        formatted.append({
            "name":             ex["name"].title(),
            "sets":             str(rep_config.get("sets", 3)),
            "reps":             f"{rep_config['min_reps']}-{rep_config['max_reps']}",
            "rest":             f"{rep_config['rest_seconds']} sec",
            "target_muscles":   ex.get("targetMuscles", [])[:3],
            "equipment":        ex.get("equipments", ["body weight"])[0] if ex.get("equipments") else "body weight",
            "movement_pattern": ex.get("movement_pattern", "other"),
            "exercise_type":    ex.get("exercise_type", "isolation"),
            "notes":            "Selected from exercise database",
        })
    return formatted


# ── Day-focus templates (used when model truncates) ───────────────────────────
DAY_FOCUS_TEMPLATES: Dict[int, List[tuple]] = {
    3: [
        (1, "Day 1: Full Body",  ["chest", "back", "legs"]),
        (2, "Day 2: Upper Body", ["chest", "shoulders", "back", "biceps", "triceps"]),
        (3, "Day 3: Lower Body", ["quads", "hamstrings", "glutes", "calves"]),
    ],
    4: [
        (1, "Day 1: Push",       ["chest", "shoulders", "triceps"]),
        (2, "Day 2: Pull",       ["back", "biceps", "rear delts"]),
        (3, "Day 3: Legs",       ["quads", "hamstrings", "glutes"]),
        (4, "Day 4: Upper Mix",  ["chest", "back", "shoulders"]),
    ],
    5: [
        (1, "Day 1: Push",       ["chest", "shoulders", "triceps"]),
        (2, "Day 2: Pull",       ["back", "biceps", "rear delts"]),
        (3, "Day 3: Legs",       ["quads", "hamstrings", "glutes"]),
        (4, "Day 4: Upper",      ["chest", "back", "shoulders", "biceps", "triceps"]),
        (5, "Day 5: Core & Abs", ["core"]),
    ],
    6: [
        (1, "Day 1: Push A",     ["chest", "shoulders", "triceps"]),
        (2, "Day 2: Pull A",     ["back", "biceps"]),
        (3, "Day 3: Legs",       ["quads", "hamstrings", "glutes"]),
        (4, "Day 4: Push B",     ["chest", "shoulders", "triceps"]),
        (5, "Day 5: Pull B",     ["back", "biceps", "rear delts"]),
        (6, "Day 6: Upper Mix",  ["chest", "back", "shoulders"]),
    ],
    7: [
        (1, "Day 1: Push",       ["chest", "shoulders", "triceps"]),
        (2, "Day 2: Pull",       ["back", "biceps"]),
        (3, "Day 3: Legs",       ["quads", "hamstrings", "glutes"]),
        (4, "Day 4: Rest/Core",  ["core"]),
        (5, "Day 5: Push B",     ["chest", "shoulders", "triceps"]),
        (6, "Day 6: Pull B",     ["back", "biceps", "rear delts"]),
        (7, "Day 7: Full Body",  ["chest", "back", "legs"]),
    ],
}

WORKOUT_GOAL_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "Build Muscle":  {"sets": 4, "rep_range": "8-12",  "rest": "90s",  "technique": "Progressive Overload"},
    "Lose Fat":      {"sets": 3, "rep_range": "12-15", "rest": "60s",  "technique": "Superset"},
    "Strength":      {"sets": 5, "rep_range": "3-6",   "rest": "180s", "technique": "Ramped Sets"},
    "Muscle":        {"sets": 4, "rep_range": "8-12",  "rest": "90s",  "technique": "Progressive Overload"},
    "WeightLoss":    {"sets": 3, "rep_range": "12-15", "rest": "60s",  "technique": "Superset"},
    "Endurance":     {"sets": 3, "rep_range": "15-20", "rest": "30s",  "technique": "Circuit"},
}
try:
    _WORKOUT_DATASET_CSV = os.path.join(DATASET_DIR, "workout_dataset.csv")
    with open(_WORKOUT_DATASET_CSV, "r", encoding="utf-8-sig") as _f:
        _reader = _csv.DictReader(_f)
        _goal_rep_count: Dict[str, int] = {}
        for _row in _reader:
            _goal = _row.get("main_goal", "").strip()
            if not _goal: continue
            _pdf = _row.get("pdf_text", "")
            _is_ramped = "Ramped" in _pdf
            _m = re.search(r'\b(\d+)\s*[-–]\s*(\d+)\b', _pdf)
            if _m and _goal not in _goal_rep_count:
                _mn, _mx = int(_m.group(1)), int(_m.group(2))
                if 1 < _mn < _mx < 30:
                    WORKOUT_GOAL_TEMPLATES[_goal] = {
                        "sets": 5 if _is_ramped else 3,
                        "rep_range": f"{_mn}-{_mx}",
                        "rest": "180s" if _mx <= 6 else ("90s" if _mx <= 12 else "60s"),
                        "technique": "Ramped Sets" if _is_ramped else "Straight Sets",
                    }
                    _goal_rep_count[_goal] = 1
    log.info(f"Workout goal templates: {len(WORKOUT_GOAL_TEMPLATES)}")
except Exception as e:
    log.warning(f"Could not load workout_dataset.csv: {e}")

# ══════════════════════════════════════════════════════════════════════════════
# Core Logic  (mirrors workout_api_direct.py)
# ══════════════════════════════════════════════════════════════════════════════

INJURY_INSTRUCTIONS = {
    "Lower Back": "AVOID all deadlifts, barbell rows, squats, crunches, and sit-ups. USE seated/supported exercises instead.",
    "Shoulder":   "AVOID overhead pressing, bench press, dips, and lateral raises. USE cable and machine-based chest/back exercises.",
    "Knee":       "AVOID squats, lunges, leg press, leg extensions, and jumping. USE ham curls, hip thrusts, and upper body focus.",
    "Wrist":      "AVOID barbell work, push-ups, and heavy gripping. USE machines and cables with padded handles.",
    "Elbow":      "AVOID skull crushers, heavy curls, dips, and pull-ups. USE cables and machines with controlled range.",
    "Hip":        "AVOID squats, deadlifts, lunges, hip thrusts, and running. USE leg extensions, leg curls, and upper body.",
    "Ankle":      "AVOID squats, lunges, calf raises, jumping, and running. USE seated leg work and upper body exercises.",
}

def _infer_goal_from_inbody(context: Dict, user_goal: str):
    if not context or "inbody_data" not in context:
        return user_goal, ""
    inbody = context["inbody_data"]
    body_fat = inbody.get("body_fat_percent")
    if body_fat is None:
        return user_goal, ""
    if body_fat > 25 and user_goal.lower() not in ["weightloss", "weight loss", "cardio"]:
        return "WeightLoss", (f"Body fat is {body_fat}% (above healthy range). "
                              "Plan adjusted to prioritize fat loss.")
    if body_fat < 15 and user_goal.lower() in ["weightloss", "weight loss"]:
        return "Muscle", f"Body fat is already {body_fat}% (lean). Adjusted to muscle building."
    return user_goal, f"Body fat: {body_fat}%."

def build_prompt(req: dict, context: dict = None) -> str:
    context = context or {}
    goal = req.get("goal", "Muscle")
    adjusted_goal, body_explanation = _infer_goal_from_inbody(context, goal)
    days = req.get("days_per_week", 4)
    level = req.get("fitness_level", "Intermediate")
    injuries = req.get("injuries", [])
    equipment = req.get("equipment", [])

    tmpl = WORKOUT_GOAL_TEMPLATES.get(adjusted_goal, WORKOUT_GOAL_TEMPLATES.get("Muscle", {}))
    split = {3: "Push/Pull/Legs", 4: "Upper/Lower Split", 5: "Push/Pull/Legs/Upper/Lower",
             6: "Push/Pull/Legs twice a week"}.get(days, "Full Body")

    parts = [
        f"Act as an expert fitness coach. Generate a {days}-day workout plan for a {level.lower()} level person",
        f"with the goal of {adjusted_goal.lower()}.",
        f"Use a {split} structure with {tmpl.get('technique','Straight Sets')} technique,",
        f"{tmpl.get('sets',4)} sets, {tmpl.get('rep_range','8-12')} reps, {tmpl.get('rest','90s')} rest.",
    ]
    if body_explanation:
        parts.append(body_explanation)
    parts.append(f"Equipment: {', '.join(equipment) if equipment else 'Full gym access'}.")
    for inj in injuries:
        parts.append(f"INJURY [{inj}]: {INJURY_INSTRUCTIONS.get(inj, f'Avoid exercises stressing the {inj}.')}")
    parts.append("Output valid JSON: plan_name, days array (day_name, focus_areas, exercises with name, sets, reps, rest).")
    return " ".join(parts)


def _slugify(name: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', name.lower().strip()).strip('-')

def enrich_exercise_with_metadata(exercise: dict) -> dict:
    name = exercise.get("name", "")
    name_lower = name.lower().strip()
    db_entry = EXERCISE_DB_BY_NAME.get(name_lower)
    if not db_entry:
        for db_key, db_val in EXERCISE_DB_BY_NAME.items():
            if (name_lower in db_key or db_key in name_lower) and len(min(name_lower, db_key, key=len)) > 4:
                db_entry = db_val
                break
    if db_entry:
        exercise["image_url"] = db_entry.get("video_url", f"/api/exercise-images/{_slugify(name)}.jpg")
        exercise["description"] = db_entry.get("instructions", f"Perform {name} with proper form.")[:300]
        if not exercise.get("target_muscles") and db_entry.get("targetMuscles"):
            exercise["target_muscles"] = db_entry["targetMuscles"][:3]
        if not exercise.get("equipment") and db_entry.get("equipments"):
            exercise["equipment"] = db_entry["equipments"][0]
    else:
        exercise["image_url"] = f"/api/exercise-images/{_slugify(name)}.jpg"
        exercise["description"] = f"Perform {name} with proper form and controlled tempo."
    return exercise


def extract_workout_from_model_output(text: str, req_days: int = 4, req_goal: str = "Muscle",
                                       req_level: str = "Intermediate", req_equipment: List[str] = None) -> Dict[str, Any]:
    """Parse model output — mirrors extract_workout_from_model_output in workout_api_direct.py."""
    plan_name_match = re.search(r'"plan_name":\s*"([^"]+)"', text)
    plan_name = plan_name_match.group(1) if plan_name_match else f"AI {req_goal} Plan"

    exercise_pattern = r'"name":\s*"([^"]+)".*?"sets":\s*"?(\d+)"?.*?"reps":\s*"([^"]+)".*?"rest":\s*"([^"]+)"'
    seen_global: set = set()
    exercises_data: List[Dict] = []
    for match in re.finditer(exercise_pattern, text):
        ex_name = match.group(1).strip()
        if ex_name.lower() in seen_global: continue
        seen_global.add(ex_name.lower())
        exercise = {"name": ex_name, "sets": match.group(2), "reps": match.group(3), "rest": match.group(4)}
        search_start = match.start()
        next_name = text.find('"name":', match.end())
        window = text[search_start:next_name if next_name > 0 else min(len(text), search_start+500)]
        m = re.search(r'"target_muscles":\s*\[([^\]]+)\]', window)
        if m: exercise["target_muscles"] = re.findall(r'"([^"]+)"', m.group(1))
        m = re.search(r'"equipment":\s*"([^"]+)"', window)
        if m: exercise["equipment"] = m.group(1)
        exercises_data.append(exercise)

    if req_equipment:
        eq_lower = [e.lower() for e in req_equipment]
        exercises_data = [ex for ex in exercises_data
                          if not ex.get("equipment") or
                          any(eq in ex.get("equipment","").lower() for eq in eq_lower) or
                          "bodyweight" in ex.get("equipment","").lower()]

    day_templates = {
        3: [("Push", ["chest","shoulders","triceps"]),("Pull",["back","biceps"]),("Legs",["quads","hamstrings","glutes"])],
        4: [("Push",["chest","shoulders","triceps"]),("Pull",["back","biceps"]),("Legs",["quads","hamstrings","glutes"]),("Upper Mix",["chest","back","shoulders"])],
        5: [("Chest",["chest"]),("Back",["back","lats"]),("Shoulders & Arms",["shoulders","biceps","triceps"]),("Legs",["quads","hamstrings","glutes"]),("Arms & Abs",["biceps","triceps","core"])],
        6: [("Push A",["chest","triceps"]),("Pull A",["back","biceps"]),("Legs A",["quads"]),("Push B",["shoulders","triceps"]),("Pull B",["back"]),("Legs B",["hamstrings","glutes"])],
    }
    templates = day_templates.get(req_days, day_templates[4])

    day_pattern = r'"day_number":\s*(\d+).*?"day_name":\s*"([^"]+)".*?"focus_areas":\s*\[([^\]]+)\]'
    day_matches = list(re.finditer(day_pattern, text))
    days_data: List[Dict] = []

    if day_matches:
        for i, match in enumerate(day_matches):
            day_number = int(match.group(1))
            day_name = match.group(2)
            focus_areas = re.findall(r'"([^"]+)"', match.group(3))
            start_pos = match.end()
            end_pos = day_matches[i+1].start() if i+1 < len(day_matches) else len(text)
            day_text = text[start_pos:end_pos]
            day_exercises, seen_day = [], set()
            for em in re.finditer(exercise_pattern, day_text):
                n = em.group(1).strip()
                if n.lower() in seen_day: continue
                seen_day.add(n.lower())
                day_exercises.append({"name":n,"sets":em.group(2),"reps":em.group(3),"rest":em.group(4)})
            days_data.append({"day_number":day_number,"day_name":day_name,
                               "focus_areas":focus_areas,"focus":", ".join(focus_areas),
                               "exercises":day_exercises})
    else:
        muscle_keywords = {
            "chest":["chest","pec","bench","fly"],"back":["back","lat","row","pulldown"],
            "shoulders":["shoulder","delt","lateral raise"],"triceps":["tricep","pushdown"],
            "biceps":["bicep","curl"],"quads":["quad","squat","leg press","lunge"],
            "hamstrings":["hamstring","leg curl","romanian"],"glutes":["glute","hip thrust"],
            "core":["core","ab","plank"],"calves":["calf"],
        }
        for i in range(req_days):
            t = templates[i % len(templates)]
            day_exs = []
            remaining = []
            for ex in exercises_data:
                combined = f"{ex.get('name','').lower()} {' '.join(ex.get('target_muscles',[])).lower()}"
                if any(kw in combined for fa in t[1] for kw in muscle_keywords.get(fa, [fa])):
                    day_exs.append(ex)
                else:
                    remaining.append(ex)
            exercises_data = remaining
            days_data.append({"day_number":i+1,"day_name":f"Day {i+1}: {t[0]}",
                               "focus_areas":t[1],"focus":", ".join(t[1]),"exercises":day_exs[:6]})

    for day in days_data:
        day["exercises"] = [enrich_exercise_with_metadata(ex) for ex in day.get("exercises", [])]

    return {
        "plan_name": plan_name, "fitness_level": req_level, "goal": req_goal,
        "days_per_week": req_days, "program_duration_weeks": 8,
        "notes": "Generated by IntelliFit AI", "days": days_data,
    }


# ── Model inference ───────────────────────────────────────────────────────────
def run_model(prompt: str, max_len: int = 1024) -> str:
    inputs = tokenizer(prompt, return_tensors="pt", max_length=256, truncation=True).to(DEVICE)
    with torch.no_grad():
        out = model.generate(**inputs, max_length=max_len, num_beams=4, early_stopping=True)
    return tokenizer.decode(out[0], skip_special_tokens=True)


# ── Core generation pipeline (called by both Gradio UI and /generate) ────────
def _generate_plan(req_days: int, req_goal: str, req_level: str,
                   req_equipment: List[str], prompt: str) -> Dict[str, Any]:
    """Run model + parse + fill underpopulated days + create missing days."""
    raw = run_model(prompt)
    log.info(f"Model output ({len(raw)} chars): {raw[:200]}")

    plan = extract_workout_from_model_output(
        raw,
        req_days=req_days,
        req_goal=req_goal,
        req_level=req_level,
        req_equipment=req_equipment,
    )

    all_used_names: set = set()
    for day in plan.get("days", []):
        for ex in day.get("exercises", []):
            all_used_names.add(ex.get("name", "").lower())

    # ── Step A: Fill underpopulated days (< 4 exercises) ──────────────────────
    for day in plan.get("days", []):
        if len(day.get("exercises", [])) < 4:
            needed = 5 - len(day["exercises"])
            db_exs = _pick_exercises_for_focus(
                day.get("focus_areas", ["chest"]),
                req_goal, req_level, n=needed,
                exclude=all_used_names, equipment=req_equipment,
            )
            for ex in db_exs:
                ex = enrich_exercise_with_metadata(ex)
                day["exercises"].append(ex)
                all_used_names.add(ex.get("name", "").lower())

    # ── Step B: Create completely missing days (model truncated early) ─────────
    existing_day_numbers = {d.get("day_number", 0) for d in plan.get("days", [])}
    if len(plan.get("days", [])) < req_days:
        templates = DAY_FOCUS_TEMPLATES.get(
            req_days,
            [(i + 1, f"Day {i + 1}: Full Body", ["chest", "back", "legs"]) for i in range(req_days)],
        )
        missing_count = req_days - len(plan.get("days", []))
        log.info(f"Model produced {len(plan.get('days', []))} days — adding {missing_count} more from DB")

        for (day_num, day_name, focus_areas) in templates:
            if day_num not in existing_day_numbers:
                db_exs = _pick_exercises_for_focus(
                    focus_areas, req_goal, req_level, n=5,
                    exclude=all_used_names, equipment=req_equipment,
                )
                for ex in db_exs:
                    ex = enrich_exercise_with_metadata(ex)
                    all_used_names.add(ex.get("name", "").lower())
                plan["days"].append({
                    "day_number":                day_num,
                    "day_name":                  day_name,
                    "focus_areas":               focus_areas,
                    "focus":                     ", ".join(focus_areas),
                    "estimated_duration_minutes": 45,
                    "exercises":                 db_exs,
                })
                log.info(f"  + Added {day_name} with {len(db_exs)} exercises")

        plan["days"].sort(key=lambda d: d.get("day_number", 0))

    return plan


# ── Gradio predict function (kept for UI compatibility) ───────────────────────
def predict(request_json: str) -> str:
    t0 = time.time()
    try:
        req = json.loads(request_json)
        req_days      = req.get("days_per_week", 4)
        req_goal      = req.get("goal", "Muscle")
        req_level     = req.get("fitness_level", "Intermediate")
        req_equipment = req.get("equipment", [])
        prompt = build_prompt(req)

        plan  = _generate_plan(req_days, req_goal, req_level, req_equipment, prompt)
        valid = bool(plan.get("days") and
                     sum(len(d.get("exercises", [])) for d in plan["days"]) > 0)

        return json.dumps({
            "plan": plan, "isValidJson": valid, "modelVersion": MODEL_VERSION,
            "generationLatencyMs": int((time.time() - t0) * 1000),
            "promptUsed": prompt,
            "error": None if valid else "Model produced empty plan",
        })
    except Exception as e:
        log.error(f"predict() error: {e}", exc_info=True)
        return json.dumps({
            "plan": None, "isValidJson": False, "modelVersion": MODEL_VERSION,
            "generationLatencyMs": int((time.time() - t0) * 1000),
            "promptUsed": "", "error": str(e),
        })


def _health_check_str(_: str = "") -> str:
    return json.dumps({"status": "healthy", "model": MODEL_VERSION, "device": DEVICE,
                       "exercises_loaded": len(EXERCISE_DB),
                       "timestamp": datetime.utcnow().isoformat()})


# ── Gradio Interface (mounted at /ui for manual testing) ──────────────────────
with gr.Blocks(title="IntelliFit Workout AI") as _demo:
    gr.Markdown("# 🏋️ IntelliFit Workout Plan Generator")
    gr.Markdown("**Main API**: POST `/generate` · `{prompt, max_length}` → `{success, plan, error}`")
    with gr.Row():
        inp = gr.Textbox(
            label="Request JSON", lines=8,
            placeholder='{"days_per_week":4,"goal":"Muscle","fitness_level":"Intermediate","equipment":["dumbbell"],"injuries":[]}')
        out = gr.Textbox(label="Response JSON", lines=8)
    gr.Button("Generate Plan", variant="primary").click(
        fn=predict, inputs=inp, outputs=out, api_name="predict")
    with gr.Row():
        health_out = gr.Textbox(label="Health", lines=2)
    gr.Button("Health Check").click(
        fn=_health_check_str, inputs=gr.Textbox(visible=False, value=""),
        outputs=health_out, api_name="health")


# ── FastAPI app  (exported as `app` for uvicorn app:app) ──────────────────────
_fastapi = FastAPI(title="IntelliFit Workout Generator", version=MODEL_VERSION)
_fastapi.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@_fastapi.post("/generate")
async def generate_endpoint(request: Request) -> JSONResponse:
    """
    Called by the C# WorkoutGeneratorService.
    Request:  {"prompt": "Generate a 4-day workout plan ...", "max_length": 1024, "coach_feedback": null}
    Response: {"success": true, "plan": {...}, "error": null}
    """
    t0 = time.time()
    try:
        body         = await request.json()
        prompt       = body.get("prompt", "")
        max_length   = int(body.get("max_length", 1024))
        # Parse structured fields from the prompt string:
        # "Generate a 4-day workout plan for intermediate lifter, goal is Muscle, has access to dumbbell."
        days_match  = re.search(r'Generate a (\d+)-day',         prompt, re.IGNORECASE)
        level_match = re.search(r'for (\w+) lifter',             prompt, re.IGNORECASE)
        goal_match  = re.search(r'goal is (\w+)',                prompt, re.IGNORECASE)
        equip_match = re.search(r'has access to (.+?)(?:\.|$)',  prompt, re.IGNORECASE)

        req_days      = int(days_match.group(1))                           if days_match  else 4
        req_level     = level_match.group(1).title()                       if level_match else "Intermediate"
        req_goal      = goal_match.group(1).title()                        if goal_match  else "Muscle"
        req_equipment = [e.strip() for e in equip_match.group(1).split(",")] if equip_match else []

        log.info(f"/generate: days={req_days} level={req_level} goal={req_goal} equip={req_equipment}")

        plan  = _generate_plan(req_days, req_goal, req_level, req_equipment, prompt)
        valid = bool(plan.get("days") and
                     sum(len(d.get("exercises", [])) for d in plan["days"]) > 0)

        if not valid:
            return JSONResponse(
                {"success": False, "plan": None, "error": "Model produced empty plan"},
                status_code=500,
            )

        return JSONResponse({"success": True, "plan": plan, "error": None})

    except Exception as e:
        log.error(f"/generate error: {e}", exc_info=True)
        return JSONResponse(
            {"success": False, "plan": None, "error": str(e)},
            status_code=500,
        )


@_fastapi.get("/health")
def health_endpoint():
    return {
        "status": "healthy",
        "model": MODEL_VERSION,
        "device": DEVICE,
        "exercises_loaded": len(EXERCISE_DB),
        "timestamp": datetime.utcnow().isoformat(),
    }


@_fastapi.get("/")
def root():
    return {
        "service": "IntelliFit Workout Generator",
        "version": MODEL_VERSION,
        "endpoints": ["/generate (POST)", "/health (GET)", "/ui (Gradio UI)"],
    }


# Mount Gradio UI at /ui — `app` is the combined FastAPI+Gradio app
app = gr.mount_gradio_app(_fastapi, _demo, path="/ui")
