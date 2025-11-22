using DomainLayer.Enums;

namespace DomainLayer.Models;

public class MemberWorkoutPlan
{
    public int PlanInstanceID { get; set; }
    public int UserID { get; set; }
    public int? TemplateID { get; set; }
    public int? AssignedByCoachID { get; set; }
    public int? GeneratedByAI_ID { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public WorkoutPlanStatus Status { get; set; }
    public int CompletedWorkouts { get; set; }
    public PlanSource PlanSource { get; set; }
    public ApprovalStatus ApprovalStatus { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
    public virtual WorkoutPlanTemplate? Template { get; set; }
    public virtual Coach? AssignedByCoach { get; set; }
    public virtual AI_Agent? GeneratedByAI { get; set; }
}
