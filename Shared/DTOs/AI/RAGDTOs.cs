namespace Shared.DTOs.AI;

/// <summary>
/// Request for RAG knowledge base query.
/// </summary>
public class RAGQueryRequest
{
    /// <summary>Natural language query</summary>
    public string Query { get; set; } = string.Empty;
    
    /// <summary>Optional category filter</summary>
    public string? Category { get; set; }
    
    /// <summary>Number of results to return</summary>
    public int TopK { get; set; } = 5;
    
    /// <summary>Minimum similarity threshold (0.0 - 1.0)</summary>
    public float MinSimilarity { get; set; } = 0.3f;
    
    /// <summary>Optional fitness level filter</summary>
    public string? FitnessLevel { get; set; }
    
    /// <summary>Optional muscle groups to focus on</summary>
    public List<string>? MuscleGroups { get; set; }
}

/// <summary>
/// Result from RAG knowledge base query.
/// </summary>
public class RAGQueryResult
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public List<RAGDocument> Documents { get; set; } = new();
    public int TotalMatches { get; set; }
    public string? FormattedContext { get; set; }
}

/// <summary>
/// Single document retrieved from knowledge base.
/// </summary>
public class RAGDocument
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public float SimilarityScore { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}
