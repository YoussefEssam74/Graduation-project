using IntelliFit.ServiceAbstraction.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace IntelliFit.Service.Services.AI;

/// <summary>
/// LLM workout generation service that communicates with Flan-T5 Python server.
/// </summary>
public class LLMWorkoutService : ILLMWorkoutService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<LLMWorkoutService> _logger;
    private readonly string _llmServerUrl;

    public LLMWorkoutService(
        HttpClient httpClient,
        IOptions<LLMServerOptions> options,
        ILogger<LLMWorkoutService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _llmServerUrl = options.Value.BaseUrl ?? "http://localhost:5300";
    }

    public async Task<LLMGenerationResult> GenerateAsync(string prompt, float temperature = 0.7f)
    {
        try
        {
            var request = new
            {
                prompt = prompt,
                max_length = 1024,
                temperature = temperature
            };

            _logger.LogInformation("Sending prompt to LLM: {Length} chars", prompt.Length);

            var response = await _httpClient.PostAsJsonAsync($"{_llmServerUrl}/generate", request);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("LLM generation failed: {StatusCode} - {Error}", response.StatusCode, error);
                return LLMGenerationResult.CreateError($"Server error: {response.StatusCode}");
            }

            return await ParseLLMResponse(response);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to connect to LLM server at {Url}", _llmServerUrl);
            return LLMGenerationResult.CreateError("LLM server unavailable");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during LLM generation");
            return LLMGenerationResult.CreateError("An error occurred during LLM generation");
        }
    }

    public async Task<LLMGenerationResult> GenerateStructuredAsync(LLMWorkoutRequest request)
    {
        try
        {
            var serverRequest = new
            {
                fitness_level = request.FitnessLevel,
                goal = request.Goal,
                days_per_week = request.DaysPerWeek,
                injuries = request.Injuries,
                weak_muscles = request.WeakMuscles,
                rag_context = request.RAGContext,
                max_length = request.MaxLength,
                temperature = request.Temperature
            };

            _logger.LogInformation("Generating workout for {Level} user, {Days} days/week",
                request.FitnessLevel, request.DaysPerWeek);

            var response = await _httpClient.PostAsJsonAsync($"{_llmServerUrl}/generate-structured", serverRequest);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("LLM structured generation failed: {StatusCode} - {Error}", response.StatusCode, error);
                return LLMGenerationResult.CreateError($"Server error: {response.StatusCode}");
            }

            return await ParseLLMResponse(response);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to connect to LLM server at {Url}", _llmServerUrl);
            return LLMGenerationResult.CreateError("LLM server unavailable");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during structured LLM generation");
            return LLMGenerationResult.CreateError("An error occurred during LLM generation");
        }
    }

    public async Task<bool> IsHealthyAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_llmServerUrl}/health");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private async Task<LLMGenerationResult> ParseLLMResponse(HttpResponseMessage response)
    {
        var serverResponse = await response.Content.ReadFromJsonAsync<LLMServerResponse>();

        if (serverResponse == null)
        {
            return LLMGenerationResult.CreateError("Empty response from LLM server");
        }

        var result = new LLMGenerationResult
        {
            Success = serverResponse.Success,
            RawText = serverResponse.RawText,
            Error = serverResponse.Error
        };

        if (serverResponse.Plan != null)
        {
            result.Plan = new GeneratedWorkoutPlan
            {
                PlanName = serverResponse.Plan.PlanName,
                DurationWeeks = serverResponse.Plan.DurationWeeks,
                Days = serverResponse.Plan.Days?.Select(d => new GeneratedWorkoutDay
                {
                    Day = d.Day,
                    Focus = d.Focus,
                    Exercises = d.Exercises?.Select(e => new GeneratedExercise
                    {
                        Name = e.Name,
                        Sets = e.Sets,
                        Reps = e.Reps,
                        RestSeconds = e.RestSeconds,
                        Notes = e.Notes
                    }).ToList() ?? new()
                }).ToList() ?? new()
            };
        }

        return result;
    }

    // Response DTOs
    private class LLMServerResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("plan")]
        public PlanResponse? Plan { get; set; }

        [JsonPropertyName("raw_text")]
        public string? RawText { get; set; }

        [JsonPropertyName("error")]
        public string? Error { get; set; }
    }

    private class PlanResponse
    {
        [JsonPropertyName("plan_name")]
        public string PlanName { get; set; } = "";

        [JsonPropertyName("duration_weeks")]
        public int DurationWeeks { get; set; }

        [JsonPropertyName("days")]
        public List<DayResponse>? Days { get; set; }
    }

    private class DayResponse
    {
        [JsonPropertyName("day")]
        public int Day { get; set; }

        [JsonPropertyName("focus")]
        public string Focus { get; set; } = "";

        [JsonPropertyName("exercises")]
        public List<ExerciseResponse>? Exercises { get; set; }
    }

    private class ExerciseResponse
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";

        [JsonPropertyName("sets")]
        public int Sets { get; set; }

        [JsonPropertyName("reps")]
        public int Reps { get; set; }

        [JsonPropertyName("rest_seconds")]
        public int RestSeconds { get; set; }

        [JsonPropertyName("notes")]
        public string Notes { get; set; } = "";
    }
}

/// <summary>
/// Configuration for LLM server.
/// </summary>
public class LLMServerOptions
{
    public const string SectionName = "LLMServer";
    public string BaseUrl { get; set; } = "http://localhost:5300";
}
