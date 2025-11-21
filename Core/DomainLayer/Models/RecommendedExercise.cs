namespace DomainLayer.Models;

public class RecommendedExercise
{
    public int RecommendedExerciseId { get; set; }
    public int WorkoutRecommendationId { get; set; }
    public int ExerciseId { get; set; }
    public int Sets { get; set; }
    public int Reps { get; set; }
    public float? Weight { get; set; }
    public TimeSpan? RestTime { get; set; }
    public int Order { get; set; }
    public string? CoachNotes { get; set; } // Coach can add notes
    public bool IsAddedByCoach { get; set; } // Track if coach added this exercise
    public int? AddedByCoachID { get; set; }

    // Navigation Properties
    public virtual WorkoutRecommendation WorkoutRecommendation { get; set; } = null!;
    public virtual Exercise Exercise { get; set; } = null!;
    public virtual Coach? AddedByCoach { get; set; }
}