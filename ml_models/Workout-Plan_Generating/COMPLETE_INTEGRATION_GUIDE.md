# Complete Workout AI Integration Guide

**Last Updated**: February 1, 2026  
**Status**: Implementation Ready  
**Tech Stack**: C# Backend + Python Flan-T5 + PostgreSQL + Redis

---

## 🎯 Overview

This guide shows **EXACTLY** how all components connect for the complete AI workout generation system with feedback loop, InBody integration, and body photo analysis.

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY                               │
└─────────────────────────────────────────────────────────────────────┘

[1] User Opens App → Requests Workout Plan
    │
    ▼
[2] Frontend (Next.js) sends request to C# Backend
    POST /api/workout-plans/generate
    {
      "userId": 12345,
      "fitnessLevel": "Intermediate",
      "goal": "Muscle",
      "daysPerWeek": 4,
      "equipment": ["Barbell", "Dumbbells"]
    }
    │
    ▼
[3] C# Backend: WorkoutPlanController
    │
    ├─> Check Redis Cache (50ms)
    │   └─> HIT? Return immediately ✅
    │
    ├─> Check Database (200ms)
    │   └─> FOUND? Return + repopulate cache ✅
    │
    └─> MISS? Generate new plan ▼

[4] C# Service: Build User Context
    │
    ├─> Query InBodyMeasurements (Latest)
    │   SELECT * FROM in_body_measurements
    │   WHERE user_id = 12345
    │   ORDER BY measurement_date DESC LIMIT 1
    │   └─> Result: { muscle_mass: 65.5kg, body_fat: 18.2% }
    │
    ├─> Query MuscleDevelopmentScans (Latest)
    │   SELECT * FROM muscle_development_scan
    │   WHERE user_id = 12345
    │   ORDER BY scan_date DESC LIMIT 1
    │   └─> Result: { underdeveloped: ["back", "shoulders"] }
    │
    ├─> Query UserStrengthProfile (All exercises)
    │   SELECT e.name, usp.estimated_1rm, usp.confidence_score
    │   FROM user_strength_profile usp
    │   JOIN exercises e ON e.exercise_id = usp.exercise_id
    │   WHERE usp.user_id = 12345
    │   └─> Result: { "Bench Press": {1rm: 80kg, conf: 0.85} }
    │
    └─> Query Recent Feedback
        SELECT * FROM workout_feedback
        WHERE user_id = 12345
        ORDER BY created_at DESC LIMIT 5
        └─> Result: { avg_rating: 4.2, common_issues: ["chest_too_light"] }

[5] Build Enriched Prompt for Flan-T5
    {
      "user_profile": {
        "fitness_level": "Intermediate",
        "goal": "Muscle",

        // InBody data (if available)
        "body_composition": {
          "muscle_mass_kg": 65.5,
          "body_fat_percent": 18.2,
          "skeletal_muscle_mass": 32.1
        },

        // Body scan data (if available)
        "muscle_development": {
          "weak_areas": ["back", "shoulders"],
          "strong_areas": ["legs", "chest"]
        },

        // Strength profile
        "known_strength": {
          "Bench Press": { "1rm_kg": 80, "confidence": 0.85 },
          "Squat": { "1rm_kg": 100, "confidence": 0.92 }
        },

        // Recent feedback
        "feedback_summary": {
          "last_3_workouts_avg_rating": 4.2,
          "weight_adjustments": {
            "chest_exercises": "increase_5_percent",
            "leg_exercises": "perfect"
          }
        }
      },

      "request": {
        "days_per_week": 4,
        "equipment": ["Barbell", "Dumbbells"],
        "injuries": []
      },

      "instructions": {
        "focus_muscles": ["back", "shoulders"], // From photo scan
        "weight_recommendations": "use_strength_profile",
        "progressive_overload": true
      }
    }

[6] HTTP POST to Python ML Service (localhost:5300)
    │
    ▼
[7] Python FastAPI: /predict endpoint
    │
    ├─> Load Flan-T5 Model (cached in RAM)
    ├─> Tokenize enriched prompt
    ├─> GPU Inference (1-2 seconds)
    └─> Generate JSON output

[8] Flan-T5 Output (with smart recommendations)
    {
      "plan_name": "4-Day Upper/Lower - Back Focus",
      "days_per_week": 4,
      "days": [
        {
          "day_number": 1,
          "focus": "Upper Pull (Back Emphasis)",
          "exercises": [
            {
              "exercise_name": "Barbell Row",
              "sets": 4,
              "reps": "8-10",
              "weight_recommendation": "65kg", // Based on strength profile
              "rest_seconds": 90,
              "notes": "Focus on back - identified as weak area"
            },
            {
              "exercise_name": "Lat Pulldown",
              "sets": 3,
              "reps": "10-12",
              "weight_recommendation": "55kg",
              "rest_seconds": 60
            }
          ]
        }
      ]
    }

[9] C# Backend: Save to Database
    INSERT INTO workout_plans (
      user_id, plan_name, plan_data,
      request_parameters, user_context_snapshot,
      model_version, is_active
    ) VALUES (...)
    │
    └─> Cache in Redis (7 days TTL)

[10] Return to User
     └─> User sees personalized plan with smart weight recommendations

════════════════════════════════════════════════════════════════════

[11] User Completes Workout
     └─> Logs exercises in app
         INSERT INTO workout_logs (...)
         INSERT INTO workout_log_exercises (exercise_id, weight_used, ...)

[12] Feedback Screen Appears
     "How was today's workout?"
     ⭐⭐⭐⭐⭐ (5 stars)

     "How did weights feel?"
     ┌─────────────────────────────────────────────┐
     │ Exercise        │ Weight │ Feeling          │
     ├─────────────────┼────────┼──────────────────┤
     │ Barbell Row     │ 65kg   │ [Perfect ✓]      │
     │ Bench Press     │ 70kg   │ [Too Light]      │
     │ Squat           │ 100kg  │ [Too Heavy]      │
     └─────────────────────────────────────────────┘

[13] Submit Feedback
     POST /api/workout-feedback/submit
     {
       "workout_log_id": 789,
       "rating": 5,
       "difficulty_level": "Perfect",
       "exercise_feedback": [
         {
           "exercise_id": 23,
           "exercise_name": "Barbell Row",
           "weight_used": 65,
           "weight_feeling": "Perfect"
         },
         {
           "exercise_id": 12,
           "exercise_name": "Bench Press",
           "weight_used": 70,
           "weight_feeling": "TooLight"
         }
       ]
     }

[14] C# Backend: Process Feedback
     │
     ├─> Save feedback to database
     │   INSERT INTO workout_feedback (...)
     │
     └─> Update Strength Profiles ▼

[15] Update UserStrengthProfile (AI Learning)

     FOR each exercise in feedback:

       IF weight_feeling = "Perfect":
         ├─> Keep same 1RM estimate
         └─> INCREASE confidence score (+0.10)

       IF weight_feeling = "TooLight":
         ├─> INCREASE 1RM by 5%
         └─> DECREASE confidence (-0.05, needs verification)

       IF weight_feeling = "TooHeavy":
         ├─> DECREASE 1RM by 5%
         └─> DECREASE confidence (-0.05)

     Example:
     Bench Press: 70kg felt "TooLight"
     ├─> Old 1RM: 80kg → New 1RM: 84kg (+5%)
     └─> Confidence: 0.85 → 0.80

     UPDATE user_strength_profile
     SET estimated_1rm = 84,
         confidence_score = 0.80,
         feedback_count = feedback_count + 1,
         updated_at = NOW()
     WHERE user_id = 12345 AND exercise_id = 12

[16] Clear Cache (force fresh plan next time)
     DELETE FROM redis WHERE key LIKE 'workout-plan:12345:*'

[17] Next Plan Generation (Improved!)
     ├─> Same user requests new plan
     ├─> Build context includes UPDATED strength profile
     │   └─> Bench Press 1RM: 84kg (was 80kg)
     ├─> Flan-T5 generates plan with adjusted weights
     │   └─> Bench Press: 75kg (increased from 70kg)
     └─> User gets better-personalized plan!
```

---

## 🗄️ Database Schema

### **Core Tables**

```sql
-- AI-generated workout plans
workout_plans
├─ id (PK)
├─ user_id (FK → users)
├─ plan_name
├─ fitness_level, goal, days_per_week
├─ plan_data (JSONB) ← Full Flan-T5 output
├─ request_parameters (JSONB)
├─ request_parameters_hash ← Cache key
├─ user_context_snapshot (JSONB) ← InBody, scans, strength at generation
├─ model_version
└─ is_active, created_at, completed_at

-- User feedback after workouts
workout_feedback
├─ id (PK)
├─ user_id (FK → users)
├─ workout_log_id (FK → workout_logs)
├─ rating (1-5 stars)
├─ difficulty_level (TooEasy, Perfect, TooHard)
├─ exercise_feedback (JSONB) ← Per-exercise weight feeling
└─ created_at

-- AI-learned strength levels
user_strength_profile
├─ id (PK)
├─ user_id (FK → users)
├─ exercise_id (FK → exercises)
├─ estimated_1rm ← Calculated from feedback
├─ confidence_score (0.0-1.0) ← AI confidence
├─ feedback_count
└─ updated_at

-- Body photo analysis (CLIP model)
muscle_development_scan
├─ id (PK)
├─ user_id (FK → users)
├─ image_url
├─ muscle_scores (JSONB) ← {"chest": 0.75, "back": 0.45}
├─ underdeveloped_muscles (Array) ← ["back", "shoulders"]
└─ scan_date
```

---

## 💻 C# Backend Code Structure

### **File Structure**

```
Core/
├── DomainLayer/
│   └── Models/
│       ├── WorkoutPlan.cs ✅ (Updated with AI fields)
│       ├── WorkoutFeedback.cs ✅ (NEW)
│       ├── UserStrengthProfile.cs ✅ (NEW)
│       └── MuscleDevelopmentScan.cs ✅ (NEW)
│
├── ServiceAbstraction/
│   └── Services/
│       ├── IWorkoutGeneratorService.cs (NEW - need to create)
│       ├── IFeedbackService.cs (NEW - need to create)
│       └── IStrengthProfileService.cs (NEW - need to create)
│
└── Service/
    └── Services/
        ├── WorkoutGeneratorService.cs (NEW - need to create)
        ├── FeedbackService.cs (NEW - need to create)
        └── StrengthProfileService.cs (NEW - need to create)

Infrastructure/
└── Persistence/
    ├── Repositories/
    │   ├── WorkoutPlanRepository.cs (NEW - need to create)
    │   ├── FeedbackRepository.cs (NEW - need to create)
    │   ├── StrengthProfileRepository.cs (NEW - need to create)
    │   └── MuscleScanRepository.cs (NEW - need to create)
    │
    └── Configurations/
        ├── WorkoutPlanConfiguration.cs (NEW - need to create)
        ├── WorkoutFeedbackConfiguration.cs (NEW - need to create)
        ├── UserStrengthProfileConfiguration.cs (NEW - need to create)
        └── MuscleDevelopmentScanConfiguration.cs (NEW - need to create)

Shared/
└── DTOs/
    ├── WorkoutPlanRequest.cs (NEW - need to create)
    ├── WorkoutPlanResponse.cs (NEW - need to create)
    ├── FeedbackSubmitRequest.cs (NEW - need to create)
    └── UserContextDto.cs (NEW - need to create)

Graduation-Project/ (API)
└── Controllers/
    ├── WorkoutPlanController.cs (NEW - need to create)
    └── WorkoutFeedbackController.cs (NEW - need to create)
```

---

## 🐍 Python ML Service Code

### **File Structure**

```
ml_models/Workout-Plan_Generating/
├── train.py ✅ (Existing - update to include context in training)
├── app.py (NEW - FastAPI service - need to create)
├── models/
│   └── workout-generator-v1/ (Trained model)
├── requirements.txt ✅ (Existing)
└── test_model.ipynb ✅ (Existing - update with context examples)
```

### **FastAPI Service** (app.py - to create)

```python
# Port 5300
from fastapi import FastAPI
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

app = FastAPI()

# Load model on startup
model = None
tokenizer = None

@app.on_event("startup")
async def load_model():
    global model, tokenizer
    tokenizer = AutoTokenizer.from_pretrained("./models/workout-generator-v1")
    model = AutoModelForSeq2SeqLM.from_pretrained("./models/workout-generator-v1")

@app.post("/predict")
async def generate_plan(request: PredictionRequest):
    # Build prompt from user context
    prompt = build_enriched_prompt(request)

    # Tokenize
    inputs = tokenizer(prompt, return_tensors="pt")

    # Generate
    outputs = model.generate(**inputs, max_length=2048)

    # Decode
    plan_json = tokenizer.decode(outputs[0])

    return {"prediction": plan_json, "model_version": "flan-t5-v1.0.0"}

def build_enriched_prompt(request):
    prompt = f"Generate a {request.days_per_week}-day workout plan "
    prompt += f"for {request.fitness_level} lifter, "
    prompt += f"goal is {request.goal}. "

    # Add InBody context
    if request.inbody_data:
        prompt += f"User has {request.inbody_data.muscle_mass}kg muscle mass, "
        prompt += f"{request.inbody_data.body_fat_percent}% body fat. "

    # Add muscle scan context
    if request.muscle_scan:
        prompt += f"Focus on weak areas: {', '.join(request.muscle_scan.weak_areas)}. "

    # Add strength profile
    if request.strength_profile:
        prompt += "Known strength levels: "
        for exercise, data in request.strength_profile.items():
            prompt += f"{exercise} 1RM={data.one_rm}kg, "

    # Add equipment
    prompt += f"Has {', '.join(request.equipment)}."

    return prompt
```

---

## 🔄 Data Flow Examples

### **Example 1: New User (No Data)**

```
Request: Generate 4-day muscle plan
├─ InBody: None ❌
├─ Muscle Scan: None ❌
├─ Strength Profile: Empty ❌
└─> Prompt: "Generate 4-day plan for intermediate, goal muscle, has barbell/dumbbells"
    └─> AI uses defaults (generic recommendations)
```

### **Example 2: User with InBody Only**

```
Request: Generate 4-day muscle plan
├─ InBody: 65.5kg muscle, 18.2% BF ✅
├─ Muscle Scan: None ❌
├─ Strength Profile: Empty ❌
└─> Prompt: "...User has 65.5kg muscle, 18.2% body fat..."
    └─> AI adjusts volume based on muscle mass
```

### **Example 3: User with InBody + Photo Scan**

```
Request: Generate 4-day muscle plan
├─ InBody: 65.5kg muscle, 18.2% BF ✅
├─ Muscle Scan: Weak: [back, shoulders] ✅
├─ Strength Profile: Empty ❌
└─> Prompt: "...Focus on back and shoulders (weak areas from photo)..."
    └─> AI generates plan with extra back/shoulder volume
```

### **Example 4: Full Context (After 10 Workouts)**

```
Request: Generate 4-day muscle plan
├─ InBody: 65.5kg muscle, 18.2% BF ✅
├─ Muscle Scan: Weak: [back, shoulders] ✅
├─ Strength Profile: ✅
│   ├─ Bench Press: 80kg 1RM (confidence: 0.85)
│   ├─ Squat: 100kg 1RM (confidence: 0.92)
│   └─ Deadlift: 120kg 1RM (confidence: 0.78)
└─> Prompt: "...Known strength: Bench 80kg, Squat 100kg...Focus on back..."
    └─> AI generates plan with EXACT weight recommendations
        ├─ Bench Press: 70kg (87.5% of 1RM for 8-10 reps)
        ├─ Squat: 85kg (85% of 1RM for 8-10 reps)
        └─ Extra back volume (identified weakness)
```

---

## 📝 Implementation Checklist

### **Phase 1: Database & Models** ✅ DONE

- [x] Create domain models (WorkoutPlan, Feedback, Strength, Scan)
- [x] Add navigation properties to User, Exercise, WorkoutLog
- [ ] Create EF Core configurations
- [ ] Create database migration
- [ ] Run migration on dev database

### **Phase 2: Repositories & DTOs**

- [ ] Create repository interfaces
- [ ] Implement repositories
- [ ] Create request/response DTOs
- [ ] Add AutoMapper profiles

### **Phase 3: Service Layer**

- [ ] WorkoutGeneratorService (calls ML, saves to DB)
- [ ] FeedbackService (processes feedback, updates strength)
- [ ] StrengthProfileService (calculates 1RM, manages profiles)
- [ ] MLServiceClient (HTTP client for Python service)

### **Phase 4: API Controllers**

- [ ] WorkoutPlanController (generate, get, activate)
- [ ] WorkoutFeedbackController (submit, get history)
- [ ] BodyScanController (upload photo, get analysis)

### **Phase 5: Python ML Service**

- [ ] Update train.py to generate context-aware training data
- [ ] Create FastAPI app.py
- [ ] Implement /predict endpoint
- [ ] Add prompt engineering logic
- [ ] Docker container setup

### **Phase 6: Frontend Integration**

- [ ] Workout plan request form
- [ ] Display generated plan
- [ ] Feedback submission form
- [ ] Body photo upload
- [ ] View strength profile page

### **Phase 7: Testing & Deployment**

- [ ] Unit tests (services)
- [ ] Integration tests (full flow)
- [ ] Load testing (ML service)
- [ ] Deploy Python service
- [ ] Setup Redis caching
- [ ] Monitor performance

---

## 🎯 Next Steps

1. **Run Database Migration** (creates new tables)
2. **Create EF Core Configurations** (map models to tables)
3. **Implement Repositories** (data access)
4. **Build Service Layer** (business logic)
5. **Create API Controllers** (HTTP endpoints)
6. **Update Python ML Service** (context-aware prompts)
7. **Test End-to-End** (full feedback loop)

**Want me to start implementing any phase?** Let me know! 🚀
