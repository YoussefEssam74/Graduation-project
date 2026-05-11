"""
train_nutrition_v1.py
---------------------
QLoRA fine-tuning of Qwen/Qwen2.5-3B-Instruct for nutrition plan generation.
Tuned for RTX 4050 6 GB VRAM.

Config:
  Model   : Qwen/Qwen2.5-3B-Instruct
  Quant   : 4-bit NF4 (BitsAndBytes)
  LoRA    : r=16, alpha=32, dropout=0.1
  Modules : q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, down_proj
  Epochs  : 3
  Batch   : 2 (per device) × grad_acc=8 → effective batch 16
  LR      : 2e-4, cosine decay, 3% warmup
  Seq len : 2048
  Precision: fp16

Requirements (install once):
    pip install transformers==4.47 trl==0.12 peft==0.13 bitsandbytes==0.45
                accelerate datasets torch torchvision --extra-index-url https://download.pytorch.org/whl/cu124

Run:
    python train_nutrition_v1.py
"""

import os
import json
import torch
from datasets import load_dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
)
from peft import LoraConfig, TaskType
from trl import SFTTrainer, SFTConfig, DataCollatorForCompletionOnlyLM

# ── Paths ───────────────────────────────────────────────────────────────────
BASE = os.path.dirname(__file__)
TRAIN_FILE = os.path.join(BASE, "nutrition_sft_train.csv")
EVAL_FILE = os.path.join(BASE, "nutrition_sft_eval.csv")
MODEL_ID = "Qwen/Qwen2.5-3B-Instruct"
OUTPUT_DIR = os.path.join(BASE, "output", "qwen2.5-3b-nutrition-v1")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# ── Quantisation — 4-bit NF4 ────────────────────────────────────────────────
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
)

# ── Load tokenizer ───────────────────────────────────────────────────────────
print(f"[1/5] Loading tokenizer from {MODEL_ID}...")
tokenizer = AutoTokenizer.from_pretrained(
    MODEL_ID,
    trust_remote_code=True,
    padding_side="right",
)
tokenizer.pad_token = tokenizer.eos_token

# Build collator that computes loss only on assistant tokens.
# Using token IDs (not the raw string) avoids the tokenisation-mismatch bug
# that occurs when the template is re-tokenised in isolation vs in context.
response_template_ids = tokenizer.encode(
    "<|im_start|>assistant\n", add_special_tokens=False)
collator = DataCollatorForCompletionOnlyLM(
    response_template_ids, tokenizer=tokenizer)

# ── Load model in 4-bit ──────────────────────────────────────────────────────
print(f"[2/5] Loading model in 4-bit NF4...")
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    quantization_config=bnb_config,
    device_map="auto",
    trust_remote_code=True,
    torch_dtype=torch.float16,
)
model.config.use_cache = False
model.config.pretraining_tp = 1

# ── LoRA config ──────────────────────────────────────────────────────────────
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=16,               # r=16 fits 6 GB VRAM; r=64 causes OOM on RTX 4050
    lora_alpha=32,      # alpha = 2×r is the recommended starting ratio
    target_modules=[
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ],
    lora_dropout=0.1,   # 0.1 improves generalisation over the default 0.05 for Qwen 2.5 3B
    bias="none",
)

# ── Dataset ──────────────────────────────────────────────────────────────────
print("[3/5] Loading datasets...")
data_files = {"train": TRAIN_FILE, "eval": EVAL_FILE}
raw_dataset = load_dataset("csv", data_files=data_files)
print(
    f"  Train: {len(raw_dataset['train']):,}  |  Eval: {len(raw_dataset['eval']):,}")

SYSTEM_PROMPT = (
    "You are IntelliFit Nutrition Coach — an expert Egyptian sports nutritionist. "
    "You create personalised 3-day halal nutrition plans (valid JSON, no markdown). "
    "Each plan has 3 unique days, each with breakfast, lunch, dinner, and one snack. "
    "Plans respect the user's health conditions, allergies, fitness goal, and InBody data. "
    "Output ONLY valid JSON in the exact schema requested. "
    "Use Egyptian food names whenever possible. All food is halal."
)


def format_messages(example):
    """
    Parse full messages from the JSON-encoded 'messages' column and apply
    Qwen2.5's chat template.  The CSV now stores the complete system/user/
    assistant structure so no system prompt needs to be hardcoded here.
    """
    messages = json.loads(example["messages"])
    return {"text": tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=False,
    )}


print("[4/5] Tokenising with chat template...")
train_ds = raw_dataset["train"].map(format_messages, num_proc=1)
eval_ds = raw_dataset["eval"].map(format_messages, num_proc=1)
# Remove the raw prompt/response columns from the training set — the 'text'
# column is all SFTTrainer needs; keeping them wastes memory every batch.
train_ds = train_ds.remove_columns(["messages"])
eval_ds = eval_ds.remove_columns(["messages"])

# ── Training arguments ───────────────────────────────────────────────────────
# For TRL ≥ 0.12 we use SFTConfig which inherits TrainingArguments
sft_config = SFTConfig(
    output_dir=OUTPUT_DIR,
    num_train_epochs=3,
    per_device_train_batch_size=2,
    per_device_eval_batch_size=2,
    gradient_accumulation_steps=8,          # effective batch = 16
    evaluation_strategy="steps",
    eval_steps=200,
    save_strategy="steps",
    save_steps=200,
    save_total_limit=3,
    load_best_model_at_end=True,
    learning_rate=2e-4,
    lr_scheduler_type="cosine",
    warmup_ratio=0.03,
    fp16=True,
    bf16=False,
    gradient_checkpointing=True,            # saves ~30% VRAM at cost of ~20% speed
    logging_dir=os.path.join(OUTPUT_DIR, "logs"),
    logging_steps=25,
    report_to="none",                       # set to "wandb" if tracking
    optim="paged_adamw_8bit",               # memory-efficient optimiser
    max_grad_norm=0.3,
    dataloader_num_workers=0,               # Windows safe
    group_by_length=True,                   # pad-efficient batching
    # SFT-specific
    # full 3-day plan needs up to 2048 tokens; Kaggle has VRAM
    max_seq_length=2048,
    dataset_text_field="text",
    packing=False,                          # packing can OOM on 6 GB
)

# ── Trainer ──────────────────────────────────────────────────────────────────
print("[5/5] Starting SFT training...")
trainer = SFTTrainer(
    model=model,
    train_dataset=train_ds,
    eval_dataset=eval_ds,
    peft_config=lora_config,
    args=sft_config,
    tokenizer=tokenizer,
    data_collator=collator,   # compute loss on assistant tokens only
)

# Auto-resume from the latest checkpoint if one already exists in OUTPUT_DIR
_ckpt_dirs = [
    d for d in os.listdir(OUTPUT_DIR) if d.startswith("checkpoint-")
] if os.path.isdir(OUTPUT_DIR) else []
RESUME_FROM = os.path.join(OUTPUT_DIR, sorted(
    _ckpt_dirs, key=lambda d: int(d.split("-")[-1]))[-1]) if _ckpt_dirs else None
if RESUME_FROM:
    print(f"  Resuming from checkpoint: {RESUME_FROM}")

trainer.train(resume_from_checkpoint=RESUME_FROM)
trainer.save_model(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)
print(f"\n✅  Training complete. Adapter saved → {OUTPUT_DIR}")

# ── Enhanced eval — calorie MAE + JSON validity + structural checks ───────────
print("\n[Eval] Running enhanced evaluation on eval set...")
model.eval()
cal_errors = []
json_valid = json_invalid = correct_days = correct_meals = total_checked = 0

eval_sample = eval_ds.select(range(min(100, len(eval_ds))))

for item in eval_sample:
    # Parse full messages from JSON column
    try:
        msgs = json.loads(item.get("messages", "[]"))
    except Exception:
        continue
    user_prompt = next((m["content"] for m in msgs if m["role"] == "user"), "")
    expected_response = next((m["content"]
                             for m in msgs if m["role"] == "assistant"), "")
    if not user_prompt or not expected_response:
        continue

    # Skip non-JSON rows (smolmeal / allergen SFT plain-text answers)
    if not expected_response.strip().startswith("{"):
        continue

    try:
        expected_plan = json.loads(expected_response)
        expected_kcal = expected_plan["days"][0]["total_calories"]
    except Exception:
        continue

    total_checked += 1

    # Build inference prompt (system + user only, no assistant)
    inf_msgs = [m for m in msgs if m["role"] != "assistant"]
    prompt_text = tokenizer.apply_chat_template(
        inf_msgs, tokenize=False, add_generation_prompt=True,
    )
    inputs = tokenizer(prompt_text, return_tensors="pt",
                       truncation=True, max_length=768).to(model.device)
    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=1024,
            temperature=0.1,
            do_sample=False,
            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.eos_token_id,
        )
    generated = tokenizer.decode(
        output[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True
    ).strip()

    # 1. JSON validity
    try:
        pred_plan = json.loads(generated)
        json_valid += 1
    except Exception:
        json_invalid += 1
        continue

    # 2. Calorie MAE
    try:
        predicted_kcal = pred_plan["days"][0]["total_calories"]
        cal_errors.append(
            abs(predicted_kcal - expected_kcal) / max(expected_kcal, 1) * 100
        )
    except (KeyError, IndexError):
        pass

    # 3. Structural correctness
    days = pred_plan.get("days", [])
    if len(days) >= 3:
        correct_days += 1
    if days and "meals" in days[0] and len(days[0]["meals"]) >= 4:
        correct_meals += 1

if total_checked > 0:
    print(f"\n  Evaluated on {total_checked} JSON samples:")
    print(f"  JSON parse success : {json_valid}/{total_checked} "
          f"({json_valid / total_checked * 100:.1f}%)")
    print(f"  Correct day count  : {correct_days}/{total_checked} "
          f"({correct_days / total_checked * 100:.1f}%)")
    print(f"  Correct meal count : {correct_meals}/{total_checked} "
          f"({correct_meals / total_checked * 100:.1f}%)")
    if cal_errors:
        mae = sum(cal_errors) / len(cal_errors)
        print(f"  Calorie MAE        : {mae:.2f}%  (target: < 5%)")
    else:
        print("  Calorie MAE: N/A — no parseable calorie predictions")
else:
    print("  No JSON-producing samples in eval batch — check dataset split.")
