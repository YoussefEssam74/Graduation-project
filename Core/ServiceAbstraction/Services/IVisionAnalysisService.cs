using Shared.DTOs.AI;

namespace IntelliFit.ServiceAbstraction.Services;

/// <summary>
/// Service for CLIP-based body image analysis
/// Analyzes muscle development and body composition
/// </summary>
public interface IVisionAnalysisService
{
    /// <summary>
    /// Analyze a body image for muscle development and fat distribution
    /// </summary>
    Task<VisionAnalysisResult> AnalyzeBodyImageAsync(VisionAnalysisRequest request);
    
    /// <summary>
    /// Get the latest analysis for a user
    /// </summary>
    Task<VisionAnalysisResult?> GetLatestAnalysisAsync(int userId);
    
    /// <summary>
    /// Get analysis by ID
    /// </summary>
    Task<VisionAnalysisResult?> GetAnalysisByIdAsync(int analysisId);
    
    /// <summary>
    /// Check if a cached analysis exists and is still valid
    /// </summary>
    Task<bool> HasValidCachedAnalysisAsync(int userId, int maxAgeDays = 7);
    
    /// <summary>
    /// Delete an analysis (for re-analysis or privacy)
    /// </summary>
    Task<bool> DeleteAnalysisAsync(int analysisId);
    
    /// <summary>
    /// Get all analyses for a user (history)
    /// </summary>
    Task<List<VisionAnalysisResult>> GetUserAnalysisHistoryAsync(int userId);
    
    /// <summary>
    /// Check if the vision server is healthy
    /// </summary>
    Task<bool> IsServiceHealthyAsync();
}
