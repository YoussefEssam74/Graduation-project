using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ServiceAbstraction.Services;
using Shared.DTOs.WorkoutAI;

namespace Service.Services;

/// <summary>
/// HTTP client for the Workout AI on Hugging Face Spaces.
/// Calls the FastAPI POST /generate endpoint directly — no Gradio queue SSE needed.
/// </summary>
public class MLServiceClient : IMLServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<MLServiceClient> _logger;
    private readonly string _baseUrl;
    private readonly JsonSerializerOptions _jsonOptions;

    public MLServiceClient(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<MLServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _baseUrl = configuration["MLService:BaseUrl"] ?? "http://localhost:5300";

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        _httpClient.BaseAddress = new Uri(_baseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(360);
    }

    public async Task<MLWorkoutResponse?> GenerateWorkoutPlanAsync(MLWorkoutRequest request)
    {
        try
        {
            _logger.LogInformation("Sending workout request to HF Space (POST /generate) for user {UserId}", request.UserId);

            var content = JsonContent.Create(request, options: _jsonOptions);
            using var resp = await _httpClient.PostAsync("/generate", content);
            var body = await resp.Content.ReadAsStringAsync();

            if (!resp.IsSuccessStatusCode)
            {
                _logger.LogError("POST /generate failed {Status}: {Error}", resp.StatusCode, body[..Math.Min(200, body.Length)]);
                return new MLWorkoutResponse { IsValidJson = false, Error = $"Generate failed {resp.StatusCode}: {body[..Math.Min(200, body.Length)]}" };
            }

            var result = JsonSerializer.Deserialize<MLWorkoutResponse>(body, _jsonOptions);
            _logger.LogInformation("Workout plan generated: valid={Valid}, latency={Latency}ms",
                result?.IsValidJson, result?.GenerationLatencyMs);
            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to connect to HF Space at {BaseUrl}", _baseUrl);
            return new MLWorkoutResponse { IsValidJson = false, Error = $"HF Space unreachable: {ex.Message}" };
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogError(ex, "HF Space request timed out");
            return new MLWorkoutResponse { IsValidJson = false, Error = "HF Space request timed out (360s)" };
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize HF Space response");
            return new MLWorkoutResponse { IsValidJson = false, Error = $"Invalid response JSON: {ex.Message}" };
        }
    }

    public async Task<MLHealthResponse?> CheckHealthAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync("/");
            return response.IsSuccessStatusCode
                ? new MLHealthResponse { Status = "healthy" }
                : null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "HF Space health check failed");
            return null;
        }
    }
}
