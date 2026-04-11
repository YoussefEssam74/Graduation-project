namespace ServiceAbstraction.Services
{
    /// <summary>
    /// Retrieves curated exercise information (steps, muscles, technique notes) to inject into AI chat prompts.
    /// Gap 2: Semantic RAG for exercise questions.
    /// Gap 3: Exact step-by-step instructions from strength.json instead of Groq guessing.
    /// </summary>
    public interface IExerciseRagService
    {
        /// <summary>
        /// Searches for exercise information relevant to the user query.
        /// Returns a formatted context block ready for injection into the Groq system prompt,
        /// or null if the query does not appear to be about a specific exercise.
        /// </summary>
        Task<string?> FindRelevantExerciseInfoAsync(string query);
    }
}
