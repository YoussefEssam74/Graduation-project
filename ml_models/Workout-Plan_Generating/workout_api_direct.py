"""
FastAPI service with direct database access for frontend integration
Optimized for performance - frontend calls directly, retrieves user context via RAG
"""
import sys
import os

# Fix OMP: Error #15: Initializing libomp.dll, but found libiomp5md.dll already initialized.
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import torch
import json
import time
import asyncpg
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from peft import PeftModel
import re

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')  # type: ignore

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(SCRIPT_DIR, "models", "workout-generator-v3")
BASE_MODEL = "google/flan-t5-small"
MODEL_VERSION = "v3.0.0-direct"

print("=" * 60)
print("🏋️ Starting Workout Plan Generator API (Direct Mode)")
print("=" * 60)
print(f"📂 Model Directory: {MODEL_DIR}")
print(f"🤖 Base Model: {BASE_MODEL}")
print("⏳ Loading model... (this may take a few moments)")

# Determine device
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"🖥️ Using device: {device}")

try:
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    print("✅ Tokenizer loaded")
    base_model = AutoModelForSeq2SeqLM.from_pretrained(BASE_MODEL)
    print("✅ Base model loaded")
    model = PeftModel.from_pretrained(base_model, MODEL_DIR)
    model = model.to(device)
    print("✅ LoRA adapter loaded")
    model.eval()
    print("✅ Model ready for inference")
    print("=" * 60)
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print(f"❌ Please check that the model files exist in: {MODEL_DIR}")
    raise

app = FastAPI(
    title="Workout Plan Generator ML Service (Direct)",
    version=MODEL_VERSION,
    description="Optimized FastAPI with PostgreSQL RAG for frontend direct calls"
)

# CORS Configuration - Allow frontend to call directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js dev
        "http://localhost:3001",
        "https://your-production-domain.com"  # Update with your production URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection pool
db_pool: Optional[asyncpg.Pool] = None

# Database configuration (from appsettings.Development.json)
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "PulseGym_v1.0.1",
    "user": "postgres",
    "password": "123"
}


# ============================================================
# Database Connection Management
# ============================================================

@app.on_event("startup")
async def startup():
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            database=DB_CONFIG["database"],
            user=DB_CONFIG["user"],
            password=DB_CONFIG["password"],
            min_size=2,
            max_size=10
        )
        print("✅ Database connection pool created")
    except Exception as e:
        print(f"❌ Failed to create database pool: {e}")
        raise


@app.on_event("shutdown")
async def shutdown():
    global db_pool
    if db_pool:
        await db_pool.close()
        print("✅ Database connection pool closed")


# ============================================================
# Request/Response Models
# ============================================================

class DirectWorkoutRequest(BaseModel):
    """Request payload for direct frontend calls"""
    user_id: int
    fitness_level: str = "Beginner"
    goal: str = "Muscle"
    days_per_week: int = 4
    equipment: List[str] = Field(default_factory=list)
    injuries: List[str] = Field(default_factory=list)
    include_user_context: bool = False  # Default to false since tables may not exist


class DirectWorkoutResponse(BaseModel):
    """Response payload for direct frontend calls"""
    plan: Optional[Dict[str, Any]] = None
    is_valid_json: bool = False
    model_version: str = MODEL_VERSION
    generation_latency_ms: int = 0
    user_context_retrieved: bool = False
    error: Optional[str] = None


class SavePlanRequest(BaseModel):
    """Request to save generated plan to backend"""
    user_id: int
    plan: Dict[str, Any]
    generation_latency_ms: int
    model_version: str


# ============================================================
# RAG: User Context Retrieval from Database
# ============================================================

async def retrieve_user_context(user_id: int) -> Dict[str, Any]:
    """
    Retrieve user context from PostgreSQL using RAG pattern
    Returns: Dictionary with InBody, MuscleScan, and StrengthProfile data
    """
    if not db_pool:
        print("⚠️ Database pool not available")
        return {}

    context = {}

    try:
        async with db_pool.acquire() as conn:
            # 1. Get latest InBody measurement
            try:
                inbody_row = await conn.fetchrow("""
                    SELECT "MuscleMass", "BodyFatPercentage", "CreatedAt"
                    FROM "InBodyMeasurements"
                    WHERE "UserId" = $1
                    ORDER BY "CreatedAt" DESC
                    LIMIT 1
                """, user_id)

                if inbody_row:
                    context["inbody_data"] = {
                        "muscle_mass_kg": float(inbody_row["MuscleMass"]) if inbody_row["MuscleMass"] else None,
                        "body_fat_percent": float(inbody_row["BodyFatPercentage"]) if inbody_row["BodyFatPercentage"] else None,
                        "skeletal_muscle_mass": float(inbody_row["MuscleMass"]) if inbody_row["MuscleMass"] else None
                    }
                    print(f"✅ Retrieved InBody data for user {user_id}")
            except Exception as e:
                print(f"⚠️ InBody query failed: {e}")

            # 2. Get latest muscle development scan
            try:
                scan_row = await conn.fetchrow("""
                    SELECT "UnderdevelopedMuscles", "WellDevelopedMuscles", "ScanDate"
                    FROM "MuscleDevelopmentScans"
                    WHERE "UserId" = $1
                    ORDER BY "ScanDate" DESC
                    LIMIT 1
                """, user_id)

                if scan_row:
                    context["muscle_scan"] = {
                        "weak_areas": scan_row["UnderdevelopedMuscles"] if scan_row["UnderdevelopedMuscles"] else [],
                        "strong_areas": scan_row["WellDevelopedMuscles"] if scan_row["WellDevelopedMuscles"] else []
                    }
                    print(f"✅ Retrieved muscle scan for user {user_id}")
            except Exception as e:
                print(f"⚠️ Muscle scan query failed: {e}")

            # 3. Get strength profile (top exercises)
            try:
                strength_rows = await conn.fetch("""
                    SELECT "ExerciseName", "OneRepMax", "ConfidenceScore"
                    FROM "UserStrengthProfiles"
                    WHERE "UserId" = $1
                    ORDER BY "LastUpdated" DESC
                    LIMIT 10
                """, user_id)

                if strength_rows:
                    context["strength_profile"] = [
                        {
                            "exercise": row["ExerciseName"],
                            "one_rep_max": float(row["OneRepMax"]) if row["OneRepMax"] else None,
                            "confidence": float(row["ConfidenceScore"]) if row["ConfidenceScore"] else None
                        }
                        for row in strength_rows
                    ]
                    print(
                        f"✅ Retrieved {len(strength_rows)} strength profiles for user {user_id}")
            except Exception as e:
                print(f"⚠️ Strength profile query failed: {e}")

        return context

    except Exception as e:
        print(f"❌ Error retrieving user context: {e}")
        return {}


def build_prompt_with_context(req: DirectWorkoutRequest, context: Dict[str, Any]) -> str:
    """Build a natural language prompt from the structured request and user context"""
    prompt_parts = [
        f"Generate a {req.days_per_week}-day workout plan for a {req.fitness_level.lower()} level person",
        f"with the goal of {req.goal.lower()}."
    ]

    if req.equipment:
        prompt_parts.append(
            f"Available equipment: {', '.join(req.equipment)}.")
    else:
        prompt_parts.append("Full gym access with all equipment.")

    if req.injuries:
        prompt_parts.append(
            f"Avoid exercises that stress: {', '.join(req.injuries)}.")

    # Add user context if available
    if context:
        if "inbody_data" in context:
            inbody = context["inbody_data"]
            if inbody.get("body_fat_percent"):
                prompt_parts.append(
                    f"Body fat: {inbody['body_fat_percent']}%.")
            if inbody.get("muscle_mass_kg"):
                prompt_parts.append(
                    f"Muscle mass: {inbody['muscle_mass_kg']}kg.")

        if "muscle_scan" in context:
            scan = context["muscle_scan"]
            if scan.get("weak_areas"):
                prompt_parts.append(
                    f"Focus on weak areas: {', '.join(scan['weak_areas'])}.")
            if scan.get("strong_areas"):
                prompt_parts.append(
                    f"Well-developed: {', '.join(scan['strong_areas'])}.")

    prompt_parts.append(
        "Output valid JSON with plan_name, days array (each with day_name, focus_areas, exercises with name, sets, reps, rest).")

    return " ".join(prompt_parts)


# ============================================================
# Exercise Metadata Database (Images + Descriptions)
# ============================================================

EXERCISE_METADATA = {
    # Chest
    "Bench Press": {"description": "Lie on flat bench, lower barbell to chest, press up explosively. King of upper body exercises.", "image": "/api/exercise-images/bench-press.jpg"},
    "Incline Dumbbell Press": {"description": "Press dumbbells on incline bench (30-45°) to target upper chest. Control the descent.", "image": "/api/exercise-images/incline-dumbbell-press.jpg"},
    "Cable Flyes": {"description": "Stand between cable towers, bring handles together in arc motion. Stretch and squeeze.", "image": "/api/exercise-images/cable-flyes.jpg"},
    "Push-Ups": {"description": "Classic bodyweight exercise. Keep core tight, full range of motion, chest to ground.", "image": "/api/exercise-images/push-ups.jpg"},
    "Flat Db Press": {"description": "Dumbbell bench press on flat bench. Greater range of motion than barbell version.", "image": "/api/exercise-images/dumbbell-bench-press.jpg"},
    "Dumbbell Flyes": {"description": "Lie flat, arc dumbbells out and up. Focus on stretch and chest contraction.", "image": "/api/exercise-images/dumbbell-flyes.jpg"},

    # Back
    "Barbell Rows": {"description": "Hinge at hips, pull barbell to lower chest/upper abs. Keep back straight, squeeze lats.", "image": "/api/exercise-images/barbell-rows.jpg"},
    "Lat Pulldown": {"description": "Pull bar down to upper chest, lean back slightly. Focus on pulling with elbows, not hands.", "image": "/api/exercise-images/lat-pulldown.jpg"},
    "Seated Cable Row": {"description": "Sit upright, pull handle to midsection. Squeeze shoulder blades together at peak.", "image": "/api/exercise-images/seated-cable-row.jpg"},
    "Face Pulls": {"description": "Pull rope to face, elbows high. Excellent for rear delts and posture.", "image": "/api/exercise-images/face-pulls.jpg"},
    "Pull-Ups": {"description": "Hang from bar, pull chin over bar. Use full range of motion, control descent.", "image": "/api/exercise-images/pull-ups.jpg"},
    "Dumbbell Rows": {"description": "One arm at a time, brace on bench. Pull dumbbell to hip, squeeze lat at top.", "image": "/api/exercise-images/dumbbell-rows.jpg"},

    # Shoulders
    "Overhead Press": {"description": "Press barbell from shoulders to overhead. Keep core tight, don't lean back excessively.", "image": "/api/exercise-images/overhead-press.jpg"},
    "Lateral Raises": {"description": "Raise dumbbells to sides until parallel to floor. Lead with elbows, slight bend.", "image": "/api/exercise-images/lateral-raises.jpg"},
    "Front Raises": {"description": "Raise dumbbells forward to shoulder height. Alternate or both together.", "image": "/api/exercise-images/front-raises.jpg"},
    "Rear Delt Flyes": {"description": "Bend forward, raise dumbbells to sides. Target rear deltoids, crucial for shoulder health.", "image": "/api/exercise-images/rear-delt-flyes.jpg"},
    "Dumbbell Shoulder Press": {"description": "Press dumbbells overhead from shoulder position. Greater range than barbell.", "image": "/api/exercise-images/dumbbell-shoulder-press.jpg"},

    # Arms
    "Tricep Pushdown": {"description": "Push cable bar/rope down, extend elbows fully. Keep upper arms stationary.", "image": "/api/exercise-images/tricep-pushdown.jpg"},
    "Overhead Tricep Extension": {"description": "Raise dumbbell overhead, lower behind head. Full stretch, full contraction.", "image": "/api/exercise-images/overhead-tricep-extension.jpg"},
    "Barbell Curls": {"description": "Curl barbell with supinated grip. Don't swing, focus on bicep contraction.", "image": "/api/exercise-images/barbell-curls.jpg"},
    "Hammer Curls": {"description": "Curl dumbbells with neutral grip (thumbs up). Targets brachialis and forearms.", "image": "/api/exercise-images/hammer-curls.jpg"},
    "Dumbbell Curls": {"description": "Classic bicep builder. Curl dumbbells with full supination at top.", "image": "/api/exercise-images/dumbbell-curls.jpg"},

    # Legs
    "Barbell Squat": {"description": "King of leg exercises. Squat deep, drive through heels. Keep chest up, knees out.", "image": "/api/exercise-images/barbell-squat.jpg"},
    "Leg Press": {"description": "Press platform with feet shoulder-width. Control descent, don't lock knees at top.", "image": "/api/exercise-images/leg-press.jpg"},
    "Leg Extension": {"description": "Extend legs against pad. Squeeze quads at top, control the descent.", "image": "/api/exercise-images/leg-extension.jpg"},
    "Romanian Deadlift": {"description": "Hinge at hips, lower bar along shins. Feel hamstring stretch, drive hips forward.", "image": "/api/exercise-images/romanian-deadlift.jpg"},
    "Leg Curl": {"description": "Curl legs against pad. Isolates hamstrings, squeeze at top.", "image": "/api/exercise-images/leg-curl.jpg"},
    "Hip Thrust": {"description": "Thrust hips up with barbell across hips. Best glute builder, squeeze at top.", "image": "/api/exercise-images/hip-thrust.jpg"},
    "Bulgarian Split Squat": {"description": "Rear foot elevated, lunge forward leg. Excellent for glutes and quads.", "image": "/api/exercise-images/bulgarian-split-squat.jpg"},
    "Standing Calf Raises": {"description": "Raise up on toes, lower with control. Full stretch, full contraction.", "image": "/api/exercise-images/standing-calf-raises.jpg"},
    "Goblet Squat": {"description": "Hold dumbbell at chest, squat deep. Great for beginners and mobility.", "image": "/api/exercise-images/goblet-squat.jpg"},
    "Dumbbell Lunges": {"description": "Step forward into lunge, drive back up. Keep torso upright, knee behind toes.", "image": "/api/exercise-images/dumbbell-lunges.jpg"},

    # Core
    "Plank": {"description": "Hold straight line from head to heels. Engage core, don't let hips sag.", "image": "/api/exercise-images/plank.jpg"},
    "Cable Woodchoppers": {"description": "Rotate torso, pull cable diagonally. Great for obliques and rotational power.", "image": "/api/exercise-images/cable-woodchoppers.jpg"},
    "Hanging Leg Raises": {"description": "Hang from bar, raise legs to parallel. Control swing, focus on lower abs.", "image": "/api/exercise-images/hanging-leg-raises.jpg"},

    # Cardio
    "Treadmill HIIT": {"description": "Alternate high intensity sprints with recovery periods. Burns fat, improves conditioning.", "image": "/api/exercise-images/treadmill-hiit.jpg"},

    # Additional exercises
    "Sternal Push-Up": {"description": "Decline push-up variation with chest to ground. Advanced chest exercise.", "image": "/api/exercise-images/sternal-push-up.jpg"},
    "Reverse Pec Deck": {"description": "Face pec deck machine, pull handles back. Isolates rear deltoids.", "image": "/api/exercise-images/reverse-pec-deck.jpg"},
    "Deadlift": {"description": "Lift barbell from ground to standing. Full body power, maintain neutral spine.", "image": "/api/exercise-images/deadlift.jpg"},
}


def enrich_exercise_with_metadata(exercise: dict) -> dict:
    """Add image URL and description to exercise if available in database"""
    name = exercise.get("name", "")
    if name in EXERCISE_METADATA:
        metadata = EXERCISE_METADATA[name]
        exercise["image_url"] = metadata["image"]
        exercise["description"] = metadata["description"]
    else:
        # Fallback for unknown exercises
        exercise["image_url"] = "/api/exercise-images/default-exercise.jpg"
        exercise["description"] = f"Perform {name} with proper form and controlled tempo."
    return exercise


# Import the extraction function from the original workout_api.py
def generate_fallback_exercises(day_name: str, focus_areas: list, fitness_level: str, available_equipment: list = None) -> list:
    """Generate reasonable fallback exercises based on focus areas and available equipment"""
    exercise_db = {
        "chest": [
            {"name": "Bench Press", "sets": "4", "reps": "8-12", "rest": "90 sec",
                "target_muscles": ["chest", "triceps"], "equipment": "Barbell"},
            {"name": "Incline Dumbbell Press", "sets": "3", "reps": "10-12",
                "rest": "60 sec", "target_muscles": ["upper chest"], "equipment": "Dumbbells"},
            {"name": "Cable Flyes", "sets": "3", "reps": "12-15", "rest": "60 sec",
                "target_muscles": ["chest"], "equipment": "Cable Machine"},
            {"name": "Push-Ups", "sets": "3", "reps": "15-20", "rest": "45 sec",
                "target_muscles": ["chest", "triceps"], "equipment": "Bodyweight"},
        ],
        "back": [
            {"name": "Barbell Rows", "sets": "4", "reps": "8-12", "rest": "90 sec",
                "target_muscles": ["back", "biceps"], "equipment": "Barbell"},
            {"name": "Lat Pulldown", "sets": "3", "reps": "10-12", "rest": "60 sec",
                "target_muscles": ["lats"], "equipment": "Cable Machine"},
            {"name": "Seated Cable Row", "sets": "3", "reps": "10-12", "rest": "60 sec",
                "target_muscles": ["back"], "equipment": "Cable Machine"},
            {"name": "Face Pulls", "sets": "3", "reps": "15-20", "rest": "45 sec",
                "target_muscles": ["rear delts", "upper back"], "equipment": "Cable Machine"},
        ],
        "shoulders": [
            {"name": "Overhead Press", "sets": "4", "reps": "8-10", "rest": "90 sec",
                "target_muscles": ["shoulders"], "equipment": "Barbell"},
            {"name": "Lateral Raises", "sets": "3", "reps": "12-15", "rest": "45 sec",
                "target_muscles": ["side delts"], "equipment": "Dumbbells"},
            {"name": "Front Raises", "sets": "3", "reps": "12-15", "rest": "45 sec",
                "target_muscles": ["front delts"], "equipment": "Dumbbells"},
            {"name": "Rear Delt Flyes", "sets": "3", "reps": "15", "rest": "45 sec",
                "target_muscles": ["rear delts"], "equipment": "Dumbbells"},
        ],
        "triceps": [
            {"name": "Tricep Pushdown", "sets": "3", "reps": "12-15", "rest": "45 sec",
                "target_muscles": ["triceps"], "equipment": "Cable Machine"},
            {"name": "Overhead Tricep Extension", "sets": "3", "reps": "10-12",
                "rest": "60 sec", "target_muscles": ["triceps"], "equipment": "Dumbbells"},
        ],
        "biceps": [
            {"name": "Barbell Curls", "sets": "3", "reps": "10-12", "rest": "60 sec",
                "target_muscles": ["biceps"], "equipment": "Barbell"},
            {"name": "Hammer Curls", "sets": "3", "reps": "10-12", "rest": "45 sec",
                "target_muscles": ["biceps", "forearms"], "equipment": "Dumbbells"},
        ],
        "quads": [
            {"name": "Barbell Squat", "sets": "4", "reps": "8-12", "rest": "120 sec",
                "target_muscles": ["quads", "glutes"], "equipment": "Barbell"},
            {"name": "Leg Press", "sets": "3", "reps": "10-12", "rest": "90 sec",
                "target_muscles": ["quads"], "equipment": "Machine"},
            {"name": "Leg Extension", "sets": "3", "reps": "12-15",
                "rest": "60 sec", "target_muscles": ["quads"], "equipment": "Machine"},
        ],
        "hamstrings": [
            {"name": "Romanian Deadlift", "sets": "4", "reps": "8-12", "rest": "90 sec",
                "target_muscles": ["hamstrings", "glutes"], "equipment": "Barbell"},
            {"name": "Leg Curl", "sets": "3", "reps": "10-12", "rest": "60 sec",
                "target_muscles": ["hamstrings"], "equipment": "Machine"},
        ],
        "glutes": [
            {"name": "Hip Thrust", "sets": "4", "reps": "10-12", "rest": "90 sec",
                "target_muscles": ["glutes"], "equipment": "Barbell"},
            {"name": "Bulgarian Split Squat", "sets": "3", "reps": "10-12", "rest": "60 sec",
                "target_muscles": ["glutes", "quads"], "equipment": "Dumbbells"},
        ],
        "calves": [
            {"name": "Standing Calf Raises", "sets": "4", "reps": "15-20",
                "rest": "45 sec", "target_muscles": ["calves"], "equipment": "Machine"},
        ],
        "core": [
            {"name": "Plank", "sets": "3", "reps": "30-60 sec", "rest": "30 sec",
                "target_muscles": ["core"], "equipment": "Bodyweight"},
            {"name": "Cable Woodchoppers", "sets": "3", "reps": "12-15", "rest": "45 sec",
                "target_muscles": ["obliques", "core"], "equipment": "Cable Machine"},
            {"name": "Hanging Leg Raises", "sets": "3", "reps": "10-15", "rest": "45 sec",
                "target_muscles": ["lower abs"], "equipment": "Pull-up Bar"},
        ],
        "cardio": [
            {"name": "Treadmill HIIT", "sets": "1", "reps": "20 min", "rest": "N/A",
                "target_muscles": ["cardiovascular"], "equipment": "Treadmill"},
        ],
        "rear delts": [
            {"name": "Face Pulls", "sets": "3", "reps": "15-20", "rest": "45 sec",
                "target_muscles": ["rear delts"], "equipment": "Cable Machine"},
            {"name": "Reverse Pec Deck", "sets": "3", "reps": "12-15", "rest": "45 sec",
                "target_muscles": ["rear delts"], "equipment": "Machine"},
        ],
    }

    exercises = []
    seen_names = set()

    # Normalize equipment list for matching
    if available_equipment:
        available_equipment_lower = [eq.lower() for eq in available_equipment]
    else:
        available_equipment_lower = None

    for muscle in focus_areas:
        muscle_lower = muscle.lower().strip()
        if muscle_lower in exercise_db:
            for ex in exercise_db[muscle_lower]:
                # Filter by equipment if specified
                if available_equipment_lower:
                    ex_equipment = ex["equipment"].lower()
                    # Check if exercise equipment matches any available equipment
                    equipment_match = False
                    for avail_eq in available_equipment_lower:
                        if avail_eq in ex_equipment or ex_equipment in avail_eq or ex_equipment == "bodyweight":
                            equipment_match = True
                            break
                    if not equipment_match:
                        continue  # Skip this exercise

                if ex["name"] not in seen_names:
                    exercises.append(ex.copy())
                    seen_names.add(ex["name"])

    # If still empty, give generic exercises that match equipment
    if not exercises:
        if available_equipment_lower and "dumbbell" in " ".join(available_equipment_lower).lower():
            exercises = [
                {"name": "Goblet Squat", "sets": "4", "reps": "10-12", "rest": "90 sec",
                    "target_muscles": ["quads", "glutes"], "equipment": "Dumbbells"},
                {"name": "Dumbbell Bench Press", "sets": "4", "reps": "8-12",
                    "rest": "90 sec", "target_muscles": ["chest"], "equipment": "Dumbbells"},
                {"name": "Dumbbell Rows", "sets": "4", "reps": "8-12", "rest": "90 sec",
                    "target_muscles": ["back"], "equipment": "Dumbbells"},
                {"name": "Dumbbell Shoulder Press", "sets": "3", "reps": "8-10",
                    "rest": "90 sec", "target_muscles": ["shoulders"], "equipment": "Dumbbells"},
            ]
        elif not available_equipment_lower:  # No equipment restriction
            exercises = [
                {"name": "Barbell Squat", "sets": "4", "reps": "8-12", "rest": "120 sec",
                    "target_muscles": ["quads", "glutes"], "equipment": "Barbell"},
                {"name": "Bench Press", "sets": "4", "reps": "8-12", "rest": "90 sec",
                    "target_muscles": ["chest", "triceps"], "equipment": "Barbell"},
                {"name": "Barbell Rows", "sets": "4", "reps": "8-12", "rest": "90 sec",
                    "target_muscles": ["back", "biceps"], "equipment": "Barbell"},
                {"name": "Overhead Press", "sets": "3", "reps": "8-10", "rest": "90 sec",
                    "target_muscles": ["shoulders"], "equipment": "Barbell"},
            ]
        else:  # Equipment specified but no matches - use bodyweight
            exercises = [
                {"name": "Push-Ups", "sets": "4", "reps": "15-20", "rest": "60 sec",
                    "target_muscles": ["chest", "triceps"], "equipment": "Bodyweight"},
                {"name": "Pull-Ups", "sets": "3", "reps": "8-12", "rest": "90 sec",
                    "target_muscles": ["back", "biceps"], "equipment": "Bodyweight"},
                {"name": "Bodyweight Squats", "sets": "4", "reps": "20", "rest": "60 sec",
                    "target_muscles": ["quads", "glutes"], "equipment": "Bodyweight"},
            ]

    # Enrich with metadata (images and descriptions)
    exercises = [enrich_exercise_with_metadata(ex) for ex in exercises]

    # Limit to reasonable count (4-6 exercises per day)
    return exercises[:6]


def extract_workout_from_model_output(text: str, req_days: int = 4, req_goal: str = "Muscle", req_level: str = "Intermediate", req_equipment: List[str] = None) -> Dict[str, Any]:
    """
    Extract workout data from ML model output and build a structured plan.
    Filters exercises by available equipment and enriches with images/descriptions.
    """
    plan_name_match = re.search(r'"plan_name":\s*"([^"]+)"', text)
    plan_name = plan_name_match.group(
        1) if plan_name_match else f"AI {req_goal} Plan"

    exercises_data = []
    exercise_pattern = r'"name":\s*"([^"]+)".*?"sets":\s*"?(\d+)"?.*?"reps":\s*"([^"]+)".*?"rest":\s*"([^"]+)"'

    for match in re.finditer(exercise_pattern, text):
        exercise = {
            "name": match.group(1),
            "sets": match.group(2),
            "reps": match.group(3),
            "rest": match.group(4)
        }

        search_start = match.start()
        next_name_match = text.find('"name":', match.end())
        search_end = next_name_match if next_name_match > 0 else min(
            len(text), match.start() + 500)
        search_window = text[search_start:search_end]

        muscles_match = re.search(
            r'"target_muscles":\s*\[([^\]]+)\]', search_window)
        if muscles_match:
            exercise["target_muscles"] = re.findall(
                r'"([^"]+)"', muscles_match.group(1))

        equipment_match = re.search(r'"equipment":\s*"([^"]+)"', search_window)
        if equipment_match:
            exercise["equipment"] = equipment_match.group(1)

        notes_match = re.search(r'"notes":\s*"([^"]+)"', search_window)
        if notes_match:
            exercise["notes"] = notes_match.group(1)

        movement_match = re.search(
            r'"movement_pattern":\s*"([^"]+)"', search_window)
        if movement_match:
            exercise["movement_pattern"] = movement_match.group(1)

        exercise_type_match = re.search(
            r'"exercise_type":\s*"([^"]+)"', search_window)
        if exercise_type_match:
            exercise["exercise_type"] = exercise_type_match.group(1)

        exercises_data.append(exercise)

    print(f"📊 Extracted {len(exercises_data)} exercises from model output")

    days_data = []
    day_pattern = r'"day_number":\s*(\d+).*?"day_name":\s*"([^"]+)".*?"focus_areas":\s*\[([^\]]+)\]'
    day_matches = list(re.finditer(day_pattern, text))

    # Define day templates for fallback
    day_templates = {
        3: [("Push Day", ["chest", "shoulders", "triceps"]),
            ("Pull Day", ["back", "biceps"]),
            ("Leg Day", ["quads", "hamstrings", "glutes"])],
        4: [("Upper Push", ["chest", "shoulders", "triceps"]),
            ("Lower", ["quads", "hamstrings", "glutes"]),
            ("Upper Pull", ["back", "biceps"]),
            ("Full Body", ["core", "cardio"])],
        5: [("Chest", ["chest"]), ("Back", ["back"]),
            ("Shoulders", ["shoulders"]
             ), ("Legs", ["quads", "hamstrings"]),
            ("Arms", ["biceps", "triceps"])],
        6: [("Push A", ["chest", "triceps"]), ("Pull A", ["back", "biceps"]),
            ("Legs A", ["quads", "calves"]
             ), ("Push B", ["shoulders", "triceps"]),
            ("Pull B", ["back", "rear delts"]), ("Legs B", ["hamstrings", "glutes"])]
    }
    templates = day_templates.get(req_days, day_templates[4])

    if day_matches:
        # Extract days found in model output
        for i, match in enumerate(day_matches):
            day_number = int(match.group(1))
            day_name = match.group(2)
            focus_areas_str = match.group(3)
            focus_areas = re.findall(r'"([^"]+)"', focus_areas_str)

            start_pos = match.end()
            end_pos = day_matches[i + 1].start() if i + \
                1 < len(day_matches) else len(text)
            day_text = text[start_pos:end_pos]

            duration_match = re.search(
                r'"estimated_duration_minutes":\s*(\d+)', day_text)
            estimated_duration = int(
                duration_match.group(1)) if duration_match else None

            day_exercises = []
            for ex_match in re.finditer(exercise_pattern, day_text):
                exercise = {
                    "name": ex_match.group(1),
                    "sets": ex_match.group(2),
                    "reps": ex_match.group(3),
                    "rest": ex_match.group(4)
                }

                ex_start = ex_match.start()
                next_ex = day_text.find('"name":', ex_match.end())
                ex_end = next_ex if next_ex > 0 else len(day_text)
                ex_window = day_text[ex_start:ex_end]

                muscles_match = re.search(
                    r'"target_muscles":\s*\[([^\]]+)\]', ex_window)
                if muscles_match:
                    exercise["target_muscles"] = re.findall(
                        r'"([^"]+)"', muscles_match.group(1))

                equipment_match = re.search(
                    r'"equipment":\s*"([^"]+)"', ex_window)
                if equipment_match:
                    exercise["equipment"] = equipment_match.group(1)

                notes_match = re.search(r'"notes":\s*"([^"]+)"', ex_window)
                if notes_match:
                    exercise["notes"] = notes_match.group(1)

                movement_match = re.search(
                    r'"movement_pattern":\s*"([^"]+)"', ex_window)
                if movement_match:
                    exercise["movement_pattern"] = movement_match.group(1)

                exercise_type_match = re.search(
                    r'"exercise_type":\s*"([^"]+)"', ex_window)
                if exercise_type_match:
                    exercise["exercise_type"] = exercise_type_match.group(1)

                day_exercises.append(exercise)

            day_dict = {
                "day_number": day_number,
                "day_name": day_name,
                "focus_areas": focus_areas,
                "focus": ", ".join(focus_areas) if focus_areas else "General",
                "exercises": day_exercises if day_exercises else exercises_data[i*3:(i+1)*3] if exercises_data else generate_fallback_exercises(day_name, focus_areas, req_level, req_equipment)
            }

            if estimated_duration:
                day_dict["estimated_duration_minutes"] = estimated_duration

            days_data.append(day_dict)

        # CRITICAL FIX: If model didn't generate enough days, fill remaining with templates
        if len(days_data) < req_days:
            print(
                f"⚠️ Model only generated {len(days_data)} days, filling {req_days - len(days_data)} missing days with templates")

            # Collect exercises already assigned to existing days
            assigned_exercise_names = set()
            for day in days_data:
                for ex in day.get("exercises", []):
                    assigned_exercise_names.add(ex.get("name", ""))

            # Get unassigned exercises
            unassigned = [ex for ex in exercises_data if ex.get(
                "name", "") not in assigned_exercise_names]
            exercises_per_day = max(
                3, len(unassigned) // (req_days - len(days_data))) if unassigned else 0

            for i in range(len(days_data), req_days):
                template = templates[i % len(templates)]

                # Distribute unassigned exercises
                idx_offset = (i - len(days_data)) * exercises_per_day
                day_exercises = unassigned[idx_offset:idx_offset +
                                           exercises_per_day] if unassigned else []

                # If still empty, generate fallback exercises based on template focus
                if not day_exercises:
                    day_exercises = generate_fallback_exercises(
                        template[0], template[1], req_level, req_equipment)

                days_data.append({
                    "day_number": i + 1,
                    "day_name": f"Day {i + 1}: {template[0]}",
                    "focus_areas": template[1],
                    "focus": ", ".join(template[1]),
                    "exercises": day_exercises
                })
    else:
        # Model output had no explicit day structures - use template fallback for ALL days
        print(
            f"📋 No day structures found in model output, using templates for all {req_days} days")
        exercises_per_day = max(4, len(exercises_data) //
                                req_days) if exercises_data else 0

        for i in range(req_days):
            template = templates[i % len(templates)]
            start_idx = i * exercises_per_day
            end_idx = start_idx + exercises_per_day
            day_exercises = exercises_data[start_idx:end_idx] if exercises_data else [
            ]

            # If no exercises from model, generate fallback
            if not day_exercises:
                day_exercises = generate_fallback_exercises(
                    template[0], template[1], req_level, req_equipment)

            days_data.append({
                "day_number": i + 1,
                "day_name": f"Day {i + 1}: {template[0]}",
                "focus_areas": template[1],
                "focus": ", ".join(template[1]),
                "exercises": day_exercises
            })

    # Filter exercises by equipment and enrich with metadata
    if req_equipment:
        equipment_lower = [eq.lower() for eq in req_equipment]
        for day in days_data:
            filtered_exercises = []
            for ex in day.get("exercises", []):
                ex_equipment = ex.get("equipment", "").lower()
                # Check equipment match
                if ex_equipment == "bodyweight" or any(eq in ex_equipment or ex_equipment in eq for eq in equipment_lower):
                    filtered_exercises.append(
                        enrich_exercise_with_metadata(ex))
            day["exercises"] = filtered_exercises
    else:
        # No equipment filter, just enrich with metadata
        for day in days_data:
            day["exercises"] = [enrich_exercise_with_metadata(
                ex) for ex in day.get("exercises", [])]

    plan = {
        "plan_name": plan_name,
        "fitness_level": req_level,
        "goal": req_goal,
        "days_per_week": req_days,
        "program_duration_weeks": 8,
        "days": days_data
    }

    duration_match = re.search(r'"program_duration_weeks":\s*(\d+)', text)
    if duration_match:
        plan["program_duration_weeks"] = int(duration_match.group(1))

    notes_match = re.search(r'"notes":\s*"([^"]+)"', text)
    if notes_match:
        plan["notes"] = notes_match.group(1)
    else:
        plan["notes"] = "Generated by AI with user context"

    prog_overload_match = re.search(
        r'"progressive_overload":\s*\{([^}]+)\}', text)
    if prog_overload_match:
        prog_obj = {}
        prog_content = prog_overload_match.group(1)

        prog_type_match = re.search(r'"type":\s*"([^"]+)"', prog_content)
        if prog_type_match:
            prog_obj["type"] = prog_type_match.group(1)

        prog_progression_match = re.search(
            r'"progression":\s*"([^"]+)"', prog_content)
        if prog_progression_match:
            prog_obj["progression"] = prog_progression_match.group(1)

        prog_deload_match = re.search(r'"deload":\s*"([^"]+)"', prog_content)
        if prog_deload_match:
            prog_obj["deload"] = prog_deload_match.group(1)

        if prog_obj:
            plan["progressive_overload"] = prog_obj

    return plan


async def generate_workout_plan_direct(prompt: str, req_days: int, req_goal: str, req_level: str, req_equipment: List[str] = None) -> tuple[Dict[str, Any] | None, bool, str | None]:
    """Generate workout plan from prompt (async version for direct calls)"""
    try:
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            max_length=512,  # Increased from 256
            truncation=True,
            padding=True
        ).to(device)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_length=2048,  # Increased from 1024 to allow longer plans
                num_beams=4,
                early_stopping=True,
                do_sample=False
            )

        result = tokenizer.decode(outputs[0], skip_special_tokens=True)

        print(f"🤖 Raw model output ({len(result)} chars):")
        print(f"   {result[:500]}...")  # Show first 500 chars for debugging

        # Try standard JSON parsing first
        try:
            fixed = result.strip()
            if not fixed.startswith('{'):
                fixed = '{' + fixed
            if not fixed.endswith('}'):
                fixed = fixed + '}'

            plan = json.loads(fixed)
            print("✅ JSON parsed directly!")
            return plan, True, None
        except json.JSONDecodeError as e:
            print(f"⚠️ Direct JSON parsing failed: {e}")
            pass

        # Use hybrid parser
        print("🔄 Using hybrid parser to extract workout data...")
        plan = extract_workout_from_model_output(
            result, req_days, req_goal, req_level, req_equipment)

        total_exercises = sum(len(day.get("exercises", []))
                              for day in plan.get("days", []))
        if total_exercises > 0:
            print(f"✅ Hybrid parser extracted {total_exercises} exercises!")
            return plan, True, None
        else:
            print("⚠️ No exercises extracted from model output")
            print(f"   Model output snippet: {result[:1000]}")
            return None, False, "Model output could not be parsed into a workout plan"

    except Exception as e:
        print(f"❌ Generation error: {e}")
        return None, False, str(e)


# ============================================================
# API Endpoints
# ============================================================

@app.post("/generate-direct", response_model=DirectWorkoutResponse)
async def generate_direct(req: DirectWorkoutRequest) -> DirectWorkoutResponse:
    """
    Direct generation endpoint for frontend calls - includes RAG user context retrieval
    This is the OPTIMIZED endpoint that frontend should use directly
    """
    start_time = time.time()
    user_context_retrieved = False

    try:
        # 1. Retrieve user context from database (RAG pattern)
        user_context = {}
        if req.include_user_context:
            user_context = await retrieve_user_context(req.user_id)
            user_context_retrieved = len(user_context) > 0
            print(f"📊 User context retrieved: {user_context_retrieved}")

        # 2. Build prompt with user context
        prompt = build_prompt_with_context(req, user_context)
        print(f"📝 Prompt: {prompt[:200]}...")

        # 3. Generate plan using ML model
        plan, is_valid, error = await generate_workout_plan_direct(
            prompt,
            req.days_per_week,
            req.goal,
            req.fitness_level,
            req.equipment
        )

        # 4. Calculate latency
        latency_ms = int((time.time() - start_time) * 1000)

        if not is_valid or plan is None:
            print(
                f"⚠️ ML model failed to generate valid workout plan. Error: {error}")
            return DirectWorkoutResponse(
                plan=None,
                is_valid_json=False,
                model_version=MODEL_VERSION,
                generation_latency_ms=latency_ms,
                user_context_retrieved=user_context_retrieved,
                error=error or "AI model failed to generate a valid workout plan"
            )

        print(f"✅ Plan generated successfully in {latency_ms}ms")

        return DirectWorkoutResponse(
            plan=plan,
            is_valid_json=is_valid,
            model_version=MODEL_VERSION,
            generation_latency_ms=latency_ms,
            user_context_retrieved=user_context_retrieved,
            error=None
        )

    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        print(f"❌ Error in generate_direct: {e}")
        return DirectWorkoutResponse(
            plan=None,
            is_valid_json=False,
            model_version=MODEL_VERSION,
            generation_latency_ms=latency_ms,
            user_context_retrieved=user_context_retrieved,
            error=str(e)
        )


@app.get("/health")
def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_version": MODEL_VERSION,
        "device": device,
        "database_connected": db_pool is not None,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/")
def root():
    """Root endpoint for basic status check"""
    return {
        "message": "Workout Plan Generator ML Service (Direct Mode) is running!",
        "model_version": MODEL_VERSION,
        "device": device,
        "endpoints": ["/generate-direct", "/health"],
        "optimization": "Frontend → FastAPI (direct) → PostgreSQL (RAG) → ML Model"
    }


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Uvicorn server on port 5301 (direct mode)...")
    print("📡 CORS enabled for frontend direct calls")
    print("🗄️ PostgreSQL RAG enabled for user context retrieval")
    uvicorn.run(app, host="0.0.0.0", port=5301)
