"""
deploy/modal_workout.py
─────────────────────────────────────────────────────────────────────────────
Modal GPU deployment for IntelliFit Workout Plan Generator.

Runs Flan-T5-Small + PEFT adapter on a T4 GPU (or CPU) with persistent caching.
Expected inference: ~1–3 s per request.

Quick-start
-----------
  pip install modal
  modal setup
  modal secret create huggingface-secret HF_TOKEN=<your-hf-token>
  modal deploy deploy/modal_workout.py

Endpoint
--------
  POST  https://<your-slug>--intellifit-workout-workoutservice-web.modal.run/generate
  GET   https://...web.modal.run/health
"""

import modal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# ── Constants ─────────────────────────────────────────────────────────────────
ADAPTER_REPO = "youssefeemad/intellifit-workout-v3"
BASE_MODEL   = "google/flan-t5-small"
MODEL_CACHE  = "/model-cache"

# ── Container image ───────────────────────────────────────────────────────────
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.5.1",
        extra_index_url="https://download.pytorch.org/whl/cu121",
    )
    .pip_install(
        "transformers>=4.40.0",
        "peft>=0.10.0",
        "accelerate>=0.27.0",
        "fastapi[standard]>=0.110.0",
        "huggingface_hub>=0.22.0",
    )
)

# ── Persistent volume ─────────────────────────────────────────────────────────
volume = modal.Volume.from_name("intellifit-workout-models", create_if_missing=True)

app = modal.App("intellifit-workout")

# ── Pydantic Request / Response schemas ──────────────────────────────────────
class InBodyData(BaseModel):
    body_fat_percent: Optional[float] = Field(None, alias="body_fat_percentage")
    muscle_mass_kg: Optional[float] = None
    visceral_fat_level: Optional[int] = None
    bmr_kcal: Optional[float] = None

class UserContext(BaseModel):
    inbody_data: Optional[InBodyData] = None

class WorkoutRequest(BaseModel):
    days_per_week: int = Field(4, ge=1, le=7)
    goal: str = Field("Muscle")
    fitness_level: str = Field("Intermediate")
    equipment: List[str] = Field(default_factory=list)
    injuries: List[str] = Field(default_factory=list)
    user_context: Optional[UserContext] = None

# ── Modal service class ───────────────────────────────────────────────────────
@app.cls(
    gpu="T4",
    image=image,
    volumes={MODEL_CACHE: volume},
    timeout=86400,
    scaledown_window=300,
    secrets=[modal.Secret.from_name("huggingface-secret")],
)
@modal.concurrent(max_inputs=4) # Flan-T5 is tiny, can handle multiple inputs concurrently
class WorkoutService:

    # ── Startup: load model and datasets ──────────────────────────────────────
    @modal.enter()
    def load_model(self):
        import csv
        import json
        import logging
        import os
        import re
        import torch
        from huggingface_hub import snapshot_download
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
        from peft import PeftModel

        logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
        self.log = logging.getLogger("workout-modal")

        hf_token = os.environ.get("HF_TOKEN")
        model_dir = os.path.join(MODEL_CACHE, "workout_model")

        # ── Download adapter + data files (cached in volume) ──────────────────
        if not os.path.exists(os.path.join(model_dir, "adapter_config.json")):
            self.log.info(f"Downloading model repo {ADAPTER_REPO} to volume...")
            snapshot_download(ADAPTER_REPO, local_dir=model_dir, token=hf_token)
        else:
            self.log.info("Model already cached in volume.")

        dataset_dir = os.path.join(model_dir, "Dataset")

        # ── Load model ────────────────────────────────────────────────────────
        self.log.info("Loading Flan-T5 base model + PEFT adapter...")
        self._tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
        base = AutoModelForSeq2SeqLM.from_pretrained(BASE_MODEL, torch_dtype=torch.float16, device_map={"": 0})
        self._model = PeftModel.from_pretrained(base, model_dir, device_map={"": 0})
        self._model.eval()

        # ── Load unique_exercises dataset ─────────────────────────────────────
        self._exercise_db = []
        unique_exercises_csv = os.path.join(dataset_dir, "unique_exercises.csv")

        mechanics_force_to_pattern = {
            "compound_push": "horizontal_push",
            "compound_pull": "horizontal_pull",
            "isolation_push": "elbow_extension",
            "isolation_pull": "elbow_flexion",
        }
        muscle_to_pattern = {
            "quads": "squat", "hamstrings": "hip_hinge", "glutes": "hip_hinge",
            "calves": "calf", "abs": "core_flexion", "shoulders": "vertical_push",
            "chest": "horizontal_push", "back": "horizontal_pull", "lats": "vertical_pull",
            "biceps": "elbow_flexion", "triceps": "elbow_extension",
        }
        goal_rep_schemes = {
            "Strength":   {"min_reps": 3,  "max_reps": 6,  "rest_seconds": 180, "sets": 5},
            "Muscle":     {"min_reps": 8,  "max_reps": 12, "rest_seconds": 90,  "sets": 4},
            "WeightLoss": {"min_reps": 12, "max_reps": 15, "rest_seconds": 60,  "sets": 3},
            "Endurance":  {"min_reps": 15, "max_reps": 20, "rest_seconds": 45,  "sets": 3},
        }

        def _derive_movement_pattern(mechanics: str, force_type: str, target_muscle: str) -> str:
            m, f, t = mechanics.strip().lower(), force_type.strip().lower(), target_muscle.strip().lower()
            key = f"{m}_{f}"
            if key in mechanics_force_to_pattern:
                return mechanics_force_to_pattern[key]
            for muscle_kw, pattern in muscle_to_pattern.items():
                if muscle_kw in t:
                    return pattern
            if "push" in f: return "horizontal_push"
            if "pull" in f: return "horizontal_pull"
            return "general"

        if os.path.exists(unique_exercises_csv):
            try:
                with open(unique_exercises_csv, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
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
                            "rep_ranges_by_goal": {g: dict(v) for g, v in goal_rep_schemes.items()},
                        }
                        if ex["name"]:
                            self._exercise_db.append(ex)
                self.log.info(f"Loaded {len(self._exercise_db)} exercises from CSV.")
            except Exception as e:
                self.log.warning(f"Could not load unique_exercises.csv: {e}")

        self._exercise_db_by_name = {ex["name"].lower().strip(): ex for ex in self._exercise_db if ex["name"]}

        # ── Load workout_dataset for goal templates ───────────────────────────
        self._workout_goal_templates = {
            "Build Muscle":  {"sets": 4, "rep_range": "8-12",  "rest": "90s",  "technique": "Progressive Overload"},
            "Lose Fat":      {"sets": 3, "rep_range": "12-15", "rest": "60s",  "technique": "Superset"},
            "Strength":      {"sets": 5, "rep_range": "3-6",   "rest": "180s", "technique": "Ramped Sets"},
            "Muscle":        {"sets": 4, "rep_range": "8-12",  "rest": "90s",  "technique": "Progressive Overload"},
            "WeightLoss":    {"sets": 3, "rep_range": "12-15", "rest": "60s",  "technique": "Superset"},
            "Endurance":     {"sets": 3, "rep_range": "15-20", "rest": "30s",  "technique": "Circuit"},
        }
        workout_dataset_csv = os.path.join(dataset_dir, "workout_dataset.csv")
        if os.path.exists(workout_dataset_csv):
            try:
                with open(workout_dataset_csv, "r", encoding="utf-8-sig") as f:
                    reader = csv.DictReader(f)
                    goal_rep_count = {}
                    for row in reader:
                        goal = row.get("main_goal", "").strip()
                        if not goal: continue
                        pdf = row.get("pdf_text", "")
                        is_ramped = "Ramped" in pdf
                        m = re.search(r'\b(\d+)\s*[-–]\s*(\d+)\b', pdf)
                        if m and goal not in goal_rep_count:
                            mn, mx = int(m.group(1)), int(m.group(2))
                            if 1 < mn < mx < 30:
                                self._workout_goal_templates[goal] = {
                                    "sets": 5 if is_ramped else 3,
                                    "rep_range": f"{mn}-{mx}",
                                    "rest": "180s" if mx <= 6 else ("90s" if mx <= 12 else "60s"),
                                    "technique": "Ramped Sets" if is_ramped else "Straight Sets",
                                }
                                goal_rep_count[goal] = 1
                self.log.info(f"Loaded workout goal templates: {len(self._workout_goal_templates)}")
            except Exception as e:
                self.log.warning(f"Could not load workout_dataset.csv: {e}")

    # ── FastAPI ASGI App ──────────────────────────────────────────────────────
    @modal.asgi_app()
    def web(self):
        import json
        import re
        import time
        import random
        from fastapi import FastAPI, HTTPException
        from fastapi.middleware.cors import CORSMiddleware
        import torch

        web_app = FastAPI(title="IntelliFit Workout API", version="1.0.0")
        web_app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"],
        )

        DAY_FOCUS_TEMPLATES = {
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

        INJURY_INSTRUCTIONS = {
            "Lower Back": "AVOID all deadlifts, barbell rows, squats, crunches, and sit-ups. USE seated/supported exercises instead.",
            "Shoulder":   "AVOID overhead pressing, bench press, dips, and lateral raises. USE cable and machine-based chest/back exercises.",
            "Knee":       "AVOID squats, lunges, leg press, leg extensions, and jumping. USE ham curls, hip thrusts, and upper body focus.",
            "Wrist":      "AVOID barbell work, push-ups, and heavy gripping. USE machines and cables with padded handles.",
            "Elbow":      "AVOID skull crushers, heavy curls, dips, and pull-ups. USE cables and machines with controlled range.",
            "Hip":        "AVOID squats, deadlifts, lunges, hip thrusts, and running. USE leg extensions, leg curls, and upper body.",
            "Ankle":      "AVOID squats, lunges, calf raises, jumping, and running. USE seated leg work and upper body exercises.",
        }

        def _infer_goal_from_inbody(inbody: Optional[InBodyData], user_goal: str):
            if not inbody or inbody.body_fat_percent is None:
                return user_goal, ""
            body_fat = inbody.body_fat_percent
            if body_fat > 25 and user_goal.lower() not in ["weightloss", "weight loss", "cardio"]:
                return "WeightLoss", (f"Body fat is {body_fat}% (above healthy range). "
                                      "Plan adjusted to prioritize fat loss.")
            if body_fat < 15 and user_goal.lower() in ["weightloss", "weight loss"]:
                return "Muscle", f"Body fat is already {body_fat}% (lean). Adjusted to muscle building."
            return user_goal, f"Body fat: {body_fat}%."

        def build_prompt(req: WorkoutRequest) -> str:
            goal = req.goal
            inbody = req.user_context.inbody_data if req.user_context else None
            adjusted_goal, body_explanation = _infer_goal_from_inbody(inbody, goal)
            days = req.days_per_week
            level = req.fitness_level
            injuries = req.injuries
            equipment = req.equipment

            tmpl = self._workout_goal_templates.get(adjusted_goal, self._workout_goal_templates.get("Muscle", {}))
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
            seed = random.randint(1, 100000)
            parts.append(f"Ensure variety and unique exercise selections (seed: {seed}).")
            parts.append("Output valid JSON: plan_name, days array (day_name, focus_areas, exercises with name, sets, reps, rest).")
            return " ".join(parts)

        def _pick_exercises_for_focus(focus_areas: List[str], goal: str, level: str,
                                      n: int = 5, exclude: set = None,
                                      equipment: List[str] = None) -> List[Dict[str, Any]]:
            exclude = exclude or set()
            goal_key = goal if goal in ["Strength", "Muscle", "WeightLoss", "Endurance", "Power"] else "Muscle"

            FOCUS_KEYWORDS = {
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

            excluded_patterns = set()
            excluded_body_parts = set()
            excluded_target_muscles = set()

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

            user_equipment = set()
            if equipment:
                for eq in equipment:
                    eq_low = eq.lower().strip()
                    user_equipment.add(eq_low)
                    if "dumbbell" in eq_low:        user_equipment.add("dumbbell")
                    if "barbell" in eq_low:         user_equipment.add("barbell")
                    if "cable" in eq_low:           user_equipment.add("cable")
                    if "machine" in eq_low:         user_equipment.update({"machine", "leverage machine", "smith machine"})
            user_equipment.add("body weight")

            candidates = []
            for focus in focus_areas:
                keywords = FOCUS_KEYWORDS.get(focus.lower(), [focus.lower()])
                for ex in self._exercise_db:
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

            seen = set()
            unique = []
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
            random.shuffle(pool)
            selected = pool[:n]
            formatted = []
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

        def enrich_exercise_with_metadata(exercise: dict) -> dict:
            name = exercise.get("name", "")
            name_lower = name.lower().strip()
            db_entry = self._exercise_db_by_name.get(name_lower)
            if not db_entry:
                for db_key, db_val in self._exercise_db_by_name.items():
                    if (name_lower in db_key or db_key in name_lower) and len(min(name_lower, db_key, key=len)) > 4:
                        db_entry = db_val
                        break
            if db_entry:
                exercise["image_url"] = db_entry.get("video_url", f"/api/exercise-images/{re.sub(r'[^a-z0-9]+', '-', name.lower().strip()).strip('-')}.jpg")
                exercise["description"] = db_entry.get("instructions", f"Perform {name} with proper form.")[:300]
                if not exercise.get("target_muscles") and db_entry.get("targetMuscles"):
                    exercise["target_muscles"] = db_entry["targetMuscles"][:3]
                if not exercise.get("equipment") and db_entry.get("equipments"):
                    exercise["equipment"] = db_entry["equipments"][0]
            else:
                exercise["image_url"] = f"/api/exercise-images/{re.sub(r'[^a-z0-9]+', '-', name.lower().strip()).strip('-')}.jpg"
                exercise["description"] = f"Perform {name} with proper form and controlled tempo."
            return exercise

        def extract_workout_from_model_output(text: str, req_days: int = 4, req_goal: str = "Muscle",
                                               req_level: str = "Intermediate", req_equipment: List[str] = None) -> Dict[str, Any]:
            plan_name_match = re.search(r'"plan_name":\s*"([^"]+)"', text)
            plan_name = plan_name_match.group(1) if plan_name_match else f"AI {req_goal} Plan"

            exercise_pattern = r'"name":\s*"([^"]+)".*?"sets":\s*"?(\d+)"?.*?"reps":\s*"([^"]+)".*?"rest":\s*"([^"]+)"'
            seen_global = set()
            exercises_data = []
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
            days_data = []

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
                "notes": "Generated by IntelliFit AI on Modal", "days": days_data,
            }

        def _generate_plan(req_days: int, req_goal: str, req_level: str,
                           req_equipment: List[str], prompt: str) -> Dict[str, Any]:
            inputs = self._tokenizer(prompt, return_tensors="pt", max_length=256, truncation=True).to("cuda")
            with torch.no_grad():
                out = self._model.generate(
                    **inputs,
                    max_length=1024,
                    do_sample=True,
                    temperature=0.8,
                    top_p=0.9,
                    repetition_penalty=1.2,
                    eos_token_id=self._tokenizer.eos_token_id,
                    pad_token_id=self._tokenizer.eos_token_id
                )
            raw = self._tokenizer.decode(out[0], skip_special_tokens=True)

            plan = extract_workout_from_model_output(
                raw,
                req_days=req_days,
                req_goal=req_goal,
                req_level=req_level,
                req_equipment=req_equipment,
            )

            all_used_names = set()
            for day in plan.get("days", []):
                for ex in day.get("exercises", []):
                    all_used_names.add(ex.get("name", "").lower())

            # ── Step A: Fill underpopulated days (< 4 exercises) ──────────────────
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

            # ── Step B: Create completely missing days (model truncated early) ────
            existing_day_numbers = {d.get("day_number", 0) for d in plan.get("days", [])}
            if len(plan.get("days", [])) < req_days:
                templates = DAY_FOCUS_TEMPLATES.get(
                    req_days,
                    [(i + 1, f"Day {i + 1}: Full Body", ["chest", "back", "legs"]) for i in range(req_days)],
                )
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

                plan["days"].sort(key=lambda d: d.get("day_number", 0))

            return plan

        # ── Route handlers ────────────────────────────────────────────────────
        @web_app.get("/health")
        def health():
            return {"status": "ok", "model": ADAPTER_REPO, "gpu": "T4", "exercises_loaded": len(self._exercise_db)}

        @web_app.post("/generate")
        def generate(req: WorkoutRequest):
            t0 = time.time()
            try:
                # Build context mapping from UserContext
                context = {}
                if req.user_context and req.user_context.inbody_data:
                    context["inbody_data"] = req.user_context.inbody_data.dict()

                prompt = build_prompt(req)
                plan = _generate_plan(req.days_per_week, req.goal, req.fitness_level, req.equipment, prompt)
                valid = bool(plan.get("days") and sum(len(d.get("exercises", [])) for d in plan["days"]) > 0)

                if not valid:
                    raise HTTPException(status_code=500, detail="Model produced empty plan")

                return {
                    "success": True,
                    "plan": plan,
                    "is_valid_json": True,
                    "model_version": "v3.0.0-modal",
                    "generation_latency_ms": int((time.time() - t0) * 1000),
                    "prompt_used": prompt,
                    "error": None,
                }
            except Exception as exc:
                self.log.error("generate() error: %s", exc, exc_info=True)
                raise HTTPException(status_code=500, detail=str(exc))

        return web_app

# ── Local smoke-test ──────────────────────────────────────────────────────────
@app.local_entrypoint()
def smoke_test():
    print("Modal app 'intellifit-workout' defined.")
    print("Deploy with:  modal deploy deploy/modal_workout.py")
