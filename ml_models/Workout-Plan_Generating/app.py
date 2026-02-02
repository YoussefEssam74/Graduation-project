#!/usr/bin/env python3
"""
Workout Plan Generator - FastAPI Production Service
Serves fine-tuned Flan-T5 model with context-aware generation

Features:
- Accepts user context (InBody, muscle scans, strength profile)
- Smart prompt engineering
- JSON validation
- Performance monitoring
- A/B testing support

Usage:
    uvicorn app:app --host 0.0.0.0 --port 5300 --reload

Requirements:
    fastapi>=0.104.0
    uvicorn[standard]>=0.24.0
    torch>=2.1.0
    transformers>=4.35.0
    peft>=0.7.0
"""

import os
import json
import time
import logging
from typing import Optional, List, Dict
from datetime import datetime

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from peft import PeftModel

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
MODEL_PATH = "./models/workout-generator-v1"
MODEL_VERSION = "flan-t5-v1.0.0"
MAX_INPUT_LENGTH = 512
MAX_OUTPUT_LENGTH = 2048

# FastAPI app
app = FastAPI(
    title="Workout Plan Generator API",
    description="AI-powered personalized workout plan generation using Flan-T5",
    version=MODEL_VERSION
)

# CORS middleware (allow C# backend to call this service)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: specify C# backend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model and tokenizer (loaded on startup)
model = None
tokenizer = None
device = None


# ========================================
# Request/Response Models
# ========================================

class InBodyData(BaseModel):
    """InBody measurement data"""
    muscle_mass_kg: Optional[float] = None
    body_fat_percent: Optional[float] = None
    skeletal_muscle_mass: Optional[float] = None


class MuscleScanData(BaseModel):
    """Body photo analysis results"""
    weak_areas: Optional[List[str]] = Field(
        default_factory=list)  # ["back", "shoulders"]
    strong_areas: Optional[List[str]] = Field(
        default_factory=list)  # ["legs", "chest"]


class StrengthProfileData(BaseModel):
    """Known strength levels per exercise"""
    exercise_name: str
    one_rm_kg: float
    confidence_score: float  # 0.0-1.0


class FeedbackSummary(BaseModel):
    """Recent feedback summary"""
    avg_rating: Optional[float] = None
    weight_adjustments: Optional[Dict[str, str]] = Field(default_factory=dict)


class UserContext(BaseModel):
    """Complete user context for personalization"""
    inbody_data: Optional[InBodyData] = None
    muscle_scan: Optional[MuscleScanData] = None
    strength_profile: Optional[List[StrengthProfileData]] = Field(
        default_factory=list)
    feedback_summary: Optional[FeedbackSummary] = None


class PredictionRequest(BaseModel):
    """Request payload for workout plan generation"""
    user_id: int
    fitness_level: str  # Beginner, Intermediate, Advanced
    goal: str  # Muscle, Strength, WeightLoss, Endurance
    days_per_week: int
    equipment: List[str]
    injuries: List[str] = Field(default_factory=list)

    # NEW: User context for personalization
    user_context: Optional[UserContext] = None


class PredictionResponse(BaseModel):
    """Response with generated workout plan"""
    plan: Dict
    is_valid_json: bool
    model_version: str
    generation_latency_ms: int
    prompt_used: Optional[str] = None  # For debugging
    error: Optional[str] = None


# ========================================
# Model Loading
# ========================================

@app.on_event("startup")
async def load_model():
    """Load model on application startup"""
    global model, tokenizer, device

    logger.info(f"Loading model from {MODEL_PATH}...")

    # Determine device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using device: {device}")

    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    logger.info("✅ Tokenizer loaded")

    # Load model
    dtype = torch.float16 if torch.cuda.is_available() else torch.float32
    model = AutoModelForSeq2SeqLM.from_pretrained(
        MODEL_PATH,
        torch_dtype=dtype,
        device_map="auto"
    )

    # Load LoRA adapter if exists
    lora_path = os.path.join(MODEL_PATH, "lora_adapter")
    if os.path.exists(lora_path):
        model = PeftModel.from_pretrained(model, lora_path)
        logger.info("✅ LoRA adapter loaded")

    model.eval()
    logger.info(f"✅ Model loaded successfully! ({MODEL_VERSION})")
    logger.info(f"   Parameters: {model.num_parameters():,}")


# ========================================
# Prompt Engineering
# ========================================

def build_enriched_prompt(request: PredictionRequest) -> str:
    """
    Build context-aware prompt from user data
    Includes: InBody, muscle scans, strength profile, feedback
    """
    # Base prompt
    prompt = f"Generate a {request.days_per_week}-day workout plan "
    prompt += f"for {request.fitness_level.lower()} lifter, "
    prompt += f"goal is {request.goal.lower()}. "

    # Add user context if available
    if request.user_context:
        ctx = request.user_context

        # InBody data
        if ctx.inbody_data:
            ib = ctx.inbody_data
            if ib.muscle_mass_kg:
                prompt += f"User has {ib.muscle_mass_kg}kg muscle mass"
            if ib.body_fat_percent:
                prompt += f" and {ib.body_fat_percent}% body fat. "

        # Muscle scan results
        if ctx.muscle_scan and ctx.muscle_scan.weak_areas:
            weak = ", ".join(ctx.muscle_scan.weak_areas)
            prompt += f"Focus on weak areas: {weak}. "

        # Strength profile (for weight recommendations)
        if ctx.strength_profile:
            prompt += "User's known strength levels: "
            for prof in ctx.strength_profile[:3]:  # Limit to 3 exercises
                prompt += f"{prof.exercise_name} 1RM={prof.one_rm_kg}kg, "

        # Recent feedback adjustments
        if ctx.feedback_summary and ctx.feedback_summary.weight_adjustments:
            adj = ctx.feedback_summary.weight_adjustments
            if adj:
                prompt += "Recent feedback: "
                for exercise_type, adjustment in list(adj.items())[:2]:
                    prompt += f"{exercise_type} weights were {adjustment}, "

    # Add equipment
    if request.equipment:
        equipment_str = ", ".join(request.equipment)
        prompt += f"Available equipment: {equipment_str}. "

    # Add injuries
    if request.injuries:
        injuries_str = ", ".join(request.injuries)
        prompt += f"Avoid exercises for: {injuries_str}. "

    return prompt.strip()


# ========================================
# Inference
# ========================================

def generate_workout_plan(prompt: str) -> Dict:
    """
    Generate workout plan from prompt using Flan-T5

    Returns:
        {
            'generated_text': str,
            'plan': dict (if valid JSON),
            'is_valid_json': bool,
            'error': str (if any)
        }
    """
    # Tokenize
    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        max_length=MAX_INPUT_LENGTH,
        truncation=True
    ).to(device)

    # Generate
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=MAX_OUTPUT_LENGTH,
            num_beams=4,
            do_sample=False,
            early_stopping=True
        )

    # Decode
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

    result = {
        'generated_text': generated_text,
        'is_valid_json': False,
        'plan': None,
        'error': None
    }

    # Try to parse as JSON
    try:
        plan = json.loads(generated_text)
        result['plan'] = plan
        result['is_valid_json'] = True
    except (json.JSONDecodeError, ValueError) as e:
        result['error'] = f"JSON parsing failed: {str(e)}"
        logger.warning(f"Invalid JSON generated: {str(e)}")

    return result


# ========================================
# API Endpoints
# ========================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Workout Plan Generator",
        "version": MODEL_VERSION,
        "status": "running",
        "device": str(device),
        "model_loaded": model is not None
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "model_version": MODEL_VERSION,
        "device": str(device),
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Generate personalized workout plan

    Example request:
    ```json
    {
      "user_id": 12345,
      "fitness_level": "Intermediate",
      "goal": "Muscle",
      "days_per_week": 4,
      "equipment": ["Barbell", "Dumbbells"],
      "injuries": [],
      "user_context": {
        "inbody_data": {
          "muscle_mass_kg": 65.5,
          "body_fat_percent": 18.2
        },
        "muscle_scan": {
          "weak_areas": ["back", "shoulders"]
        },
        "strength_profile": [
          {
            "exercise_name": "Bench Press",
            "one_rm_kg": 80,
            "confidence_score": 0.85
          }
        ]
      }
    }
    ```
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        start_time = time.time()

        # Build enriched prompt
        prompt = build_enriched_prompt(request)
        logger.info(f"Generating plan for user {request.user_id}")
        logger.debug(f"Prompt: {prompt}")

        # Generate plan
        result = generate_workout_plan(prompt)

        # Calculate latency
        latency_ms = int((time.time() - start_time) * 1000)

        logger.info(
            f"✅ Generation complete in {latency_ms}ms (valid_json={result['is_valid_json']})")

        return PredictionResponse(
            plan=result['plan'] if result['is_valid_json'] else {},
            is_valid_json=result['is_valid_json'],
            model_version=MODEL_VERSION,
            generation_latency_ms=latency_ms,
            prompt_used=prompt if os.getenv("DEBUG") == "true" else None,
            error=result['error']
        )

    except Exception as e:
        logger.error(f"Error generating plan: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/batch-predict")
async def batch_predict(requests: List[PredictionRequest]):
    """Generate multiple plans in one call (for testing)"""
    results = []
    for req in requests:
        try:
            result = await predict(req)
            results.append(result)
        except Exception as e:
            results.append({
                "error": str(e),
                "user_id": req.user_id
            })
    return {"results": results, "count": len(results)}


# ========================================
# Run Server
# ========================================

if __name__ == "__main__":
    import uvicorn

    # Run server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=5300,
        log_level="info"
    )
