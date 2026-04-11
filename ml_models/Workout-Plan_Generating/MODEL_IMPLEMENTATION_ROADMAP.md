# Workout Plan Generator - Implementation Roadmap
## IntelliFit AI Coach - Graduation Project

### 🎯 Project Goal
Create an AI workout plan generator that:
1. **Generates personalized workout plans** based on user goals and preferences
2. **Learns from coach feedback** via natural language (not rigid categories)
3. **Handles injuries safely** through rule-based filtering (not AI guessing)
4. **Supports three user modes**: Simple, Standard, Advanced

---

## 🏗️ Architecture Overview

```
User Input → Injury Filter (Rules) → AI Model → Plan Output
                                           ↓
                                    Coach Reviews
                                           ↓
                              Natural Language Feedback
                                           ↓
                                    Store (Original, Corrected)
                                           ↓
                              Periodic DPO Retraining
```

**Key Principle**: Keep safety-critical logic (injuries) in rules, let AI handle optimization.

---

## 📋 Three-Tier User Experience

### Tier 1: Simple Mode (2-3 minutes)
**Target**: New users, casual gym-goers
**Inputs**:
- Goal (Strength / Muscle / Weight Loss / General Fitness)
- Experience (Beginner / Intermediate / Advanced)
- Days per week (3-6)
- Any injuries/pain? (Yes/No + body part)
- Equipment available (Gym / Home / Minimal)

**AI Output**: Clean, simple plan with exercise names, sets, reps, rest periods.

**Example**:
```
📅 4-Day Muscle Building Plan

Day 1 - Upper Body (45 min)
• Barbell Bench Press: 3 sets x 8-10 reps
• Lat Pulldown: 3 sets x 10-12 reps
• Dumbbell Shoulder Press: 3 sets x 10-12 reps
...

Day 2 - Lower Body (50 min)
• Barbell Squat: 4 sets x 8-10 reps
...
```

### Tier 2: Standard Mode (5-7 minutes)
**Target**: Regular gym-goers who want customization
**Additional Inputs**:
- Equipment preferences (Love/Prefer/Neutral/Avoid for: Barbell, Dumbbell, Machines, Bodyweight)
- Focus areas (Chest, Back, Arms, Legs, etc. - pick 2-3)
- Training duration preference (30-45 min / 45-60 min / 60+ min)

**AI Output**: Same as Simple + warm-up guidance + periodization notes

### Tier 3: Advanced Mode (10-15 minutes, optional)
**Target**: Serious athletes, competitive lifters
**Additional Inputs**:
- Muscle-specific volume preferences
- Periodization strategy (Linear/Block/Undulating)
- Recovery metrics (optional: connect wearable for HRV, sleep)
- Deload preferences

**AI Output**: Full detailed plan with autoregulation guidelines, cardio zones, mobility work

---

## 🗂️ Simplified Database Schema

### Users Table (Existing)
- UserId, Name, Email, Role

### UserPreferences Table (NEW)
```sql
CREATE TABLE UserPreferences (
    PreferenceId SERIAL PRIMARY KEY,
    UserId INTEGER REFERENCES Users(UserId),
    -- Tier 1 (Always captured)
    Goal VARCHAR(20), -- 'Strength', 'Muscle', 'WeightLoss', 'General'
    ExperienceLevel VARCHAR(20), -- 'Beginner', 'Intermediate', 'Advanced'
    DaysPerWeek INTEGER,
    EquipmentAccess VARCHAR(20), -- 'Gym', 'Home', 'Minimal'
    
    -- Tier 2 (Standard mode)
    EquipmentPreferences JSONB, -- {"barbell": "love", "machines": "prefer"}
    FocusAreas JSONB, -- ["chest", "back"]
    SessionDuration VARCHAR(20), -- 'short', 'medium', 'long'
    
    -- Tier 3 (Advanced mode - optional)
    PeriodizationStrategy VARCHAR(20),
    VolumePreferences JSONB, -- {"chest": {"min": 10, "max": 20}}
    DeloadInterval INTEGER,
    
    -- Injury data (structured)
    Injuries JSONB, -- [{"part": "shoulder", "severity": "mild", "type": "pain"}]
    
    CreatedAt TIMESTAMP,
    UpdatedAt TIMESTAMP
);
```

### AIWorkoutPlans Table (NEW)
```sql
CREATE TABLE AIWorkoutPlans (
    PlanId SERIAL PRIMARY KEY,
    UserId INTEGER REFERENCES Users(UserId),
    
    -- Input context
    UserContext JSONB, -- All preferences used to generate plan
    
    -- Generated plan
    PlanContent TEXT, -- The actual workout plan text
    PlanStructure JSONB, -- Parsed version for API usage
    
    -- Metadata
    GeneratedAt TIMESTAMP,
    Version INTEGER, -- Model version used
    
    -- Coach review
    CoachReviewed BOOLEAN DEFAULT FALSE,
    CoachFeedback TEXT, -- Natural language feedback
    CorrectedPlanContent TEXT, -- Coach's corrected version
    FeedbackTags JSONB, -- Auto-extracted: ["too_advanced", "missing_volume"]
    
    -- Status
    IsActive BOOLEAN DEFAULT TRUE,
    IsTemplate BOOLEAN DEFAULT FALSE -- If true, used for training
);
```

### ExerciseAliasMapping Table (NEW - for matching AI output to DB)
```sql
CREATE TABLE ExerciseAliases (
    AliasId SERIAL PRIMARY KEY,
    ExerciseId INTEGER REFERENCES Exercises(ExerciseId),
    AliasName VARCHAR(100), -- "bench press"
    NormalizedName VARCHAR(100), -- "benchpress"
    Source VARCHAR(50), -- 'musclewiki', 'mns', 'common'
    UNIQUE(AliasName)
);
```

---

## 🤖 AI Model Training Strategy

### Stage 1: Initial Training (SFT)
**Dataset**: ~15,000 high-quality workout plans
**Sources**:
- Expert programs (Starting Strength, 5/3/1, etc.) - 10%
- Evidence-based templates (RP Strength, Renaissance Periodization) - 20%
- Synthetic examples covering edge cases - 70%

**Training**:
- Model: Qwen2.5-3B-Instruct
- Method: QLoRA (4-bit) with rank 64
- Epochs: 3
- Output: Base workout generator

### Stage 2: Preference Learning (DPO)
**Dataset**: Coach-corrected plans
**Trigger**: After collecting ~500 coach reviews

**Format**:
```json
{
  "prompt": "Level: Beginner, Goal: Muscle, Days: 4, Injuries: shoulder(mild)...",
  "rejected": "D1: 1.Barbell Overhead Press|4x6-8...",  // Original plan
  "chosen": "D1: 1.Dumbbell Neutral Press|3x10-12..."   // Coach corrected
}
```

**Training**: DPOTrainer from TRL library

---

## 🎓 Natural Language Feedback Examples

The system should understand ANY coach feedback, not just predefined categories.

### Example Feedback Patterns:

**1. Exercise Substitution**
```
Coach: "Overhead press is too advanced for this beginner. 
        Swap it for dumbbell shoulder press."

System learns: When user is Beginner + Goal: Muscle, 
               prefer dumbbell presses over barbell overhead
```

**2. Volume Adjustment**
```
Coach: "Only 8 sets for chest? That's below MEV. Add incline dumbbell press."

System learns: Muscle goal requires chest volume >= 10 sets
```

**3. Injury Adaptation**
```
Coach: "He has mild shoulder pain - remove all overhead work."

System learns: + shoulder pain → avoid vertical_push patterns
```

**4. Progressive Overload**
```
Coach: "Rep range too high for strength goal. Should be 3-6, not 8-12."

System learns: Strength goal → lower reps, higher weight
```

**5. Recovery Balance**
```
Coach: "He's training chest 3x per week with only 1 rest day. Add more recovery."

System learns: Ensure 48h+ recovery between same muscle groups
```

---

## 🛡️ Injury Safety Rules (Algorithm, Not AI)

### Rule Engine (Must Run BEFORE AI Generation)

```python
INJURY_SAFETY_RULES = {
    "shoulder": {
        "mild_pain": {
            "avoid_patterns": ["overhead_press", "kipping_pullups", "deep_dips"],
            "substitute": {
                "overhead_press": "dumbbell_neutral_press",
                "bench_press": "dumbbell_press",
            },
            "reduce_load": 0.8,  # 80% of normal
            "require_clearance": False
        },
        "severe_pain": {
            "avoid_all_upper_body": True,
            "require_clearance": True,
            "message": "Shoulder injury requires medical clearance before upper body training."
        }
    },
    "knee": {
        "patellar_pain": {
            "avoid_patterns": ["deep_squat", "lunge", "box_jump"],
            "substitute": {
                "squat": "leg_press",
                "lunge": "step_up",
            },
            "modify_rom": "partial"  # Partial range of motion
        }
    },
    "lower_back": {
        "pain": {
            "avoid_patterns": ["deadlift", "good_morning", "bent_over_row"],
            "substitute": {
                "deadlift": "leg_press",
                "bent_over_row": "chest_supported_row",
            }
        }
    }
}

# Red flags - always require clearance
REDFLAGS = [
    "severe_pain",
    "instability", 
    "post_surgery",
    "recent_trauma",
    "marked_weakness"
]
```

### Safety Flow:
```
1. User reports injury: "Shoulder pain, 3 months, overhead movements hurt"
2. System asks severity: "Mild discomfort / Moderate pain / Severe pain"
3. Rule Engine:
   - If severe → STOP, show message: "Please consult doctor"
   - If mild → Filter exercises → Pass filtered pool to AI
4. AI generates plan ONLY from safe exercises
```

---

## 📱 API Integration Flow

### 1. Create Plan Endpoint
```
POST /api/ai/generate-plan
Body: {
  "tier": "standard",
  "preferences": {
    "goal": "Muscle",
    "level": "Intermediate", 
    "days": 4,
    "equipment_prefs": {"barbell": "love", "machines": "neutral"},
    "focus_areas": ["chest", "back"]
  },
  "injuries": [{"part": "shoulder", "severity": "mild"}]
}

Response: {
  "plan_id": 12345,
  "plan_text": "D1: Push [chest,shoulders]...",
  "plan_structure": {...}
}
```

### 2. Coach Review Endpoint
```
POST /api/ai/coach-review
Body: {
  "plan_id": 12345,
  "feedback": "Barbell overhead press too aggressive for shoulder injury. Use dumbbell neutral grip instead.",
  "corrected_plan": "D1: Push... 1.Dumbbell Neutral Press|3x10-12..."
}

System:
- Saves original + corrected
- Extracts tags (optional ML)
- Adds to DPO dataset
```

### 3. Get Plan for User
```
GET /api/ai/plan/{plan_id}
Returns: Formatted plan for mobile/web display
```

---

## 🔄 Feedback Learning Loop (Simplified)

```
[User] → Gets AI Plan → [Coach] → Reviews → [System]
                                              ↓
                                  1. Save to DB
                                  2. If enough samples (100+)
                                     → Trigger retraining
                                              ↓
                                     [DPO Training]
                                              ↓
                                        [New Model]
                                              ↓
                                  Better plans for next users
```

**Retraining Trigger**: When coach_reviews > 100
**Retraining Process**: 
1. Export all (prompt, original, corrected) pairs
2. Run DPO training for 1-2 epochs
3. Deploy new model version
4. Keep old model for rollback if needed

---

## 📊 Success Metrics

### Model Performance
- **Plan acceptance rate**: % of plans approved by coach without changes (Target: >70%)
- **Correction quality**: Similarity between AI plan and coach-corrected plan (Target: >85%)
- **Safety**: Zero injuries caused by AI recommendations (Critical)

### User Experience
- **Plan generation time**: <5 seconds
- **User satisfaction**: Rating 4.5+/5
- **Adherence**: User completes 80%+ of scheduled workouts

---

## 📝 Implementation Phases

### Phase 1: MVP (Week 1-2)
- [ ] Simple mode only
- [ ] Basic injury rules (shoulder, knee, back)
- [ ] SFT training on 15k examples
- [ ] Text output only
- [ ] Manual coach review (no automatic DPO yet)

### Phase 2: Feedback Learning (Week 3-4)
- [ ] Add coach review endpoints
- [ ] Store original + corrected plans
- [ ] Build DPO pipeline
- [ ] First model retraining

### Phase 3: Polish (Week 5-6)
- [ ] Add Standard mode
- [ ] Exercise-to-database mapping
- [ ] Mobile-friendly output formatting
- [ ] Warm-up generation
- [ ] Cardio integration

### Phase 4: Advanced Features (Week 7+)
- [ ] Advanced mode with all sliders
- [ ] Autoregulation (HRV, sleep)
- [ ] Progress tracking
- [ ] Adaptive plan updates

---

## 🔧 Technical Stack

### Backend
- **Framework**: .NET 8 (existing)
- **Database**: PostgreSQL (existing)
- **ML Service**: Python Flask API (new)
- **Model**: Qwen2.5-3B-Instruct + QLoRA

### ML Pipeline
- **Training**: TRL library (SFT + DPO)
- **Inference**: Transformers + PEFT
- **Deployment**: Docker container
- **GPU**: RTX 4050 6GB (local) or cloud

### Frontend (Future)
- Simple mode: 3-screen flow
- Standard mode: 5-screen flow
- Clean, minimal UI

---

## 🎯 Key Decisions Made

1. **Injury handling**: Rules-based (safety), not learned
2. **Feedback**: Natural language (flexible), not categories
3. **Learning**: DPO from corrections (proven), not online
4. **User experience**: Three tiers (accessible to all)
5. **Output**: Structured text (parseable), not just freeform

---

## 📚 File Locations

- **Training Script**: `train_workout_generator_v6.py`
- **Datasets**: `Dataset/` folder
  - `ms_exercises_fresh.csv` (3,000 exercises)
  - `musclewiki_exercises.csv` (1,200 exercises)
  - `GymDataset.csv` (2,900 exercises)
- **Output Model**: `models/workout-generator-v6/`
- **DPO Dataset**: `dpo_pairs_v6.jsonl`

---

## ✅ Next Steps

1. **Finalize injury rules** for shoulder, knee, lower back
2. **Create exercise alias mapping** (AI name → DB ID)
3. **Generate initial SFT dataset** (15,000 examples)
4. **Train base model** (Stage 1)
5. **Build simple UI** for plan generation + coach review
6. **Test safety** with injury scenarios
7. **Collect first 100 coach reviews**
8. **Run DPO training** (Stage 2)

---

## 💡 Notes

- **Keep it simple**: Start with Simple mode only
- **Safety first**: Never skip injury rules
- **Learn from experts**: Coach feedback is gold
- **Iterate fast**: Get MVP working, then add features
- **Document everything**: This file is your guide

---

**Last Updated**: 2026-04-03
**Status**: Ready for implementation
