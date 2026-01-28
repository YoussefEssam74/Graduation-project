namespace Shared.DTOs.Exercise
{
    public class WgerImportResult
    {
        public int CategoriesImported { get; set; }
        public int MusclesImported { get; set; }
        public int EquipmentImported { get; set; }
        public int ExercisesImported { get; set; }
        public int TranslationsImported { get; set; }
        public int ExerciseMuscleLinksCreated { get; set; }
        public int ExerciseEquipmentLinksCreated { get; set; }
        public List<string> Errors { get; set; } = new();
        public string Message { get; set; } = string.Empty;
        public bool Success => Errors.Count == 0;
    }

    // Wger fixture deserialization models
    public class WgerFixtureItem<T>
    {
        public string Model { get; set; } = string.Empty;
        public int Pk { get; set; }
        public T Fields { get; set; } = default!;
    }

    public class WgerCategoryFields
    {
        public string Name { get; set; } = string.Empty;
    }

    public class WgerMuscleFields
    {
        public string Name { get; set; } = string.Empty;
        public bool Is_front { get; set; }
        public string Name_en { get; set; } = string.Empty;
    }

    public class WgerEquipmentFields
    {
        public string Name { get; set; } = string.Empty;
    }

    public class WgerExerciseFields
    {
        public string Uuid { get; set; } = string.Empty;
        public int Category { get; set; }
        public int? Variations { get; set; }
        public List<int> Muscles { get; set; } = new();
        public List<int> Muscles_secondary { get; set; } = new();
        public List<int> Equipment { get; set; } = new();
    }

    public class WgerTranslationFields
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Language { get; set; }
        public int Exercise { get; set; }
    }
}
