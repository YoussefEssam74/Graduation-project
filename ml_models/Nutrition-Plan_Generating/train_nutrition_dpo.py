"""
train_nutrition_dpo.py
======================
Phase 2: Direct Preference Optimisation (DPO) fine-tuning on top of the SFT
adapter produced by train_nutrition_v1.py.

HOW COACH REVIEWS BECOME TRAINING SIGNAL
-----------------------------------------
1. Deploy serve_nutrition.py and collect real requests.
2. For each request, the API generates one plan (Plan A).
   Generate a second plan for the same input (Plan B) — vary temperature.
3. A coach (or the system) marks one as "preferred" and one as "rejected".
4. Store pairs as JSONL rows:
   {
     "prompt":   "<user request text>",
     "chosen":   "<plan JSON that the coach preferred>",
     "rejected": "<plan JSON that the coach rejected>"
   }
5. Run this script every N days to update the adapter.

WHY DPO (not PPO/RLHF)
-----------------------
- DPO eliminates the separate reward-model training step.
- Needs ~500-2 000 preference pairs to produce measurable improvement.
- Uses the same SFT adapter as the reference model internally.
- Compatible with QLoRA — stays within 6 GB VRAM.
- trl.DPOTrainer is drop-in: same interface as SFTTrainer.

DATASET FORMAT
--------------
File: ml_models/Nutrition-Plan_Generating/nutrition_dpo_pairs.jsonl
Each line:
{
  "prompt":   "Create a 3-day halal plan for ... [full user message]",
  "chosen":   "{\"days\": [...]}",   <- the plan the coach preferred
  "rejected": "{\"days\": [...]}"    <- the plan the coach rejected
}

Minimum viable dataset: ~300 pairs.
Target for good results:   1 000+ pairs.
"""

import os
import torch
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, TaskType, PeftModel
from trl import DPOTrainer, DPOConfig

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE = os.path.dirname(__file__)
SFT_ADAPTER = os.path.join(
    BASE, "output", "qwen2.5-3b-nutrition-v1")  # Phase 1 output
DPO_FILE   = os.path.join(BASE, "nutrition_dpo_pairs.jsonl")
OUTPUT_DIR = os.path.join(BASE, "output", "qwen2.5-3b-nutrition-v2-dpo")
MERGED_DIR = os.path.join(BASE, "output", "qwen2.5-3b-nutrition-v1-merged")  # SFT baked into base
FINAL_DIR  = os.path.join(BASE, "output", "qwen2.5-3b-nutrition-final")      # SFT+DPO production model
MODEL_ID   = "Qwen/Qwen2.5-3B-Instruct"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(MERGED_DIR, exist_ok=True)
os.makedirs(FINAL_DIR,  exist_ok=True)

# Validate input
if not os.path.exists(SFT_ADAPTER):
    raise FileNotFoundError(
        f"SFT adapter not found at {SFT_ADAPTER}\n"
        "Run train_nutrition_v1.py first to produce the Phase 1 adapter."
    )
if not os.path.exists(DPO_FILE):
    raise FileNotFoundError(
        f"DPO pairs file not found: {DPO_FILE}\n"
        "Collect coach preference pairs and save them to this file.\n"
        "Format: {\"prompt\": \"...\", \"chosen\": \"...\", \"rejected\": \"...\"}"
    )

# ── Quantisation ──────────────────────────────────────────────────────────────
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)

# ── Merge SFT LoRA into base weights first (required for correct DPO reference) ──
# Root cause of the bug: passing PeftModel(base, SFT_adapter) with ref_model=None
# makes TRL compute reference log-probs by *disabling all LoRA adapters* — which
# returns the raw untrained Qwen base, not the SFT-trained model.  The KL penalty
# then pushes the model AWAY from SFT outputs back toward the base distribution.
# Fix: merge Phase 1 into a plain nn.Module; ref_model=None is then safe because
# TRL deep-copies the already-merged SFT weights as the frozen reference.

print("[1/6] Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(
    SFT_ADAPTER,                # tokenizer was saved alongside the adapter
    trust_remote_code=True,
    padding_side="left",        # DPO needs left-padding
)
tokenizer.pad_token = tokenizer.eos_token

print("[2/6] Loading base model in fp16 for SFT merge (no quantisation)...")
merge_base = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    torch_dtype=torch.float16,
    device_map="cpu",           # CPU merge keeps GPU VRAM free for DPO training
    trust_remote_code=True,
)

print("[3/6] Applying SFT adapter and merging into base weights...")
sft_model = PeftModel.from_pretrained(merge_base, SFT_ADAPTER)
merged = sft_model.merge_and_unload()   # bakes LoRA Δ permanently into base weights
merged.save_pretrained(MERGED_DIR)
tokenizer.save_pretrained(MERGED_DIR)
print(f"  Merged SFT model saved → {MERGED_DIR}")
del merge_base, sft_model, merged
torch.cuda.empty_cache()

print("[4/6] Reloading merged model in 4-bit for DPO training...")
model = AutoModelForCausalLM.from_pretrained(
    MERGED_DIR,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
    torch_dtype=torch.float16,
)
model.config.use_cache = False

# ── LoRA config for DPO layer ─────────────────────────────────────────────────
# We add a NEW LoRA adapter on top of the SFT one (PEFT stacking).
# This keeps the SFT weights frozen and only trains the DPO delta.
dpo_lora = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    # smaller rank for DPO delta (preference signal is subtle)
    r=32,
    lora_alpha=64,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                    "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
)

# ── Load DPO preference pairs ─────────────────────────────────────────────────
print("[5/6] Loading DPO preference pairs...")
dpo_dataset = load_dataset("json", data_files=DPO_FILE, split="train")
print(f"  Pairs loaded: {len(dpo_dataset):,}")

# Split 90/10 for train/eval
split = dpo_dataset.train_test_split(test_size=0.1, seed=42)
train_dpo = split["train"]
eval_dpo = split["test"]
print(f"  Train: {len(train_dpo):,}  |  Eval: {len(eval_dpo):,}")

# ── DPO training config ───────────────────────────────────────────────────────
dpo_config = DPOConfig(
    output_dir=OUTPUT_DIR,
    num_train_epochs=1,             # DPO overfits quickly — 1 epoch is usually enough
    per_device_train_batch_size=1,
    per_device_eval_batch_size=1,
    gradient_accumulation_steps=8,  # effective batch = 8
    evaluation_strategy="steps",
    eval_steps=50,
    save_strategy="steps",
    save_steps=50,
    save_total_limit=2,
    load_best_model_at_end=True,
    learning_rate=5e-5,             # DPO needs lower LR than SFT
    lr_scheduler_type="cosine",
    warmup_ratio=0.05,
    fp16=True,
    bf16=False,
    logging_steps=10,
    report_to="none",
    optim="paged_adamw_8bit",
    max_grad_norm=0.3,
    dataloader_num_workers=0,       # Windows safe
    # DPO-specific
    beta=0.1,                       # KL penalty — higher = stay closer to reference
    max_length=2048,
    max_prompt_length=512,
    remove_unused_columns=False,
)

# ── Train ─────────────────────────────────────────────────────────────────────
print("[6/6] Starting DPO training...")
dpo_trainer = DPOTrainer(
    model=model,
    ref_model=None,             # Safe: model is now a plain merged AutoModelForCausalLM,
                                # not a PeftModel.  TRL deep-copies the merged SFT weights
                                # as the frozen reference — KL correctly penalises deviation
                                # from SFT, not from the raw base model.
    args=dpo_config,
    train_dataset=train_dpo,
    eval_dataset=eval_dpo,
    processing_class=tokenizer,  # TRL ≥ 0.13: renamed from tokenizer
    peft_config=dpo_lora,
)

dpo_trainer.train()
dpo_trainer.save_model(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

print(f"\n✅  DPO adapter saved → {OUTPUT_DIR}")

# ── Post-training: bake DPO LoRA into merged SFT → single production model ──
# serve_nutrition.py loads this directory directly; no adapter stacking required.
print("\n[Post-training] Merging DPO adapter into production model...")
del model                       # free GPU VRAM before CPU merge
torch.cuda.empty_cache()

merge_base2 = AutoModelForCausalLM.from_pretrained(
    MERGED_DIR,                 # SFT-merged base from Phase 1
    torch_dtype=torch.float16,
    device_map="cpu",
    trust_remote_code=True,
)
final_model = PeftModel.from_pretrained(merge_base2, OUTPUT_DIR)
final_model = final_model.merge_and_unload()
final_model.save_pretrained(FINAL_DIR)
tokenizer.save_pretrained(FINAL_DIR)
del merge_base2, final_model

print(f"✅  Production model (SFT + DPO fully merged) → {FINAL_DIR}")
print("\nserve_nutrition.py will auto-detect and load this model on next startup.")
