using System.Threading.Tasks;

namespace Core.Service
{
    public interface IWorkoutService
    {
        Task<string> GeneratePlan(object userProfile, object preferences);
        Task RecordFeedback(string planId, object feedback);
    }

    public class WorkoutService : IWorkoutService
    {
        public Task<string> GeneratePlan(object userProfile, object preferences)
        {
            // stub: call ML service (Python) via HTTP
            return Task.FromResult("[stub plan id]");
        }

        public Task RecordFeedback(string planId, object feedback)
        {
            return Task.CompletedTask;
        }
    }
}
