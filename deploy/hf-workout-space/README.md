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

Flan-T5-Small + LoRA adapter generating personalized workout plans.

## API Usage (called by the .NET backend)

```
POST https://youssefeemad-workout-generator.hf.space/api/predict
Content-Type: application/json

{"data": ["{\"userId\":1,\"fitnessLevel\":\"Beginner\",\"goal\":\"Muscle\",\"daysPerWeek\":4,\"equipment\":[],\"injuries\":[]}"]}
```

Response:
```json
{"data": ["{\"plan\":{...},\"isValidJson\":true,\"modelVersion\":\"v3.0.0\"}"]}
```

## Space Secrets Required

| Secret | Value |
|--------|-------|
| `HF_TOKEN` | Your HF access token |
| `MODEL_REPO` | `youssefeemad/intellifit-workout-v3` |
