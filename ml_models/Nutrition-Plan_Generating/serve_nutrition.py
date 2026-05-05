"""
serve_nutrition.py
------------------
FastAPI inference service for the Nutrition Plan Generator.
Port: 5301  (matches PROJECT config)

Loads the fine-tuned QLoRA adapter (merged at startup) and the pre-built
artefacts (food_db_halal.json, allergen_taxonomy.json, disease_rules.json).

Endpoints:
  POST /generate    — generate a 3-day nutrition plan
  GET  /health      — liveness check
  GET  /foods/search?q=... — search food DB by name

Request body schema (JSON):
{
  "member_id": "string (optional)",
  "gender": "male" | "female",
  "age": 25,
  "weight_kg": 80.0,
  "height_cm": 175.0,
  "goal": "weight_loss" | "muscle_gain" | "maintenance" | "body_recomposition",
  "activity_level": "sedentary" | "light" | "moderate" | "active" | "very_active",
  "health_conditions": ["diabetes", "hypertension"],   // optional
  "allergies": ["gluten", "dairy"],                    // optional
  "cuisine_preference": "egyptian" | "international",   // optional, default "egyptian"
  "inbody": {                                           // optional — latest InBody snapshot
    "body_fat_percentage": 28.5,
    "muscle_mass_kg": 32.0,
    "visceral_fat_level": 8,
    "bmr_kcal": 1780,
    "body_water_percentage": 55.0,
    "metabolic_age": 32
  }
}

Response: 3-day JSON nutrition plan (same schema as training targets).

Requirements:
    pip install fastapi uvicorn transformers peft bitsandbytes torch

Run:
    python serve_nutrition.py
    # or:
    uvicorn serve_nutrition:app --host 0.0.0.0 --port 5301 --reload
"""

from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig, StoppingCriteria, StoppingCriteriaList
from pydantic import BaseModel, Field, field_validator
from fastapi.middleware.cors import CORSMiddleware
import os
import json
import re
import math
import time
import logging
from contextlib import asynccontextmanager
from typing import Optional

try:
    from json_repair import repair_json as _repair_json
    _JSON_REPAIR_AVAILABLE = True
except ImportError:
    _JSON_REPAIR_AVAILABLE = False

import torch
import uvicorn
from fastapi import FastAPI, HTTPException, Query

# ── Allergen keyword expansion (taxonomy file is product-level; use these for plan injection) ──
ALLERGEN_KEYWORDS: dict[str, list[str]] = {
    "gluten":    ["gluten", "wheat", "barley", "rye", "white bread", "pasta", "couscous", "semolina"],
    "dairy":     ["milk", "cheese", "butter", "cream", "yogurt", "lactose", "whey"],
    "nuts":      ["peanuts", "almonds", "cashews", "walnuts", "pistachios", "tree nuts", "hazelnuts"],
    "eggs":      ["eggs", "egg white", "egg yolk", "mayonnaise"],
    "fish":      ["fish", "tuna", "salmon", "sardines", "tilapia", "anchovy"],
    "shellfish": ["shrimp", "crab", "lobster", "shellfish", "squid", "mussels"],
    "soy":       ["soy", "tofu", "edamame", "soy sauce", "miso"],
    "sesame":    ["sesame", "tahini", "sesame oil", "sesame seeds"],
}

# ── JSON end stopping criteria ──────────────────────────────────────────────


class JsonRootClosedCriteria(StoppingCriteria):
    """Stop generation once the root JSON object has been closed.

    Uses incremental scanning — only processes newly generated tokens each call,
    carrying brace/string state forward to avoid O(n^2) overhead.
    """

    def __init__(self, tokenizer, prompt_len: int):
        self._tok = tokenizer
        self._prompt_len = prompt_len
        self._scanned_len = 0   # number of new tokens already processed
        # Persistent parse state
        self._depth = 0
        self._in_str = False
        self._esc = False
        self._started = False

    def __call__(self, input_ids, scores, **kwargs) -> bool:
        new_ids = input_ids[0][self._prompt_len:]
        total_new = len(new_ids)
        if total_new <= self._scanned_len:
            return False  # nothing new to scan

        # Decode only the newly added tokens
        incremental_ids = new_ids[self._scanned_len:]
        incremental_text = self._tok.decode(
            incremental_ids, skip_special_tokens=True)
        self._scanned_len = total_new

        for ch in incremental_text:
            if self._esc:
                self._esc = False
                continue
            if ch == "\\" and self._in_str:
                self._esc = True
                continue
            if ch == '"':
                self._in_str = not self._in_str
                continue
            if self._in_str:
                continue
            if ch == '{':
                self._depth += 1
                self._started = True
            elif ch == '}':
                self._depth -= 1
                if self._started and self._depth == 0:
                    return True
        return False


# ── Paths ───────────────────────────────────────────────────────────────────
BASE = os.path.dirname(__file__)
# Priority: fully-merged production model (SFT+DPO) → final checkpoint → base model
_FINAL_DIR = os.path.join(BASE, "output", "qwen2.5-3b-nutrition-final")
_SFT_ADAPTER_DIR = os.path.join(
    BASE, "checkpoint_to_resume (1)", "checkpoint-2412")
ADAPTER_DIR = _FINAL_DIR if os.path.isdir(_FINAL_DIR) else _SFT_ADAPTER_DIR
BASE_MODEL = "Qwen/Qwen2.5-3B-Instruct"
FOOD_DB_PATH = os.path.join(BASE, "food_db_halal.json")
ALLERGEN_PATH = os.path.join(BASE, "allergen_taxonomy.json")
DISEASE_PATH = os.path.join(BASE, "disease_rules.json")

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("nutrition-serve")

# ── Globals (populated at startup) ──────────────────────────────────────────
_model = None
_tokenizer = None
_food_db: list = []
_allergen: dict = {}
_diseases: dict = {}


# ══════════════════════════════════════════════════════════════════════════════
# STARTUP / SHUTDOWN
# ══════════════════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _model, _tokenizer, _food_db, _allergen, _diseases

    log.info("Loading artefacts...")
    if os.path.exists(FOOD_DB_PATH):
        with open(FOOD_DB_PATH, encoding="utf-8") as f:
            _food_db = json.load(f)
        log.info(f"Food DB: {len(_food_db):,} entries")
    else:
        log.warning("food_db_halal.json not found — food search disabled.")

    if os.path.exists(ALLERGEN_PATH):
        with open(ALLERGEN_PATH, encoding="utf-8") as f:
            _allergen = json.load(f)
        log.info(f"Allergen taxonomy: {len(_allergen):,} entries")

    if os.path.exists(DISEASE_PATH):
        with open(DISEASE_PATH, encoding="utf-8") as f:
            _diseases = json.load(f)
        log.info(f"Disease rules: {len(_diseases):,} diseases")

    log.info("Loading model...")
    bnb = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    adapter_exists = os.path.isdir(ADAPTER_DIR)
    if adapter_exists:
        # Detect whether ADAPTER_DIR is a fully-merged model or a PEFT adapter.
        # A PEFT adapter directory always contains adapter_config.json; a merged
        # model directory does not.
        is_merged = not os.path.exists(
            os.path.join(ADAPTER_DIR, "adapter_config.json"))
        if is_merged:
            # Fully merged model (SFT+DPO baked in): load directly — no PeftModel wrapper.
            log.info(
                f"Loading fully merged production model (SFT+DPO) from {ADAPTER_DIR}")
            _model = AutoModelForCausalLM.from_pretrained(
                ADAPTER_DIR,
                quantization_config=bnb,
                device_map={"": 0},
                trust_remote_code=True,
                dtype=torch.float16,
            )
        else:
            # SFT-only adapter: apply on top of base model.
            log.info(f"Loading SFT adapter from {ADAPTER_DIR}")
            base = AutoModelForCausalLM.from_pretrained(
                BASE_MODEL,
                quantization_config=bnb,
                device_map={"": 0},
                trust_remote_code=True,
                dtype=torch.float16,
            )
            _model = PeftModel.from_pretrained(
                base, ADAPTER_DIR, device_map={"": 0})
        _tokenizer = AutoTokenizer.from_pretrained(ADAPTER_DIR,
                                                   trust_remote_code=True)
    else:
        log.warning(
            f"Adapter not found at {ADAPTER_DIR} — loading base model only. "
            "Run train_nutrition_v1.py first for best results."
        )
        _model = AutoModelForCausalLM.from_pretrained(
            BASE_MODEL,
            quantization_config=bnb,
            device_map={"": 0},
            trust_remote_code=True,
            dtype=torch.float16,
        )
        _tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL,
                                                   trust_remote_code=True)

    _tokenizer.pad_token = _tokenizer.eos_token
    _model.eval()
    log.info("Model ready.")
    yield

    log.info("Shutting down.")


# ══════════════════════════════════════════════════════════════════════════════
# FASTAPI APP
# ══════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="IntelliFit Nutrition Plan Generator",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic schemas ─────────────────────────────────────────────────────────

class InBodyData(BaseModel):
    body_fat_percentage:  Optional[float] = None
    muscle_mass_kg:       Optional[float] = None
    visceral_fat_level:   Optional[int] = None
    bmr_kcal:             Optional[float] = None
    body_water_percentage: Optional[float] = None
    metabolic_age:        Optional[int] = None


class NutritionRequest(BaseModel):
    member_id:          Optional[str] = None
    gender:             str = Field(..., pattern="^(male|female)$")
    age:                int = Field(..., ge=10, le=100)
    weight_kg:          float = Field(..., gt=20, lt=300)
    height_cm:          float = Field(..., gt=100, lt=250)
    goal:               str = Field(
        ..., pattern="^(weight_loss|muscle_gain|maintenance|body_recomposition)$")
    activity_level:     str = Field("moderate",
                                    pattern="^(sedentary|light|moderate|active|very_active)$")
    health_conditions:  list[str] = Field(default_factory=list)
    allergies:          list[str] = Field(default_factory=list)
    cuisine_preference: str = Field(
        "egyptian", pattern="^(egyptian|international)$")
    inbody:             Optional[InBodyData] = None


class NutritionResponse(BaseModel):
    member_id:     Optional[str]
    generated_at:  str
    daily_calories: int
    plan:          dict
    generation_ms: int


# ── Prompt builder ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are IntelliFit Nutrition Coach — an expert Egyptian sports nutritionist. "
    "You create personalised 3-day halal nutrition plans (valid JSON, no markdown). "
    "IMPORTANT: Always generate EXACTLY 3 days — never more, never fewer. "
    "Each plan has EXACTLY 3 unique days, each with breakfast, lunch, dinner, and one snack. "
    "Plans respect the user's health conditions, allergies, fitness goal, and InBody data. "
    "Output ONLY valid JSON in the exact schema requested. "
    "Use Egyptian food names whenever possible. All food is halal. "
    "When the user mentions a previous or recent plan, generate a completely new plan "
    "with different meals, different food items, and different meal compositions — "
    "never repeat the same foods from the previous plan."
)

GOAL_MULTIPLIERS = {
    "weight_loss": 0.80, "maintenance": 1.0,
    "muscle_gain": 1.10, "body_recomposition": 0.95,
}
ACTIVITY_FACTORS = {
    "sedentary": 1.2, "light": 1.375, "moderate": 1.55,
    "active": 1.725, "very_active": 1.9,
}


def compute_tdee(req: NutritionRequest) -> int:
    """Harris-Benedict BMR × activity factor × goal multiplier."""
    if req.gender == "male":
        bmr = 10 * req.weight_kg + 6.25 * req.height_cm - 5 * req.age + 5
    else:
        bmr = 10 * req.weight_kg + 6.25 * req.height_cm - 5 * req.age - 161

    # Override BMR with InBody value if available
    if req.inbody and req.inbody.bmr_kcal:
        bmr = req.inbody.bmr_kcal

    tdee = bmr * ACTIVITY_FACTORS.get(req.activity_level, 1.55)
    return int(tdee * GOAL_MULTIPLIERS.get(req.goal, 1.0))


def build_inbody_flags(inbody: InBodyData) -> tuple[str, float, int, int, int]:
    """
    Analyse InBody data and return adjustments for the nutrition plan.

    Returns:
        (flag_str, cal_adj, protein_pct, carbs_pct, fat_pct)
        - flag_str:    human-readable description of InBody adjustments
        - cal_adj:     calorie multiplier (e.g. 0.80 for a 20% deficit)
        - protein_pct: adjusted protein percentage
        - carbs_pct:   adjusted carbs percentage
        - fat_pct:     adjusted fat percentage
    """
    flags = []
    cal_adj = 1.0
    protein_pct = 25
    fat_pct = 25
    carbs_pct = 50

    if inbody:
        if inbody.body_fat_percentage and inbody.body_fat_percentage > 30:
            cal_adj = 0.80
            fat_pct = 20
            protein_pct = 35
            carbs_pct = 45
            flags.append(
                f"high body fat ({inbody.body_fat_percentage}%) → 20% deficit")
        if inbody.muscle_mass_kg and inbody.muscle_mass_kg < 25:
            protein_pct = max(protein_pct, 35)
            fat_pct = 20
            carbs_pct = 100 - protein_pct - fat_pct
            flags.append(
                f"low muscle mass ({inbody.muscle_mass_kg} kg) → elevated protein")
        if inbody.visceral_fat_level and inbody.visceral_fat_level >= 10:
            flags.append(
                f"high visceral fat (level {inbody.visceral_fat_level}) → low sodium, high fiber")

    flag_str = "; ".join(flags) if flags else "within normal InBody ranges"
    return flag_str, cal_adj, protein_pct, carbs_pct, fat_pct


def build_prompt(req: NutritionRequest, daily_kcal: int,
                 inbody_flags: str, protein_pct: int, carbs_pct: int, fat_pct: int) -> str:
    conditions_str = ", ".join(
        req.health_conditions) if req.health_conditions else "none"
    allergy_str = ", ".join(req.allergies) if req.allergies else "none"

    # Pull disease macro targets if known
    disease_notes = []
    for cond in req.health_conditions:
        rule = _diseases.get(cond.lower(), {})
        if rule:
            rec = rule.get("recommended_foods", [])[:4]
            # more avoid items → better compliance
            avoid = rule.get("foods_to_avoid", [])[:8]
            if rec:
                disease_notes.append(
                    f"Recommended for {cond}: {', '.join(rec)}")
            if avoid:
                disease_notes.append(
                    f"MUST AVOID for {cond}: {', '.join(avoid)}")

    disease_notes_str = " ".join(disease_notes) if disease_notes else ""

    inbody_section = ""
    if req.inbody:
        ib = req.inbody
        inbody_section = (
            f"InBody snapshot: body fat {ib.body_fat_percentage}%, "
            f"muscle mass {ib.muscle_mass_kg} kg, "
            f"visceral fat level {ib.visceral_fat_level}, "
            f"BMR {ib.bmr_kcal} kcal. "
            f"InBody adjustments: {inbody_flags}. "
        )

    user_msg = (
        f"Create a 3-day halal nutrition plan for a {req.age}-year-old {req.gender}, "
        f"weight {req.weight_kg} kg, height {req.height_cm} cm. "
        f"Goal: {req.goal.replace('_', ' ')}, activity: {req.activity_level}. "
        f"Health conditions: {conditions_str}. "
        f"Allergies: {allergy_str}. "
        f"Cuisine preference: {req.cuisine_preference}. "
        + inbody_section
        + f"Daily calorie target: {daily_kcal} kcal. "
        f"Macro targets — protein: {protein_pct}%, carbs: {carbs_pct}%, fat: {fat_pct}%. "
        + (disease_notes_str + " " if disease_notes_str else "")
        + "Return only a valid JSON 3-day nutrition plan with breakfast, lunch, dinner, and snack per day. "
        "IMPORTANT: The plan must contain EXACTLY 3 days — stop after day 3."
    )
    return user_msg


# ── Inference ─────────────────────────────────────────────────────────────────

def extract_json(text: str) -> dict:
    """Extract first JSON object from model output, with truncation recovery."""
    # Strip markdown fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
    text = re.sub(r"```\s*$", "", text.strip(), flags=re.MULTILINE)
    text = text.strip()

    log.debug(f"Raw model output (first 600 chars): {text[:600]}")

    start = text.find("{")
    if start == -1:
        log.error(f"No JSON found. Full output: {text[:800]}")
        raise ValueError("No JSON object found in model output.")

    # Try direct parse on everything from first '{'
    try:
        return json.loads(text[start:])
    except json.JSONDecodeError:
        pass

    # Walk to find matching closing brace
    depth = 0
    end = -1
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i
                break

    if end != -1:
        candidate = text[start:end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError as exc:
            log.error(f"JSON parse error: {exc.msg} at pos {exc.pos}")
            log.error(f"Fragment: {candidate[:500]}")
            # Try json_repair on the bounded candidate
            if _JSON_REPAIR_AVAILABLE:
                try:
                    repaired = _repair_json(candidate, return_objects=True)
                    if isinstance(repaired, dict) and repaired:
                        log.info(
                            "json_repair recovered JSON from bounded candidate.")
                        return repaired
                except Exception as rep_exc:
                    log.warning(f"json_repair failed on candidate: {rep_exc}")
            raise ValueError(f"Invalid JSON: {exc.msg}")

    # Truncated output — close all unclosed braces/brackets
    log.warning(
        "JSON appears truncated — attempting recovery by closing open structures.")
    fragment = text[start:]
    opens: list[str] = []
    in_string = False
    escape_next = False
    for ch in fragment:
        if escape_next:
            escape_next = False
            continue
        if ch == "\\" and in_string:
            escape_next = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch in "{[":
            opens.append(ch)
        elif ch in "}]":
            if opens:
                opens.pop()

    closing = "".join("}" if o == "{" else "]" for o in reversed(opens))
    repaired = fragment + closing
    try:
        result = json.loads(repaired)
        log.info("Truncated JSON recovered successfully.")
        return result
    except json.JSONDecodeError as exc:
        log.warning(
            f"Closing-brace recovery failed: {exc.msg} — trying json_repair")
        if _JSON_REPAIR_AVAILABLE:
            try:
                result = _repair_json(fragment, return_objects=True)
                if isinstance(result, dict) and result:
                    log.info("json_repair recovered truncated/malformed JSON.")
                    return result
            except Exception as rep_exc:
                log.warning(f"json_repair failed: {rep_exc}")
        log.error(f"Recovery failed: {exc.msg}")
        log.error(f"Raw output (first 1200 chars): {text[:1200]}")
        raise ValueError("Malformed JSON in model output.")


def correct_plan_calories(plan: dict) -> dict:
    """Re-sum total_calories across meals to make daily totals internally consistent.

    The model estimates calories independently per meal and per day, which
    can produce totals that don't match the sum of parts.  This corrects the
    `total_calories` field on each day to equal the actual sum so downstream
    consumers always see consistent numbers.

    NOTE: The training schema uses `total_calories` on each meal (set by
    build_meal_json in generate_nutrition_sft.py).  The model may also output
    `estimated_calories` in edge cases — we check both for robustness.
    """
    for day in plan.get("days", []):
        meals = day.get("meals", {})
        actual_total = sum(
            meal.get("total_calories", meal.get("estimated_calories", 0))
            for meal in (meals.values() if isinstance(meals, dict) else meals)
        )
        if actual_total > 0:
            day["total_calories"] = actual_total
    return plan


def run_inference(req: NutritionRequest) -> dict:
    daily_kcal = compute_tdee(req)
    inbody_flags, cal_adj, protein_pct, carbs_pct, fat_pct = build_inbody_flags(
        req.inbody)

    if req.inbody:
        # Apply InBody calorie adjustment selectively:
        # - weight_loss:        skip  (goal multiplier already applies 0.80 — no double deficit)
        # - muscle_gain:        skip  (muscle gain needs a surplus; InBody deficit is wrong here)
        # - maintenance:        skip  (user asked to maintain, not cut)
        # - body_recomposition: apply (fine-tuning around TDEE is appropriate)
        if req.goal == "body_recomposition":
            daily_kcal = int(daily_kcal * cal_adj)
        daily_kcal = max(1200, daily_kcal)   # safety floor

    user_msg = build_prompt(req, daily_kcal, inbody_flags,
                            protein_pct, carbs_pct, fat_pct)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": user_msg},
    ]

    prompt = _tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )
    _device = next(_model.parameters()).device
    inputs = _tokenizer(prompt, return_tensors="pt",
                        truncation=True, max_length=1536).to(_device)
    log.info(f"Inference device: {_device}")

    stopping_criteria = StoppingCriteriaList([
        JsonRootClosedCriteria(_tokenizer, inputs["input_ids"].shape[1])
    ])
    with torch.no_grad():
        output_ids = _model.generate(
            **inputs,
            max_new_tokens=4500,
            temperature=0.3,
            top_p=0.9,
            do_sample=True,
            repetition_penalty=1.1,
            eos_token_id=_tokenizer.eos_token_id,
            pad_token_id=_tokenizer.eos_token_id,
            stopping_criteria=stopping_criteria,
        )

    new_tokens = output_ids[0][inputs["input_ids"].shape[1]:]
    log.info(
        f"Generated {len(new_tokens)} new tokens (prompt: {inputs['input_ids'].shape[1]} tokens)")
    generated = _tokenizer.decode(new_tokens, skip_special_tokens=True)

    plan = extract_json(generated)
    plan = correct_plan_calories(plan)

    # ── Post-processing fixes ────────────────────────────────────────────────

    # 1. Trim to exactly 3 days (model sometimes generates 5-6)
    if isinstance(plan.get("days"), list):
        plan["days"] = plan["days"][:3]

    # 2. Ensure foods_to_avoid is a list
    if not isinstance(plan.get("foods_to_avoid"), list):
        plan["foods_to_avoid"] = []
    existing_avoid_lower = {x.lower() for x in plan["foods_to_avoid"]}

    # 3. Inject allergen keywords so they always appear in foods_to_avoid
    for allergy in req.allergies:
        keywords = ALLERGEN_KEYWORDS.get(allergy.lower(), [allergy])
        if not keywords:  # fallback: add the raw allergy term
            keywords = [allergy]
        for kw in keywords:
            if kw.lower() not in existing_avoid_lower:
                plan["foods_to_avoid"].append(kw)
                existing_avoid_lower.add(kw.lower())

    # 4. Inject disease-specific foods_to_avoid from rules (e.g. hypertension → pickles, chips, etc.)
    for cond in req.health_conditions:
        rule = _diseases.get(cond.lower(), {})
        for item in rule.get("foods_to_avoid", []):
            if item.lower() not in existing_avoid_lower:
                plan["foods_to_avoid"].append(item)
                existing_avoid_lower.add(item.lower())

    plan["_daily_calories"] = daily_kcal
    return plan, daily_kcal


# ══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/health")
def health():
    model_loaded = _model is not None
    return {
        "status": "ok" if model_loaded else "loading",
        "model": "qwen2.5-3b-nutrition-v1",
        "food_db_size": len(_food_db),
        "allergen_entries": len(_allergen),
        "disease_rules": len(_diseases),
    }


@app.post("/generate", response_model=NutritionResponse)
def generate_plan(req: NutritionRequest):
    if _model is None:
        raise HTTPException(503, "Model is still loading. Try again shortly.")

    log.info(f"Generating plan for member={req.member_id} goal={req.goal}")
    t0 = time.time()
    try:
        plan, daily_kcal = run_inference(req)
    except Exception as e:
        log.error(f"Inference error: {e}")
        raise HTTPException(500, f"Inference failed: {str(e)}")

    elapsed_ms = int((time.time() - t0) * 1000)
    log.info(f"Plan generated for member={req.member_id} in {elapsed_ms} ms")

    return NutritionResponse(
        member_id=req.member_id,
        generated_at=__import__(
            "datetime").datetime.utcnow().isoformat() + "Z",
        daily_calories=daily_kcal,
        plan=plan,
        generation_ms=elapsed_ms,
    )


@app.get("/foods/search")
def search_foods(
    q: str = Query(..., min_length=1, max_length=100,
                   description="Search term"),
    source: Optional[str] = Query(None, pattern="^(egyptian|usda)$"),
    limit: int = Query(20, ge=1, le=100),
):
    """Fuzzy-ish food search — substring match on name, case-insensitive."""
    q_lower = q.lower()
    results = []
    for food in _food_db:
        if source and food.get("source") != source:
            continue
        if q_lower in food.get("name", "").lower():
            results.append({
                "id":      food.get("id"),
                "name":    food.get("name"),
                "source":  food.get("source"),
                "per_100g": food.get("per_100g", {}),
                "health_score": food.get("health_score"),
            })
        if len(results) >= limit:
            break
    return {"query": q, "count": len(results), "foods": results}


# ══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    uvicorn.run(
        "serve_nutrition:app",
        host="0.0.0.0",
        port=5301,
        reload=False,
        log_level="info",
    )
