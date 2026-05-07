"""
IntelliFit Nutrition Plan Generator — Hugging Face ZeroGPU Space
=================================================================
Gradio app wrapping the Qwen2.5-3B-Instruct + QLoRA nutrition model.
Uses @spaces.GPU decorator for on-demand T4 GPU access (free ZeroGPU).

Environment Variables (set as HF Space Secrets):
    HF_TOKEN        — Hugging Face access token
    ADAPTER_REPO    — HF repo for QLoRA adapter (e.g., "YourUser/intellifit-nutrition-v1")
    DATA_REPO       — HF dataset repo for JSON data files

Endpoints exposed by Gradio:
    POST /api/generate    — Generate a nutrition plan (JSON in → JSON out)
    POST /api/health      — Health check
"""

import os
import json
import time
import math
import re
import logging
from typing import Optional

import spaces  # HF ZeroGPU decorator
import gradio as gr
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
from huggingface_hub import snapshot_download, hf_hub_download

try:
    from json_repair import repair_json as _repair_json
    _JSON_REPAIR_AVAILABLE = True
except ImportError:
    _JSON_REPAIR_AVAILABLE = False

# ── Configuration ────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("nutrition-api")

HF_TOKEN = os.environ.get("HF_TOKEN")
ADAPTER_REPO = os.environ.get("ADAPTER_REPO", "YourUsername/intellifit-nutrition-v1")
DATA_REPO = os.environ.get("DATA_REPO", "YourUsername/intellifit-nutrition-data")
BASE_MODEL = "Qwen/Qwen2.5-3B-Instruct"

# ── Allergen keyword expansion ───────────────────────────────────────────────
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

GOAL_MULTIPLIERS = {
    "weight_loss": 0.80, "maintenance": 1.0,
    "muscle_gain": 1.10, "body_recomposition": 0.95,
}
ACTIVITY_FACTORS = {
    "sedentary": 1.2, "light": 1.375, "moderate": 1.55,
    "active": 1.725, "very_active": 1.9,
}

SYSTEM_PROMPT = (
    "You are IntelliFit Nutrition Coach — an expert Egyptian sports nutritionist. "
    "You create personalised 3-day halal nutrition plans (valid JSON, no markdown). "
    "IMPORTANT: Always generate EXACTLY 3 days — never more, never fewer. "
    "Each plan has EXACTLY 3 unique days, each with breakfast, lunch, dinner, and one snack. "
    "Plans respect the user's health conditions, allergies, fitness goal, and InBody data. "
    "Output ONLY valid JSON in the exact schema requested. "
    "Use Egyptian food names whenever possible. All food is halal."
)

# ── Download Artifacts ───────────────────────────────────────────────────────
log.info("Downloading QLoRA adapter...")
adapter_dir = snapshot_download(repo_id=ADAPTER_REPO, token=HF_TOKEN)
log.info(f"Adapter: {adapter_dir}")

log.info("Downloading data files...")
disease_path = hf_hub_download(
    repo_id=DATA_REPO, filename="disease_rules.json",
    repo_type="dataset", token=HF_TOKEN,
)
with open(disease_path, encoding="utf-8") as f:
    diseases = json.load(f)
log.info(f"Loaded {len(diseases)} disease rules")

# ── Load Model (CPU first — ZeroGPU moves to GPU on @spaces.GPU call) ───────
log.info("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(adapter_dir, trust_remote_code=True)
tokenizer.pad_token = tokenizer.eos_token

log.info("Loading base model...")
base = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    torch_dtype=torch.float16,
    trust_remote_code=True,
)
log.info("Loading LoRA adapter...")
model = PeftModel.from_pretrained(base, adapter_dir)
model.eval()
log.info("Model ready (on CPU — will move to GPU on demand via ZeroGPU).")


# ══════════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS (from serve_nutrition.py)
# ══════════════════════════════════════════════════════════════════════════════

def compute_tdee(gender: str, age: int, weight_kg: float, height_cm: float,
                 activity_level: str, goal: str,
                 inbody_bmr: Optional[float] = None) -> int:
    """Mifflin-St Jeor BMR × activity × goal multiplier."""
    if gender == "male":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161

    if inbody_bmr:
        bmr = inbody_bmr

    tdee = bmr * ACTIVITY_FACTORS.get(activity_level, 1.55)
    return int(tdee * GOAL_MULTIPLIERS.get(goal, 1.0))


def build_inbody_flags(inbody: Optional[dict]) -> tuple:
    """Analyse InBody data and return adjustments."""
    flags = []
    cal_adj = 1.0
    protein_pct = 25
    fat_pct = 25
    carbs_pct = 50

    if inbody:
        bf = inbody.get("body_fat_percentage")
        mm = inbody.get("muscle_mass_kg")
        vf = inbody.get("visceral_fat_level")

        if bf and bf > 30:
            cal_adj = 0.80
            fat_pct = 20
            protein_pct = 35
            carbs_pct = 45
            flags.append(f"high body fat ({bf}%) → 20% deficit")
        if mm and mm < 25:
            protein_pct = max(protein_pct, 35)
            fat_pct = 20
            carbs_pct = 100 - protein_pct - fat_pct
            flags.append(f"low muscle mass ({mm} kg) → elevated protein")
        if vf and vf >= 10:
            flags.append(f"high visceral fat (level {vf}) → low sodium, high fiber")

    flag_str = "; ".join(flags) if flags else "within normal InBody ranges"
    return flag_str, cal_adj, protein_pct, carbs_pct, fat_pct


def build_prompt(req: dict, daily_kcal: int, inbody_flags: str,
                 protein_pct: int, carbs_pct: int, fat_pct: int) -> str:
    """Build the user prompt for the nutrition model."""
    conditions = req.get("health_conditions", [])
    allergies = req.get("allergies", [])
    conditions_str = ", ".join(conditions) if conditions else "none"
    allergy_str = ", ".join(allergies) if allergies else "none"

    disease_notes = []
    for cond in conditions:
        rule = diseases.get(cond.lower(), {})
        if rule:
            rec = rule.get("recommended_foods", [])[:4]
            avoid = rule.get("foods_to_avoid", [])[:8]
            if rec:
                disease_notes.append(f"Recommended for {cond}: {', '.join(rec)}")
            if avoid:
                disease_notes.append(f"MUST AVOID for {cond}: {', '.join(avoid)}")
    disease_notes_str = " ".join(disease_notes) if disease_notes else ""

    inbody_section = ""
    inbody = req.get("inbody")
    if inbody:
        inbody_section = (
            f"InBody snapshot: body fat {inbody.get('body_fat_percentage')}%, "
            f"muscle mass {inbody.get('muscle_mass_kg')} kg, "
            f"visceral fat level {inbody.get('visceral_fat_level')}, "
            f"BMR {inbody.get('bmr_kcal')} kcal. "
            f"InBody adjustments: {inbody_flags}. "
        )

    user_msg = (
        f"Create a 3-day halal nutrition plan for a {req['age']}-year-old {req['gender']}, "
        f"weight {req['weight_kg']} kg, height {req['height_cm']} cm. "
        f"Goal: {req['goal'].replace('_', ' ')}, activity: {req.get('activity_level', 'moderate')}. "
        f"Health conditions: {conditions_str}. "
        f"Allergies: {allergy_str}. "
        f"Cuisine preference: {req.get('cuisine_preference', 'egyptian')}. "
        + inbody_section
        + f"Daily calorie target: {daily_kcal} kcal. "
        f"Macro targets — protein: {protein_pct}%, carbs: {carbs_pct}%, fat: {fat_pct}%. "
        + (disease_notes_str + " " if disease_notes_str else "")
        + "Return only a valid JSON 3-day nutrition plan with breakfast, lunch, dinner, and snack per day. "
        "IMPORTANT: The plan must contain EXACTLY 3 days — stop after day 3."
    )
    return user_msg


def extract_json(text: str) -> dict:
    """Extract first JSON object from model output, with truncation recovery."""
    text = re.sub(r"^```(?:json)?\s*", "", text.strip(), flags=re.MULTILINE)
    text = re.sub(r"```\s*$", "", text.strip(), flags=re.MULTILINE)
    text = text.strip()

    start = text.find("{")
    if start == -1:
        raise ValueError("No JSON object found in model output.")

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
        except json.JSONDecodeError:
            if _JSON_REPAIR_AVAILABLE:
                try:
                    repaired = _repair_json(candidate, return_objects=True)
                    if isinstance(repaired, dict) and repaired:
                        return repaired
                except Exception:
                    pass

    # Truncated output recovery
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
        return json.loads(repaired)
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
    """Re-sum total_calories across meals for internal consistency."""
    for day in plan.get("days", []):
        meals = day.get("meals", {})
        actual_total = sum(
            meal.get("total_calories", meal.get("estimated_calories", 0))
            for meal in (meals.values() if isinstance(meals, dict) else meals)
        )
        if actual_total > 0:
            day["total_calories"] = actual_total
    return plan


# ══════════════════════════════════════════════════════════════════════════════
# GPU INFERENCE (ZeroGPU)
# ══════════════════════════════════════════════════════════════════════════════

@spaces.GPU(duration=120)
def run_inference_gpu(messages_json: str) -> str:
    """Run model inference on GPU. Called with @spaces.GPU decorator."""
    messages = json.loads(messages_json)

    prompt = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True,
    )
    inputs = tokenizer(
        prompt, return_tensors="pt", truncation=True, max_length=1536,
    ).to(model.device)

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=4500,
            temperature=0.3,
            top_p=0.9,
            do_sample=True,
            repetition_penalty=1.1,
            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.eos_token_id,
        )

    new_tokens = output_ids[0][inputs["input_ids"].shape[1]:]
    generated = tokenizer.decode(new_tokens, skip_special_tokens=True)
    return generated


def generate_plan(request_json: str) -> str:
    """
    Main entrypoint: takes a JSON string request, returns a JSON string response.
    This is the function exposed via Gradio's API.
    """
    t0 = time.time()
    try:
        req = json.loads(request_json)

        # Compute TDEE
        inbody = req.get("inbody")
        inbody_bmr = inbody.get("bmr_kcal") if inbody else None
        daily_kcal = compute_tdee(
            req["gender"], req["age"], req["weight_kg"], req["height_cm"],
            req.get("activity_level", "moderate"), req["goal"], inbody_bmr,
        )

        # InBody adjustments
        inbody_flags, cal_adj, protein_pct, carbs_pct, fat_pct = build_inbody_flags(inbody)
        if inbody and req["goal"] == "body_recomposition":
            daily_kcal = int(daily_kcal * cal_adj)
        daily_kcal = max(1200, daily_kcal)

        # Build prompt
        user_msg = build_prompt(req, daily_kcal, inbody_flags, protein_pct, carbs_pct, fat_pct)
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ]

        # Run GPU inference
        generated = run_inference_gpu(json.dumps(messages))

        # Parse & post-process
        plan = extract_json(generated)
        plan = correct_plan_calories(plan)

        # Trim to 3 days
        if isinstance(plan.get("days"), list):
            plan["days"] = plan["days"][:3]

        # Inject allergen foods_to_avoid
        if not isinstance(plan.get("foods_to_avoid"), list):
            plan["foods_to_avoid"] = []
        existing_avoid_lower = {x.lower() for x in plan["foods_to_avoid"]}

        for allergy in req.get("allergies", []):
            keywords = ALLERGEN_KEYWORDS.get(allergy.lower(), [allergy])
            for kw in keywords:
                if kw.lower() not in existing_avoid_lower:
                    plan["foods_to_avoid"].append(kw)
                    existing_avoid_lower.add(kw.lower())

        # Inject disease-specific foods_to_avoid
        for cond in req.get("health_conditions", []):
            rule = diseases.get(cond.lower(), {})
            for item in rule.get("foods_to_avoid", []):
                if item.lower() not in existing_avoid_lower:
                    plan["foods_to_avoid"].append(item)
                    existing_avoid_lower.add(item.lower())

        elapsed_ms = int((time.time() - t0) * 1000)

        return json.dumps({
            "status": "ok",
            "member_id": req.get("member_id"),
            "daily_calories": daily_kcal,
            "plan": plan,
            "generation_ms": elapsed_ms,
        })

    except Exception as e:
        elapsed_ms = int((time.time() - t0) * 1000)
        log.error(f"Inference error: {e}")
        return json.dumps({
            "status": "error",
            "error": str(e),
            "generation_ms": elapsed_ms,
        })


def health_check(dummy: str = "") -> str:
    """Simple health check."""
    return json.dumps({
        "status": "ok",
        "model": "qwen2.5-3b-nutrition-v1",
        "disease_rules": len(diseases),
    })


# ══════════════════════════════════════════════════════════════════════════════
# GRADIO INTERFACE (required for ZeroGPU)
# ══════════════════════════════════════════════════════════════════════════════

with gr.Blocks(title="IntelliFit Nutrition AI") as demo:
    gr.Markdown("# 🥗 IntelliFit Nutrition Plan Generator")
    gr.Markdown(
        "Generate personalized 3-day halal nutrition plans. "
        "Send a JSON request to the `/api/generate` endpoint."
    )

    with gr.Tab("Generate Plan"):
        input_box = gr.Textbox(
            label="Request JSON",
            lines=15,
            placeholder='{"gender":"male","age":25,"weight_kg":80,"height_cm":175,"goal":"muscle_gain","activity_level":"moderate","health_conditions":[],"allergies":[],"cuisine_preference":"egyptian"}',
        )
        output_box = gr.Textbox(label="Response JSON", lines=20)
        generate_btn = gr.Button("Generate Plan", variant="primary")
        generate_btn.click(fn=generate_plan, inputs=input_box, outputs=output_box, api_name="generate")

    with gr.Tab("Health Check"):
        health_output = gr.Textbox(label="Health Status", lines=5)
        health_btn = gr.Button("Check Health")
        health_btn.click(fn=health_check, inputs=gr.Textbox(visible=False, value=""), outputs=health_output, api_name="health")

demo.launch()
