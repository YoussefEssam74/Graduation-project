using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IntelliFit.Domain.Models;

/// <summary>
/// Junction table linking Equipment to target Muscles (many-to-many relationship)
/// </summary>
[Table("equipment_muscles")]
public class EquipmentMuscle
{
    [Key]
    [Column("equipment_muscle_id")]
    public int EquipmentMuscleId { get; set; }

    [Required]
    [Column("equipment_id")]
    public int EquipmentId { get; set; }

    [Required]
    [Column("muscle_id")]
    public int MuscleId { get; set; }

    /// <summary>
    /// True if this equipment primarily targets this muscle, false if it's a secondary target
    /// </summary>
    [Column("is_primary")]
    public bool IsPrimary { get; set; }

    // Navigation properties
    public virtual Equipment Equipment { get; set; } = null!;
    public virtual Muscle Muscle { get; set; } = null!;
}
