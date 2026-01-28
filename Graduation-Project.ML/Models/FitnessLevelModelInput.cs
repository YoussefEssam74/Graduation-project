using Microsoft.ML.Data;

namespace GraduationProject.ML.Models;

/// <summary>
/// Input class for ML.NET fitness level classification model.
/// Features are selected based on their correlation with training experience/capability.
/// </summary>
public class FitnessLevelModelInput
{
    /// <summary>Age affects recovery capacity and training potential</summary>
    [LoadColumn(0)]
    public float Age { get; set; }

    /// <summary>Body weight in kilograms - indicator of absolute strength potential</summary>
    [LoadColumn(1)]
    public float WeightKg { get; set; }

    /// <summary>Height in centimeters - affects leverage for certain exercises</summary>
    [LoadColumn(2)]
    public float HeightCm { get; set; }

    /// <summary>Body fat percentage - lower values often indicate more training experience</summary>
    [LoadColumn(3)]
    public float BodyFatPercentage { get; set; }

    /// <summary>Years of consistent training experience - primary predictor</summary>
    [LoadColumn(4)]
    public float ExperienceYears { get; set; }

    /// <summary>The target label: Beginner, Intermediate, or Advanced</summary>
    [LoadColumn(5)]
    public string FitnessLevel { get; set; } = string.Empty;
}
