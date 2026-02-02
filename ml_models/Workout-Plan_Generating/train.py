#!/usr/bin/env python3
"""
Workout Plan Generator - Complete Training Script
Fine-tunes google/flan-t5-base with LoRA for generating personalized workout plans

Features:
- Automatic training data generation (if not provided)
- LoRA fine-tuning for efficiency
- Mixed precision training
- Evaluation and metrics calculation
- Model checkpointing
- Production-ready inference testing

Usage:
    python train.py --data training_data.jsonl --epochs 5
    
Requirements:
    torch>=2.1.0
    transformers>=4.35.0
    peft>=0.7.0
    datasets>=2.15.0
    accelerate>=0.25.0
    tensorboard>=2.14.0
    wandb>=0.16.0
"""

import os
import json
import argparse
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import numpy as np
import pandas as pd
from tqdm import tqdm

import torch
from torch.cuda import is_available as cuda_available
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    Seq2SeqTrainingArguments,
    Seq2SeqTrainer,
    DataCollatorForSeq2Seq,
    set_seed
)
from peft import LoraConfig, get_peft_model, TaskType
from datasets import load_dataset, Dataset
import wandb

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
MODEL_NAME = "google/flan-t5-base"
DEFAULT_OUTPUT_DIR = "./models/workout-generator-v1"
MAX_INPUT_LENGTH = 512
MAX_OUTPUT_LENGTH = 2048
SEED = 42

# Data paths (relative to ml_models directory)
EXERCISE_DB_PATH = "../_ML/Dataset/Dataset_Workout_plans.csv"  # 7961 real exercises!
GYM_MEMBERS_CSV = "../_ML/Dataset/gym recommendation.csv"  # 14591 user profiles!
# Optional: 30 exercises with GIFs
EXERCISEDB_JSON_PATH = "../_ML/exercisedb_v1_sample/exercises.json"

# ========================================
# Data Generation & Preprocessing
# ========================================


class TrainingDataGenerator:
    """Generate training data using REAL exercise database and gym member data"""

    FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced"]
    FITNESS_GOALS = ["Strength", "Muscle", "Cardio", "WeightLoss", "Endurance"]

    def __init__(self, exercise_db_path: str = None, gym_data_path: str = None):
        """Load real exercise database and gym member data"""
        # Load exercise database
        if exercise_db_path and os.path.exists(exercise_db_path):
            logger.info(
                f"Loading exercise database from {exercise_db_path}...")
            with open(exercise_db_path, 'r') as f:
                self.exercises = json.load(f)
            logger.info(f"✅ Loaded {len(self.exercises)} real exercises")
        else:
            logger.warning("Exercise database not found, using fallback data")
            self.exercises = self._get_fallback_exercises()

        # Load gym member data (optional - for realistic user profiles)
        self.gym_members_df = None
        if gym_data_path and os.path.exists(gym_data_path):
            try:
                logger.info(f"Loading gym member data from {gym_data_path}...")
                self.gym_members_df = pd.read_csv(gym_data_path)
                logger.info(
                    f"✅ Loaded {len(self.gym_members_df)} gym member profiles")
            except Exception as e:
                logger.warning(f"Could not load gym data: {e}")

        # Organize exercises by body part and equipment
        self._organize_exercises()

    def _get_fallback_exercises(self) -> List[Dict]:
        """Fallback exercises if database not found"""
        return [
            {"name": "Barbell Bench Press", "bodyParts": ["chest"], "equipments": ["barbell"],
             "targetMuscles": ["pectorals"], "secondaryMuscles": ["shoulders", "triceps"]},
            {"name": "Barbell Squat", "bodyParts": ["upper legs"], "equipments": ["barbell"],
             "targetMuscles": ["quadriceps"], "secondaryMuscles": ["glutes", "hamstrings"]},
            {"name": "Barbell Row", "bodyParts": ["back"], "equipments": ["barbell"],
             "targetMuscles": ["latissimus dorsi"], "secondaryMuscles": ["biceps", "trapezius"]}
        ]

    def _organize_exercises(self):
        """Organize exercises by body part and equipment for efficient selection"""
        self.exercises_by_bodypart = {}
        self.exercises_by_equipment = {}
        self.all_equipments = set()
        self.all_bodyparts = set()

        for exercise in self.exercises:
            # By body part
            for bodypart in exercise.get('bodyParts', []):
                self.all_bodyparts.add(bodypart)
                if bodypart not in self.exercises_by_bodypart:
                    self.exercises_by_bodypart[bodypart] = []
                self.exercises_by_bodypart[bodypart].append(exercise)

            # By equipment
            for equipment in exercise.get('equipments', []):
                self.all_equipments.add(equipment)
                if equipment not in self.exercises_by_equipment:
                    self.exercises_by_equipment[equipment] = []
                self.exercises_by_equipment[equipment].append(exercise)

        logger.info(
            f"Organized exercises: {len(self.all_bodyparts)} body parts, {len(self.all_equipments)} equipment types")

    def generate_sample(self, idx: int) -> Dict:
        """
        Generate a single training example using REAL exercises and gym member data
        Includes optional user context (InBody, muscle scan, strength profile, feedback)
        """
        import random

        # Use real gym member data for realistic profiles (if available)
        user_profile = self._get_realistic_user_profile()

        # Random parameters
        fitness_level = user_profile.get(
            'fitness_level', random.choice(self.FITNESS_LEVELS))
        goal = random.choice(self.FITNESS_GOALS)

        # Select random equipment from REAL exercise database
        available_equipment = random.sample(
            list(self.all_equipments),
            k=min(random.randint(2, 5), len(self.all_equipments))
        )
        days = random.choice([3, 4, 5])

        # Build input prompt with realistic user context
        input_text = f"Generate a {days}-day workout plan for {fitness_level.lower()} lifter, goal is {goal.lower()}"

        # Add InBody data (30% of samples) - use REAL gym member data
        if random.random() < 0.3 and user_profile:
            weight = user_profile.get('weight', random.randint(55, 95))
            fat_pct = user_profile.get(
                'fat_percentage', random.randint(10, 30))
            muscle_mass = int(weight * (1 - fat_pct / 100))
            input_text += f", user has {muscle_mass}kg muscle mass and {fat_pct}% body fat"

        # Add muscle scan data (20% of samples) - use real body parts
        if random.random() < 0.2:
            weak_areas = random.sample(
                list(self.all_bodyparts), k=random.randint(1, 2))
            input_text += f", focus on weak areas: {', '.join(weak_areas)}"

        # Add strength profile data (40% of samples)
        if random.random() < 0.4:
            bench_1rm = random.randint(60, 120)
            squat_1rm = random.randint(80, 160)
            input_text += f", user's known strength: Bench Press 1RM={bench_1rm}kg, Squat 1RM={squat_1rm}kg"

        if available_equipment:
            # Limit to 3 for readability
            equipment_str = ", ".join(available_equipment[:3])
            input_text += f", has access to {equipment_str}"

        injuries = random.choice([[], ["shoulder"], ["lower back"], ["knee"]])
        if injuries:
            input_text += f", avoid exercises for {', '.join(injuries)}"

        input_text += "."

        # Generate workout plan structure
        plan = {
            "plan_name": f"{days}-Day {goal} Split",
            "description": f"Optimized {goal.lower()} program for {fitness_level.lower()} lifters",
            "duration_weeks": random.choice([4, 6, 8, 12]),
            "difficulty": fitness_level,
            "goal": goal,
            "days_per_week": days,
            "days": []
        }

        # Generate days using REAL exercises from database
        for day_num in range(1, days + 1):
            day = {
                "day_number": day_num,
                "day_name": f"Day {day_num}",
                "exercises": []
            }

            # Random body parts for this day from REAL database
            num_exercises = random.randint(4, 7)
            day_bodyparts = random.sample(
                list(self.all_bodyparts),
                min(num_exercises, len(self.all_bodyparts))
            )

            for bodypart in day_bodyparts:
                # Get exercises for this body part that match available equipment
                available_exercises = [
                    ex for ex in self.exercises_by_bodypart.get(bodypart, [])
                    if any(eq in available_equipment for eq in ex.get('equipments', []))
                ]

                if not available_exercises:
                    continue

                # Select random exercise from REAL database
                exercise = random.choice(available_exercises)

                # Determine sets/reps based on goal
                if goal == "Strength":
                    sets, reps = random.choice(
                        [4, 5]), f"{random.randint(3, 6)}"
                    rest = random.choice([180, 240])
                elif goal == "Muscle":
                    sets, reps = random.choice(
                        [3, 4]), f"{random.randint(8, 12)}"
                    rest = random.choice([90, 120])
                else:  # Endurance/Cardio/WeightLoss
                    sets, reps = random.choice(
                        [2, 3]), f"{random.randint(12, 20)}"
                    rest = random.choice([60, 90])

                day["exercises"].append({
                    "exercise_id": exercise.get('exerciseId', hash(exercise['name']) % 1000),
                    "exercise_name": exercise['name'],
                    "muscle_group": bodypart,
                    "target_muscles": exercise.get('targetMuscles', []),
                    "secondary_muscles": exercise.get('secondaryMuscles', []),
                    "equipment": exercise.get('equipments', [])[0] if exercise.get('equipments') else 'bodyweight',
                    "sets": sets,
                    "reps": reps,
                    "rest_seconds": rest,
                    "notes": random.choice(["Focus on form", "Controlled tempo", "Full range of motion"])
                })

            plan["days"].append(day)

        # Progressive overload
        plan["progressive_overload"] = {
            "week_1_3": "Use 70-75% of 1RM, focus on form",
            "week_4_7": "Increase weight by 5-10%, maintain reps",
            "week_8": "Deload week (reduce weight by 30%)"
        }

        plan["metadata"] = {
            "total_exercises": sum(len(day["exercises"]) for day in plan["days"]),
            "equipment_needed": available_equipment,
            "bodyparts_targeted": day_bodyparts,
            "injuries_accommodated": injuries,
            "data_source": "exercisedb_v1"
        }

        return {
            "input": input_text,
            "output": json.dumps(plan, indent=2)
        }

    def _get_realistic_user_profile(self) -> Dict:
        """Get realistic user profile from gym member data"""
        if self.gym_members_df is None or len(self.gym_members_df) == 0:
            return {}

        import random

        # Select random gym member
        member = self.gym_members_df.sample(n=1).iloc[0]

        # Map experience level (1-3) to fitness level
        exp_level = member.get('Experience_Level', 2)
        fitness_map = {1: 'Beginner', 2: 'Intermediate', 3: 'Advanced'}

        return {
            'fitness_level': fitness_map.get(exp_level, 'Intermediate'),
            'weight': member.get('Weight (kg)', 70),
            'fat_percentage': member.get('Fat_Percentage', 20),
            'age': member.get('Age', 30),
            'bmi': member.get('BMI', 24),
            'workout_frequency': member.get('Workout_Frequency (days/week)', 3)
        }

    def generate_dataset(self, num_samples: int = 5000) -> List[Dict]:
        """Generate complete training dataset using REAL exercises and gym data"""
        logger.info(
            f"Generating {num_samples} training examples from REAL exercise database...")

        dataset = []
        for i in tqdm(range(num_samples), desc="Generating data"):
            dataset.append(self.generate_sample(i))

        return dataset

    def save_dataset(self, dataset: List[Dict], output_path: str) -> None:
        """Save dataset to JSONL format"""
        logger.info(f"Saving dataset to {output_path}...")

        with open(output_path, 'w') as f:
            for item in dataset:
                f.write(json.dumps(item) + '\n')

        logger.info(f"✅ Dataset saved: {len(dataset)} examples")
        logger.info(
            f"   Using {len(self.exercises)} real exercises from database")
        if self.gym_members_df is not None:
            logger.info(
                f"   Using {len(self.gym_members_df)} real gym member profiles")


# ========================================
# Model Training
# ========================================

class WorkoutGeneratorTrainer:
    """Training pipeline for workout generator model"""

    def __init__(
        self,
        model_name: str = MODEL_NAME,
        output_dir: str = DEFAULT_OUTPUT_DIR,
        max_input_length: int = MAX_INPUT_LENGTH,
        max_output_length: int = MAX_OUTPUT_LENGTH,
        use_wandb: bool = True
    ):
        """Initialize trainer"""
        self.model_name = model_name
        self.output_dir = output_dir
        self.max_input_length = max_input_length
        self.max_output_length = max_output_length

        # Determine device
        self.device = "cuda" if cuda_available() else "cpu"
        logger.info(f"Using device: {self.device}")

        # Initialize W&B if requested
        if use_wandb:
            wandb.init(
                project="workout-generator",
                name=f"training-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
                config={
                    "model": model_name,
                    "max_input_length": max_input_length,
                    "max_output_length": max_output_length,
                }
            )

        self.tokenizer = None
        self.model = None
        self.trainer = None

    def load_model_and_tokenizer(self) -> None:
        """Load pre-trained model and tokenizer"""
        logger.info(f"Loading tokenizer from {self.model_name}...")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)

        logger.info(f"Loading model from {self.model_name}...")
        dtype = torch.float16 if cuda_available() else torch.float32

        self.model = AutoModelForSeq2SeqLM.from_pretrained(
            self.model_name,
            torch_dtype=dtype,
            device_map="auto"
        )

        logger.info(
            f"✅ Model loaded. Parameters: {self.model.num_parameters():,}")

    def setup_lora(self) -> None:
        """Setup LoRA adapters for efficient fine-tuning"""
        logger.info("Setting up LoRA configuration...")

        lora_config = LoraConfig(
            r=16,                          # Rank
            lora_alpha=32,                  # Scaling factor
            target_modules=["q", "v"],      # Query and Value projections
            lora_dropout=0.05,              # Dropout for regularization
            bias="none",                    # Don't train bias
            task_type=TaskType.SEQ_2_SEQ_LM,
            inference_mode=False
        )

        self.model = get_peft_model(self.model, lora_config)
        self.model.print_trainable_parameters()

        # Expected output:
        # trainable params: 1,245,184 || all params: 249,124,864 || trainable%: 0.50%

    def preprocess_function(self, examples: Dict) -> Dict:
        """Preprocess training examples"""
        # Tokenize inputs
        model_inputs = self.tokenizer(
            examples['input'],
            max_length=self.max_input_length,
            padding='max_length',
            truncation=True,
            return_tensors=None
        )

        # Tokenize targets
        labels = self.tokenizer(
            examples['output'],
            max_length=self.max_output_length,
            padding='max_length',
            truncation=True,
            return_tensors=None
        )

        # Model expects labels in 'labels' field
        model_inputs['labels'] = labels['input_ids']

        return model_inputs

    def load_and_preprocess_data(self, data_path: str) -> tuple:
        """Load and preprocess training data"""
        logger.info(f"Loading dataset from {data_path}...")

        # Load dataset
        dataset = load_dataset('json', data_files=data_path)['train']

        logger.info(f"Dataset loaded: {len(dataset)} examples")

        # Split into train/test
        split_dataset = dataset.train_test_split(test_size=0.15, seed=SEED)

        logger.info("Preprocessing dataset...")

        # Preprocess
        tokenized_dataset = split_dataset.map(
            self.preprocess_function,
            batched=True,
            remove_columns=dataset.column_names,
            desc="Tokenizing"
        )

        return tokenized_dataset['train'], tokenized_dataset['test']

    def compute_metrics(self, eval_pred) -> Dict:
        """Compute evaluation metrics"""
        predictions, labels = eval_pred

        # Decode predictions
        decoded_preds = self.tokenizer.batch_decode(
            predictions,
            skip_special_tokens=True
        )

        # Decode labels (replace -100 with pad token first)
        labels = np.where(labels != -100, labels, self.tokenizer.pad_token_id)
        decoded_labels = self.tokenizer.batch_decode(
            labels,
            skip_special_tokens=True
        )

        # Count valid JSON outputs
        valid_json_count = 0
        for pred in decoded_preds:
            try:
                json.loads(pred)
                valid_json_count += 1
            except (json.JSONDecodeError, ValueError):
                pass

        json_validity = valid_json_count / len(decoded_preds)

        return {
            'json_validity': json_validity,
            'valid_samples': valid_json_count,
            'total_samples': len(decoded_preds)
        }

    def train(
        self,
        data_path: str,
        num_epochs: int = 5,
        batch_size: int = 4,
        learning_rate: float = 2e-4,
        gradient_accumulation_steps: int = 8,
        warmup_steps: int = 500
    ) -> None:
        """Run training pipeline"""

        # Load model
        self.load_model_and_tokenizer()

        # Setup LoRA
        self.setup_lora()

        # Load and preprocess data
        train_dataset, eval_dataset = self.load_and_preprocess_data(data_path)

        # Create output directory
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)

        # Training arguments
        training_args = Seq2SeqTrainingArguments(
            output_dir=self.output_dir,
            num_train_epochs=num_epochs,
            per_device_train_batch_size=batch_size,
            per_device_eval_batch_size=batch_size,
            gradient_accumulation_steps=gradient_accumulation_steps,
            learning_rate=learning_rate,
            weight_decay=0.01,
            warmup_steps=warmup_steps,
            logging_dir='./logs',
            logging_steps=50,
            eval_strategy="steps",
            eval_steps=500,
            save_strategy="steps",
            save_steps=500,
            save_total_limit=3,
            load_best_model_at_end=True,
            metric_for_best_model="eval_loss",
            greater_is_better=False,
            fp16=cuda_available(),
            report_to="wandb",
            predict_with_generate=True,
            generation_max_length=self.max_output_length,
            generation_num_beams=4,
            dataloader_num_workers=4,
            dataloader_pin_memory=True,
        )

        # Data collator
        data_collator = DataCollatorForSeq2Seq(
            tokenizer=self.tokenizer,
            model=self.model,
            padding=True
        )

        # Initialize trainer
        logger.info("Initializing trainer...")
        self.trainer = Seq2SeqTrainer(
            model=self.model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            tokenizer=self.tokenizer,
            data_collator=data_collator,
            compute_metrics=self.compute_metrics,
        )

        # Train
        logger.info("🚀 Starting training...")
        self.trainer.train()

        # Save final model
        logger.info("Saving model...")
        self.trainer.save_model(self.output_dir)
        self.tokenizer.save_pretrained(self.output_dir)

        # Save LoRA adapter separately
        adapter_dir = os.path.join(self.output_dir, 'lora_adapter')
        self.model.save_pretrained(adapter_dir)
        logger.info(f"✅ LoRA adapter saved to {adapter_dir}")

        # Evaluate on test set
        logger.info("Evaluating on test set...")
        eval_results = self.trainer.evaluate()

        logger.info("=" * 50)
        logger.info("EVALUATION RESULTS")
        logger.info("=" * 50)
        for key, value in eval_results.items():
            logger.info(f"{key}: {value}")

        # Save results
        results_path = os.path.join(self.output_dir, 'eval_results.json')
        with open(results_path, 'w') as f:
            json.dump(eval_results, f, indent=2)

        logger.info(f"✅ Results saved to {results_path}")


# ========================================
# Model Testing
# ========================================

class WorkoutGeneratorTester:
    """Test trained model inference"""

    def __init__(self, model_path: str, lora_path: Optional[str] = None):
        """Initialize for testing"""
        logger.info("Loading model for testing...")

        self.device = "cuda" if cuda_available() else "cpu"

        self.tokenizer = AutoTokenizer.from_pretrained(model_path)

        self.model = AutoModelForSeq2SeqLM.from_pretrained(
            model_path,
            torch_dtype=torch.float16 if cuda_available() else torch.float32,
            device_map="auto"
        )

        # Load LoRA adapter if provided
        if lora_path:
            from peft import PeftModel
            self.model = PeftModel.from_pretrained(self.model, lora_path)

        self.model.eval()
        logger.info("✅ Model loaded for inference")

    def generate_plan(self, prompt: str, max_length: int = 2048) -> str:
        """Generate workout plan from prompt"""
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            max_length=512,
            truncation=True
        ).to(self.device)

        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_length=max_length,
                num_beams=4,
                do_sample=False,
                temperature=None
            )

        return self.tokenizer.decode(outputs[0], skip_special_tokens=True)

    def test_generation(self, test_prompts: List[str]) -> None:
        """Test generation on multiple prompts"""
        logger.info(f"\n{'=' * 70}")
        logger.info("GENERATION TESTS")
        logger.info('=' * 70)

        for i, prompt in enumerate(test_prompts, 1):
            logger.info(f"\n[Test {i}/{len(test_prompts)}]")
            logger.info(f"Prompt: {prompt}")

            try:
                plan = self.generate_plan(prompt)

                # Try to parse as JSON
                try:
                    parsed = json.loads(plan)
                    logger.info("✅ Valid JSON generated")
                    logger.info(f"   Plan: {parsed.get('plan_name', 'N/A')}")
                    logger.info(f"   Days: {len(parsed.get('days', []))}")
                    logger.info(
                        f"   Total exercises: {parsed.get('metadata', {}).get('total_exercises', 'N/A')}")
                except json.JSONDecodeError:
                    logger.warning("⚠️ Generated text is not valid JSON")
                    logger.info(f"   Output: {plan[:200]}...")

            except Exception as e:
                logger.error(f"❌ Generation failed: {e}")


# ========================================
# Main Entry Point
# ========================================

def main():
    """Main training script"""
    parser = argparse.ArgumentParser(
        description="Train Workout Plan Generator with Flan-T5 + LoRA"
    )

    parser.add_argument(
        "--data",
        type=str,
        default="training_data.jsonl",
        help="Path to training data (JSONL format)"
    )
    parser.add_argument(
        "--generate-data",
        type=int,
        default=0,
        help="Generate N synthetic training examples (if 0, use existing data)"
    )
    parser.add_argument(
        "--output",
        type=str,
        default=DEFAULT_OUTPUT_DIR,
        help="Output directory for model"
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=5,
        help="Number of training epochs"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=4,
        help="Training batch size"
    )
    parser.add_argument(
        "--learning-rate",
        type=float,
        default=2e-4,
        help="Learning rate"
    )
    parser.add_argument(
        "--no-wandb",
        action="store_true",
        help="Disable Weights & Biases logging"
    )
    parser.add_argument(
        "--test-only",
        action="store_true",
        help="Only test an existing model (don't train)"
    )

    args = parser.parse_args()

    # Set random seed
    set_seed(SEED)

    logger.info("=" * 70)
    logger.info("🏋️ Workout Plan Generator - Training Script")
    logger.info("=" * 70)
    logger.info(f"Base Model: {MODEL_NAME}")
    logger.info(f"Device: {'GPU (CUDA)' if cuda_available() else 'CPU'}")
    logger.info(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 70)

    # Generate data if requested
    if args.generate_data > 0:
        logger.info(
            f"\n📊 Generating {args.generate_data} training examples using REAL exercise database...")

        # Resolve paths relative to script location
        script_dir = os.path.dirname(os.path.abspath(__file__))
        exercise_db = os.path.join(script_dir, EXERCISE_DB_PATH)
        gym_data = os.path.join(script_dir, GYM_MEMBERS_CSV)

        # Initialize generator with real data
        generator = TrainingDataGenerator(
            exercise_db_path=exercise_db,
            gym_data_path=gym_data
        )

        dataset = generator.generate_dataset(args.generate_data)
        generator.save_dataset(dataset, args.data)

    # Check if data file exists
    if not os.path.exists(args.data):
        logger.error(f"❌ Training data not found: {args.data}")
        logger.info("   Generate with: python train.py --generate-data 5000")
        return

    # Test only mode
    if args.test_only:
        logger.info("\n🧪 Testing existing model...")

        # Find model directory
        if os.path.exists(os.path.join(args.output, 'lora_adapter')):
            lora_path = os.path.join(args.output, 'lora_adapter')
        else:
            lora_path = None

        tester = WorkoutGeneratorTester(args.output, lora_path)

        test_prompts = [
            "Generate a 4-day workout plan for intermediate lifter, goal is muscle gain, has dumbbells and barbell.",
            "Create a 3-day beginner workout for weight loss with bodyweight only.",
            "Build a 5-day advanced strength program with full gym access, avoid shoulder exercises.",
        ]

        tester.test_generation(test_prompts)
        return

    # Training mode
    logger.info("\n🎯 Starting training pipeline...\n")

    trainer = WorkoutGeneratorTrainer(
        output_dir=args.output,
        use_wandb=not args.no_wandb
    )

    trainer.train(
        data_path=args.data,
        num_epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate
    )

    # Test the trained model
    logger.info("\n🧪 Testing trained model...")

    lora_path = os.path.join(args.output, 'lora_adapter')
    tester = WorkoutGeneratorTester(args.output, lora_path)

    test_prompts = [
        "Generate a 4-day workout plan for intermediate lifter, goal is muscle gain, has dumbbells and barbell.",
        "Create a 3-day beginner workout for weight loss with bodyweight only.",
        "Build a 5-day advanced strength program with full gym access, avoid shoulder exercises.",
    ]

    tester.test_generation(test_prompts)

    logger.info("\n" + "=" * 70)
    logger.info("✅ TRAINING COMPLETE!")
    logger.info("=" * 70)
    logger.info(f"Model saved to: {args.output}")
    logger.info(f"LoRA adapter saved to: {lora_path}")
    logger.info("\nNext steps:")
    logger.info("1. Copy model to deployment directory")
    logger.info("2. Update FastAPI service with new model path")
    logger.info("3. Run health checks")
    logger.info("4. Deploy as canary release (5% traffic)")
    logger.info("=" * 70)


if __name__ == "__main__":
    main()
