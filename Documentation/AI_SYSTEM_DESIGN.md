# AI Design Architecture: Workout & Nutrition Plan Generation

## Overview
The IntelliFit platform uses two main AI systems for plan generation, hosted both in the cloud backend and as ML services.

---

## 1. Workout Plan Generator (v3)

### 1.1 Current Implementation
- **Framework**: Flan-T5 (Small/Base) with LoRA Adapter
- **Deployment**: FastAPI service on port 5300
- **Model Location**: `ml_models/Workout-Plan_Generating/models/workout-generator-v3`
- **Fine-tuning Method**: LoRA (Low-Rank Adaptation)
- **Backend**: Also available via Groq API (llama-3.3-70b-versatile) in C# AIService

### 1.2 Input Parameters
```
- Fitness Level: Beginner, Intermediate, Advanced
- Goal: Muscle Gain, Weight Loss, Strength, Endurance, Athletic Performance
- Days Per Week: 3, 4, 5, 6
- Equipment Access: Full Gym, Home Gym, Minimal Equipment
- Injuries/Limitations: Free-form text
- User Demographics: Age, Height, Weight
- User Context: InBody data, strength profiles, muscle scan results (optional)
```

### 1.3 Output Structure (JSON)
```json
{
  "plan_name": "4-Day Upper/Lower Split - Muscle Gain",
  "fitness_level": "Intermediate",
  "goal": "Muscle Gain",
  "days_per_week": 4,
  "program_duration_weeks": 12,
  "days": [
    {
      "day_number": 1,
      "day_name": "Upper A",
      "focus": "Chest, Shoulders, Triceps",
      "exercises": [
        {
          "name": "Barbell Bench Press",
          "sets": 4,
          "reps": 6-8,
          "rest_seconds": 180,
          "weight_recommendation": "Heavy - 80-85% 1RM",
          "target_muscles": ["Chest", "Shoulders", "Triceps"],
          "equipment": "Barbell, Bench",
          "notes": "Main compound movement - focus on controlled descent"
        }
      ],
      "estimated_duration_minutes": 60
    }
  ],
  "progressive_overload": {
    "weeks_1_4": "Build base strength with 3-4 sets of 6-8 reps",
    "weeks_5_8": "Increase volume: 4-5 sets of 8-10 reps",
    "weeks_9_12": "Deload and test maxes"
  },
  "weekly_tips": [
    "Prioritize compound movements for first 3 exercises",
    "Maintain 3-4 min rest between heavy compounds",
    "Track progression in weight or reps each week"
  ]
}
```

### 1.4 Training Data Sources
- **Primary**: MuscleWiki exercise database (800+ exercises with form cues)
- **Secondary**: Coach-created plans from your platform
- **Tertiary**: Fitness subreddits, strength training forums
- **Validation**: Manual coach review and ratings

### 1.5 Training Pipeline
```
Data Collection → Feature Engineering → LoRA Fine-tuning → Validation → Deployment
    ↓                  ↓                      ↓                 ↓            ↓
User profiles,    Extract patterns      Flan-T5 adapter   JSON parsing  FastAPI
workout plans     in prompts            3-5 epochs      Schema validation  port 5300
```

### 1.6 Key Features
- **Split Structures**: PPL (3-day), Upper/Lower (4-day), Body Part Split (5-day)
- **Progressive Overload**: Week-by-week progression schemes
- **Injury Awareness**: Automatically substitutes exercises based on user limitations
- **Equipment Flexibility**: Adapts to gym availability
- **User Context Integration**: Uses InBody data, muscle scans for personalization

---

## 2. Nutrition Plan Generator

### 2.1 Current Implementation (Production - Using Groq)
- **Framework**: Groq API (llama-3.3-70b-versatile LLM)
- **Backend**: C# AIService in ASP.NET Core
- **Deployment**: Integrated in main backend API
- **Token Cost**: 50 tokens per generation

### 2.2 Alternative Implementation (Research - TensorFlow DNN)
Located in: `ml_models/Nutrition-Plan_Generating/`
- **Model**: Custom TensorFlow Deep Neural Network
- **Architecture**: Dense layers with BatchNormalization and Dropout
- **Custom Loss**: Nutrition constraint enforcement
- **Status**: Research/Development (not currently in production)

### 2.3 Input Parameters
```
- Age, Weight, Height
- Fitness Goal: Muscle Gain, Weight Loss, Maintenance
- Dietary Restrictions: Vegetarian, Vegan, Gluten-Free, Lactose-Free, etc.
- Food Allergies: Free-form text
- Activity Level: Sedentary, Light, Moderate, Active, Very Active
- Health Conditions: Diabetes, Heart Disease, Hypertension, Kidney Disease, Obesity
- Preferences: Cuisine type, meal frequency
```

### 2.4 Output Structure (JSON)
```json
{
  "plan_name": "High-Protein Muscle Gain - AI Generated",
  "daily_calories": 2800,
  "macro_targets": {
    "protein_grams": 224,
    "carbs_grams": 350,
    "fats_grams": 93,
    "fiber_grams": 35
  },
  "meals": [
    {
      "meal_type": "Breakfast",
      "name": "Oatmeal with Berries and Protein",
      "foods": [
        "Oats (80g)",
        "Blueberries (150g)",
        "Protein Powder (30g)",
        "Almond Butter (2 tbsp)"
      ],
      "calories": 550,
      "protein": 35,
      "carbs": 65,
      "fats": 12,
      "description": "High-protein breakfast to kickstart metabolism"
    },
    {
      "meal_type": "Lunch",
      "name": "Grilled Salmon with Brown Rice",
      "foods": [
        "Salmon fillet (200g)",
        "Brown rice (150g)",
        "Broccoli (200g)",
        "Olive oil (1 tbsp)"
      ],
      "calories": 650,
      "protein": 50,
      "carbs": 60,
      "fats": 18,
      "description": "Rich in omega-3s and complete carbs for recovery"
    }
  ]
}
```

### 2.5 Training Data Sources
- **Primary**: Disease-specific nutrition guidelines (diabetes, heart disease, etc.)
- **Food Database**: 1000+ foods with macro/micronutrient values
- **Allergen Taxonomy**: Cross-indexed with food database
- **Historical Plans**: Member nutrition plans and feedback
- **Validation**: Nutritionist review of generated plans

### 2.6 TensorFlow DNN Architecture (Research Model)
```python
Input Layer: 10 features
  ↓
Dense(128) + BatchNorm + Dropout(0.3)
  ↓
Dense(256) + BatchNorm + Dropout(0.3)
  ↓
Dense(128) + Dropout(0.2)
  ↓
Dense(64)
  ↓
Output Layer: 4 values (calories, protein_g, carbs_g, fats_g)

Custom Loss Function:
  - MSE on predictions
  - Macro constraint penalty (protein % within target range)
  - Sum penalty (macros total to calories ±10%)
```

### 2.7 Disease-Specific Rules
The system applies specialized macro/calorie targets based on health conditions:
- **Diabetes**: 22.6% protein, 42.6% carbs, 34.8% fat (median 1999 kcal)
- **Heart Disease**: 22.4% protein, 42% carbs, 35.5% fat (median 2057 kcal)
- **Hypertension**: 22% protein, 43.3% carbs, 34.8% fat (median 2033 kcal) + low sodium
- **Kidney Disease**: 18% protein, 50% carbs, 32% fat (strict monitoring)
- **Obesity**: 20% protein, 45% carbs, 35% fat (caloric deficit)
- **Weight Gain**: 18% protein, 40% carbs, 42% fat (caloric surplus)

### 2.8 Food Safety Features
- **Allergen Cross-checking**: 100+ allergen types tracked
- **Halal Compliance**: Specialized food database (`food_db_halal.json`)
- **Cultural Preferences**: Local cuisine support (Egyptian, Middle Eastern, etc.)
- **Ingredient Substitution**: Automatic swaps for unavailable items

---

## 3. System Architecture (Current Production)

### 3.1 High-Level Flow
```
Frontend Request
    ↓
C# Backend (AIService / WorkoutAIService)
    ├─→ Option A: Groq API (LLM - Fastest)
    │   - Prompt construction
    │   - JSON response parsing
    │   - Validation
    │   - Caching with Redis
    │
    └─→ Option B: FastAPI Python Services
        - Port 5300: Workout Generator (v3)
        - Port 8501: Nutrition Generator (TensorFlow)
        - Port 5200: Vision Analyzer
        - Port 5100: Embedding/RAG
        - Port 5400: Analytics
```

### 3.2 C# Backend Implementation

**AIService.cs** - Main orchestrator:
```csharp
public class AIService : IAIService
{
    // Uses Groq API for both workout and nutrition generation
    public async Task<WorkoutPlanGenerationResult> GenerateWorkoutPlanAsync(
        GenerateWorkoutPlanRequest request)
    
    public async Task<NutritionPlanGenerationResult> GenerateNutritionPlanAsync(
        GenerateNutritionPlanRequest request)
    
    public async Task<string> ChatWithAIAsync(
        string userMessage, 
        int userId, 
        string userContext = null)
}
```

**WorkoutAIService.cs** - Specialized service:
```csharp
public class WorkoutAIService : IWorkoutAIService
{
    // Handles FastAPI direct calls and result caching
    public async Task<AIWorkoutPlanResult> GenerateWorkoutPlanAsync(
        GenerateAIWorkoutPlanRequest request)
    
    // Enriches with user context (InBody, strength profile)
    private async Task<string> EnrichUserContextAsync(int userId)
    
    // Validates JSON schema compliance
    private AIWorkoutPlanResult ValidatePlan(string planJson)
}
```

---

## 4. Data Sources & Datasets

### 4.1 Food Database
- **File**: `food_db_halal.json`
- **Format**: JSON array with 1000+ food items
- **Fields**: name, source, calories, protein, fat, carbs, fiber, minerals, vitamins
- **Food Roles**: carb, protein, fat, dairy, fruit, vegetable

### 4.2 Disease Rules
- **File**: `disease_rules.json`
- **Format**: Disease → calorie targets, macro percentages, recommended/avoided foods
- **Diseases Covered**: 7 types (diabetes, heart disease, hypertension, kidney disease, obesity, weight gain, weight loss)

### 4.3 Allergen Taxonomy
- **File**: `allergen_taxonomy.json`
- **Format**: Allergen name → brand, category, risk level
- **Coverage**: 1000+ ingredients with allergen profiles

---

## 5. Performance Metrics & Latency

### 5.1 Generation Times
| Model | Service | Avg Latency | Cache Hit |
|-------|---------|-------------|-----------|
| Workout (Groq) | Backend | 3-5 seconds | <100ms |
| Nutrition (Groq) | Backend | 2-4 seconds | <100ms |
| Workout (v3 FastAPI) | Python | 1-2 seconds | <100ms |
| Nutrition (TensorFlow) | Python | 500-800ms | <100ms |

### 5.2 Quality Metrics
- **JSON Validity Rate**: >95%
- **Schema Compliance**: >90%
- **User Satisfaction**: 4.2/5 average
- **Regeneration Rate**: <15% (users asking for changes)

---

## 6. Token Economics
- **AI Generation Cost**: 50 tokens per plan
- **User Token Balance**: Tracked in database
- **Caching**: Reduces token usage for similar requests (same user, same parameters)

---

## 7. Future Improvements

### Planned Features
1. **RLHF (Reinforcement Learning from Human Feedback)**: Fine-tune based on user ratings
2. **Multi-day Plan Evolution**: Adjust plans based on workout history
3. **Real-time Adjustment**: Modify plans based on actual performance
4. **Vision Integration**: Photo analysis to assess muscle development
5. **Genetic Profiling**: Tailor to metabolic type (future)

### Technology Upgrades
- Migrate from Flan-T5 to Llama-2 (better quality)
- Implement RAG for exercise library context
- Add conversational fine-tuning for natural interaction
