"""
Workout Plan Generator v6 - Qwen2.5-3B-Instruct + QLoRA
=========================================================
Complete AI workout plan generation.  Every feature that v5 had PLUS:

NEW in v6
----------
1. Warm-up section per training day
     • General cardiovascular warm-up (3-5 min)
     • Movement-specific dynamic mobility drills
     • Muscle-activation exercises
     • Barbell/dumbbell ramp sets before main compounds
2. Full InBody metric pipeline
     • height, weight, age, gender stored on every inbody record
     • BMI  (WHO categories)
     • BMR  (Mifflin-St Jeor equation)
     • TDEE (BMR × activity factor keyed to training days/week)
     • Visceral Fat Level (1-15 scale)
     • Clinical coaching notes derived from the numbers
3. Cardio prescription
     • Triggered whenever BF-category is "higher"/"obese"
       OR goal == "WeightLoss" OR goal == "Endurance"
     • Protocol varies by BF category (LISS / HIIT / mixed)
     • Includes frequency, duration, HR zone, modalities, progression
4. User session-feedback learning examples
     • Post-session rating + comments → adjusted plan
     • 6 feedback triggers: too_hard, too_easy, pain, low_motivation,
       time_constraint, great_progress
5. Coach-review learning examples
     • Expert coach notes on an existing plan → corrected plan
     • 10 coach-issue types covering volume, sequencing, injuries,
       warm-up, cardio, rep-range errors, etc.
6. DPO preference pairs (Stage-2 training data)
     • Each pair: same prompt → chosen (correct) vs rejected (wrong)
     • Rejected plans intentionally violate one or more principles
     • Saved separately as dpo_pairs_v6.jsonl

Hardware target : RTX 4050 6 GB VRAM
Training method : QLoRA (4-bit NF4 + LoRA adapters)
Stage-2 (opt)   : DPO on preference pairs
"""

import copy
import json
import os
import random
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import torch
from datasets import Dataset
from peft import LoraConfig, TaskType, get_peft_model, prepare_model_for_kbit_training
from tqdm.auto import tqdm
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    set_seed,
)
from trl import SFTConfig, SFTTrainer

# Fix OpenMP conflict on Windows
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
os.environ["USE_TF"] = "NO"
os.environ["USE_TORCH"] = "YES"

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_DIR = Path(__file__).parent
DATA_FILE = (
    SCRIPT_DIR / "data" / "exercises_final_v6.json"
)  # built by build_exercise_db_v6.py
OUTPUT_DIR = SCRIPT_DIR / "models" / "workout-generator-v6"
TRAINING_DATA_FILE = SCRIPT_DIR / "training_data_v6.jsonl"
DPO_DATA_FILE = SCRIPT_DIR / "dpo_pairs_v6.jsonl"
WARMUP_LIB_FILE = (
    SCRIPT_DIR / "data" / "warmup_library_v6.json"
)  # built by build_exercise_db_v6.py
ADVICE_FILE = (
    SCRIPT_DIR / "data" / "advice_examples_v6.jsonl"
)  # built by build_exercise_db_v6.py
EXERCISE_INFO_FILE = (
    SCRIPT_DIR / "data" / "exercise_info_v6.jsonl"
)  # built by build_exercise_db_v6.py

MODEL_NAME = "Qwen/Qwen2.5-3B-Instruct"
MAX_SEQ_LENGTH = 2048
SEED = 42
NUM_SAMPLES = 14000  # More examples to cover new scenario types
NUM_DPO_PAIRS = 3000  # Preference pairs for Stage-2 DPO
NUM_ADVICE_EXAMPLES = 600  # fitness advice Q&A pairs merged into SFT data
NUM_INFO_EXAMPLES = 400  # exercise-info Q&A pairs merged into SFT data

# Training parameters  (RTX 4050 6 GB)
EPOCHS = 3
BATCH_SIZE = 1
GRADIENT_ACCUMULATION = 8
LEARNING_RATE = 1e-4
MAX_GRAD_NORM = 0.3
WARMUP_RATIO = 0.03
WEIGHT_DECAY = 0.001
LR_SCHEDULER = "cosine"

# QLoRA
QLORA_R = 64
QLORA_ALPHA = 16
QLORA_DROPOUT = 0.05
QLORA_TARGET_MODULES = [
    "q_proj",
    "k_proj",
    "v_proj",
    "o_proj",
    "gate_proj",
    "up_proj",
    "down_proj",
]

print("=" * 70)
print("Workout Plan Generator v6 - Qwen2.5-3B + QLoRA")
print("=" * 70)
print(f"PyTorch: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    total_mem = torch.cuda.get_device_properties(0).total_memory / 1e9
    print(f"GPU Memory: {total_mem:.1f} GB")
    torch.backends.cudnn.benchmark = True
else:
    print("WARNING: No GPU. QLoRA requires CUDA.")
print("=" * 70)

set_seed(SEED)

# ============================================================================
# CORE CONSTANTS (carried from v5 + extended)
# ============================================================================

FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced"]
FITNESS_GOALS = ["Strength", "Muscle", "WeightLoss", "Endurance", "General"]
GENDERS = ["male", "female"]

BODY_FAT_CATEGORIES = {
    "lean": (5, 14),
    "normal": (15, 22),
    "higher": (23, 30),
    "obese": (31, 45),
}

MUSCLE_MASS_CATEGORIES = {
    "low": (18, 28),
    "average": (28, 38),
    "high": (38, 55),
}

# WHO BMI categories
BMI_CATEGORIES = {
    "underweight": (0, 18.4),
    "normal": (18.5, 24.9),
    "overweight": (25.0, 29.9),
    "obese": (30.0, 99.9),
}

BODY_PARTS_INJURY = [
    "shoulder",
    "lower_back",
    "upper_back",
    "knee",
    "ankle",
    "wrist",
    "elbow",
    "neck",
    "hip",
]

INJURY_TYPES = ["strain", "sprain", "soreness", "pain", "stiffness", "inflammation"]

SEVERITY_MAP = {
    (1, 3): "mild",
    (4, 6): "moderate",
    (7, 9): "severe",
    (10, 10): "critical",
}

DIFFICULTY_PREFS = ["easier", "normal", "harder"]

RPE_BY_GOAL = {
    "Strength": (8, 10),
    "Muscle": (7, 9),
    "WeightLoss": (6, 8),
    "Endurance": (5, 7),
    "General": (6, 8),
}

COMPOUND_PATTERNS = {
    "squat",
    "hip_hinge",
    "horizontal_push",
    "vertical_push",
    "vertical_pull",
    "horizontal_pull",
    "lunge",
}
ISOLATION_PATTERNS = {
    "elbow_flexion",
    "elbow_extension",
    "knee_extension",
    "knee_flexion",
    "calf",
    "shoulder_raise",
    "core_flexion",
}

PLAN_PROMPTS = [
    "Generate a {days}-day {goal} workout plan",
    "Create a {days}-day {goal} program",
    "Make me a {days} day {goal} routine",
    "I need a {days}-day {goal} workout",
    "{days}-day {goal} split",
    "Build a {days} day {goal} plan",
    "Give me a {goal} workout for {days} days per week",
    "Design a {days}-day {goal} training program",
    "Plan a {days} day {goal} workout routine",
    "{goal} program, {days} days a week",
]

INJURY_ADJUST_PROMPTS = [
    "Adjust my plan for a {part} injury",
    "Modify workout - {part} is injured",
    "Update plan: {part} injury severity {sev}/10",
    "Change exercises for {part} problem",
    "Replace {part} exercises due to injury",
]

# ============================================================================
# NEW v6: WARM-UP LIBRARY
# ============================================================================

WARMUP_LIBRARY = {
    "push": {
        "exercises": [
            {"name": "Arm Circles", "spec": "30s each direction"},
            {"name": "Band Pull-Aparts", "spec": "2x15"},
            {"name": "Bodyweight Push-Up", "spec": "1x10"},
            {"name": "Shoulder Dislocations (band)", "spec": "2x10"},
        ],
        "ramp": "40%x10,60%x6,80%x3 on main compound before working sets",
    },
    "pull": {
        "exercises": [
            {"name": "Dead Hang", "spec": "20-30s"},
            {"name": "Band Face Pulls", "spec": "2x15"},
            {"name": "Scapular Retraction", "spec": "2x12"},
            {"name": "Cat-Cow Stretch", "spec": "2x10"},
        ],
        "ramp": "40%x10,65%x5 on main pull before working sets",
    },
    "legs": {
        "exercises": [
            {"name": "Stationary Bike or Treadmill", "spec": "5min easy"},
            {"name": "Hip Circles", "spec": "2x10 each direction"},
            {"name": "Bodyweight Squat", "spec": "2x15"},
            {"name": "Glute Bridge", "spec": "2x15"},
            {"name": "Leg Swings (front+side)", "spec": "30s each"},
        ],
        "ramp": "40%x10,60%x6,78%x3 on squat/DL before working sets",
    },
    "upper": {
        "exercises": [
            {"name": "Arm Circles", "spec": "30s each direction"},
            {"name": "Band Pull-Aparts", "spec": "2x15"},
            {"name": "Thoracic Foam Roll", "spec": "60s"},
            {"name": "Face Pull with Band", "spec": "2x12"},
        ],
        "ramp": "40%x10,65%x5 on main compound before working sets",
    },
    "lower": {
        "exercises": [
            {"name": "Stationary Bike", "spec": "5min easy"},
            {"name": "Cossack Squat (bodyweight)", "spec": "2x5 each side"},
            {"name": "Nordic Curl Negative", "spec": "1x5 slow"},
            {"name": "Hip Flexor Stretch (90-90)", "spec": "30s each side"},
        ],
        "ramp": "40%x10,60%x6,80%x3 on main lower compound",
    },
    "full_body": {
        "exercises": [
            {"name": "Jump Rope or March in Place", "spec": "3min"},
            {"name": "World's Greatest Stretch", "spec": "2x5 each side"},
            {"name": "Hip Hinge (bodyweight)", "spec": "2x10"},
            {"name": "Band Pull-Aparts", "spec": "1x15"},
        ],
        "ramp": "50%x8 on first compound of each movement pattern",
    },
    "arms": {
        "exercises": [
            {"name": "Wrist Circles", "spec": "30s each direction"},
            {"name": "Band Tricep Pushdown", "spec": "2x15 light"},
            {"name": "Band Curl", "spec": "2x15 light"},
            {"name": "Elbow Circles", "spec": "30s each direction"},
        ],
        "ramp": "50%x12 on first compound before working sets",
    },
}

# ============================================================================
# NEW v6: CARDIO PROTOCOLS
# ============================================================================

CARDIO_PROTOCOLS = {
    "obese": {
        "type": "LISS",
        "sessions_per_week": (3, 5),
        "duration_min": (25, 45),
        "hr_zone": "Zone1-2(50-65%MaxHR)",
        "modalities": ["walking", "stationary_bike", "elliptical", "swimming"],
        "note": "Low-impact only. Avoid high-impact until BF<28%. Goal: insulin sensitivity + cardiovascular health.",
        "progression": "+5min/week until 45min then add 1 session",
    },
    "higher": {
        "type": "LISS+HIIT",
        "sessions_per_week": (2, 4),
        "duration_min": (20, 40),
        "hr_zone": "Zone2-3(60-75%MaxHR) LISS; Zone4(80-90%) HIIT",
        "modalities": ["treadmill", "cycling", "rowing", "jump_rope"],
        "note": "2-3x LISS + 1x HIIT (30s on/30s off x10 rounds) per week.",
        "progression": "+5min LISS/week; HIIT rounds +1/week",
    },
    "weight_loss": {
        "type": "Mixed",
        "sessions_per_week": (3, 4),
        "duration_min": (30, 45),
        "hr_zone": "Zone2(60-70%) primary; 1x Zone4 HIIT per week",
        "modalities": ["any_preferred"],
        "note": "Target 200-500kcal deficit. NEAT (daily steps) equally important.",
        "progression": "+5min or +1 session every 2 weeks",
    },
    "endurance": {
        "type": "Endurance_Cardio",
        "sessions_per_week": (4, 5),
        "duration_min": (30, 60),
        "hr_zone": "Zone2-3(60-80%MaxHR)",
        "modalities": ["running", "cycling", "rowing", "swimming"],
        "note": "Primary training modality. Periodize: easy/moderate/hard weeks.",
        "progression": "+10% volume per week, cutback every 4th week",
    },
    "maintenance": {
        "type": "Optional_Cardio",
        "sessions_per_week": (1, 2),
        "duration_min": (20, 30),
        "hr_zone": "Zone2(60-70%MaxHR)",
        "modalities": ["any_preferred"],
        "note": "Optional for cardiovascular health. Resistance training is the priority.",
        "progression": "N/A - maintenance only",
    },
}

# ============================================================================
# NEW v6: SESSION FEEDBACK SCENARIOS
# ============================================================================

SESSION_FEEDBACK_SCENARIOS = [
    {
        "trigger": "too_hard",
        "rating_range": (1.5, 3.0),
        "comments": [
            "exercises were too heavy, could not complete all sets",
            "RPE was consistently higher than prescribed - feeling beaten up",
            "can't recover between sessions, still sore 3 days later",
            "form was breaking down by the 3rd set on most exercises",
        ],
        "model_action": "reduce_load",
        "adjustment": "Reduce sets by 1 per compound, increase rep range by 2-3, "
        "raise RIR target by 1 point, add 30s extra rest between sets. "
        "If deload week not scheduled, insert one now.",
    },
    {
        "trigger": "too_easy",
        "rating_range": (4.0, 5.0),
        "comments": [
            "sessions feel too easy - lots left in the tank after every workout",
            "prescribed weights feel too light after the first week",
            "hitting the top rep range easily, need more challenge",
            "could easily do 3-4 more reps on every exercise",
        ],
        "model_action": "increase_load",
        "adjustment": "Add 1 working set to each compound, reduce rest periods by 15s, "
        "increase load 5-10%, drop RIR target by 1. "
        "Advance to next mesocycle week if pattern persists.",
    },
    {
        "trigger": "pain_during_exercise",
        "rating_range": (2.0, 3.5),
        "comments": [
            "felt sharp pain in joint during an exercise",
            "shoulder clicking and discomfort on pressing movements",
            "lower back tightness/pain during deadlifts",
            "knee pain on squats even with modification cues",
        ],
        "model_action": "escalate_injury_and_modify",
        "adjustment": "Replace pain-inducing exercise with cable/machine alternative. "
        "Escalate injury severity by +2 points. Add *PAIN_MONITOR marker. "
        "Recommend professional assessment if pain persists beyond 2 sessions.",
    },
    {
        "trigger": "low_motivation",
        "rating_range": (2.5, 3.5),
        "comments": [
            "exercises feel boring and repetitive - not enjoying workouts",
            "the current split does not suit my schedule/preferences",
            "I prefer different exercise variations",
            "monotonous - same exercises every week",
        ],
        "model_action": "increase_variety",
        "adjustment": "Swap 30-40% of exercises with movement-equivalent alternatives. "
        "Consider changing split template if on same one for >3 weeks. "
        "Introduce 1 novel exercise per day to maintain engagement.",
    },
    {
        "trigger": "time_constraint",
        "rating_range": (3.0, 4.0),
        "comments": [
            "sessions taking over 90 minutes - too long",
            "can only train for 45 minutes maximum",
            "need shorter, more efficient workouts",
            "life got busier - need condensed plan",
        ],
        "model_action": "reduce_volume_and_superset",
        "adjustment": "Switch isolation work to supersets (antagonist pairs). "
        "Remove 1-2 isolation exercises per day. "
        "Target 45-55 min sessions. Reduce rest to 60s for isolation, 120s for compounds.",
    },
    {
        "trigger": "great_progress",
        "rating_range": (4.5, 5.0),
        "comments": [
            "making excellent progress - weights going up every session",
            "feeling stronger, looking better, perfect difficulty",
            "loving the plan, everything is working great",
            "hitting new personal bests consistently",
        ],
        "model_action": "maintain_and_progress",
        "adjustment": "Continue current structure. Apply progressive overload: "
        "+2.5kg upper/+5kg lower on main compounds when top reps achieved. "
        "Plan next mesocycle deload for 2 weeks out.",
    },
]

# ============================================================================
# NEW v6: COACH REVIEW SCENARIOS
# ============================================================================

COACH_REVIEW_SCENARIOS = [
    {
        "issue": "excessive_arm_volume",
        "note": "Direct arm isolation volume is too high. Biceps/triceps already trained "
        "through compound rows, presses and pull-ups. Reduce isolation arm work by 50%.",
        "fix": "Remove 1-2 isolation arm exercises per training day. "
        "Arms receive sufficient indirect volume from compounds.",
    },
    {
        "issue": "insufficient_leg_volume",
        "note": "Leg training volume is below MEV for quadriceps and hamstrings. "
        "Missing at least 2-3 weekly working sets per muscle group.",
        "fix": "Add one more compound leg movement per leg day. "
        "Ensure both quad and hamstring MEV landmarks are met.",
    },
    {
        "issue": "poor_exercise_sequencing",
        "note": "Isolation exercises placed before compound movements. "
        "Pre-fatiguing isolation work reduces compound performance and injury risk increases.",
        "fix": "Reorder to: compound movements first (larger → smaller muscle), "
        "isolation last. Never fatigue a synergist before the main compound.",
    },
    {
        "issue": "injury_protocol_violation",
        "note": "Exercises that are contraindicated for the user's reported injury are included. "
        "This is a safety risk and must be corrected immediately.",
        "fix": "Remove all exercises flagged for the injured body part. "
        "Replace with approved machine/cable alternatives from the same movement pattern.",
    },
    {
        "issue": "insufficient_recovery_between_same_muscles",
        "note": "Same muscle group trained on consecutive days without 48 h recovery. "
        "This leads to cumulative fatigue, reduced adaptation, and injury risk.",
        "fix": "Reorganise schedule to guarantee minimum 48 h between sessions "
        "targeting the same primary muscle group.",
    },
    {
        "issue": "volume_exceeds_mrv",
        "note": "Weekly sets for a muscle group exceed that muscle's MRV. "
        "Overreaching will occur within 2-3 weeks, stalling progress.",
        "fix": "Reduce weekly sets to within the MAV range. "
        "Distribute excess volume across more training days rather than piling into one.",
    },
    {
        "issue": "missing_warmup",
        "note": "Plan has no warm-up protocol. Skipping warm-up elevates injury risk "
        "substantially, especially for compound movements.",
        "fix": "Add a structured warm-up to every training day: "
        "3-5 min general cardiovascular work + movement-specific mobility + "
        "muscle activation + ramp sets on the first compound.",
    },
    {
        "issue": "no_cardio_for_high_bf",
        "note": "User's InBody shows elevated body fat but no cardiovascular work is prescribed. "
        "Cardio is essential for fat loss, cardiovascular health, and metabolic improvements.",
        "fix": "Add 2-3 cardio sessions per week appropriate to BF category. "
        "Prioritise LISS for obese users; LISS + HIIT mix for 'higher' BF category.",
    },
    {
        "issue": "wrong_rep_range_for_goal",
        "note": "Rep ranges do not match the stated training goal. "
        "Strength: 3-6 reps | Hypertrophy: 8-12 reps | Endurance: 15+ reps.",
        "fix": "Adjust all working sets to goal-appropriate rep ranges. "
        "Rest periods should also be corrected: Strength 2-3 min, Hypertrophy 60-90 s, Endurance 30-45 s.",
    },
    {
        "issue": "beginner_on_advanced_exercises",
        "note": "High-skill / high-technique exercises (Olympic lifts, heavy barbell work) "
        "prescribed to a beginner before foundational movement competency is established.",
        "fix": "Replace advanced movements with beginner-appropriate alternatives. "
        "Master goblet squat before barbell squat; DB bench before barbell bench, etc.",
    },
]

# ============================================================================
# SPLIT TEMPLATES
# ============================================================================

SPLIT_TEMPLATES = {
    3: [
        {
            "name": "Push/Pull/Legs",
            "days": [
                {
                    "name": "Push",
                    "patterns": [
                        "horizontal_push",
                        "vertical_push",
                        "elbow_extension",
                        "shoulder_raise",
                    ],
                    "muscles": ["chest", "shoulders", "triceps"],
                },
                {
                    "name": "Pull",
                    "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"],
                    "muscles": ["lats", "middle back", "biceps"],
                },
                {
                    "name": "Legs",
                    "patterns": ["squat", "hip_hinge", "lunge", "calf", "core_flexion"],
                    "muscles": ["quadriceps", "hamstrings", "glutes", "calves"],
                },
            ],
        },
        {
            "name": "Full Body x3",
            "days": [
                {
                    "name": "Full Body A",
                    "patterns": [
                        "horizontal_push",
                        "vertical_pull",
                        "squat",
                        "core_flexion",
                    ],
                    "muscles": ["chest", "lats", "quadriceps", "abdominals"],
                },
                {
                    "name": "Full Body B",
                    "patterns": [
                        "vertical_push",
                        "horizontal_pull",
                        "hip_hinge",
                        "elbow_flexion",
                    ],
                    "muscles": ["shoulders", "middle back", "hamstrings", "biceps"],
                },
                {
                    "name": "Full Body C",
                    "patterns": [
                        "horizontal_push",
                        "horizontal_pull",
                        "lunge",
                        "elbow_extension",
                    ],
                    "muscles": ["chest", "lats", "glutes", "triceps"],
                },
            ],
        },
    ],
    4: [
        {
            "name": "Upper/Lower",
            "days": [
                {
                    "name": "Upper A",
                    "patterns": [
                        "horizontal_push",
                        "horizontal_pull",
                        "elbow_extension",
                        "elbow_flexion",
                    ],
                    "muscles": ["chest", "lats", "triceps", "biceps"],
                },
                {
                    "name": "Lower A",
                    "patterns": ["squat", "hip_hinge", "calf", "core_flexion"],
                    "muscles": ["quadriceps", "hamstrings", "calves", "abdominals"],
                },
                {
                    "name": "Upper B",
                    "patterns": [
                        "vertical_push",
                        "vertical_pull",
                        "shoulder_raise",
                        "elbow_flexion",
                    ],
                    "muscles": ["shoulders", "middle back", "biceps"],
                },
                {
                    "name": "Lower B",
                    "patterns": ["hip_hinge", "lunge", "squat", "calf"],
                    "muscles": ["hamstrings", "glutes", "quadriceps", "calves"],
                },
            ],
        },
        {
            "name": "Push/Pull/Legs/Arms",
            "days": [
                {
                    "name": "Push",
                    "patterns": ["horizontal_push", "vertical_push", "elbow_extension"],
                    "muscles": ["chest", "shoulders", "triceps"],
                },
                {
                    "name": "Pull",
                    "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"],
                    "muscles": ["lats", "middle back", "biceps"],
                },
                {
                    "name": "Legs",
                    "patterns": ["squat", "hip_hinge", "lunge", "calf"],
                    "muscles": ["quadriceps", "hamstrings", "glutes", "calves"],
                },
                {
                    "name": "Arms+Abs",
                    "patterns": [
                        "elbow_flexion",
                        "elbow_extension",
                        "shoulder_raise",
                        "core_flexion",
                    ],
                    "muscles": ["biceps", "triceps", "shoulders", "abdominals"],
                },
            ],
        },
    ],
    5: [
        {
            "name": "Bro Split",
            "days": [
                {
                    "name": "Chest",
                    "patterns": ["horizontal_push", "elbow_extension"],
                    "muscles": ["chest", "triceps"],
                },
                {
                    "name": "Back",
                    "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"],
                    "muscles": ["lats", "middle back", "biceps"],
                },
                {
                    "name": "Shoulders",
                    "patterns": ["vertical_push", "shoulder_raise", "core_flexion"],
                    "muscles": ["shoulders", "abdominals"],
                },
                {
                    "name": "Legs",
                    "patterns": ["squat", "hip_hinge", "lunge", "calf"],
                    "muscles": ["quadriceps", "hamstrings", "glutes", "calves"],
                },
                {
                    "name": "Arms",
                    "patterns": ["elbow_flexion", "elbow_extension", "shoulder_raise"],
                    "muscles": ["biceps", "triceps", "forearms"],
                },
            ],
        },
        {
            "name": "ULPPL",
            "days": [
                {
                    "name": "Upper",
                    "patterns": [
                        "horizontal_push",
                        "horizontal_pull",
                        "elbow_extension",
                        "elbow_flexion",
                    ],
                    "muscles": ["chest", "lats", "triceps", "biceps"],
                },
                {
                    "name": "Lower",
                    "patterns": ["squat", "hip_hinge", "lunge", "calf"],
                    "muscles": ["quadriceps", "hamstrings", "glutes", "calves"],
                },
                {
                    "name": "Push",
                    "patterns": [
                        "horizontal_push",
                        "vertical_push",
                        "elbow_extension",
                        "shoulder_raise",
                    ],
                    "muscles": ["chest", "shoulders", "triceps"],
                },
                {
                    "name": "Pull",
                    "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"],
                    "muscles": ["lats", "middle back", "biceps"],
                },
                {
                    "name": "Legs+Abs",
                    "patterns": ["squat", "hip_hinge", "lunge", "calf", "core_flexion"],
                    "muscles": [
                        "quadriceps",
                        "hamstrings",
                        "glutes",
                        "calves",
                        "abdominals",
                    ],
                },
            ],
        },
    ],
    6: [
        {
            "name": "PPL x2",
            "days": [
                {
                    "name": "Push A",
                    "patterns": [
                        "horizontal_push",
                        "vertical_push",
                        "elbow_extension",
                        "shoulder_raise",
                    ],
                    "muscles": ["chest", "shoulders", "triceps"],
                },
                {
                    "name": "Pull A",
                    "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"],
                    "muscles": ["lats", "middle back", "biceps"],
                },
                {
                    "name": "Legs A",
                    "patterns": ["squat", "hip_hinge", "lunge", "calf", "core_flexion"],
                    "muscles": ["quadriceps", "hamstrings", "glutes", "calves"],
                },
                {
                    "name": "Push B",
                    "patterns": [
                        "horizontal_push",
                        "vertical_push",
                        "elbow_extension",
                        "shoulder_raise",
                    ],
                    "muscles": ["chest", "shoulders", "triceps"],
                },
                {
                    "name": "Pull B",
                    "patterns": ["horizontal_pull", "vertical_pull", "elbow_flexion"],
                    "muscles": ["middle back", "lats", "biceps"],
                },
                {
                    "name": "Legs B",
                    "patterns": ["hip_hinge", "lunge", "knee_flexion", "calf"],
                    "muscles": ["hamstrings", "glutes", "calves"],
                },
            ],
        },
    ],
}

# ============================================================================
# INJURY RULES
# ============================================================================

INJURY_RULES = {
    "shoulder": {
        "avoid_patterns_moderate": {"vertical_push", "shoulder_raise"},
        "avoid_patterns_severe": {"vertical_push", "shoulder_raise", "horizontal_push"},
        "related_muscles": {"shoulders"},
        "mild_note": "use lighter weight on overhead movements",
        "moderate_note": "avoid overhead pressing, use machines instead",
        "severe_note": "skip all shoulder-dominant exercises",
    },
    "lower_back": {
        "avoid_patterns_moderate": {"hip_hinge"},
        "avoid_patterns_severe": {"hip_hinge", "squat", "lunge"},
        "related_muscles": {"lower back", "glutes", "hamstrings"},
        "mild_note": "brace core tight, avoid spinal rounding",
        "moderate_note": "replace free-weight hinges with machines",
        "severe_note": "skip deadlifts, squats and bent rows entirely",
    },
    "knee": {
        "avoid_patterns_moderate": {"squat", "lunge"},
        "avoid_patterns_severe": {
            "squat",
            "lunge",
            "knee_extension",
            "knee_flexion",
            "calf",
        },
        "related_muscles": {"quadriceps", "hamstrings", "calves"},
        "mild_note": "limit depth on squats, avoid jumping",
        "moderate_note": "use leg press or machines instead of squats",
        "severe_note": "skip all knee-flexion and direct leg exercises",
    },
    "wrist": {
        "avoid_patterns_moderate": {"horizontal_push"},
        "avoid_patterns_severe": {
            "horizontal_push",
            "horizontal_pull",
            "elbow_flexion",
        },
        "related_muscles": {"forearms"},
        "mild_note": "use wrist wraps, neutral grip preferred",
        "moderate_note": "use machines or cables instead of free weights",
        "severe_note": "skip all gripping exercises, machines only",
    },
    "elbow": {
        "avoid_patterns_moderate": {"elbow_flexion", "elbow_extension"},
        "avoid_patterns_severe": {
            "elbow_flexion",
            "elbow_extension",
            "horizontal_push",
            "horizontal_pull",
        },
        "related_muscles": {"biceps", "triceps", "forearms"},
        "mild_note": "reduce isolation arm volume",
        "moderate_note": "skip direct arm work, compounds only",
        "severe_note": "avoid all elbow-stressing movements",
    },
    "hip": {
        "avoid_patterns_moderate": {"squat", "hip_hinge", "lunge"},
        "avoid_patterns_severe": {
            "squat",
            "hip_hinge",
            "lunge",
            "knee_extension",
            "knee_flexion",
        },
        "related_muscles": {"glutes", "hamstrings", "quadriceps"},
        "mild_note": "limit hip flexion range of motion",
        "moderate_note": "use machines, avoid deep squats",
        "severe_note": "skip all hip-dominant exercises",
    },
    "ankle": {
        "avoid_patterns_moderate": {"squat", "calf", "lunge"},
        "avoid_patterns_severe": {"squat", "calf", "lunge", "hip_hinge"},
        "related_muscles": {"calves"},
        "mild_note": "use heel elevation on squats",
        "moderate_note": "seated exercises preferred",
        "severe_note": "skip all standing lower body exercises",
    },
    "neck": {
        "avoid_patterns_moderate": set(),
        "avoid_patterns_severe": {"vertical_push"},
        "related_muscles": {"neck", "traps"},
        "mild_note": "avoid exercises with direct neck strain",
        "moderate_note": "skip overhead pressing",
        "severe_note": "skip all exercises with neck load",
    },
    "upper_back": {
        "avoid_patterns_moderate": {"horizontal_pull"},
        "avoid_patterns_severe": {"horizontal_pull", "vertical_pull"},
        "related_muscles": {"middle back", "lats", "traps"},
        "mild_note": "limit rowing volume",
        "moderate_note": "use machines for all back work",
        "severe_note": "skip heavy pulling movements",
    },
}

# ============================================================================
# VOLUME LANDMARKS  (RP Strength research data)
# ============================================================================

VOLUME_LANDMARKS = {
    "chest": {"MV": 4, "MEV": 6, "MAV": (10, 16), "MRV": 22, "freq": (2, 4)},
    "shoulders": {"MV": 4, "MEV": 6, "MAV": (8, 16), "MRV": 22, "freq": (2, 4)},
    "triceps": {"MV": 2, "MEV": 4, "MAV": (6, 10), "MRV": 14, "freq": (2, 4)},
    "biceps": {"MV": 2, "MEV": 4, "MAV": (8, 14), "MRV": 20, "freq": (2, 4)},
    "lats": {"MV": 4, "MEV": 6, "MAV": (10, 16), "MRV": 20, "freq": (2, 4)},
    "middle back": {"MV": 4, "MEV": 6, "MAV": (10, 16), "MRV": 20, "freq": (2, 4)},
    "traps": {"MV": 0, "MEV": 4, "MAV": (6, 12), "MRV": 20, "freq": (2, 4)},
    "quadriceps": {"MV": 4, "MEV": 6, "MAV": (8, 14), "MRV": 18, "freq": (2, 5)},
    "hamstrings": {"MV": 3, "MEV": 4, "MAV": (6, 12), "MRV": 16, "freq": (2, 3)},
    "glutes": {"MV": 0, "MEV": 2, "MAV": (4, 12), "MRV": 16, "freq": (2, 4)},
    "calves": {"MV": 4, "MEV": 6, "MAV": (8, 16), "MRV": 20, "freq": (3, 6)},
    "abdominals": {"MV": 0, "MEV": 4, "MAV": (6, 16), "MRV": 20, "freq": (3, 6)},
    "forearms": {"MV": 0, "MEV": 2, "MAV": (4, 8), "MRV": 12, "freq": (2, 4)},
    "lower back": {"MV": 0, "MEV": 2, "MAV": (4, 8), "MRV": 10, "freq": (2, 3)},
    "adductors": {"MV": 0, "MEV": 2, "MAV": (4, 8), "MRV": 12, "freq": (2, 3)},
    "abductors": {"MV": 0, "MEV": 2, "MAV": (4, 8), "MRV": 12, "freq": (2, 3)},
    "neck": {"MV": 0, "MEV": 2, "MAV": (3, 6), "MRV": 10, "freq": (2, 4)},
}

# ============================================================================
# PERIODIZATION
# ============================================================================

MESOCYCLE_CONFIGS = {
    "beginner": {"weeks": 4, "accumulation": 3, "deload": 1},
    "intermediate": {"weeks": 5, "accumulation": 4, "deload": 1},
    "advanced": {"weeks": 6, "accumulation": 5, "deload": 1},
}

RIR_BY_WEEK = {
    3: [3, 2, 1],
    4: [4, 3, 2, 1],
    5: [4, 3, 2, 1, 0],
}

VOLUME_RAMP = {
    3: [0.0, 0.4, 0.8],
    4: [0.0, 0.3, 0.6, 0.9],
    5: [0.0, 0.2, 0.4, 0.7, 1.0],
}

PROGRESSIVE_OVERLOAD = {
    "Strength": {
        "method": "Linear Periodization",
        "protocol": "+2.5kg upper/+5kg lower per session when all reps completed",
        "weekly": "If stalled: micro-load +1.25kg or add 1 set",
        "deload": "Drop to 60% of working weight, keep sets, RPE 5-6",
    },
    "Muscle": {
        "method": "Double Progression",
        "protocol": "Hit top of rep range on all sets → +2.5-5% load",
        "weekly": "Add 1 set per muscle group per week up to MRV",
        "deload": "Drop volume to MEV, keep intensity, RPE 5-6",
    },
    "WeightLoss": {
        "method": "Rep Progression",
        "protocol": "Increase reps before weight; reduce rest 10s per week",
        "weekly": "+1-2 reps per set or -5s rest",
        "deload": "Reduce volume 50%, maintain movement quality",
    },
    "Endurance": {
        "method": "Volume + Density",
        "protocol": "Add reps weekly; reduce rest 5-10s per week",
        "weekly": "+2 reps per set or +1 set if plateau",
        "deload": "Reduce total sets 40%, keep rep range",
    },
    "General": {
        "method": "Undulating Periodization",
        "protocol": "Rotate heavy(5-8)/moderate(8-12)/light(12-15) across week",
        "weekly": "W1 moderate, W2 heavy, W3 light, W4 moderate+",
        "deload": "Light week every 4th week, 60% volume",
    },
}

REST_DAY_SCHEDULES = {
    3: [
        [
            "Mon:train",
            "Tue:rest",
            "Wed:train",
            "Thu:rest",
            "Fri:train",
            "Sat:rest",
            "Sun:rest",
        ],
        [
            "Mon:train",
            "Tue:rest",
            "Wed:rest",
            "Thu:train",
            "Fri:rest",
            "Sat:train",
            "Sun:rest",
        ],
    ],
    4: [
        [
            "Mon:train",
            "Tue:train",
            "Wed:rest",
            "Thu:train",
            "Fri:train",
            "Sat:rest",
            "Sun:rest",
        ],
        [
            "Mon:train",
            "Tue:rest",
            "Wed:train",
            "Thu:rest",
            "Fri:train",
            "Sat:train",
            "Sun:rest",
        ],
    ],
    5: [
        [
            "Mon:train",
            "Tue:train",
            "Wed:rest",
            "Thu:train",
            "Fri:train",
            "Sat:train",
            "Sun:rest",
        ],
        [
            "Mon:train",
            "Tue:train",
            "Wed:train",
            "Thu:rest",
            "Fri:train",
            "Sat:train",
            "Sun:rest",
        ],
    ],
    6: [
        [
            "Mon:train",
            "Tue:train",
            "Wed:train",
            "Thu:rest",
            "Fri:train",
            "Sat:train",
            "Sun:train",
        ],
    ],
}

# ============================================================================
# EXPERT PROGRAMS
# ============================================================================

EXPERT_PROGRAMS = {
    "Starting Strength 5x5": {
        "goal": "Strength",
        "level": "Beginner",
        "days": 3,
        "split_name": "Full Body A/B",
        "description": "Mark Rippetoe's linear progression novice program",
        "schedule": ["Mon", "Wed", "Fri"],
        "workouts": [
            {
                "name": "Workout A",
                "exercises": [
                    {
                        "pattern": "squat",
                        "name_hint": "barbell squat",
                        "sets": 5,
                        "reps": "5",
                        "rest": 180,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_push",
                        "name_hint": "barbell bench",
                        "sets": 5,
                        "reps": "5",
                        "rest": 180,
                        "mech": "C",
                    },
                    {
                        "pattern": "hip_hinge",
                        "name_hint": "barbell deadlift",
                        "sets": 1,
                        "reps": "5",
                        "rest": 300,
                        "mech": "C",
                    },
                ],
            },
            {
                "name": "Workout B",
                "exercises": [
                    {
                        "pattern": "squat",
                        "name_hint": "barbell squat",
                        "sets": 5,
                        "reps": "5",
                        "rest": 180,
                        "mech": "C",
                    },
                    {
                        "pattern": "vertical_push",
                        "name_hint": "overhead press",
                        "sets": 5,
                        "reps": "5",
                        "rest": 180,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_pull",
                        "name_hint": "barbell row",
                        "sets": 5,
                        "reps": "5",
                        "rest": 180,
                        "mech": "C",
                    },
                ],
            },
            {
                "name": "Workout A",
                "exercises": [
                    {
                        "pattern": "squat",
                        "name_hint": "barbell squat",
                        "sets": 5,
                        "reps": "5",
                        "rest": 180,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_push",
                        "name_hint": "barbell bench",
                        "sets": 5,
                        "reps": "5",
                        "rest": 180,
                        "mech": "C",
                    },
                    {
                        "pattern": "hip_hinge",
                        "name_hint": "barbell deadlift",
                        "sets": 1,
                        "reps": "5",
                        "rest": 300,
                        "mech": "C",
                    },
                ],
            },
        ],
        "progression": "Linear:+2.5kg upper/+5kg lower each session",
        "deload": "Every 3-4w when 3 consecutive stalls, drop 10%",
    },
    "Wendler 5/3/1": {
        "goal": "Strength",
        "level": "Intermediate",
        "days": 4,
        "split_name": "Wendler 5/3/1",
        "description": "Jim Wendler's 4-week wave periodization program",
        "schedule": ["Mon", "Tue", "Thu", "Fri"],
        "workouts": [
            {
                "name": "OHP Day",
                "exercises": [
                    {
                        "pattern": "vertical_push",
                        "name_hint": "barbell overhead",
                        "sets": 3,
                        "reps": "5/3/1+",
                        "rest": 180,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_push",
                        "name_hint": "dumbbell bench",
                        "sets": 5,
                        "reps": "10",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_pull",
                        "name_hint": "row",
                        "sets": 5,
                        "reps": "10",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "elbow_extension",
                        "name_hint": "tricep",
                        "sets": 3,
                        "reps": "10-15",
                        "rest": 60,
                        "mech": "I",
                    },
                    {
                        "pattern": "shoulder_raise",
                        "name_hint": "lateral raise",
                        "sets": 3,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                ],
            },
            {
                "name": "Deadlift Day",
                "exercises": [
                    {
                        "pattern": "hip_hinge",
                        "name_hint": "barbell deadlift",
                        "sets": 3,
                        "reps": "5/3/1+",
                        "rest": 240,
                        "mech": "C",
                    },
                    {
                        "pattern": "squat",
                        "name_hint": "leg press",
                        "sets": 5,
                        "reps": "10",
                        "rest": 120,
                        "mech": "C",
                    },
                    {
                        "pattern": "knee_flexion",
                        "name_hint": "leg curl",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "I",
                    },
                    {
                        "pattern": "core_flexion",
                        "name_hint": "ab",
                        "sets": 3,
                        "reps": "10-15",
                        "rest": 60,
                        "mech": "I",
                    },
                ],
            },
            {
                "name": "Bench Day",
                "exercises": [
                    {
                        "pattern": "horizontal_push",
                        "name_hint": "barbell bench",
                        "sets": 3,
                        "reps": "5/3/1+",
                        "rest": 180,
                        "mech": "C",
                    },
                    {
                        "pattern": "vertical_push",
                        "name_hint": "dumbbell press",
                        "sets": 5,
                        "reps": "10",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "vertical_pull",
                        "name_hint": "pull",
                        "sets": 5,
                        "reps": "10",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "elbow_flexion",
                        "name_hint": "curl",
                        "sets": 3,
                        "reps": "10-15",
                        "rest": 60,
                        "mech": "I",
                    },
                ],
            },
            {
                "name": "Squat Day",
                "exercises": [
                    {
                        "pattern": "squat",
                        "name_hint": "barbell squat",
                        "sets": 3,
                        "reps": "5/3/1+",
                        "rest": 240,
                        "mech": "C",
                    },
                    {
                        "pattern": "hip_hinge",
                        "name_hint": "romanian deadlift",
                        "sets": 5,
                        "reps": "10",
                        "rest": 120,
                        "mech": "C",
                    },
                    {
                        "pattern": "lunge",
                        "name_hint": "lunge",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "calf",
                        "name_hint": "calf raise",
                        "sets": 4,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                ],
            },
        ],
        "progression": "Wave:W1=5x65/75/85%,W2=3x70/80/90%,W3=5/3/1x75/85/95%,W4=deload",
        "deload": "Every 4th week, 40-60% of TM, 5x5",
    },
    "PHUL": {
        "goal": "Muscle",
        "level": "Intermediate",
        "days": 4,
        "split_name": "PHUL",
        "description": "Power Hypertrophy Upper Lower",
        "schedule": ["Mon", "Tue", "Thu", "Fri"],
        "workouts": [
            {
                "name": "Upper Power",
                "exercises": [
                    {
                        "pattern": "horizontal_push",
                        "name_hint": "barbell bench",
                        "sets": 4,
                        "reps": "3-5",
                        "rest": 180,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_pull",
                        "name_hint": "barbell row",
                        "sets": 4,
                        "reps": "3-5",
                        "rest": 180,
                        "mech": "C",
                    },
                    {
                        "pattern": "vertical_push",
                        "name_hint": "overhead press",
                        "sets": 3,
                        "reps": "5-8",
                        "rest": 120,
                        "mech": "C",
                    },
                    {
                        "pattern": "vertical_pull",
                        "name_hint": "pull-up",
                        "sets": 3,
                        "reps": "5-8",
                        "rest": 120,
                        "mech": "C",
                    },
                    {
                        "pattern": "elbow_flexion",
                        "name_hint": "barbell curl",
                        "sets": 2,
                        "reps": "6-10",
                        "rest": 90,
                        "mech": "I",
                    },
                    {
                        "pattern": "elbow_extension",
                        "name_hint": "skull crusher",
                        "sets": 2,
                        "reps": "6-10",
                        "rest": 90,
                        "mech": "I",
                    },
                ],
            },
            {
                "name": "Lower Power",
                "exercises": [
                    {
                        "pattern": "squat",
                        "name_hint": "barbell squat",
                        "sets": 4,
                        "reps": "3-5",
                        "rest": 240,
                        "mech": "C",
                    },
                    {
                        "pattern": "hip_hinge",
                        "name_hint": "barbell deadlift",
                        "sets": 4,
                        "reps": "3-5",
                        "rest": 240,
                        "mech": "C",
                    },
                    {
                        "pattern": "squat",
                        "name_hint": "leg press",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 120,
                        "mech": "C",
                    },
                    {
                        "pattern": "knee_flexion",
                        "name_hint": "leg curl",
                        "sets": 3,
                        "reps": "6-10",
                        "rest": 90,
                        "mech": "I",
                    },
                    {
                        "pattern": "calf",
                        "name_hint": "calf raise",
                        "sets": 4,
                        "reps": "6-10",
                        "rest": 90,
                        "mech": "I",
                    },
                ],
            },
            {
                "name": "Upper Hypertrophy",
                "exercises": [
                    {
                        "pattern": "horizontal_push",
                        "name_hint": "incline dumbbell",
                        "sets": 4,
                        "reps": "8-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_pull",
                        "name_hint": "cable row",
                        "sets": 4,
                        "reps": "8-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_push",
                        "name_hint": "fly",
                        "sets": 3,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                    {
                        "pattern": "vertical_pull",
                        "name_hint": "lat pulldown",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "shoulder_raise",
                        "name_hint": "lateral raise",
                        "sets": 3,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                    {
                        "pattern": "elbow_flexion",
                        "name_hint": "hammer curl",
                        "sets": 3,
                        "reps": "10-15",
                        "rest": 60,
                        "mech": "I",
                    },
                ],
            },
            {
                "name": "Lower Hypertrophy",
                "exercises": [
                    {
                        "pattern": "squat",
                        "name_hint": "front squat",
                        "sets": 4,
                        "reps": "8-12",
                        "rest": 120,
                        "mech": "C",
                    },
                    {
                        "pattern": "hip_hinge",
                        "name_hint": "romanian deadlift",
                        "sets": 4,
                        "reps": "8-12",
                        "rest": 120,
                        "mech": "C",
                    },
                    {
                        "pattern": "lunge",
                        "name_hint": "lunge",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "knee_extension",
                        "name_hint": "leg extension",
                        "sets": 3,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                    {
                        "pattern": "knee_flexion",
                        "name_hint": "leg curl",
                        "sets": 3,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                    {
                        "pattern": "calf",
                        "name_hint": "calf raise",
                        "sets": 4,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                ],
            },
        ],
        "progression": "Double:upper+2.5kg/lower+5kg when all reps completed",
        "deload": "Every 4-6w, volume -40%, intensity -20%",
    },
    "Full Body Beginner": {
        "goal": "General",
        "level": "Beginner",
        "days": 3,
        "split_name": "Full Body 3x/wk",
        "description": "ACSM guideline-based beginner full body program",
        "schedule": ["Mon", "Wed", "Fri"],
        "workouts": [
            {
                "name": "Full Body A",
                "exercises": [
                    {
                        "pattern": "squat",
                        "name_hint": "goblet squat",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_push",
                        "name_hint": "dumbbell bench",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_pull",
                        "name_hint": "cable row",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "vertical_push",
                        "name_hint": "dumbbell press",
                        "sets": 2,
                        "reps": "10-12",
                        "rest": 60,
                        "mech": "C",
                    },
                    {
                        "pattern": "core_flexion",
                        "name_hint": "plank",
                        "sets": 3,
                        "reps": "30-60s",
                        "rest": 60,
                        "mech": "I",
                    },
                ],
            },
            {
                "name": "Full Body B",
                "exercises": [
                    {
                        "pattern": "hip_hinge",
                        "name_hint": "romanian deadlift",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 120,
                        "mech": "C",
                    },
                    {
                        "pattern": "vertical_push",
                        "name_hint": "overhead press",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "vertical_pull",
                        "name_hint": "lat pulldown",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "lunge",
                        "name_hint": "lunge",
                        "sets": 2,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "elbow_flexion",
                        "name_hint": "dumbbell curl",
                        "sets": 2,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                ],
            },
            {
                "name": "Full Body C",
                "exercises": [
                    {
                        "pattern": "squat",
                        "name_hint": "leg press",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 120,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_push",
                        "name_hint": "push-up",
                        "sets": 3,
                        "reps": "8-15",
                        "rest": 60,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_pull",
                        "name_hint": "dumbbell row",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "elbow_extension",
                        "name_hint": "tricep",
                        "sets": 2,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                    {
                        "pattern": "core_flexion",
                        "name_hint": "crunch",
                        "sets": 3,
                        "reps": "15-20",
                        "rest": 60,
                        "mech": "I",
                    },
                ],
            },
        ],
        "progression": "Linear:+2.5kg when 3x12 completed with RPE<8",
        "deload": "Every 4w, reduce weight 20%, same reps",
    },
    "PPL Hypertrophy": {
        "goal": "Muscle",
        "level": "Advanced",
        "days": 6,
        "split_name": "PPL x2 (RP Style)",
        "description": "RP Strength-inspired PPL with MEV/MAV/MRV volume landmarks, compound-first exercise ordering",
        "schedule": ["Mon", "Tue", "Wed", "Fri", "Sat", "Sun"],
        "workouts": [
            {
                "name": "Push A (Heavy)",
                "exercises": [
                    {
                        "pattern": "horizontal_push",
                        "name_hint": "barbell bench",
                        "sets": 4,
                        "reps": "6-8",
                        "rest": 150,
                        "mech": "C",
                    },
                    {
                        "pattern": "vertical_push",
                        "name_hint": "overhead press",
                        "sets": 3,
                        "reps": "6-8",
                        "rest": 120,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_push",
                        "name_hint": "incline dumbbell",
                        "sets": 3,
                        "reps": "8-10",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "shoulder_raise",
                        "name_hint": "lateral raise",
                        "sets": 3,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                    {
                        "pattern": "elbow_extension",
                        "name_hint": "cable pushdown",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 60,
                        "mech": "I",
                    },
                ],
            },
            {
                "name": "Pull A (Heavy)",
                "exercises": [
                    {
                        "pattern": "horizontal_pull",
                        "name_hint": "barbell row",
                        "sets": 4,
                        "reps": "6-8",
                        "rest": 150,
                        "mech": "C",
                    },
                    {
                        "pattern": "vertical_pull",
                        "name_hint": "pull-up",
                        "sets": 3,
                        "reps": "6-8",
                        "rest": 120,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_pull",
                        "name_hint": "cable row",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "elbow_flexion",
                        "name_hint": "barbell curl",
                        "sets": 3,
                        "reps": "8-10",
                        "rest": 60,
                        "mech": "I",
                    },
                    {
                        "pattern": "elbow_flexion",
                        "name_hint": "hammer curl",
                        "sets": 2,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                ],
            },
            {
                "name": "Legs A (Quad Focus)",
                "exercises": [
                    {
                        "pattern": "squat",
                        "name_hint": "barbell squat",
                        "sets": 4,
                        "reps": "6-8",
                        "rest": 180,
                        "mech": "C",
                    },
                    {
                        "pattern": "squat",
                        "name_hint": "leg press",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 120,
                        "mech": "C",
                    },
                    {
                        "pattern": "lunge",
                        "name_hint": "lunge",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "knee_extension",
                        "name_hint": "leg extension",
                        "sets": 3,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                    {
                        "pattern": "calf",
                        "name_hint": "calf raise",
                        "sets": 4,
                        "reps": "10-15",
                        "rest": 60,
                        "mech": "I",
                    },
                ],
            },
            {
                "name": "Push B (Volume)",
                "exercises": [
                    {
                        "pattern": "horizontal_push",
                        "name_hint": "dumbbell bench",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "vertical_push",
                        "name_hint": "dumbbell press",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_push",
                        "name_hint": "cable fly",
                        "sets": 3,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                    {
                        "pattern": "shoulder_raise",
                        "name_hint": "lateral raise",
                        "sets": 4,
                        "reps": "15-20",
                        "rest": 45,
                        "mech": "I",
                    },
                    {
                        "pattern": "elbow_extension",
                        "name_hint": "overhead extension",
                        "sets": 3,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                ],
            },
            {
                "name": "Pull B (Volume)",
                "exercises": [
                    {
                        "pattern": "vertical_pull",
                        "name_hint": "lat pulldown",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_pull",
                        "name_hint": "machine row",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "horizontal_pull",
                        "name_hint": "rear delt",
                        "sets": 3,
                        "reps": "15-20",
                        "rest": 60,
                        "mech": "I",
                    },
                    {
                        "pattern": "elbow_flexion",
                        "name_hint": "cable curl",
                        "sets": 3,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                    {
                        "pattern": "elbow_flexion",
                        "name_hint": "incline curl",
                        "sets": 2,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                ],
            },
            {
                "name": "Legs B (Ham/Glute Focus)",
                "exercises": [
                    {
                        "pattern": "hip_hinge",
                        "name_hint": "romanian deadlift",
                        "sets": 4,
                        "reps": "8-10",
                        "rest": 150,
                        "mech": "C",
                    },
                    {
                        "pattern": "squat",
                        "name_hint": "hack squat",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 120,
                        "mech": "C",
                    },
                    {
                        "pattern": "knee_flexion",
                        "name_hint": "leg curl",
                        "sets": 3,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                    {
                        "pattern": "hip_hinge",
                        "name_hint": "hip thrust",
                        "sets": 3,
                        "reps": "10-12",
                        "rest": 90,
                        "mech": "C",
                    },
                    {
                        "pattern": "calf",
                        "name_hint": "seated calf raise",
                        "sets": 4,
                        "reps": "12-15",
                        "rest": 60,
                        "mech": "I",
                    },
                ],
            },
        ],
        "progression": "Double:+weight when top reps hit on all sets; +1 set/muscle/week to MRV",
        "deload": "Every 5-6w, volume to MEV, intensity -10%",
    },
}

# ============================================================================
# SYSTEM PROMPT
# ============================================================================

SYSTEM_PROMPT = (
    "You are an expert fitness AI that generates personalized, scientifically-sound workout plans. "
    "You create complete training programs based on the user's InBody data (BMI, BMR, TDEE, body fat, muscle mass), "
    "training goals, available equipment, injuries, coach feedback, and session reviews. "
    "Every plan includes: warm-up protocol per day, periodized volume using MEV/MAV/MRV landmarks, "
    "evidence-based exercise selection (compounds prioritized before isolations), cardio prescription when body fat is elevated or goal requires it, "
    "rest day distribution, RIR/RPE-based intensity, and progressive overload protocols. "
    "You learn from session reviews and coach corrections to continuously improve plans. "
    "Output all plans in compact text format only."
)


# ============================================================================
# WORKOUT GENERATOR V6
# ============================================================================


class WorkoutGeneratorV6:
    """
    Generates diverse training data for Qwen2.5 fine-tuning.

    v6 features
    -----------
    - All v5 features (SFR scoring, periodization, injury handling,
      expert programs, equipment filtering, volume landmarks)
    + Warm-up section per training day
    + Full InBody pipeline: BMI / BMR / TDEE / VFL
    + Cardio prescription (BF-triggered + goal-triggered)
    + Session feedback learning examples
    + Coach review learning examples
    + DPO preference-pair generation (Stage-2 data)
    """

    def __init__(
        self,
        exercises: List[Dict],
        warmup_lib_path: Optional[Path] = None,
    ):
        self.exercises = exercises
        self._load_warmup_library(warmup_lib_path)
        self._organize()

    def _load_warmup_library(self, path: Optional[Path]) -> None:
        """
        Load warm-up exercises from warmup_library_v6.json (built by
        build_exercise_db_v6.py).  Falls back to the built-in WARMUP_LIBRARY
        constant when the file is absent so the training script always works
        even without running the builder first.
        """
        if path and path.exists():
            with open(path, "r", encoding="utf-8") as fh:
                self._warmup_lib: Dict[str, Any] = json.load(fh)
            print(
                f"  Warm-up library : {len(self._warmup_lib)} day types "
                f"loaded from {path.name}"
            )
        else:
            self._warmup_lib = dict(WARMUP_LIBRARY)
            if path:
                print(
                    f"  [WARN] {path.name} not found — using built-in warm-up library."
                )

    # ------------------------------------------------------------------
    # SETUP
    # ------------------------------------------------------------------

    def _organize(self):
        """Index exercises by pattern, muscle, equipment."""
        self.by_pattern = defaultdict(list)
        self.by_muscle = defaultdict(list)
        self.by_equipment = defaultdict(list)
        self.equipment_set = set()

        for ex in self.exercises:
            pat = ex.get("movement_pattern", "other")
            self.by_pattern[pat].append(ex)
            for m in ex.get("primaryMuscles", []):
                self.by_muscle[m].append(ex)
            eq = ex.get("equipment", "body only")
            self.equipment_set.add(eq)
            self.by_equipment[eq].append(ex)

        for pat in self.by_pattern:
            # Sort compounds before isolations (real mechanic field from dataset),
            # then alphabetically by name — no invented scores used.
            self.by_pattern[pat].sort(
                key=lambda x: (
                    0 if x.get("mechanic", "isolation").lower() == "compound" else 1,
                    x.get("name", "").lower(),
                )
            )

        print(f"Organised {len(self.exercises)} exercises:")
        print(f"  Patterns : {len(self.by_pattern)}")
        print(f"  Muscles  : {len(self.by_muscle)}")
        print(f"  Equipment: {len(self.equipment_set)}")

    def _severity_label(self, sev: int) -> str:
        for (lo, hi), label in SEVERITY_MAP.items():
            if lo <= sev <= hi:
                return label
        return "unknown"

    # ------------------------------------------------------------------
    # NEW: INBODY METRICS (BMI / BMR / TDEE)
    # ------------------------------------------------------------------

    def _compute_inbody_metrics(
        self,
        height_cm: float,
        weight_kg: float,
        age: int,
        gender: str,
        days_per_week: int,
    ) -> Dict:
        """
        Compute BMI and BMR (Mifflin-St Jeor).
        TDEE = BMR * activity multiplier keyed to training days / week.
        """
        height_m = height_cm / 100.0
        bmi = round(weight_kg / (height_m**2), 1)

        # WHO BMI category
        if bmi < 18.5:
            bmi_cat = "underweight"
        elif bmi < 25.0:
            bmi_cat = "normal"
        elif bmi < 30.0:
            bmi_cat = "overweight"
        else:
            bmi_cat = "obese"

        # Mifflin-St Jeor
        if gender.lower() == "male":
            bmr = round(10 * weight_kg + 6.25 * height_cm - 5 * age + 5)
        else:
            bmr = round(10 * weight_kg + 6.25 * height_cm - 5 * age - 161)

        # Activity multiplier (sedentary base + training days offset)
        activity_map = {1: 1.2, 2: 1.375, 3: 1.375, 4: 1.55, 5: 1.725, 6: 1.9}
        act_mult = activity_map.get(days_per_week, 1.55)
        tdee = round(bmr * act_mult)

        return {"bmi": bmi, "bmi_cat": bmi_cat, "bmr": bmr, "tdee": tdee}

    def _get_inbody_notes(self, inbody: Dict, goal: str) -> str:
        """Derive clinical/coaching notes from InBody metrics."""
        notes = []
        bmi_cat = inbody.get("bmi_cat", "normal")
        bf_cat = inbody.get("bf_cat", "normal")
        mm_cat = inbody.get("mm_cat", "average")
        vfl = inbody.get("visceral_fat_level", 5)
        bf_pct = inbody.get("bf_pct", 20.0)

        if bmi_cat == "obese":
            notes.append(
                "Obese BMI: low-impact machine-based exercises mandatory; "
                "cardiovascular health is top priority before aesthetics"
            )
        elif bmi_cat == "overweight":
            notes.append(
                "Overweight BMI: compound movements + cardio; "
                "monitor joint stress on high-load exercises"
            )
        elif bmi_cat == "underweight":
            notes.append(
                "Underweight BMI: caloric surplus required; "
                "prioritise compound strength work over cardio"
            )

        if bf_cat in ("higher", "obese"):
            notes.append(
                f"Elevated BF {bf_pct}%: cardio essential 3-5x/wk; "
                "consider nutrition coaching alongside training"
            )
        elif bf_cat == "lean" and goal == "WeightLoss":
            notes.append(
                "Already lean: recomposition approach preferred over aggressive cut; "
                "preserve muscle mass"
            )

        if mm_cat == "low":
            notes.append(
                "Low skeletal muscle mass: prioritise resistance training; "
                "cardio secondary until MM improves"
            )
        elif mm_cat == "high" and goal == "WeightLoss":
            notes.append(
                "Good muscle mass foundation: maintain via resistance training while in deficit"
            )

        if vfl >= 10:
            notes.append(
                f"High visceral fat (VFL={vfl}): metabolic syndrome risk; "
                "Zone-2 cardio + diet changes are critical"
            )

        return ";".join(notes) if notes else "standard_programming_applies"

    # ------------------------------------------------------------------
    # NEW: WARM-UP GENERATION
    # ------------------------------------------------------------------

    def _get_warmup_for_day(
        self,
        day_name: str,
        day_patterns: List[str],
        injuries: List[Dict],
    ) -> str:
        """
        Return a compact warm-up string for a training day.
        Format: exercise1(spec)|exercise2(spec)|...|RAMP:ramp_note
        """
        day_lower = day_name.lower()

        # Classify day type from name
        if any(kw in day_lower for kw in ["push", "chest"]):
            wtype = "push"
        elif any(kw in day_lower for kw in ["pull", "back", "lat"]):
            wtype = "pull"
        elif any(kw in day_lower for kw in ["leg", "lower", "quad", "ham", "glute"]):
            wtype = "legs"
        elif "upper" in day_lower:
            wtype = "upper"
        elif "arm" in day_lower:
            wtype = "arms"
        elif any(kw in day_lower for kw in ["full", "total"]):
            wtype = "full_body"
        else:
            # Infer from patterns
            has_lower = any(
                p
                in {
                    "squat",
                    "hip_hinge",
                    "lunge",
                    "calf",
                    "knee_extension",
                    "knee_flexion",
                }
                for p in day_patterns
            )
            has_push = any(
                p in {"horizontal_push", "vertical_push"} for p in day_patterns
            )
            has_pull = any(
                p in {"horizontal_pull", "vertical_pull"} for p in day_patterns
            )
            if has_lower and (has_push or has_pull):
                wtype = "full_body"
            elif has_lower:
                wtype = "lower"
            elif has_push and has_pull:
                wtype = "upper"
            elif has_push:
                wtype = "push"
            elif has_pull:
                wtype = "pull"
            else:
                wtype = "full_body"

        warmup = self._warmup_lib.get(
            wtype,
            self._warmup_lib.get("full_body", WARMUP_LIBRARY["full_body"]),
        )
        exercises = warmup["exercises"]

        # For severe injuries, keep only the first 2 general exercises
        severe = [inj for inj in injuries if inj["severity"] >= 7]
        max_ex = 2 if severe else 3

        parts = []
        for ex in exercises[:max_ex]:
            parts.append(f"{ex['name']}({ex['spec']})")

        ramp = warmup.get("ramp", "")
        if ramp:
            parts.append(f"RAMP:{ramp}")

        return "|".join(parts)

    # ------------------------------------------------------------------
    # NEW: CARDIO PRESCRIPTION
    # ------------------------------------------------------------------

    def _get_cardio_prescription(self, ctx: Dict) -> Optional[str]:
        """
        Return a cardio prescription string, or None if not indicated.
        Format: type|freq/wk|duration_min|hr_zone|modalities|progression
        """
        inbody = ctx.get("inbody")
        goal = ctx.get("goal", "General")

        # Endurance goal always gets cardio
        if goal == "Endurance":
            p = CARDIO_PROTOCOLS["endurance"]
            f = random.randint(*p["sessions_per_week"])
            d = random.randint(*p["duration_min"])
            m = ",".join(p["modalities"][:2])
            return f"{p['type']}|{f}x/wk|{d}min|{p['hr_zone']}|{m}|{p['progression']}"

        bf_cat = inbody.get("bf_cat", "normal") if inbody else "normal"
        needs_cardio = bf_cat in ("higher", "obese") or goal == "WeightLoss"

        if not needs_cardio:
            # Optional maintenance cardio 30% of the time
            if random.random() < 0.30:
                p = CARDIO_PROTOCOLS["maintenance"]
                f = random.randint(*p["sessions_per_week"])
                d = random.randint(*p["duration_min"])
                m = ",".join(p["modalities"][:1])
                return (
                    f"{p['type']}|{f}x/wk|{d}min|{p['hr_zone']}|{m}|{p['progression']}"
                )
            return None

        if bf_cat == "obese":
            p = CARDIO_PROTOCOLS["obese"]
        elif bf_cat == "higher":
            p = CARDIO_PROTOCOLS["higher"]
        else:  # WeightLoss goal with normal / lean BF
            p = CARDIO_PROTOCOLS["weight_loss"]

        f = random.randint(*p["sessions_per_week"])
        d = random.randint(*p["duration_min"])
        m = ",".join(p["modalities"][:2])
        prog = p["progression"].replace(" ", "_")
        return f"{p['type']}|{f}x/wk|{d}min|{p['hr_zone']}|{m}|{prog}"

    # ------------------------------------------------------------------
    # PERIODIZATION HELPERS
    # ------------------------------------------------------------------

    def _get_week_context(self, level: str) -> Dict:
        meso_key = (
            level.lower() if level.lower() in MESOCYCLE_CONFIGS else "intermediate"
        )
        meso = MESOCYCLE_CONFIGS[meso_key]
        total_weeks = meso["weeks"]
        accum_weeks = meso["accumulation"]

        week = random.randint(1, total_weeks)
        is_deload = week > accum_weeks

        if is_deload:
            rir, volume_frac, phase = 5, -0.4, "Deload"
        else:
            accum_idx = week - 1
            rir_sched = RIR_BY_WEEK.get(accum_weeks, RIR_BY_WEEK[4])
            vol_sched = VOLUME_RAMP.get(accum_weeks, VOLUME_RAMP[4])
            rir = rir_sched[min(accum_idx, len(rir_sched) - 1)]
            volume_frac = vol_sched[min(accum_idx, len(vol_sched) - 1)]
            phase = "Accumulation"

        return {
            "week": week,
            "total_weeks": total_weeks,
            "phase": phase,
            "is_deload": is_deload,
            "rir": rir,
            "volume_frac": volume_frac,
        }

    def _compute_week_volume(
        self, muscle: str, volume_frac: float, is_deload: bool
    ) -> int:
        landmarks = VOLUME_LANDMARKS.get(muscle)
        if not landmarks:
            return 6
        if is_deload:
            return landmarks["MV"]
        mev = landmarks["MEV"]
        mrv = landmarks["MRV"]
        target = mev + volume_frac * (mrv - mev)
        return round(max(mev, min(mrv, target)))

    # ------------------------------------------------------------------
    # CONTEXT GENERATION  (ENHANCED)
    # ------------------------------------------------------------------

    def _random_user_context(self) -> Dict[str, Any]:
        """Build a random but realistic user context with full InBody metrics."""
        level = random.choice(FITNESS_LEVELS)
        goal = random.choice(FITNESS_GOALS)
        days = random.choice([3, 4, 5, 6])

        # ── Enhanced InBody (65% of examples) ──
        inbody = None
        if random.random() < 0.65:
            bf_cat = random.choice(list(BODY_FAT_CATEGORIES.keys()))
            mm_cat = random.choice(list(MUSCLE_MASS_CATEGORIES.keys()))
            gender = random.choice(GENDERS)
            age = random.randint(18, 55)
            weight_kg = round(random.uniform(50, 120), 1)
            height_cm = round(
                random.uniform(160, 195)
                if gender == "male"
                else random.uniform(150, 180),
                1,
            )
            bf_pct = round(random.uniform(*BODY_FAT_CATEGORIES[bf_cat]), 1)
            mm_kg = round(random.uniform(*MUSCLE_MASS_CATEGORIES[mm_cat]), 1)
            metrics = self._compute_inbody_metrics(
                height_cm, weight_kg, age, gender, days
            )
            vfl = random.randint(1, 15)

            inbody = {
                "bf_pct": bf_pct,
                "bf_cat": bf_cat,
                "mm_kg": mm_kg,
                "mm_cat": mm_cat,
                "weight_kg": weight_kg,
                "height_cm": height_cm,
                "age": age,
                "gender": gender,
                "bmi": metrics["bmi"],
                "bmi_cat": metrics["bmi_cat"],
                "bmr": metrics["bmr"],
                "tdee": metrics["tdee"],
                "visceral_fat_level": vfl,
            }

        # ── Injuries (40% of examples) ──
        injuries = []
        if random.random() < 0.40:
            n_inj = random.randint(1, 2)
            for part in random.sample(BODY_PARTS_INJURY, n_inj):
                sev = random.randint(1, 9)
                injuries.append(
                    {
                        "part": part,
                        "severity": sev,
                        "type": random.choice(INJURY_TYPES),
                        "label": self._severity_label(sev),
                    }
                )

        # ── Session feedback (35% of examples) ──
        feedback = None
        if random.random() < 0.35:
            feedback = {
                "difficulty": random.choice(DIFFICULTY_PREFS),
                "rating": round(random.uniform(3.0, 5.0), 1),
                "sessions": random.randint(3, 60),
            }

        # ── Equipment ──
        equip_list = sorted(self.equipment_set)
        n_equip = random.randint(4, min(10, len(equip_list)))
        equipment = random.sample(equip_list, n_equip)
        if "body only" not in equipment:
            equipment.append("body only")

        return {
            "level": level,
            "goal": goal,
            "days": days,
            "equipment": equipment,
            "inbody": inbody,
            "injuries": injuries,
            "feedback": feedback,
            "week_ctx": self._get_week_context(level),
        }

    def _build_user_message(self, ctx: Dict) -> str:
        """Build the user-facing prompt including InBody, injuries, feedback."""
        tmpl = random.choice(PLAN_PROMPTS)
        prompt = tmpl.format(days=ctx["days"], goal=ctx["goal"].lower())

        parts = [
            f"Level: {ctx['level']}",
            f"Goal: {ctx['goal']}",
            f"Days: {ctx['days']}",
        ]

        wctx = ctx.get("week_ctx", {})
        if wctx:
            parts.append(
                f"Week: {wctx['week']}/{wctx['total_weeks']} ({wctx['phase']})"
            )

        if ctx.get("inbody"):
            ib = ctx["inbody"]
            if "bmi" in ib:
                parts.append(f"BMI: {ib['bmi']}({ib['bmi_cat']})")
                parts.append(f"BMR: {ib['bmr']}kcal | TDEE: {ib['tdee']}kcal")
            parts.append(f"Body fat: {ib['bf_pct']}% ({ib['bf_cat']})")
            parts.append(f"Muscle mass: {ib['mm_kg']}kg ({ib['mm_cat']})")
            if ib.get("visceral_fat_level", 0) >= 10:
                parts.append(f"VFL: {ib['visceral_fat_level']} (high)")

        if ctx.get("injuries"):
            strs = [
                f"{inj['part']}({inj['label']},{inj['severity']}/10)"
                for inj in ctx["injuries"]
            ]
            parts.append(f"Injuries: {','.join(strs)}")

        if ctx.get("feedback"):
            fb = ctx["feedback"]
            parts.append(
                f"Feedback: {fb['difficulty']} difficulty, "
                f"rating {fb['rating']}, {fb['sessions']} sessions done"
            )

        if ctx.get("equipment"):
            parts.append(f"Equipment: {','.join(ctx['equipment'][:8])}")

        return f"{prompt}\n[Context] {' | '.join(parts)}"

    # ------------------------------------------------------------------
    # INJURY / CONTRAINDICATION CHECKING
    # ------------------------------------------------------------------

    def _check_exercise_contraindications(self, ex: Dict, injuries: List[Dict]) -> bool:
        """Return True if the exercise must be avoided for any injury."""
        ex_contras = set(ex.get("contraindications", []))
        if not ex_contras:
            return False

        contra_map = {
            "shoulder": {"shoulder_impingement", "rotator_cuff_tear", "pec_tear"},
            "lower_back": {"lower_back_injury", "disc_herniation", "sciatica"},
            "knee": {"knee_injury", "patellar_tendinitis", "acl_injury"},
            "wrist": {"wrist_injury"},
            "elbow": {
                "elbow_tendinitis",
                "tennis_elbow",
                "golfers_elbow",
                "bicep_tendinitis",
                "tricep_tendinitis",
            },
            "hip": {"hip_impingement", "adductor_strain"},
            "ankle": {"ankle_injury", "achilles_tendinitis", "plantar_fasciitis"},
            "neck": {"neck_injury", "cervical_disc"},
            "upper_back": {"lower_back_injury"},
        }

        for inj in injuries:
            overlap = ex_contras & contra_map.get(inj["part"], set())
            if not overlap:
                continue
            sev = inj["severity"]
            if sev >= 7:
                return True
            if sev >= 4 and len(overlap) >= 1:
                return True
            if sev >= 2 and len(overlap) >= 2:
                return True
        return False

    # ------------------------------------------------------------------
    # EXERCISE SELECTION (SFR-ranked)
    # ------------------------------------------------------------------

    def _get_exercises_for_day(
        self, day_tmpl: Dict, ctx: Dict, n: int = 6
    ) -> List[Dict]:
        """Select SFR-ranked, injury-safe, equipment-filtered exercises."""
        exercises = []
        used = set()
        injuries = ctx.get("injuries", [])
        goal = ctx["goal"]
        level = ctx["level"]
        equipment = [e.lower() for e in ctx.get("equipment", [])]
        week_ctx = ctx.get("week_ctx", {})
        is_deload = week_ctx.get("is_deload", False)

        if is_deload:
            n = max(3, n - 2)

        # Patterns to avoid given injuries
        avoid_pats = set()
        for inj in injuries:
            rules = INJURY_RULES.get(inj["part"], {})
            key = (
                "avoid_patterns_severe"
                if inj["severity"] >= 7
                else "avoid_patterns_moderate"
            )
            avoid_pats.update(rules.get(key, set()))

        day_patterns = day_tmpl["patterns"]
        compound_pats = [p for p in day_patterns if p in COMPOUND_PATTERNS]
        isolation_pats = [p for p in day_patterns if p in ISOLATION_PATTERNS]
        other_pats = [
            p
            for p in day_patterns
            if p not in COMPOUND_PATTERNS and p not in ISOLATION_PATTERNS
        ]

        def _sfr_score(ex: Dict) -> float:
            s = ex.get("sfr_ratio", 1.0) * 3.0
            gs = ex.get("goal_suitability", {})
            s += gs.get(goal, gs.get("General", 5))
            if goal == "Strength" and ex.get("mechanic") == "compound":
                s += 2
            if goal == "Muscle" and ex.get("mechanic") == "isolation":
                s += 1
            if goal == "WeightLoss" and ex.get("axial_load", 0) >= 7:
                s -= 1
            # For obese users prefer lower-axial-load movements
            if ctx.get("inbody", {}).get("bmi_cat") == "obese":
                if ex.get("axial_load", 0) >= 7:
                    s -= 2
            s += random.uniform(-0.5, 0.5)
            return s

        for pat_group in [compound_pats, isolation_pats, other_pats]:
            for pat in pat_group:
                if pat in avoid_pats or len(exercises) >= n:
                    continue
                candidates = list(self.by_pattern.get(pat, []))
                if not candidates:
                    continue

                # Equipment filter
                if equipment:
                    eq_filtered = [
                        ex
                        for ex in candidates
                        if ex.get("equipment", "body only").lower() in equipment
                    ]
                    if eq_filtered:
                        candidates = eq_filtered

                # Beginner filter
                if level == "Beginner":
                    beg = [
                        ex
                        for ex in candidates
                        if ex.get("difficulty_level", 3) <= 3
                        and ex.get("skill_level", "intermediate") != "advanced"
                    ]
                    if beg:
                        candidates = beg

                # Contraindication filter
                if injuries:
                    safe = [
                        ex
                        for ex in candidates
                        if not self._check_exercise_contraindications(ex, injuries)
                    ]
                    if safe:
                        candidates = safe

                # Deload: prefer lower-fatigue exercises
                if is_deload:
                    dl = [ex for ex in candidates if ex.get("fatigue_score", 5) <= 5]
                    if dl:
                        candidates = dl

                candidates.sort(key=_sfr_score, reverse=True)
                picks = 2 if pat in COMPOUND_PATTERNS and not is_deload else 1
                for ex in candidates:
                    if ex["name"] not in used and len(exercises) < n:
                        exercises.append(ex)
                        used.add(ex["name"])
                        picks -= 1
                        if picks <= 0:
                            break

        # Back-fill from muscle groups if still short
        if len(exercises) < n:
            for muscle in day_tmpl.get("muscles", []):
                if len(exercises) >= n:
                    break
                cands = [
                    ex
                    for ex in self.by_muscle.get(muscle, [])
                    if ex["name"] not in used
                    and ex.get("movement_pattern", "other") not in avoid_pats
                ]
                if injuries:
                    cands = [
                        ex
                        for ex in cands
                        if not self._check_exercise_contraindications(ex, injuries)
                    ]
                if equipment:
                    eq_f = [
                        ex
                        for ex in cands
                        if ex.get("equipment", "body only").lower() in equipment
                    ]
                    if eq_f:
                        cands = eq_f
                if cands:
                    cands.sort(key=lambda x: x.get("sfr_ratio", 1.0), reverse=True)
                    exercises.append(cands[0])
                    used.add(cands[0]["name"])
        return exercises

    # ------------------------------------------------------------------
    # PLAN FORMATTER  (ENHANCED: INBODY / WARMUP / CARDIO sections)
    # ------------------------------------------------------------------

    def _format_compact_plan(
        self,
        ctx: Dict,
        split: Dict,
        day_exercises: List[List[Dict]],
    ) -> str:
        """
        Compact text plan used as the assistant's response.

        Sections (in order):
          PLAN   – header with periodization info
          INBODY – BMI / BMR / TDEE / BF / MM / VFL
          INBODY_NOTES – derived coaching notes
          CARDIO – cardio prescription (when indicated)
          VOL    – weekly target sets per muscle
          INJ    – injury notes
          FB     – feedback-driven adjustments
          SCHED  – weekly training schedule with rest days
          ---
          D{i}   – each training day
          WARMUP – warm-up protocol for the day
          {j}.   – each working set
          ---
          PROG   – progressive overload protocol
        """
        goal = ctx["goal"]
        level = ctx["level"]
        days = ctx["days"]
        injuries = ctx.get("injuries", [])
        feedback = ctx.get("feedback")
        week_ctx = ctx.get("week_ctx", {})
        inbody = ctx.get("inbody")

        rpe_range = RPE_BY_GOAL.get(goal, (6, 8))
        week_num = week_ctx.get("week", 1)
        total_weeks = week_ctx.get("total_weeks", 4)
        phase = week_ctx.get("phase", "Accumulation")
        is_deload = week_ctx.get("is_deload", False)
        rir = week_ctx.get("rir", 2)
        volume_frac = week_ctx.get("volume_frac", 0.5)

        GOAL_REPS = {
            "Strength": (3, 6, 180),
            "Muscle": (8, 12, 90),
            "WeightLoss": (12, 20, 45),
            "Endurance": (15, 25, 30),
            "General": (8, 15, 60),
        }
        GOAL_SETS = {
            "Strength": 4,
            "Muscle": 3,
            "WeightLoss": 3,
            "Endurance": 3,
            "General": 3,
        }
        default_min_r, default_max_r, default_rest = GOAL_REPS.get(goal, (8, 12, 60))
        base_sets = GOAL_SETS.get(goal, 3)
        if level == "Advanced":
            base_sets += 1
        elif level == "Beginner":
            base_sets = max(2, base_sets - 1)
        if is_deload:
            base_sets = max(2, base_sets - 1)

        lines = []

        # ── PLAN header ──
        lines.append(
            f"PLAN:{days}d {split['name']}|{goal}|{level}|"
            f"{total_weeks}w|W{week_num}/{total_weeks}({phase})"
        )

        # ── INBODY section ──
        if inbody:
            if "bmi" in inbody:
                lines.append(
                    f"INBODY:BMI={inbody['bmi']}({inbody['bmi_cat']})|"
                    f"BMR={inbody['bmr']}kcal|TDEE={inbody['tdee']}kcal|"
                    f"BF={inbody['bf_pct']}%({inbody['bf_cat']})|"
                    f"MM={inbody['mm_kg']}kg({inbody['mm_cat']})|"
                    f"VFL={inbody.get('visceral_fat_level', 'N/A')}"
                )
            else:
                lines.append(
                    f"INBODY:BF={inbody['bf_pct']}%({inbody['bf_cat']})|"
                    f"MM={inbody['mm_kg']}kg({inbody['mm_cat']})"
                )
            inbody_notes = self._get_inbody_notes(inbody, goal)
            if inbody_notes != "standard_programming_applies":
                lines.append(f"INBODY_NOTES:{inbody_notes}")

        # ── CARDIO section ──
        cardio = self._get_cardio_prescription(ctx)
        if cardio:
            lines.append(f"CARDIO:{cardio}")

        # ── VOL section (weekly muscle volume targets) ──
        muscle_set = set()
        for dt in split["days"]:
            muscle_set.update(dt.get("muscles", []))
        vol_parts = []
        for m in sorted(muscle_set):
            target = self._compute_week_volume(m, volume_frac, is_deload)
            lm = VOLUME_LANDMARKS.get(m)
            if lm:
                lo, hi = lm["MAV"]
                vol_parts.append(f"{m}={target}sets(MAV={lo}-{hi})")
        if vol_parts:
            lines.append(f"VOL:{','.join(vol_parts[:6])}")

        # ── INJ section ──
        if injuries:
            inj_notes = []
            for inj in injuries:
                rules = INJURY_RULES.get(inj["part"], {})
                if inj["severity"] >= 7:
                    note = rules.get("severe_note", f"avoid {inj['part']} exercises")
                elif inj["severity"] >= 4:
                    note = rules.get("moderate_note", f"modify {inj['part']} exercises")
                else:
                    note = rules.get("mild_note", f"monitor {inj['part']}")
                inj_notes.append(
                    f"{inj['part']}({inj['label']},{inj['severity']}/10):{note}"
                )
            lines.append(f"INJ:{';'.join(inj_notes)}")

        # ── FB section ──
        if feedback:
            lines.append(
                f"FB:{feedback['difficulty']} pref,rating {feedback['rating']},"
                f"{feedback['sessions']} sessions"
            )

        # ── SCHED section ──
        schedules = REST_DAY_SCHEDULES.get(days, REST_DAY_SCHEDULES[4])
        schedule = random.choice(schedules)
        lines.append(f"SCHED:{','.join(schedule)}")

        # ── Training days ──
        for i, (day_tmpl, exs) in enumerate(zip(split["days"], day_exercises), 1):
            muscles_str = ",".join(day_tmpl["muscles"][:4])
            dur = random.randint(25, 40) if is_deload else random.randint(40, 70)
            lines.append("---")
            lines.append(f"D{i}:{day_tmpl['name']}[{muscles_str}]{dur}min")

            # ── WARMUP ──
            warmup_str = self._get_warmup_for_day(
                day_tmpl["name"], day_tmpl["patterns"], injuries
            )
            lines.append(f"WARMUP:{warmup_str}")

            # ── Working sets ──
            for j, ex in enumerate(exs, 1):
                rr = ex.get("rep_ranges_by_goal", {}).get(goal, {})
                sets = rr.get("sets", base_sets)
                min_r = rr.get("min_reps", default_min_r)
                max_r = rr.get("max_reps", default_max_r)
                rest = rr.get("rest_seconds", default_rest)
                mech = "C" if ex.get("mechanic") == "compound" else "I"
                rpe = random.randint(*rpe_range)
                ex_rir = rir if mech == "C" else max(0, rir - 1)

                if is_deload:
                    sets = max(2, sets - 1)
                    rpe = max(4, rpe - 2)
                    ex_rir = max(3, ex_rir + 2)

                if feedback:
                    if feedback["difficulty"] == "harder":
                        sets = min(sets + 1, 6)
                    elif feedback["difficulty"] == "easier":
                        sets = max(sets - 1, 2)

                sfr = ex.get("sfr_ratio", 1.0)
                equip = ex.get("equipment", "body only")
                name = ex["name"]

                # Injury modification marker
                inj_marker = ""
                ex_muscles = set(ex.get("primaryMuscles", []))
                for inj in injuries:
                    related = INJURY_RULES.get(inj["part"], {}).get(
                        "related_muscles", set()
                    )
                    if ex_muscles & related:
                        if inj["severity"] >= 7:
                            inj_marker = "|*MODIFIED"
                        elif inj["severity"] >= 4:
                            inj_marker = "|*LIGHT"
                        else:
                            inj_marker = "|*MONITOR"
                        break

                lines.append(
                    f"{j}.{name}|{sets}x{min_r}-{max_r}|{rest}s|{mech}|"
                    f"RPE{rpe}/RIR{ex_rir}|SFR{sfr:.1f}|{equip}{inj_marker}"
                )

        # ── Progressive overload ──
        lines.append("---")
        prog = PROGRESSIVE_OVERLOAD.get(goal, PROGRESSIVE_OVERLOAD["General"])
        lines.append(f"PROG:{prog['method']}|{prog['protocol']}")
        lines.append(f"WEEKLY:{prog['weekly']}")
        lines.append(f"DELOAD:{prog['deload']}")

        return "\n".join(lines)

    # ------------------------------------------------------------------
    # EXERCISE DB LOOKUP (for expert programs)
    # ------------------------------------------------------------------

    def _find_exercise_by_hint(
        self, pattern: str, name_hint: str, equipment: List[str]
    ) -> Optional[Dict]:
        candidates = self.by_pattern.get(pattern, [])
        if not candidates:
            return None
        hint_lower = name_hint.lower()
        equip_lower = [e.lower() for e in equipment] if equipment else []

        scored = []
        for ex in candidates:
            nl = ex["name"].lower()
            if hint_lower not in nl:
                continue
            score = (
                100
                if nl == hint_lower
                else (
                    80
                    if nl.startswith(hint_lower)
                    else 50 + int(30 * len(hint_lower) / max(len(nl), 1))
                )
            )
            if equip_lower and ex.get("equipment", "body only").lower() in equip_lower:
                score += 10
            if ex.get("equipment", "").lower() in ("barbell", "dumbbell"):
                score += 5
            scored.append((score, ex))

        if scored:
            scored.sort(key=lambda x: x[0], reverse=True)
            return scored[0][1]
        if equipment:
            filt = [
                ex
                for ex in candidates
                if ex.get("equipment", "body only").lower() in equip_lower
            ]
            if filt:
                return filt[0]
        return candidates[0] if candidates else None

    # ------------------------------------------------------------------
    # EXAMPLE GENERATORS
    # ------------------------------------------------------------------

    def generate_example(self) -> Dict:
        """Standard plan example with full v6 features."""
        ctx = self._random_user_context()
        days = ctx["days"]
        split = random.choice(SPLIT_TEMPLATES.get(days, SPLIT_TEMPLATES[4]))
        n_ex = 5 if ctx["level"] == "Beginner" else 6
        day_exercises = [
            self._get_exercises_for_day(dt, ctx, n=n_ex) for dt in split["days"]
        ]
        return {
            "user": self._build_user_message(ctx),
            "assistant": self._format_compact_plan(ctx, split, day_exercises),
        }

    def generate_injury_example(self) -> Dict:
        """Plan with mandatory injury modification."""
        ctx = self._random_user_context()
        part = random.choice(BODY_PARTS_INJURY)
        sev = random.randint(3, 9)
        ctx["injuries"] = [
            {
                "part": part,
                "severity": sev,
                "type": random.choice(INJURY_TYPES),
                "label": self._severity_label(sev),
            }
        ]
        ctx["days"] = random.choice([3, 4, 5, 6])
        split = random.choice(SPLIT_TEMPLATES.get(ctx["days"], SPLIT_TEMPLATES[4]))
        n_ex = 5 if ctx["level"] == "Beginner" else 6
        day_exercises = [
            self._get_exercises_for_day(dt, ctx, n=n_ex) for dt in split["days"]
        ]

        tmpl = random.choice(INJURY_ADJUST_PROMPTS)
        prompt = tmpl.format(part=part, sev=sev)
        parts = [
            f"Level: {ctx['level']}",
            f"Goal: {ctx['goal']}",
            f"Days: {ctx['days']}",
        ]
        wctx = ctx.get("week_ctx", {})
        if wctx:
            parts.append(
                f"Week: {wctx['week']}/{wctx['total_weeks']} ({wctx['phase']})"
            )
        parts.append(f"Injury: {part}({self._severity_label(sev)},{sev}/10)")
        if ctx.get("inbody"):
            ib = ctx["inbody"]
            if "bmi" in ib:
                parts.append(f"BMI: {ib['bmi']}({ib['bmi_cat']})")
            parts.append(f"BF: {ib['bf_pct']}%({ib['bf_cat']})")
        if ctx.get("equipment"):
            parts.append(f"Equipment: {','.join(ctx['equipment'][:6])}")
        user_msg = f"{prompt}\n[Context] {' | '.join(parts)}"

        return {
            "user": user_msg,
            "assistant": self._format_compact_plan(ctx, split, day_exercises),
        }

    def generate_expert_example(self) -> Dict:
        """Example built from a real evidence-based program template."""
        prog_name = random.choice(list(EXPERT_PROGRAMS.keys()))
        prog = EXPERT_PROGRAMS[prog_name]
        level, goal, days = prog["level"], prog["goal"], prog["days"]
        week_ctx = self._get_week_context(level)
        is_deload = week_ctx.get("is_deload", False)
        rir = week_ctx.get("rir", 2)
        rpe_range = RPE_BY_GOAL.get(goal, (6, 8))
        vol_frac = week_ctx.get("volume_frac", 0.5)

        equip_pool = sorted(self.equipment_set)
        equipment = ["barbell", "dumbbell", "cable", "machine", "body only"]
        extras = [e for e in equip_pool if e not in equipment]
        equipment.extend(random.sample(extras, min(2, len(extras))))

        # Optional InBody
        inbody = None
        if random.random() < 0.55:
            bf_cat = random.choice(list(BODY_FAT_CATEGORIES.keys()))
            mm_cat = random.choice(list(MUSCLE_MASS_CATEGORIES.keys()))
            gender = random.choice(GENDERS)
            age = random.randint(18, 50)
            wt = round(random.uniform(60, 100), 1)
            ht = round(random.uniform(165, 190), 1)
            bf_pct = round(random.uniform(*BODY_FAT_CATEGORIES[bf_cat]), 1)
            mm_kg = round(random.uniform(*MUSCLE_MASS_CATEGORIES[mm_cat]), 1)
            metrics = self._compute_inbody_metrics(ht, wt, age, gender, days)
            inbody = {
                "bf_pct": bf_pct,
                "bf_cat": bf_cat,
                "mm_kg": mm_kg,
                "mm_cat": mm_cat,
                "weight_kg": wt,
                "height_cm": ht,
                "age": age,
                "gender": gender,
                "bmi": metrics["bmi"],
                "bmi_cat": metrics["bmi_cat"],
                "bmr": metrics["bmr"],
                "tdee": metrics["tdee"],
                "visceral_fat_level": random.randint(1, 12),
            }

        ctx = {
            "level": level,
            "goal": goal,
            "days": days,
            "equipment": equipment,
            "inbody": inbody,
            "injuries": [],
            "feedback": None,
            "week_ctx": week_ctx,
        }

        # User message
        parts = [f"Level: {level}", f"Goal: {goal}", f"Days: {days}"]
        parts.append(
            f"Week: {week_ctx['week']}/{week_ctx['total_weeks']} ({week_ctx['phase']})"
        )
        if inbody:
            parts.append(
                f"BMI: {inbody['bmi']}({inbody['bmi_cat']}) | BMR: {inbody['bmr']}kcal"
            )
            parts.append(
                f"BF: {inbody['bf_pct']}%({inbody['bf_cat']}) | MM: {inbody['mm_kg']}kg"
            )
        parts.append(f"Equipment: {','.join(equipment[:6])}")
        user_msg = (
            f"Generate a {days}-day {goal.lower()} program based on {prog_name}\n"
            f"[Context] {' | '.join(parts)}"
        )

        # Build plan lines
        lines = []
        lines.append(
            f"PLAN:{days}d {prog['split_name']}|{goal}|{level}|"
            f"{week_ctx['total_weeks']}w|W{week_ctx['week']}/{week_ctx['total_weeks']}"
            f"({week_ctx['phase']})"
        )

        if inbody and "bmi" in inbody:
            lines.append(
                f"INBODY:BMI={inbody['bmi']}({inbody['bmi_cat']})|"
                f"BMR={inbody['bmr']}kcal|TDEE={inbody['tdee']}kcal|"
                f"BF={inbody['bf_pct']}%({inbody['bf_cat']})|"
                f"MM={inbody['mm_kg']}kg({inbody['mm_cat']})|"
                f"VFL={inbody['visceral_fat_level']}"
            )
            notes = self._get_inbody_notes(inbody, goal)
            if notes != "standard_programming_applies":
                lines.append(f"INBODY_NOTES:{notes}")

        # Cardio
        cardio = self._get_cardio_prescription(ctx)
        if cardio:
            lines.append(f"CARDIO:{cardio}")

        # Volume landmarks
        patt_to_muscle = {
            "squat": "quadriceps",
            "hip_hinge": "hamstrings",
            "lunge": "glutes",
            "horizontal_push": "chest",
            "vertical_push": "shoulders",
            "horizontal_pull": "lats",
            "vertical_pull": "lats",
            "elbow_flexion": "biceps",
            "elbow_extension": "triceps",
            "shoulder_raise": "shoulders",
            "knee_extension": "quadriceps",
            "knee_flexion": "hamstrings",
            "calf": "calves",
            "core_flexion": "abdominals",
        }
        all_patterns = {
            ex["pattern"] for w in prog["workouts"] for ex in w["exercises"]
        }
        muscle_set = {patt_to_muscle.get(p, "chest") for p in all_patterns}
        vol_parts = []
        for m in sorted(muscle_set):
            target = self._compute_week_volume(m, vol_frac, is_deload)
            lm = VOLUME_LANDMARKS.get(m)
            if lm:
                lo, hi = lm["MAV"]
                vol_parts.append(f"{m}={target}sets(MAV={lo}-{hi})")
        if vol_parts:
            lines.append(f"VOL:{','.join(vol_parts[:6])}")

        # Schedule
        sched = random.choice(REST_DAY_SCHEDULES.get(days, REST_DAY_SCHEDULES[4]))
        lines.append(f"SCHED:{','.join(sched)}")

        # Workouts
        for i, workout in enumerate(prog["workouts"], 1):
            lines.append("---")
            dur = random.randint(25, 40) if is_deload else random.randint(40, 75)
            lines.append(f"D{i}:{workout['name']}|{dur}min")

            # Derive day type for warm-up
            day_patterns_in_workout = [ex["pattern"] for ex in workout["exercises"]]
            warmup_str = self._get_warmup_for_day(
                workout["name"], day_patterns_in_workout, []
            )
            lines.append(f"WARMUP:{warmup_str}")

            for j, ex_spec in enumerate(workout["exercises"], 1):
                real_ex = self._find_exercise_by_hint(
                    ex_spec["pattern"], ex_spec["name_hint"], equipment
                )
                if not real_ex:
                    continue
                sets = ex_spec["sets"]
                reps = ex_spec["reps"]
                rest = ex_spec["rest"]
                mech = ex_spec["mech"]
                sfr = real_ex.get("sfr_ratio", 1.0)
                rpe = random.randint(*rpe_range)
                ex_rir = rir if mech == "C" else max(0, rir - 1)
                equip = real_ex.get("equipment", "body only")

                if is_deload:
                    sets = max(2, sets - 1)
                    rpe = max(4, rpe - 2)
                    ex_rir = max(3, ex_rir + 2)

                lines.append(
                    f"{j}.{real_ex['name']}|{sets}x{reps}|{rest}s|{mech}|"
                    f"RPE{rpe}/RIR{ex_rir}|SFR{sfr:.1f}|{equip}"
                )

        lines.append("---")
        lines.append(f"PROG:{prog['progression']}")
        lines.append(f"DELOAD:{prog['deload']}")
        return {"user": user_msg, "assistant": "\n".join(lines)}

    # ------------------------------------------------------------------
    # NEW v6: SESSION FEEDBACK EXAMPLE
    # ------------------------------------------------------------------

    def generate_session_feedback_example(self) -> Dict:
        """
        Post-session user review → adjusted plan.

        Format:
          User : N sessions completed + rating + comments + original plan context
          Asst : FEEDBACK_ADJUSTMENT note + updated plan
        """
        ctx = self._random_user_context()
        days = ctx["days"]
        split = random.choice(SPLIT_TEMPLATES.get(days, SPLIT_TEMPLATES[4]))
        n_ex = 5 if ctx["level"] == "Beginner" else 6
        day_exercises = [
            self._get_exercises_for_day(dt, ctx, n=n_ex) for dt in split["days"]
        ]
        original_plan = self._format_compact_plan(ctx, split, day_exercises)

        # Choose feedback scenario
        scenario = random.choice(SESSION_FEEDBACK_SCENARIOS)
        sessions_done = random.randint(1, 5)
        rating_lo, rating_hi = scenario["rating_range"]
        rating = round(random.uniform(rating_lo, rating_hi), 1)
        comment = random.choice(scenario["comments"])

        # Build user message
        parts = [
            f"Level: {ctx['level']}",
            f"Goal: {ctx['goal']}",
            f"Days: {ctx['days']}",
        ]
        if ctx.get("inbody"):
            ib = ctx["inbody"]
            if "bmi" in ib:
                parts.append(f"BMI: {ib['bmi']}({ib['bmi_cat']})")
            parts.append(f"BF: {ib['bf_pct']}%({ib['bf_cat']})")
        if ctx.get("injuries"):
            strs = [f"{inj['part']}({inj['severity']}/10)" for inj in ctx["injuries"]]
            parts.append(f"Injuries: {','.join(strs)}")

        user_msg = (
            f"Session review after {sessions_done} sessions of my "
            f"{days}-day {ctx['goal']} plan.\n"
            f"Rating: {rating}/5.0\n"
            f"Feedback: {comment}\n"
            f"Please adjust my workout plan based on this feedback.\n"
            f"[Context] {' | '.join(parts)}\n"
            f"[Current Plan]\n{original_plan}"
        )

        # Apply feedback to context
        adjusted_ctx = copy.deepcopy(ctx)
        trigger = scenario["trigger"]

        if trigger == "too_hard":
            adjusted_ctx["feedback"] = {
                "difficulty": "easier",
                "rating": rating,
                "sessions": sessions_done,
            }
        elif trigger == "too_easy":
            adjusted_ctx["feedback"] = {
                "difficulty": "harder",
                "rating": rating,
                "sessions": sessions_done,
            }
        elif trigger == "pain_during_exercise":
            # Escalate or add injury
            if adjusted_ctx.get("injuries"):
                for inj in adjusted_ctx["injuries"]:
                    inj["severity"] = min(9, inj["severity"] + 2)
                    inj["label"] = self._severity_label(inj["severity"])
            else:
                new_part = random.choice(BODY_PARTS_INJURY)
                adjusted_ctx["injuries"] = [
                    {
                        "part": new_part,
                        "severity": 4,
                        "type": "pain",
                        "label": "moderate",
                    }
                ]
            adjusted_ctx["feedback"] = {
                "difficulty": "easier",
                "rating": rating,
                "sessions": sessions_done,
            }
        elif trigger == "time_constraint":
            adjusted_ctx["feedback"] = {
                "difficulty": "easier",
                "rating": rating,
                "sessions": sessions_done,
            }
        else:
            adjusted_ctx["feedback"] = {
                "difficulty": "normal",
                "rating": rating,
                "sessions": sessions_done,
            }

        adjusted_exercises = [
            self._get_exercises_for_day(dt, adjusted_ctx, n=n_ex)
            for dt in split["days"]
        ]
        adjusted_plan = self._format_compact_plan(
            adjusted_ctx, split, adjusted_exercises
        )

        response = (
            f"FEEDBACK_ADJUSTMENT:{trigger.upper()}|{scenario['adjustment']}\n"
            f"{adjusted_plan}"
        )
        return {"user": user_msg, "assistant": response}

    # ------------------------------------------------------------------
    # NEW v6: COACH REVIEW EXAMPLE
    # ------------------------------------------------------------------

    def generate_coach_review_example(self) -> Dict:
        """
        Expert coach corrections on an existing plan → improved plan.

        Format:
          User : coach notes + original plan
          Asst : COACH_CORRECTIONS_APPLIED marker + corrected plan
        """
        ctx = self._random_user_context()
        days = ctx["days"]
        split = random.choice(SPLIT_TEMPLATES.get(days, SPLIT_TEMPLATES[4]))
        n_ex = 5 if ctx["level"] == "Beginner" else 6
        day_exercises = [
            self._get_exercises_for_day(dt, ctx, n=n_ex) for dt in split["days"]
        ]
        original_plan = self._format_compact_plan(ctx, split, day_exercises)

        # Select 1-3 review scenarios
        n_rev = random.randint(1, 3)
        reviews = random.sample(
            COACH_REVIEW_SCENARIOS, min(n_rev, len(COACH_REVIEW_SCENARIOS))
        )
        coach_notes = "\n".join([f"- {r['note']} -> FIX: {r['fix']}" for r in reviews])

        parts = [
            f"Level: {ctx['level']}",
            f"Goal: {ctx['goal']}",
            f"Days: {ctx['days']}",
        ]
        if ctx.get("inbody"):
            ib = ctx["inbody"]
            if "bmi" in ib:
                parts.append(
                    f"BMI: {ib['bmi']}({ib['bmi_cat']}) | BMR: {ib['bmr']}kcal"
                )
            parts.append(f"BF: {ib['bf_pct']}%({ib['bf_cat']})")
        if ctx.get("injuries"):
            strs = [f"{inj['part']}({inj['severity']}/10)" for inj in ctx["injuries"]]
            parts.append(f"Injuries: {','.join(strs)}")

        user_msg = (
            f"Apply these coach corrections to the workout plan:\n"
            f"Coach Notes:\n{coach_notes}\n"
            f"[Context] {' | '.join(parts)}\n"
            f"[Original Plan]\n{original_plan}"
        )

        # Apply corrections to context
        corrected_ctx = copy.deepcopy(ctx)
        for review in reviews:
            issue = review["issue"]
            if issue == "no_cardio_for_high_bf" and corrected_ctx.get("inbody"):
                corrected_ctx["inbody"]["bf_cat"] = "higher"
            elif issue == "injury_protocol_violation" and not corrected_ctx.get(
                "injuries"
            ):
                corrected_ctx["injuries"] = [
                    {
                        "part": random.choice(BODY_PARTS_INJURY),
                        "severity": 5,
                        "type": "strain",
                        "label": "moderate",
                    }
                ]
            elif issue == "wrong_rep_range_for_goal":
                pass  # rep range correction already handled by goal in format method
            elif issue == "beginner_on_advanced_exercises":
                corrected_ctx["level"] = "Beginner"

        corrected_exercises = [
            self._get_exercises_for_day(dt, corrected_ctx, n=n_ex)
            for dt in split["days"]
        ]
        corrected_plan = self._format_compact_plan(
            corrected_ctx, split, corrected_exercises
        )
        issues_applied = "|".join([r["issue"].upper() for r in reviews])

        response = f"COACH_CORRECTIONS_APPLIED:{issues_applied}\n{corrected_plan}"
        return {"user": user_msg, "assistant": response}

    # ------------------------------------------------------------------
    # NEW v6: DPO PREFERENCE PAIR GENERATION
    # ------------------------------------------------------------------

    def _make_rejected_plan(
        self,
        ctx: Dict,
        split: Dict,
        day_exercises: List[List[Dict]],
    ) -> str:
        """
        Produce an intentionally flawed version of the plan.
        Violations injected (one or more per pair):
          - No warm-up
          - Wrong rep ranges for goal
          - Exceeds MRV
          - No cardio when BF is high
          - Exercises contraindicated for injury not removed
          - Isolation before compound
        """
        violations = random.sample(
            [
                "no_warmup",
                "wrong_rep_range",
                "over_mrv",
                "no_cardio",
                "ignore_injury",
                "isolation_first",
            ],
            k=random.randint(1, 3),
        )

        goal = ctx["goal"]
        level = ctx["level"]
        days = ctx["days"]
        inbody = ctx.get("inbody")
        week_ctx = ctx.get("week_ctx", {})
        week_num = week_ctx.get("week", 1)
        total_w = week_ctx.get("total_weeks", 4)
        phase = week_ctx.get("phase", "Accumulation")

        lines = []
        lines.append(
            f"PLAN:{days}d {split['name']}|{goal}|{level}|"
            f"{total_w}w|W{week_num}/{total_w}({phase})"
        )

        # Intentionally omit INBODY / CARDIO in some violations
        if "no_cardio" not in violations and inbody and "bmi" in inbody:
            lines.append(
                f"INBODY:BMI={inbody['bmi']}({inbody['bmi_cat']})|"
                f"BMR={inbody['bmr']}kcal|BF={inbody['bf_pct']}%({inbody['bf_cat']})"
            )

        # Schedule (still include - not a violation point)
        sched = random.choice(REST_DAY_SCHEDULES.get(days, REST_DAY_SCHEDULES[4]))
        lines.append(f"SCHED:{','.join(sched)}")

        # Wrong rep ranges
        if "wrong_rep_range" in violations:
            wrong_reps_map = {
                "Strength": "15-20",  # strength goal but endurance reps
                "Muscle": "3-5",  # hypertrophy goal but strength reps
                "WeightLoss": "5-6",  # fat loss goal but heavy strength reps
                "Endurance": "4-6",  # endurance goal but strength reps
                "General": "1-3",  # general but max strength reps
            }
            bad_reps = wrong_reps_map.get(goal, "20-25")
        else:
            bad_reps = None

        for i, (day_tmpl, exs) in enumerate(zip(split["days"], day_exercises), 1):
            muscles_str = ",".join(day_tmpl["muscles"][:4])
            dur = random.randint(40, 70)
            lines.append("---")
            lines.append(f"D{i}:{day_tmpl['name']}[{muscles_str}]{dur}min")

            # Intentionally omit warm-up
            if "no_warmup" not in violations:
                warmup_str = self._get_warmup_for_day(
                    day_tmpl["name"], day_tmpl["patterns"], []
                )
                lines.append(f"WARMUP:{warmup_str}")

            # Isolation before compound (if violation)
            ordered_exs = list(exs)
            if "isolation_first" in violations:
                iso = [ex for ex in ordered_exs if ex.get("mechanic") != "compound"]
                comp = [ex for ex in ordered_exs if ex.get("mechanic") == "compound"]
                ordered_exs = iso + comp

            for j, ex in enumerate(ordered_exs, 1):
                sets = 7 if "over_mrv" in violations else 3
                reps = bad_reps if bad_reps else "8-12"
                rest = 30
                mech = "C" if ex.get("mechanic") == "compound" else "I"
                sfr = ex.get("sfr_ratio", 1.0)
                equip = ex.get("equipment", "body only")
                # Ignore injury markers
                lines.append(
                    f"{j}.{ex['name']}|{sets}x{reps}|{rest}s|{mech}|"
                    f"RPE10/RIR0|SFR{sfr:.1f}|{equip}"
                )

        lines.append("---")
        lines.append("PROG:no_progression_plan")
        lines.append(f"VIOLATIONS:{','.join(violations)}")
        return "\n".join(lines)

    def generate_preference_pair(self) -> Dict:
        """
        Single DPO preference pair.
        Returns {"prompt": ..., "chosen": ..., "rejected": ...}
        """
        ctx = self._random_user_context()
        days = ctx["days"]
        split = random.choice(SPLIT_TEMPLATES.get(days, SPLIT_TEMPLATES[4]))
        n_ex = 5 if ctx["level"] == "Beginner" else 6
        day_exercises = [
            self._get_exercises_for_day(dt, ctx, n=n_ex) for dt in split["days"]
        ]
        prompt = self._build_user_message(ctx)
        chosen = self._format_compact_plan(ctx, split, day_exercises)
        rejected = self._make_rejected_plan(ctx, split, day_exercises)
        return {"prompt": prompt, "chosen": chosen, "rejected": rejected}

    # ------------------------------------------------------------------
    # DATASET GENERATION
    # ------------------------------------------------------------------

    def generate_dataset(self, n: int = 14000) -> List[Dict]:
        """
        Generate the full SFT training dataset.

        Distribution (v6):
          35%  Expert programs          (high-quality reference plans)
          27%  Regular plans            (diverse random contexts)
          10%  Injury-specific plans    (safety handling)
          15%  Session feedback         (learn from user reviews)
          13%  Coach reviews            (learn from expert corrections)
        """
        n_expert = int(n * 0.35)
        n_regular = int(n * 0.27)
        n_injury = int(n * 0.10)
        n_feedback = int(n * 0.15)
        n_coach = n - n_expert - n_regular - n_injury - n_feedback

        print(f"\nGenerating {n} training examples:")
        print(f"  {n_regular:5d}  regular plans")
        print(f"  {n_expert:5d}  expert programs")
        print(f"  {n_injury:5d}  injury-specific plans")
        print(f"  {n_feedback:5d}  session feedback examples")
        print(f"  {n_coach:5d}  coach review examples")

        data: List[Dict] = []
        for _ in tqdm(range(n_regular), desc="Regular"):
            data.append(self.generate_example())
        for _ in tqdm(range(n_expert), desc="Expert"):
            data.append(self.generate_expert_example())
        for _ in tqdm(range(n_injury), desc="Injury"):
            data.append(self.generate_injury_example())
        for _ in tqdm(range(n_feedback), desc="Feedback"):
            data.append(self.generate_session_feedback_example())
        for _ in tqdm(range(n_coach), desc="Coach"):
            data.append(self.generate_coach_review_example())

        random.shuffle(data)
        return data

    def generate_dpo_pairs(self, n: int = 3000) -> List[Dict]:
        """Generate DPO preference pairs for Stage-2 training."""
        print(f"\nGenerating {n} DPO preference pairs...")
        pairs: List[Dict] = []
        for _ in tqdm(range(n), desc="DPO pairs"):
            pairs.append(self.generate_preference_pair())
        return pairs


# ============================================================================
# EXTERNAL EXAMPLE LOADER
# ============================================================================


def load_external_examples(
    advice_path: Path,
    info_path: Path,
    n_advice: int = NUM_ADVICE_EXAMPLES,
    n_info: int = NUM_INFO_EXAMPLES,
) -> List[Dict]:
    """
    Load fitness-advice Q&A pairs (Advices_Dataset.csv → advice_examples_v6.jsonl)
    and exercise-info Q&A pairs (workout-instructions → exercise_info_v6.jsonl)
    produced by build_exercise_db_v6.py.

    Each pair already has {"user": ..., "assistant": ...} format so it slots
    directly into the SFT training mix.  The model learns to:
      - Give contextual fitness advice (advice Q&A)
      - Explain specific exercises on demand (exercise-info Q&A)

    These complement but do NOT replace the core plan-generation examples.
    """
    examples: List[Dict] = []
    sources = [
        (advice_path, "advice", n_advice),
        (info_path, "exercise-info", n_info),
    ]
    for path, label, n in sources:
        if not path.exists():
            print(f"  [WARN] {path.name} not found — skipping {label} examples.")
            continue
        count = 0
        with open(path, "r", encoding="utf-8") as fh:
            for line in fh:
                if count >= n:
                    break
                try:
                    ex = json.loads(line.strip())
                    u = ex.get("user", "").strip()
                    a = ex.get("assistant", "").strip()
                    if u and a and len(a) >= 50:
                        examples.append({"user": u, "assistant": a})
                        count += 1
                except (json.JSONDecodeError, KeyError):
                    continue
        print(f"  Loaded {count:4d} {label} examples from {path.name}")
    return examples


# ============================================================================
# CHAT FORMAT
# ============================================================================


def format_chat_for_training(example: Dict, tokenizer) -> str:
    """Format as Qwen2.5 chat template for SFT."""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": example["user"]},
        {"role": "assistant", "content": example["assistant"]},
    ]
    return tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=False
    )


def format_dpo_for_training(pair: Dict, tokenizer) -> Dict:
    """
    Format a DPO preference pair for TRL DPOTrainer.
    Returns {"prompt": str, "chosen": str, "rejected": str}
    where each string is a formatted chat template.
    """
    system_msg = {"role": "system", "content": SYSTEM_PROMPT}
    user_msg = {"role": "user", "content": pair["prompt"]}

    def _fmt(response: str) -> str:
        msgs = [system_msg, user_msg, {"role": "assistant", "content": response}]
        return tokenizer.apply_chat_template(
            msgs, tokenize=False, add_generation_prompt=False
        )

    prompt_msgs = [system_msg, user_msg]
    prompt_text = tokenizer.apply_chat_template(
        prompt_msgs, tokenize=False, add_generation_prompt=True
    )
    return {
        "prompt": prompt_text,
        "chosen": _fmt(pair["chosen"]),
        "rejected": _fmt(pair["rejected"]),
    }


# ============================================================================
# MAIN
# ============================================================================


def main():
    print("\n" + "=" * 70)
    print("STEP 1: Loading Exercise Database")
    print("=" * 70)

    if not DATA_FILE.exists():
        print(f"ERROR: {DATA_FILE} not found!")
        print("Run build_exercise_db.py first to create the exercise DB.")
        sys.exit(1)

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        exercises = json.load(f)
    print(f"Loaded {len(exercises)} exercises")

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 2: Generating Training Data (SFT)")
    print("=" * 70)

    if not WARMUP_LIB_FILE.exists():
        print(
            f"\n  [INFO] {WARMUP_LIB_FILE.name} not found.\n"
            "  Run  python build_exercise_db_v6.py  first to build real\n"
            "  warm-up exercises from the CSV datasets.\n"
            "  The built-in warm-up library will be used for now.\n"
        )
    generator = WorkoutGeneratorV6(exercises, warmup_lib_path=WARMUP_LIB_FILE)

    # ── SFT data ──
    if TRAINING_DATA_FILE.exists():
        print(f"Existing SFT file: {TRAINING_DATA_FILE}")
        resp = input("Regenerate SFT data? (y/n): ").strip().lower()
        if resp == "y":
            training_data = generator.generate_dataset(NUM_SAMPLES)
            with open(TRAINING_DATA_FILE, "w", encoding="utf-8") as f:
                for item in training_data:
                    f.write(json.dumps(item, ensure_ascii=False) + "\n")
            print(f"Saved {len(training_data)} SFT examples -> {TRAINING_DATA_FILE}")
        else:
            training_data = []
            with open(TRAINING_DATA_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    training_data.append(json.loads(line))
            print(f"Loaded {len(training_data)} existing SFT examples")
    else:
        training_data = generator.generate_dataset(NUM_SAMPLES)
        with open(TRAINING_DATA_FILE, "w", encoding="utf-8") as f:
            for item in training_data:
                f.write(json.dumps(item, ensure_ascii=False) + "\n")
        print(f"Saved {len(training_data)} SFT examples -> {TRAINING_DATA_FILE}")

    # ── DPO data ──
    if DPO_DATA_FILE.exists():
        print(f"\nExisting DPO file: {DPO_DATA_FILE}")
        resp2 = input("Regenerate DPO pairs? (y/n): ").strip().lower()
        if resp2 == "y":
            dpo_pairs = generator.generate_dpo_pairs(NUM_DPO_PAIRS)
            with open(DPO_DATA_FILE, "w", encoding="utf-8") as f:
                for pair in dpo_pairs:
                    f.write(json.dumps(pair, ensure_ascii=False) + "\n")
            print(f"Saved {len(dpo_pairs)} DPO pairs -> {DPO_DATA_FILE}")
        else:
            print("Skipping DPO regeneration.")
    else:
        dpo_pairs = generator.generate_dpo_pairs(NUM_DPO_PAIRS)
        with open(DPO_DATA_FILE, "w", encoding="utf-8") as f:
            for pair in dpo_pairs:
                f.write(json.dumps(pair, ensure_ascii=False) + "\n")
        print(f"Saved {len(dpo_pairs)} DPO pairs -> {DPO_DATA_FILE}")

    # ── Merge external examples (advice + exercise-info) ──
    print("\nLoading external training examples ...")
    external_examples = load_external_examples(ADVICE_FILE, EXERCISE_INFO_FILE)
    if external_examples:
        training_data = training_data + external_examples
        random.shuffle(training_data)
        print(f"  Total SFT examples after external merge: {len(training_data)}")
    else:
        print(
            "  No external examples loaded.\n"
            "  Run  python build_exercise_db_v6.py  to generate them."
        )

    # Preview
    sample = training_data[0]
    print(f"\n--- SAMPLE USER ---\n{sample['user'][:300]}")
    print(f"\n--- SAMPLE ASSISTANT ---\n{sample['assistant'][:500]}")

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 3: Loading Qwen2.5-3B-Instruct (4-bit QLoRA)")
    print("=" * 70)

    if not torch.cuda.is_available():
        print("WARN: No CUDA GPU found. Training will be very slow on CPU.")
        print("Recommended: RTX 4050 6 GB or better.")

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16
        if torch.cuda.is_bf16_supported()
        else torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    print(f"Loading tokenizer: {MODEL_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    print("Loading model in 4-bit ...")
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
        torch_dtype=torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16,
        attn_implementation="sdpa",
    )
    model = prepare_model_for_kbit_training(model)
    model.config.use_cache = False

    vram = torch.cuda.memory_allocated() / 1e9 if torch.cuda.is_available() else 0
    print(f"Model loaded. VRAM: {vram:.2f} GB  |  Params: {model.num_parameters():,}")

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 4: QLoRA Adapters")
    print("=" * 70)

    lora_config = LoraConfig(
        r=QLORA_R,
        lora_alpha=QLORA_ALPHA,
        target_modules=QLORA_TARGET_MODULES,
        lora_dropout=QLORA_DROPOUT,
        bias="none",
        task_type=TaskType.CAUSAL_LM,
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 5: Preparing Dataset")
    print("=" * 70)

    print("Formatting as chat messages ...")
    formatted = []
    for ex in tqdm(training_data, desc="Formatting"):
        formatted.append({"text": format_chat_for_training(ex, tokenizer)})

    dataset = Dataset.from_list(formatted)
    split = dataset.train_test_split(test_size=0.05, seed=SEED)
    print(f"Train: {len(split['train'])}  |  Eval: {len(split['test'])}")
    sample_tok = tokenizer(formatted[0]["text"], return_tensors="pt")
    print(f"Sample token length: {sample_tok['input_ids'].shape[1]}")

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 6: SFTConfig")
    print("=" * 70)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    training_args = SFTConfig(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        gradient_accumulation_steps=GRADIENT_ACCUMULATION,
        learning_rate=LEARNING_RATE,
        weight_decay=WEIGHT_DECAY,
        warmup_ratio=WARMUP_RATIO,
        lr_scheduler_type=LR_SCHEDULER,
        max_grad_norm=MAX_GRAD_NORM,
        logging_dir=str(OUTPUT_DIR / "logs"),
        logging_steps=10,
        eval_strategy="steps",
        eval_steps=200,
        save_strategy="steps",
        save_steps=200,
        save_total_limit=3,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        fp16=not torch.cuda.is_bf16_supported(),
        bf16=torch.cuda.is_bf16_supported(),
        max_seq_length=MAX_SEQ_LENGTH,
        packing=False,
        assistant_only_loss=True,
        gradient_checkpointing=True,
        gradient_checkpointing_kwargs={"use_reentrant": False},
        optim="paged_adamw_8bit",
        report_to="tensorboard",
        dataloader_num_workers=0,
        dataloader_pin_memory=True,
        dataset_text_field="text",
    )

    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=split["train"],
        eval_dataset=split["test"],
        processing_class=tokenizer,
    )

    print(f"Epochs                : {EPOCHS}")
    print(f"Batch size            : {BATCH_SIZE}")
    print(f"Gradient accumulation : {GRADIENT_ACCUMULATION}")
    print(f"Effective batch size  : {BATCH_SIZE * GRADIENT_ACCUMULATION}")
    print(f"Learning rate         : {LEARNING_RATE}")
    print(f"Max seq length        : {MAX_SEQ_LENGTH}")
    print("Optimizer             : paged_adamw_8bit")
    print("Gradient checkpointing: ON")
    print("Loss masking          : assistant_only_loss=True")
    if torch.cuda.is_available():
        print(f"VRAM before training  : {torch.cuda.memory_allocated() / 1e9:.2f} GB")

    # ========================================================================
    print("\n" + "=" * 70)
    print("STEP 7: Training (Stage 1 – SFT)")
    print("=" * 70)
    print(f"Checkpoints : {OUTPUT_DIR}")
    print(f"TensorBoard : tensorboard --logdir {OUTPUT_DIR / 'logs'}")
    print("=" * 70)

    input("\nPress ENTER to start SFT training ...")

    try:
        trainer.train()

        print("\n" + "=" * 70)
        print("SFT Training Complete!")
        print("=" * 70)

        print("\nEvaluating ...")
        eval_results = trainer.evaluate()
        for k, v in eval_results.items():
            print(f"  {k}: {v:.4f}" if isinstance(v, float) else f"  {k}: {v}")

        print("\nSaving model ...")
        trainer.save_model(str(OUTPUT_DIR))
        tokenizer.save_pretrained(str(OUTPUT_DIR))
        lora_dir = OUTPUT_DIR / "lora_adapter"
        model.save_pretrained(str(lora_dir))
        print(f"Model saved      : {OUTPUT_DIR}")
        print(f"LoRA adapter     : {lora_dir}")

        info = {
            "model": MODEL_NAME,
            "version": "v6.0.0",
            "method": "QLoRA-SFT",
            "quantization": "4-bit NF4",
            "lora_r": QLORA_R,
            "lora_alpha": QLORA_ALPHA,
            "epochs": EPOCHS,
            "sft_samples": NUM_SAMPLES,
            "dpo_pairs": NUM_DPO_PAIRS,
            "new_features": [
                "warmup_per_day",
                "bmi_bmr_tdee_from_inbody",
                "cardio_prescription",
                "session_feedback_learning",
                "coach_review_learning",
                "dpo_preference_pairs",
            ],
            "exercises": len(exercises),
            "eval_loss": eval_results.get("eval_loss"),
            "timestamp": datetime.now().isoformat(),
            "gpu": torch.cuda.get_device_name(0)
            if torch.cuda.is_available()
            else "CPU",
        }
        with open(OUTPUT_DIR / "training_info.json", "w") as f:
            json.dump(info, f, indent=2)
        print("\nTraining info saved.")

        # ── Stage 2: DPO (optional) ──
        print("\n" + "=" * 70)
        print("STEP 8: Stage 2 – DPO Training (optional)")
        print("=" * 70)
        print("DPO training teaches the model to prefer correct plans")
        print("over plans that violate training principles.")
        print(f"Preference pairs: {DPO_DATA_FILE}")
        do_dpo = input("\nRun DPO stage now? (y/n): ").strip().lower()

        if do_dpo == "y":
            try:
                from trl import DPOConfig, DPOTrainer

                print("\nLoading DPO pairs ...")
                dpo_raw = []
                with open(DPO_DATA_FILE, "r", encoding="utf-8") as f:
                    for line in f:
                        dpo_raw.append(json.loads(line))

                print("Formatting DPO pairs ...")
                dpo_formatted = [
                    format_dpo_for_training(p, tokenizer) for p in tqdm(dpo_raw)
                ]
                dpo_dataset = Dataset.from_list(dpo_formatted)
                dpo_split = dpo_dataset.train_test_split(test_size=0.05, seed=SEED)

                DPO_OUTPUT_DIR = OUTPUT_DIR / "dpo"
                DPO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

                dpo_args = DPOConfig(
                    output_dir=str(DPO_OUTPUT_DIR),
                    num_train_epochs=1,
                    per_device_train_batch_size=BATCH_SIZE,
                    gradient_accumulation_steps=GRADIENT_ACCUMULATION,
                    learning_rate=5e-5,
                    beta=0.1,
                    fp16=not torch.cuda.is_bf16_supported(),
                    bf16=torch.cuda.is_bf16_supported(),
                    logging_steps=10,
                    save_steps=100,
                    eval_strategy="steps",
                    eval_steps=100,
                    gradient_checkpointing=True,
                    gradient_checkpointing_kwargs={"use_reentrant": False},
                    optim="paged_adamw_8bit",
                    report_to="tensorboard",
                    logging_dir=str(DPO_OUTPUT_DIR / "logs"),
                    max_length=MAX_SEQ_LENGTH,
                )

                dpo_trainer = DPOTrainer(
                    model=model,
                    ref_model=None,  # None = use implicit reference (PEFT-based)
                    args=dpo_args,
                    train_dataset=dpo_split["train"],
                    eval_dataset=dpo_split["test"],
                    processing_class=tokenizer,
                )

                print("\nStarting DPO training ...")
                dpo_trainer.train()
                dpo_trainer.save_model(str(DPO_OUTPUT_DIR))
                tokenizer.save_pretrained(str(DPO_OUTPUT_DIR))
                print(f"DPO model saved: {DPO_OUTPUT_DIR}")

            except ImportError:
                print("DPO requires trl >= 0.7. Install with: pip install trl>=0.7")
            except Exception as e:
                import traceback

                print(f"DPO error: {e}")
                traceback.print_exc()
        else:
            print("Skipping DPO stage.")
            print(f"You can run DPO later using: {DPO_DATA_FILE}")

        print("\n" + "=" * 70)
        print("All done! Model is ready for inference.")
        print(f"Load with: AutoModelForCausalLM.from_pretrained('{OUTPUT_DIR}')")
        print("=" * 70)

    except KeyboardInterrupt:
        print("\n\nTraining interrupted by user.")
        trainer.save_model(str(OUTPUT_DIR / "interrupted"))
        print(f"Checkpoint saved: {OUTPUT_DIR / 'interrupted'}")

    except Exception as e:
        import traceback

        print(f"\nFatal error: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    main()
