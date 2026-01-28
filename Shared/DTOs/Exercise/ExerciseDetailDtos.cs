namespace Shared.DTOs.Exercise
{
    public class MuscleDto
    {
        public int MuscleId { get; set; }
        public string Name { get; set; } = null!;
        public string? NameEn { get; set; }
        public bool IsFront { get; set; }
        public string? ImageUrlMain { get; set; }
        public string? ImageUrlSecondary { get; set; }
    }

    public class ExerciseCategoryDto
    {
        public int CategoryId { get; set; }
        public string Name { get; set; } = null!;
        public int ExerciseCount { get; set; }
    }

    public class ExerciseDetailDto
    {
        public int ExerciseId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public string? Category { get; set; }
        public string? MuscleGroup { get; set; }
        public string? DifficultyLevel { get; set; }
        public string? Instructions { get; set; }
        public string? VideoUrl { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
        
        // Related data
        public List<MuscleDto> PrimaryMuscles { get; set; } = new();
        public List<MuscleDto> SecondaryMuscles { get; set; } = new();
        public List<EquipmentInfoDto> Equipment { get; set; } = new();
    }

    public class EquipmentInfoDto
    {
        public int EquipmentId { get; set; }
        public string Name { get; set; } = null!;
    }

    public class ExerciseFilterDto
    {
        public int? CategoryId { get; set; }
        public int? MuscleId { get; set; }
        public int? EquipmentId { get; set; }
        public string? SearchTerm { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class ExerciseListResponseDto
    {
        public List<ExerciseDetailDto> Exercises { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
