# Implementation Prompt for ML Models (Complete Step-by-Step Guide)

## Purpose
This document provides a complete, error-free implementation guide for building 5 free, open-source ML models:
1. **Workout Plan Generator**
2. **Nutrition Plan Generator**
3. **AI Coach Assistant** (proactive chat, follow-ups, appointments)
4. **Analytics Engine** (equipment usage, revenue analysis, maintenance prediction)
5. **Voice Integration** (in-app voice chat using Whisper + TTS)

All models use FREE, open-source components. No paid APIs required.

---

## Clean Architecture Layer Specifications

**CRITICAL**: This project follows Clean Architecture. Each component MUST be placed in the correct layer.

### Layer Structure & Dependencies

```
┌─────────────────────────────────────────────────────────┐
│  Presentation Layer (Graduation-Project/Controllers)    │
│  - WorkoutController.cs                                 │
│  - NutritionController.cs                               │
│  - CoachController.cs                                   │
│  - AnalyticsController.cs                               │
│  Dependencies: ServiceAbstraction (interfaces only)     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Service Abstraction Layer (Core/ServiceAbstraction)    │
│  - IWorkoutService.cs (interface)                       │
│  - INutritionService.cs (interface)                     │
│  - ICoachService.cs (interface)                         │
│  - IAnalyticsService.cs (interface)                     │
│  - IVectorSearchService.cs (interface)                  │
│  Dependencies: DomainLayer only                         │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Service Implementation (Core/Service)                  │
│  - WorkoutService.cs (implements IWorkoutService)       │
│  - NutritionService.cs (implements INutritionService)   │
│  - CoachService.cs (implements ICoachService)           │
│  - AnalyticsService.cs (implements IAnalyticsService)   │
│  Dependencies: ServiceAbstraction, DomainLayer,         │
│               Persistence (for HttpClient to Python)    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Domain Layer (Core/DomainLayer)                        │
│  - Models/WorkoutPlan.cs                                │
│  - Models/NutritionPlan.cs                              │
│  - Models/CoachMessage.cs                               │
│  - Models/AnalyticsReport.cs                            │
│  - Contracts/Requests/GenerateWorkoutRequest.cs         │
│  - Contracts/Responses/WorkoutPlanResponse.cs           │
│  Dependencies: None (pure domain objects)               │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Persistence Layer (Infrastructure/Persistence)         │
│  - HttpClients/MLServiceClient.cs (calls Python)        │
│  - Repositories/ChatMessageRepository.cs                │
│  Dependencies: DomainLayer, external services           │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  Python ML Services (ml_models/)                        │
│  - embedding_server.py                                  │
│  - coach_server/app.py                                  │
│  - analytics_server/app.py                              │
│  - whisper_server/app.py                                │
│  - tts_server/app.py                                    │
│  Dependencies: External (Flask, sentence-transformers)  │
└─────────────────────────────────────────────────────────┘
```

### Dependency Rules (MUST FOLLOW)
1. **Controllers** → Can only reference `ServiceAbstraction` (interfaces)
2. **ServiceAbstraction** → Can only reference `DomainLayer` (entities, DTOs)
3. **Service** → Can reference `ServiceAbstraction`, `DomainLayer`, `Persistence`
4. **DomainLayer** → Has NO dependencies (pure domain)
5. **Persistence** → Can reference `DomainLayer` and external services
6. **Python services** → Standalone, called via HTTP from `Persistence` layer

**NEVER**:
- Controllers calling Service implementations directly
- Domain Layer referencing any other layer
- Service Layer calling external APIs directly (use Persistence)

---

## File Placement Map (Exact Paths)

### Model 1 & 2: Workout & Nutrition Plan Generators

**Domain Layer** (`Core/DomainLayer/`):
```
Models/
  ├── WorkoutPlan.cs
  ├── NutritionPlan.cs
  └── Exercise.cs
Contracts/
  ├── Requests/
  │   ├── GenerateWorkoutRequest.cs
  │   └── GenerateNutritionRequest.cs
  └── Responses/
      ├── WorkoutPlanResponse.cs
      └── NutritionPlanResponse.cs
```

**Service Abstraction** (`Core/ServiceAbstraction/Services/`):
```
IWorkoutService.cs
INutritionService.cs
IVectorSearchService.cs
```

**Service Implementation** (`Core/Service/Services/`):
```
WorkoutService.cs
NutritionService.cs
VectorSearchService.cs
```

**Persistence** (`Infrastructure/Persistence/`):
```
HttpClients/
  └── MLServiceClient.cs  // HttpClient wrapper for Python services
```

**Controllers** (`Graduation-Project/Controllers/`):
```
WorkoutController.cs
NutritionController.cs
```

**Python Services** (`ml_models/`):
```
coach_server/app.py  // Handles workout/nutrition generation
embedding_server.py  // Provides embeddings
faiss_store.py       // Vector storage
```

---

### Model 3: AI Coach Assistant

**Domain Layer** (`Core/DomainLayer/`):
```
Models/
  ├── CoachMessage.cs
  ├── Conversation.cs
  └── ProactiveReminder.cs
Contracts/
  ├── Requests/
  │   ├── SendMessageRequest.cs
  │   └── ScheduleReminderRequest.cs
  └── Responses/
      ├── CoachMessageResponse.cs
      └── ConversationHistoryResponse.cs
```

**Service Abstraction** (`Core/ServiceAbstraction/Services/`):
```
ICoachService.cs
ISchedulerService.cs
```

**Service Implementation** (`Core/Service/Services/`):
```
CoachService.cs
SchedulerService.cs
```

**Persistence** (`Infrastructure/Persistence/`):
```
Repositories/
  └── ChatMessageRepository.cs  // DB access for chat history
HttpClients/
  └── CoachServerClient.cs      // HTTP calls to coach_server
```

**Controllers** (`Graduation-Project/Controllers/`):
```
CoachController.cs
```

**Python Services** (`ml_models/`):
```
coach_server/
  ├── app.py
  ├── rag.py
  └── scheduler.py
```

---

### Model 4: Analytics Engine

**Domain Layer** (`Core/DomainLayer/`):
```
Models/
  ├── EquipmentUsageReport.cs
  ├── RevenueAnalysis.cs
  └── MaintenancePrediction.cs
Contracts/
  ├── Requests/
  │   ├── GetUsageAnalyticsRequest.cs
  │   └── ForecastRevenueRequest.cs
  └── Responses/
      ├── UsageAnalyticsResponse.cs
      ├── RevenueForecastResponse.cs
      └── MaintenancePredictionsResponse.cs
```

**Service Abstraction** (`Core/ServiceAbstraction/Services/`):
```
IAnalyticsService.cs
```

**Service Implementation** (`Core/Service/Services/`):
```
AnalyticsService.cs
```

**Persistence** (`Infrastructure/Persistence/`):
```
HttpClients/
  └── AnalyticsServerClient.cs  // HTTP calls to analytics_server
Repositories/
  └── EquipmentUsageRepository.cs  // Raw data access
```

**Controllers** (`Graduation-Project/Controllers/`):
```
AnalyticsController.cs
```

**Python Services** (`ml_models/`):
```
analytics_server/app.py
scripts/analytics/
  ├── usage_etl.py
  └── forecast_revenue.py
```

---

### Model 5: Voice Integration

**Domain Layer** (`Core/DomainLayer/`):
```
Models/
  └── VoiceTranscription.cs
Contracts/
  ├── Requests/
  │   ├── TranscribeAudioRequest.cs
  │   └── SynthesizeSpeechRequest.cs
  └── Responses/
      ├── TranscriptionResponse.cs
      └── AudioResponse.cs
```

**Service Abstraction** (`Core/ServiceAbstraction/Services/`):
```
IVoiceService.cs
```

**Service Implementation** (`Core/Service/Services/`):
```
VoiceService.cs
```

**Persistence** (`Infrastructure/Persistence/`):
```
HttpClients/
  ├── WhisperClient.cs  // Calls whisper_server
  └── TTSClient.cs      // Calls tts_server
```

**Controllers** (`Graduation-Project/Controllers/`):
```
VoiceController.cs
```

**Python Services** (`ml_models/`):
```
whisper_server/app.py
tts_server/app.py
```

---

## Prerequisites Checklist
Before starting implementation, ensure:
- [ ] Python 3.9+ installed
- [ ] .NET 6+ SDK installed (for backend controllers)
- [ ] PostgreSQL database running (or configured connection string)
- [ ] Git repository clean with feature branch created
- [ ] All dependencies in `ml_models/requirements.txt` installed
- [ ] `ml_models/config.yaml` reviewed and paths configured

## Global Implementation Rules
1. **Work incrementally**: One feature per branch/PR. Make small commits.
2. **Read files completely**: Before editing, read entire file to detect placeholders.
3. **Test after each step**: Run `pytest` and `dotnet build` after each feature.
4. **Use only free/open-source tools**: No paid APIs (OpenAI, etc.). Use HuggingFace, sentence-transformers, FAISS, Whisper, Coqui TTS, Prophet, scikit-learn.
5. **Add tests**: Every new function must have a unit test.
6. **Document changes**: Update `ml_models/README.md` after each major feature.

---

## Implementation Roadmap

### Phase 0: Environment Setup & Validation (1-2 hours)

**Step 0.1 - Install Python Dependencies**
```powershell
cd ml_models
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

**Step 0.2 - Validate Configuration**
- Open `ml_models/config.yaml`
- Set data paths under `analytics`:
  ```yaml
  analytics:
    maintenance_data_path: data/equipment_maintenance.csv
    revenue_data_path: data/monthly_revenue.csv
    usage_logs_path: data/equipment_usage_logs.csv
  ```
- Create `ml_models/data/` directory if missing
- If no real data yet, create sample CSVs (see Step 0.3)

**Step 0.3 - Create Sample Data (for development)**
Create minimal sample files:

`ml_models/data/equipment_maintenance.csv`:
```csv
equipment_id,usage_hours,last_maintenance_days
1,120,25
2,200,60
3,50,10
4,180,45
```

`ml_models/data/monthly_revenue.csv`:
```csv
month,revenue
1,8000
2,7500
3,9000
4,10000
5,11000
6,12000
7,11500
8,10500
9,9500
10,8500
11,7000
12,6500
```

`ml_models/data/equipment_usage_logs.csv`:
```csv
timestamp,equipment_id,user_id,duration_minutes
2024-01-01 08:00:00,1,101,45
2024-01-01 09:00:00,2,102,30
2024-01-01 10:00:00,1,103,60
```

**Step 0.4 - Run Health Checks**
```powershell
# Test analytics server can load data
cd ml_models/analytics_server
python app.py  # Should start without errors on port 5005
# Open browser: http://localhost:5005/health
```

---

### Phase 1: Data Foundation (Model 4 - Analytics) (3-4 hours)

Start with analytics because it validates data loading patterns used by all models.

**Step 1.1 - Implement Analytics ETL**

File: `scripts/analytics/usage_etl.py` (already stubbed, verify it works)

Test:
```python
# tests/ml/test_analytics.py
import pandas as pd
from scripts.analytics.usage_etl import run_etl

def test_usage_etl():
    # Create sample input
    df_in = pd.DataFrame({
        'timestamp': ['2024-01-01 08:00', '2024-01-01 09:00'],
        'equipment_id': [1, 1],
        'user_id': [101, 102],
        'duration_minutes': [45, 30]
    })
    df_in.to_csv('test_usage.csv', index=False)
    
    df_out = run_etl('test_usage.csv')
    assert 'date' in df_out.columns
    assert 'equipment_id' in df_out.columns
    assert 'unique_users' in df_out.columns
```

**Step 1.2 - Implement Revenue Forecasting**

Update `scripts/analytics/forecast_revenue.py`:
```python
import pandas as pd
from prophet import Prophet
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def forecast(df: pd.DataFrame, periods: int = 12) -> pd.DataFrame:
    \"\"\"Forecast revenue using Prophet.
    df must have 'ds' (date) and 'y' (value) columns.
    \"\"\"
    if 'ds' not in df.columns or 'y' not in df.columns:
        raise ValueError(\"DataFrame must have 'ds' and 'y' columns\")
    
    model = Prophet(yearly_seasonality=True, weekly_seasonality=False, daily_seasonality=False)
    model.fit(df)
    
    future = model.make_future_dataframe(periods=periods, freq='M')
    forecast = model.predict(future)
    
    logger.info(f\"Forecasted {periods} periods\")
    return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
```

**Step 1.3 - Test Analytics Server**

Run:
```powershell
cd ml_models/analytics_server
python app.py
```

Test endpoints:
- `GET http://localhost:5005/health` → should return `{\"status\": \"healthy\"}`
- `GET http://localhost:5005/predict/maintenance` → should return maintenance predictions
- `GET http://localhost:5005/analyze/revenue` → should return revenue analysis

**Step 1.4 - Add .NET Backend Integration**

File: `Graduation-Project/Controllers/AnalyticsController.cs` (already stubbed)

Implement actual HTTP calls:
```csharp
using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Threading.Tasks;

namespace Graduation_Project.Controllers
{
    [ApiController]
    [Route(\"api/analytics\")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private const string AnalyticsServiceUrl = \"http://localhost:5005\";

        public AnalyticsController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet(\"equipment-usage\")]
        public async Task<IActionResult> EquipmentUsage([FromQuery] string from, [FromQuery] string to)
        {
            // Call Python analytics service
            var client = _httpClientFactory.CreateClient();
            var response = await client.GetAsync($\"{AnalyticsServiceUrl}/predict/maintenance\");
            
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                return Content(content, \"application/json\");
            }
            
            return StatusCode((int)response.StatusCode);
        }
    }
}
```

---

### Phase 2: Embeddings & Vector Store (Foundation for Models 1, 2, 3) (2-3 hours)

**Step 2.1 - Start Embedding Server**

File: `ml_models/embedding_server.py` (already exists)

Test:
```powershell
cd ml_models
python embedding_server.py
```

Test endpoint:
```powershell
curl -X POST http://localhost:5100/embed -H \"Content-Type: application/json\" -d '{\"texts\": [\"test\"]}'
```

**Step 2.2 - Build Vector Store with Workout/Nutrition Data**

Create script: `scripts/build_vector_store.py`
```python
import pandas as pd
import requests
import sys
import os
sys.path.insert(0, 'ml_models')
from faiss_store import FaissStore

EMBEDDING_URL = 'http://localhost:5100/embed'

def build_store():
    # Load workout data
    workout_df = pd.read_csv('Documentation/ML/Dataset/Workout Dataset/Dataset_Workout_plans.csv')
    
    # Extract texts
    texts = []
    metadata = []
    for idx, row in workout_df.iterrows():
        text = f\"Goal: {row.get('goal', '')}. Exercises: {row.get('exercises', '')}\"
        texts.append(text)
        metadata.append({
            'text': text,
            'source': 'workout_dataset',
            'example_id': row.get('example_id', idx)
        })
    
    # Get embeddings
    response = requests.post(EMBEDDING_URL, json={'texts': texts})
    embeddings = response.json()['embeddings']
    
    # Add to vector store
    store = FaissStore(path='ml_models/data/faiss_index')
    ids = [f\"workout_{i}\" for i in range(len(texts))]
    store.add(ids, embeddings, metadata)
    store.save()
    print(f\"Built vector store with {len(ids)} workout examples\")

if __name__ == '__main__':
    build_store()
```

Run:
```powershell
python scripts/build_vector_store.py
```

**Step 2.3 - Test RAG Retrieval**

Test: `tests/ml/test_rag.py`
```python
from ml_models.coach_server.rag import retrieve_context, build_prompt

def test_retrieve_context():
    results = retrieve_context(\"I want to build muscle\", top_k=3)
    assert len(results) > 0
    assert 'text' in results[0]
    assert 'source' in results[0]

def test_build_prompt():
    context = [{'text': 'Sample workout', 'source': 'test'}]
    prompt = build_prompt(\"Create a plan\", context)
    assert 'workout' in prompt.lower()
```

---

### Phase 3: Workout Plan Generator (Model 1) (3-4 hours)

**Step 3.1 - Create Domain Models**

File: `Core/DomainLayer/Models/WorkoutPlan.cs`
```csharp
namespace DomainLayer.Models
{
    public class WorkoutPlan
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Goal { get; set; }
        public string Level { get; set; }
        public List<Exercise> Exercises { get; set; }
        public int DurationWeeks { get; set; }
        public string Frequency { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class Exercise
    {
        public string Name { get; set; }
        public int Sets { get; set; }
        public int Reps { get; set; }
        public string Notes { get; set; }
    }
}
```

File: `Core/DomainLayer/Contracts/Requests/GenerateWorkoutRequest.cs`
```csharp
namespace DomainLayer.Contracts.Requests
{
    public class GenerateWorkoutRequest
    {
        public Guid UserId { get; set; }
        public string Goal { get; set; }  // e.g., "muscle gain", "weight loss"
        public string Level { get; set; }  // e.g., "beginner", "intermediate"
        public int? Age { get; set; }
        public List<string> Injuries { get; set; }
        public string Equipment { get; set; }
    }
}
```

File: `Core/DomainLayer/Contracts/Responses/WorkoutPlanResponse.cs`
```csharp
namespace DomainLayer.Contracts.Responses
{
    public class WorkoutPlanResponse
    {
        public Guid PlanId { get; set; }
        public List<Exercise> Exercises { get; set; }
        public int DurationWeeks { get; set; }
        public string Frequency { get; set; }
        public List<string> Sources { get; set; }  // RAG sources
    }
}
```

**Step 3.2 - Create Service Interface**

File: `Core/ServiceAbstraction/Services/IWorkoutService.cs`
```csharp
using DomainLayer.Contracts.Requests;
using DomainLayer.Contracts.Responses;
using System.Threading.Tasks;

namespace ServiceAbstraction.Services
{
    public interface IWorkoutService
    {
        Task<WorkoutPlanResponse> GeneratePlan(GenerateWorkoutRequest request);
        Task RecordFeedback(Guid planId, int rating, string notes);
    }
}
```

**Step 3.3 - Create Persistence Layer HTTP Client**

File: `Infrastructure/Persistence/HttpClients/MLServiceClient.cs`
```csharp
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace Persistence.HttpClients
{
    public class MLServiceClient
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private const string CoachServerUrl = "http://localhost:5002";

        public MLServiceClient(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        public async Task<T> PostAsync<T>(string endpoint, object payload)
        {
            var client = _httpClientFactory.CreateClient();
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            var response = await client.PostAsync($"{CoachServerUrl}{endpoint}", content);
            response.EnsureSuccessStatusCode();
            
            var responseJson = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<T>(responseJson);
        }
    }
}
```

**Step 3.4 - Implement Service**

File: `Core/Service/Services/WorkoutService.cs`
```csharp
using DomainLayer.Contracts.Requests;
using DomainLayer.Contracts.Responses;
using Persistence.HttpClients;
using ServiceAbstraction.Services;
using System.Threading.Tasks;

namespace Service.Services
{
    public class WorkoutService : IWorkoutService
    {
        private readonly MLServiceClient _mlClient;

        public WorkoutService(MLServiceClient mlClient)
        {
            _mlClient = mlClient;
        }

        public async Task<WorkoutPlanResponse> GeneratePlan(GenerateWorkoutRequest request)
        {
            var payload = new
            {
                user_profile = new
                {
                    goal = request.Goal,
                    level = request.Level,
                    age = request.Age,
                    injuries = request.Injuries,
                    equipment = request.Equipment
                }
            };

            return await _mlClient.PostAsync<WorkoutPlanResponse>("/generate/workout", payload);
        }

        public async Task RecordFeedback(Guid planId, int rating, string notes)
        {
            // Store in database via repository
            await Task.CompletedTask;
        }
    }
}
```

**Step 3.5 - Create Controller**

File: `Graduation-Project/Controllers/WorkoutController.cs`
```csharp
using DomainLayer.Contracts.Requests;
using Microsoft.AspNetCore.Mvc;
using ServiceAbstraction.Services;
using System.Threading.Tasks;

namespace Graduation_Project.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorkoutController : ControllerBase
    {
        private readonly IWorkoutService _workoutService;

        public WorkoutController(IWorkoutService workoutService)
        {
            _workoutService = workoutService;
        }

        [HttpPost("generate")]
        public async Task<IActionResult> GeneratePlan([FromBody] GenerateWorkoutRequest request)
        {
            var plan = await _workoutService.GeneratePlan(request);
            return Ok(plan);
        }

        [HttpPost("feedback/{planId}")]
        public async Task<IActionResult> ProvideFeedback(Guid planId, [FromBody] FeedbackRequest request)
        {
            await _workoutService.RecordFeedback(planId, request.Rating, request.Notes);
            return Ok();
        }
    }

    public class FeedbackRequest
    {
        public int Rating { get; set; }
        public string Notes { get; set; }
    }
}
```

**Step 3.6 - Register Services in DI Container**

File: `Graduation-Project/Program.cs` (add to ConfigureServices):
```csharp
// Add ML services
builder.Services.AddHttpClient();
builder.Services.AddScoped<MLServiceClient>();
builder.Services.AddScoped<IWorkoutService, WorkoutService>();
```

**Step 3.7 - Add Workout Generation Endpoint to Python Coach Server**

File: `ml_models/coach_server/app.py` (add route):
```python
@app.route('/generate/workout', methods=['POST'])
def generate_workout():
    data = request.json
    user_profile = data.get('user_profile', {})
    
    # Build query
    query = f"Create a workout plan for: goal={user_profile.get('goal')}, level={user_profile.get('level')}"
    
    # Retrieve context from vector store
    from rag import retrieve_context
    context = retrieve_context(query, top_k=3)
    
    # Build response (template-based for now)
    exercises = []
    for ctx in context:
        # Extract exercise info from context
        exercises.append({
            'name': 'Sample Exercise',
            'sets': 3,
            'reps': 10,
            'notes': ctx.get('text', '')[:100]
        })
    
    return jsonify({
        'planId': str(uuid.uuid4()),
        'exercises': exercises[:5],
        'durationWeeks': 4,
        'frequency': '3-4 times per week',
        'sources': [c.get('source') for c in context]
    })
```

---

### Phase 4: Nutrition Plan Generator (Model 2) (2-3 hours)

Follow the SAME clean architecture pattern as Model 1:

**Domain Layer**:
- `Core/DomainLayer/Models/NutritionPlan.cs`
- `Core/DomainLayer/Contracts/Requests/GenerateNutritionRequest.cs`
- `Core/DomainLayer/Contracts/Responses/NutritionPlanResponse.cs`

**Service Abstraction**:
- `Core/ServiceAbstraction/Services/INutritionService.cs`

**Service Implementation**:
- `Core/Service/Services/NutritionService.cs` (uses same `MLServiceClient`)

**Controller**:
- `Graduation-Project/Controllers/NutritionController.cs`

**Python**:
- Add `/generate/nutrition` route to `ml_models/coach_server/app.py`

---

### Phase 5: AI Coach Assistant (Model 3) (4-5 hours)

**Step 5.1 - Create Domain Models**

File: `Core/DomainLayer/Models/CoachMessage.cs`
```csharp
namespace DomainLayer.Models
{
    public class CoachMessage
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Role { get; set; }  // "user" or "coach"
        public string Content { get; set; }
        public DateTime Timestamp { get; set; }
        public List<string> Sources { get; set; }
    }

    public class ProactiveReminder
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Type { get; set; }  // "checkin", "appointment", etc.
        public DateTime ScheduledFor { get; set; }
        public string Message { get; set; }
    }
}
```

**Step 5.2 - Create Service Interface**

File: `Core/ServiceAbstraction/Services/ICoachService.cs`
```csharp
namespace ServiceAbstraction.Services
{
    public interface ICoachService
    {
        Task<CoachMessageResponse> SendMessage(SendMessageRequest request);
        Task<List<CoachMessage>> GetConversationHistory(Guid userId, int limit = 50);
        Task ScheduleReminder(ScheduleReminderRequest request);
    }
}
```

**Step 5.3 - Create Persistence Layer**

File: `Infrastructure/Persistence/Repositories/ChatMessageRepository.cs`
```csharp
namespace Persistence.Repositories
{
    public class ChatMessageRepository
    {
        private readonly ApplicationDbContext _context;

        public ChatMessageRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task SaveMessage(CoachMessage message)
        {
            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();
        }

        public async Task<List<CoachMessage>> GetHistory(Guid userId, int limit)
        {
            return await _context.ChatMessages
                .Where(m => m.UserId == userId)
                .OrderByDescending(m => m.Timestamp)
                .Take(limit)
                .ToListAsync();
        }
    }
}
```

**Step 5.4 - Implement Service**

File: `Core/Service/Services/CoachService.cs`
```csharp
namespace Service.Services
{
    public class CoachService : ICoachService
    {
        private readonly MLServiceClient _mlClient;
        private readonly ChatMessageRepository _chatRepo;

        public CoachService(MLServiceClient mlClient, ChatMessageRepository chatRepo)
        {
            _mlClient = mlClient;
            _chatRepo = chatRepo;
        }

        public async Task<CoachMessageResponse> SendMessage(SendMessageRequest request)
        {
            // Save user message
            await _chatRepo.SaveMessage(new CoachMessage
            {
                UserId = request.UserId,
                Role = "user",
                Content = request.Message,
                Timestamp = DateTime.UtcNow
            });

            // Get coach reply from Python service
            var response = await _mlClient.PostAsync<CoachMessageResponse>(
                "/coach/message",
                new { user_id = request.UserId, message = request.Message }
            );

            // Save coach reply
            await _chatRepo.SaveMessage(new CoachMessage
            {
                UserId = request.UserId,
                Role = "coach",
                Content = response.Reply,
                Sources = response.Sources,
                Timestamp = DateTime.UtcNow
            });

            return response;
        }
    }
}
```

**Step 5.5 - Create Controller**

File: `Graduation-Project/Controllers/CoachController.cs`
```csharp
[ApiController]
[Route("api/[controller]")]
public class CoachController : ControllerBase
{
    private readonly ICoachService _coachService;

    public CoachController(ICoachService coachService)
    {
        _coachService = coachService;
    }

    [HttpPost("message")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
    {
        var response = await _coachService.SendMessage(request);
        return Ok(response);
    }

    [HttpGet("history/{userId}")]
    public async Task<IActionResult> GetHistory(Guid userId)
    {
        var history = await _coachService.GetConversationHistory(userId);
        return Ok(history);
    }
}
```

---

### Phase 6: Voice Integration (Model 5 - Simplified) (2-3 hours)

**Step 6.1 - Test Whisper Server**

Start: `ml_models/whisper_server/app.py`

Test:
```powershell
curl -X POST http://localhost:5003/asr/transcribe -F \"audio=@test.wav\"
```

**Step 6.2 - Test TTS Server**

Start: `ml_models/tts_server/app.py`

Test:
```powershell
curl -X POST http://localhost:5004/tts/synthesize -d '{\"text\": \"Hello\"}' -o output.wav
```

**Step 6.3 - Frontend WebRTC Integration (Stub)**

Create: `Client_Ui/src/webrtc/voiceClient.js`
```javascript
class VoiceClient {
    async captureAndTranscribe() {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Record audio, send to whisper endpoint
        // Get transcription, send to coach
        // Get reply, send to TTS
        // Play audio
    }
}
```

---

## Testing Checklist

After completing all phases:

- [ ] `pytest tests/ml/` passes all tests
- [ ] `dotnet build` in Graduation-Project succeeds
- [ ] All Python services start without errors:
  - embedding_server (port 5100)
  - coach_server (port 5002)
  - analytics_server (port 5005)
  - whisper_server (port 5003)
  - tts_server (port 5004)
- [ ] Vector store built and queries return results
- [ ] .NET controllers can call Python services
- [ ] Sample workout/nutrition plans generate successfully

---

## Free & Open-Source Components Used

| Component | Model(s) | Library | License |
|-----------|----------|---------|---------|
| Embeddings | 1, 2, 3 | sentence-transformers | Apache 2.0 |
| Vector Store | 1, 2, 3 | FAISS | MIT |
| LLM (optional) | 3 | Llama-2-7b-chat or Mistral-7B | Community |
| ASR | 5 | OpenAI Whisper | MIT |
| TTS | 5 | Coqui TTS | MPL 2.0 |
| Forecasting | 4 | Prophet | MIT |
| ML Utils | 4 | scikit-learn | BSD |

---

## Troubleshooting

**Issue**: FAISS import error  
**Fix**: Falls back to numpy-based search automatically

**Issue**: Embedding server timeout  
**Fix**: Increase timeout in `rag.py`, ensure server running

**Issue**: No LLM model files  
**Fix**: For MVP, use template-based responses; download model later from HuggingFace

**Issue**: Analytics data not found  
**Fix**: Create sample CSVs in `ml_models/data/` as shown in Phase 0

---

## Production Deployment Notes

1. Replace sample data with real DB connections
2. Download and configure LLM model files
3. Add authentication to all endpoints
4. Set up reverse proxy (nginx) for Python services
5. Configure HTTPS
6. Add rate limiting
7. Monitor resource usage (CPU/RAM for models)

---

## Commit Strategy

Make commits after each major step:
- `feat: add analytics data loaders with DB/CSV fallback`
- `feat: implement FAISS vector store with persistence`
- `feat: add workout plan generation with RAG`
- `feat: add nutrition plan endpoint`
- `feat: implement coach chat with context retrieval`
- `feat: add voice transcription and TTS endpoints`

---

End of Complete Implementation Guide
- For each `load_*` function (e.g., `ml_models/analytics_server/app.py::load_maintenance_data`):
  - Read entire file. If it returns hardcoded/sample rows, replace or update as follows:
    - If production DB exists: implement a configurable DB read using an environment variable `ANALYTICS_DB_CONN` or similar. Use safe parameterized queries and return a pandas DataFrame.
    - If no DB: load from a dataset path defined in `ml_models/config.yaml` (`analytics.raw_path`) or from `Documentation/` CSVs. Add a clear error if the data path is missing.
  - Add tests: assert returned object is a `pandas.DataFrame` and that `len(df) >= 10` for realistic datasets, or assert presence of expected columns (`equipment_id`, `usage_hours`, `last_maintenance_days` for maintenance; `month`, `revenue` for revenue). If sample-only data is acceptable for dev, mark it explicitly with a TODO and ensure tests expect a small sample.
  - Example fix for the observed issue in `load_maintenance_data()` (current stub returns only 3 rows):
    - Replace the hardcoded dict with code that attempts, in order:
      1. Read from `ANALYTICS_DB_CONN` if set (use `psycopg2` or `sqlalchemy` + `pandas.read_sql`).
      2. Else read from config path `ml_models/config.yaml` -> `analytics.raw_path` (CSV).
      3. Else fallback to a small sample but log a WARNING and add a `TODO` comment to remove sample in prod.

Step 2 — Data cleaning & ETL
- Ensure `scripts/clean_*_data.py` exist for all datasets (workout, nutrition, analytics). Implement functions:
  - `load_and_clean(path: str) -> pd.DataFrame`
  - `validate_schema(df: pd.DataFrame) -> None` (raises on missing required columns)
- Add CLI wrappers so maintainers can run e.g., `python scripts/clean_workout_data.py --in data.csv --out cleaned.csv`.
- Add unit tests for these cleaners.

Step 3 — Embeddings & Vector Store
- Ensure `ml_models/embedding_server.py` and `ml_models/faiss_store.py` coordinate. Requirements:
  - `embedding_server` must read `ml_models/config.yaml` for `embeddings.model` and `vector_store.path`.
  - `faiss_store` must persist and load indices; include a small integration test that writes some embeddings and queries them.
- If `faiss` is not available on the machine, use a pure-Python fallback (store vectors in numpy files and perform cosine similarity manually) and log a WARNING.

Step 4 — Model training stubs (workout, nutrition)
- Implement `scripts/train_workout.py` and `scripts/train_nutrition.py` as small reproducible pipelines that accept `--data` and `--out`.
- If training full LLMs is not intended, create a deterministic template-based generator and store templates under `ml_models/templates/`.
- Add tests to assert `train()` returns an artifact path or creates `out` files.

Step 5 — Coach server & RAG
- `ml_models/coach_server/app.py` must call `coach_server/rag.py` functions to retrieve context and generate replies.
- `rag.retrieve_context()` must call `embedding_server` (or local embed function) and the `faiss_store` to get top-K contexts; return metadata including `source_file` and `source_offset` for traceability.
- Every generated reply must include `sources` field listing the retrieved items. Add tests that mock embeddings and assert `sources` included.

Step 6 — Analytics services
- Replace dev-only heuristics with proper ETL pipeline steps in `scripts/analytics/*`:
  - `usage_etl.py`: aggregate per-day equipment usage from raw logs.
  - `forecast_revenue.py`: use Prophet/neuralprophet or scikit-learn baseline; include input validation.
- Add unit tests that run `run_etl()` on small example CSV and assert expected aggregates.

Step 7 — Backend integration (Controllers / Services)
- For each `Graduation-Project/Controllers/*Controller.cs` stub added, implement minimal wiring to call the Python microservices over HTTP (or vice versa). Prefer a single integration pattern:
  - Python ML services run on known ports (documented in `docker-compose.ml.yml`).
  - C# `Service` implementations call those endpoints via HttpClient.
- Add health-check endpoints for each service and an integration test that verifies round-trip for the happy path.

Step 8 — Tests, Linting, and CI
- Add pytest tests under `tests/` for Python; add a minimal `.github/workflows/ci.yml` or mention CI steps.
- For .NET, ensure `dotnet build` passes and add unit tests where appropriate.

Step 9 — Documentation & runbook
- After each feature, update `ml_models/README.md` with run steps and `ml_models/config.yaml` defaults.
- Add run commands and `docker-compose` usage examples.

Important file-level checks (examples you must perform)
- `ml_models/analytics_server/app.py::load_maintenance_data` — currently returns only 3 hardcoded items. Fix so it:
  - Reads from DB if available, otherwise uses CSV configured under `ml_models/config.yaml`.
  - If using sample data for dev, add `logger.warning("Using sample maintenance data; replace with real DB path in production")` and a `# TODO` comment.
  - Add a unit test asserting the returned DataFrame has columns `['equipment_id','usage_hours','last_maintenance_days']`.

- Any file that does `pd.DataFrame({...})` with tiny sample arrays should be treated as a dev sample and replaced with a configurable loader.

Commit & PR rules
- One feature == one PR. Keep PRs small and focused. Each PR must:
  - Pass tests.
  - Include at least one new or updated unit test for added logic.
  - Update `ml_models/README.md` and `ml_models/config.yaml` if relevant.

How to report progress while implementing (use when you hand back to human)
- Short summary of changes (files touched). Example:
  - "Implemented analytics data loader to read DB/CSV, added unit tests, updated config.yaml, created migration script." 
- Show commands to run tests and start services.

Developer notes / helpful snippets
- DB read example (pandas + sqlalchemy):
  ```py
  from sqlalchemy import create_engine
  import pandas as pd

  engine = create_engine(conn_str)
  df = pd.read_sql('SELECT equipment_id, usage_hours, last_maintenance_days FROM equipment_usage', engine)
  ```

- Logging warning example:
  ```py
  import logging
  logging.warning('Using sample maintenance data; configure ANALYTICS_DB_CONN to use real data')
  ```

- Test example for `load_maintenance_data()`:
  ```py
  def test_load_maintenance_data_returns_df():
      df = load_maintenance_data()
      assert isinstance(df, pd.DataFrame)
      assert set(['equipment_id','usage_hours','last_maintenance_days']).issubset(df.columns)
  ```

Final note
- If you (Copilot) encounter a missing required dataset or credential, do not attempt to use external paid services. Create a minimal reproducible fallback (sample data under `ml_models/sample_data/`) and add a TODO + log message so maintainers can later replace sample data with production sources.

---
End of PROMPT.md
