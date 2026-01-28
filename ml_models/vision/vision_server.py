#!/usr/bin/env python3
"""
CLIP-based body analysis server using FastAPI.
NO pose detection - uses text-image similarity only.

Endpoints:
- POST /analyze         -> Upload image, returns muscle analysis
- POST /analyze-base64  -> Base64 image, returns muscle analysis
- GET  /health          -> Health check

Model: openai/clip-vit-base-patch32
"""
import os
import io
import base64
import logging
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel

# ========================================
# Configuration
# ========================================
MODEL_NAME = os.environ.get("CLIP_MODEL", "openai/clip-vit-base-patch32")
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.6"))
MIN_IMAGE_SIZE = int(os.environ.get("MIN_IMAGE_SIZE", "200"))
MAX_IMAGE_SIZE_MB = int(os.environ.get("MAX_IMAGE_SIZE_MB", "10"))

# ========================================
# Initialize FastAPI app
# ========================================
app = FastAPI(
    title="Vision Analysis Server",
    description="CLIP-based body analysis for workout planning",
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
# Load CLIP model
# ========================================
print(f"Loading CLIP model: {MODEL_NAME}")
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")

model = CLIPModel.from_pretrained(MODEL_NAME).to(device)
processor = CLIPProcessor.from_pretrained(MODEL_NAME)
print("CLIP model loaded successfully!")

# ========================================
# Fixed muscle-related text prompts
# ========================================
MUSCLE_PROMPTS = {
    "chest": {
        "prompts": [
            "well-developed muscular chest",
            "average chest development", 
            "underdeveloped flat chest"
        ],
        "statuses": ["well_developed", "average", "underdeveloped"]
    },
    "arms": {
        "prompts": [
            "muscular arms with good bicep and tricep definition",
            "average arm muscle development",
            "thin arms lacking muscle mass"
        ],
        "statuses": ["well_developed", "average", "underdeveloped"]
    },
    "shoulders": {
        "prompts": [
            "broad well-developed shoulders with visible deltoids",
            "average shoulder width and development",
            "narrow underdeveloped shoulders"
        ],
        "statuses": ["well_developed", "average", "underdeveloped"]
    },
    "body_composition": {
        "prompts": [
            "lean athletic physique with visible muscle definition",
            "moderate body fat with some muscle visibility",
            "higher body fat percentage covering muscles"
        ],
        "statuses": ["lean", "moderate", "high_bodyfat"],
        "weak_status": "high_bodyfat"  # Consider high body fat as needing focus
    }
}

# ========================================
# Pydantic Models
# ========================================
class Base64ImageRequest(BaseModel):
    image_base64: str
    
class MuscleAnalysis(BaseModel):
    status: str
    confidence: float
    all_scores: dict

class VisionAnalysisResult(BaseModel):
    success: bool
    chest: Optional[MuscleAnalysis] = None
    arms: Optional[MuscleAnalysis] = None
    shoulders: Optional[MuscleAnalysis] = None
    body_composition: Optional[MuscleAnalysis] = None
    weak_muscles: list[str] = []
    overall_confidence: float = 0.0
    is_reliable: bool = False
    error: Optional[str] = None
    suggestions: list[str] = []

# ========================================
# Analysis Functions
# ========================================
def validate_image(image: Image.Image) -> tuple[bool, str, list[str]]:
    """Validate image is suitable for analysis."""
    suggestions = []
    
    # Check minimum size
    if image.width < MIN_IMAGE_SIZE or image.height < MIN_IMAGE_SIZE:
        return False, f"Image too small (minimum {MIN_IMAGE_SIZE}x{MIN_IMAGE_SIZE})", [
            f"Upload an image at least {MIN_IMAGE_SIZE}x{MIN_IMAGE_SIZE} pixels"
        ]
    
    # Check aspect ratio (should be portrait-ish for body shots)
    ratio = image.height / image.width
    if ratio < 0.5:
        suggestions.append("Use a portrait orientation for better results")
    if ratio > 3.0:
        suggestions.append("Image is very tall - ensure full body is visible")
    
    return True, "OK", suggestions


def analyze_muscle_group(image: Image.Image, prompts: list[str], statuses: list[str]) -> MuscleAnalysis:
    """Analyze a single muscle group using CLIP."""
    inputs = processor(
        text=prompts,
        images=image,
        return_tensors="pt",
        padding=True
    ).to(device)
    
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits_per_image[0]
        probs = torch.softmax(logits, dim=0).cpu().tolist()
    
    # Get highest scoring prompt
    max_idx = probs.index(max(probs))
    
    return MuscleAnalysis(
        status=statuses[max_idx],
        confidence=probs[max_idx],
        all_scores=dict(zip(statuses, probs))
    )


def analyze_image(image: Image.Image) -> VisionAnalysisResult:
    """Perform complete body analysis."""
    results = {}
    weak_muscles = []
    confidences = []
    
    for muscle_group, config in MUSCLE_PROMPTS.items():
        analysis = analyze_muscle_group(
            image, 
            config["prompts"], 
            config["statuses"]
        )
        results[muscle_group] = analysis
        confidences.append(analysis.confidence)
        
        # Detect weak muscles (check against configured weak_status)
        weak_status = config.get("weak_status", "underdeveloped")
        if analysis.status == weak_status:
            weak_muscles.append(muscle_group)
    
    # Calculate overall confidence
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
    is_reliable = avg_confidence >= CONFIDENCE_THRESHOLD
    
    return VisionAnalysisResult(
        success=True,
        chest=results.get("chest"),
        arms=results.get("arms"),
        shoulders=results.get("shoulders"),
        body_composition=results.get("body_composition"),
        weak_muscles=weak_muscles,
        overall_confidence=avg_confidence,
        is_reliable=is_reliable
    )

# ========================================
# API Endpoints
# ========================================
@app.post("/analyze", response_model=VisionAnalysisResult)
async def analyze_body(file: UploadFile = File(...)):
    """
    Analyze a body image uploaded as form data.
    
    Returns muscle group analysis and detected weaknesses.
    """
    try:
        # Check file size
        contents = await file.read()
        size_mb = len(contents) / (1024 * 1024)
        if size_mb > MAX_IMAGE_SIZE_MB:
            raise HTTPException(
                status_code=400, 
                detail=f"Image too large ({size_mb:.1f}MB). Maximum: {MAX_IMAGE_SIZE_MB}MB"
            )
        
        # Open and validate image
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        is_valid, message, suggestions = validate_image(image)
        
        if not is_valid:
            return VisionAnalysisResult(
                success=False,
                error=message,
                suggestions=suggestions
            )
        
        # Perform analysis
        result = analyze_image(image)
        result.suggestions = suggestions
        return result

    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Error during body image analysis")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/analyze-base64", response_model=VisionAnalysisResult)
async def analyze_body_base64(request: Base64ImageRequest):
    """
    Analyze a body image provided as base64 string.

    Useful for direct API calls without file upload.
    """
    try:
        # Decode base64
        try:
            # Handle data URL format
            if "," in request.image_base64:
                image_data = request.image_base64.split(",")[1]
            else:
                image_data = request.image_base64

            image_bytes = base64.b64decode(image_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")

        # Check size
        size_mb = len(image_bytes) / (1024 * 1024)
        if size_mb > MAX_IMAGE_SIZE_MB:
            raise HTTPException(
                status_code=400,
                detail=f"Image too large ({size_mb:.1f}MB). Maximum: {MAX_IMAGE_SIZE_MB}MB"
            )

        # Open and validate image
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        is_valid, message, suggestions = validate_image(image)

        if not is_valid:
            return VisionAnalysisResult(
                success=False,
                error=message,
                suggestions=suggestions
            )

        # Perform analysis
        result = analyze_image(image)
        result.suggestions = suggestions
        return result

    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Error during base64 body image analysis")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "device": device,
        "confidence_threshold": CONFIDENCE_THRESHOLD
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5200))
    uvicorn.run(app, host="0.0.0.0", port=port)
