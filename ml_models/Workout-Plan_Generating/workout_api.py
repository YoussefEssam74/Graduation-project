"""
FastAPI service for the trained workout plan generator model
Matches the C# MLServiceClient expected API contract
"""
import re
import sys
import os

# Fix OMP: Error #15: Initializing libomp.dll, but found libiomp5md.dll already initialized.
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import torch
import json
import time
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from peft import PeftModel

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')  # type: ignore

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(SCRIPT_DIR, "models", "workout-generator-v3")
BASE_MODEL = "google/flan-t5-small"
MODEL_VERSION = "v3.0.0"

print("=" * 60)
print("🏋️ Starting Workout Plan Generator API")
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

app = FastAPI(title="Workout Plan Generator ML Service", version=MODEL_VERSION)


# ============================================================
# Request/Response Models (matching C# DTOs)
# ============================================================

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
    """Request payload matching C# MLWorkoutRequest"""
    user_id: int
    fitness_level: str = "Beginner"
    goal: str = "Muscle"
    days_per_week: int = 4
    equipment: List[str] = Field(default_factory=list)
    injuries: List[str] = Field(default_factory=list)
    user_context: Optional[UserContext] = None


class MLWorkoutResponse(BaseModel):
    """Response payload matching C# MLWorkoutResponse"""
    plan: Optional[Dict[str, Any]] = None
    is_valid_json: bool = False
    model_version: str = MODEL_VERSION
    generation_latency_ms: int = 0
    prompt_used: Optional[str] = None
    error: Optional[str] = None


class MLHealthResponse(BaseModel):
    """Health check response matching C# MLHealthResponse"""
    status: str
    model_version: str = MODEL_VERSION
    device: str = device
    timestamp: str = ""


# ============================================================
# Helper Functions
# ============================================================

def build_prompt(req: MLWorkoutRequest) -> str:
    """Build a natural language prompt from the structured request"""
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
    if req.user_context:
        ctx = req.user_context
        if ctx.inbody_data:
            if ctx.inbody_data.body_fat_percent:
                prompt_parts.append(
                    f"Body fat: {ctx.inbody_data.body_fat_percent}%.")
            if ctx.inbody_data.muscle_mass_kg:
                prompt_parts.append(
                    f"Muscle mass: {ctx.inbody_data.muscle_mass_kg}kg.")

        if ctx.muscle_scan:
            if ctx.muscle_scan.weak_areas:
                prompt_parts.append(
                    f"Focus on weak areas: {', '.join(ctx.muscle_scan.weak_areas)}.")
            if ctx.muscle_scan.strong_areas:
                prompt_parts.append(
                    f"Well-developed: {', '.join(ctx.muscle_scan.strong_areas)}.")

    prompt_parts.append(
        "Output valid JSON with plan_name, days array (each with day_name, focus_areas, exercises with name, sets, reps, rest).")

    return " ".join(prompt_parts)


def extract_workout_from_model_output(text: str, req_days: int = 4, req_goal: str = "Muscle", req_level: str = "Intermediate") -> Dict[str, Any]:
    """
    Extract workout data from ML model output and build a structured plan.
    The model outputs quasi-JSON that we parse with regex patterns.

    IMPORTANT: The model outputs malformed JSON where arrays contain objects 
    without curly braces. Example: "days": ["day_number": 1, "day_name": "..." 
    instead of "days": [{"day_number": 1, "day_name": "..." 
    This is why regex patterns avoid relying on {} boundaries.
    """

    # Extract plan name
    plan_name_match = re.search(r'"plan_name":\s*"([^"]+)"', text)
    plan_name = plan_name_match.group(
        1) if plan_name_match else f"AI {req_goal} Plan"

    # Extract exercises - look for patterns like "name": "Exercise Name"
    exercises_data = []

    # Pattern to match exercise data - model outputs arrays without {} around objects
    exercise_pattern = r'"name":\s*"([^"]+)".*?"sets":\s*"?(\d+)"?.*?"reps":\s*"([^"]+)".*?"rest":\s*"([^"]+)"'

    for match in re.finditer(exercise_pattern, text):
        exercise = {
            "name": match.group(1),
            "sets": match.group(2),
            "reps": match.group(3),
            "rest": match.group(4)
        }

        # Try to extract additional fields if present
        # Look for target_muscles, equipment, notes near this exercise
        # Search forward from match start to next "name" or end of reasonable distance
        search_start = match.start()
        next_name_match = text.find('"name":', match.end())
        search_end = next_name_match if next_name_match > 0 else min(
            len(text), match.start() + 500)
        search_window = text[search_start:search_end]

        muscles_match = re.search(
            r'"target_muscles":\s*\[([^\]]+)\]', search_window)
        if muscles_match:
            muscles = re.findall(r'"([^"]+)"', muscles_match.group(1))
            exercise["target_muscles"] = muscles

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

    # Extract day information - model outputs arrays without {} around objects
    days_data = []
    day_pattern = r'"day_number":\s*(\d+).*?"day_name":\s*"([^"]+)".*?"focus_areas":\s*\[([^\]]+)\]'

    day_matches = list(re.finditer(day_pattern, text))

    if day_matches:
        # We found day structures in the output
        for i, match in enumerate(day_matches):
            day_number = int(match.group(1))
            day_name = match.group(2)
            focus_areas_str = match.group(3)
            focus_areas = re.findall(r'"([^"]+)"', focus_areas_str)

            # Get exercises for this day
            start_pos = match.end()
            end_pos = day_matches[i + 1].start() if i + \
                1 < len(day_matches) else len(text)
            day_text = text[start_pos:end_pos]

            # Try to extract estimated_duration_minutes if present
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

                # Extract additional fields for each exercise in the day
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
                "exercises": day_exercises if day_exercises else exercises_data[i*3:(i+1)*3] if exercises_data else []
            }

            if estimated_duration:
                day_dict["estimated_duration_minutes"] = estimated_duration

            days_data.append(day_dict)
    else:
        # No day structure found, create days from exercises
        # Typical split: distribute exercises across requested days
        exercises_per_day = max(4, len(exercises_data) //
                                req_days) if exercises_data else 4

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

        for i in range(req_days):
            template = templates[i % len(templates)]
            start_idx = i * exercises_per_day
            end_idx = start_idx + exercises_per_day
            day_exercises = exercises_data[start_idx:end_idx] if exercises_data else [
            ]

            days_data.append({
                "day_number": i + 1,
                "day_name": f"Day {i + 1}: {template[0]}",
                "focus_areas": template[1],
                "exercises": day_exercises
            })

    # Build final plan structure
    plan = {
        "plan_name": plan_name,
        "fitness_level": req_level,
        "goal": req_goal,
        "days_per_week": req_days,
        "program_duration_weeks": 8,
        "days": days_data
    }

    # Try to extract program_duration_weeks if present in model output
    duration_match = re.search(r'"program_duration_weeks":\s*(\d+)', text)
    if duration_match:
        plan["program_duration_weeks"] = int(duration_match.group(1))

    # Try to extract notes if present in model output
    notes_match = re.search(r'"notes":\s*"([^"]+)"', text)
    if notes_match:
        plan["notes"] = notes_match.group(1)
    else:
        plan["notes"] = "Generated by AI - exercises extracted from model output"

    # Try to extract progressive_overload if present (may be nested object)
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


def generate_workout_plan(prompt: str, req: 'MLWorkoutRequest' = None, max_length: int = 1024) -> tuple[Dict[str, Any] | None, bool, str | None]:
    """Generate workout plan from prompt. Returns (plan, is_valid, error)"""
    try:
        inputs = tokenizer(
            prompt,
            return_tensors="pt",
            max_length=256,
            truncation=True,
            padding=True
        ).to(device)

        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_length=max_length,
                num_beams=4,
                early_stopping=True,
                do_sample=False
            )

        result = tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Debug: Print what the model generated
        print(f"🤖 Raw model output ({len(result)} chars):")
        print(f"   {result[:500]}..." if len(result) > 500 else f"   {result}")

        # First try standard JSON parsing
        try:
            # Fix basic issues
            fixed = result.strip()
            if not fixed.startswith('{'):
                fixed = '{' + fixed
            if not fixed.endswith('}'):
                fixed = fixed + '}'

            plan = json.loads(fixed)
            print("✅ JSON parsed directly!")
            return plan, True, None
        except json.JSONDecodeError:
            pass

        # Use hybrid parser to extract data from malformed output
        print("🔄 Using hybrid parser to extract workout data...")
        req_days = req.days_per_week if req else 4
        req_goal = req.goal if req else "Muscle"
        req_level = req.fitness_level if req else "Intermediate"

        plan = extract_workout_from_model_output(
            result, req_days, req_goal, req_level)

        # Check if we got any exercises
        total_exercises = sum(len(day.get("exercises", []))
                              for day in plan.get("days", []))
        if total_exercises > 0:
            print(f"✅ Hybrid parser extracted {total_exercises} exercises!")
            return plan, True, None
        else:
            print("⚠️ No exercises extracted from model output")
            return None, False, "Model output could not be parsed into a workout plan"

    except Exception as e:
        print(f"❌ Generation error: {e}")
        return None, False, str(e)


# ============================================================
# API Endpoints
# ============================================================

@app.post("/predict", response_model=MLWorkoutResponse)
def predict(req: MLWorkoutRequest) -> MLWorkoutResponse:
    """
    Generate workout plan from structured request.
    This endpoint matches what the C# MLServiceClient expects.
    Returns an error if the AI model fails to generate a valid plan.
    """
    start_time = time.time()

    try:
        # Build prompt from structured request
        prompt = build_prompt(req)

        # Generate plan using ML model
        plan, is_valid, error = generate_workout_plan(prompt, req)

        # Calculate latency
        latency_ms = int((time.time() - start_time) * 1000)

        if not is_valid or plan is None:
            print(
                f"⚠️ ML model failed to generate valid workout plan. Error: {error}")
            return MLWorkoutResponse(
                plan=None,
                is_valid_json=False,
                model_version=MODEL_VERSION,
                generation_latency_ms=latency_ms,
                prompt_used=prompt,
                error=error or "AI model failed to generate a valid workout plan"
            )

        return MLWorkoutResponse(
            plan=plan,
            is_valid_json=is_valid,
            model_version=MODEL_VERSION,
            generation_latency_ms=latency_ms,
            prompt_used=prompt,
            error=None
        )

    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        return MLWorkoutResponse(
            plan=None,
            is_valid_json=False,
            model_version=MODEL_VERSION,
            generation_latency_ms=latency_ms,
            prompt_used="",
            error=str(e)
        )


@app.get("/health", response_model=MLHealthResponse)
def health() -> MLHealthResponse:
    """Health check endpoint matching C# MLHealthResponse"""
    return MLHealthResponse(
        status="healthy",
        model_version=MODEL_VERSION,
        device=device,
        timestamp=datetime.utcnow().isoformat()
    )


@app.get("/")
def root():
    """Root endpoint for basic status check"""
    return {
        "message": "Workout Plan Generator ML Service is running!",
        "model_version": MODEL_VERSION,
        "device": device,
        "endpoints": ["/predict", "/health", "/generate"]
    }


# Keep the old /generate endpoint for backward compatibility
class WorkoutRequest(BaseModel):
    prompt: str
    max_length: int = 1024
    coach_feedback: Optional[str] = None


@app.post("/generate")
def generate_plan_legacy(req: WorkoutRequest):
    """Legacy endpoint for direct prompt-based generation"""
    start_time = time.time()

    try:
        prompt = req.prompt
        if req.coach_feedback:
            prompt = f"{req.prompt}\n\nIMPORTANT FEEDBACK FROM COACH: {req.coach_feedback}\nPlease adjust the workout plan based on this feedback."

        plan, is_valid, error = generate_workout_plan(
            prompt, None, req.max_length)
        latency_ms = int((time.time() - start_time) * 1000)

        if is_valid:
            return {"success": True, "plan": plan, "latency_ms": latency_ms}
        else:
            return {"success": False, "error": error, "latency_ms": latency_ms}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Uvicorn server on port 5300...")
    uvicorn.run(app, host="0.0.0.0", port=5300)
