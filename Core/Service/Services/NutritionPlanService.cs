using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using Microsoft.Extensions.Logging;
using ServiceAbstraction.Services;
using Shared.DTOs.Meal;
using Shared.DTOs.NutritionPlan;

namespace Service.Services
{
    public class NutritionPlanService : INutritionPlanService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<NutritionPlanService> _logger;

        public NutritionPlanService(IUnitOfWork unitOfWork, ILogger<NutritionPlanService> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
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
                    ApprovalNotes = plan.ApprovalNotes,
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
                ApprovalNotes = plan.ApprovalNotes,
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

        public async Task<IEnumerable<NutritionPlanDto>> GetCoachReviewNutritionPlansAsync(int coachUserId)
        {
            var coachProfile = (await _unitOfWork.Repository<CoachProfile>()
                .FindAsync(c => c.UserId == coachUserId))
                .FirstOrDefault();

            if (coachProfile == null)
            {
                return new List<NutritionPlanDto>();
            }

            var coachProfileId = coachProfile.Id;

            // Fetch plans that are either assigned to this coach, or have status UnderReview or PendingApproval
            var plans = (await _unitOfWork.Repository<NutritionPlan>()
                .FindAsync(p => p.GeneratedByCoachId == coachProfileId || p.Status == "UnderReview" || p.Status == "PendingApproval"))
                .OrderByDescending(p => p.CreatedAt)
                .ToList();

            var result = new List<NutritionPlanDto>();

            foreach (var plan in plans)
            {
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

                var planMeals = await _unitOfWork.Repository<Meal>().FindAsync(m => m.NutritionPlanId == plan.PlanId);

                var aiPlanJson = plan.AiPlanJson;
                if (string.IsNullOrEmpty(aiPlanJson))
                {
                    var generations = await _unitOfWork.Repository<AiProgramGeneration>()
                        .FindAsync(g => g.NutritionPlanId == plan.PlanId && g.GeneratedPlan != null);
                    aiPlanJson = generations.OrderByDescending(g => g.CreatedAt).FirstOrDefault()?.GeneratedPlan;
                }

                // Parse approval notes
                string? approvalNotes = plan.ApprovalNotes;

                result.Add(new NutritionPlanDto
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
                    ApprovalNotes = plan.ApprovalNotes,
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

        public async Task<bool> EditNutritionPlanAsync(int planId, int coachUserId, CoachEditNutritionPlanRequest request)
        {
            try
            {
                var coachProfile = (await _unitOfWork.Repository<CoachProfile>()
                    .FindAsync(c => c.UserId == coachUserId))
                    .FirstOrDefault();

                if (coachProfile == null)
                {
                    return false;
                }

                var plan = await _unitOfWork.Repository<NutritionPlan>().GetByIdAsync(planId);
                if (plan == null || (plan.GeneratedByCoachId != null && plan.GeneratedByCoachId != coachProfile.Id))
                {
                    return false;
                }

                if (plan.GeneratedByCoachId == null)
                {
                    plan.GeneratedByCoachId = coachProfile.Id;
                }

                // Update basic properties
                if (!string.IsNullOrEmpty(request.PlanName)) plan.PlanName = request.PlanName;
                if (!string.IsNullOrEmpty(request.Description)) plan.Description = request.Description;
                if (request.DailyCalories.HasValue) plan.DailyCalories = request.DailyCalories.Value;
                if (request.ProteinGrams.HasValue) plan.ProteinGrams = request.ProteinGrams.Value;
                if (request.CarbsGrams.HasValue) plan.CarbsGrams = request.CarbsGrams.Value;
                if (request.FatGrams.HasValue) plan.FatsGrams = request.FatGrams.Value;

                if (request.DietaryRestrictions != null)
                {
                    plan.DietaryRestrictions = request.DietaryRestrictions.ToArray();
                }

                plan.ApprovalNotes = request.CoachNotes;
                plan.Status = "Approved";
                plan.ApprovedByCoachId = coachProfile.Id;
                plan.ApprovedAt = DateTime.UtcNow;
                plan.UpdatedAt = DateTime.UtcNow;

                // Sync meals in the database
                var mealRepo = _unitOfWork.Repository<Meal>();
                var currentMeals = await mealRepo.FindAsync(m => m.NutritionPlanId == planId);

                // Collect all incoming meal items from request
                var incomingMeals = request.Days
                    .SelectMany(d => d.Meals.Select(m => new { DayNumber = d.DayNumber, Meal = m }))
                    .ToList();

                var incomingMealIds = incomingMeals
                    .Where(im => im.Meal.MealId.HasValue)
                    .Select(im => im.Meal.MealId!.Value)
                    .ToHashSet();

                // Delete meals that are not in the request
                var toDelete = currentMeals.Where(cm => !incomingMealIds.Contains(cm.MealId)).ToList();
                if (toDelete.Any())
                {
                    mealRepo.RemoveRange(toDelete);
                }

                // Update or Add meals
                foreach (var im in incomingMeals)
                {
                    if (im.Meal.MealId.HasValue)
                    {
                        var existingMeal = currentMeals.FirstOrDefault(cm => cm.MealId == im.Meal.MealId.Value);
                        if (existingMeal != null)
                        {
                            existingMeal.Name = im.Meal.Name;
                            existingMeal.MealType = im.Meal.MealType;
                            existingMeal.Calories = im.Meal.Calories;
                            existingMeal.ProteinGrams = im.Meal.ProteinGrams;
                            existingMeal.CarbsGrams = im.Meal.CarbsGrams;
                            existingMeal.FatsGrams = im.Meal.FatGrams;
                            existingMeal.RecommendedTime = TimeSpan.FromHours(im.DayNumber);
                            mealRepo.Update(existingMeal);
                        }
                    }
                    else
                    {
                        var newMeal = new Meal
                        {
                            NutritionPlanId = planId,
                            Name = im.Meal.Name,
                            MealType = im.Meal.MealType,
                            Calories = im.Meal.Calories,
                            ProteinGrams = im.Meal.ProteinGrams,
                            CarbsGrams = im.Meal.CarbsGrams,
                            FatsGrams = im.Meal.FatGrams,
                            RecommendedTime = TimeSpan.FromHours(im.DayNumber),
                            CreatedAt = DateTime.UtcNow
                        };
                        await mealRepo.AddAsync(newMeal);
                    }
                }

                // Reconstruct and update AiPlanJson representation
                var updatedPlanJsonObj = new
                {
                    plan_name = plan.PlanName,
                    daily_calories = plan.DailyCalories,
                    protein_grams = plan.ProteinGrams,
                    carbs_grams = plan.CarbsGrams,
                    fat_grams = plan.FatsGrams,
                    dietary_restrictions = plan.DietaryRestrictions,
                    days = request.Days.Select(d => new
                    {
                        day = d.DayNumber,
                        meals = d.Meals.GroupBy(m => m.MealType.ToLower()).ToDictionary(
                            g => g.Key,
                            g => new
                            {
                                items = g.Select(item => new
                                {
                                    name = item.Name,
                                    calories = item.Calories,
                                    protein_g = item.ProteinGrams,
                                    carbs_g = item.CarbsGrams,
                                    fat_g = item.FatGrams,
                                    description = item.Description
                                }).ToList()
                            }
                        )
                    }).ToList()
                };

                plan.AiPlanJson = System.Text.Json.JsonSerializer.Serialize(updatedPlanJsonObj);

                _unitOfWork.Repository<NutritionPlan>().Update(plan);
                await _unitOfWork.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error editing nutrition plan {PlanId}", planId);
                return false;
            }
        }

        public async Task<bool> UpdateNutritionPlanStatusAsync(int planId, int coachUserId, string status, string? notes)
        {
            try
            {
                var coachProfile = (await _unitOfWork.Repository<CoachProfile>()
                    .FindAsync(c => c.UserId == coachUserId))
                    .FirstOrDefault();

                if (coachProfile == null)
                {
                    return false;
                }

                var plan = await _unitOfWork.Repository<NutritionPlan>().GetByIdAsync(planId);
                if (plan == null || (plan.GeneratedByCoachId != null && plan.GeneratedByCoachId != coachProfile.Id))
                {
                    return false;
                }

                if (plan.GeneratedByCoachId == null)
                {
                    plan.GeneratedByCoachId = coachProfile.Id;
                }

                plan.Status = status;
                plan.ApprovalNotes = notes;
                plan.UpdatedAt = DateTime.UtcNow;

                if (status == "Approved")
                {
                    plan.ApprovedByCoachId = coachProfile.Id;
                    plan.ApprovedAt = DateTime.UtcNow;
                }

                _unitOfWork.Repository<NutritionPlan>().Update(plan);
                await _unitOfWork.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating nutrition plan status {PlanId}", planId);
                return false;
            }
        }
    }
}

