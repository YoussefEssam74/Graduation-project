using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using Microsoft.Extensions.Logging;
using ServiceAbstraction.Services;
using IntelliFit.Shared.DTOs.Meal;
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

                var planMeals = (await _unitOfWork.Repository<Meal>().FindAsync(m => m.NutritionPlanId == plan.PlanId)).ToList();
                var mealIds = planMeals.Select(m => m.MealId).ToList();

                var mealIngredients = mealIds.Any()
                    ? (await _unitOfWork.Repository<MealIngredient>().FindAsync(mi => mealIds.Contains(mi.MealId))).ToList()
                    : new List<MealIngredient>();

                var ingredientIds = mealIngredients.Select(mi => mi.IngredientId).Distinct().ToList();
                var ingredients = ingredientIds.Any()
                    ? (await _unitOfWork.Repository<Ingredient>().FindAsync(i => ingredientIds.Contains(i.IngredientId))).ToList()
                    : new List<Ingredient>();

                var ingredientDict = ingredients.ToDictionary(i => i.IngredientId);

                var allAllergies = (await _unitOfWork.Repository<Allergy>().GetAllAsync()).ToDictionary(a => a.AllergyId);
                var ingredientAllergies = ingredientIds.Any()
                    ? (await _unitOfWork.Repository<IngredientAllergy>().FindAsync(ia => ingredientIds.Contains(ia.IngredientId))).ToList()
                    : new List<IngredientAllergy>();
                var ingredientAllergiesGrouped = ingredientAllergies
                    .GroupBy(ia => ia.IngredientId)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(ia => allAllergies.TryGetValue(ia.AllergyId, out var al) ? al.Name : null)
                              .Where(name => name != null)
                              .Select(name => name!)
                              .ToList()
                    );

                var mealIngredientsGrouped = mealIngredients
                    .GroupBy(mi => mi.MealId)
                    .ToDictionary(g => g.Key, g => g.ToList());

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
                        FatGrams = m.FatsGrams,
                        DayNumber = (int)m.RecommendedTime.TotalHours,
                        Ingredients = mealIngredientsGrouped.TryGetValue(m.MealId, out var mis)
                            ? mis.Select(mi => 
                            {
                                var hasIng = ingredientDict.TryGetValue(mi.IngredientId, out var ing);
                                return new MealIngredientDto
                                {
                                    MealIngredientId = mi.MealIngredientId,
                                    MealId = mi.MealId,
                                    IngredientId = mi.IngredientId,
                                    Quantity = mi.Quantity,
                                    Unit = mi.Unit ?? "g",
                                    IngredientName = hasIng ? ing!.Name : "Unknown",
                                    Category = hasIng ? ing!.Category : null,
                                    CaloriesPer100g = hasIng ? ing!.CaloriesPer100g : 0,
                                    ProteinPer100g = hasIng ? ing!.ProteinPer100g : 0,
                                    CarbsPer100g = hasIng ? ing!.CarbsPer100g : 0,
                                    FatsPer100g = hasIng ? ing!.FatsPer100g : 0,
                                    ContainsDairy = hasIng ? ing!.ContainsDairy : false,
                                    ContainsGluten = hasIng ? ing!.ContainsGluten : false,
                                    ContainsNuts = hasIng ? ing!.ContainsNuts : false,
                                    ContainsSoy = hasIng ? ing!.ContainsSoy : false,
                                    ContainsEggs = hasIng ? ing!.ContainsEggs : false,
                                    ContainsFish = hasIng ? ing!.ContainsFish : false,
                                    FoodRole = hasIng ? ing!.FoodRole : null,
                                    Allergies = hasIng && ingredientAllergiesGrouped.TryGetValue(mi.IngredientId, out var algList) ? algList : new List<string>()
                                };
                            }).ToList()
                            : new List<MealIngredientDto>()
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

            var detailMeals = (await _unitOfWork.Repository<Meal>().FindAsync(m => m.NutritionPlanId == plan.PlanId)).ToList();
            var mealIds = detailMeals.Select(m => m.MealId).ToList();

            var mealIngredients = mealIds.Any()
                ? (await _unitOfWork.Repository<MealIngredient>().FindAsync(mi => mealIds.Contains(mi.MealId))).ToList()
                : new List<MealIngredient>();

            var ingredientIds = mealIngredients.Select(mi => mi.IngredientId).Distinct().ToList();
            var ingredients = ingredientIds.Any()
                ? (await _unitOfWork.Repository<Ingredient>().FindAsync(i => ingredientIds.Contains(i.IngredientId))).ToList()
                : new List<Ingredient>();

            var ingredientDict = ingredients.ToDictionary(i => i.IngredientId);

            var allAllergies = (await _unitOfWork.Repository<Allergy>().GetAllAsync()).ToDictionary(a => a.AllergyId);
            var ingredientAllergies = ingredientIds.Any()
                ? (await _unitOfWork.Repository<IngredientAllergy>().FindAsync(ia => ingredientIds.Contains(ia.IngredientId))).ToList()
                : new List<IngredientAllergy>();
            var ingredientAllergiesGrouped = ingredientAllergies
                .GroupBy(ia => ia.IngredientId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(ia => allAllergies.TryGetValue(ia.AllergyId, out var al) ? al.Name : null)
                          .Where(name => name != null)
                          .Select(name => name!)
                          .ToList()
                );

            var mealIngredientsGrouped = mealIngredients
                .GroupBy(mi => mi.MealId)
                .ToDictionary(g => g.Key, g => g.ToList());

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
                    FatGrams = m.FatsGrams,
                    DayNumber = (int)m.RecommendedTime.TotalHours,
                    Ingredients = mealIngredientsGrouped.TryGetValue(m.MealId, out var mis)
                        ? mis.Select(mi => 
                        {
                            var hasIng = ingredientDict.TryGetValue(mi.IngredientId, out var ing);
                            return new MealIngredientDto
                            {
                                MealIngredientId = mi.MealIngredientId,
                                MealId = mi.MealId,
                                IngredientId = mi.IngredientId,
                                Quantity = mi.Quantity,
                                Unit = mi.Unit ?? "g",
                                IngredientName = hasIng ? ing!.Name : "Unknown",
                                Category = hasIng ? ing!.Category : null,
                                CaloriesPer100g = hasIng ? ing!.CaloriesPer100g : 0,
                                ProteinPer100g = hasIng ? ing!.ProteinPer100g : 0,
                                CarbsPer100g = hasIng ? ing!.CarbsPer100g : 0,
                                FatsPer100g = hasIng ? ing!.FatsPer100g : 0,
                                ContainsDairy = hasIng ? ing!.ContainsDairy : false,
                                ContainsGluten = hasIng ? ing!.ContainsGluten : false,
                                ContainsNuts = hasIng ? ing!.ContainsNuts : false,
                                ContainsSoy = hasIng ? ing!.ContainsSoy : false,
                                ContainsEggs = hasIng ? ing!.ContainsEggs : false,
                                ContainsFish = hasIng ? ing!.ContainsFish : false,
                                FoodRole = hasIng ? ing!.FoodRole : null,
                                Allergies = hasIng && ingredientAllergiesGrouped.TryGetValue(mi.IngredientId, out var algList) ? algList : new List<string>()
                            };
                        }).ToList()
                        : new List<MealIngredientDto>()
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
                Status = "UnderReview",
                IsActive = true,
                StartDate = generateDto.StartDate,
                EndDate = generateDto.EndDate,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // Auto-assign to an available coach if not generated by a coach
            if (plan.GeneratedByCoachId == null)
            {
                var availableCoach = (await _unitOfWork.Repository<CoachProfile>()
                    .FindAsync(c => c.IsAvailable))
                    .FirstOrDefault();
                if (availableCoach != null)
                {
                    plan.GeneratedByCoachId = availableCoach.Id;
                }
            }

            // Deactivate existing active plans for the user
            var existingPlans = await _unitOfWork.Repository<NutritionPlan>()
                .FindAsync(p => p.UserId == generateDto.MemberId && p.IsActive);
            foreach (var existingPlan in existingPlans)
            {
                existingPlan.IsActive = false;
                existingPlan.Status = "Inactive";
                existingPlan.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.Repository<NutritionPlan>().Update(existingPlan);
            }

            await _unitOfWork.Repository<NutritionPlan>().AddAsync(plan);
            await _unitOfWork.SaveChangesAsync();

            // Parse AiPlanJson and save meals in database
            if (!string.IsNullOrEmpty(generateDto.AiPlanJson))
            {
                var meals = ParseMealsFromJson(generateDto.AiPlanJson, plan.PlanId);
                if (meals.Any())
                {
                    await _unitOfWork.Repository<Meal>().AddRangeAsync(meals);
                    await _unitOfWork.SaveChangesAsync();
                }
            }

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

                var planMeals = (await _unitOfWork.Repository<Meal>().FindAsync(m => m.NutritionPlanId == plan.PlanId)).ToList();
                var mealIds = planMeals.Select(m => m.MealId).ToList();

                var mealIngredients = mealIds.Any()
                    ? (await _unitOfWork.Repository<MealIngredient>().FindAsync(mi => mealIds.Contains(mi.MealId))).ToList()
                    : new List<MealIngredient>();

                var ingredientIds = mealIngredients.Select(mi => mi.IngredientId).Distinct().ToList();
                var ingredients = ingredientIds.Any()
                    ? (await _unitOfWork.Repository<Ingredient>().FindAsync(i => ingredientIds.Contains(i.IngredientId))).ToList()
                    : new List<Ingredient>();

                var ingredientDict = ingredients.ToDictionary(i => i.IngredientId);

                var allAllergies = (await _unitOfWork.Repository<Allergy>().GetAllAsync()).ToDictionary(a => a.AllergyId);
                var ingredientAllergies = ingredientIds.Any()
                    ? (await _unitOfWork.Repository<IngredientAllergy>().FindAsync(ia => ingredientIds.Contains(ia.IngredientId))).ToList()
                    : new List<IngredientAllergy>();
                var ingredientAllergiesGrouped = ingredientAllergies
                    .GroupBy(ia => ia.IngredientId)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(ia => allAllergies.TryGetValue(ia.AllergyId, out var al) ? al.Name : null)
                              .Where(name => name != null)
                              .Select(name => name!)
                              .ToList()
                    );

                var mealIngredientsGrouped = mealIngredients
                    .GroupBy(mi => mi.MealId)
                    .ToDictionary(g => g.Key, g => g.ToList());

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
                        FatGrams = m.FatsGrams,
                        DayNumber = (int)m.RecommendedTime.TotalHours,
                        Ingredients = mealIngredientsGrouped.TryGetValue(m.MealId, out var mis)
                            ? mis.Select(mi => 
                            {
                                var hasIng = ingredientDict.TryGetValue(mi.IngredientId, out var ing);
                                return new MealIngredientDto
                                {
                                    MealIngredientId = mi.MealIngredientId,
                                    MealId = mi.MealId,
                                    IngredientId = mi.IngredientId,
                                    Quantity = mi.Quantity,
                                    Unit = mi.Unit ?? "g",
                                    IngredientName = hasIng ? ing!.Name : "Unknown",
                                    Category = hasIng ? ing!.Category : null,
                                    CaloriesPer100g = hasIng ? ing!.CaloriesPer100g : 0,
                                    ProteinPer100g = hasIng ? ing!.ProteinPer100g : 0,
                                    CarbsPer100g = hasIng ? ing!.CarbsPer100g : 0,
                                    FatsPer100g = hasIng ? ing!.FatsPer100g : 0,
                                    ContainsDairy = hasIng ? ing!.ContainsDairy : false,
                                    ContainsGluten = hasIng ? ing!.ContainsGluten : false,
                                    ContainsNuts = hasIng ? ing!.ContainsNuts : false,
                                    ContainsSoy = hasIng ? ing!.ContainsSoy : false,
                                    ContainsEggs = hasIng ? ing!.ContainsEggs : false,
                                    ContainsFish = hasIng ? ing!.ContainsFish : false,
                                    FoodRole = hasIng ? ing!.FoodRole : null,
                                    Allergies = hasIng && ingredientAllergiesGrouped.TryGetValue(mi.IngredientId, out var algList) ? algList : new List<string>()
                                };
                            }).ToList()
                            : new List<MealIngredientDto>()
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

                var mealIngRepo = _unitOfWork.Repository<MealIngredient>();
                var ingRepo = _unitOfWork.Repository<Ingredient>();

                // Update or Add meals
                foreach (var im in incomingMeals)
                {
                    Meal mealToSync;
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
                            mealToSync = existingMeal;
                        }
                        else
                        {
                            continue;
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
                        mealToSync = newMeal;
                    }

                    // Synchronize meal ingredients and master ingredients
                    var currentMealIngredients = mealToSync.MealId > 0
                        ? await mealIngRepo.FindAsync(mi => mi.MealId == mealToSync.MealId)
                        : new List<MealIngredient>();

                    var incomingIngredients = im.Meal.Ingredients ?? new List<CoachEditPlanMealIngredientDto>();

                    // 1. Delete removed meal ingredients
                    var incomingMealIngIds = incomingIngredients
                        .Where(ii => ii.MealIngredientId.HasValue)
                        .Select(ii => ii.MealIngredientId!.Value)
                        .ToHashSet();

                    var mealIngToDelete = currentMealIngredients
                        .Where(cmi => !incomingMealIngIds.Contains(cmi.MealIngredientId))
                        .ToList();

                    if (mealIngToDelete.Any())
                    {
                        mealIngRepo.RemoveRange(mealIngToDelete);
                    }

                    // 2. Add or Update meal ingredients + update master ingredient properties if they changed
                    foreach (var ii in incomingIngredients)
                    {
                        var ingredient = await ingRepo.GetByIdAsync(ii.IngredientId);
                        if (ingredient != null)
                        {
                            bool ingredientChanged = false;
                            if (ii.Name != null && ii.Name != ingredient.Name) { ingredient.Name = ii.Name; ingredientChanged = true; }
                            if (ii.Category != null && ii.Category != ingredient.Category) { ingredient.Category = ii.Category; ingredientChanged = true; }
                            if (ii.CaloriesPer100g.HasValue && ii.CaloriesPer100g.Value != ingredient.CaloriesPer100g) { ingredient.CaloriesPer100g = ii.CaloriesPer100g.Value; ingredientChanged = true; }
                            if (ii.ProteinPer100g.HasValue && ii.ProteinPer100g.Value != ingredient.ProteinPer100g) { ingredient.ProteinPer100g = ii.ProteinPer100g.Value; ingredientChanged = true; }
                            if (ii.CarbsPer100g.HasValue && ii.CarbsPer100g.Value != ingredient.CarbsPer100g) { ingredient.CarbsPer100g = ii.CarbsPer100g.Value; ingredientChanged = true; }
                            if (ii.FatsPer100g.HasValue && ii.FatsPer100g.Value != ingredient.FatsPer100g) { ingredient.FatsPer100g = ii.FatsPer100g.Value; ingredientChanged = true; }
                            if (ii.ContainsDairy.HasValue && ii.ContainsDairy.Value != ingredient.ContainsDairy) { ingredient.ContainsDairy = ii.ContainsDairy.Value; ingredientChanged = true; }
                            if (ii.ContainsGluten.HasValue && ii.ContainsGluten.Value != ingredient.ContainsGluten) { ingredient.ContainsGluten = ii.ContainsGluten.Value; ingredientChanged = true; }
                            if (ii.ContainsNuts.HasValue && ii.ContainsNuts.Value != ingredient.ContainsNuts) { ingredient.ContainsNuts = ii.ContainsNuts.Value; ingredientChanged = true; }
                            if (ii.ContainsSoy.HasValue && ii.ContainsSoy.Value != ingredient.ContainsSoy) { ingredient.ContainsSoy = ii.ContainsSoy.Value; ingredientChanged = true; }
                            if (ii.ContainsEggs.HasValue && ii.ContainsEggs.Value != ingredient.ContainsEggs) { ingredient.ContainsEggs = ii.ContainsEggs.Value; ingredientChanged = true; }
                            if (ii.ContainsFish.HasValue && ii.ContainsFish.Value != ingredient.ContainsFish) { ingredient.ContainsFish = ii.ContainsFish.Value; ingredientChanged = true; }
                            if (ii.FoodRole != null && ii.FoodRole != ingredient.FoodRole) { ingredient.FoodRole = ii.FoodRole; ingredientChanged = true; }

                             if (ii.Allergies != null)
                             {
                                 var existingAllergies = await _unitOfWork.Repository<IngredientAllergy>()
                                     .FindAsync(ia => ia.IngredientId == ingredient.IngredientId);
                                 if (existingAllergies.Any())
                                 {
                                     _unitOfWork.Repository<IngredientAllergy>().RemoveRange(existingAllergies);
                                 }

                                 foreach (var name in ii.Allergies.Select(n => n.Trim()).Where(n => !string.IsNullOrEmpty(n)))
                                 {
                                     var allergy = await _unitOfWork.Repository<Allergy>()
                                         .FirstOrDefaultAsync(a => a.Name.ToLower() == name.ToLower());
                                     if (allergy == null)
                                     {
                                         allergy = new Allergy { Name = name };
                                         await _unitOfWork.Repository<Allergy>().AddAsync(allergy);
                                         await _unitOfWork.SaveChangesAsync();
                                     }

                                     await _unitOfWork.Repository<IngredientAllergy>().AddAsync(new IngredientAllergy
                                     {
                                         IngredientId = ingredient.IngredientId,
                                         AllergyId = allergy.AllergyId
                                     });
                                 }

                                 ingredient.ContainsDairy = ii.Allergies.Any(a => a.Equals("dairy", StringComparison.OrdinalIgnoreCase));
                                 ingredient.ContainsGluten = ii.Allergies.Any(a => a.Equals("gluten", StringComparison.OrdinalIgnoreCase));
                                 ingredient.ContainsNuts = ii.Allergies.Any(a => a.Equals("nuts", StringComparison.OrdinalIgnoreCase));
                                 ingredient.ContainsSoy = ii.Allergies.Any(a => a.Equals("soy", StringComparison.OrdinalIgnoreCase));
                                 ingredient.ContainsEggs = ii.Allergies.Any(a => a.Equals("eggs", StringComparison.OrdinalIgnoreCase));
                                 ingredient.ContainsFish = ii.Allergies.Any(a => a.Equals("fish", StringComparison.OrdinalIgnoreCase));
                                 ingredientChanged = true;
                             }

                             if (ingredientChanged)
                             {
                                 ingRepo.Update(ingredient);
                             }
                        }

                        if (ii.MealIngredientId.HasValue)
                        {
                            var existingMi = currentMealIngredients.FirstOrDefault(cmi => cmi.MealIngredientId == ii.MealIngredientId.Value);
                            if (existingMi != null)
                            {
                                existingMi.Quantity = ii.Quantity;
                                existingMi.Unit = ii.Unit;
                                existingMi.IngredientId = ii.IngredientId;
                                mealIngRepo.Update(existingMi);
                            }
                        }
                        else
                        {
                            var newMi = new MealIngredient
                            {
                                MealId = mealToSync.MealId,
                                IngredientId = ii.IngredientId,
                                Quantity = ii.Quantity,
                                Unit = ii.Unit
                            };

                            if (mealToSync.MealId > 0)
                            {
                                await mealIngRepo.AddAsync(newMi);
                            }
                            else
                            {
                                mealToSync.Ingredients.Add(newMi);
                            }
                        }
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

        private List<Meal> ParseMealsFromJson(string? aiPlanJson, int planId)
        {
            var meals = new List<Meal>();
            if (string.IsNullOrWhiteSpace(aiPlanJson))
            {
                return meals;
            }

            try
            {
                using (var doc = JsonDocument.Parse(aiPlanJson))
                {
                    var root = doc.RootElement;
                    if (root.TryGetProperty("days", out var daysElement) && daysElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var dayElement in daysElement.EnumerateArray())
                        {
                            int dayNumber = 1;
                            if (dayElement.TryGetProperty("day", out var dayProp))
                            {
                                dayNumber = dayProp.GetInt32();
                            }
                            else if (dayElement.TryGetProperty("dayNumber", out var dayNumProp))
                            {
                                dayNumber = dayNumProp.GetInt32();
                            }

                            if (dayElement.TryGetProperty("meals", out var mealsElement) && mealsElement.ValueKind == JsonValueKind.Object)
                            {
                                foreach (var mealTypeProp in mealsElement.EnumerateObject())
                                {
                                    string mealType = mealTypeProp.Name;
                                    var mealObj = mealTypeProp.Value;
                                    if (mealObj.TryGetProperty("items", out var itemsElement) && itemsElement.ValueKind == JsonValueKind.Array)
                                    {
                                        foreach (var itemElement in itemsElement.EnumerateArray())
                                        {
                                            string mealName = "Food Item";
                                            if (itemElement.TryGetProperty("name", out var nameProp))
                                            {
                                                mealName = nameProp.GetString() ?? "Food Item";
                                            }
                                            else if (itemElement.TryGetProperty("foodName", out var foodNameProp))
                                            {
                                                mealName = foodNameProp.GetString() ?? "Food Item";
                                            }

                                            int calories = 0;
                                            if (itemElement.TryGetProperty("calories", out var calProp))
                                            {
                                                if (calProp.ValueKind == JsonValueKind.Number)
                                                    calories = (int)Math.Round(calProp.GetDouble());
                                                else if (calProp.ValueKind == JsonValueKind.String && double.TryParse(calProp.GetString(), out var calVal))
                                                    calories = (int)Math.Round(calVal);
                                            }

                                            int protein = 0;
                                            if (itemElement.TryGetProperty("protein_g", out var protGProp))
                                            {
                                                if (protGProp.ValueKind == JsonValueKind.Number)
                                                    protein = (int)Math.Round(protGProp.GetDouble());
                                                else if (protGProp.ValueKind == JsonValueKind.String && double.TryParse(protGProp.GetString(), out var protGVal))
                                                    protein = (int)Math.Round(protGVal);
                                            }
                                            else if (itemElement.TryGetProperty("protein", out var protProp))
                                            {
                                                if (protProp.ValueKind == JsonValueKind.Number)
                                                    protein = (int)Math.Round(protProp.GetDouble());
                                                else if (protProp.ValueKind == JsonValueKind.String && double.TryParse(protProp.GetString(), out var protVal))
                                                    protein = (int)Math.Round(protVal);
                                            }

                                            int carbs = 0;
                                            if (itemElement.TryGetProperty("carbs_g", out var carbsGProp))
                                            {
                                                if (carbsGProp.ValueKind == JsonValueKind.Number)
                                                    carbs = (int)Math.Round(carbsGProp.GetDouble());
                                                else if (carbsGProp.ValueKind == JsonValueKind.String && double.TryParse(carbsGProp.GetString(), out var carbsGVal))
                                                    carbs = (int)Math.Round(carbsGVal);
                                            }
                                            else if (itemElement.TryGetProperty("carbs", out var carbsProp))
                                            {
                                                if (carbsProp.ValueKind == JsonValueKind.Number)
                                                    carbs = (int)Math.Round(carbsProp.GetDouble());
                                                else if (carbsProp.ValueKind == JsonValueKind.String && double.TryParse(carbsProp.GetString(), out var carbsVal))
                                                    carbs = (int)Math.Round(carbsVal);
                                            }

                                            int fat = 0;
                                            if (itemElement.TryGetProperty("fat_g", out var fatGProp))
                                            {
                                                if (fatGProp.ValueKind == JsonValueKind.Number)
                                                    fat = (int)Math.Round(fatGProp.GetDouble());
                                                else if (fatGProp.ValueKind == JsonValueKind.String && double.TryParse(fatGProp.GetString(), out var fatGVal))
                                                    fat = (int)Math.Round(fatGVal);
                                            }
                                            else if (itemElement.TryGetProperty("fats", out var fatsProp))
                                            {
                                                if (fatsProp.ValueKind == JsonValueKind.Number)
                                                    fat = (int)Math.Round(fatsProp.GetDouble());
                                                else if (fatsProp.ValueKind == JsonValueKind.String && double.TryParse(fatsProp.GetString(), out var fatsVal))
                                                    fat = (int)Math.Round(fatsVal);
                                            }
                                            else if (itemElement.TryGetProperty("fat", out var fatProp))
                                            {
                                                if (fatProp.ValueKind == JsonValueKind.Number)
                                                    fat = (int)Math.Round(fatProp.GetDouble());
                                                else if (fatProp.ValueKind == JsonValueKind.String && double.TryParse(fatProp.GetString(), out var fatVal))
                                                    fat = (int)Math.Round(fatVal);
                                            }

                                            meals.Add(new Meal
                                            {
                                                NutritionPlanId = planId,
                                                Name = mealName,
                                                MealType = mealType,
                                                Calories = calories,
                                                ProteinGrams = protein,
                                                CarbsGrams = carbs,
                                                FatsGrams = fat,
                                                RecommendedTime = TimeSpan.FromHours(dayNumber),
                                                CreatedAt = DateTime.UtcNow
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing AI nutrition plan JSON for plan ID {PlanId}", planId);
            }

            return meals;
        }
    }
}

