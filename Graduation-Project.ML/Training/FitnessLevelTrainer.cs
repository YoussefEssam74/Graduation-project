using Microsoft.ML;
using Microsoft.ML.Data;
using GraduationProject.ML.Models;

namespace GraduationProject.ML.Training;

/// <summary>
/// Trainer class for the fitness level classification model.
/// Uses SdcaMaximumEntropy for multiclass classification.
/// </summary>
public class FitnessLevelTrainer
{
    private readonly MLContext _mlContext;
    private readonly string _dataPath;
    private readonly string _modelPath;

    public FitnessLevelTrainer(string dataPath, string modelPath, int? seed = 42)
    {
        _mlContext = new MLContext(seed);
        _dataPath = dataPath;
        _modelPath = modelPath;
    }

    /// <summary>
    /// Trains the fitness level classification model and saves it to disk.
    /// </summary>
    /// <returns>Training metrics for evaluation</returns>
    public MulticlassClassificationMetrics TrainAndSave()
    {
        // Validate data file exists
        if (!File.Exists(_dataPath))
        {
            throw new FileNotFoundException(
                $"Training data file not found at: {_dataPath}. Please ensure the data file exists.",
                _dataPath);
        }
        
        // Ensure model output directory exists
        var modelDir = Path.GetDirectoryName(_modelPath);
        if (!string.IsNullOrEmpty(modelDir) && !Directory.Exists(modelDir))
        {
            Directory.CreateDirectory(modelDir);
        }
        
        Console.WriteLine("Loading training data...");
        var dataView = _mlContext.Data.LoadFromTextFile<FitnessLevelModelInput>(
            _dataPath, 
            hasHeader: true, 
            separatorChar: ',');

        // Split data for training and validation
        var splitData = _mlContext.Data.TrainTestSplit(dataView, testFraction: 0.2);

        Console.WriteLine("Building training pipeline...");
        var pipeline = BuildPipeline();

        Console.WriteLine("Training model with SdcaMaximumEntropy...");
        var model = pipeline.Fit(splitData.TrainSet);

        Console.WriteLine("Evaluating model...");
        var predictions = model.Transform(splitData.TestSet);
        var metrics = _mlContext.MulticlassClassification.Evaluate(predictions);

        PrintMetrics(metrics);

        Console.WriteLine($"Saving model to {_modelPath}...");
        _mlContext.Model.Save(model, dataView.Schema, _modelPath);

        Console.WriteLine("Training complete!");
        return metrics;
    }

    /// <summary>
    /// Builds the ML.NET pipeline with feature engineering and trainer.
    /// </summary>
    private IEstimator<ITransformer> BuildPipeline()
    {
        return _mlContext.Transforms.Conversion
            // Convert label to key for multiclass classification
            .MapValueToKey("Label", nameof(FitnessLevelModelInput.FitnessLevel))
            // Concatenate all numeric features into a single vector
            .Append(_mlContext.Transforms.Concatenate("Features",
                nameof(FitnessLevelModelInput.Age),
                nameof(FitnessLevelModelInput.WeightKg),
                nameof(FitnessLevelModelInput.HeightCm),
                nameof(FitnessLevelModelInput.BodyFatPercentage),
                nameof(FitnessLevelModelInput.ExperienceYears)))
            // Normalize features to improve training convergence
            .Append(_mlContext.Transforms.NormalizeMinMax("Features"))
            // Apply the SdcaMaximumEntropy trainer (softmax regression)
            .Append(_mlContext.MulticlassClassification.Trainers.SdcaMaximumEntropy(
                labelColumnName: "Label",
                featureColumnName: "Features",
                maximumNumberOfIterations: 100))
            // Convert predicted key back to original string label
            .Append(_mlContext.Transforms.Conversion.MapKeyToValue("PredictedLabel"));
    }

    /// <summary>
    /// Prints evaluation metrics to console.
    /// </summary>
    private void PrintMetrics(MulticlassClassificationMetrics metrics)
    {
        Console.WriteLine("=============== Model Evaluation Metrics ===============");
        Console.WriteLine($"Macro Accuracy:     {metrics.MacroAccuracy:P2}");
        Console.WriteLine($"Micro Accuracy:     {metrics.MicroAccuracy:P2}");
        Console.WriteLine($"Log Loss:           {metrics.LogLoss:F4}");
        Console.WriteLine($"Log Loss Reduction: {metrics.LogLossReduction:F4}");
        Console.WriteLine("========================================================");
        
        // Print per-class metrics
        Console.WriteLine("\nPer-Class Metrics:");
        Console.WriteLine($"Confusion Matrix:\n{metrics.ConfusionMatrix.GetFormattedConfusionTable()}");
    }

    /// <summary>
    /// Validates model exists at the specified path.
    /// </summary>
    public bool ModelExists() => File.Exists(_modelPath);
}
