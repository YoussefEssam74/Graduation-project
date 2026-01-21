using Shared.DTOs.Meal;

namespace Shared.DTOs;

/// <summary>
/// Request for AI-generated workout plan
/// </summary>
public class GenerateWorkoutPlanRequest
{
    public int UserId { get; set; }
    public int Age { get; set; }
    public string Height { get; set; } = string.Empty;  // e.g., "5'10\""
    public string Weight { get; set; } = string.Empty;   // e.g., "170 lbs"
    public string FitnessGoal { get; set; } = string.Empty;  // e.g., "Muscle Gain", "Weight Loss"
    public string FitnessLevel { get; set; } = string.Empty; // e.g., "Beginner", "Intermediate"
    public int WorkoutDaysPerWeek { get; set; }
    public string? Injuries { get; set; }  // e.g., "Lower back pain"
    public string? EquipmentAccess { get; set; }  // e.g., "Full gym", "Home gym"
}

/// <summary>
/// Request for AI-generated nutrition plan
/// </summary>
public class GenerateNutritionPlanRequest
{
    public int UserId { get; set; }
    public int Age { get; set; }
    public string Height { get; set; } = string.Empty;
    public string Weight { get; set; } = string.Empty;
    public string FitnessGoal { get; set; } = string.Empty;
    public string? DietaryRestrictions { get; set; }  // e.g., "Lactose intolerant", "Vegetarian"
    public string? FoodAllergies { get; set; }
}

/// <summary>
/// Result of AI workout plan generation
/// </summary>
public class WorkoutPlanGenerationResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public int? PlanInstanceID { get; set; }
    public string? PlanName { get; set; }
    public List<string>? Schedule { get; set; }
    public List<ExerciseDayDto>? Exercises { get; set; }
    public int TokensSpent { get; set; } = 50;  // Default cost for AI generation
}

/// <summary>
/// Result of AI nutrition plan generation
/// </summary>
public class NutritionPlanGenerationResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public int? PlanID { get; set; }
    public string? PlanName { get; set; }
    public int DailyCalories { get; set; }
    public List<MealDto>? Meals { get; set; }
    public int TokensSpent { get; set; } = 50;  // Default cost for AI generation
}

/// <summary>
/// Exercise day in AI-generated workout plan
/// </summary>
public class ExerciseDayDto
{
    public string Day { get; set; } = string.Empty;
    public List<RoutineDto> Routines { get; set; } = new();
}

/// <summary>
/// Individual exercise routine
/// </summary>
public class RoutineDto
{
    public string Name { get; set; } = string.Empty;
    public int Sets { get; set; }
    public int Reps { get; set; }
    public string? Duration { get; set; }
    public string? Description { get; set; }
}

#region ML-Powered Workout Generator DTOs

/// <summary>
/// Request for ML-powered workout plan generation (uses local ML service)
/// </summary>
public class MLWorkoutGenerationRequest
{
    public int UserId { get; set; }
    public MLUserProfile Profile { get; set; } = new();
    public int PlanDurationWeeks { get; set; } = 4;
}

/// <summary>
/// User profile for ML workout generation
/// </summary>
public class MLUserProfile
{
    public string FitnessLevel { get; set; } = "beginner"; // beginner, intermediate, advanced
    public string Goal { get; set; } = "muscle_gain"; // muscle_gain, weight_loss, strength, endurance, general
    public int DaysPerWeek { get; set; } = 3; // 3-6
    public List<string> Injuries { get; set; } = new(); // knee, lower back, shoulder, etc.
    public List<string> Allergies { get; set; } = new(); // For nutrition integration
    public List<string>? PreferredEquipment { get; set; } // barbell, dumbbell, cable, bodyweight, etc.
}

/// <summary>
/// Response from ML workout generator
/// </summary>
public class MLWorkoutGenerationResponse
{
    public string Status { get; set; } = string.Empty;
    public int ExercisesAvailable { get; set; }
    public MLSafetySummary SafetySummary { get; set; } = new();
    public MLWorkoutPlan Plan { get; set; } = new();
}

/// <summary>
/// Safety filtering summary
/// </summary>
public class MLSafetySummary
{
    public List<string> Injuries { get; set; } = new();
    public List<string> NormalizedInjuries { get; set; } = new();
    public List<string> Allergies { get; set; } = new();
    public List<string> NormalizedAllergies { get; set; } = new();
    public int TotalUnsafeExercises { get; set; }
    public int TotalUnsafeFoods { get; set; }
    public List<string> SampleUnsafeExercises { get; set; } = new();
    public List<string> SampleUnsafeFoods { get; set; } = new();
    public Dictionary<string, List<string>>? Alternatives { get; set; }
}

/// <summary>
/// Complete ML-generated workout plan
/// </summary>
public class MLWorkoutPlan
{
    public int UserId { get; set; }
    public string CreatedAt { get; set; } = string.Empty;
    public int DurationWeeks { get; set; }
    public int DaysPerWeek { get; set; }
    public string Goal { get; set; } = string.Empty;
    public string FitnessLevel { get; set; } = string.Empty;
    public string SplitType { get; set; } = string.Empty;
    public List<MLWorkoutWeek> Weeks { get; set; } = new();
    public List<string> Notes { get; set; } = new();
}

/// <summary>
/// Single week in the workout plan
/// </summary>
public class MLWorkoutWeek
{
    public int Week { get; set; }
    public string Theme { get; set; } = string.Empty;
    public List<MLWorkoutDay> Days { get; set; } = new();
    public string Notes { get; set; } = string.Empty;
}

/// <summary>
/// Single day in the workout plan
/// </summary>
public class MLWorkoutDay
{
    public int Day { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Focus { get; set; } = string.Empty;
    public List<MLExercise> Exercises { get; set; } = new();
}

/// <summary>
/// Single exercise in the workout
/// </summary>
public class MLExercise
{
    public string? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? MuscleGroup { get; set; }
    public int Sets { get; set; }
    public string Reps { get; set; } = string.Empty; // e.g., "8-12"
    public int RestSeconds { get; set; }
    public List<string>? Notes { get; set; } // Array of instruction steps from ML service
}

#endregion
