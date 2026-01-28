using System;

namespace IntelliFit.Domain.Models
{
    /// <summary>
    /// Junction table for many-to-many relationship between Exercise and Equipment.
    /// Links exercises to the equipment required to perform them.
    /// </summary>
    public class ExerciseEquipment
    {
        public int ExerciseId { get; set; }
        public int EquipmentId { get; set; }

        // Navigation properties
        public virtual Exercise Exercise { get; set; } = null!;
        public virtual Equipment Equipment { get; set; } = null!;
    }
}
