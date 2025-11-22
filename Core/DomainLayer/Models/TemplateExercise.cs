namespace DomainLayer.Models;

public class TemplateExercise
{
    public int TemplateExerciseId { get; set; }
    public int TemplateID { get; set; }
    public int ExerciseId { get; set; }
    public int DayNumber { get; set; } // Which day of the week (1-7)
    public int Sets { get; set; }
    public int Reps { get; set; }
    public float? Weight { get; set; }
    public TimeSpan? RestTime { get; set; }
    public int Order { get; set; } // Exercise order within the day
    public string? Notes { get; set; }

    // Navigation Properties
    public virtual WorkoutPlanTemplate Template { get; set; } = null!;
    public virtual Exercise Exercise { get; set; } = null!;
}