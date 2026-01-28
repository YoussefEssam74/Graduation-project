"""
Mock LLM Server - For testing without Flan-T5 model
Provides the same API endpoints as the real LLM server
but returns pre-built workout plans for development and testing.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime

app = Flask(__name__)
CORS(app)

# Pre-built workout plans by goal and fitness level
WORKOUT_TEMPLATES = {
    "beginner_muscle": {
        "plan_name": "Beginner Muscle Builder",
        "duration_weeks": 8,
        "days": [
            {
                "day": 1,
                "focus": "Full Body A",
                "exercises": [
                    {"name": "Goblet Squats", "sets": 3, "reps": 10, "rest_seconds": 90, "notes": "Focus on depth and form"},
                    {"name": "Push-Ups", "sets": 3, "reps": 10, "rest_seconds": 60, "notes": "Modify on knees if needed"},
                    {"name": "Dumbbell Rows", "sets": 3, "reps": 10, "rest_seconds": 60, "notes": "Each arm"},
                    {"name": "Plank", "sets": 3, "reps": 30, "rest_seconds": 45, "notes": "30 seconds hold"}
                ]
            },
            {
                "day": 2,
                "focus": "Full Body B",
                "exercises": [
                    {"name": "Romanian Deadlifts", "sets": 3, "reps": 10, "rest_seconds": 90, "notes": "Light weight, feel the stretch"},
                    {"name": "Dumbbell Bench Press", "sets": 3, "reps": 10, "rest_seconds": 60, "notes": "Control the eccentric"},
                    {"name": "Lat Pulldowns", "sets": 3, "reps": 10, "rest_seconds": 60, "notes": "Full range of motion"},
                    {"name": "Face Pulls", "sets": 3, "reps": 15, "rest_seconds": 45, "notes": "Squeeze shoulder blades"}
                ]
            },
            {
                "day": 3,
                "focus": "Full Body C",
                "exercises": [
                    {"name": "Leg Press", "sets": 3, "reps": 12, "rest_seconds": 90, "notes": "Feet shoulder-width"},
                    {"name": "Incline Dumbbell Press", "sets": 3, "reps": 10, "rest_seconds": 60, "notes": "45 degree angle"},
                    {"name": "Seated Cable Rows", "sets": 3, "reps": 10, "rest_seconds": 60, "notes": "Pull to belly button"},
                    {"name": "Lateral Raises", "sets": 3, "reps": 12, "rest_seconds": 45, "notes": "Light weight, strict form"}
                ]
            }
        ]
    },
    "intermediate_muscle": {
        "plan_name": "Intermediate Hypertrophy",
        "duration_weeks": 12,
        "days": [
            {
                "day": 1,
                "focus": "Push Day",
                "exercises": [
                    {"name": "Barbell Bench Press", "sets": 4, "reps": 8, "rest_seconds": 120, "notes": "Progressive overload"},
                    {"name": "Overhead Press", "sets": 4, "reps": 8, "rest_seconds": 90, "notes": "Strict form"},
                    {"name": "Incline Dumbbell Press", "sets": 3, "reps": 10, "rest_seconds": 60, "notes": "Upper chest focus"},
                    {"name": "Cable Flyes", "sets": 3, "reps": 12, "rest_seconds": 45, "notes": "Squeeze at peak"},
                    {"name": "Tricep Pushdowns", "sets": 3, "reps": 12, "rest_seconds": 45, "notes": "Full extension"}
                ]
            },
            {
                "day": 2,
                "focus": "Pull Day",
                "exercises": [
                    {"name": "Deadlifts", "sets": 4, "reps": 5, "rest_seconds": 180, "notes": "Focus on hip hinge"},
                    {"name": "Pull-Ups", "sets": 4, "reps": 8, "rest_seconds": 90, "notes": "Add weight if possible"},
                    {"name": "Barbell Rows", "sets": 4, "reps": 8, "rest_seconds": 90, "notes": "Slight forward lean"},
                    {"name": "Face Pulls", "sets": 3, "reps": 15, "rest_seconds": 45, "notes": "External rotation"},
                    {"name": "Barbell Curls", "sets": 3, "reps": 10, "rest_seconds": 45, "notes": "No swinging"}
                ]
            },
            {
                "day": 3,
                "focus": "Legs",
                "exercises": [
                    {"name": "Barbell Squats", "sets": 4, "reps": 8, "rest_seconds": 180, "notes": "Below parallel"},
                    {"name": "Romanian Deadlifts", "sets": 4, "reps": 10, "rest_seconds": 90, "notes": "Feel the hamstring stretch"},
                    {"name": "Leg Press", "sets": 3, "reps": 12, "rest_seconds": 90, "notes": "Full range"},
                    {"name": "Leg Curls", "sets": 3, "reps": 12, "rest_seconds": 45, "notes": "Slow eccentric"},
                    {"name": "Calf Raises", "sets": 4, "reps": 15, "rest_seconds": 45, "notes": "Full stretch at bottom"}
                ]
            },
            {
                "day": 4,
                "focus": "Upper Body",
                "exercises": [
                    {"name": "Dumbbell Bench Press", "sets": 4, "reps": 10, "rest_seconds": 90, "notes": "Deep stretch"},
                    {"name": "Weighted Pull-Ups", "sets": 4, "reps": 8, "rest_seconds": 90, "notes": "Controlled tempo"},
                    {"name": "Arnold Press", "sets": 3, "reps": 10, "rest_seconds": 60, "notes": "Full rotation"},
                    {"name": "Cable Rows", "sets": 3, "reps": 12, "rest_seconds": 60, "notes": "Squeeze back"},
                    {"name": "Dips", "sets": 3, "reps": 10, "rest_seconds": 60, "notes": "Lean forward for chest"}
                ]
            }
        ]
    },
    "beginner_weight_loss": {
        "plan_name": "Fat Burning Fundamentals",
        "duration_weeks": 6,
        "days": [
            {
                "day": 1,
                "focus": "Full Body Circuit",
                "exercises": [
                    {"name": "Bodyweight Squats", "sets": 3, "reps": 15, "rest_seconds": 30, "notes": "Keep core tight"},
                    {"name": "Push-Ups", "sets": 3, "reps": 12, "rest_seconds": 30, "notes": "Modify if needed"},
                    {"name": "Walking Lunges", "sets": 3, "reps": 12, "rest_seconds": 30, "notes": "Each leg"},
                    {"name": "Plank Jacks", "sets": 3, "reps": 20, "rest_seconds": 30, "notes": "Maintain plank form"},
                    {"name": "Mountain Climbers", "sets": 3, "reps": 20, "rest_seconds": 60, "notes": "Fast pace"}
                ]
            },
            {
                "day": 2,
                "focus": "Cardio + Core",
                "exercises": [
                    {"name": "Jumping Jacks", "sets": 3, "reps": 30, "rest_seconds": 20, "notes": "Warm up"},
                    {"name": "Burpees", "sets": 3, "reps": 10, "rest_seconds": 45, "notes": "Full range"},
                    {"name": "Bicycle Crunches", "sets": 3, "reps": 20, "rest_seconds": 30, "notes": "Slow and controlled"},
                    {"name": "High Knees", "sets": 3, "reps": 30, "rest_seconds": 30, "notes": "Drive knees up"},
                    {"name": "Russian Twists", "sets": 3, "reps": 20, "rest_seconds": 30, "notes": "Touch floor each side"}
                ]
            },
            {
                "day": 3,
                "focus": "Strength + Cardio",
                "exercises": [
                    {"name": "Goblet Squats", "sets": 3, "reps": 12, "rest_seconds": 45, "notes": "Hold dumbbell at chest"},
                    {"name": "Dumbbell Rows", "sets": 3, "reps": 12, "rest_seconds": 45, "notes": "Each arm"},
                    {"name": "Step-Ups", "sets": 3, "reps": 12, "rest_seconds": 30, "notes": "Alternate legs"},
                    {"name": "Box Jumps", "sets": 3, "reps": 10, "rest_seconds": 60, "notes": "Land softly"},
                    {"name": "Plank Hold", "sets": 3, "reps": 45, "rest_seconds": 30, "notes": "45 seconds"}
                ]
            }
        ]
    }
}

def get_template_key(fitness_level: str, goal: str) -> str:
    """Map fitness level and goal to template key"""
    level = fitness_level.lower()
    goal = goal.lower()
    
    if "muscle" in goal or "strength" in goal:
        if level in ["beginner"]:
            return "beginner_muscle"
        else:
            return "intermediate_muscle"
    elif "weight" in goal or "loss" in goal or "fat" in goal:
        return "beginner_weight_loss"
    else:
        return "beginner_muscle"  # Default

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "server": "mock_llm_server",
        "model": "mock-flan-t5-base",
        "timestamp": datetime.datetime.utcnow().isoformat()
    })

@app.route('/generate', methods=['POST'])
def generate():
    """Generate workout from free-text prompt (mock)"""
    data = request.json if request.json is not None else {}
    prompt = data.get('prompt', '')
    
    # Default to beginner muscle building
    template = WORKOUT_TEMPLATES["beginner_muscle"]
    
    return jsonify({
        "success": True,
        "plan": template,
        "raw_text": f"Generated plan based on prompt: {prompt[:100]}..."
    })

@app.route('/generate-structured', methods=['POST'])
def generate_structured():
    """Generate workout from structured input (mock)"""
    if request.json is None:
        return jsonify({"success": False, "error": "Missing JSON body"}), 400
    
    data = request.json
    fitness_level = data.get('fitness_level', 'Beginner')
    goal = data.get('goal', 'muscle gain')
    days_per_week = data.get('days_per_week', 3)
    injuries = data.get('injuries', [])
    # weak_muscles not currently used, can be used for future personalization
    
    # Get appropriate template
    template_key = get_template_key(fitness_level, goal)
    template = WORKOUT_TEMPLATES.get(template_key, WORKOUT_TEMPLATES["beginner_muscle"]).copy()
    
    # Limit days to requested amount
    template = dict(template)
    template["days"] = template["days"][:days_per_week]
    
    # Add personalization note to plan name
    if injuries:
        template["plan_name"] += f" (Modified for {', '.join(injuries[:2])})"
    
    return jsonify({
        "success": True,
        "plan": template,
        "raw_text": None
    })

if __name__ == '__main__':
    print("=" * 60)
    print("MOCK LLM Server (for development/testing)")
    print("=" * 60)
    print("Endpoints:")
    print("  GET  /health            - Health check")
    print("  POST /generate          - Generate from prompt")
    print("  POST /generate-structured - Generate structured plan")
    print("=" * 60)
    print(f"Available templates: {list(WORKOUT_TEMPLATES.keys())}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5300, debug=True)
