using GraduationProject.ML.Training;
using GraduationProject.ML.Services;
using GraduationProject.ML.Models;

namespace GraduationProject.ML;

/// <summary>
/// Console application for training and testing the fitness level ML model.
/// Run with: dotnet run --project Graduation-Project.ML
/// </summary>
public class Program
{
    public static void Main(string[] args)
    {
        // Get paths relative to the project
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        string projectRoot = Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", ".."));
        
        string dataPath = Path.Combine(projectRoot, "Datasets", "fitness_level_training_data.csv");
        string modelPath = Path.Combine(projectRoot, "Graduation-Project.ML", "MLModels", "fitness_level_model.zip");

        // Ensure MLModels directory exists
        string modelDir = Path.GetDirectoryName(modelPath)!;
        if (!Directory.Exists(modelDir))
        {
            Directory.CreateDirectory(modelDir);
        }

        Console.WriteLine("========================================");
        Console.WriteLine("  Fitness Level ML.NET Model Trainer");
        Console.WriteLine("========================================\n");

        if (args.Length > 0 && args[0] == "test")
        {
            TestModel(modelPath);
        }
        else
        {
            TrainModel(dataPath, modelPath);
            TestModel(modelPath);
        }
    }

    static void TrainModel(string dataPath, string modelPath)
    {
        Console.WriteLine($"Data path: {dataPath}");
        Console.WriteLine($"Model path: {modelPath}\n");

        if (!File.Exists(dataPath))
        {
            Console.WriteLine($"ERROR: Training data not found at {dataPath}");
            return;
        }

        var trainer = new FitnessLevelTrainer(dataPath, modelPath);
        trainer.TrainAndSave();
    }

    static void TestModel(string modelPath)
    {
        Console.WriteLine("\n========================================");
        Console.WriteLine("  Testing Model Predictions");
        Console.WriteLine("========================================\n");

        if (!File.Exists(modelPath))
        {
            Console.WriteLine($"ERROR: Model not found at {modelPath}");
            return;
        }

        using var predictor = new FitnessLevelPredictor(modelPath);

        // Test cases
        var testCases = new[]
        {
            new { Age = 22f, Weight = 65f, Height = 170f, BodyFat = 22f, Experience = 0f, Expected = "Beginner" },
            new { Age = 28f, Weight = 75f, Height = 178f, BodyFat = 15f, Experience = 2.5f, Expected = "Intermediate" },
            new { Age = 30f, Weight = 80f, Height = 180f, BodyFat = 10f, Experience = 7f, Expected = "Advanced" }
        };

        foreach (var test in testCases)
        {
            var result = predictor.Predict(test.Age, test.Weight, test.Height, test.BodyFat, test.Experience);
            
            Console.WriteLine($"Input: Age={test.Age}, Weight={test.Weight}kg, Height={test.Height}cm, " +
                            $"BodyFat={test.BodyFat}%, Experience={test.Experience}yrs");
            Console.WriteLine($"  Predicted: {result.PredictedFitnessLevel} " +
                            $"(Confidence: {result.Confidence:P1})");
            Console.WriteLine($"  Expected:  {test.Expected}");
            Console.WriteLine($"  Match: {(result.PredictedFitnessLevel == test.Expected ? "✓" : "✗")}");
            
            var scores = result.GetAllScores();
            Console.WriteLine($"  Scores: Beginner={scores.GetValueOrDefault("Beginner"):P1}, " +
                            $"Intermediate={scores.GetValueOrDefault("Intermediate"):P1}, " +
                            $"Advanced={scores.GetValueOrDefault("Advanced"):P1}");
            Console.WriteLine();
        }
    }
}
