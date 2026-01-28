using Microsoft.ML;
using GraduationProject.ML.Models;

namespace GraduationProject.ML.Services;

/// <summary>
/// Service for loading and running fitness level predictions using the trained ML.NET model.
/// WARNING: This class uses PredictionEngine which is not thread-safe. 
/// Do NOT register as a singleton. Use Microsoft.Extensions.ML.PredictionEnginePool instead,
/// or register as scoped/transient, or implement your own thread-safe pooling.
/// </summary>
public class FitnessLevelPredictor : IDisposable
{
    private readonly MLContext _mlContext;
    private readonly ITransformer _model;
    private readonly PredictionEngine<FitnessLevelModelInput, FitnessLevelModelOutput> _predictionEngine;
    private readonly string _modelPath;
    private bool _disposed;

    /// <summary>
    /// Creates a new predictor instance, loading the model from the specified path.
    /// </summary>
    /// <param name="modelPath">Path to the trained model .zip file</param>
    /// <exception cref="FileNotFoundException">Thrown if model file doesn't exist</exception>
    public FitnessLevelPredictor(string modelPath)
    {
        if (!File.Exists(modelPath))
        {
            throw new FileNotFoundException(
                $"ML.NET fitness level model not found at: {modelPath}. " +
                "Please train the model first using FitnessLevelTrainer.",
                modelPath);
        }

        _modelPath = modelPath;
        _mlContext = new MLContext();
        
        Console.WriteLine($"Loading fitness level model from {modelPath}...");
        _model = _mlContext.Model.Load(modelPath, out _);
        _predictionEngine = _mlContext.Model.CreatePredictionEngine<FitnessLevelModelInput, FitnessLevelModelOutput>(_model);
        Console.WriteLine("Fitness level model loaded successfully.");
    }

    /// <summary>
    /// Predicts the fitness level for a given user input.
    /// </summary>
    /// <param name="input">User profile data</param>
    /// <returns>Prediction result with level and confidence scores</returns>
    public FitnessLevelModelOutput Predict(FitnessLevelModelInput input)
    {
        if (_disposed)
        {
            throw new ObjectDisposedException(nameof(FitnessLevelPredictor));
        }
        
        ArgumentNullException.ThrowIfNull(input);
        
        // Note: PredictionEngine.Predict is not thread-safe
        // Consider using lock, PredictionEnginePool, or pooling pattern for concurrent requests
        return _predictionEngine.Predict(input);
    }

    /// <summary>
    /// Predicts fitness level from individual values (convenience method).
    /// </summary>
    public FitnessLevelModelOutput Predict(
        float age, 
        float weightKg, 
        float heightCm, 
        float bodyFatPercentage, 
        float experienceYears)
    {
        return Predict(new FitnessLevelModelInput
        {
            Age = age,
            WeightKg = weightKg,
            HeightCm = heightCm,
            BodyFatPercentage = bodyFatPercentage,
            ExperienceYears = experienceYears
        });
    }

    /// <summary>
    /// Gets the path to the loaded model.
    /// </summary>
    public string ModelPath => _modelPath;

    public void Dispose()
    {
        if (!_disposed)
        {
            _predictionEngine?.Dispose();
            _disposed = true;
        }
        GC.SuppressFinalize(this);
    }
}
