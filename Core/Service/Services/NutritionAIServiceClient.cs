using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ServiceAbstraction.Services;
using Shared.DTOs.NutritionAI;

namespace Service.Services;

/// <summary>
/// HTTP client for the Nutrition AI on Modal GPU (FastAPI endpoint).
/// Uses a simple POST /generate request — no Gradio queue protocol required.
/// </summary>
public class NutritionAIServiceClient : INutritionAIServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<NutritionAIServiceClient> _logger;
    private readonly string _baseUrl;
    private readonly JsonSerializerOptions _jsonOptions;

    public NutritionAIServiceClient(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<NutritionAIServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _baseUrl = (configuration["MLService:NutritionBaseUrl"] ?? "http://localhost:5301").TrimEnd('/');

        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true,
        };

        _httpClient.BaseAddress = new Uri(_baseUrl + "/");
        // Modal container timeout is 120 s; allow 130 s for network overhead.
        _httpClient.Timeout = TimeSpan.FromSeconds(130);
    }

    public async Task<NutritionAIResponse?> GenerateNutritionPlanAsync(NutritionAIRequest request)
    {
        try
        {
            _logger.LogInformation(
                "Sending nutrition request to Modal GPU endpoint for member {MemberId}", request.MemberId);

            using var response = await _httpClient.PostAsJsonAsync("generate", request, _jsonOptions);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogError(
                    "Nutrition Modal endpoint returned {Status}: {Body}",
                    response.StatusCode, body[..Math.Min(300, body.Length)]);
                return new NutritionAIResponse { Error = $"Modal endpoint error {(int)response.StatusCode}: {body[..Math.Min(200, body.Length)]}" };
            }

            var result = await response.Content.ReadFromJsonAsync<NutritionAIResponse>(_jsonOptions);

            if (result?.Error is not null)
            {
                _logger.LogError("Nutrition Modal returned an error: {Error}", result.Error);
                return result;
            }

            _logger.LogInformation(
                "Nutrition plan generated: calories={Cal}, latency={Ms}ms",
                result?.DailyCalories, result?.GenerationMs);

            return result;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to connect to Nutrition Modal endpoint at {BaseUrl}", _baseUrl);
            return new NutritionAIResponse { Error = $"Modal endpoint unreachable: {ex.Message}" };
        }
        catch (TaskCanceledException)
        {
            return new NutritionAIResponse { Error = "Nutrition Modal endpoint timed out (130s)" };
        }
        catch (JsonException ex)
        {
            return new NutritionAIResponse { Error = $"Invalid response JSON: {ex.Message}" };
        }
    }

    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            var resp = await _httpClient.GetAsync("health");
            return resp.IsSuccessStatusCode;
        }
        catch { return false; }
    }
}
