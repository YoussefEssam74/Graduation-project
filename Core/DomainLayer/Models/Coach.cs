namespace DomainLayer.Models;

public class Coach : User
{
    public int CoachID { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    // Navigation Properties
    public virtual ICollection<MemberCoachSubscription> HasSubscribers { get; set; } = new List<MemberCoachSubscription>();
    public virtual ICollection<WorkoutSession> SupervisedSessions { get; set; } = new List<WorkoutSession>();
    public virtual ICollection<InBodyMeasurement> RecordedMeasurements { get; set; } = new List<InBodyMeasurement>();
    public virtual ICollection<WorkoutPlanTemplate> CreatedTemplates { get; set; } = new List<WorkoutPlanTemplate>();
    public virtual ICollection<MemberWorkoutPlan> AssignedPlans { get; set; } = new List<MemberWorkoutPlan>();
    public virtual ICollection<CoachReview> Reviews { get; set; } = new List<CoachReview>();
}
