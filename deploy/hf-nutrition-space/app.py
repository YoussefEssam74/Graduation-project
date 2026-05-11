"""
IntelliFit Nutrition Plan Generator — Hugging Face Spaces (Gradio SDK, CPU)
===========================================================================
Adapted from: ml_models/Nutrition-Plan_Generating/serve_nutrition.py

Changes for HF Spaces:
  - Model loaded from HF Hub (ADAPTER_REPO secret) instead of local path
  - Artifacts (food_db_halal.json, allergen_taxonomy.json, disease_rules.json)
    loaded from HF Hub snapshot
  - bitsandbytes / 4-bit quantization removed (CPU-only Space, use float32)
  - device_map removed (no GPU)
  - FastAPI replaced with Gradio wrapper (Gradio SDK requirement)
  - All core logic preserved intact: TDEE, InBody, prompts, JSON extraction,
    allergen injection, disease rules, calorie correction

Environment Secrets:
  HF_TOKEN    — HF read token (to download private repos)
  ADAPTER_REPO — e.g. youssefeemad/intellifit-nutrition-v1
"""

import os
import json
import re
import math
import time
import logging
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

import torch
import gradio as gr
from transformers import (
    AutoModelForCausalLM, AutoTokenizer,
    StoppingCriteria, StoppingCriteriaList,
)
from peft import PeftModel
from huggingface_hub import snapshot_download

try:
    from json_repair import repair_json as _repair_json
    _JSON_REPAIR_AVAILABLE = True
except ImportError:
    _JSON_REPAIR_AVAILABLE = False

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("nutrition-space")

# ── Config ─────────────────────────────────────────────────────────────────────
HF_TOKEN     = os.environ.get("HF_TOKEN")
ADAPTER_REPO = os.environ.get("ADAPTER_REPO", "youssefeemad/intellifit-nutrition-v1")
BASE_MODEL   = "Qwen/Qwen2.5-3B-Instruct"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ── Download adapter + artifacts from HF Hub ───────────────────────────────────
log.info(f"Downloading adapter from {ADAPTER_REPO}...")
ADAPTER_DIR = snapshot_download(repo_id=ADAPTER_REPO, token=HF_TOKEN, cache_dir="/tmp/models")
log.info(f"Adapter dir: {ADAPTER_DIR}")

# ── Load artifacts ─────────────────────────────────────────────────────────────
_food_db: list = []
_allergen: dict = {}
_diseases: dict = {}

FOOD_DB_PATH  = os.path.join(ADAPTER_DIR, "food_db_halal.json")
ALLERGEN_PATH = os.path.join(ADAPTER_DIR, "allergen_taxonomy.json")
DISEASE_PATH  = os.path.join(ADAPTER_DIR, "disease_rules.json")

if os.path.exists(FOOD_DB_PATH):
    with open(FOOD_DB_PATH, encoding="utf-8") as f:
        _food_db = json.load(f)
    log.info(f"Food DB: {len(_food_db):,} entries")
else:
    log.warning("food_db_halal.json not found in adapter repo")

if os.path.exists(ALLERGEN_PATH):
    with open(ALLERGEN_PATH, encoding="utf-8") as f:
        _allergen = json.load(f)
    log.info(f"Allergen taxonomy: {len(_allergen):,} entries")

if os.path.exists(DISEASE_PATH):
    with open(DISEASE_PATH, encoding="utf-8") as f:
        _diseases = json.load(f)
    log.info(f"Disease rules: {len(_diseases):,} diseases")

# ── Load model (CPU — no quantization) ────────────────────────────────────────
log.info("Loading model...")
is_merged = not os.path.exists(os.path.join(ADAPTER_DIR, "adapter_config.json"))

if is_merged:
    log.info("Loading fully merged model...")
    _model = AutoModelForCausalLM.from_pretrained(
        ADAPTER_DIR, trust_remote_code=True, torch_dtype=torch.float32,
    )
else:
    log.info("Loading base + SFT adapter...")
    base = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL, trust_remote_code=True, torch_dtype=torch.float32,
    )
    _model = PeftModel.from_pretrained(base, ADAPTER_DIR)

_tokenizer = AutoTokenizer.from_pretrained(ADAPTER_DIR, trust_remote_code=True)
_tokenizer.pad_token = _tokenizer.eos_token
_model = _model.to(DEVICE)
_model.eval()
log.info("Model ready.")

# ══════════════════════════════════════════════════════════════════════════════
# Logic (mirrors serve_nutrition.py)
# ══════════════════════════════════════════════════════════════════════════════

ALLERGEN_KEYWORDS: dict = {
    "gluten":    ["gluten", "wheat", "barley", "rye", "white bread", "pasta", "couscous", "semolina"],
    "dairy":     ["milk", "cheese", "butter", "cream", "yogurt", "lactose", "whey"],
    "nuts":      ["peanuts", "almonds", "cashews", "walnuts", "pistachios", "tree nuts", "hazelnuts"],
    "eggs":      ["eggs", "egg white", "egg yolk", "mayonnaise"],
    "fish":      ["fish", "tuna", "salmon", "sardines", "tilapia", "anchovy"],
    "shellfish": ["shrimp", "crab", "lobster", "shellfish", "squid", "mussels"],
    "soy":       ["soy", "tofu", "edamame", "soy sauce", "miso"],
    "sesame":    ["sesame", "tahini", "sesame oil", "sesame seeds"],
}

SYSTEM_PROMPT = (
    "You are IntelliFit Nutrition Coach — an expert Egyptian sports nutritionist. "
    "You create personalised 1-day halal nutrition plans (valid JSON, no markdown). "
    "IMPORTANT: Always generate EXACTLY 1 day — only one day."
    "The plan has EXACTLY 1 day with breakfast, lunch, dinner, and one snack. "
    "Plans respect the user's health conditions, allergies, fitness goal, and InBody data. "
    "Output ONLY valid JSON in the exact schema requested. "
    "Use Egyptian food names whenever possible. All food is halal."
)

GOAL_MULTIPLIERS = {
    "weight_loss": 0.80, "maintenance": 1.0,
    "muscle_gain": 1.10, "body_recomposition": 0.95,
}
ACTIVITY_FACTORS = {
    "sedentary": 1.2, "light": 1.375, "moderate": 1.55,
    "active": 1.725, "very_active": 1.9,
}


class JsonRootClosedCriteria(StoppingCriteria):
    def __init__(self, tokenizer, prompt_len: int):
        self._tok = tokenizer
        self._prompt_len = prompt_len
        self._scanned_len = 0
        self._depth = 0
        self._in_str = False
        self._esc = False
        self._started = False

    def __call__(self, input_ids, scores, **kwargs) -> bool:
        new_ids = input_ids[0][self._prompt_len:]
        total_new = len(new_ids)
        if total_new <= self._scanned_len:
            return False
        incremental_ids = new_ids[self._scanned_len:]
        incremental_text = self._tok.decode(incremental_ids, skip_special_tokens=True)
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


def compute_tdee(gender, age, weight_kg, height_cm, goal, activity_level, inbody=None) -> int:
    if gender == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    if inbody and inbody.get("bmr_kcal"):
        bmr = inbody["bmr_kcal"]
    tdee = bmr * ACTIVITY_FACTORS.get(activity_level, 1.55)
    return int(tdee * GOAL_MULTIPLIERS.get(goal, 1.0))


def build_inbody_flags(inbody: Optional[dict]):
    if not inbody:
        return "within normal ranges", 1.0, 25, 50, 25
    flags = []
    cal_adj = 1.0
    protein_pct, fat_pct, carbs_pct = 25, 25, 50
    if inbody.get("body_fat_percentage", 0) > 30:
        cal_adj = 0.80
        fat_pct, protein_pct, carbs_pct = 20, 35, 45
        flags.append(f"high body fat ({inbody['body_fat_percentage']}%) → 20% deficit")
    if inbody.get("muscle_mass_kg", 99) < 25:
        protein_pct = max(protein_pct, 35)
        fat_pct = 20
        carbs_pct = 100 - protein_pct - fat_pct
        flags.append(f"low muscle mass ({inbody['muscle_mass_kg']} kg) → elevated protein")
    if inbody.get("visceral_fat_level", 0) >= 10:
        flags.append(f"high visceral fat (level {inbody['visceral_fat_level']}) → low sodium, high fiber")
    return "; ".join(flags) if flags else "within normal InBody ranges", cal_adj, protein_pct, carbs_pct, fat_pct


def build_prompt(req: dict, daily_kcal: int, inbody_flags: str,
                 protein_pct: int, carbs_pct: int, fat_pct: int) -> str:
    conditions_str = ", ".join(req.get("health_conditions", [])) or "none"
    allergy_str = ", ".join(req.get("allergies", [])) or "none"
    disease_notes = []
    for cond in req.get("health_conditions", []):
        rule = _diseases.get(cond.lower(), {})
        if rule:
            rec = rule.get("recommended_foods", [])[:4]
            avoid = rule.get("foods_to_avoid", [])[:8]
            if rec:
                disease_notes.append(f"Recommended for {cond}: {', '.join(rec)}")
            if avoid:
                disease_notes.append(f"MUST AVOID for {cond}: {', '.join(avoid)}")
    inbody = req.get("inbody", {})
    inbody_section = ""
    if inbody:
        inbody_section = (
            f"InBody snapshot: body fat {inbody.get('body_fat_percentage')}%, "
            f"muscle mass {inbody.get('muscle_mass_kg')} kg, "
            f"visceral fat level {inbody.get('visceral_fat_level')}, "
            f"BMR {inbody.get('bmr_kcal')} kcal. "
            f"InBody adjustments: {inbody_flags}. "
        )
    user_msg = (
        f"Create a 1-day halal nutrition plan for a {req.get('age')}-year-old {req.get('gender')}, "
        f"weight {req.get('weight_kg')} kg, height {req.get('height_cm')} cm. "
        f"Goal: {req.get('goal','maintenance').replace('_', ' ')}, activity: {req.get('activity_level','moderate')}. "
        f"Health conditions: {conditions_str}. Allergies: {allergy_str}. "
        f"Cuisine preference: {req.get('cuisine_preference','egyptian')}. "
        + inbody_section
        + f"Daily calorie target: {daily_kcal} kcal. "
        f"Macro targets — protein: {protein_pct}%, carbs: {carbs_pct}%, fat: {fat_pct}%. "
        + (" ".join(disease_notes) + " " if disease_notes else "")
        + "Return only a valid JSON 1-day nutrition plan with breakfast, lunch, dinner, and snack. "
        "IMPORTANT: The plan must contain EXACTLY 1 day — stop after day 1."
    )
    return user_msg


def extract_json(text: str) -> dict:
    text = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
    text = re.sub(r"```\s*$", "", text.strip(), flags=re.MULTILINE).strip()
    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in model output.")
    try:
        return json.loads(text[start:])
    except json.JSONDecodeError:
        pass
    depth, end = 0, -1
    for i, ch in enumerate(text[start:], start):
        if ch == "{": depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i
                break
    if end != -1:
        try:
            return json.loads(text[start:end+1])
        except json.JSONDecodeError:
            pass
    # Truncated — close open structures
    fragment = text[start:]
    opens = []
    in_str = esc = False
    for ch in fragment:
        if esc: esc = False; continue
        if ch == "\\" and in_str: esc = True; continue
        if ch == '"': in_str = not in_str; continue
        if in_str: continue
        if ch in "{[": opens.append(ch)
        elif ch in "}]" and opens: opens.pop()
    closing = "".join("}" if o == "{" else "]" for o in reversed(opens))
    try:
        return json.loads(fragment + closing)
    except json.JSONDecodeError:
        if _JSON_REPAIR_AVAILABLE:
            try:
                result = _repair_json(fragment, return_objects=True)
                if isinstance(result, dict) and result:
                    return result
            except Exception:
                pass
        raise ValueError("Malformed JSON in model output.")


def correct_plan_calories(plan: dict) -> dict:
    for day in plan.get("days", []):
        meals = day.get("meals", {})
        actual = sum(
            meal.get("total_calories", meal.get("estimated_calories", 0))
            for meal in (meals.values() if isinstance(meals, dict) else meals)
        )
        if actual > 0:
            day["total_calories"] = actual
    return plan


def run_inference(req: dict) -> tuple:
    daily_kcal = compute_tdee(
        req.get("gender", "male"), req.get("age", 25),
        req.get("weight_kg", 75), req.get("height_cm", 175),
        req.get("goal", "maintenance"), req.get("activity_level", "moderate"),
        req.get("inbody"),
    )
    inbody_flags, cal_adj, protein_pct, carbs_pct, fat_pct = build_inbody_flags(req.get("inbody"))
    if req.get("inbody") and req.get("goal") == "body_recomposition":
        daily_kcal = max(1200, int(daily_kcal * cal_adj))

    user_msg = build_prompt(req, daily_kcal, inbody_flags, protein_pct, carbs_pct, fat_pct)
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",   "content": user_msg},
    ]
    prompt = _tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = _tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1536).to(DEVICE)

    stopping_criteria = StoppingCriteriaList([
        JsonRootClosedCriteria(_tokenizer, inputs["input_ids"].shape[1])
    ])
    with torch.no_grad():
        output_ids = _model.generate(
            **inputs,
            max_new_tokens=800,
            do_sample=False,
            repetition_penalty=1.1,
            eos_token_id=_tokenizer.eos_token_id,
            pad_token_id=_tokenizer.eos_token_id,
            stopping_criteria=stopping_criteria,
        )
    new_tokens = output_ids[0][inputs["input_ids"].shape[1]:]
    generated = _tokenizer.decode(new_tokens, skip_special_tokens=True)
    plan = extract_json(generated)
    plan = correct_plan_calories(plan)

    # Post-processing
    if isinstance(plan.get("days"), list):
        plan["days"] = plan["days"][:1]
    if not isinstance(plan.get("foods_to_avoid"), list):
        plan["foods_to_avoid"] = []
    avoid_lower = {x.lower() for x in plan["foods_to_avoid"]}
    for allergy in req.get("allergies", []):
        for kw in ALLERGEN_KEYWORDS.get(allergy.lower(), [allergy]):
            if kw.lower() not in avoid_lower:
                plan["foods_to_avoid"].append(kw)
                avoid_lower.add(kw.lower())
    for cond in req.get("health_conditions", []):
        rule = _diseases.get(cond.lower(), {})
        for item in rule.get("foods_to_avoid", []):
            if item.lower() not in avoid_lower:
                plan["foods_to_avoid"].append(item)
                avoid_lower.add(item.lower())

    plan["_daily_calories"] = daily_kcal
    return plan, daily_kcal


# ── Gradio predict function ─────────────────────────────────────────────────────
def predict(request_json: str) -> str:
    """
    Input:  JSON string matching C# NutritionRequest (from WorkoutGeneratorAPI)
    Output: JSON string with plan, daily_calories, generation_ms
    Called by C# as: POST /api/predict  {"data": [request_json_string]}
    """
    t0 = time.time()
    try:
        req = json.loads(request_json)
        plan, daily_kcal = run_inference(req)
        return json.dumps({
            "member_id":      req.get("member_id"),
            "generated_at":   datetime.utcnow().isoformat() + "Z",
            "daily_calories": daily_kcal,
            "plan":           plan,
            "generation_ms":  int((time.time() - t0) * 1000),
            "error":          None,
        })
    except Exception as e:
        log.error(f"predict() error: {e}", exc_info=True)
        return json.dumps({
            "member_id": None, "generated_at": datetime.utcnow().isoformat() + "Z",
            "daily_calories": 0, "plan": None,
            "generation_ms": int((time.time() - t0) * 1000),
            "error": str(e),
        })


def health(_: str = "") -> str:
    return json.dumps({
        "status": "healthy", "model": "qwen2.5-3b-nutrition-v1", "device": DEVICE,
        "food_db_size": len(_food_db), "disease_rules": len(_diseases),
        "timestamp": datetime.utcnow().isoformat(),
    })


# ── Gradio Interface ────────────────────────────────────────────────────────────
with gr.Blocks(title="IntelliFit Nutrition AI") as demo:
    gr.Markdown("# 🥗 IntelliFit Nutrition Plan Generator")
    gr.Markdown("**API endpoint**: POST `/api/predict` with `{\"data\": [request_json_string]}`")
    with gr.Row():
        inp = gr.Textbox(label="Request JSON", lines=12,
            placeholder='{"member_id":"1","gender":"male","age":25,"weight_kg":80,"height_cm":175,"goal":"muscle_gain","activity_level":"moderate","health_conditions":[],"allergies":[],"cuisine_preference":"egyptian"}')
        out = gr.Textbox(label="Response JSON", lines=12)
    gr.Button("Generate Nutrition Plan", variant="primary").click(
        fn=predict, inputs=inp, outputs=out, api_name="predict")
    with gr.Row():
        health_out = gr.Textbox(label="Health", lines=3)
    gr.Button("Health Check").click(fn=health, inputs=gr.Textbox(visible=False, value=""),
                                    outputs=health_out, api_name="health")

demo.launch()
