# AI Models Plan - IntelliFit

We have established a suite of 5 Specialized AI Models to power the platform completely locally.

## 1. Workout & Nutrition Generation
- **Model:** `coach-server` (Llama 3.2 3B)
- **Strategy:** **Fine-Tuning + RAG**
- **How it works:**
    - Uses RAG (Vector Search) to find relevant exercises and meals from your database.
    - Uses Fine-Tuned Llama 3 to structure them into a cohesive plan.
- **Why:** Llama 3 is smart enough to structure plans, and RAG ensures it only uses *your* available equipment/foods.

## 2. AI Coach Assistant (Chat)
- **Model:** `coach-server` (Llama 3.2 3B)
- **Strategy:** **System Prompt Engineering**
- **How it works:**
    - Uses the same Llama 3 model but with a "Persona" prompt.
    - Has access to User Profile (Goals, Injuries).
    - Can "call tools" (e.g., `schedule_appointment`, `check_availability`).
- **Why:** One smart model can handle both "Planning" and "Chatting" efficiently.

## 3. System Analytics (Revenue & Maintenance)
- **Model:** `analytics-server` (Scikit-Learn / Random Forest)
- **Strategy:** **Traditional ML (Regression/Classification)**
- **How it works:**
    - **Maintenance:** Predicts probabilistic failure based on usage hours (Time-Series).
    - **Revenue:** Analyzes historical booking data to identify low-traffic months and suggests offers.
- **Why:** Deep Learning (Llama) is overkill for math/stats. Scikit-Learn is faster and more accurate for numerical trends.

## 4. Voice Call Capability (Advanced)
- **Models:** `whisper-server` (STT) + `tts-server` (Piper)
- **Strategy:** **Real-time Pipeline**
- **How it works:** User Audio -> Whisper -> Text -> Llama 3 -> Text -> Piper -> Audio Output.

## Cost & Training Strategy
- **All models are 100% FREE** (Open Source).
- **Training:**
    - Llama 3: Fine-tune on a small dataset of "Coach-Client" dialogues (JSONL format) if the base model isn't "gym-smart" enough.
    - Scikit-Learn: Retrain daily/weekly on your actual DB data (MaintenanceLogs, Bookings).

## Implementation Status
- [x] Docker Containers defined (`docker-compose.yml`)
- [x] Python Code written (`ml_models/`)
- [x] Microservices created (Coach, Whisper, TTS, Analytics)
- [ ] Model Weights downloaded (happens on first run)

**Ready to start implementation.**
