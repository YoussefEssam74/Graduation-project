using IntelliFit.ServiceAbstraction.Services;
using Shared.DTOs.AI;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace IntelliFit.Service.Services.AI;

/// <summary>
/// Vision analysis service that communicates with CLIP-based Python server.
/// </summary>
public class VisionAnalysisService : IVisionAnalysisService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<VisionAnalysisService> _logger;
    private readonly string _visionServerUrl;

    public VisionAnalysisService(
        HttpClient httpClient,
        IOptions<VisionServerOptions> options,
        ILogger<VisionAnalysisService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _visionServerUrl = options.Value.BaseUrl ?? "http://localhost:5200";
    }

    public async Task<VisionAnalysisResult> AnalyzeBodyImageAsync(VisionAnalysisRequest request)
    {
        try
        {
            if (request.ImageBytes != null && request.ImageBytes.Length > 0)
            {
                return await AnalyzeBodyBytesAsync(request.ImageBytes, request.UserId);
            }
            else if (!string.IsNullOrEmpty(request.ImageBase64))
            {
                return await AnalyzeBodyBase64Async(request.ImageBase64, request.UserId);
            }
            
            return CreateSkippedResult();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Vision analysis failed for user {UserId}", request.UserId);
            return new VisionAnalysisResult
            {
                Success = false,
                Error = "An error occurred during vision analysis"
            };
        }
    }

    private async Task<VisionAnalysisResult> AnalyzeBodyBytesAsync(byte[] imageBytes, int userId)
    {
        using var content = new MultipartFormDataContent();
        using var imageContent = new ByteArrayContent(imageBytes);
        
        // Detect MIME type from byte header
        var mimeType = DetectImageMimeType(imageBytes);
        imageContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(mimeType);
        content.Add(imageContent, "file", "body_image.jpg");

        var response = await _httpClient.PostAsync($"{_visionServerUrl}/analyze", content);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("Vision server error: {StatusCode} - {Error}", response.StatusCode, error);
            return new VisionAnalysisResult { Success = false, Error = $"Server error: {response.StatusCode}" };
        }

        return await ParseVisionResponse(response, userId);
    }

    private async Task<VisionAnalysisResult> AnalyzeBodyBase64Async(string base64Image, int userId)
    {
        var request = new { image_base64 = base64Image };
        var response = await _httpClient.PostAsJsonAsync($"{_visionServerUrl}/analyze-base64", request);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            _logger.LogError("Vision server error: {StatusCode} - {Error}", response.StatusCode, error);
            return new VisionAnalysisResult { Success = false, Error = $"Server error: {response.StatusCode}" };
        }

        return await ParseVisionResponse(response, userId);
    }

    private async Task<VisionAnalysisResult> ParseVisionResponse(HttpResponseMessage response, int userId)
    {
        var serverResponse = await response.Content.ReadFromJsonAsync<VisionServerResponse>();
        
        if (serverResponse == null)
        {
            return new VisionAnalysisResult { Success = false, Error = "Empty response from vision server" };
        }

        var result = new VisionAnalysisResult
        {
            Success = serverResponse.Success,
            Error = serverResponse.Error,
            IsReliable = serverResponse.IsReliable,
            OverallConfidence = serverResponse.OverallConfidence,
            WeakMuscles = serverResponse.WeakMuscles ?? new(),
            Suggestions = serverResponse.Suggestions ?? new()
        };

        if (serverResponse.Chest != null)
        {
            result.Chest = MapMuscleAnalysis(serverResponse.Chest);
        }
        if (serverResponse.Arms != null)
        {
            result.Arms = MapMuscleAnalysis(serverResponse.Arms);
        }
        if (serverResponse.Shoulders != null)
        {
            result.Shoulders = MapMuscleAnalysis(serverResponse.Shoulders);
        }
        if (serverResponse.BodyComposition != null)
        {
            result.BodyComposition = MapMuscleAnalysis(serverResponse.BodyComposition);
        }

        _logger.LogInformation("Vision analysis for user {UserId}: {WeakCount} weak muscles, reliable: {Reliable}",
            userId, result.WeakMuscles.Count, result.IsReliable);

        return result;
    }

    private MuscleGroupAnalysis MapMuscleAnalysis(MuscleGroupResponse response)
    {
        return new MuscleGroupAnalysis
        {
            Status = response.Status,
            Confidence = response.Confidence,
            AllScores = response.AllScores ?? new()
        };
    }

    private VisionAnalysisResult CreateSkippedResult()
    {
        return new VisionAnalysisResult
        {
            Success = false,
            Error = "No image provided - vision analysis skipped",
            IsReliable = false
        };
    }

    public Task<VisionAnalysisResult?> GetLatestAnalysisAsync(int userId)
    {
        // Would query database for cached analysis
        _logger.LogDebug("GetLatestAnalysis not implemented (would need database)");
        return Task.FromResult<VisionAnalysisResult?>(null);
    }

    public Task<VisionAnalysisResult?> GetAnalysisByIdAsync(int analysisId)
    {
        // Would query database
        return Task.FromResult<VisionAnalysisResult?>(null);
    }

    public Task<bool> HasValidCachedAnalysisAsync(int userId, int maxAgeDays = 7)
    {
        // Would check database cache
        return Task.FromResult(false);
    }

    public Task<bool> DeleteAnalysisAsync(int analysisId)
    {
        // Would delete from database
        return Task.FromResult(false);
    }

    public Task<List<VisionAnalysisResult>> GetUserAnalysisHistoryAsync(int userId)
    {
        return Task.FromResult(new List<VisionAnalysisResult>());
    }

    public async Task<bool> IsServiceHealthyAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_visionServerUrl}/health");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private string DetectImageMimeType(byte[] imageBytes)
    {
        if (imageBytes.Length >= 2)
        {
            // PNG: 89 50 4E 47
            if (imageBytes[0] == 0x89 && imageBytes[1] == 0x50)
                return "image/png";
            
            // JPEG: FF D8
            if (imageBytes[0] == 0xFF && imageBytes[1] == 0xD8)
                return "image/jpeg";
            
            // GIF: 47 49 46
            if (imageBytes[0] == 0x47 && imageBytes[1] == 0x49)
                return "image/gif";
            
            // WebP: 52 49 46 46
            if (imageBytes.Length >= 4 && imageBytes[0] == 0x52 && imageBytes[1] == 0x49)
                return "image/webp";
        }
        
        // Default to JPEG
        return "image/jpeg";
    }

    // Response DTOs
    private class VisionServerResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("chest")]
        public MuscleGroupResponse? Chest { get; set; }

        [JsonPropertyName("arms")]
        public MuscleGroupResponse? Arms { get; set; }

        [JsonPropertyName("shoulders")]
        public MuscleGroupResponse? Shoulders { get; set; }

        [JsonPropertyName("body_composition")]
        public MuscleGroupResponse? BodyComposition { get; set; }

        [JsonPropertyName("weak_muscles")]
        public List<string>? WeakMuscles { get; set; }

        [JsonPropertyName("overall_confidence")]
        public float OverallConfidence { get; set; }

        [JsonPropertyName("is_reliable")]
        public bool IsReliable { get; set; }

        [JsonPropertyName("error")]
        public string? Error { get; set; }

        [JsonPropertyName("suggestions")]
        public List<string>? Suggestions { get; set; }
    }

    private class MuscleGroupResponse
    {
        [JsonPropertyName("status")]
        public string Status { get; set; } = "";

        [JsonPropertyName("confidence")]
        public float Confidence { get; set; }

        [JsonPropertyName("all_scores")]
        public Dictionary<string, float>? AllScores { get; set; }
    }
}

/// <summary>
/// Configuration for vision server.
/// </summary>
public class VisionServerOptions
{
    public const string SectionName = "VisionServer";
    public string BaseUrl { get; set; } = "http://localhost:5200";
}
