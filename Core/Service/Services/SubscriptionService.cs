using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using ServiceAbstraction.Services;
using Shared.DTOs.Subscription;

namespace Service.Services
{
    public class SubscriptionService : ISubscriptionService
    {
        private readonly IUnitOfWork _unitOfWork;

        public SubscriptionService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<SubscriptionPlanDto>> GetAllPlansAsync()
        {
            var plans = await _unitOfWork.Repository<SubscriptionPlan>().GetAllAsync();
            return plans.Select(MapToPlanDto);
        }

        public async Task<SubscriptionPlanDto?> GetPlanByIdAsync(int planId)
        {
            var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(planId);
            return plan == null ? null : MapToPlanDto(plan);
        }

        public async Task<IEnumerable<SubscriptionPlanDto>> GetActivePlansAsync()
        {
            var plans = await _unitOfWork.Repository<SubscriptionPlan>()
                .FindAsync(p => p.IsActive);
            return plans.Select(MapToPlanDto);
        }

        public async Task CreateUserSubscriptionAsync(CreateSubscriptionDto createDto)
        {
            // Verify plan exists
            var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(createDto.PlanId);
            if (plan == null)
            {
                throw new KeyNotFoundException($"Subscription plan with ID {createDto.PlanId} not found");
            }

            // Verify payment exists
            var payment = await _unitOfWork.Repository<Payment>().GetByIdAsync(createDto.PaymentId);
            if (payment == null)
            {
                throw new KeyNotFoundException($"Payment with ID {createDto.PaymentId} not found");
            }

            var subscription = new UserSubscription
            {
                UserId = createDto.UserId,
                PlanId = createDto.PlanId,
                PaymentId = createDto.PaymentId,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(plan.DurationDays),
                Status = IntelliFit.Domain.Enums.SubscriptionStatus.Active,
                AutoRenew = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<UserSubscription>().AddAsync(subscription);
            await _unitOfWork.SaveChangesAsync();

            // Add tokens to user balance
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(createDto.UserId);
            if (user != null)
            {
                user.TokenBalance += plan.TokensIncluded;
                _unitOfWork.Repository<User>().Update(user);
                await _unitOfWork.SaveChangesAsync();
            }
        }

        public async Task<bool> HasActiveSubscriptionAsync(int userId)
        {
            return await _unitOfWork.Repository<UserSubscription>()
                .AnyAsync(s => s.UserId == userId &&
                              s.Status == IntelliFit.Domain.Enums.SubscriptionStatus.Active &&
                              s.StartDate <= DateTime.UtcNow &&
                              s.EndDate > DateTime.UtcNow);
        }

        public async Task<UserSubscriptionDetailsDto?> GetUserSubscriptionDetailsAsync(int userId)
        {
            var subscriptions = await _unitOfWork.Repository<UserSubscription>().GetAllAsync();
            var activeSub = subscriptions
                .Where(s => s.UserId == userId &&
                           s.Status == IntelliFit.Domain.Enums.SubscriptionStatus.Active &&
                           s.StartDate <= DateTime.UtcNow &&
                           s.EndDate > DateTime.UtcNow)
                .OrderByDescending(s => s.EndDate)
                .FirstOrDefault();

            if (activeSub == null) return null;

            var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(activeSub.PlanId);
            if (plan == null) return null;

            return new UserSubscriptionDetailsDto
            {
                SubscriptionId = activeSub.SubscriptionId,
                UserId = activeSub.UserId,
                PlanId = plan.PlanId,
                PlanName = plan.PlanName,
                Description = plan.Description,
                Features = plan.Features,
                Price = plan.Price,
                TokensIncluded = plan.TokensIncluded,
                MaxBookingsPerDay = plan.MaxBookingsPerDay,
                StartDate = activeSub.StartDate,
                EndDate = activeSub.EndDate,
                DaysRemaining = Math.Max(0, (activeSub.EndDate - DateTime.UtcNow).Days),
                Status = activeSub.Status.ToString(),
                AutoRenew = activeSub.AutoRenew,
                IsFrozen = activeSub.FreezeStartDate.HasValue && activeSub.FreezeEndDate.HasValue && activeSub.FreezeEndDate.Value > DateTime.UtcNow,
                FreezeStartDate = activeSub.FreezeStartDate,
                FreezeEndDate = activeSub.FreezeEndDate,
                MaxFreezeDays = plan.MaxFreezeDays,
                FreeWorkoutPlans = plan.FreeWorkoutPlans,
                FreeNutritionPlans = plan.FreeNutritionPlans,
                ExtraWorkoutPlanTokenCost = plan.ExtraWorkoutPlanTokenCost,
                ExtraNutritionPlanTokenCost = plan.ExtraNutritionPlanTokenCost,
                FreeAiCoachMessagesPerDay = plan.FreeAiCoachMessagesPerDay
            };
        }

        private SubscriptionPlanDto MapToPlanDto(SubscriptionPlan plan)
        {
            return new SubscriptionPlanDto
            {
                PlanId = plan.PlanId,
                PlanName = plan.PlanName,
                Price = plan.Price,
                DurationDays = plan.DurationDays,
                Description = plan.Description,
                TokensIncluded = plan.TokensIncluded,
                InvitationsAllowed = plan.InvitationsAllowed,
                Features = plan.Features,
                MaxBookingsPerDay = plan.MaxBookingsPerDay,
                MaxFreezeDays = plan.MaxFreezeDays,
                FreeWorkoutPlans = plan.FreeWorkoutPlans,
                FreeNutritionPlans = plan.FreeNutritionPlans,
                ExtraWorkoutPlanTokenCost = plan.ExtraWorkoutPlanTokenCost,
                ExtraNutritionPlanTokenCost = plan.ExtraNutritionPlanTokenCost,
                FreeAiCoachMessagesPerDay = plan.FreeAiCoachMessagesPerDay,
                IsPopular = plan.IsPopular,
                IsActive = plan.IsActive
            };
        }

        public async Task ChangePlanAsync(ChangePlanDto dto)
        {
            // Validate new plan
            var newPlan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(dto.NewPlanId);
            if (newPlan == null)
                throw new KeyNotFoundException($"Subscription plan with ID {dto.NewPlanId} not found");

            // Validate payment
            var payment = await _unitOfWork.Repository<Payment>().GetByIdAsync(dto.PaymentId);
            if (payment == null)
                throw new KeyNotFoundException($"Payment with ID {dto.PaymentId} not found");

            var allSubscriptions = await _unitOfWork.Repository<UserSubscription>().GetAllAsync();
            var userSubs = allSubscriptions.Where(s => s.UserId == dto.UserId).ToList();

            // Find the currently running subscription (started and not yet expired)
            var currentActive = userSubs.FirstOrDefault(s =>
                s.Status == IntelliFit.Domain.Enums.SubscriptionStatus.Active &&
                s.StartDate <= DateTime.UtcNow &&
                s.EndDate > DateTime.UtcNow);

            // Cancel any already-scheduled future subscriptions (replace previous queued plan change)
            var futureSubs = userSubs.Where(s =>
                s.Status == IntelliFit.Domain.Enums.SubscriptionStatus.Active &&
                s.StartDate > DateTime.UtcNow).ToList();

            foreach (var sub in futureSubs)
            {
                sub.Status = IntelliFit.Domain.Enums.SubscriptionStatus.Cancelled;
                sub.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.Repository<UserSubscription>().Update(sub);
            }

            // New plan starts when current plan ends; if no active plan, starts now
            DateTime newStartDate = currentActive?.EndDate ?? DateTime.UtcNow;
            DateTime newEndDate = newStartDate.AddDays(newPlan.DurationDays);

            var newSubscription = new UserSubscription
            {
                UserId = dto.UserId,
                PlanId = dto.NewPlanId,
                PaymentId = dto.PaymentId,
                StartDate = newStartDate,
                EndDate = newEndDate,
                Status = IntelliFit.Domain.Enums.SubscriptionStatus.Active,
                AutoRenew = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<UserSubscription>().AddAsync(newSubscription);

            // Add tokens immediately (user paid now)
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(dto.UserId);
            if (user != null)
            {
                user.TokenBalance += newPlan.TokensIncluded;
                _unitOfWork.Repository<User>().Update(user);
            }

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task FreezeSubscriptionAsync(int subscriptionId, int freezeDays, DateTime startDate)
        {
            var subscription = await _unitOfWork.Repository<UserSubscription>().GetByIdAsync(subscriptionId);
            if (subscription == null)
                throw new KeyNotFoundException($"Subscription with ID {subscriptionId} not found");

            if (subscription.FreezeStartDate.HasValue && subscription.FreezeEndDate.HasValue && subscription.FreezeEndDate.Value > DateTime.UtcNow)
                throw new InvalidOperationException("Subscription is already frozen");

            var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(subscription.PlanId);
            if (plan != null && freezeDays > plan.MaxFreezeDays)
                throw new InvalidOperationException($"Cannot freeze for more than {plan.MaxFreezeDays} days on this plan");

            // Treat the incoming date as UTC (frontend sends a date-only string)
            var startUtc = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
            if (startUtc < DateTime.UtcNow.Date)
                throw new InvalidOperationException("Freeze start date cannot be in the past");
            subscription.FreezeStartDate = startUtc;
            subscription.FreezeEndDate = startUtc.AddDays(freezeDays);
            subscription.EndDate = subscription.EndDate.AddDays(freezeDays);
            subscription.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<UserSubscription>().Update(subscription);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UnfreezeSubscriptionAsync(int subscriptionId)
        {
            var subscription = await _unitOfWork.Repository<UserSubscription>().GetByIdAsync(subscriptionId);
            if (subscription == null)
                throw new KeyNotFoundException($"Subscription with ID {subscriptionId} not found");

            // Roll back unused freeze days from EndDate so the member only gets credit
            // for the days the subscription was actually frozen
            if (subscription.FreezeEndDate.HasValue && subscription.FreezeEndDate.Value > DateTime.UtcNow)
            {
                var unusedFreezeDays = (subscription.FreezeEndDate.Value - DateTime.UtcNow).TotalDays;
                subscription.EndDate = subscription.EndDate.AddDays(-unusedFreezeDays);
            }

            subscription.FreezeStartDate = null;
            subscription.FreezeEndDate = null;
            subscription.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<UserSubscription>().Update(subscription);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<IEnumerable<UserSubscriptionDetailsDto>> GetFrozenSubscriptionsAsync()
        {
            var subscriptions = await _unitOfWork.Repository<UserSubscription>().GetAllAsync();
            var frozen = subscriptions.Where(s =>
                s.Status == IntelliFit.Domain.Enums.SubscriptionStatus.Active &&
                s.FreezeStartDate.HasValue &&
                s.FreezeEndDate.HasValue &&
                s.FreezeEndDate.Value > DateTime.UtcNow).ToList();

            var result = new List<UserSubscriptionDetailsDto>();
            foreach (var sub in frozen)
            {
                var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(sub.PlanId);
                if (plan == null) continue;
                result.Add(new UserSubscriptionDetailsDto
                {
                    SubscriptionId = sub.SubscriptionId,
                    UserId = sub.UserId,
                    PlanId = plan.PlanId,
                    PlanName = plan.PlanName,
                    Description = plan.Description,
                    Features = plan.Features,
                    Price = plan.Price,
                    TokensIncluded = plan.TokensIncluded,
                    MaxBookingsPerDay = plan.MaxBookingsPerDay,
                    MaxFreezeDays = plan.MaxFreezeDays,
                    StartDate = sub.StartDate,
                    EndDate = sub.EndDate,
                    DaysRemaining = Math.Max(0, (sub.EndDate - DateTime.UtcNow).Days),
                    Status = sub.Status.ToString(),
                    AutoRenew = sub.AutoRenew,
                    IsFrozen = true,
                    FreezeStartDate = sub.FreezeStartDate,
                    FreezeEndDate = sub.FreezeEndDate,
                    FreeWorkoutPlans = plan.FreeWorkoutPlans,
                    FreeNutritionPlans = plan.FreeNutritionPlans,
                    ExtraWorkoutPlanTokenCost = plan.ExtraWorkoutPlanTokenCost,
                    ExtraNutritionPlanTokenCost = plan.ExtraNutritionPlanTokenCost,
                    FreeAiCoachMessagesPerDay = plan.FreeAiCoachMessagesPerDay
                });
            }
            return result;
        }
        public async Task<SubscriptionPlanDto> CreatePlanAsync(CreateSubscriptionPlanDto dto)
        {
            var plan = new SubscriptionPlan
            {
                PlanName = dto.PlanName,
                Description = dto.Description,
                Price = dto.Price,
                DurationDays = dto.DurationDays,
                TokensIncluded = dto.TokensIncluded,
                InvitationsAllowed = dto.InvitationsAllowed,
                Features = dto.Features,
                MaxBookingsPerDay = dto.MaxBookingsPerDay,
                MaxFreezeDays = dto.MaxFreezeDays,
                FreeWorkoutPlans = dto.FreeWorkoutPlans,
                FreeNutritionPlans = dto.FreeNutritionPlans,
                ExtraWorkoutPlanTokenCost = dto.ExtraWorkoutPlanTokenCost,
                ExtraNutritionPlanTokenCost = dto.ExtraNutritionPlanTokenCost,
                FreeAiCoachMessagesPerDay = dto.FreeAiCoachMessagesPerDay,
                IsPopular = dto.IsPopular,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<SubscriptionPlan>().AddAsync(plan);
            await _unitOfWork.SaveChangesAsync();

            return MapToPlanDto(plan);
        }

        public async Task<SubscriptionPlanDto> UpdatePlanAsync(int planId, UpdateSubscriptionPlanDto dto)
        {
            var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(planId);
            if (plan == null)
            {
                throw new KeyNotFoundException($"Subscription plan with ID {planId} not found");
            }

            plan.PlanName = dto.PlanName;
            plan.Description = dto.Description;
            plan.Price = dto.Price;
            plan.DurationDays = dto.DurationDays;
            plan.TokensIncluded = dto.TokensIncluded;
            plan.InvitationsAllowed = dto.InvitationsAllowed;
            plan.Features = dto.Features;
            plan.MaxBookingsPerDay = dto.MaxBookingsPerDay;
            plan.MaxFreezeDays = dto.MaxFreezeDays;
            plan.FreeWorkoutPlans = dto.FreeWorkoutPlans;
            plan.FreeNutritionPlans = dto.FreeNutritionPlans;
            plan.ExtraWorkoutPlanTokenCost = dto.ExtraWorkoutPlanTokenCost;
            plan.ExtraNutritionPlanTokenCost = dto.ExtraNutritionPlanTokenCost;
            plan.FreeAiCoachMessagesPerDay = dto.FreeAiCoachMessagesPerDay;
            plan.IsPopular = dto.IsPopular;
            plan.IsActive = dto.IsActive;
            plan.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<SubscriptionPlan>().Update(plan);
            await _unitOfWork.SaveChangesAsync();

            return MapToPlanDto(plan);
        }

        public async Task<bool> DeletePlanAsync(int planId)
        {
            var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(planId);
            if (plan == null) return false;

            // Check if any subscriptions are associated with this plan
            var hasSubscriptions = await _unitOfWork.Repository<UserSubscription>()
                .AnyAsync(s => s.PlanId == planId);

            if (hasSubscriptions)
            {
                // Soft-delete: Mark as inactive so existing records remain intact
                plan.IsActive = false;
                plan.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.Repository<SubscriptionPlan>().Update(plan);
            }
            else
            {
                // Hard-delete: Remove from database if never used
                _unitOfWork.Repository<SubscriptionPlan>().Remove(plan);
            }

            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<(bool canGenerate, string message, int cost)> CheckQuotaAndTokenBalanceAsync(int userId, string programType)
        {
            var subscriptions = await _unitOfWork.Repository<UserSubscription>().GetAllAsync();
            var activeSub = subscriptions
                .Where(s => s.UserId == userId &&
                           s.Status == IntelliFit.Domain.Enums.SubscriptionStatus.Active &&
                           s.StartDate <= DateTime.UtcNow &&
                           s.EndDate > DateTime.UtcNow)
                .OrderByDescending(s => s.EndDate)
                .FirstOrDefault();

            if (activeSub == null)
            {
                return (false, "You must have an active subscription to generate AI plans.", 0);
            }

            var plan = await _unitOfWork.Repository<SubscriptionPlan>().GetByIdAsync(activeSub.PlanId);
            if (plan == null)
            {
                return (false, "Subscription plan details not found.", 0);
            }

            var generations = await _unitOfWork.Repository<AiProgramGeneration>().GetAllAsync();
            var count = generations
                .Count(g => g.UserId == userId &&
                            g.ProgramType.Equals(programType, StringComparison.OrdinalIgnoreCase) &&
                            g.CreatedAt >= activeSub.StartDate &&
                            g.CreatedAt <= activeSub.EndDate);

            int freeQuota = programType.Equals("Workout", StringComparison.OrdinalIgnoreCase) 
                ? plan.FreeWorkoutPlans 
                : plan.FreeNutritionPlans;

            int extraCost = programType.Equals("Workout", StringComparison.OrdinalIgnoreCase)
                ? plan.ExtraWorkoutPlanTokenCost
                : plan.ExtraNutritionPlanTokenCost;

            if (count < freeQuota)
            {
                return (true, $"Generation is free (used {count} of {freeQuota} free generations).", 0);
            }

            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
            if (user == null)
            {
                return (false, "User not found.", 0);
            }

            if (user.TokenBalance < extraCost)
            {
                return (false, $"Insufficient token balance. This generation costs {extraCost} tokens, but you only have {user.TokenBalance} tokens.", extraCost);
            }

            return (true, $"Generation will cost {extraCost} tokens (free quota of {freeQuota} exceeded).", extraCost);
        }

        public async Task<(bool success, string message)> DeductTokensForGenerationAsync(int userId, string programType, int cost)
        {
            if (cost <= 0) return (true, "No tokens charged.");

            using var transaction = await _unitOfWork.BeginTransactionAsync();
            try
            {
                var dbUser = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
                if (dbUser == null) throw new InvalidOperationException("User not found");

                if (dbUser.TokenBalance < cost)
                {
                    throw new InvalidOperationException("Insufficient token balance");
                }

                var balanceBefore = dbUser.TokenBalance;
                var balanceAfter = balanceBefore - cost;

                dbUser.TokenBalance = balanceAfter;
                dbUser.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.Repository<User>().Update(dbUser);

                var tokenTx = new TokenTransaction
                {
                    UserId = userId,
                    Amount = -cost,
                    TransactionType = IntelliFit.Domain.Enums.TransactionType.Deduction,
                    Description = $"AI {programType} plan generation beyond free quota",
                    ReferenceType = "AIGeneration",
                    BalanceBefore = balanceBefore,
                    BalanceAfter = balanceAfter,
                    CreatedAt = DateTime.UtcNow
                };

                await _unitOfWork.Repository<TokenTransaction>().AddAsync(tokenTx);
                await _unitOfWork.SaveChangesAsync();
                await _unitOfWork.CommitTransactionAsync();

                return (true, $"Successfully deducted {cost} tokens.");
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return (false, $"Failed to process token deduction: {ex.Message}");
            }
        }
    }
}
