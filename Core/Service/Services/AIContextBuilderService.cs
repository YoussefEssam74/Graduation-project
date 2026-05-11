using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using Microsoft.Extensions.Logging;
using ServiceAbstraction.Services;
using System.Text;

namespace Service.Services
{
    /// <summary>
    /// Aggregates all user-specific fitness data into a structured context string
    /// that is injected into the Groq system prompt as RAG context.
    /// </summary>
    public class AIContextBuilderService : IAIContextBuilderService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<AIContextBuilderService> _logger;

        public AIContextBuilderService(IUnitOfWork unitOfWork, ILogger<AIContextBuilderService> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<string> BuildUserContextAsync(int userId)
        {
            var sb = new StringBuilder();

            try
            {
                // 1. User basic info
                var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
                if (user != null)
                {
                    sb.AppendLine("=== MEMBER PROFILE ===");
                    sb.AppendLine($"Name: {user.Name}");
                    if (user.DateOfBirth.HasValue)
                    {
                        var age = (int)((DateTime.UtcNow - user.DateOfBirth.Value).TotalDays / 365.25);
                        sb.AppendLine($"Age: {age}");
                    }
                    if (user.Gender.HasValue) sb.AppendLine($"Gender: {user.Gender}");
                }

                // Member profile (fitness-specific fields)
                var memberProfiles = await _unitOfWork.Repository<MemberProfile>()
                    .FindAsync(p => p.UserId == userId);
                var memberProfile = memberProfiles.FirstOrDefault();
                if (memberProfile != null)
                {
                    if (memberProfile.Height.HasValue) sb.AppendLine($"Height: {memberProfile.Height} cm");
                    if (memberProfile.CurrentWeight.HasValue) sb.AppendLine($"Current Weight: {memberProfile.CurrentWeight} kg");
                    if (memberProfile.TargetWeight.HasValue) sb.AppendLine($"Target Weight: {memberProfile.TargetWeight} kg");
                    if (!string.IsNullOrEmpty(memberProfile.FitnessGoal)) sb.AppendLine($"Fitness Goal: {memberProfile.FitnessGoal}");
                    if (!string.IsNullOrEmpty(memberProfile.FitnessLevel)) sb.AppendLine($"Fitness Level: {memberProfile.FitnessLevel}");
                    if (!string.IsNullOrEmpty(memberProfile.MedicalConditions)) sb.AppendLine($"Medical Conditions: {memberProfile.MedicalConditions}");
                    sb.AppendLine($"Total Workouts Completed: {memberProfile.TotalWorkoutsCompleted}");
                }

                // 2. Latest InBody measurement
                var inBodyMeasurements = await _unitOfWork.Repository<InBodyMeasurement>()
                    .FindAsync(m => m.UserId == userId);
                var latestInBody = inBodyMeasurements
                    .OrderByDescending(m => m.MeasurementDate)
                    .FirstOrDefault();

                if (latestInBody != null)
                {
                    sb.AppendLine();
                    sb.AppendLine("=== BODY COMPOSITION (Latest InBody) ===");
                    sb.AppendLine($"Date: {latestInBody.MeasurementDate:yyyy-MM-dd}");
                    sb.AppendLine($"Weight: {latestInBody.Weight} kg");
                    if (latestInBody.BodyFatPercentage.HasValue) sb.AppendLine($"Body Fat: {latestInBody.BodyFatPercentage}%");
                    if (latestInBody.MuscleMass.HasValue) sb.AppendLine($"Muscle Mass: {latestInBody.MuscleMass} kg");
                    if (latestInBody.Bmr.HasValue) sb.AppendLine($"BMR: {latestInBody.Bmr} kcal");
                    if (latestInBody.VisceralFatLevel.HasValue) sb.AppendLine($"Visceral Fat Level: {latestInBody.VisceralFatLevel}");
                    if (!string.IsNullOrEmpty(latestInBody.BodyType)) sb.AppendLine($"Body Type: {latestInBody.BodyType}");
                }

                // 3. Active nutrition plan
                var nutritionPlans = await _unitOfWork.Repository<NutritionPlan>()
                    .FindAsync(p => p.UserId == userId && p.IsActive);
                var activePlan = nutritionPlans.FirstOrDefault();

                if (activePlan != null)
                {
                    sb.AppendLine();
                    sb.AppendLine("=== ACTIVE NUTRITION PLAN ===");
                    sb.AppendLine($"Plan: {activePlan.PlanName}");
                    sb.AppendLine($"Daily Calories Target: {activePlan.DailyCalories} kcal");
                    sb.AppendLine($"Protein: {activePlan.ProteinGrams}g | Carbs: {activePlan.CarbsGrams}g | Fats: {activePlan.FatsGrams}g");

                    // Load meals for this plan
                    var meals = await _unitOfWork.Repository<Meal>()
                        .FindAsync(m => m.NutritionPlanId == activePlan.PlanId);
                    var mealList = meals.OrderBy(m => m.RecommendedTime).ToList();

                    if (mealList.Any())
                    {
                        sb.AppendLine("Meals:");
                        foreach (var meal in mealList.Take(6)) // cap at 6 meals to limit token usage
                        {
                            sb.AppendLine($"  - {meal.Name} ({meal.MealType}): {meal.Calories} kcal | P:{meal.ProteinGrams}g C:{meal.CarbsGrams}g F:{meal.FatsGrams}g");
                        }
                    }
                }

                // 4. Active AI workout plan
                var workoutPlans = await _unitOfWork.Repository<UserAIWorkoutPlan>()
                    .FindAsync(p => p.UserId == userId && p.IsActive);
                var activeWorkout = workoutPlans
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefault();

                if (activeWorkout != null)
                {
                    sb.AppendLine();
                    sb.AppendLine("=== ACTIVE WORKOUT PLAN ===");
                    sb.AppendLine($"Plan: {activeWorkout.PlanName}");
                    if (!string.IsNullOrEmpty(activeWorkout.Goal)) sb.AppendLine($"Goal: {activeWorkout.Goal}");
                    if (!string.IsNullOrEmpty(activeWorkout.FitnessLevel)) sb.AppendLine($"Level: {activeWorkout.FitnessLevel}");
                    if (activeWorkout.DaysPerWeek.HasValue) sb.AppendLine($"Days/Week: {activeWorkout.DaysPerWeek}");
                    if (activeWorkout.ProgramDurationWeeks.HasValue) sb.AppendLine($"Duration: {activeWorkout.ProgramDurationWeeks} weeks");

                    // Load days and exercises
                    var days = await _unitOfWork.Repository<UserAIWorkoutPlanDay>()
                        .FindAsync(d => d.PlanId == activeWorkout.PlanId);
                    var dayList = days.OrderBy(d => d.DayNumber).ToList();

                    foreach (var day in dayList)
                    {
                        sb.AppendLine($"  Day {day.DayNumber} - {day.DayName ?? "Workout"}" +
                            (string.IsNullOrEmpty(day.FocusAreas) ? "" : $" [{day.FocusAreas}]"));

                        var exercises = await _unitOfWork.Repository<UserAIWorkoutPlanExercise>()
                            .FindAsync(e => e.PlanDayId == day.DayId);
                        foreach (var ex in exercises.OrderBy(e => e.OrderInDay))
                        {
                            var detail = $"    • {ex.ExerciseName}";
                            if (!string.IsNullOrEmpty(ex.Sets) && !string.IsNullOrEmpty(ex.Reps))
                                detail += $": {ex.Sets} sets x {ex.Reps} reps";
                            if (!string.IsNullOrEmpty(ex.TargetMuscle)) detail += $" ({ex.TargetMuscle})";
                            if (ex.WeightKg.HasValue) detail += $" @ {ex.WeightKg}kg";
                            sb.AppendLine(detail);
                        }
                    }
                }

                // 5. Top strength benchmarks (max 8 exercises to keep context lean)
                var strengthProfiles = await _unitOfWork.Repository<UserStrengthProfile>()
                    .FindAsync(s => s.UserId == userId);
                var topStrength = strengthProfiles
                    .Where(s => s.ConfidenceScore >= 0.5m && s.Estimated1RM > 0)
                    .OrderByDescending(s => s.ConfidenceScore)
                    .Take(8)
                    .ToList();

                if (topStrength.Any())
                {
                    sb.AppendLine();
                    sb.AppendLine("=== ESTIMATED STRENGTH (1RM) ===");
                    foreach (var s in topStrength)
                    {
                        // ExerciseId only; name resolution requires a join — use ID for now
                        sb.AppendLine($"  Exercise #{s.ExerciseId}: ~{s.Estimated1RM:F1}kg 1RM (confidence: {s.ConfidenceScore:P0})");
                    }
                }

                if (sb.Length == 0)
                    return "No fitness data available for this member yet.";

                return sb.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to build full AI context for user {UserId}, returning partial context", userId);
                return sb.Length > 0 ? sb.ToString() : "Member data temporarily unavailable.";
            }
        }
    }
}
