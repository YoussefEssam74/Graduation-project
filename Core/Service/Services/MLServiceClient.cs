using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ServiceAbstraction.Services;
using Shared.DTOs.WorkoutAI;

namespace Service.Services;

/// <summary>
/// HTTP client for the Workout AI on Hugging Face Spaces (Gradio SDK).
/// HF Spaces always enables the Gradio queue, so we use the queue SSE protocol:
///   1. POST /queue/join  — enqueue the job and send input data
///   2. GET  /queue/data  — read Server-Sent Events until process_completed
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
        var sessionHash = Guid.NewGuid().ToString("N")[..12];

        try
        {
            _logger.LogInformation("Sending workout request to HF Space (queue protocol) for user {UserId}", request.UserId);

            // ── Step 1: Join the Gradio queue ─────────────────────────────────
            var innerJson = JsonSerializer.Serialize(request, _jsonOptions);
            var joinPayload = JsonSerializer.Serialize(new
            {
                data = new[] { innerJson },
                fn_index = 0,
                session_hash = sessionHash
            });

            var joinResp = await _httpClient.PostAsync("/queue/join",
                new StringContent(joinPayload, Encoding.UTF8, "application/json"));

            if (!joinResp.IsSuccessStatusCode)
            {
                var err = await joinResp.Content.ReadAsStringAsync();
                _logger.LogError("Queue join failed {Status}: {Error}", joinResp.StatusCode, err);
                return new MLWorkoutResponse { IsValidJson = false, Error = $"Queue join failed {joinResp.StatusCode}: {err[..Math.Min(200, err.Length)]}" };
            }

            // ── Step 2: Read SSE stream until process_completed ───────────────
            var sseRequest = new HttpRequestMessage(HttpMethod.Get, $"/queue/data?session_hash={sessionHash}");
            sseRequest.Headers.Accept.ParseAdd("text/event-stream");

            using var sseResp = await _httpClient.SendAsync(sseRequest, HttpCompletionOption.ResponseHeadersRead);
            using var stream = await sseResp.Content.ReadAsStreamAsync();
            using var reader = new StreamReader(stream);

            var deadline = DateTime.UtcNow.AddSeconds(350);

            while (!reader.EndOfStream && DateTime.UtcNow < deadline)
            {
                var line = await reader.ReadLineAsync();
                if (line == null) break;
                if (!line.StartsWith("data: ")) continue;

                var eventJson = line[6..].Trim();
                if (string.IsNullOrEmpty(eventJson)) continue;

                using var doc = JsonDocument.Parse(eventJson);
                var msg = doc.RootElement.TryGetProperty("msg", out var msgProp)
                    ? msgProp.GetString() : null;

                _logger.LogDebug("Gradio queue event: {Msg}", msg);

                if (msg == "process_completed")
                {
                    if (!doc.RootElement.TryGetProperty("output", out var output) ||
                        !output.TryGetProperty("data", out var dataArr) ||
                        dataArr.ValueKind != JsonValueKind.Array ||
                        dataArr.GetArrayLength() == 0)
                    {
                        return new MLWorkoutResponse { IsValidJson = false, Error = "Empty output in process_completed event" };
                    }

                    var resultStr = dataArr[0].GetString();
                    if (string.IsNullOrWhiteSpace(resultStr))
                        return new MLWorkoutResponse { IsValidJson = false, Error = "Empty result string from Gradio" };

                    var result = JsonSerializer.Deserialize<MLWorkoutResponse>(resultStr, _jsonOptions);
                    _logger.LogInformation("Workout plan generated: valid={Valid}, latency={Latency}ms",
                        result?.IsValidJson, result?.GenerationLatencyMs);
                    return result;
                }

                if (msg == "process_error")
                {
                    var err = doc.RootElement.TryGetProperty("error", out var errProp)
                        ? errProp.GetString() : "Unknown processing error";
                    _logger.LogError("Gradio process_error: {Error}", err);
                    return new MLWorkoutResponse { IsValidJson = false, Error = $"Gradio error: {err}" };
                }
            }

            return new MLWorkoutResponse { IsValidJson = false, Error = "Gradio queue timed out waiting for result" };
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
