"""
deploy/modal_nutrition.py
─────────────────────────────────────────────────────────────────────────────
Modal GPU deployment for IntelliFit Nutrition Plan Generator.

Runs Qwen2.5-3B-Instruct + QLoRA PEFT adapter with 4-bit NF4 quantization
on a T4 GPU.  Expected inference: ~5–15 s per request.

Quick-start
-----------
  pip install modal
  modal setup                                        # browser auth
  modal secret create huggingface-secret HF_TOKEN=<your-hf-token>
  modal deploy deploy/modal_nutrition.py             # deploy

Endpoint
--------
  POST  https://<your-slug>--intellifit-nutrition-nutritionservice-web.modal.run/generate
  GET   https://...web.modal.run/health

The /generate endpoint accepts the same NutritionRequest JSON that the
.NET backend already builds, and returns a JSON body identical to the
existing HF Space response so the C# client requires minimal changes.
"""

import modal
from typing import Optional
from pydantic import BaseModel, Field

# ── Constants ─────────────────────────────────────────────────────────────────
ADAPTER_REPO = "youssefeemad/intellifit-nutrition-v1"
BASE_MODEL   = "Qwen/Qwen2.5-3B-Instruct"
MODEL_CACHE  = "/model-cache"

# ── Container image ───────────────────────────────────────────────────────────
# Float16 inference — no bitsandbytes needed. Qwen2.5-3B fp16 ≈ 6 GB; T4 has 16 GB.
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "torch==2.5.1",
        extra_index_url="https://download.pytorch.org/whl/cu121",
    )
    .pip_install(
        "transformers>=4.40.0",
        "peft>=0.10.0",
        "accelerate>=0.27.0",
        "fastapi[standard]>=0.110.0",
        "huggingface_hub>=0.22.0",
        "json-repair>=0.28.0",
    )
)

# ── Persistent volume — model weights cached between cold starts ──────────────
volume = modal.Volume.from_name("intellifit-nutrition-models", create_if_missing=True)

app = modal.App("intellifit-nutrition")

# ── Pydantic request / response schemas ──────────────────────────────────────
class InBodyData(BaseModel):
    body_fat_percentage:   Optional[float] = None
    muscle_mass_kg:        Optional[float] = None
    visceral_fat_level:    Optional[int]   = None
    bmr_kcal:              Optional[float] = None
    body_water_percentage: Optional[float] = None
    metabolic_age:         Optional[int]   = None


class NutritionRequest(BaseModel):
    member_id:          Optional[str]   = None
    gender:             str             = Field(..., pattern="^(male|female)$")
    age:                int             = Field(..., ge=10, le=100)
    weight_kg:          float           = Field(..., gt=20, lt=300)
    height_cm:          float           = Field(..., gt=100, lt=250)
    goal:               str             = Field(..., pattern="^(weight_loss|muscle_gain|maintenance|body_recomposition)$")
    activity_level:     str             = Field("moderate", pattern="^(sedentary|light|moderate|active|very_active)$")
    health_conditions:  list[str]       = Field(default_factory=list)
    allergies:          list[str]       = Field(default_factory=list)
    cuisine_preference: str             = Field("egyptian", pattern="^(egyptian|international)$")
    inbody:             Optional[InBodyData] = None


# ── Shared constants (available inside the container image) ──────────────────
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
    "Each plan has exactly one day with breakfast, lunch, dinner, and one snack. "
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


# ── Modal service class ───────────────────────────────────────────────────────
@app.cls(
    gpu="T4",                       # cheapest GPU; handles 4-bit Qwen2.5-3B
    image=image,
    volumes={MODEL_CACHE: volume},
    timeout=86400,                  # 24 h max — no effective limit
    scaledown_window=300,           # keep warm for 5 min after last request
    secrets=[modal.Secret.from_name("huggingface-secret")],
)
@modal.concurrent(max_inputs=1)     # one inference per container — prevents GPU OOM
class NutritionService:

    # ── Startup: download (if needed) and load model ─────────────────────────
    @modal.enter()
    def load_model(self):
        import json, logging, os
        import torch
        from huggingface_hub import snapshot_download
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel

        logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
        log = logging.getLogger("nutrition-modal")

        hf_token    = os.environ.get("HF_TOKEN")
        adapter_dir = os.path.join(MODEL_CACHE, "adapter")
        base_dir    = os.path.join(MODEL_CACHE, "base_model")

        # ── Download adapter + data files (idempotent: skip if cached) ──────
        adapter_cfg = os.path.join(adapter_dir, "adapter_config.json")
        merged_cfg  = os.path.join(adapter_dir, "config.json")
        if not os.path.exists(adapter_cfg) and not os.path.exists(merged_cfg):
            log.info(f"Downloading adapter from {ADAPTER_REPO} ...")
            snapshot_download(ADAPTER_REPO, local_dir=adapter_dir, token=hf_token)
        else:
            log.info("Adapter already cached in volume.")

        is_merged = not os.path.exists(adapter_cfg)

        # ── Download base model only when adapter is PEFT (not fully merged) ─
        if not is_merged and not os.path.exists(os.path.join(base_dir, "config.json")):
            log.info(f"Downloading base model {BASE_MODEL} ...")
            snapshot_download(BASE_MODEL, local_dir=base_dir, token=hf_token)
        elif not is_merged:
            log.info("Base model already cached in volume.")

        # ── Load JSON data artefacts ─────────────────────────────────────────
        self._food_db  = []
        self._allergen = {}
        self._diseases = {}
        for filename, attr in [
            ("food_db_halal.json",    "_food_db"),
            ("allergen_taxonomy.json", "_allergen"),
            ("disease_rules.json",    "_diseases"),
        ]:
            path = os.path.join(adapter_dir, filename)
            if os.path.exists(path):
                with open(path, encoding="utf-8") as f:
                    setattr(self, attr, json.load(f))
                log.info(f"Loaded {filename}")
            else:
                log.warning(f"{filename} not found in adapter repo")

        # ── Float16 inference — no bitsandbytes needed; T4 has 16 GB VRAM ─────
        if is_merged:
            log.info("Loading fully-merged model (float16) ...")
            self._model = AutoModelForCausalLM.from_pretrained(
                adapter_dir,
                torch_dtype=torch.float16,
                device_map={"": 0},
                trust_remote_code=True,
            )
            self._tokenizer = AutoTokenizer.from_pretrained(adapter_dir, trust_remote_code=True)
        else:
            log.info("Loading base model + PEFT adapter (float16) ...")
            base = AutoModelForCausalLM.from_pretrained(
                base_dir,
                torch_dtype=torch.float16,
                device_map={"": 0},
                trust_remote_code=True,
            )
            self._model = PeftModel.from_pretrained(base, adapter_dir, device_map={"": 0})
            self._tokenizer = AutoTokenizer.from_pretrained(adapter_dir, trust_remote_code=True)

        self._tokenizer.pad_token = self._tokenizer.eos_token
        self._model.eval()
        log.info("Model ready on GPU T4.")

    # ── FastAPI ASGI app ──────────────────────────────────────────────────────
    @modal.asgi_app()
    def web(self):
        import json, re, time, logging
        from datetime import datetime
        from fastapi import FastAPI, HTTPException
        from fastapi.middleware.cors import CORSMiddleware
        from transformers import StoppingCriteria, StoppingCriteriaList
        import torch

        log = logging.getLogger("nutrition-modal")

        web_app = FastAPI(title="IntelliFit Nutrition API", version="1.0.0")
        web_app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_methods=["*"],
            allow_headers=["*"],
        )

        # ── Custom stopping criterion: stop when root JSON object is closed ──
        class _JsonStop(StoppingCriteria):
            def __init__(self, tok, prompt_len: int):
                self._tok         = tok
                self._prompt_len  = prompt_len
                self._n           = 0
                self._depth       = 0
                self._in_str      = False
                self._esc         = False
                self._started     = False

            def __call__(self, input_ids, scores, **kwargs) -> bool:
                new_ids = input_ids[0][self._prompt_len:]
                if len(new_ids) <= self._n:
                    return False
                text = self._tok.decode(new_ids[self._n:], skip_special_tokens=True)
                self._n = len(new_ids)
                for ch in text:
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

        # ── Single-day inference helper (closes over self) ──────────────────
        def _infer_single_day(messages: list) -> dict:
            """Run model inference and return the raw parsed plan dict for one day."""
            tok   = self._tokenizer
            model = self._model
            prompt_text = tok.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            inputs      = tok(prompt_text, return_tensors="pt", truncation=True, max_length=1536).to("cuda")
            plen        = inputs["input_ids"].shape[1]

            with torch.no_grad():
                out_ids = model.generate(
                    **inputs,
                    max_new_tokens=650,
                    do_sample=False,
                    repetition_penalty=1.1,
                    eos_token_id=tok.eos_token_id,
                    pad_token_id=tok.eos_token_id,
                    stopping_criteria=StoppingCriteriaList([_JsonStop(tok, plen)]),
                )
            generated = tok.decode(out_ids[0][plen:], skip_special_tokens=True)

            raw = re.sub(r"^```(?:json)?\s*", "", generated.strip(), flags=re.MULTILINE)
            raw = re.sub(r"```\s*$",           "", raw.strip(),       flags=re.MULTILINE).strip()
            start = raw.find("{")
            if start == -1:
                raise ValueError("No JSON object in model output")

            try:
                return json.loads(raw[start:])
            except json.JSONDecodeError:
                depth, end = 0, -1
                for idx, ch in enumerate(raw[start:], start):
                    if ch == "{":
                        depth += 1
                    elif ch == "}":
                        depth -= 1
                        if depth == 0:
                            end = idx
                            break

                if end == -1:
                    fragment = raw[start:]
                    opens: list[str] = []
                    in_s = esc = False
                    for ch in fragment:
                        if esc:    esc = False; continue
                        if ch == "\\" and in_s: esc = True; continue
                        if ch == '"': in_s = not in_s; continue
                        if in_s:   continue
                        if ch in "{[": opens.append(ch)
                        elif ch in "}]" and opens: opens.pop()
                    closing = "".join("}" if o == "{" else "]" for o in reversed(opens))
                    try:
                        return json.loads(fragment + closing)
                    except json.JSONDecodeError:
                        try:
                            from json_repair import repair_json
                            result = repair_json(fragment, return_objects=True)
                            if isinstance(result, dict) and result:
                                return result
                            raise ValueError("json_repair returned empty")
                        except ImportError:
                            raise ValueError("Malformed / truncated JSON in model output")
                else:
                    return json.loads(raw[start:end + 1])

        # ── Core inference function ───────────────────────────────────────────
        def _run(req: NutritionRequest) -> tuple[dict, int]:
            w, h, age = req.weight_kg, req.height_cm, req.age
            bmr = (10*w + 6.25*h - 5*age + 5) if req.gender == "male" else (10*w + 6.25*h - 5*age - 161)
            if req.inbody and req.inbody.bmr_kcal:
                bmr = req.inbody.bmr_kcal
            daily_kcal = int(
                bmr
                * ACTIVITY_FACTORS.get(req.activity_level, 1.55)
                * GOAL_MULTIPLIERS.get(req.goal, 1.0)
            )

            prot, carb, fat = 25, 50, 25
            if req.inbody:
                ib = req.inbody
                if ib.body_fat_percentage and ib.body_fat_percentage > 30:
                    daily_kcal = int(daily_kcal * 0.80)
                    prot, carb, fat = 35, 45, 20
                if ib.muscle_mass_kg and ib.muscle_mass_kg < 25:
                    prot = max(prot, 35)
                    fat  = 20
                    carb = 100 - prot - fat

            dnotes = []
            for cond in req.health_conditions:
                rule = self._diseases.get(cond.lower(), {})
                dnotes += [f"Recommended for {cond}: {r}" for r in rule.get("recommended_foods", [])[:4]]
                dnotes += [f"MUST AVOID for {cond}: {a}"  for a in rule.get("foods_to_avoid",    [])[:8]]

            ib_sec = ""
            if req.inbody:
                ib = req.inbody
                ib_sec = (
                    f"InBody: fat {ib.body_fat_percentage}%, muscle {ib.muscle_mass_kg} kg, "
                    f"visceral {ib.visceral_fat_level}, BMR {ib.bmr_kcal} kcal. "
                )

            # ── Generate 3 days by calling the model once per day ─────────────
            all_days: list[dict] = []
            all_foods_to_avoid: list[str] = []
            used_dishes: list[str] = []

            for day_num in range(1, 4):
                sep = ", "
                variety_hint = (
                    f"Use completely different main dishes — avoid repeating: {sep.join(used_dishes[:8])}. "
                    if used_dishes else ""
                )

                cond_str    = ", ".join(req.health_conditions) or "none"
                allergy_str = ", ".join(req.allergies)         or "none"
                goal_str    = req.goal.replace("_", " ")

                user_msg = (
                    f"Create a 1-day halal nutrition plan for Day {day_num} "
                    f"for a {age}-year-old {req.gender}, "
                    f"weight {w} kg, height {h} cm. "
                    f"Goal: {goal_str}, activity: {req.activity_level}. "
                    f"Conditions: {cond_str}. "
                    f"Allergies: {allergy_str}. "
                    f"Cuisine: {req.cuisine_preference}. "
                    + ib_sec
                    + f"Calories: {daily_kcal} kcal. Macros: protein {prot}%, carbs {carb}%, fat {fat}%. "
                    + (" ".join(dnotes) + " " if dnotes else "")
                    + variety_hint
                    + "Return only valid JSON 1-day plan with breakfast, lunch, dinner, snack."
                )

                messages = [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": user_msg},
                ]

                day_plan = _infer_single_day(messages)

                # Extract day_data — model returns {"days": [{...}], ...}
                if isinstance(day_plan.get("days"), list) and day_plan["days"]:
                    day_data = day_plan["days"][0]
                else:
                    day_data = day_plan  # flat structure fallback

                day_data["day"] = day_num

                # Re-sum calories for this day
                meals = day_data.get("meals", {})
                actual = sum(
                    m.get("total_calories", m.get("estimated_calories", 0))
                    for m in (meals.values() if isinstance(meals, dict) else meals)
                )
                if actual > 0:
                    day_data["total_calories"] = actual

                all_days.append(day_data)

                # Collect dish names to encourage variety in subsequent days
                for meal_data in (meals.values() if isinstance(meals, dict) else []):
                    for item in meal_data.get("items", []):
                        name = item.get("name", "")
                        if name:
                            used_dishes.append(name)

                # Aggregate foods_to_avoid from model output
                known = {x.lower() for x in all_foods_to_avoid}
                for item in day_plan.get("foods_to_avoid", []):
                    if item.lower() not in known:
                        all_foods_to_avoid.append(item)
                        known.add(item.lower())

            # ── Build combined 3-day plan ───────────────────────────────────
            plan: dict = {"days": all_days, "foods_to_avoid": all_foods_to_avoid}

            # Append allergen / disease avoidance items
            avoid_set = {x.lower() for x in plan["foods_to_avoid"]}
            for allergy in req.allergies:
                for kw in ALLERGEN_KEYWORDS.get(allergy.lower(), [allergy]):
                    if kw.lower() not in avoid_set:
                        plan["foods_to_avoid"].append(kw)
                        avoid_set.add(kw.lower())
            for cond in req.health_conditions:
                for item in self._diseases.get(cond.lower(), {}).get("foods_to_avoid", []):
                    if item.lower() not in avoid_set:
                        plan["foods_to_avoid"].append(item)
                        avoid_set.add(item.lower())

            plan["_daily_calories"] = daily_kcal
            return plan, daily_kcal
        # ── Route handlers ────────────────────────────────────────────────────
        @web_app.get("/health")
        def health():
            return {"status": "ok", "model": ADAPTER_REPO, "gpu": "T4"}

        @web_app.post("/generate")
        def generate(req: NutritionRequest):
            t0 = time.time()
            try:
                plan, daily_kcal = _run(req)
                return {
                    "member_id":      req.member_id,
                    "generated_at":   datetime.utcnow().isoformat() + "Z",
                    "daily_calories": daily_kcal,
                    "plan":           plan,
                    "generation_ms":  int((time.time() - t0) * 1000),
                    "error":          None,
                }
            except Exception as exc:
                log.error("generate() error: %s", exc, exc_info=True)
                raise HTTPException(status_code=500, detail=str(exc))

        return web_app


# ── Local smoke-test (modal run deploy/modal_nutrition.py) ────────────────────
@app.local_entrypoint()
def smoke_test():
    """
    Prints the Modal endpoint URL.  Actual inference testing requires a
    deployed container; run `modal deploy` first then test with curl:

      curl -X POST https://...web.modal.run/generate \\
           -H "Content-Type: application/json" \\
           -d '{"gender":"male","age":28,"weight_kg":80,"height_cm":175,"goal":"muscle_gain"}'
    """
    print("Modal app 'intellifit-nutrition' defined.")
    print("Deploy with:  modal deploy deploy/modal_nutrition.py")
    print("Then test:    curl -X POST <endpoint>/generate -H 'Content-Type: application/json' -d '<json>'")
