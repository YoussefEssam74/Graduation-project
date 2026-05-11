---
title: IntelliFit Nutrition AI
emoji: 🥗
colorFrom: green
colorTo: yellow
sdk: gradio
sdk_version: "4.44.0"
app_file: app.py
pinned: false
python_version: "3.10"
---

# IntelliFit Nutrition Plan Generator

Qwen2.5-3B-Instruct + QLoRA for personalized 3-day halal nutrition plans.

Uses **ZeroGPU** for free GPU inference.

## API Endpoints (Gradio API)

- `POST /api/generate` — Generate a nutrition plan
- `POST /api/health` — Health check

## Request Format

```json
{
  "data": ["{\"gender\":\"male\",\"age\":25,\"weight_kg\":80,\"height_cm\":175,\"goal\":\"muscle_gain\"}"]
}
```

## Environment Variables

Set these as **Space Secrets**:

| Variable | Description |
|----------|-------------|
| `HF_TOKEN` | Hugging Face access token |
| `ADAPTER_REPO` | HF repo ID for QLoRA adapter |
| `DATA_REPO` | HF dataset repo for JSON data files |
