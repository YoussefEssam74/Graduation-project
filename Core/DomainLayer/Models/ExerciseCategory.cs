using System;
using System.Collections.Generic;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// Represents a category of exercises (e.g., Arms, Legs, Chest).
    /// Based on wger exercise database structure.
    /// </summary>
    public class ExerciseCategory
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = null!;

        // Navigation properties
        public virtual ICollection<Exercise> Exercises { get; set; } = new List<Exercise>();
    }
}
