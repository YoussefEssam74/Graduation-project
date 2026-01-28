using IntelliFit.Domain.Enums;
using Shared.DTOs.AI;

namespace IntelliFit.ServiceAbstraction.Services;

/// <summary>
/// Service for RAG (Retrieval-Augmented Generation) operations
/// Manages fitness knowledge base and vector similarity search
/// </summary>
public interface IRAGService
{
    /// <summary>
    /// Query the knowledge base for relevant context
    /// </summary>
    Task<RAGQueryResult> QueryKnowledgeBaseAsync(RAGQueryRequest request);
    
    /// <summary>
    /// Build context for workout generation based on user profile
    /// </summary>
    Task<RAGQueryResult> BuildWorkoutContextAsync(
        FitnessLevel fitnessLevel,
        string fitnessGoal,
        List<string>? injuries,
        List<string>? weakMuscleGroups);
    
    /// <summary>
    /// Add new knowledge to the knowledge base
    /// </summary>
    Task<int> AddKnowledgeAsync(KnowledgeAddRequest request);
    
    /// <summary>
    /// Update existing knowledge and re-embed
    /// </summary>
    Task<bool> UpdateKnowledgeAsync(int id, KnowledgeUpdateRequest request);
    
    /// <summary>
    /// Delete knowledge from the knowledge base
    /// </summary>
    Task<bool> DeleteKnowledgeAsync(int id);
    
    /// <summary>
    /// Re-embed all knowledge (after model update)
    /// </summary>
    Task<int> ReembedAllKnowledgeAsync();
    
    /// <summary>
    /// Get knowledge base statistics
    /// </summary>
    Task<KnowledgeBaseStats> GetStatsAsync();
}

/// <summary>
/// Request to add new knowledge
/// </summary>
public class KnowledgeAddRequest
{
    public string Title { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string? Subcategory { get; set; }
    public string Source { get; set; } = "expert_guideline";
    public float Priority { get; set; } = 1.0f;
    public List<string>? Tags { get; set; }
    public List<string>? MuscleGroups { get; set; }
    public List<string>? FitnessLevels { get; set; }
}

/// <summary>
/// Request to update knowledge
/// </summary>
public class KnowledgeUpdateRequest
{
    public string? Title { get; set; }
    public string? Content { get; set; }
    public string? Category { get; set; }
    public string? Subcategory { get; set; }
    public float? Priority { get; set; }
    public List<string>? Tags { get; set; }
    public bool? IsActive { get; set; }
}

/// <summary>
/// Knowledge base statistics
/// </summary>
public class KnowledgeBaseStats
{
    public int TotalDocuments { get; set; }
    public int ActiveDocuments { get; set; }
    public Dictionary<string, int> DocumentsByCategory { get; set; } = new();
    public int TotalRetrievals { get; set; }
    public float AverageRelevanceScore { get; set; }
    public DateTime LastUpdated { get; set; }
}
