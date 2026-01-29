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

# ========================================
# Data Generation & Preprocessing
# ========================================


class TrainingDataGenerator:
    """Generate synthetic training data for workout plan generation"""

    FITNESS_LEVELS = ["Beginner", "Intermediate", "Advanced"]
    FITNESS_GOALS = ["Strength", "Muscle", "Cardio", "WeightLoss", "Endurance"]
    EQUIPMENT_SETS = [
        ["Barbell", "Dumbbells", "Bench"],
        ["Dumbbells", "Resistance Bands"],
        ["Bodyweight"],
        ["Barbell", "Pull-up Bar"],
        ["Dumbbells", "Kettlebells"],
    ]
    MUSCLE_GROUPS = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"]

    COMPOUND_EXERCISES = {
        "Chest": ["Barbell Bench Press", "Dumbbell Bench Press", "Incline Press"],
        "Back": ["Barbell Row", "Deadlift", "Pull-up", "Lat Pulldown"],
        "Legs": ["Barbell Squat", "Leg Press", "Romanian Deadlift"],
        "Shoulders": ["Overhead Press", "Lateral Raise", "Shrug"],
        "Arms": ["Barbell Curl", "Tricep Dip", "Tricep Rope Pushdown"],
    }

    ISOLATION_EXERCISES = {
        "Chest": ["Dumbbell Fly", "Cable Fly", "Pec Deck"],
        "Back": ["Face Pull", "Cable Row", "Machine Row"],
        "Legs": ["Leg Curl", "Leg Extension", "Calf Raise"],
        "Shoulders": ["Machine Shoulder Press", "Cable Lateral Raise"],
        "Arms": ["Dumbbell Curl", "Machine Curl", "Cable Curl"],
    }

    @staticmethod
    def generate_sample(idx: int) -> Dict:
        """Generate a single training example"""
        import random

        # Random parameters
        fitness_level = random.choice(TrainingDataGenerator.FITNESS_LEVELS)
        goal = random.choice(TrainingDataGenerator.FITNESS_GOALS)
        equipment = random.choice(TrainingDataGenerator.EQUIPMENT_SETS)
        days = random.choice([3, 4, 5])

        # Build input prompt
        input_text = f"Generate a {days}-day workout plan for {fitness_level.lower()} lifter, goal is {goal.lower()}"

        if equipment:
            equipment_str = ", ".join(equipment)
            input_text += f", has access to {equipment_str}"

        injuries = random.choice([[], ["Shoulder"], ["Lower Back"], ["Knee"]])
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

        # Generate days
        for day_num in range(1, days + 1):
            day = {
                "day_number": day_num,
                "day_name": f"Day {day_num}",
                "exercises": []
            }

            # Random muscle groups for this day
            num_exercises = random.randint(4, 7)
            day_muscles = random.sample(TrainingDataGenerator.MUSCLE_GROUPS,
                                        min(num_exercises, len(TrainingDataGenerator.MUSCLE_GROUPS)))

            for muscle in day_muscles:
                # Add compound exercise
                if muscle in TrainingDataGenerator.COMPOUND_EXERCISES:
                    exercise_name = random.choice(
                        TrainingDataGenerator.COMPOUND_EXERCISES[muscle]
                    )
                    day["exercises"].append({
                        "exercise_id": hash(exercise_name) % 1000 + 1,
                        "exercise_name": exercise_name,
                        "muscle_group": muscle,
                        "sets": random.choice([3, 4, 5]),
                        "reps": f"{random.randint(6, 12)}-{random.randint(13, 15)}",
                        "rest_seconds": random.choice([90, 120, 150]),
                        "notes": "Focus on form"
                    })

                # Sometimes add isolation exercise
                if random.random() > 0.5 and muscle in TrainingDataGenerator.ISOLATION_EXERCISES:
                    exercise_name = random.choice(
                        TrainingDataGenerator.ISOLATION_EXERCISES[muscle]
                    )
                    day["exercises"].append({
                        "exercise_id": hash(exercise_name) % 1000 + 1,
                        "exercise_name": exercise_name,
                        "muscle_group": muscle,
                        "sets": random.choice([2, 3]),
                        "reps": f"{random.randint(10, 15)}-{random.randint(16, 20)}",
                        "rest_seconds": random.choice([60, 90]),
                        "notes": "Controlled tempo"
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
            "equipment_needed": equipment,
            "muscle_groups_hit": day_muscles,
            "injuries_accommodated": injuries
        }

        return {
            "input": input_text,
            "output": json.dumps(plan, indent=2)
        }

    @staticmethod
    def generate_dataset(num_samples: int = 5000) -> List[Dict]:
        """Generate complete training dataset"""
        logger.info(f"Generating {num_samples} synthetic training examples...")

        dataset = []
        for i in tqdm(range(num_samples), desc="Generating data"):
            dataset.append(TrainingDataGenerator.generate_sample(i))

        return dataset

    @staticmethod
    def save_dataset(dataset: List[Dict], output_path: str) -> None:
        """Save dataset to JSONL format"""
        logger.info(f"Saving dataset to {output_path}...")

        with open(output_path, 'w') as f:
            for item in dataset:
                f.write(json.dumps(item) + '\n')

        logger.info(f"✅ Dataset saved: {len(dataset)} examples")


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
            f"\n📊 Generating {args.generate_data} synthetic training examples...")
        dataset = TrainingDataGenerator.generate_dataset(args.generate_data)
        TrainingDataGenerator.save_dataset(dataset, args.data)

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
