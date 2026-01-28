using Microsoft.ML.Data;

namespace GraduationProject.ML.Models;

/// <summary>
/// Output class for ML.NET fitness level classification predictions.
/// Contains the predicted label and probability scores for each class.
/// </summary>
public class FitnessLevelModelOutput
{
    /// <summary>The predicted fitness level: Beginner, Intermediate, or Advanced</summary>
    [ColumnName("PredictedLabel")]
    public string PredictedFitnessLevel { get; set; } = string.Empty;

    /// <summary>Probability scores for each class [Beginner, Intermediate, Advanced]</summary>
    [ColumnName("Score")]
    public float[] Scores { get; set; } = Array.Empty<float>();

    /// <summary>Gets the confidence score for the predicted label</summary>
    public float Confidence => Scores.Length > 0 ? Scores.Max() : 0f;

    /// <summary>Gets a dictionary mapping each fitness level to its probability score</summary>
    public Dictionary<string, float> GetAllScores()
    {
        var labels = new[] { "Beginner", "Intermediate", "Advanced" };
        var result = new Dictionary<string, float>();
        
        for (int i = 0; i < Math.Min(labels.Length, Scores.Length); i++)
        {
            result[labels[i]] = Scores[i];
        }
        
        return result;
    }
}
