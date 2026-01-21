# Workout Generator API

AI-powered workout plan generator for PulseGym, using 7,959 real exercises from CSV dataset.

## Quick Start

```bash
cd ml_models
python -m workout_generator.app
```

Server runs on `http://localhost:5010`

## API Endpoints

### Health Check

```
GET /health
```

Returns service status and exercise count.

### Generate Workout Plan

```
POST /generate
Content-Type: application/json
```

#### Request Body

```json
{
  "user_id": 1,
  "profile": {
    "fitness_level": "beginner", // beginner | intermediate | advanced
    "goal": "muscle_gain", // muscle_gain | weight_loss | strength | endurance | general
    "days_per_week": 3, // 3-6
    "injuries": ["knee", "lower back"], // optional
    "allergies": [] // optional (for nutrition)
  },
  "plan_duration_weeks": 4 // 1-12
}
```

#### Response

```json
{
  "status": "success",
  "exercises_available": 7959,
  "safety_summary": {
    "injuries": ["knee", "lower back"],
    "total_unsafe_exercises": 1788,
    "total_unsafe_foods": 0
  },
  "plan": {
    "user_id": 1,
    "duration_weeks": 4,
    "days_per_week": 3,
    "goal": "muscle_gain",
    "fitness_level": "beginner",
    "split_type": "Full Body",
    "weeks": [
      {
        "week": 1,
        "theme": "Foundation - Focus on form and baseline",
        "days": [
          {
            "day": 1,
            "name": "Day 1",
            "focus": "Chest, Back, Legs",
            "exercises": [
              {
                "id": "ex_123",
                "name": "Barbell Bench Press",
                "muscle_group": "chest",
                "sets": 4,
                "reps": "8-12",
                "rest_seconds": 90,
                "notes": "Keep back flat on bench..."
              }
            ]
          }
        ]
      }
    ],
    "notes": [
      "Always warm up for 5-10 minutes before starting",
      "Focus on progressive overload"
    ]
  }
}
```

## Workout Splits

| Days/Week | Split Type     | Structure                                                                  |
| --------- | -------------- | -------------------------------------------------------------------------- |
| 3         | Full Body      | Day 1: Chest/Back/Legs, Day 2: Shoulders/Arms/Core, Day 3: Chest/Back/Legs |
| 4         | Upper/Lower    | Day 1-3: Upper, Day 2-4: Lower                                             |
| 5         | Push/Pull/Legs | Push, Pull, Legs, Push, Pull                                               |
| 6         | PPL x2         | Push/Pull/Legs twice                                                       |

## Safety Features

The safety filter automatically removes exercises that:

- Target injured body parts
- Could aggravate specific conditions
- Are contraindicated for user's medical history

Supported injuries:

- `knee` - Removes squats, lunges, etc.
- `lower back` / `back` - Removes deadlifts, etc.
- `shoulder` - Removes overhead press, etc.
- `ankle`, `wrist`, `neck`, `hip`

## Data Sources

- **Dataset_Workout_plans.csv**: 7,959 exercises with:

  - Name, target muscles, body parts
  - Equipment requirements
  - Step-by-step instructions

- **GYM.csv**: 80,000 goal-based workout rules
- **gym recommendation.csv**: 14,589 medical condition recommendations

## Architecture

```
workout_generator/
├── app.py              # Flask API server
├── rag_engine.py       # Exercise retrieval (FAISS or CSV fallback)
├── plan_builder.py     # Workout plan construction
├── dataset_loader.py   # CSV data loading
└── templates/          # Jinja2 templates (optional)

safety/
├── filter_engine.py    # Safety filtering
├── injury_mappings.py  # Injury → unsafe exercises
└── allergy_mappings.py # Allergy → unsafe foods
```

## Progressive Overload

The plan builder implements weekly progression:

- Volume increases 5% per week
- Intensity increases 2.5% per week
- Sets cap at base + week number

## Integration with .NET Backend

The .NET backend calls this API at `/api/workouts/generate`:

```csharp
var request = new WorkoutGenerationRequest
{
    UserId = userId,
    Profile = new UserProfile
    {
        FitnessLevel = "intermediate",
        Goal = "muscle_gain",
        DaysPerWeek = 4,
        Injuries = new[] { "knee" }
    },
    PlanDurationWeeks = 4
};

var response = await _httpClient.PostAsJsonAsync(
    "http://localhost:5010/generate",
    request
);
```
