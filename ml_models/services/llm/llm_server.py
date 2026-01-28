#!/usr/bin/env python3
"""
LLM Workout Generation Server using Flan-T5 with optional LoRA adapter.

Endpoints:
- POST /generate  -> Generate workout plan from prompt
- GET  /health    -> Health check

Model: google/flan-t5-base (optionally with LoRA fine-tuning)
"""
import os
import json
import re
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import torch

# Check if LoRA adapter exists
LORA_PATH = os.environ.get("LORA_PATH", "./flan-t5-workout-lora")
USE_LORA = os.path.exists(LORA_PATH) and os.environ.get("USE_LORA", "true").lower() == "true"
MODEL_NAME = os.environ.get("MODEL_NAME", "google/flan-t5-base")
MAX_LENGTH = int(os.environ.get("MAX_LENGTH", "1024"))

# ========================================
# Initialize FastAPI app
# ========================================
app = FastAPI(
    title="LLM Workout Generator",
    description="Flan-T5 based workout plan generation service",
    version="1.0.0"
)

# Configure CORS from environment or use safe defaults
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=bool(os.getenv("ALLOW_CREDENTIALS", "false").lower() == "true"),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================
# Load model
# ========================================
print(f"Loading model: {MODEL_NAME}")
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME).to(device)

if USE_LORA:
    try:
        from peft import PeftModel
        print(f"Loading LoRA adapter from: {LORA_PATH}")
        model = PeftModel.from_pretrained(model, LORA_PATH)
        print("LoRA adapter loaded successfully!")
    except ImportError:
        print("PEFT not installed - running without LoRA")
        USE_LORA = False
    except Exception as e:
        print(f"Failed to load LoRA adapter: {e}")
        USE_LORA = False
else:
    print("Running without LoRA adapter")

print("Model loaded successfully!")

# ========================================
# Pydantic Models
# ========================================
class GenerationRequest(BaseModel):
    prompt: str
    max_length: int = MAX_LENGTH
    temperature: float = 0.7
    num_return_sequences: int = 1

class Exercise(BaseModel):
    name: str
    sets: int
    reps: int
    rest_seconds: int = 60
    notes: str = ""

class WorkoutDay(BaseModel):
    day: int
    focus: str
    exercises: list[Exercise] = []

class WorkoutPlan(BaseModel):
    plan_name: str
    duration_weeks: int = 4
    days: list[WorkoutDay] = []

class GenerationResult(BaseModel):
    success: bool
    plan: Optional[WorkoutPlan] = None
    raw_text: Optional[str] = None
    error: Optional[str] = None

# ========================================
# Generation Functions
# ========================================
def build_workout_prompt(
    fitness_level: str,
    goal: str,
    days_per_week: int,
    injuries: list[str] = None,
    weak_muscles: list[str] = None,
    rag_context: str = ""
) -> str:
    """Build a structured prompt for workout generation."""
    
    prompt_parts = [
        f"Generate a {days_per_week}-day workout plan as JSON.",
        f"Fitness level: {fitness_level}",
        f"Goal: {goal}"
    ]
    
    if injuries:
        prompt_parts.append(f"Avoid exercises for: {', '.join(injuries)}")
    
    if weak_muscles:
        prompt_parts.append(f"Prioritize these weak areas: {', '.join(weak_muscles)}")
    
    if rag_context:
        prompt_parts.append(f"\nTraining guidelines:\n{rag_context}")
    
    prompt_parts.append("""
Output strict JSON format:
{"plan_name": "string", "duration_weeks": number, "days": [{"day": number, "focus": "string", "exercises": [{"name": "string", "sets": number, "reps": number, "rest_seconds": number, "notes": "string"}]}]}
""")
    
    return "\n".join(prompt_parts)


def extract_json_from_text(text: str) -> Optional[dict]:
    """Extract JSON object from generated text."""
    # Try to find JSON in the text
    json_patterns = [
        r'\{[^{}]*"plan_name"[^{}]*\}',  # Simple pattern
        r'\{.*?"days".*?\}(?=\s*$)',      # Pattern ending with }
    ]
    
    # First try direct parse
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
    
    # Try to find JSON substring
    try:
        # Find the first { and last }
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            json_str = text[start:end+1]
            return json.loads(json_str)
    except json.JSONDecodeError:
        pass
    
    return None


def generate_workout(prompt: str, max_length: int = MAX_LENGTH, temperature: float = 0.7) -> GenerationResult:
    """Generate a workout plan from the prompt."""
    try:
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512).to(device)
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_length=max_length,
                temperature=temperature,
                do_sample=True,
                num_beams=1,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id
            )
        
        text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Try to parse JSON from response
        plan_dict = extract_json_from_text(text)
        
        if plan_dict:
            try:
                # Validate with Pydantic
                plan = WorkoutPlan(**plan_dict)
                return GenerationResult(success=True, plan=plan, raw_text=text)
            except Exception as e:
                return GenerationResult(
                    success=False, 
                    raw_text=text, 
                    error=f"Invalid plan structure: {str(e)}"
                )
        else:
            return GenerationResult(
                success=False,
                raw_text=text,
                error="Could not extract valid JSON from response"
            )
            
    except Exception as e:
        # Log full exception server-side
        import logging
        logging.exception("Error during workout plan generation")
        return GenerationResult(success=False, error="Internal server error while generating result")

# ========================================
# API Endpoints
# ========================================
@app.post("/generate", response_model=GenerationResult)
async def generate_workout_plan(request: GenerationRequest):
    """
    Generate a workout plan from a natural language prompt.
    
    The prompt should describe the user's fitness level, goals,
    days per week, and any injuries or constraints.
    """
    if not request.prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    result = generate_workout(
        request.prompt,
        max_length=request.max_length,
        temperature=request.temperature
    )
    
    return result


class StructuredGenerationRequest(BaseModel):
    fitness_level: str = "Beginner"
    goal: str = "muscle gain"
    days_per_week: int = 3
    injuries: list[str] = []
    weak_muscles: list[str] = []
    rag_context: str = ""
    max_length: int = MAX_LENGTH
    temperature: float = 0.7


@app.post("/generate-structured", response_model=GenerationResult)
async def generate_workout_structured(request: StructuredGenerationRequest):
    """
    Generate a workout plan from structured parameters.
    
    This endpoint builds the prompt internally from the provided parameters.
    """
    prompt = build_workout_prompt(
        fitness_level=request.fitness_level,
        goal=request.goal,
        days_per_week=request.days_per_week,
        injuries=request.injuries,
        weak_muscles=request.weak_muscles,
        rag_context=request.rag_context
    )
    
    result = generate_workout(
        prompt,
        max_length=request.max_length,
        temperature=request.temperature
    )
    
    return result


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "lora_loaded": USE_LORA,
        "device": device
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5300))
    uvicorn.run(app, host="0.0.0.0", port=port)
