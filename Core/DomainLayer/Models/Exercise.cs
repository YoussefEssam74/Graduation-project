using DomainLayer.Enums;

namespace DomainLayer.Models;

public class Exercise
{
    public int ExerciseID { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string MuscleGroup { get; set; } = string.Empty;
    public DifficultyLevel Difficulty { get; set; }
    public string? Description { get; set; }
    public string? VideoUrl { get; set; }
}
