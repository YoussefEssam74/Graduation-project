using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using ServiceAbstraction.Services;
using Shared.DTOs.WorkoutPlan;

namespace Service.Services
{
    public class WorkoutPlanService : IWorkoutPlanService
    {
        private readonly IUnitOfWork _unitOfWork;

        public WorkoutPlanService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<WorkoutPlanDto>> GetAllTemplatesAsync()
        {
            var templates = await _unitOfWork.Repository<WorkoutTemplate>().GetAllAsync();

            return templates
                .Where(t => t.IsActive && t.IsPublic)
                .Select(MapTemplateToDto);
        }

        public async Task<WorkoutPlanDto?> GetPlanByIdAsync(int planId)
        {
            var template = await _unitOfWork.Repository<WorkoutTemplate>().GetByIdAsync(planId);
            return template == null ? null : MapTemplateToDto(template);
        }

        public async Task<IEnumerable<MemberWorkoutPlanDto>> GetMemberPlansAsync(int memberId)
        {
            var plans = await _unitOfWork.Repository<WorkoutPlan>().GetAllAsync();
            // Include all plans for this user (Active, Draft, etc.)
            var userPlans = plans.Where(p => p.UserId == memberId).OrderByDescending(p => p.CreatedAt);

            var result = new List<MemberWorkoutPlanDto>();
            var member = await _unitOfWork.Repository<User>().GetByIdAsync(memberId);

            // Fetch scheduled days for all plans efficiently
            var planIds = userPlans.Select(p => p.PlanId).ToList();
            var allScheduledDays = (await _unitOfWork.Repository<WorkoutScheduledDay>().GetAllAsync())
                .Where(d => planIds.Contains(d.WorkoutPlanId))
                .ToList();

            foreach (var plan in userPlans)
            {
                var logs = await _unitOfWork.Repository<WorkoutLog>().GetAllAsync();
                var completedWorkouts = logs.Count(l => l.PlanId == plan.PlanId && l.Completed);
                var daysPerWeek = plan.DaysPerWeek ?? 3;
                var totalWorkouts = (plan.DurationWeeks ?? 4) * daysPerWeek;

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

                var planScheduledDays = allScheduledDays
                    .Where(d => d.WorkoutPlanId == plan.PlanId)
                    .Select(d => new ScheduledDayDto
                    {
                        ScheduledDayId = d.ScheduledDayId,
                        ScheduledDate = d.ScheduledDate,
                        StartTime = d.StartTime,
                        WeekNumber = d.WeekNumber,
                        DayNumber = d.DayNumber,
                        Status = d.Status
                    })
                    .ToList();

                result.Add(new MemberWorkoutPlanDto
                {
                    MemberPlanId = plan.PlanId,
                    MemberId = memberId,
                    MemberName = member?.Name ?? "Unknown",
                    PlanId = plan.PlanId,
                    PlanName = plan.PlanName,
                    AssignedByCoachId = plan.GeneratedByCoachId,
                    CoachName = coachName,
                    StartDate = plan.StartDate ?? DateTime.Today,
                    EndDate = plan.EndDate,
                    Status = plan.Status == "Active" ? 1 : plan.Status == "Completed" ? 2 : plan.Status == "Draft" ? 3 : 0,
                    StatusText = plan.Status,
                    CompletedWorkouts = completedWorkouts,
                    TotalWorkouts = totalWorkouts,
                    Notes = plan.ApprovalNotes,
                    CreatedAt = plan.CreatedAt,
                    // AI-Generated plan fields
                    PlanType = plan.PlanType,
                    Goal = plan.Goal,
                    SplitType = plan.SplitType,
                    DaysPerWeek = plan.DaysPerWeek,
                    DurationWeeks = plan.DurationWeeks,
                    DifficultyLevel = plan.DifficultyLevel,
                    MlPlanJson = plan.MlPlanJson,
                    ScheduledDays = planScheduledDays
                });
            }

            return result;
        }

        public async Task<MemberWorkoutPlanDto?> GetMemberPlanDetailsAsync(int memberPlanId)
        {
            var plan = await _unitOfWork.Repository<WorkoutPlan>().GetByIdAsync(memberPlanId);
            if (plan == null) return null;

            var member = await _unitOfWork.Repository<User>().GetByIdAsync(plan.UserId);
            var logs = await _unitOfWork.Repository<WorkoutLog>().GetAllAsync();
            var completedWorkouts = logs.Count(l => l.PlanId == plan.PlanId && l.Completed);
            var totalWorkouts = (plan.DurationWeeks ?? 4) * 3;

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

            return new MemberWorkoutPlanDto
            {
                MemberPlanId = plan.PlanId,
                MemberId = plan.UserId,
                MemberName = member?.Name ?? "Unknown",
                PlanId = plan.PlanId,
                PlanName = plan.PlanName,
                AssignedByCoachId = plan.GeneratedByCoachId,
                CoachName = coachName,
                StartDate = plan.StartDate ?? DateTime.Today,
                EndDate = plan.EndDate,
                Status = plan.Status == "Active" ? 1 : plan.Status == "Completed" ? 2 : 0,
                StatusText = plan.Status,
                CompletedWorkouts = completedWorkouts,
                TotalWorkouts = totalWorkouts,
                Notes = null,
                CreatedAt = plan.CreatedAt
            };
        }

        public async Task<MemberWorkoutPlanDto> AssignPlanToMemberAsync(AssignWorkoutPlanDto assignDto)
        {
            var template = await _unitOfWork.Repository<WorkoutTemplate>().GetByIdAsync(assignDto.PlanId);
            if (template == null)
            {
                throw new KeyNotFoundException($"Workout template with ID {assignDto.PlanId} not found");
            }

            var member = await _unitOfWork.Repository<User>().GetByIdAsync(assignDto.MemberId);
            if (member == null)
            {
                throw new KeyNotFoundException($"User with ID {assignDto.MemberId} not found");
            }

            var plan = new WorkoutPlan
            {
                UserId = assignDto.MemberId,
                PlanName = template.TemplateName,
                Description = template.Description,
                PlanType = "Coach Assigned",
                DifficultyLevel = template.DifficultyLevel,
                DurationWeeks = template.DurationWeeks,
                Schedule = $"{template.WorkoutsPerWeek} workouts per week",
                GeneratedByCoachId = assignDto.AssignedByCoachId,
                Status = "Active",
                // Explicitly set IsActive = true when assigning a plan to a member
                // The model default is false for safety, but assigned plans should be active
                IsActive = true,
                StartDate = assignDto.StartDate,
                EndDate = assignDto.EndDate ?? assignDto.StartDate.AddDays(template.DurationWeeks * 7),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<WorkoutPlan>().AddAsync(plan);
            await _unitOfWork.SaveChangesAsync();

            string? coachName = null;
            if (assignDto.AssignedByCoachId.HasValue)
            {
                var coach = await _unitOfWork.Repository<CoachProfile>().GetByIdAsync(assignDto.AssignedByCoachId.Value);
                if (coach != null)
                {
                    var coachUser = await _unitOfWork.Repository<User>().GetByIdAsync(coach.UserId);
                    coachName = coachUser?.Name;
                }
            }

            return new MemberWorkoutPlanDto
            {
                MemberPlanId = plan.PlanId,
                MemberId = assignDto.MemberId,
                MemberName = member.Name,
                PlanId = plan.PlanId,
                PlanName = plan.PlanName,
                AssignedByCoachId = assignDto.AssignedByCoachId,
                CoachName = coachName,
                StartDate = plan.StartDate ?? DateTime.Today,
                EndDate = plan.EndDate,
                Status = 1,
                StatusText = "Active",
                CompletedWorkouts = 0,
                TotalWorkouts = template.DurationWeeks * template.WorkoutsPerWeek,
                Notes = assignDto.Notes,
                CreatedAt = plan.CreatedAt
            };
        }

        public async Task<MemberWorkoutPlanDto> UpdateProgressAsync(int memberPlanId, UpdateProgressDto progressDto)
        {
            var plan = await _unitOfWork.Repository<WorkoutPlan>().GetByIdAsync(memberPlanId);
            if (plan == null)
            {
                throw new KeyNotFoundException($"Workout plan with ID {memberPlanId} not found");
            }

            // Simply update completed workouts count - frontend tracks this
            plan.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.Repository<WorkoutPlan>().Update(plan);
            await _unitOfWork.SaveChangesAsync();

            return (await GetMemberPlanDetailsAsync(memberPlanId))!;
        }

        public async Task<MemberWorkoutPlanDto> CompletePlanAsync(int memberPlanId)
        {
            var plan = await _unitOfWork.Repository<WorkoutPlan>().GetByIdAsync(memberPlanId);
            if (plan == null)
            {
                throw new KeyNotFoundException($"Workout plan with ID {memberPlanId} not found");
            }

            plan.Status = "Completed";
            plan.EndDate = DateTime.Today;
            plan.IsActive = false;
            plan.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<WorkoutPlan>().Update(plan);
            await _unitOfWork.SaveChangesAsync();

            return (await GetMemberPlanDetailsAsync(memberPlanId))!;
        }

        /// <summary>
        /// Create a new AI-generated workout plan
        /// </summary>
        public async Task<MemberWorkoutPlanDto?> CreateAIWorkoutPlanAsync(CreateAIWorkoutPlanDto planDto)
        {
            var plan = new WorkoutPlan
            {
                UserId = planDto.UserId,
                PlanName = planDto.PlanName,
                Description = planDto.Description,
                PlanType = "AI_Generated",
                DifficultyLevel = planDto.DifficultyLevel,
                DurationWeeks = planDto.DurationWeeks,
                DaysPerWeek = planDto.DaysPerWeek,
                Goal = planDto.Goal,
                SplitType = planDto.SplitType,
                MlPlanJson = planDto.MlPlanJson,
                Status = "Draft",
                TokensSpent = planDto.TokensSpent,
                IsActive = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<WorkoutPlan>().AddAsync(plan);
            await _unitOfWork.SaveChangesAsync();

            return await GetMemberPlanDetailsAsync(plan.PlanId);
        }

        /// <summary>
        /// Activate a workout plan (deactivates other active plans for the user)
        /// </summary>
        public async Task<bool> ActivatePlanAsync(int planId, int userId)
        {
            var plan = await _unitOfWork.Repository<WorkoutPlan>().GetByIdAsync(planId);
            if (plan == null || plan.UserId != userId)
            {
                return false;
            }

            // Deactivate all other active plans for this user
            var allPlans = await _unitOfWork.Repository<WorkoutPlan>().GetAllAsync();
            var activePlans = allPlans.Where(p => p.UserId == userId && p.IsActive && p.PlanId != planId);
            foreach (var activePlan in activePlans)
            {
                activePlan.IsActive = false;
                activePlan.Status = "Inactive";
                activePlan.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.Repository<WorkoutPlan>().Update(activePlan);
            }

            // Activate the selected plan
            plan.Status = "Active";
            plan.IsActive = true;
            plan.StartDate = DateTime.UtcNow.Date;
            plan.EndDate = plan.DurationWeeks.HasValue 
                ? DateTime.UtcNow.Date.AddDays(plan.DurationWeeks.Value * 7) 
                : DateTime.UtcNow.Date.AddDays(28); // Default 4 weeks
            plan.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<WorkoutPlan>().Update(plan);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        private WorkoutPlanDto MapTemplateToDto(WorkoutTemplate template)
        {
            // Map difficulty level string to int
            int difficultyInt = template.DifficultyLevel?.ToLower() switch
            {
                "beginner" => 1,
                "intermediate" => 2,
                "advanced" => 3,
                _ => 2 // Default to intermediate
            };

            return new WorkoutPlanDto
            {
                PlanId = template.TemplateId,
                PlanName = template.TemplateName,
                Description = template.Description,
                CreatedByCoachId = template.CreatedByCoachId,
                CoachName = null, // Could resolve if needed
                DurationWeeks = template.DurationWeeks,
                DifficultyLevel = difficultyInt,
                Goals = null,
                IsTemplate = true,
                IsActive = template.IsActive,
                CreatedAt = template.CreatedAt
            };
        }

        /// <summary>
        /// Schedule a workout plan by creating scheduled days and optionally auto-booking equipment
        /// </summary>
        public async Task<ScheduledWorkoutPlanResponse?> ScheduleWorkoutPlanAsync(ScheduleWorkoutPlanDto scheduleDto)
        {
            var plan = await _unitOfWork.Repository<WorkoutPlan>().GetByIdAsync(scheduleDto.PlanId);
            if (plan == null || plan.UserId != scheduleDto.UserId)
            {
                return null;
            }

            // Parse the ML Plan JSON to get workout structure
            int totalDays = plan.DaysPerWeek ?? 3;
            int totalWeeks = plan.DurationWeeks ?? 4;

            // Clear existing scheduled days
            var existingScheduledDays = await _unitOfWork.Repository<WorkoutScheduledDay>().GetAllAsync();
            var planScheduledDays = existingScheduledDays.Where(sd => sd.WorkoutPlanId == plan.PlanId).ToList();
            foreach (var existingDay in planScheduledDays)
            {
                _unitOfWork.Repository<WorkoutScheduledDay>().Remove(existingDay);
            }

            // Calculate workout dates
            var scheduledDays = new List<WorkoutScheduledDay>();
            var currentDate = scheduleDto.StartDate;
            int dayCounter = 1;
            int weekCounter = 1;
            int daysScheduledThisWeek = 0;

            // If no specific workout days provided, use the first N days of the week
            var workoutDaysOfWeek = scheduleDto.WorkoutDays.Any() 
                ? scheduleDto.WorkoutDays.OrderBy(d => d).ToList()
                : GetDefaultWorkoutDays(totalDays);

            while (weekCounter <= totalWeeks)
            {
                foreach (var dayOfWeek in workoutDaysOfWeek)
                {
                    // Find the next occurrence of this day of week
                    var nextWorkoutDate = GetNextDayOfWeek(
                        weekCounter == 1 ? scheduleDto.StartDate : currentDate.AddDays(1), 
                        dayOfWeek
                    );

                    if (weekCounter > 1 && nextWorkoutDate < currentDate.AddDays(1))
                    {
                        nextWorkoutDate = nextWorkoutDate.AddDays(7);
                    }

                    if (dayCounter > totalDays * totalWeeks)
                    {
                        break;
                    }

                    var scheduledDay = new WorkoutScheduledDay
                    {
                        WorkoutPlanId = plan.PlanId,
                        DayNumber = ((dayCounter - 1) % totalDays) + 1,
                        WeekNumber = weekCounter,
                        ScheduledDate = nextWorkoutDate,
                        StartTime = scheduleDto.PreferredWorkoutTime,
                        EndTime = scheduleDto.PreferredWorkoutTime.Add(TimeSpan.FromHours(1.5)), // 1.5 hour workout
                        Status = "Scheduled",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _unitOfWork.Repository<WorkoutScheduledDay>().AddAsync(scheduledDay);
                    scheduledDays.Add(scheduledDay);

                    currentDate = nextWorkoutDate;
                    dayCounter++;
                    daysScheduledThisWeek++;

                    if (daysScheduledThisWeek >= totalDays)
                    {
                        break;
                    }
                }

                weekCounter++;
                daysScheduledThisWeek = 0;
            }

            // Update plan with start/end dates and preferred time
            plan.StartDate = scheduleDto.StartDate;
            plan.EndDate = scheduledDays.LastOrDefault()?.ScheduledDate ?? scheduleDto.StartDate.AddDays(7 * totalWeeks);
            plan.PreferredWorkoutTime = scheduleDto.PreferredWorkoutTime;
            plan.Status = "Active";
            plan.IsActive = true;
            plan.UpdatedAt = DateTime.UtcNow;

            // Deactivate other active plans
            var allPlans = await _unitOfWork.Repository<WorkoutPlan>().GetAllAsync();
            var otherActivePlans = allPlans.Where(p => p.UserId == scheduleDto.UserId && p.IsActive && p.PlanId != plan.PlanId);
            foreach (var otherPlan in otherActivePlans)
            {
                otherPlan.IsActive = false;
                otherPlan.Status = "Inactive";
                otherPlan.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.Repository<WorkoutPlan>().Update(otherPlan);
            }

            _unitOfWork.Repository<WorkoutPlan>().Update(plan);
            await _unitOfWork.SaveChangesAsync();

            // Return the response
            return new ScheduledWorkoutPlanResponse
            {
                PlanId = plan.PlanId,
                PlanName = plan.PlanName,
                StartDate = plan.StartDate ?? scheduleDto.StartDate,
                EndDate = plan.EndDate ?? scheduleDto.StartDate.AddDays(7 * totalWeeks),
                TotalScheduledDays = scheduledDays.Count,
                EquipmentBookingsCreated = 0, // TODO: Implement equipment auto-booking
                ScheduledDays = scheduledDays.Select(sd => new ScheduledDayDto
                {
                    ScheduledDayId = sd.ScheduledDayId,
                    ScheduledDate = sd.ScheduledDate,
                    StartTime = sd.StartTime,
                    WeekNumber = sd.WeekNumber,
                    DayNumber = sd.DayNumber,
                    Status = sd.Status,
                    EquipmentBookings = new List<ScheduledEquipmentBookingDto>()
                }).ToList()
            };
        }

        public async Task<bool> UpdateExerciseNotesAsync(UpdateExerciseNotesDto updateDto)
        {
            var plan = await _unitOfWork.Repository<WorkoutPlan>().GetByIdAsync(updateDto.PlanId);
            if (plan == null) return false;

            // Optional: Verify coach permission if needed
            // if (plan.GeneratedByCoachId != updateDto.CoachId) return false;

            if (string.IsNullOrEmpty(plan.MlPlanJson)) return false;

            try
            {
                // Parse the JSON
                var jsonNode = System.Text.Json.Nodes.JsonNode.Parse(plan.MlPlanJson);
                if (jsonNode == null) return false;

                // Navigate the JSON structure to find the exercise
                // Structure: plan -> weeks -> days -> exercises
                
                // We need to handle both "plan" root object and direct root object depending on how it was saved
                var root = jsonNode["plan"] ?? jsonNode;
                var weeks = root?["weeks"]?.AsArray();

                if (weeks != null)
                {
                    bool found = false;
                    foreach (var week in weeks)
                    {
                        var days = week?["days"]?.AsArray();
                        if (days == null) continue;

                        foreach (var day in days)
                        {
                            var exercises = day?["exercises"]?.AsArray();
                            if (exercises == null) continue;

                            foreach (var exercise in exercises)
                            {
                                if (exercise?["id"]?.ToString() == updateDto.ExerciseId)
                                {
                                    // Found the exercise, update notes
                                    var notesArray = new System.Text.Json.Nodes.JsonArray();
                                    foreach (var note in updateDto.Notes)
                                    {
                                        notesArray.Add(note);
                                    }
                                    exercise["notes"] = notesArray;
                                    found = true;
                                    break;
                                }
                            }
                            if (found) break;
                        }
                        if (found) break;
                    }

                    if (found)
                    {
                        // Save the updated JSON back to the plan
                        plan.MlPlanJson = jsonNode.ToJsonString();
                        plan.UpdatedAt = DateTime.UtcNow;
                        _unitOfWork.Repository<WorkoutPlan>().Update(plan);
                        await _unitOfWork.SaveChangesAsync();
                        return true;
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating exercise notes: {ex.Message}");
                return false;
            }

            return false;
        }

        private List<DayOfWeek> GetDefaultWorkoutDays(int daysPerWeek)
        {
            return daysPerWeek switch
            {
                1 => new List<DayOfWeek> { DayOfWeek.Monday },
                2 => new List<DayOfWeek> { DayOfWeek.Monday, DayOfWeek.Thursday },
                3 => new List<DayOfWeek> { DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday },
                4 => new List<DayOfWeek> { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Thursday, DayOfWeek.Friday },
                5 => new List<DayOfWeek> { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday },
                6 => new List<DayOfWeek> { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday, DayOfWeek.Saturday },
                7 => new List<DayOfWeek> { DayOfWeek.Sunday, DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday, DayOfWeek.Saturday },
                _ => new List<DayOfWeek> { DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday }
            };
        }

        private DateTime GetNextDayOfWeek(DateTime from, DayOfWeek dayOfWeek)
        {
            int daysToAdd = ((int)dayOfWeek - (int)from.DayOfWeek + 7) % 7;
            return from.AddDays(daysToAdd);
        }
    }
}
