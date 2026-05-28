import os
import json
import random
from pathlib import Path

import torch
from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    BitsAndBytesConfig,
)
from peft import (
    LoraConfig,
    prepare_model_for_kbit_training,
    get_peft_model,
)
from trl import SFTTrainer

# =========================================================
# CONFIG
# =========================================================

MODEL_NAME = "Qwen/Qwen2.5-3B-Instruct"
OUTPUT_DIR = "adaptive-fitness-coach-v1"

WORKOUT_BRAIN_FILE = "workout_brain_improved.json"
EXERCISE_DB_FILE = "exercise_database.json"
WARMUP_DB_FILE = "warmup_cardio_support.json"

MAX_LENGTH = 2048
SEED = 42

# =========================================================
# TRAINING HYPERPARAMETERS
# =========================================================

EPOCHS = 2
LEARNING_RATE = 2e-5
BATCH_SIZE = 1
GRAD_ACCUM = 8

# =========================================================
# QLORA SETTINGS
# =========================================================

LORA_R = 32
LORA_ALPHA = 64
LORA_DROPOUT = 0.1

# =========================================================
# SYSTEM PROMPT
# =========================================================

SYSTEM_PROMPT = """
You are an elite adaptive fitness coach.

You intelligently:
- create workout plans
- analyze fatigue
- manage recovery
- adjust progression
- modify plans from feedback
- handle injuries safely
- recommend cardio
- generate warmups
- evolve plans week-to-week

You do NOT generate static template programs.
You adapt training based on:
- previous plans
- client feedback
- recovery
- fatigue
- progression
- injuries
- adherence
"""

# =========================================================
# RANDOM SEED
# =========================================================

random.seed(SEED)
torch.manual_seed(SEED)

# =========================================================
# LOAD TOKENIZER
# =========================================================

print("Loading tokenizer...")

tokenizer = AutoTokenizer.from_pretrained(
    MODEL_NAME,
    trust_remote_code=True,
)

tokenizer.pad_token = tokenizer.eos_token

# =========================================================
# QUANTIZATION CONFIG
# =========================================================

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
)

# =========================================================
# LOAD MODEL
# =========================================================

print("Loading model...")

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
    torch_dtype=torch.bfloat16,
)

model.config.use_cache = False

model = prepare_model_for_kbit_training(model)

# =========================================================
# LORA CONFIG
# =========================================================

peft_config = LoraConfig(
    r=LORA_R,
    lora_alpha=LORA_ALPHA,
    lora_dropout=LORA_DROPOUT,
    bias="none",
    task_type="CAUSAL_LM",
    target_modules=[
        "q_proj",
        "k_proj",
        "v_proj",
        "o_proj",
        "gate_proj",
        "up_proj",
        "down_proj",
    ],
)

model = get_peft_model(model, peft_config)

# =========================================================
# LOAD DATASETS
# =========================================================

print("Loading datasets...")

with open(WORKOUT_BRAIN_FILE, "r", encoding="utf-8") as f:
    workout_brain = json.load(f)

with open(EXERCISE_DB_FILE, "r", encoding="utf-8") as f:
    exercise_db = json.load(f)

with open(WARMUP_DB_FILE, "r", encoding="utf-8") as f:
    warmup_db = json.load(f)

# =========================================================
# HELPERS
# =========================================================

GOALS = [
    "Muscle Gain",
    "Weight Loss",
    "Strength",
    "Endurance",
]

LEVELS = [
    "Beginner",
    "Intermediate",
    "Advanced",
]

INJURIES = [
    "Shoulder",
    "Knee",
    "Lower Back",
    "Elbow",
    "Hip",
    None,
]

RECOVERY_STATES = [
    "Poor",
    "Moderate",
    "Good",
]

FATIGUE_STATES = [
    "Low",
    "Moderate",
    "High",
]

# =========================================================
# EXERCISE RETRIEVAL
# =========================================================


def retrieve_exercises(target_muscle, limit=5):

    matches = []

    for ex in exercise_db:

        muscle = str(ex.get("target_muscle", "")).lower()

        if target_muscle.lower() in muscle:
            matches.append(ex)

    random.shuffle(matches)

    return matches[:limit]

# =========================================================
# WARMUP RETRIEVAL
# =========================================================


def retrieve_warmups(limit=3):

    random.shuffle(warmup_db)

    return warmup_db[:limit]

# =========================================================
# SYNTHETIC ADAPTIVE TRAINING EXAMPLES
# =========================================================


def generate_example():

    base_program = random.choice(workout_brain)

    goal = random.choice(GOALS)
    level = random.choice(LEVELS)
    injury = random.choice(INJURIES)
    recovery = random.choice(RECOVERY_STATES)
    fatigue = random.choice(FATIGUE_STATES)

    previous_plan = {
        "split": base_program.get("split_type"),
        "days_per_week": base_program.get("days_per_week"),
        "week": random.randint(1, 8),
    }

    feedback = {
        "recovery": recovery,
        "fatigue": fatigue,
        "motivation": random.choice([
            "Low",
            "Moderate",
            "High",
        ]),
        "missed_sessions": random.randint(0, 2),
    }

    if injury:
        feedback["injury"] = injury

    modifications = []

    if fatigue == "High":
        modifications.append("Reduce total volume")

    if recovery == "Poor":
        modifications.append("Add additional recovery day")

    if injury:
        modifications.append(f"Replace exercises aggravating {injury}")

    workout_days = []

    for day in base_program.get("workout_days", [])[:3]:

        focus = day.get("focus_muscles", [])

        exercises = []

        for muscle in focus[:2]:

            retrieved = retrieve_exercises(muscle, limit=2)

            for ex in retrieved:

                exercises.append({
                    "exercise": ex.get("exercise_name"),
                    "sets": random.choice([3, 4]),
                    "reps": random.choice([
                        "6-8",
                        "8-10",
                        "10-12",
                    ]),
                })

        warmups = retrieve_warmups(limit=2)

        workout_days.append({
            "day": day.get("label"),
            "focus": focus,
            "warmups": [
                w.get("name") for w in warmups
            ],
            "exercises": exercises,
        })

    cardio = None

    if goal == "Weight Loss":

        cardio = {
            "type": random.choice([
                "LISS",
                "HIIT",
            ]),
            "frequency": "3x weekly",
            "duration": "20-30 min",
        }

    response = {
        "analysis": modifications,
        "updated_plan": {
            "goal": goal,
            "experience_level": level,
            "workout_days": workout_days,
            "cardio": cardio,
        },
    }

    messages = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT,
        },
        {
            "role": "user",
            "content": json.dumps({
                "client_goal": goal,
                "experience_level": level,
                "previous_plan": previous_plan,
                "feedback": feedback,
            }, indent=2),
        },
        {
            "role": "assistant",
            "content": json.dumps(response, indent=2),
        },
    ]

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=False,
    )

    return {
        "text": text,
    }

# =========================================================
# BUILD DATASET
# =========================================================

print("Generating adaptive training samples...")

samples = []

for _ in range(12000):
    samples.append(generate_example())

train_dataset = Dataset.from_list(samples)

print(f"Training samples: {len(train_dataset)}")

# =========================================================
# TRAINING ARGUMENTS
# =========================================================

training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    num_train_epochs=EPOCHS,
    per_device_train_batch_size=BATCH_SIZE,
    gradient_accumulation_steps=GRAD_ACCUM,
    learning_rate=LEARNING_RATE,
    logging_steps=10,
    save_strategy="epoch",
    bf16=True,
    gradient_checkpointing=True,
    warmup_ratio=0.05,
    lr_scheduler_type="cosine",
    weight_decay=0.01,
    max_grad_norm=1.0,
    optim="paged_adamw_8bit",
    report_to="none",
)

# =========================================================
# TRAINER
# =========================================================

trainer = SFTTrainer(
    model=model,
    train_dataset=train_dataset,
    args=training_args,
    tokenizer=tokenizer,
    dataset_text_field="text",
    max_seq_length=MAX_LENGTH,
    packing=False,
)

# =========================================================
# TRAIN
# =========================================================

print("Starting training...")

trainer.train()

# =========================================================
# SAVE MODEL
# =========================================================

print("Saving model...")

trainer.save_model(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

print("Training complete.")