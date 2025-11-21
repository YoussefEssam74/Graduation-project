using DomainLayer.Enums;

namespace DomainLayer.Models;

public class WorkoutPlanTemplate
{
    public int TemplateID { get; set; }
    public int? CoachID { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DifficultyLevel DifficultyLevel { get; set; }
    public int DurationWeeks { get; set; }
    public int WorkoutsPerWeek { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation Properties
    public virtual Coach? Coach { get; set; }
    public virtual ICollection<MemberWorkoutPlan> MemberPlans { get; set; } = new List<MemberWorkoutPlan>();
    public virtual ICollection<TemplateExercise> TemplateExercises { get; set; } = new List<TemplateExercise>();
}
