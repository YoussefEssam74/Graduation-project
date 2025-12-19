# AI Coach Assistant Implementation Guide (Local-First Architecture)

## Overview

A fully local, privacy-focused conversational AI coach that runs on your infrastructure using Docker.
- 🎙️ **Voice Calls**: Local execution via Whisper (STT) and Piper (TTS).
- 💬 **Text Chat**: Chat-based coaching using a fine-tuned Llama 3 model (served via Flask).
- 🔒 **Privacy**: No external APIs (OpenAI/Azure) used. Data stays on your servers.

## Architecture

| Component | Tech Stack | Port | Description |
| :--- | :--- | :--- | :--- |
| **Backend** | .NET 8 Web API | 5000 | Orchestrates flow, manages history. |
| **LLM Server** | Python/Flask + Llama 3 | 5002 | Generates coaching responses. |
| **STT Server** | Python/Flask + Whisper | 5003 | Transcribes voice audio to text. |
| **TTS Server** | Python/Flask + Piper | 5004 | Synthesizes text responses to audio. |
| **Analytics Server** | Python/Pandas + Sklearn | 5005 | Equipment usage, revenue prediction, maintenance forecasting. |

---

## Phase 1: Backend API Setup (.NET)

You will create HTTP clients to communicate with the local Python microservices instead of using SDKs like `OpenAIClient`.

### 1.1 Create DTOs for Local AI

**File:** `Core/DTOs/AI/LocalAIRequests.cs`

```csharp
namespace IntelliFit.Core.DTOs.AI
{
    public class ChatRequestDto
    {
        public List<ChatMessageDto> Messages { get; set; } = new();
        public UserContextDto UserContext { get; set; }
    }

    public class ChatMessageDto
    {
        public string Role { get; set; } // "user", "assistant", "system"
        public string Content { get; set; }
    }

    public class UserContextDto
    {
        public string Name { get; set; }
        public int Age { get; set; }
        public double Weight { get; set; }
        public double Height { get; set; }
        public string FitnessLevel { get; set; }
        public string FitnessGoal { get; set; }
    }
    
    public class TranscriptionResponse
    {
        public string Text { get; set; }
        public string Language { get; set; }
    }
}
```

### 1.2 Implement Local AI Service

**File:** `Infrastructure/Services/LocalAICoachService.cs`

```csharp
using System.Net.Http.Json;
using IntelliFit.Core.Interfaces;

public class LocalAICoachService : IAICoachService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<LocalAICoachService> _logger;
    private const string LLM_URL = "http://localhost:5002/chat";
    private const string STT_URL = "http://localhost:5003/transcribe";
    private const string TTS_URL = "http://localhost:5004/synthesize";

    public LocalAICoachService(HttpClient httpClient, ILogger<LocalAICoachService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<string> GetChatResponseAsync(int userId, string message, CoachContext context)
    {
        var request = new ChatRequestDto
        {
            Messages = new List<ChatMessageDto> 
            { 
                new ChatMessageDto { Role = "user", Content = message } 
            },
            UserContext = MapContextToDto(context)
        };

        var response = await _httpClient.PostAsJsonAsync(LLM_URL, request);
        response.EnsureSuccessStatusCode();
        
        var result = await response.Content.ReadFromJsonAsync<JsonElement>();
        return result.GetProperty("response").GetString();
    }

    public async Task<string> TranscribeAudioAsync(Stream audioStream)
    {
        using var content = new MultipartFormDataContent();
        using var streamContent = new StreamContent(audioStream);
        content.Add(streamContent, "audio", "input.wav");

        var response = await _httpClient.PostAsync(STT_URL, content);
        response.EnsureSuccessStatusCode();
        
        var result = await response.Content.ReadFromJsonAsync<TranscriptionResponse>();
        return result.Text;
    }

    public async Task<byte[]> SynthesizeSpeechAsync(string text)
    {
        var request = new { text = text };
        var response = await _httpClient.PostAsJsonAsync(TTS_URL, request);
        response.EnsureSuccessStatusCode();
        
        return await response.Content.ReadAsByteArrayAsync();
    }

    private UserContextDto MapContextToDto(CoachContext context) 
    {
        // ... mapping logic ...
        return new UserContextDto 
        {
            Name = context.User.FirstName,
            // ...
        };
    }
}
```

---

## Phase 2: Python Microservices

Ensure `docker-compose.yml` is running. The services are located in `ml_models/`.

### 2.1 Verify Services

Run `docker-compose up -d` and check health:

- **LLM**: `curl http://localhost:5002/health`
- **Whisper**: `curl http://localhost:5003/health`
- **TTS**: `curl http://localhost:5004/health`

### 2.2 Model Management

- **Llama 3**: Place model files (safetensors, config.json) in `models/intellifit-llama-3b`.
- **Whisper**: Downloads 'base' model automatically on first run.
- **Piper**: Place ONNX model files in `models/` directory for TTS.

---

## Phase 3: Frontend Integration

Update your Frontend Service to call your .NET API endpoints, which will proxy requests to these local Python services.

**Do NOT calls these Python ports 5002/5003/5004 directly from the browser.** Always go through your .NET API for security and authentication.
