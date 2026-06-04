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
        // No timeout — let the model take as long as it needs (cold-start can be several minutes).
        _httpClient.Timeout = System.Threading.Timeout.InfiniteTimeSpan;
    }

    public async Task<NutritionAIResponse?> GenerateNutritionPlanAsync(NutritionAIRequest request)
    {
        int maxRetries = 2;
        int delaySeconds = 5;

        for (int attempt = 1; attempt <= maxRetries + 1; attempt++)
        {
            try
            {
                _logger.LogInformation(
                    "Sending nutrition request to Modal GPU endpoint for member {MemberId} (Attempt {Attempt})",
                    request.MemberId, attempt);

                using var response = await _httpClient.PostAsJsonAsync("generate", request, _jsonOptions);

                if (!response.IsSuccessStatusCode)
                {
                    var body = await response.Content.ReadAsStringAsync();
                    _logger.LogWarning(
                        "Nutrition Modal endpoint returned status {Status} on attempt {Attempt}: {Body}",
                        response.StatusCode, attempt, body[..Math.Min(300, body.Length)]);

                    // Retry if it's a timeout (408), Bad Gateway (502), Gateway Timeout (504), or Service Unavailable (503)
                    if (attempt <= maxRetries && (response.StatusCode == System.Net.HttpStatusCode.RequestTimeout || 
                                                  response.StatusCode == System.Net.HttpStatusCode.BadGateway || 
                                                  response.StatusCode == System.Net.HttpStatusCode.GatewayTimeout ||
                                                  response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable))
                    {
                        _logger.LogInformation("Retrying Modal request in {Delay} seconds...", delaySeconds);
                        await Task.Delay(delaySeconds * 1000);
                        continue;
                    }

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
            catch (Exception ex) when (attempt <= maxRetries && (ex is HttpRequestException || ex is TaskCanceledException))
            {
                _logger.LogWarning(ex, "Transient error occurred on attempt {Attempt}. Retrying in {Delay} seconds...", attempt, delaySeconds);
                await Task.Delay(delaySeconds * 1000);
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Failed to connect to Nutrition Modal endpoint at {BaseUrl}", _baseUrl);
                return new NutritionAIResponse { Error = $"Modal endpoint unreachable: {ex.Message}" };
            }
            catch (TaskCanceledException)
            {
                return new NutritionAIResponse { Error = "Nutrition AI timed out — the model may still be warming up. Please wait 30 seconds and try again." };
            }
            catch (JsonException ex)
            {
                return new NutritionAIResponse { Error = $"Invalid response JSON: {ex.Message}" };
            }
        }

        return new NutritionAIResponse { Error = "Exceeded maximum retry attempts connecting to the AI model." };
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
