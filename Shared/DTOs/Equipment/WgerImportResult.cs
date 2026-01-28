using System.Collections.Generic;

namespace Shared.DTOs.Equipment
{
    public class WgerImportResult
    {
        public int ImportedCount { get; set; }
        public int SkippedCount { get; set; }
        public List<string> ImportedItems { get; set; } = new();
        public List<string> SkippedItems { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }
}
