# Workout Plan Generator - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- Python 3.10+ ([Download](https://www.python.org/downloads/))
- 10GB disk space
- 16GB RAM (or 6GB GPU VRAM for faster training)

### Step 1: Setup Environment (2 minutes)

**On Linux/Mac:**

```bash
chmod +x setup.sh
./setup.sh
```

**On Windows:**

```bash
setup.bat
```

This will:

- ✅ Create Python virtual environment
- ✅ Install PyTorch
- ✅ Install all dependencies
- ✅ Verify installation

### Step 2: Generate Training Data (1 minute)

```bash
python train.py --generate-data 5000
```

Output:

```
Generating 5000 synthetic training examples...
[████████████████████████████████████] 5000/5000
✅ Dataset saved: 5000 examples
```

This creates `training_data.jsonl` with 5,000 synthetic workout plans.

### Step 3: Train Model (30-180 minutes depending on hardware)

```bash
# CPU: ~3-4 hours
python train.py --epochs 5

# GPU (CUDA): ~30-60 minutes
# (automatically detected if available)
```

**What happens:**

1. Loads Flan-T5-Base model (248M parameters)
2. Applies LoRA adapter (only trains 0.5% of parameters)
3. Trains on 5,000 examples
4. Evaluates on test set
5. Saves model to `./models/workout-generator-v1`

### Step 4: Test Trained Model (1 minute)

```bash
python train.py --test-only --output ./models/workout-generator-v1
```

Output:

```
[Test 1/3]
Prompt: Generate a 4-day workout plan for intermediate lifter...
✅ Valid JSON generated
   Plan: 4-Day Muscle Hypertrophy Split
   Days: 4
   Total exercises: 22

[Test 2/3]
...
```

---

## 📊 Training Data Format

Training data is JSONL (one JSON object per line):

```json
{
  "input": "Generate a 4-day workout plan for intermediate lifter, goal is muscle gain, has dumbbells and barbell.",
  "output": "{\n  \"plan_name\": \"4-Day Upper/Lower Hypertrophy Split\",\n  \"days_per_week\": 4,\n  \"days\": [\n    {\n      \"day_number\": 1,\n      \"exercises\": [\n        {\n          \"exercise_id\": 123,\n          \"exercise_name\": \"Barbell Bench Press\",\n          \"sets\": 4,\n          \"reps\": \"8-10\",\n          \"rest_seconds\": 90\n        }\n      ]\n    }\n  ]\n}"
}
```

### Use Your Own Data

If you have real workout plans from your coaches:

```bash
# 1. Format as JSONL (see format above)
# 2. Save to training_data_custom.jsonl
# 3. Train:

python train.py --data training_data_custom.jsonl --epochs 5
```

---

## 🎛️ Advanced Training Options

### Control Training Parameters

```bash
python train.py \
  --data training_data.jsonl \
  --epochs 5 \
  --batch-size 8 \
  --learning-rate 1e-4 \
  --output ./models/custom-model \
  --no-wandb
```

**Options:**

- `--epochs` (default: 5): Training iterations over full dataset
- `--batch-size` (default: 4): Examples processed before update (4-8 recommended)
- `--learning-rate` (default: 2e-4): Model weight adjustment rate
- `--output` (default: ./models/workout-generator-v1): Save directory
- `--no-wandb`: Disable experiment tracking

### Monitor Training with Weights & Biases

Weights & Biases (W&B) tracks experiments automatically:

```bash
# Login (first time only)
wandb login

# Training automatically uploads metrics
python train.py --epochs 5

# View dashboard at https://wandb.ai/your-username/workout-generator
```

Dashboard shows:

- Loss curves (training & validation)
- Metric trends (JSON validity, latency)
- Learning rate schedule
- GPU utilization

---

## 📈 Training Stages Explained

### Stage 1: Loading (1-2 minutes)

```
Loading tokenizer from google/flan-t5-base...
Loading model from google/flan-t5-base...
✅ Model loaded. Parameters: 249,124,864
Setting up LoRA configuration...
trainable params: 1,245,184 || all params: 249,124,864 || trainable%: 0.50%
```

Why LoRA?

- Only trains 0.5% of parameters = faster & cheaper
- Full model is frozen
- Takes ~300MB disk instead of 900MB

### Stage 2: Preprocessing (5-10 minutes)

```
Loading dataset from training_data.jsonl...
Dataset loaded: 5000 examples
Preprocessing dataset...
Tokenizing [████████████████████████████████] 5000/5000
```

Converts text to numbers that model understands

### Stage 3: Training (depends on hardware)

```
Epoch 1/5:
[████████████████████████████████] 625/625 [01:23<00:00, 7.45 it/s]
Epoch 1 loss: 2.341

Epoch 2/5:
[████████████████████████████████] 625/625 [01:22<00:00, 7.61 it/s]
Epoch 2 loss: 1.893

...
```

Watch for:

- ✅ Loss decreasing = model learning
- ⚠️ Loss plateauing = learning rate may be too low
- ❌ Loss increasing = learning rate too high

### Stage 4: Evaluation (5 minutes)

```
Evaluating on test set...
eval_loss: 1.234
json_validity: 0.9723
valid_samples: 486
total_samples: 500
```

Metrics:

- **json_validity**: % of outputs that are valid JSON (target: >95%)
- **eval_loss**: Error on unseen data (lower is better)

### Stage 5: Model Saving (1 minute)

```
Saving model...
✅ LoRA adapter saved to ./models/workout-generator-v1/lora_adapter
Results saved to ./models/workout-generator-v1/eval_results.json
```

---

## 🧪 Testing the Model

### Quick Test

```bash
python train.py --test-only --output ./models/workout-generator-v1
```

### Test with Custom Prompts

Create `test_prompts.txt`:

```
Generate a 3-day beginner strength program with only dumbbells
Create a 5-day advanced muscle building split with full gym access
Build a 4-day weight loss plan with no equipment, 30 minutes per session
```

Test:

```python
from train import WorkoutGeneratorTester

tester = WorkoutGeneratorTester(
    "./models/workout-generator-v1",
    "./models/workout-generator-v1/lora_adapter"
)

prompts = [line.strip() for line in open("test_prompts.txt")]
tester.test_generation(prompts)
```

---

## 🐛 Troubleshooting

### Problem: "Module not found" errors

```
ModuleNotFoundError: No module named 'torch'
```

**Solution:**

```bash
# Reactivate venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate.bat  # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

### Problem: Out of memory (OOM)

```
RuntimeError: CUDA out of memory
```

**Solutions (in order):**

1. Reduce batch size: `--batch-size 2`
2. Enable gradient accumulation: `--gradient-accumulation-steps 16`
3. Use CPU: Remove GPU drivers
4. Use Google Colab (free GPU)

### Problem: Training too slow on CPU

```
Epoch 1/5: [████████████░░░░░░░░░░░░░░░░░░] ~2 hours remaining
```

**Solutions:**

1. Use GPU (CUDA) - 5-10x faster
2. Reduce training data: `--generate-data 1000`
3. Reduce epochs: `--epochs 2`
4. Use Google Colab (free GPU): See below

### Problem: Model generates invalid JSON

```
⚠️ Generated text is not valid JSON
   Output: {plan_name: 4-Day...
```

**This is normal at first!**

- After training: Should be 95%+ valid JSON
- If persists after training: Try more epochs or more training data

---

## ☁️ Free GPU Training (Google Colab)

No GPU? Use **Google Colab** (free, no setup needed):

1. Go to [colab.research.google.com](https://colab.research.google.com)
2. Create new notebook
3. Enable GPU: Runtime → Change Runtime Type → GPU
4. Upload `train.py` and paste this:

```python
# Mount Google Drive
from google.colab import drive
drive.mount('/content/drive')

# Install dependencies
!pip install -q torch transformers peft datasets accelerate

# Generate data
!python train.py --generate-data 5000

# Train (10-15 minutes on Colab GPU)
!python train.py --epochs 3 --batch-size 8
```

5. Download trained model from Files panel

---

## 📁 Project Structure After Training

```
ml_models/Workout-Plan_Generating/
├── train.py                        # This script
├── training_data.jsonl             # Generated/custom data
├── logs/                          # TensorBoard logs
└── models/
    └── workout-generator-v1/      # Trained model
        ├── config.json
        ├── pytorch_model.bin
        ├── tokenizer_config.json
        ├── special_tokens_map.json
        ├── tokenizer.json
        ├── eval_results.json
        └── lora_adapter/           # LoRA weights (important!)
            ├── adapter_config.json
            └── adapter_model.bin
```

**Important files:**

- `lora_adapter/`: LoRA weights (~50MB) - ALWAYS copy this!
- `eval_results.json`: Model quality metrics
- `config.json`: Model configuration

---

## 🚢 Deployment

Once trained, deploy to production:

### 1. Copy Model

```bash
# Copy to deployment directory
cp -r models/workout-generator-v1 ../../Graduation-Project/

# Verify structure
ls -la ../../Graduation-Project/workout-generator-v1/lora_adapter/
```

### 2. Register in Database

```sql
INSERT INTO "MLModelVersions" (
  "ModelName", "Version", "FilePath", "TrainingDate",
  "TrainingSamples", "ValidationMetrics", "IsActive", "DeployedBy"
) VALUES (
  'workout-generator',
  'v1.0.0',
  './models/workout-generator-v1',
  NOW(),
  5000,
  '{"json_validity": 0.97, "eval_loss": 1.23}'::jsonb,
  FALSE,
  'your@email.com'
);
```

### 3. Deploy as Canary

```bash
# Run deployment script (from CRITICAL_GAPS_ANALYSIS.md)
psql -U postgres -d intellifit -f deploy_canary.sql

# Monitor metrics
# - Error rate: < 5%
# - Latency P95: < 2s
# - User rating: >= 4.0
```

### 4. Promote to Stable

After 24 hours with good metrics:

```bash
# Increase traffic: 5% → 25%
psql -U postgres -d intellifit -c \
  "UPDATE \"MLModelVersions\" SET \"TrafficPercentage\" = 25 WHERE \"Version\" = 'v1.0.0';"
```

---

## 📊 Expected Results

### After 5 Epochs Training:

```
Training Metrics:
- Final train loss: ~0.8-1.2
- Final eval loss: ~1.1-1.5
- JSON validity: 95-98%
- Generation time: <2 seconds

Quality Examples:
✅ "Generate 4-day muscle plan"
   → Outputs valid JSON with 22 exercises, proper periodization

✅ "Beginner bodyweight only"
   → All exercises are bodyweight, ~30 mins/day

✅ "Avoid shoulder, full gym"
   → Zero shoulder exercises, uses all equipment
```

### After 10 Epochs Training (Optional):

```
- JSON validity: 97-99%
- Generation quality: Noticeably better
- Training time: ~8-12 hours on CPU, ~1-2 hours on GPU
- Trade-off: Diminishing returns, not usually worth it
```

---

## 📚 Next Steps

1. **Review training results**: Check `eval_results.json`
2. **Test generation**: Run `--test-only` mode
3. **Deploy canary**: Use SQL script from CRITICAL_GAPS_ANALYSIS.md
4. **Monitor production**: Check Prometheus/Grafana dashboards
5. **Collect feedback**: Gather user ratings (see IMPLEMENTATION_SPEC.md Section 8.5)
6. **Plan retrain**: After 30 days or 500+ new feedbacks

---

## 🆘 Need Help?

**Documentation:**

- [Flan-T5 Paper](https://arxiv.org/abs/2210.11416)
- [LoRA Paper](https://arxiv.org/abs/2106.09685)
- [Hugging Face Transformers](https://huggingface.co/docs/transformers/)
- [PEFT (LoRA) Guide](https://huggingface.co/docs/peft/)

**Issues?**

- Check logs: `tail -f logs/`
- Enable debug: Add `logging.basicConfig(level=logging.DEBUG)`
- Search error on Stack Overflow

**Questions?**

- See IMPLEMENTATION_SPEC.md for detailed explanations
- Check CRITICAL_GAPS_ANALYSIS.md for infrastructure details

---

**Happy training! 🏋️‍♂️**
