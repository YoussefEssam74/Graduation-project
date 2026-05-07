"""
IntelliFit Workout Plan Generator — Hugging Face Spaces Edition
================================================================
FastAPI service running Flan-T5-Small + LoRA adapter on CPU.
Adapted from workout_api.py for Hugging Face Spaces deployment.

Environment Variables (set as HF Space Secrets):
    HF_TOKEN       — Hugging Face access token for private model repo
    MODEL_REPO     — HF repo ID for LoRA adapter (e.g., "YourUser/intellifit-workout-v3")
"""

import os
import re
import sys
import json
import time
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from peft import PeftModel
from huggingface_hub import snapshot_download

# ── Configuration ────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("workout-api")

HF_TOKEN = os.environ.get("HF_TOKEN")
MODEL_REPO = os.environ.get("MODEL_REPO", "YourUsername/intellifit-workout-v3")
BASE_MODEL = "google/flan-t5-small"
MODEL_VERSION = "v3.0.0"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ── Download & Load Model ────────────────────────────────────────────────────
log.info(f"Device: {DEVICE}")
log.info(f"Downloading LoRA adapter from {MODEL_REPO}...")

try:
    adapter_dir = snapshot_download(
        repo_id=MODEL_REPO,
        token=HF_TOKEN,
        cache_dir="/app/models",
    )
    log.info(f"Adapter downloaded to {adapter_dir}")

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    base_model = AutoModelForSeq2SeqLM.from_pretrained(BASE_MODEL)
    model = PeftModel.from_pretrained(base_model, adapter_dir)
    model = model.to(DEVICE)
    model.eval()
    log.info("Model loaded and ready for inference.")
except Exception as e:
    log.error(f"Failed to load model: {e}")
    raise

# ══════════════════════════════════════════════════════════════════════════════
# REQUEST / RESPONSE SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class InBodyData(BaseModel):
    muscle_mass_kg: Optional[float] = None
    body_fat_percent: Optional[float] = None
    skeletal_muscle_mass: Optional[float] = None


class MuscleScanData(BaseModel):
    weak_areas: Optional[List[str]] = None
    strong_areas: Optional[List[str]] = None


class StrengthProfileEntry(BaseModel):
    exercise_name: str
    one_rm_kg: float
    confidence_score: float


class FeedbackSummary(BaseModel):
    avg_rating: Optional[float] = None
    weight_adjustments: Optional[Dict[str, str]] = None


class UserContext(BaseModel):
    inbody_data: Optional[InBodyData] = None
    muscle_scan: Optional[MuscleScanData] = None
    strength_profile: Optional[List[StrengthProfileEntry]] = None
    feedback_summary: Optional[FeedbackSummary] = None


class MLWorkoutRequest(BaseModel):
    """Request payload matching C# MLWorkoutRequest."""
    user_id: int
    fitness_level: str = "Beginner"
    goal: str = "Muscle"
    days_per_week: int = 4
    equipment: List[str] = Field(default_factory=list)
    injuries: List[str] = Field(default_factory=list)
    user_context: Optional[UserContext] = None


class MLWorkoutResponse(BaseModel):
    """Response payload matching C# MLWorkoutResponse."""
    plan: Optional[Dict[str, Any]] = None
    is_valid_json: bool = False
    model_version: str = MODEL_VERSION
    generation_latency_ms: int = 0
    prompt_used: Optional[str] = None
    error: Optional[str] = None


class MLHealthResponse(BaseModel):
    """Health check response."""
    status: str
    model_version: str = MODEL_VERSION
    device: str = DEVICE
    timestamp: str = ""


# ══════════════════════════════════════════════════════════════════════════════
# PROMPT BUILDER
# ══════════════════════════════════════════════════════════════════════════════

def build_prompt(req: MLWorkoutRequest) -> str:
    """Build a natural language prompt from the structured request."""
    prompt_parts = [
        f"Generate a {req.days_per_week}-day workout plan for a {req.fitness_level.lower()} level person",
        f"with the goal of {req.goal.lower()}.",
    ]

    if req.equipment:
        prompt_parts.append(f"Available equipment: {', '.join(req.equipment)}.")
    else:
        prompt_parts.append("Full gym access with all equipment.")

    if req.injuries:
        prompt_parts.append(f"Avoid exercises that stress: {', '.join(req.injuries)}.")

    if req.user_context:
        ctx = req.user_context
        if ctx.inbody_data:
            if ctx.inbody_data.body_fat_percent:
                prompt_parts.append(f"Body fat: {ctx.inbody_data.body_fat_percent}%.")
            if ctx.inbody_data.muscle_mass_kg:
                prompt_parts.append(f"Muscle mass: {ctx.inbody_data.muscle_mass_kg}kg.")
        if ctx.muscle_scan:
            if ctx.muscle_scan.weak_areas:
                prompt_parts.append(f"Focus on weak areas: {', '.join(ctx.muscle_scan.weak_areas)}.")
            if ctx.muscle_scan.strong_areas:
                prompt_parts.append(f"Well-developed: {', '.join(ctx.muscle_scan.strong_areas)}.")

    prompt_parts.append(
        "Output valid JSON with plan_name, days array (each with day_name, focus_areas, "
        "exercises with name, sets, reps, rest)."
    )

    return " ".join(prompt_parts)


# ══════════════════════════════════════════════════════════════════════════════
# OUTPUT PARSER (same logic as local workout_api.py)
# ══════════════════════════════════════════════════════════════════════════════

def extract_workout_from_model_output(
    text: str, req_days: int = 4, req_goal: str = "Muscle", req_level: str = "Intermediate"
) -> Dict[str, Any]:
    """Extract workout data from ML model output using regex patterns."""

    plan_name_match = re.search(r'"plan_name":\s*"([^"]+)"', text)
    plan_name = plan_name_match.group(1) if plan_name_match else f"AI {req_goal} Plan"

    exercises_data = []
    exercise_pattern = (
        r'"name":\s*"([^"]+)".*?"sets":\s*"?(\d+)"?.*?'
        r'"reps":\s*"([^"]+)".*?"rest":\s*"([^"]+)"'
    )

    for match in re.finditer(exercise_pattern, text):
        exercise: Dict[str, Any] = {
            "name": match.group(1),
            "sets": match.group(2),
            "reps": match.group(3),
            "rest": match.group(4),
        }

        search_start = match.start()
        next_name_match = text.find('"name":', match.end())
        search_end = next_name_match if next_name_match > 0 else min(len(text), match.start() + 500)
        search_window = text[search_start:search_end]

        muscles_match = re.search(r'"target_muscles":\s*\[([^\]]+)\]', search_window)
        if muscles_match:
            exercise["target_muscles"] = re.findall(r'"([^"]+)"', muscles_match.group(1))

        equipment_match = re.search(r'"equipment":\s*"([^"]+)"', search_window)
        if equipment_match:
            exercise["equipment"] = equipment_match.group(1)

        notes_match = re.search(r'"notes":\s*"([^"]+)"', search_window)
        if notes_match:
            exercise["notes"] = notes_match.group(1)

        exercises_data.append(exercise)

    log.info(f"Extracted {len(exercises_data)} exercises from model output")

    # Extract day information
    days_data = []
    day_pattern = r'"day_number":\s*(\d+).*?"day_name":\s*"([^"]+)".*?"focus_areas":\s*\[([^\]]+)\]'
    day_matches = list(re.finditer(day_pattern, text))

    if day_matches:
        for i, match in enumerate(day_matches):
            day_number = int(match.group(1))
            day_name = match.group(2)
            focus_areas = re.findall(r'"([^"]+)"', match.group(3))

            start_pos = match.end()
            end_pos = day_matches[i + 1].start() if i + 1 < len(day_matches) else len(text)
            day_text = text[start_pos:end_pos]

            day_exercises = []
            for ex_match in re.finditer(exercise_pattern, day_text):
                day_exercises.append({
                    "name": ex_match.group(1),
                    "sets": ex_match.group(2),
                    "reps": ex_match.group(3),
                    "rest": ex_match.group(4),
                })

            days_data.append({
                "day_number": day_number,
                "day_name": day_name,
                "focus_areas": focus_areas,
                "exercises": day_exercises if day_exercises else exercises_data[i * 3:(i + 1) * 3],
            })
    else:
        # Fallback: distribute exercises across days
        exercises_per_day = max(4, len(exercises_data) // req_days) if exercises_data else 4
        day_templates = {
            3: [("Push Day", ["chest", "shoulders", "triceps"]),
                ("Pull Day", ["back", "biceps"]),
                ("Leg Day", ["quads", "hamstrings", "glutes"])],
            4: [("Upper Push", ["chest", "shoulders", "triceps"]),
                ("Lower", ["quads", "hamstrings", "glutes"]),
                ("Upper Pull", ["back", "biceps"]),
                ("Full Body", ["core", "cardio"])],
            5: [("Chest", ["chest"]), ("Back", ["back"]),
                ("Shoulders", ["shoulders"]), ("Legs", ["quads", "hamstrings"]),
                ("Arms", ["biceps", "triceps"])],
            6: [("Push A", ["chest", "triceps"]), ("Pull A", ["back", "biceps"]),
                ("Legs A", ["quads", "calves"]), ("Push B", ["shoulders", "triceps"]),
                ("Pull B", ["back", "rear delts"]), ("Legs B", ["hamstrings", "glutes"])],
        }
        templates = day_templates.get(req_days, day_templates[4])
        for i in range(req_days):
            template = templates[i % len(templates)]
            start_idx = i * exercises_per_day
            end_idx = start_idx + exercises_per_day
            days_data.append({
                "day_number": i + 1,
                "day_name": f"Day {i + 1}: {template[0]}",
                "focus_areas": template[1],
                "exercises": exercises_data[start_idx:end_idx] if exercises_data else [],
            })

    plan = {
        "plan_name": plan_name,
        "fitness_level": req_level,
        "goal": req_goal,
        "days_per_week": req_days,
        "program_duration_weeks": 8,
        "days": days_data,
        "notes": "Generated by AI — exercises extracted from model output",
    }

    duration_match = re.search(r'"program_duration_weeks":\s*(\d+)', text)
    if duration_match:
        plan["program_duration_weeks"] = int(duration_match.group(1))

    return plan


# ══════════════════════════════════════════════════════════════════════════════
# INJURY SAFETY FILTER
# ══════════════════════════════════════════════════════════════════════════════

INJURY_EXERCISE_BLACKLIST: Dict[str, List[str]] = {
    "Lower Back": [
        "deadlift", "romanian deadlift", "good morning", "barbell row",
        "bent over row", "back squat", "front squat", "clean", "snatch",
        "hyperextension", "sit-up", "situp", "crunch", "kettlebell swing",
    ],
    "Shoulder": [
        "overhead press", "military press", "shoulder press", "arnold press",
        "upright row", "lateral raise", "front raise", "dumbbell fly",
        "bench press", "incline press", "dip", "snatch",
    ],
    "Knee": [
        "squat", "back squat", "front squat", "goblet squat", "leg press",
        "lunge", "walking lunge", "leg extension", "box jump", "jump squat",
        "pistol squat", "step up", "hack squat", "running", "sprint",
    ],
    "Wrist": [
        "barbell curl", "wrist curl", "reverse curl", "clean", "front squat",
        "push-up", "pushup", "bench press", "overhead press", "farmer walk",
    ],
    "Elbow": [
        "skull crusher", "french press", "tricep extension", "close grip bench",
        "preacher curl", "barbell curl", "dip", "chin-up", "pull-up",
    ],
    "Hip": [
        "squat", "deadlift", "sumo deadlift", "lunge", "hip thrust",
        "bulgarian split squat", "leg press", "good morning", "kettlebell swing",
        "running", "sprint", "box jump",
    ],
    "Ankle": [
        "squat", "lunge", "calf raise", "box jump", "jump squat",
        "jump rope", "running", "sprint", "burpee", "step up", "pistol squat",
    ],
}

INJURY_SAFE_REPLACEMENTS: Dict[str, Dict[str, List[Dict[str, str]]]] = {
    "Lower Back": {
        "back": [
            {"name": "Lat Pulldown", "sets": "3", "reps": "10-12", "rest": "60s"},
            {"name": "Seated Cable Row", "sets": "3", "reps": "10-12", "rest": "60s"},
            {"name": "Chest Supported Dumbbell Row", "sets": "3", "reps": "10-12", "rest": "60s"},
        ],
        "legs": [
            {"name": "Leg Press (Controlled)", "sets": "3", "reps": "10-12", "rest": "90s"},
            {"name": "Leg Curl", "sets": "3", "reps": "10-12", "rest": "60s"},
            {"name": "Leg Extension", "sets": "3", "reps": "12-15", "rest": "60s"},
        ],
    },
    "Shoulder": {
        "chest": [
            {"name": "Cable Crossover (Low-to-High)", "sets": "3", "reps": "12-15", "rest": "60s"},
            {"name": "Floor Press", "sets": "3", "reps": "10-12", "rest": "60s"},
        ],
        "back": [
            {"name": "Lat Pulldown (Neutral Grip)", "sets": "3", "reps": "10-12", "rest": "60s"},
            {"name": "Seated Cable Row", "sets": "3", "reps": "10-12", "rest": "60s"},
        ],
    },
    "Knee": {
        "legs": [
            {"name": "Leg Curl (Hamstrings)", "sets": "3", "reps": "10-12", "rest": "60s"},
            {"name": "Glute Bridge", "sets": "3", "reps": "12-15", "rest": "60s"},
            {"name": "Hip Thrust", "sets": "3", "reps": "10-12", "rest": "60s"},
            {"name": "Seated Calf Raise", "sets": "3", "reps": "15-20", "rest": "45s"},
        ],
    },
}


def filter_exercises_for_injuries(plan: Dict[str, Any], injuries: List[str]) -> Dict[str, Any]:
    """Remove unsafe exercises and replace them with safe alternatives."""
    if not injuries or not plan:
        return plan

    used_names: set = set()
    removed_count = 0
    replaced_count = 0

    for day in plan.get("days", []):
        focus_hint = " ".join(day.get("focus_areas", [])) + " " + day.get("day_name", "")
        safe_exercises = []

        for exercise in day.get("exercises", []):
            ex_name = exercise.get("name", "")
            is_unsafe = False
            triggering_injury = ""

            for injury in injuries:
                blacklist = INJURY_EXERCISE_BLACKLIST.get(injury, [])
                if any(kw.lower() in ex_name.lower() for kw in blacklist):
                    is_unsafe = True
                    triggering_injury = injury
                    break

            if is_unsafe:
                removed_count += 1
                replacements = INJURY_SAFE_REPLACEMENTS.get(triggering_injury, {})
                replacement = None
                for category, exercises in replacements.items():
                    if category in focus_hint.lower():
                        for ex in exercises:
                            if ex["name"] not in used_names:
                                replacement = dict(ex)
                                used_names.add(ex["name"])
                                break
                    if replacement:
                        break
                if not replacement:
                    for category, exercises in replacements.items():
                        for ex in exercises:
                            if ex["name"] not in used_names:
                                replacement = dict(ex)
                                used_names.add(ex["name"])
                                break
                        if replacement:
                            break

                if replacement:
                    replacement["notes"] = f"Replaced '{ex_name}' (unsafe for {triggering_injury} injury)"
                    safe_exercises.append(replacement)
                    replaced_count += 1
                    log.info(f"Replaced '{ex_name}' -> '{replacement['name']}' ({triggering_injury})")
            else:
                safe_exercises.append(exercise)

        day["exercises"] = safe_exercises

    if removed_count > 0:
        existing_notes = plan.get("notes", "")
        plan["notes"] = (
            f"{existing_notes} | {removed_count} exercises filtered for injuries: "
            f"{', '.join(injuries)}. {replaced_count} replaced with safe alternatives."
        )

    return plan


# ══════════════════════════════════════════════════════════════════════════════
# INFERENCE
# ══════════════════════════════════════════════════════════════════════════════

def generate_workout_plan(
    prompt: str,
    req: Optional[MLWorkoutRequest] = None,
    max_length: int = 1024,
) -> tuple:
    """Generate workout plan from prompt. Returns (plan, is_valid, error)."""
    try:
        inputs = tokenizer(
            prompt, return_tensors="pt", max_length=256, truncation=True, padding=True
        ).to(DEVICE)

        with torch.no_grad():
            outputs = model.generate(
                **inputs, max_length=max_length, num_beams=4,
                early_stopping=True, do_sample=False,
            )

        result = tokenizer.decode(outputs[0], skip_special_tokens=True)
        log.info(f"Raw model output ({len(result)} chars): {result[:300]}...")

        # Try direct JSON parse
        try:
            fixed = result.strip()
            if not fixed.startswith("{"):
                fixed = "{" + fixed
            if not fixed.endswith("}"):
                fixed = fixed + "}"
            plan = json.loads(fixed)
            return plan, True, None
        except json.JSONDecodeError:
            pass

        # Hybrid parser fallback
        req_days = req.days_per_week if req else 4
        req_goal = req.goal if req else "Muscle"
        req_level = req.fitness_level if req else "Intermediate"
        plan = extract_workout_from_model_output(result, req_days, req_goal, req_level)

        total_exercises = sum(len(d.get("exercises", [])) for d in plan.get("days", []))
        if total_exercises > 0:
            return plan, True, None
        else:
            return None, False, "Model output could not be parsed into a workout plan"

    except Exception as e:
        log.error(f"Generation error: {e}")
        return None, False, str(e)


# ══════════════════════════════════════════════════════════════════════════════
# FASTAPI APP
# ══════════════════════════════════════════════════════════════════════════════

app = FastAPI(title="IntelliFit Workout Plan Generator", version=MODEL_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/predict", response_model=MLWorkoutResponse)
def predict(req: MLWorkoutRequest) -> MLWorkoutResponse:
    """Generate workout plan — matches C# MLServiceClient contract."""
    start_time = time.time()
    try:
        prompt = build_prompt(req)
        plan, is_valid, error = generate_workout_plan(prompt, req)
        latency_ms = int((time.time() - start_time) * 1000)

        if not is_valid or plan is None:
            return MLWorkoutResponse(
                plan=None, is_valid_json=False, model_version=MODEL_VERSION,
                generation_latency_ms=latency_ms, prompt_used=prompt,
                error=error or "AI model failed to generate a valid workout plan",
            )

        if req.injuries:
            plan = filter_exercises_for_injuries(plan, req.injuries)

        return MLWorkoutResponse(
            plan=plan, is_valid_json=True, model_version=MODEL_VERSION,
            generation_latency_ms=latency_ms, prompt_used=prompt, error=None,
        )
    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        return MLWorkoutResponse(
            plan=None, is_valid_json=False, model_version=MODEL_VERSION,
            generation_latency_ms=latency_ms, prompt_used="", error=str(e),
        )


@app.get("/health", response_model=MLHealthResponse)
def health() -> MLHealthResponse:
    """Health check endpoint."""
    return MLHealthResponse(
        status="healthy", model_version=MODEL_VERSION,
        device=DEVICE, timestamp=datetime.utcnow().isoformat(),
    )


@app.get("/")
def root():
    """Root endpoint for basic status check."""
    return {
        "message": "IntelliFit Workout Plan Generator is running on Hugging Face Spaces!",
        "model_version": MODEL_VERSION,
        "device": DEVICE,
        "endpoints": ["/predict", "/health"],
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
