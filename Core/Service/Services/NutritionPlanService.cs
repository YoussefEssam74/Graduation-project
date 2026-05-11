using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using ServiceAbstraction.Services;
using Shared.DTOs.Meal;
using Shared.DTOs.NutritionPlan;

namespace Service.Services
{
    public class NutritionPlanService : INutritionPlanService
    {
        private readonly IUnitOfWork _unitOfWork;

        public NutritionPlanService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<NutritionPlanDto>> GetMemberPlansAsync(int memberId)
        {
            var plans = await _unitOfWork.Repository<NutritionPlan>().GetAllAsync();
            var member = await _unitOfWork.Repository<User>().GetByIdAsync(memberId);

            var result = new List<NutritionPlanDto>();

            foreach (var plan in plans.Where(p => p.UserId == memberId && p.IsActive))
            {
                string? coachName = null;
                if (plan.GeneratedByCoachId.HasValue)
                {
                    var coach = await _unitOfWork.Repository<CoachProfile>().GetByIdAsync(plan.GeneratedByCoachId.Value);
                    if (coach != null)
                    {
                        var coachUser = await _unitOfWork.Repository<User>().GetByIdAsync(coach.UserId);
                        coachName = coachUser?.Name;
                    }
                }

                var planMeals = await _unitOfWork.Repository<Meal>().FindAsync(m => m.NutritionPlanId == plan.PlanId);

                // Fall back to ai_program_generations.GeneratedPlan when AiPlanJson is not on the plan itself
                var aiPlanJson = plan.AiPlanJson;
                if (string.IsNullOrEmpty(aiPlanJson))
                {
                    var generations = await _unitOfWork.Repository<AiProgramGeneration>()
                        .FindAsync(g => g.NutritionPlanId == plan.PlanId && g.GeneratedPlan != null);
                    aiPlanJson = generations.OrderByDescending(g => g.CreatedAt).FirstOrDefault()?.GeneratedPlan;
                }

                result.Add(new NutritionPlanDto
                {
                    PlanId = plan.PlanId,
                    MemberId = memberId,
                    MemberName = member?.Name ?? "Unknown",
                    PlanName = plan.PlanName,
                    Description = plan.Description,
                    CreatedByCoachId = plan.GeneratedByCoachId,
                    CoachName = coachName,
                    CreatedByAiAgentId = null,
                    StartDate = plan.StartDate ?? DateTime.Today,
                    EndDate = plan.EndDate,
                    DailyCalories = plan.DailyCalories,
                    ProteinGrams = plan.ProteinGrams,
                    CarbsGrams = plan.CarbsGrams,
                    FatGrams = plan.FatsGrams,
                    Status = plan.Status == "Active" ? 1 : plan.Status == "Completed" ? 2 : 0,
                    StatusText = plan.Status,
                    IsActive = plan.IsActive,
                    CreatedAt = plan.CreatedAt,
                    DietaryRestrictions = plan.DietaryRestrictions,
                    AiPlanJson = aiPlanJson,
                    Meals = planMeals.Select(m => new PlanMealDto
                    {
                        MealId = m.MealId,
                        Name = m.Name,
                        MealType = m.MealType,
                        Calories = m.Calories,
                        ProteinGrams = m.ProteinGrams,
                        CarbsGrams = m.CarbsGrams,
                        FatGrams = m.FatsGrams
                    }).ToList()
                });
            }

            return result;
        }

        public async Task<NutritionPlanDto?> GetPlanDetailsAsync(int planId)
        {
            var plan = await _unitOfWork.Repository<NutritionPlan>().GetByIdAsync(planId);
            if (plan == null) return null;

            var member = await _unitOfWork.Repository<User>().GetByIdAsync(plan.UserId);

            string? coachName = null;
            if (plan.GeneratedByCoachId.HasValue)
            {
                var coach = await _unitOfWork.Repository<CoachProfile>().GetByIdAsync(plan.GeneratedByCoachId.Value);
                if (coach != null)
                {
                    var coachUser = await _unitOfWork.Repository<User>().GetByIdAsync(coach.UserId);
                    coachName = coachUser?.Name;
                }
            }

            var detailMeals = await _unitOfWork.Repository<Meal>().FindAsync(m => m.NutritionPlanId == plan.PlanId);

            // Fall back to ai_program_generations.GeneratedPlan when AiPlanJson is not on the plan itself
            var detailAiPlanJson = plan.AiPlanJson;
            if (string.IsNullOrEmpty(detailAiPlanJson))
            {
                var generations = await _unitOfWork.Repository<AiProgramGeneration>()
                    .FindAsync(g => g.NutritionPlanId == plan.PlanId && g.GeneratedPlan != null);
                detailAiPlanJson = generations.OrderByDescending(g => g.CreatedAt).FirstOrDefault()?.GeneratedPlan;
            }

            return new NutritionPlanDto
            {
                PlanId = plan.PlanId,
                MemberId = plan.UserId,
                MemberName = member?.Name ?? "Unknown",
                PlanName = plan.PlanName,
                Description = plan.Description,
                CreatedByCoachId = plan.GeneratedByCoachId,
                CoachName = coachName,
                CreatedByAiAgentId = null,
                StartDate = plan.StartDate ?? DateTime.Today,
                EndDate = plan.EndDate,
                DailyCalories = plan.DailyCalories,
                ProteinGrams = plan.ProteinGrams,
                CarbsGrams = plan.CarbsGrams,
                FatGrams = plan.FatsGrams,
                Status = plan.Status == "Active" ? 1 : plan.Status == "Completed" ? 2 : 0,
                StatusText = plan.Status,
                IsActive = plan.IsActive,
                CreatedAt = plan.CreatedAt,
                DietaryRestrictions = plan.DietaryRestrictions,
                AiPlanJson = detailAiPlanJson,
                Meals = detailMeals.Select(m => new PlanMealDto
                {
                    MealId = m.MealId,
                    Name = m.Name,
                    MealType = m.MealType,
                    Calories = m.Calories,
                    ProteinGrams = m.ProteinGrams,
                    CarbsGrams = m.CarbsGrams,
                    FatGrams = m.FatsGrams
                }).ToList()
            };
        }

        public async Task<NutritionPlanDto> GeneratePlanAsync(GenerateNutritionPlanDto generateDto)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(generateDto.MemberId);
            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {generateDto.MemberId} not found");
            }

            var plan = new NutritionPlan
            {
                UserId = generateDto.MemberId,
                PlanName = generateDto.PlanName,
                Description = generateDto.Description ?? $"Generated based on goal: {generateDto.FitnessGoal}",
                DailyCalories = generateDto.DailyCalories ?? 2000,
                ProteinGrams = generateDto.ProteinGrams ?? 150,
                CarbsGrams = generateDto.CarbsGrams ?? 200,
                FatsGrams = generateDto.FatGrams ?? 65,
                GeneratedByCoachId = generateDto.CreatedByCoachId,
                AiPrompt = $"Goal: {generateDto.FitnessGoal}, Restrictions: {generateDto.DietaryRestrictions}",
                AiPlanJson = generateDto.AiPlanJson,
                DietaryRestrictions = string.IsNullOrWhiteSpace(generateDto.DietaryRestrictions)
                    ? null
                    : generateDto.DietaryRestrictions.Split(',', System.StringSplitOptions.RemoveEmptyEntries)
                        .Select(s => s.Trim()).Where(s => s.Length > 0).ToArray(),
                Status = "Active",
                IsActive = true,
                StartDate = generateDto.StartDate,
                EndDate = generateDto.EndDate,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<NutritionPlan>().AddAsync(plan);
            await _unitOfWork.SaveChangesAsync();

            // Log this AI generation in the audit table
            if (!string.IsNullOrEmpty(generateDto.AiPlanJson))
            {
                var generation = new AiProgramGeneration
                {
                    UserId = generateDto.MemberId,
                    ProgramType = "Nutrition",
                    NutritionPlanId = plan.PlanId,
                    InputPrompt = plan.AiPrompt ?? $"Goal: {generateDto.FitnessGoal}",
                    GeneratedPlan = generateDto.AiPlanJson,
                    AiModel = "nutrition-ai",
                    CreatedAt = DateTime.UtcNow,
                };
                await _unitOfWork.Repository<AiProgramGeneration>().AddAsync(generation);
                await _unitOfWork.SaveChangesAsync();
            }

            return (await GetPlanDetailsAsync(plan.PlanId))!;
        }

        public async Task<NutritionPlanDto> UpdatePlanAsync(int planId, GenerateNutritionPlanDto updateDto)
        {
            var plan = await _unitOfWork.Repository<NutritionPlan>().GetByIdAsync(planId);
            if (plan == null)
            {
                throw new KeyNotFoundException($"Nutrition plan with ID {planId} not found");
            }

            plan.PlanName = updateDto.PlanName;
            plan.Description = updateDto.Description ?? plan.Description;
            plan.DailyCalories = updateDto.DailyCalories ?? plan.DailyCalories;
            plan.ProteinGrams = updateDto.ProteinGrams ?? plan.ProteinGrams;
            plan.CarbsGrams = updateDto.CarbsGrams ?? plan.CarbsGrams;
            plan.FatsGrams = updateDto.FatGrams ?? plan.FatsGrams;
            plan.AiPrompt = $"Goal: {updateDto.FitnessGoal}, Restrictions: {updateDto.DietaryRestrictions}";
            plan.StartDate = updateDto.StartDate;
            plan.EndDate = updateDto.EndDate;
            plan.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<NutritionPlan>().Update(plan);
            await _unitOfWork.SaveChangesAsync();

            return (await GetPlanDetailsAsync(planId))!;
        }

        public async Task<NutritionPlanDto> DeactivatePlanAsync(int planId)
        {
            var plan = await _unitOfWork.Repository<NutritionPlan>().GetByIdAsync(planId);
            if (plan == null)
            {
                throw new KeyNotFoundException($"Nutrition plan with ID {planId} not found");
            }

            plan.IsActive = false;
            plan.Status = "Inactive";
            plan.EndDate = DateTime.Today;
            plan.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<NutritionPlan>().Update(plan);
            await _unitOfWork.SaveChangesAsync();

            return (await GetPlanDetailsAsync(planId))!;
        }
    }
}
