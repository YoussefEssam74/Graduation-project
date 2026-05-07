---
title: IntelliFit Workout AI
emoji: 🏋️
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# IntelliFit Workout Plan Generator

FastAPI service running Flan-T5-Small + LoRA for personalized workout plan generation.

## API Endpoints

- `POST /predict` — Generate a workout plan
- `GET /health` — Health check
- `GET /` — Status

## Environment Variables

Set these as **Space Secrets**:

| Variable | Description |
|----------|-------------|
| `HF_TOKEN` | Hugging Face access token (for private model repo) |
| `MODEL_REPO` | HF repo ID for LoRA adapter |
