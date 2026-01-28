using System;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// Junction table for many-to-many relationship between Exercise and Muscle.
    /// </summary>
    public class ExerciseMuscle
    {
        public int ExerciseId { get; set; }
        public int MuscleId { get; set; }
        public bool IsPrimary { get; set; } = true; // Primary vs secondary muscle

        // Navigation properties
        public virtual Exercise Exercise { get; set; } = null!;
        public virtual Muscle Muscle { get; set; } = null!;
    }
}
