# Clean Architecture & Layer Dependencies

## ✅ YES - Read and Specified Clean Architecture

This document maps exactly where each ML model component should be created to preserve clean architecture.

---

## Clean Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                              │
│         (Graduation-Project/Controllers/)                          │
│                                                                    │
│  ├── WorkoutController.cs         → IWorkoutService               │
│  ├── NutritionController.cs       → INutritionService             │
│  ├── CoachController.cs           → ICoachService                 │
│  ├── AnalyticsController.cs       → IAnalyticsService             │
│  └── VoiceController.cs           → IVoiceService                 │
│                                                                    │
│  REFERENCES: ServiceAbstraction (interfaces ONLY)                 │
└───────────────────────────────────────────────────────────────────┘
                              ↓ depends on
┌───────────────────────────────────────────────────────────────────┐
│                SERVICE ABSTRACTION LAYER                           │
│         (Core/ServiceAbstraction/Services/)                        │
│                                                                    │
│  ├── IWorkoutService.cs                                           │
│  ├── INutritionService.cs                                         │
│  ├── ICoachService.cs                                             │
│  ├── IAnalyticsService.cs                                         │
│  ├── IVoiceService.cs                                             │
│  └── IVectorSearchService.cs                                      │
│                                                                    │
│  REFERENCES: DomainLayer (Contracts, Models)                      │
└───────────────────────────────────────────────────────────────────┘
                              ↓ implemented by
┌───────────────────────────────────────────────────────────────────┐
│                  SERVICE IMPLEMENTATION LAYER                      │
│         (Core/Service/Services/)                                   │
│                                                                    │
│  ├── WorkoutService.cs          → IWorkoutService                 │
│  ├── NutritionService.cs        → INutritionService               │
│  ├── CoachService.cs            → ICoachService                   │
│  ├── AnalyticsService.cs        → IAnalyticsService               │
│  ├── VoiceService.cs            → IVoiceService                   │
│  └── VectorSearchService.cs     → IVectorSearchService            │
│                                                                    │
│  REFERENCES: ServiceAbstraction, DomainLayer, Persistence         │
└───────────────────────────────────────────────────────────────────┘
                    ↓                              ↓
┌─────────────────────────────────┐  ┌────────────────────────────────┐
│       DOMAIN LAYER               │  │    PERSISTENCE LAYER           │
│  (Core/DomainLayer/)             │  │  (Infrastructure/Persistence/) │
│                                  │  │                                │
│  Models/                         │  │  HttpClients/                  │
│  ├── WorkoutPlan.cs              │  │  ├── MLServiceClient.cs        │
│  ├── NutritionPlan.cs            │  │  ├── CoachServerClient.cs      │
│  ├── CoachMessage.cs             │  │  ├── AnalyticsClient.cs        │
│  ├── AnalyticsReport.cs          │  │  ├── WhisperClient.cs          │
│  └── VoiceTranscription.cs       │  │  └── TTSClient.cs              │
│                                  │  │                                │
│  Contracts/Requests/             │  │  Repositories/                 │
│  ├── GenerateWorkoutRequest.cs   │  │  ├── ChatMessageRepository.cs  │
│  ├── GenerateNutritionRequest.cs │  │  └── UsageRepository.cs        │
│  ├── SendMessageRequest.cs       │  │                                │
│  └── TranscribeAudioRequest.cs   │  │  REFERENCES: DomainLayer       │
│                                  │  │  + External Services (HTTP)    │
│  Contracts/Responses/            │  └────────────────────────────────┘
│  ├── WorkoutPlanResponse.cs      │
│  ├── NutritionPlanResponse.cs    │
│  ├── CoachMessageResponse.cs     │
│  └── TranscriptionResponse.cs    │
│                                  │
│  REFERENCES: NONE (pure domain)  │
└──────────────────────────────────┘
                              ↓ HTTP calls
┌───────────────────────────────────────────────────────────────────┐
│                    PYTHON ML SERVICES                              │
│                  (ml_models/)                                      │
│                                                                    │
│  ├── embedding_server.py         (port 5100)                      │
│  ├── coach_server/app.py         (port 5002)                      │
│  ├── analytics_server/app.py     (port 5005)                      │
│  ├── whisper_server/app.py       (port 5003)                      │
│  ├── tts_server/app.py           (port 5004)                      │
│  └── faiss_store.py                                               │
│                                                                    │
│  STANDALONE: Called via HTTP from Persistence layer               │
└───────────────────────────────────────────────────────────────────┘
```

---

## Dependency Rules (CRITICAL - MUST FOLLOW)

### ✅ ALLOWED Dependencies

| Layer | Can Reference |
|-------|---------------|
| **Controllers** | ServiceAbstraction (interfaces only) |
| **ServiceAbstraction** | DomainLayer (Contracts, Models only) |
| **Service** | ServiceAbstraction + DomainLayer + Persistence |
| **DomainLayer** | NOTHING (pure domain) |
| **Persistence** | DomainLayer + External services/DBs |
| **Python Services** | External libraries (Flask, etc.) |

### ❌ FORBIDDEN Dependencies

| Layer | CANNOT Reference |
|-------|------------------|
| **Controllers** | Service implementations, Persistence, DomainLayer directly |
| **ServiceAbstraction** | Service implementations, Persistence, Python services |
| **DomainLayer** | Any other layer (must remain pure) |
| **Service** | Python services directly (use Persistence layer) |

---

## Communication Flow

### Example: Generate Workout Plan

```
User Request
    ↓
WorkoutController.cs
    ↓ calls
IWorkoutService (interface)
    ↓ implemented by
WorkoutService.cs
    ↓ uses
MLServiceClient (Persistence layer)
    ↓ HTTP POST
coach_server/app.py (Python)
    ↓ uses
rag.py (retrieves from FAISS)
    ↓ returns JSON
MLServiceClient
    ↓ deserializes to
WorkoutPlanResponse (DomainLayer)
    ↓ returns to
WorkoutService
    ↓ returns to
WorkoutController
    ↓ returns to
User
```

---

## File Creation Checklist by Model

### Model 1: Workout Plan Generator

**Domain Layer** (`Core/DomainLayer/`):
- [ ] `Models/WorkoutPlan.cs`
- [ ] `Models/Exercise.cs`
- [ ] `Contracts/Requests/GenerateWorkoutRequest.cs`
- [ ] `Contracts/Responses/WorkoutPlanResponse.cs`

**Service Abstraction** (`Core/ServiceAbstraction/Services/`):
- [ ] `IWorkoutService.cs`

**Service** (`Core/Service/Services/`):
- [ ] `WorkoutService.cs`

**Persistence** (`Infrastructure/Persistence/`):
- [ ] `HttpClients/MLServiceClient.cs`

**Presentation** (`Graduation-Project/Controllers/`):
- [ ] `WorkoutController.cs`

**Python** (`ml_models/`):
- [x] `coach_server/app.py` (add `/generate/workout` route)
- [x] `coach_server/rag.py` (already implemented)

---

### Model 2: Nutrition Plan Generator

**Domain Layer** (`Core/DomainLayer/`):
- [ ] `Models/NutritionPlan.cs`
- [ ] `Models/Meal.cs`
- [ ] `Contracts/Requests/GenerateNutritionRequest.cs`
- [ ] `Contracts/Responses/NutritionPlanResponse.cs`

**Service Abstraction** (`Core/ServiceAbstraction/Services/`):
- [ ] `INutritionService.cs`

**Service** (`Core/Service/Services/`):
- [ ] `NutritionService.cs`

**Persistence**: Reuses `MLServiceClient`

**Presentation** (`Graduation-Project/Controllers/`):
- [ ] `NutritionController.cs`

**Python** (`ml_models/`):
- [ ] Add `/generate/nutrition` route to `coach_server/app.py`

---

### Model 3: AI Coach Assistant

**Domain Layer** (`Core/DomainLayer/`):
- [ ] `Models/CoachMessage.cs`
- [ ] `Models/Conversation.cs`
- [ ] `Models/ProactiveReminder.cs`
- [ ] `Contracts/Requests/SendMessageRequest.cs`
- [ ] `Contracts/Requests/ScheduleReminderRequest.cs`
- [ ] `Contracts/Responses/CoachMessageResponse.cs`

**Service Abstraction** (`Core/ServiceAbstraction/Services/`):
- [ ] `ICoachService.cs`
- [ ] `ISchedulerService.cs`

**Service** (`Core/Service/Services/`):
- [ ] `CoachService.cs`
- [ ] `SchedulerService.cs`

**Persistence** (`Infrastructure/Persistence/`):
- [ ] `HttpClients/CoachServerClient.cs`
- [ ] `Repositories/ChatMessageRepository.cs`

**Presentation** (`Graduation-Project/Controllers/`):
- [ ] `CoachController.cs`

**Python** (`ml_models/`):
- [x] `coach_server/app.py` (add `/coach/message` route)
- [x] `coach_server/scheduler.py` (already stubbed)

---

### Model 4: Analytics Engine

**Domain Layer** (`Core/DomainLayer/`):
- [ ] `Models/EquipmentUsageReport.cs`
- [ ] `Models/RevenueAnalysis.cs`
- [ ] `Models/MaintenancePrediction.cs`
- [ ] `Contracts/Requests/GetUsageAnalyticsRequest.cs`
- [ ] `Contracts/Responses/UsageAnalyticsResponse.cs`

**Service Abstraction** (`Core/ServiceAbstraction/Services/`):
- [ ] `IAnalyticsService.cs`

**Service** (`Core/Service/Services/`):
- [ ] `AnalyticsService.cs`

**Persistence** (`Infrastructure/Persistence/`):
- [ ] `HttpClients/AnalyticsServerClient.cs`
- [ ] `Repositories/EquipmentUsageRepository.cs`

**Presentation** (`Graduation-Project/Controllers/`):
- [ ] `AnalyticsController.cs`

**Python** (`ml_models/`):
- [x] `analytics_server/app.py` (already implemented)
- [x] `scripts/analytics/usage_etl.py`
- [x] `scripts/analytics/forecast_revenue.py`

---

### Model 5: Voice Integration

**Domain Layer** (`Core/DomainLayer/`):
- [ ] `Models/VoiceTranscription.cs`
- [ ] `Contracts/Requests/TranscribeAudioRequest.cs`
- [ ] `Contracts/Requests/SynthesizeSpeechRequest.cs`
- [ ] `Contracts/Responses/TranscriptionResponse.cs`
- [ ] `Contracts/Responses/AudioResponse.cs`

**Service Abstraction** (`Core/ServiceAbstraction/Services/`):
- [ ] `IVoiceService.cs`

**Service** (`Core/Service/Services/`):
- [ ] `VoiceService.cs`

**Persistence** (`Infrastructure/Persistence/`):
- [ ] `HttpClients/WhisperClient.cs`
- [ ] `HttpClients/TTSClient.cs`

**Presentation** (`Graduation-Project/Controllers/`):
- [ ] `VoiceController.cs`

**Python** (`ml_models/`):
- [x] `whisper_server/app.py` (already exists)
- [x] `tts_server/app.py` (already exists)

---

## Dependency Injection Setup

Add to `Graduation-Project/Program.cs`:

```csharp
// ML Services HTTP Clients
builder.Services.AddHttpClient();
builder.Services.AddScoped<MLServiceClient>();
builder.Services.AddScoped<CoachServerClient>();
builder.Services.AddScoped<AnalyticsServerClient>();
builder.Services.AddScoped<WhisperClient>();
builder.Services.AddScoped<TTSClient>();

// Repositories
builder.Services.AddScoped<ChatMessageRepository>();
builder.Services.AddScoped<EquipmentUsageRepository>();

// Services
builder.Services.AddScoped<IWorkoutService, WorkoutService>();
builder.Services.AddScoped<INutritionService, NutritionService>();
builder.Services.AddScoped<ICoachService, CoachService>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();
builder.Services.AddScoped<IVoiceService, VoiceService>();
builder.Services.AddScoped<IVectorSearchService, VectorSearchService>();
```

---

## Testing Layer Boundaries

Each layer should have tests that verify boundaries:

```csharp
// Test: Controller should only depend on interfaces
[Fact]
public void WorkoutController_ShouldOnlyDependOnInterface()
{
    var controller = new WorkoutController(Mock.Of<IWorkoutService>());
    // Should compile without errors
}

// Test: Service should not directly reference Python services
[Fact]
public void WorkoutService_ShouldUsePersistenceLayer()
{
    var service = new WorkoutService(Mock.Of<MLServiceClient>());
    // MLServiceClient is in Persistence layer - correct!
}

// Test: Domain models have no dependencies
[Fact]
public void WorkoutPlan_ShouldBeIndependent()
{
    var plan = new WorkoutPlan();
    // Should have no external references
}
```

---

## Common Mistakes to Avoid

❌ **DON'T DO THIS:**
```csharp
// Controller directly calling Python service
public class WorkoutController
{
    public async Task<IActionResult> Generate()
    {
        var httpClient = new HttpClient(); // WRONG!
        var response = await httpClient.PostAsync("http://localhost:5002/...");
    }
}

// Controller using concrete service
public class WorkoutController
{
    private readonly WorkoutService _service; // WRONG! Use interface
}

// Domain model with database dependency
public class WorkoutPlan
{
    public void SaveToDatabase() // WRONG! Domain should be pure
    {
        // Database code here
    }
}
```

✅ **DO THIS:**
```csharp
// Controller using interface
public class WorkoutController
{
    private readonly IWorkoutService _service; // CORRECT!
    
    public WorkoutController(IWorkoutService service)
    {
        _service = service;
    }
}

// Service using Persistence layer
public class WorkoutService : IWorkoutService
{
    private readonly MLServiceClient _client; // CORRECT!
    
    public async Task<WorkoutPlanResponse> GeneratePlan(...)
    {
        return await _client.PostAsync<WorkoutPlanResponse>(...);
    }
}

// Pure domain model
public class WorkoutPlan
{
    public Guid Id { get; set; }
    public string Goal { get; set; }
    // Only properties, no behavior with external dependencies
}
```

---

## Summary

✅ **YES - Clean Architecture Fully Specified**

Every file location specified with exact paths respecting:
- Presentation → ServiceAbstraction (interfaces)
- ServiceAbstraction → DomainLayer
- Service → ServiceAbstraction + DomainLayer + Persistence
- DomainLayer → Independent (no dependencies)
- Persistence → DomainLayer + External services
- Python services → Standalone (called via HTTP)

**No architecture violations. Ready for implementation.**
