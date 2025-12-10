using System;

namespace IntelliFit.Domain.Models
{
    public class Exercise
    {
        public int ExerciseId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string Category { get; set; } = null!;
        public string MuscleGroup { get; set; } = null!;
        public string? DifficultyLevel { get; set; }
        public string? EquipmentRequired { get; set; }
        public string? VideoUrl { get; set; }
        public string? Instructions { get; set; }
        public int? CaloriesPerMinute { get; set; }
        public bool IsActive { get; set; } = true;
        public int? CreatedByCoachId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual Coach? CreatedByCoach { get; set; }
        public virtual ICollection<WorkoutPlanExercise> WorkoutPlanExercises { get; set; } = new List<WorkoutPlanExercise>();
        public virtual ICollection<WorkoutTemplateExercise> WorkoutTemplateExercises { get; set; } = new List<WorkoutTemplateExercise>();
    }
}
