using DomainLayer.Enums;

namespace DomainLayer.Models;

public class WorkoutSession
{
    public int SessionID { get; set; }
    public int UserID { get; set; }
    public int EquipmentID { get; set; }
    public int? CoachID { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public int DurationMinutes { get; set; }
    public int CaloriesBurned { get; set; }
    public IntensityLevel IntensityLevel { get; set; }
    public float? AverageHeartRate { get; set; }
    public bool IsSupervisedByCoach { get; set; }

    // Navigation Properties
    public virtual User User { get; set; } = null!;
    public virtual Equipment Equipment { get; set; } = null!;
    public virtual Coach? Coach { get; set; }
    public virtual ICollection<ExerciseFormAnalysis> FormAnalyses { get; set; } = new List<ExerciseFormAnalysis>();
    public virtual ICollection<HeartRateData> HeartRateData { get; set; } = new List<HeartRateData>();
}
