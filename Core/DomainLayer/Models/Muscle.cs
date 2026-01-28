using System;
using System.Collections.Generic;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// Represents a muscle group that can be targeted by exercises.
    /// Based on wger exercise database structure.
    /// </summary>
    public class Muscle
    {
        public int MuscleId { get; set; }
        public string Name { get; set; } = null!;
        public string? NameEn { get; set; }
        public bool IsFront { get; set; } = true;
        public string? ImageUrlMain { get; set; }
        public string? ImageUrlSecondary { get; set; }

        // Navigation properties
        public virtual ICollection<ExerciseMuscle> ExerciseMuscles { get; set; } = new List<ExerciseMuscle>();
    }
}
