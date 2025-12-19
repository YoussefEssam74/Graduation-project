# ML Configuration Recommendations (100% Free & Open-Source)

## Summary
This document lists recommended free/open-source models and configurations for all 5 ML features in the PulseGym AI project.

---

## 1. Workout Plan Generator

### Recommended Approach: RAG (Retrieval-Augmented Generation)

**Components:**
- **Dataset**: Use existing CSV (`Documentation/ML/Dataset/Workout Dataset/Dataset_Workout_plans.csv`)
- **Embeddings**: `sentence-transformers/all-mpnet-base-v2` (768-dim, Apache 2.0)
  - Alternative: `all-MiniLM-L6-v2` (384-dim, faster, less accurate)
- **Vector Store**: FAISS (Facebook AI Similarity Search) - MIT License
  - Index type: `IndexFlatL2` for datasets < 100K vectors
  - Index type: `IndexIVFFlat` for larger datasets (faster search)
- **Generation**: Template-based initially, then fine-tune local LLM

**Optional LLM for Generation (if needed):**
- **Llama-2-7b-chat-hf** (Meta, community license, ~13GB)
- **microsoft/phi-2** (2.7B params, MIT, ~5GB, good for CPU)
- **mistralai/Mistral-7B-Instruct-v0.1** (Apache 2.0, ~14GB)

**Hardware**: CPU sufficient for embeddings + templates. GPU recommended for LLM.

---

## 2. Nutrition Plan Generator

### Same as Workout Plan Generator

**Dataset**: `Documentation/ML/Dataset/Nutrition Dataset/Dataset_Nutrition_Plan.csv`

**Additional Processing:**
- Ingredient normalization (use `spaCy` or regex)
- Macro calculation (protein/carbs/fats from CSV)

**Same components** as workout plan (embeddings, FAISS, optional LLM).

---

## 3. AI Coach Assistant (Chat + Proactive Follow-up)

### Components:

**A) Chat Functionality:**
- **Embeddings**: `all-mpnet-base-v2` (same as models 1 & 2)
- **Vector Store**: Shared FAISS index with workout/nutrition contexts
- **Conversation LLM**:
  - **Option 1**: Template-based responses (fastest, free, no download)
  - **Option 2**: Local LLM (Llama-2-7b-chat, Mistral-7B, or Phi-2)
  - **Option 3**: Fine-tuned small model on gym/fitness conversations
- **Context Window**: 2K-4K tokens sufficient

**B) Proactive Messaging:**
- **Scheduler**: APScheduler (Python, MIT)
- **Message Templates**: Store in `ml_models/prompts/coach_prompts.md`
- **Trigger Logic**: Time-based (daily check-ins, appointment reminders)
- **Storage**: PostgreSQL (chat history in `ChatMessages` table)

**C) Voice (optional for coach):**
- See Model 5 below

---

## 4. Analytics Engine (Equipment Usage, Revenue, Maintenance)

### A) Equipment Usage Analysis

**Approach**: Time-series aggregation + clustering

**Libraries:**
- **pandas** (BSD) - data aggregation
- **scikit-learn** (BSD) - clustering (KMeans), anomaly detection (IsolationForest)
- **matplotlib/seaborn** (BSD) - visualization

**Process:**
1. Aggregate usage logs by equipment_id and date
2. Calculate total usage hours, unique users, peak times
3. Cluster equipment by usage patterns
4. Identify underutilized equipment

### B) Revenue Forecasting

**Library**: **Prophet** (Meta, MIT License)

**Alternative**: **statsmodels** (BSD) - ARIMA, SARIMAX

**Process:**
1. Load monthly revenue from DB/CSV
2. Prepare dataframe with `ds` (date) and `y` (revenue) columns
3. Fit Prophet model with yearly seasonality
4. Forecast 3-12 months ahead
5. Return predictions with confidence intervals

### C) Maintenance Prediction

**Approach**: Simple rule-based + anomaly detection

**Libraries:**
- **scikit-learn IsolationForest** (anomaly detection)
- **Rule-based heuristics**: e.g., `failure_prob = (usage_hours * 0.001) + (last_maintenance_days * 0.005)`

**For advanced ML (optional):**
- Train **RandomForestClassifier** on historical failure events (if data available)
- Features: usage_hours, age, maintenance_history, utilization_rate

**Hardware**: CPU sufficient (Prophet is CPU-optimized)

---

## 5. Voice Integration (In-App Only, Not PSTN Calls)

### A) Automatic Speech Recognition (ASR)

**Model**: **OpenAI Whisper** (MIT License, open-source)

**Recommended Size:**
- **tiny** (~39M params, ~75MB) - fastest, lower accuracy, good for MVP
- **base** (~74M params, ~142MB) - balanced
- **small** (~244M params, ~466MB) - recommended for production
- **medium** (~769M params, ~1.5GB) - high accuracy, slower
- **large** (~1550M params, ~2.9GB) - best accuracy, requires GPU

**Hardware**:
- CPU: tiny/base models run well
- GPU: recommended for small/medium/large

**Endpoints**: Already stubbed in `ml_models/whisper_server/app.py`

### B) Text-to-Speech (TTS)

**Engine**: **Coqui TTS** (Mozilla Public License 2.0, open-source)

**Recommended Model**: `tts_models/en/ljspeech/tacotron2-DDC`
- Fast, good quality, ~100MB
- Alternative: `tts_models/en/vctk/vits` (multi-speaker, ~200MB)

**Hardware**: CPU sufficient for real-time synthesis

**Endpoints**: Already stubbed in `ml_models/tts_server/app.py`

### C) WebRTC for In-App Voice

**Frontend**: Use **WebRTC** (browser native, free)
- Capture audio from user mic
- Send audio chunks to Whisper server
- Get transcription
- Send text to coach assistant
- Get response
- Send to TTS server
- Play audio response

**Libraries (Frontend)**:
- `navigator.mediaDevices.getUserMedia()` (native)
- **RecordRTC** (MIT) for audio recording

**Note**: PSTN/phone calls require Twilio (paid) or Asterisk/FreeSWITCH (complex self-hosting). Recommend in-app voice only.

---

## Recommended Configuration File (`ml_models/config.yaml`)

```yaml
embeddings:
  model: all-mpnet-base-v2
  dimension: 768
  batch_size: 32

vector_store:
  type: faiss
  path: data/faiss_index
  index_type: IndexFlatL2

llm:
  model: microsoft/phi-2  # or meta-llama/Llama-2-7b-chat-hf
  device: cpu  # or cuda
  max_tokens: 512
  temperature: 0.7

whisper:
  model: small
  language: en

tts:
  engine: coqui
  model: tts_models/en/ljspeech/tacotron2-DDC

compute:
  device: cpu
  num_workers: 2

analytics:
  maintenance_data_path: data/equipment_maintenance.csv
  revenue_data_path: data/monthly_revenue.csv
  usage_logs_path: data/equipment_usage_logs.csv
```

---

## Hardware Requirements

| Component | Min CPU | Recommended GPU | RAM | Disk |
|-----------|---------|-----------------|-----|------|
| Embeddings (all-mpnet-base-v2) | 2 cores | Optional | 4GB | 500MB |
| FAISS (100K vectors) | 2 cores | N/A | 2GB | 500MB |
| LLM (Phi-2) | 4 cores | GTX 1660+ | 8GB | 6GB |
| LLM (Llama-2-7b) | 8 cores | RTX 3060+ | 16GB | 14GB |
| Whisper (small) | 4 cores | Optional | 4GB | 500MB |
| TTS (Coqui) | 2 cores | Optional | 2GB | 200MB |
| Analytics (Prophet) | 2 cores | N/A | 4GB | 100MB |

**For full stack on single machine**: 8-core CPU, 16GB RAM, 50GB disk (no GPU) works for MVP with Phi-2 or template-based generation.

---

## Estimated Model Download Sizes

| Model | Size | Download Command |
|-------|------|------------------|
| all-mpnet-base-v2 | ~420MB | Auto-downloads on first use |
| Phi-2 | ~5.5GB | `huggingface-cli download microsoft/phi-2` |
| Llama-2-7b-chat | ~13.5GB | `huggingface-cli download meta-llama/Llama-2-7b-chat-hf` (requires approval) |
| Whisper small | ~466MB | Auto-downloads on first use |
| Coqui TTS model | ~100MB | Auto-downloads on first use |
| Prophet | N/A | Installed via pip |

---

## Cost Comparison

| Approach | Cost | Performance | Ease |
|----------|------|-------------|------|
| Template + RAG (our recommendation) | $0 | Good | Easy |
| Local LLM (Phi-2) | $0 | Better | Medium |
| Local LLM (Llama-2) | $0 | Best (local) | Hard |
| OpenAI API | $10-100/month | Excellent | Easy |

**Recommendation**: Start with template-based + RAG for MVP, add Phi-2 later if needed, avoid paid APIs.

---

## Installation Commands

```powershell
# Core ML dependencies
pip install sentence-transformers faiss-cpu torch transformers

# Analytics
pip install prophet scikit-learn pandas

# Voice
pip install openai-whisper TTS

# Optional LLM
pip install accelerate bitsandbytes  # for model optimization

# Download models (optional, auto-downloads on first use)
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-mpnet-base-v2')"
```

---

## Testing the Setup

```python
# Test embeddings
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-mpnet-base-v2')
emb = model.encode(["test"])
print(f"Embedding shape: {emb.shape}")  # Should be (1, 768)

# Test FAISS
import faiss
index = faiss.IndexFlatL2(768)
print(f"FAISS index created with dim {index.d}")

# Test Whisper
import whisper
model = whisper.load_model("small")
print("Whisper model loaded")

# Test Prophet
from prophet import Prophet
import pandas as pd
df = pd.DataFrame({'ds': pd.date_range('2024-01-01', periods=12, freq='M'), 'y': range(12)})
m = Prophet()
m.fit(df)
print("Prophet model trained")
```

---

## Security & Privacy Notes

1. **All models run locally** - no data sent to external APIs
2. **User data privacy** - chat history stored in your PostgreSQL DB
3. **No API keys required** - fully offline-capable
4. **Open-source licenses** - no vendor lock-in
5. **GDPR compliant** - you control all data

---

## Future Enhancements (Still Free)

1. **Fine-tune Phi-2 on gym conversations** using your chat logs (requires GPU, ~8GB VRAM)
2. **Multi-language support** - Whisper supports 99 languages
3. **Custom TTS voice cloning** - use Coqui's voice cloning (requires voice samples)
4. **Federated learning** - train models across multiple gym locations
5. **Reinforcement learning** - optimize workout recommendations based on member feedback

---

End of Configuration Recommendations
