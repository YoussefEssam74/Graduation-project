using IntelliFit.ServiceAbstraction.Services;
using IntelliFit.Domain.Enums;
using Shared.DTOs.AI;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace IntelliFit.Service.Services.AI;

/// <summary>
/// RAG service implementation that communicates with the Python embedding server.
/// </summary>
public class RAGService : IRAGService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<RAGService> _logger;
    private readonly string _embeddingServerUrl;

    public RAGService(
        HttpClient httpClient,
        IOptions<EmbeddingServerOptions> options,
        ILogger<RAGService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _embeddingServerUrl = options.Value.BaseUrl ?? "http://localhost:5100";
    }

    public async Task<RAGQueryResult> QueryKnowledgeBaseAsync(RAGQueryRequest request)
    {
        try
        {
            var serverRequest = new
            {
                query = request.Query,
                category = request.Category,
                top_k = request.TopK,
                min_similarity = request.MinSimilarity,
                fitness_level = request.FitnessLevel
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"{_embeddingServerUrl}/knowledge/search", 
                serverRequest);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("RAG query failed: {StatusCode} - {Error}", response.StatusCode, error);
                return new RAGQueryResult { Success = false, Error = $"Server error: {response.StatusCode}" };
            }

            var result = await response.Content.ReadFromJsonAsync<EmbeddingServerSearchResponse>();
            
            return new RAGQueryResult
            {
                Success = true,
                Documents = result?.Results?.Select(r => new RAGDocument
                {
                    Id = r.Id,
                    Title = r.Metadata?.TryGetValue("title", out var title) == true ? title?.ToString() ?? "" : "",
                    Content = r.Text,
                    Category = r.Category,
                    SimilarityScore = r.Similarity
                }).ToList() ?? new(),
                TotalMatches = result?.Results?.Count ?? 0,
                FormattedContext = FormatContext(result?.Results)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "RAG query failed");
            return new RAGQueryResult { Success = false, Error = ex.Message };
        }
    }

    public async Task<RAGQueryResult> BuildWorkoutContextAsync(
        FitnessLevel fitnessLevel,
        string fitnessGoal,
        List<string>? injuries,
        List<string>? weakMuscleGroups)
    {
        // Build a comprehensive query from user context
        var queryParts = new List<string>
        {
            $"workout plan for {fitnessLevel} {fitnessGoal}"
        };

        if (injuries?.Any() == true)
        {
            queryParts.Add($"avoiding exercises for {string.Join(", ", injuries)}");
        }

        if (weakMuscleGroups?.Any() == true)
        {
            queryParts.Add($"focusing on {string.Join(", ", weakMuscleGroups)}");
        }

        var request = new RAGQueryRequest
        {
            Query = string.Join(" ", queryParts),
            TopK = 8,
            MinSimilarity = 0.25f,
            FitnessLevel = fitnessLevel.ToString()
        };

        return await QueryKnowledgeBaseAsync(request);
    }

    public async Task<int> AddKnowledgeAsync(KnowledgeAddRequest request)
    {
        try
        {
            var serverRequest = new
            {
                documents = new[]
                {
                    new
                    {
                        id = Guid.NewGuid().ToString(),
                        category = request.Category,
                        text = request.Content,
                        metadata = new
                        {
                            title = request.Title,
                            source = request.Source,
                            priority = request.Priority,
                            tags = request.Tags,
                            muscle_groups = request.MuscleGroups,
                            fitness_levels = request.FitnessLevels
                        }
                    }
                }
            };

            var response = await _httpClient.PostAsJsonAsync(
                $"{_embeddingServerUrl}/knowledge/upsert",
                serverRequest);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Added knowledge: {Title}", request.Title);
                return 1;
            }

            var errorContent = await response.Content.ReadAsStringAsync();
            _logger.LogError("Failed to add knowledge. Status: {StatusCode}, Reason: {Reason}, Body: {Body}, Title: {Title}",
                response.StatusCode, response.ReasonPhrase, errorContent, request.Title);
            return 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to add knowledge");
            return 0;
        }
    }

    public Task<bool> UpdateKnowledgeAsync(int id, KnowledgeUpdateRequest request)
    {
        // Would need to implement in embedding server
        _logger.LogWarning("UpdateKnowledge not implemented");
        return Task.FromResult(false);
    }

    public Task<bool> DeleteKnowledgeAsync(int id)
    {
        // Would need to implement in embedding server
        _logger.LogWarning("DeleteKnowledge not implemented");
        return Task.FromResult(false);
    }

    public Task<int> ReembedAllKnowledgeAsync()
    {
        // Would trigger re-embedding in embedding server
        _logger.LogWarning("ReembedAllKnowledge not implemented");
        return Task.FromResult(0);
    }

    public async Task<KnowledgeBaseStats> GetStatsAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync($"{_embeddingServerUrl}/knowledge/stats");
            
            if (response.IsSuccessStatusCode)
            {
                var stats = await response.Content.ReadFromJsonAsync<EmbeddingServerStatsResponse>();
                return new KnowledgeBaseStats
                {
                    TotalDocuments = stats?.TotalDocuments ?? 0,
                    ActiveDocuments = stats?.ActiveDocuments ?? 0,
                    DocumentsByCategory = stats?.ByCategory ?? new(),
                    LastUpdated = stats?.LastUpdated ?? DateTime.UtcNow
                };
            }
            
            var errorContent = await response.Content.ReadAsStringAsync();
            _logger.LogError("Failed to get knowledge stats. Status: {StatusCode}, Reason: {Reason}, Body: {Body}",
                response.StatusCode, response.ReasonPhrase, errorContent);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get knowledge stats");
        }

        return new KnowledgeBaseStats();
    }

    private string? FormatContext(List<SearchResultItem>? results)
    {
        if (results == null || !results.Any()) return null;

        return string.Join("\n\n", results.Select(r => 
            $"[{r.Category}] {r.Text}"));
    }

    // Response DTOs
    private class EmbeddingServerSearchResponse
    {
        [JsonPropertyName("results")]
        public List<SearchResultItem>? Results { get; set; }
    }

    private class SearchResultItem
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = "";

        [JsonPropertyName("category")]
        public string Category { get; set; } = "";

        [JsonPropertyName("text")]
        public string Text { get; set; } = "";

        [JsonPropertyName("similarity")]
        public float Similarity { get; set; }

        [JsonPropertyName("metadata")]
        public Dictionary<string, object>? Metadata { get; set; }
    }

    private class EmbeddingServerStatsResponse
    {
        [JsonPropertyName("total_documents")]
        public int TotalDocuments { get; set; }

        [JsonPropertyName("active_documents")]
        public int ActiveDocuments { get; set; }

        [JsonPropertyName("by_category")]
        public Dictionary<string, int> ByCategory { get; set; } = new();

        [JsonPropertyName("last_updated")]
        public DateTime LastUpdated { get; set; }
    }
}

/// <summary>
/// Configuration for embedding server.
/// </summary>
public class EmbeddingServerOptions
{
    public const string SectionName = "EmbeddingServer";
    public string BaseUrl { get; set; } = "http://localhost:5100";
}
