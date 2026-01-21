namespace Shared.DTOs.WorkoutPlan
{
    /// <summary>
    /// DTO for updating exercise notes in a workout plan (used by coaches)
    /// </summary>
    public class UpdateExerciseNotesDto
    {
        public int PlanId { get; set; }
        public int CoachId { get; set; }
        public string ExerciseId { get; set; } = string.Empty;
        public List<string> Notes { get; set; } = new();
    }

    /// <summary>
    /// DTO for coach feedback on a workout plan day
    /// </summary>
    public class CoachDayFeedbackDto
    {
        public int PlanId { get; set; }
        public int CoachId { get; set; }
        public int WeekNumber { get; set; }
        public int DayNumber { get; set; }
        public string Feedback { get; set; } = string.Empty;
        public bool Approved { get; set; }
    }
}
