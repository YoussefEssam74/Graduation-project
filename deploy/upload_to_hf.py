"""
IntelliFit — Upload models & Space files to Hugging Face Hub
Run: python deploy/upload_to_hf.py --token YOUR_HF_TOKEN
"""
import argparse, os, sys
from pathlib import Path
from huggingface_hub import HfApi, login

# ── Config ────────────────────────────────────────────────────────────────────
HF_USER            = "youssefeemad"
WORKOUT_MODEL_REPO = f"{HF_USER}/intellifit-workout-v3"
NUTRITION_REPO     = f"{HF_USER}/intellifit-nutrition-v1"
WORKOUT_SPACE      = f"{HF_USER}/workout-generator"
NUTRITION_SPACE    = f"{HF_USER}/nutrition-generator"

ROOT = Path(__file__).parent.parent  # repo root

WORKOUT_MODEL_DIR  = ROOT / "ml_models/Workout-Plan_Generating/models/workout-generator-v3"
NUTRITION_CKPT_DIR = ROOT / "ml_models/Nutrition-Plan_Generating/checkpoint_to_resume (1)/checkpoint-2412"

WORKOUT_SPACE_DIR  = ROOT / "deploy/hf-workout-space"
NUTRITION_SPACE_DIR= ROOT / "deploy/hf-nutrition-space"

def ensure_repo(api: HfApi, repo_id: str, repo_type: str):
    try:
        api.repo_info(repo_id=repo_id, repo_type=repo_type)
        print(f"  ✓ {repo_type} repo '{repo_id}' already exists")
    except Exception:
        print(f"  → Creating {repo_type} repo '{repo_id}'…")
        api.create_repo(repo_id=repo_id, repo_type=repo_type, private=False, exist_ok=True)
        print(f"  ✓ Created '{repo_id}'")

def upload_folder(api: HfApi, folder: Path, repo_id: str, repo_type: str, label: str):
    print(f"\n[{label}] Uploading {folder} → {repo_id}")
    if not folder.exists():
        print(f"  ✗ Source folder not found: {folder}")
        sys.exit(1)
    api.upload_folder(
        folder_path=str(folder),
        repo_id=repo_id,
        repo_type=repo_type,
        commit_message=f"Upload {label}",
    )
    print(f"  ✓ Done — https://huggingface.co/{repo_type}s/{repo_id}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--token", required=True, help="Hugging Face write token")
    parser.add_argument("--skip-models", action="store_true", help="Skip model weight upload")
    parser.add_argument("--skip-spaces", action="store_true", help="Skip Space file upload")
    args = parser.parse_args()

    login(token=args.token)
    api = HfApi(token=args.token)
    print(f"\nLogged in as: {api.whoami()['name']}\n")

    # ── Ensure all repos exist ────────────────────────────────────────────────
    print("── Ensuring repos exist ──")
    ensure_repo(api, WORKOUT_MODEL_REPO, "model")
    ensure_repo(api, NUTRITION_REPO, "model")
    ensure_repo(api, WORKOUT_SPACE, "space")
    ensure_repo(api, NUTRITION_SPACE, "space")

    # ── Upload model weights ──────────────────────────────────────────────────
    if not args.skip_models:
        upload_folder(api, WORKOUT_MODEL_DIR,  WORKOUT_MODEL_REPO, "model", "Workout LoRA adapter")
        upload_folder(api, NUTRITION_CKPT_DIR, NUTRITION_REPO,     "model", "Nutrition QLoRA checkpoint")
    else:
        print("\n[Skipping model uploads]")

    # ── Upload Space files ─────────────────────────────────────────────────────
    if not args.skip_spaces:
        upload_folder(api, WORKOUT_SPACE_DIR,   WORKOUT_SPACE,   "space", "Workout Space files")
        upload_folder(api, NUTRITION_SPACE_DIR, NUTRITION_SPACE, "space", "Nutrition Space files")
    else:
        print("\n[Skipping Space file uploads]")

    print("\n" + "="*60)
    print("ALL UPLOADS COMPLETE!")
    print("="*60)
    print(f"  Workout Space:   https://huggingface.co/spaces/{WORKOUT_SPACE}")
    print(f"  Nutrition Space: https://huggingface.co/spaces/{NUTRITION_SPACE}")
    print()
    print("Next steps:")
    print("  1. Set Space Secrets (HF_TOKEN, MODEL_REPO, ADAPTER_REPO) in each Space's Settings")
    print(f"     Workout  → MODEL_REPO = {WORKOUT_MODEL_REPO}")
    print(f"     Nutrition→ ADAPTER_REPO = {NUTRITION_REPO}")
    print("  2. Both Spaces will rebuild automatically")
    print("  3. Copy the Space URLs to Render env vars")

if __name__ == "__main__":
    main()
