using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ServiceAbstraction.Services;

namespace Service.Services;

/// <summary>
/// Provides exercise-specific information for RAG injection into AI prompts.
///
/// Gap 3 – Exact steps: Loads strength.json (curated step-by-step instructions) and matches exercise
///          names mentioned in the user query. Returns precise steps/notes instead of Groq improvising.
///
/// Gap 2 – Semantic fallback: When no exact name match is found, searches the Exercise table in the
///          database using keyword extraction so that semantically-related exercises are surfaced.
///          Full pgvector/embedding-server search can be layered on top later once embeddings are seeded.
/// </summary>
public class ExerciseRagService : IExerciseRagService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ExerciseRagService> _logger;

    // Lazily-loaded, process-wide cache of strength.json entries keyed by lowercase name
    private static IReadOnlyDictionary<string, StrengthEntry>? _strengthCache;
    private static readonly SemaphoreSlim _loadLock = new(1, 1);

    private static readonly HashSet<string> _stopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "the", "and", "for", "with", "how", "what", "when", "who", "are", "can", "you",
        "tell", "me", "my", "is", "do", "does", "a", "an", "to", "in", "of", "be",
        "this", "that", "have", "not", "but", "from", "they", "will", "one", "all",
        "if", "at", "by", "or", "so", "it", "we", "as", "would", "could", "should"
    };

    public ExerciseRagService(
        IUnitOfWork unitOfWork,
        IConfiguration configuration,
        ILogger<ExerciseRagService> logger)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string?> FindRelevantExerciseInfoAsync(string query)
    {
        if (string.IsNullOrWhiteSpace(query)) return null;

        // --- Gap 3: Exact name match in strength.json ---
        var strengthData = await GetStrengthDataAsync();

        var exactMatches = new List<StrengthEntry>();
        foreach (var entry in strengthData.Values)
        {
            if (entry.Name == null) continue;
            if (ContainsName(query, entry.Name) ||
                (entry.Slug != null && ContainsName(query, entry.Slug.Replace("-", " "))))
            {
                exactMatches.Add(entry);
            }
        }

        if (exactMatches.Count > 0)
            return FormatStrengthEntries(exactMatches);

        // --- Gap 2: Keyword-based DB search as semantic fallback ---
        return await SearchDbByKeywordsAsync(query);
    }

    // ---- Utilities --------------------------------------------------------

    private static bool ContainsName(string query, string name) =>
        query.Contains(name, StringComparison.OrdinalIgnoreCase);

    private async Task<IReadOnlyDictionary<string, StrengthEntry>> GetStrengthDataAsync()
    {
        if (_strengthCache != null) return _strengthCache;

        await _loadLock.WaitAsync();
        try
        {
            if (_strengthCache != null) return _strengthCache;

            var path = ResolveStrengthJsonPath();

            if (path == null || !File.Exists(path))
            {
                _logger.LogWarning(
                    "strength.json not found. Exercise step-by-step data (Gap 3) will be unavailable. " +
                    "Configure ExerciseData:StrengthJsonPath in appsettings.json.");
                _strengthCache = new Dictionary<string, StrengthEntry>(StringComparer.OrdinalIgnoreCase);
                return _strengthCache;
            }

            var json = await File.ReadAllTextAsync(path);
            var entries = JsonSerializer.Deserialize<List<StrengthEntry>>(json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];

            _strengthCache = entries
                .Where(e => !string.IsNullOrWhiteSpace(e.Name))
                .ToDictionary(e => e.Name!, e => e, StringComparer.OrdinalIgnoreCase);

            _logger.LogInformation("Loaded {Count} exercises from strength.json for RAG", _strengthCache.Count);
            return _strengthCache;
        }
        finally
        {
            _loadLock.Release();
        }
    }

    private string? ResolveStrengthJsonPath()
    {
        // 1. Explicit configuration
        var configured = _configuration["ExerciseData:StrengthJsonPath"];
        if (!string.IsNullOrEmpty(configured) && File.Exists(configured))
            return configured;

        // 2. Walk up from the current working directory searching for the workspace root
        var search = Path.Combine("ml_models", "Workout-Plan_Generating", "data", "exercises", "strength.json");
        var dir = Directory.GetCurrentDirectory();
        for (int i = 0; i < 8; i++)
        {
            var candidate = Path.Combine(dir, search);
            if (File.Exists(candidate)) return candidate;
            var parent = Directory.GetParent(dir);
            if (parent == null) break;
            dir = parent.FullName;
        }
        return null;
    }

    private static string FormatStrengthEntries(IEnumerable<StrengthEntry> entries)
    {
        var sb = new StringBuilder();
        sb.AppendLine("=== EXACT EXERCISE INSTRUCTIONS (curated) ===");
        foreach (var e in entries.Take(2)) // keep within token budget
        {
            sb.AppendLine($"\nExercise: {e.Name}");
            if (e.PrimaryMuscles?.Length > 0)
                sb.AppendLine($"  Primary muscles: {string.Join(", ", e.PrimaryMuscles)}");
            if (e.SecondaryMuscles?.Length > 0)
                sb.AppendLine($"  Secondary muscles: {string.Join(", ", e.SecondaryMuscles)}");
            if (e.Steps?.Length > 0)
            {
                sb.AppendLine("  Steps:");
                for (int i = 0; i < e.Steps.Length; i++)
                    sb.AppendLine($"    {i + 1}. {e.Steps[i]}");
            }
            if (!string.IsNullOrWhiteSpace(e.Notes))
            {
                var notes = System.Text.RegularExpressions.Regex.Replace(e.Notes, "<.*?>", " ")
                    .Replace("&lt;", "<").Replace("&gt;", ">").Replace("&amp;", "&").Trim();
                if (!string.IsNullOrWhiteSpace(notes))
                    sb.AppendLine($"  Notes: {notes}");
            }
        }
        sb.AppendLine("=== END EXERCISE INSTRUCTIONS ===");
        return sb.ToString();
    }

    private async Task<string?> SearchDbByKeywordsAsync(string query)
    {
        try
        {
            var keywords = ExtractKeywords(query).ToList();
            if (keywords.Count == 0) return null;

            var all = await _unitOfWork.Repository<Exercise>().GetAllAsync();

            var relevant = all
                .Where(e => keywords.Any(k =>
                    e.Name.Contains(k, StringComparison.OrdinalIgnoreCase) ||
                    (e.Description != null && e.Description.Contains(k, StringComparison.OrdinalIgnoreCase)) ||
                    e.MuscleGroup.Contains(k, StringComparison.OrdinalIgnoreCase)))
                .Take(3)
                .ToList();

            if (relevant.Count == 0) return null;

            var sb = new StringBuilder();
            sb.AppendLine("=== RELATED EXERCISES FROM DATABASE ===");
            foreach (var ex in relevant)
            {
                sb.AppendLine($"\nExercise: {ex.Name} — Muscle group: {ex.MuscleGroup}");
                if (!string.IsNullOrWhiteSpace(ex.Instructions))
                    sb.AppendLine($"  Instructions: {ex.Instructions}");
                else if (!string.IsNullOrWhiteSpace(ex.Description))
                    sb.AppendLine($"  Description: {ex.Description}");
            }
            sb.AppendLine("=== END EXERCISES ===");
            return sb.ToString();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DB exercise keyword search failed");
            return null;
        }
    }

    private static IEnumerable<string> ExtractKeywords(string query) =>
        query.Split(' ', StringSplitOptions.RemoveEmptyEntries)
             .Select(w => w.Trim('.', ',', '?', '!', '"', '\'', '(', ')'))
             .Where(w => w.Length >= 4 && !_stopWords.Contains(w));

    // ---- Internal model mirroring strength.json structure ----------------

    private sealed class StrengthEntry
    {
        [JsonPropertyName("pk")] public string? Pk { get; set; }
        [JsonPropertyName("name")] public string? Name { get; set; }
        [JsonPropertyName("slug")] public string? Slug { get; set; }
        [JsonPropertyName("primaryMuscles")] public string[]? PrimaryMuscles { get; set; }
        [JsonPropertyName("secondaryMuscles")] public string[]? SecondaryMuscles { get; set; }
        [JsonPropertyName("steps")] public string[]? Steps { get; set; }
        [JsonPropertyName("notes")] public string? Notes { get; set; }
    }
}
