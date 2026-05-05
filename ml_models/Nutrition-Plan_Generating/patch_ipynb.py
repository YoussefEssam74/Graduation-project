import json, glob

path = r'd:\Youssef\Projects\_Graduation Project\Project Repo\Graduation-project\ml_models\Nutrition-Plan_Generating\train_nutrition_kaggle.ipynb'
with open(path, 'r', encoding='utf-8') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        # Fix bitsandbytes
        for i, line in enumerate(cell['source']):
            if "pip('bitsandbytes==0.45.0')" in line:
                cell['source'][i] = line.replace("pip('bitsandbytes==0.45.0')", "pip('-U', 'bitsandbytes')")

        # Fix glob logic
        source_code = "".join(cell['source'])
        if "DATASET_INPUT  = f'/kaggle/input/{DATASET_SLUG}'" in source_code:
            cell['source'] = [
                "# ── Cell 3: Configuration ────────────────────────────────────────────────────\n",
                "import os, glob\n",
                "\n",
                "# ─── Training dataset ────────────────────────────────────────────────────────\n",
                "print(\"Looking for dataset files in /kaggle/input...\")\n",
                "train_files = glob.glob('/kaggle/input/**/nutrition_sft_train.csv', recursive=True)\n",
                "eval_files  = glob.glob('/kaggle/input/**/nutrition_sft_eval.csv', recursive=True)\n",
                "\n",
                "if not train_files or not eval_files:\n",
                "    raise FileNotFoundError(\n",
                "        \"Dataset files not found anywhere in /kaggle/input/. \"\n",
                "        \"Did you attach 'intellifit-nutrition-sft' to the notebook?\"\n",
                "    )\n",
                "\n",
                "TRAIN_FILE = train_files[0]\n",
                "EVAL_FILE  = eval_files[0]\n",
                "\n",
                "# ─── Model & output ──────────────────────────────────────────────────────────\n",
                "MODEL_ID       = 'Qwen/Qwen2.5-3B-Instruct'\n",
                "OUTPUT_DIR     = '/kaggle/working/qwen2.5-3b-nutrition-v1'\n",
                "HUB_MODEL_ID   = 'youssefeemad/qwen2.5-3b-intellifit-nutrition'  \n",
                "\n",
                "# ─── Resume config ───────────────────────────────────────────────────────────\n",
                "HF_RESUME_REPO         = HUB_MODEL_ID   \n",
                "RESUME_CHECKPOINT_SLUG = ''             \n",
                "\n",
                "os.makedirs(OUTPUT_DIR, exist_ok=True)\n",
                "\n",
                "print(f'Train : {TRAIN_FILE}')\n",
                "print(f'Eval  : {EVAL_FILE}')\n",
                "print(f'Output: {OUTPUT_DIR}')\n"
            ]

with open(path, 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)
