# ============================================================================
# Workout AI — Hugging Face Space (CPU, Free Tier)
# ============================================================================
# This directory contains everything needed for a HF Space deployment.
# The Flan-T5-Small model (~77M params) runs perfectly on free CPU.
#
# Deployment:
#   1. Create a new HF Space (Docker SDK, CPU hardware)
#   2. Upload these files to the Space repo
#   3. Set HF_TOKEN as a Space Secret
#   4. The Space will build and start automatically
# ============================================================================

# ── Base Image ──
FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends git curl && \
    rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py .

# Pre-download the base model at build time (cached in Docker layer)
RUN python -c "\
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM; \
AutoModelForSeq2SeqLM.from_pretrained('google/flan-t5-small'); \
AutoTokenizer.from_pretrained('google/flan-t5-small'); \
print('Base model cached successfully.')"

# HF Spaces expects port 7860
EXPOSE 7860

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
