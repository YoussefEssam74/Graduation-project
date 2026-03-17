namespace ServiceAbstraction.Services
{
    /// <summary>
    /// Builds a rich, structured context string about a user for injection into AI system prompts.
    /// Aggregates workout plan, nutrition plan, InBody measurements, and strength profile.
    /// </summary>
    public interface IAIContextBuilderService
    {
        /// <summary>
        /// Returns a formatted context block (≤ ~1500 tokens) describing the user's
        /// current fitness data. Passed as part of the system prompt to Groq.
        /// </summary>
        Task<string> BuildUserContextAsync(int userId);
    }
}
