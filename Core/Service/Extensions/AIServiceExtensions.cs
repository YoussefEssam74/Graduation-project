using IntelliFit.Service.Services.AI;
using IntelliFit.Service.Services.ML;
using IntelliFit.ServiceAbstraction.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace IntelliFit.Service.Extensions;

/// <summary>
/// Extension methods for registering AI services in the DI container.
/// </summary>
public static class AIServiceExtensions
{
    /// <summary>
    /// Adds all AI-related services to the service collection.
    /// </summary>
    public static IServiceCollection AddAIServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure options from appsettings.json
        services.Configure<MLModelOptions>(configuration.GetSection(MLModelOptions.SectionName));
        services.Configure<EmbeddingServerOptions>(configuration.GetSection(EmbeddingServerOptions.SectionName));
        services.Configure<VisionServerOptions>(configuration.GetSection(VisionServerOptions.SectionName));
        services.Configure<LLMServerOptions>(configuration.GetSection(LLMServerOptions.SectionName));

        // Register ML.NET fitness level service (singleton - loads model once)
        services.AddSingleton<IFitnessLevelService, FitnessLevelService>();

        // Register HTTP clients for Python AI servers
        services.AddHttpClient<IRAGService, RAGService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        services.AddHttpClient<IVisionAnalysisService, VisionAnalysisService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(60); // Vision may take longer
        });

        services.AddHttpClient<ILLMWorkoutService, LLMWorkoutService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(120); // LLM generation can be slow
        });

        // Register orchestration service
        services.AddScoped<IWorkoutOrchestrationService, WorkoutOrchestrationService>();

        return services;
    }
}
