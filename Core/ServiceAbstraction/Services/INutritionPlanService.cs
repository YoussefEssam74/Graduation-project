using Shared.DTOs.NutritionPlan;

namespace ServiceAbstraction.Services
{
    public interface INutritionPlanService
    {
        Task<IEnumerable<NutritionPlanDto>> GetMemberPlansAsync(int memberId);
        Task<NutritionPlanDto?> GetPlanDetailsAsync(int planId);
        Task<NutritionPlanDto> GeneratePlanAsync(GenerateNutritionPlanDto generateDto);
        Task<NutritionPlanDto> UpdatePlanAsync(int planId, GenerateNutritionPlanDto updateDto);
        Task<NutritionPlanDto> DeactivatePlanAsync(int planId);
        Task<IEnumerable<NutritionPlanDto>> GetCoachReviewNutritionPlansAsync(int coachUserId);
        Task<bool> EditNutritionPlanAsync(int planId, int coachUserId, CoachEditNutritionPlanRequest request);
        Task<bool> UpdateNutritionPlanStatusAsync(int planId, int coachUserId, string status, string? notes);
    }
}
