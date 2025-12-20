using Microsoft.EntityFrameworkCore;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;

namespace IntelliFit.Infrastructure.Persistence
{
    public class IntelliFitDbContext : DbContext
    {
        public IntelliFitDbContext(DbContextOptions<IntelliFitDbContext> options) : base(options)
        {
        }

        // Core Users (single table with Role column)
        public DbSet<User> Users { get; set; }

        // User Profiles (role-specific data)
        public DbSet<MemberProfile> MemberProfiles { get; set; }
        public DbSet<CoachProfile> CoachProfiles { get; set; }

        // Billing
        public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }
        public DbSet<UserSubscription> UserSubscriptions { get; set; }
        public DbSet<TokenPackage> TokenPackages { get; set; }
        public DbSet<TokenTransaction> TokenTransactions { get; set; }
        public DbSet<Payment> Payments { get; set; }

        // Equipment
        public DbSet<EquipmentCategory> EquipmentCategories { get; set; }
        public DbSet<Equipment> Equipment { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<EquipmentTimeSlot> EquipmentTimeSlots { get; set; }
        public DbSet<CoachSessionEquipment> CoachSessionEquipments { get; set; }

        // Health
        public DbSet<InBodyMeasurement> InBodyMeasurements { get; set; }

        // Workouts
        public DbSet<Exercise> Exercises { get; set; }
        public DbSet<WorkoutPlan> WorkoutPlans { get; set; }
        public DbSet<WorkoutPlanExercise> WorkoutPlanExercises { get; set; }
        public DbSet<WorkoutLog> WorkoutLogs { get; set; }
        public DbSet<WorkoutTemplate> WorkoutTemplates { get; set; }
        public DbSet<WorkoutTemplateExercise> WorkoutTemplateExercises { get; set; }

        // Nutrition
        public DbSet<NutritionPlan> NutritionPlans { get; set; }
        public DbSet<Meal> Meals { get; set; }
        public DbSet<MealIngredient> MealIngredients { get; set; }
        public DbSet<Ingredient> Ingredients { get; set; }

        // AI
        public DbSet<AiChatLog> AiChatLogs { get; set; }
        public DbSet<AiProgramGeneration> AiProgramGenerations { get; set; }
        public DbSet<AiWorkflowJob> AiWorkflowJobs { get; set; }

        // Engagement
        public DbSet<ActivityFeed> ActivityFeeds { get; set; }
        public DbSet<ProgressMilestone> ProgressMilestones { get; set; }
        public DbSet<UserMilestone> UserMilestones { get; set; }

        // System
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<CoachReview> CoachReviews { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // PostgreSQL enum mappings
            modelBuilder.HasPostgresEnum<GenderType>();
            modelBuilder.HasPostgresEnum<SubscriptionStatus>();
            modelBuilder.HasPostgresEnum<BookingStatus>();
            modelBuilder.HasPostgresEnum<EquipmentStatus>();
            modelBuilder.HasPostgresEnum<TransactionType>();
            modelBuilder.HasPostgresEnum<PaymentStatus>();
            modelBuilder.HasPostgresEnum<NotificationType>();

            // Table mappings
            modelBuilder.Entity<User>().ToTable("users");
            modelBuilder.Entity<MemberProfile>().ToTable("member_profiles");
            modelBuilder.Entity<CoachProfile>().ToTable("coach_profiles");
            modelBuilder.Entity<SubscriptionPlan>().ToTable("subscription_plans");
            modelBuilder.Entity<UserSubscription>().ToTable("user_subscriptions");
            modelBuilder.Entity<TokenPackage>().ToTable("token_packages");
            modelBuilder.Entity<TokenTransaction>().ToTable("token_transactions");
            modelBuilder.Entity<Payment>().ToTable("payments");
            modelBuilder.Entity<EquipmentCategory>().ToTable("equipment_categories");
            modelBuilder.Entity<Equipment>().ToTable("equipment");
            modelBuilder.Entity<Booking>().ToTable("bookings");
            modelBuilder.Entity<EquipmentTimeSlot>().ToTable("equipment_time_slots");
            modelBuilder.Entity<CoachSessionEquipment>().ToTable("coach_session_equipments");
            modelBuilder.Entity<InBodyMeasurement>().ToTable("inbody_measurements");
            modelBuilder.Entity<Exercise>().ToTable("exercises");
            modelBuilder.Entity<WorkoutPlan>().ToTable("workout_plans");
            modelBuilder.Entity<WorkoutPlanExercise>().ToTable("workout_plan_exercises");
            modelBuilder.Entity<WorkoutLog>().ToTable("workout_logs");
            modelBuilder.Entity<WorkoutTemplate>().ToTable("workout_templates");
            modelBuilder.Entity<WorkoutTemplateExercise>().ToTable("workout_template_exercises");
            modelBuilder.Entity<NutritionPlan>().ToTable("nutrition_plans");
            modelBuilder.Entity<Meal>().ToTable("meals");
            modelBuilder.Entity<MealIngredient>().ToTable("meal_ingredients");
            modelBuilder.Entity<Ingredient>().ToTable("ingredients");
            modelBuilder.Entity<AiChatLog>().ToTable("ai_chat_logs");
            modelBuilder.Entity<AiProgramGeneration>().ToTable("ai_program_generations");
            modelBuilder.Entity<AiWorkflowJob>().ToTable("ai_workflow_jobs");
            modelBuilder.Entity<ActivityFeed>().ToTable("activity_feeds");
            modelBuilder.Entity<ProgressMilestone>().ToTable("progress_milestones");
            modelBuilder.Entity<UserMilestone>().ToTable("user_milestones");
            modelBuilder.Entity<Notification>().ToTable("notifications");
            modelBuilder.Entity<ChatMessage>().ToTable("chat_messages");
            modelBuilder.Entity<CoachReview>().ToTable("coach_reviews");
            modelBuilder.Entity<AuditLog>().ToTable("audit_logs");

            // User Configuration (single table with Role column)
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.UserId);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.HasIndex(e => e.Email).IsUnique();

                // Role stored as string
                entity.Property(e => e.Role)
                    .HasConversion<string>()
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue(UserRole.Member);

                // One-to-one relationships with profiles
                entity.HasOne(e => e.MemberProfile)
                    .WithOne(p => p.User)
                    .HasForeignKey<MemberProfile>(p => p.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.CoachProfile)
                    .WithOne(p => p.User)
                    .HasForeignKey<CoachProfile>(p => p.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // MemberProfile Configuration
            modelBuilder.Entity<MemberProfile>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserId).IsUnique();
                entity.Property(e => e.CurrentWeight).HasPrecision(5, 2);
                entity.Property(e => e.TargetWeight).HasPrecision(5, 2);
                entity.Property(e => e.Height).HasPrecision(5, 2);

                // FK to SubscriptionPlan
                entity.HasOne(e => e.SubscriptionPlan)
                    .WithMany()
                    .HasForeignKey(e => e.SubscriptionPlanId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // CoachProfile Configuration
            modelBuilder.Entity<CoachProfile>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.UserId).IsUnique();
                entity.Property(e => e.Rating).HasPrecision(3, 2);
                entity.Property(e => e.HourlyRate).HasPrecision(10, 2);
            });

            // SubscriptionPlan Configuration
            modelBuilder.Entity<SubscriptionPlan>(entity =>
            {
                entity.HasKey(e => e.PlanId);
                entity.Property(e => e.Price).HasPrecision(10, 2);
            });

            // UserSubscription Configuration
            modelBuilder.Entity<UserSubscription>(entity =>
            {
                entity.HasKey(e => e.SubscriptionId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.UserSubscriptions)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Plan)
                    .WithMany(p => p.UserSubscriptions)
                    .HasForeignKey(e => e.PlanId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Payment)
                    .WithMany()
                    .HasForeignKey(e => e.PaymentId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // TokenPackage Configuration
            modelBuilder.Entity<TokenPackage>(entity =>
            {
                entity.HasKey(e => e.PackageId);
                entity.Property(e => e.Price).HasPrecision(10, 2);
            });

            // TokenTransaction Configuration
            modelBuilder.Entity<TokenTransaction>(entity =>
            {
                entity.HasKey(e => e.TransactionId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.TokenTransactions)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Payment Configuration
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(e => e.PaymentId);
                entity.Property(e => e.Amount).HasPrecision(10, 2);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Payments)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Package)
                    .WithMany(p => p.Payments)
                    .HasForeignKey(e => e.PackageId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // EquipmentCategory Configuration
            modelBuilder.Entity<EquipmentCategory>(entity =>
            {
                entity.HasKey(e => e.CategoryId);
            });

            // Equipment Configuration
            modelBuilder.Entity<Equipment>(entity =>
            {
                entity.HasKey(e => e.EquipmentId);

                entity.HasOne(e => e.Category)
                    .WithMany(c => c.Equipment)
                    .HasForeignKey(e => e.CategoryId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Booking Configuration
            modelBuilder.Entity<Booking>(entity =>
            {
                entity.HasKey(e => e.BookingId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Bookings)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Equipment)
                    .WithMany(eq => eq.Bookings)
                    .HasForeignKey(e => e.EquipmentId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Coach relationship now uses CoachProfile
                entity.HasOne(e => e.Coach)
                    .WithMany(c => c.Bookings)
                    .HasForeignKey(e => e.CoachId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Parent-child booking relationship (for coach session -> auto-booked equipment)
                entity.HasOne(e => e.ParentCoachBooking)
                    .WithMany(b => b.ChildEquipmentBookings)
                    .HasForeignKey(e => e.ParentCoachBookingId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // InBodyMeasurement Configuration
            modelBuilder.Entity<InBodyMeasurement>(entity =>
            {
                entity.HasKey(e => e.MeasurementId);
                entity.Property(e => e.Weight).HasPrecision(5, 2);
                entity.Property(e => e.Height).HasPrecision(5, 2);
                entity.Property(e => e.BodyFatPercentage).HasPrecision(5, 2);
                entity.Property(e => e.MuscleMass).HasPrecision(5, 2);
                entity.Property(e => e.BodyWaterPercentage).HasPrecision(5, 2);
                entity.Property(e => e.BoneMass).HasPrecision(5, 2);
                entity.Property(e => e.ProteinPercentage).HasPrecision(5, 2);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.InBodyMeasurements)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.MeasuredByUser)
                    .WithMany()
                    .HasForeignKey(e => e.MeasuredBy)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Exercise Configuration
            modelBuilder.Entity<Exercise>(entity =>
            {
                entity.HasKey(e => e.ExerciseId);
                entity.HasIndex(e => e.Name);

                entity.HasOne(e => e.CreatedByCoach)
                    .WithMany(c => c.ExercisesCreated)
                    .HasForeignKey(e => e.CreatedByCoachId)
                    .OnDelete(DeleteBehavior.SetNull);

                // Exercise to Equipment relationship
                entity.HasOne(e => e.Equipment)
                    .WithMany()
                    .HasForeignKey(e => e.EquipmentId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // WorkoutPlan Configuration
            modelBuilder.Entity<WorkoutPlan>(entity =>
            {
                entity.HasKey(e => e.PlanId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.WorkoutPlans)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Coach)
                    .WithMany(c => c.WorkoutPlansCreated)
                    .HasForeignKey(e => e.GeneratedByCoachId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.ApprovedByCoach)
                    .WithMany(c => c.WorkoutPlansApproved)
                    .HasForeignKey(e => e.ApprovedBy)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // WorkoutPlanExercise Configuration
            modelBuilder.Entity<WorkoutPlanExercise>(entity =>
            {
                entity.HasKey(e => e.WorkoutPlanExerciseId);

                entity.HasOne(e => e.WorkoutPlan)
                    .WithMany(wp => wp.WorkoutPlanExercises)
                    .HasForeignKey(e => e.WorkoutPlanId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Exercise)
                    .WithMany(ex => ex.WorkoutPlanExercises)
                    .HasForeignKey(e => e.ExerciseId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // WorkoutLog Configuration
            modelBuilder.Entity<WorkoutLog>(entity =>
            {
                entity.HasKey(e => e.LogId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.WorkoutLogs)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Plan)
                    .WithMany(wp => wp.WorkoutLogs)
                    .HasForeignKey(e => e.PlanId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // WorkoutTemplate Configuration
            modelBuilder.Entity<WorkoutTemplate>(entity =>
            {
                entity.HasKey(e => e.TemplateId);

                entity.HasOne(e => e.CreatedByCoach)
                    .WithMany(c => c.WorkoutTemplatesCreated)
                    .HasForeignKey(e => e.CreatedByCoachId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // WorkoutTemplateExercise Configuration
            modelBuilder.Entity<WorkoutTemplateExercise>(entity =>
            {
                entity.HasKey(e => e.TemplateExerciseId);

                entity.HasOne(e => e.Template)
                    .WithMany(t => t.TemplateExercises)
                    .HasForeignKey(e => e.TemplateId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Exercise)
                    .WithMany(ex => ex.WorkoutTemplateExercises)
                    .HasForeignKey(e => e.ExerciseId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // NutritionPlan Configuration
            modelBuilder.Entity<NutritionPlan>(entity =>
            {
                entity.HasKey(e => e.PlanId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.NutritionPlans)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.GeneratedByCoach)
                    .WithMany(c => c.NutritionPlansCreated)
                    .HasForeignKey(e => e.GeneratedByCoachId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.ApprovedByCoach)
                    .WithMany(c => c.NutritionPlansApproved)
                    .HasForeignKey(e => e.ApprovedByCoachId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Meal Configuration
            modelBuilder.Entity<Meal>(entity =>
            {
                entity.HasKey(e => e.MealId);

                entity.HasOne(e => e.NutritionPlan)
                    .WithMany(np => np.Meals)
                    .HasForeignKey(e => e.NutritionPlanId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.CreatedByCoach)
                    .WithMany(c => c.MealsCreated)
                    .HasForeignKey(e => e.CreatedByCoachId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // MealIngredient Configuration
            modelBuilder.Entity<MealIngredient>(entity =>
            {
                entity.HasKey(e => e.MealIngredientId);
                entity.Property(e => e.Quantity).HasPrecision(10, 2);

                entity.HasOne(e => e.Meal)
                    .WithMany(m => m.Ingredients)
                    .HasForeignKey(e => e.MealId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Ingredient)
                    .WithMany(i => i.MealIngredients)
                    .HasForeignKey(e => e.IngredientId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Ingredient Configuration
            modelBuilder.Entity<Ingredient>(entity =>
            {
                entity.HasKey(e => e.IngredientId);
                entity.Property(e => e.ProteinPer100g).HasPrecision(6, 2);
                entity.Property(e => e.CarbsPer100g).HasPrecision(6, 2);
                entity.Property(e => e.FatsPer100g).HasPrecision(6, 2);
                entity.HasIndex(e => e.Name);
            });

            // AiChatLog Configuration
            modelBuilder.Entity<AiChatLog>(entity =>
            {
                entity.HasKey(e => e.ChatId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.AiChatLogs)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // AiProgramGeneration Configuration
            modelBuilder.Entity<AiProgramGeneration>(entity =>
            {
                entity.HasKey(e => e.GenerationId);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.AiProgramGenerations)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.WorkoutPlan)
                    .WithMany(wp => wp.AiGenerations)
                    .HasForeignKey(e => e.WorkoutPlanId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.NutritionPlan)
                    .WithMany(np => np.AiGenerations)
                    .HasForeignKey(e => e.NutritionPlanId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // AiWorkflowJob Configuration
            modelBuilder.Entity<AiWorkflowJob>(entity =>
            {
                entity.HasKey(e => e.JobId);
                entity.HasIndex(e => new { e.UserId, e.Status });

                entity.HasOne(e => e.User)
                    .WithMany(u => u.AiWorkflowJobs)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ActivityFeed Configuration
            modelBuilder.Entity<ActivityFeed>(entity =>
            {
                entity.HasKey(e => e.ActivityId);
                entity.HasIndex(e => new { e.UserId, e.CreatedAt });

                entity.HasOne(e => e.User)
                    .WithMany(u => u.ActivityFeeds)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ProgressMilestone Configuration
            modelBuilder.Entity<ProgressMilestone>(entity =>
            {
                entity.HasKey(e => e.MilestoneId);
            });

            // UserMilestone Configuration
            modelBuilder.Entity<UserMilestone>(entity =>
            {
                entity.HasKey(e => e.UserMilestoneId);
                entity.HasIndex(e => new { e.UserId, e.MilestoneId });

                entity.HasOne(e => e.User)
                    .WithMany(u => u.UserMilestones)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Milestone)
                    .WithMany(m => m.UserMilestones)
                    .HasForeignKey(e => e.MilestoneId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Notification Configuration
            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.NotificationId);
                entity.HasIndex(e => new { e.UserId, e.IsRead });

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Notifications)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ChatMessage Configuration
            modelBuilder.Entity<ChatMessage>(entity =>
            {
                entity.HasKey(e => e.ChatMessageId);

                entity.HasIndex(e => e.ConversationId);
                entity.HasIndex(e => new { e.SenderId, e.ReceiverId });
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.ExpiresAt);

                entity.Property(e => e.Message).IsRequired();
                entity.Property(e => e.ConversationId).IsRequired().HasMaxLength(50);

                entity.HasOne(e => e.Sender)
                    .WithMany()
                    .HasForeignKey(e => e.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Receiver)
                    .WithMany()
                    .HasForeignKey(e => e.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // CoachReview Configuration
            modelBuilder.Entity<CoachReview>(entity =>
            {
                entity.HasKey(e => e.ReviewId);
                entity.Property(e => e.Rating).HasPrecision(3, 2);

                entity.HasOne(e => e.Coach)
                    .WithMany(c => c.Reviews)
                    .HasForeignKey(e => e.CoachId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.User)
                    .WithMany(u => u.CoachReviews)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // AuditLog Configuration
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.HasKey(e => e.LogId);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.Action);
                entity.HasIndex(e => e.UserId);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // EquipmentTimeSlot Configuration
            modelBuilder.Entity<EquipmentTimeSlot>(entity =>
            {
                entity.HasKey(e => e.SlotId);
                entity.HasIndex(e => new { e.EquipmentId, e.SlotDate, e.StartTime }).IsUnique();
                entity.HasIndex(e => new { e.SlotDate, e.IsBooked });

                entity.HasOne(e => e.Equipment)
                    .WithMany()
                    .HasForeignKey(e => e.EquipmentId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.BookedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.BookedByUserId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.Booking)
                    .WithMany(b => b.EquipmentTimeSlots)
                    .HasForeignKey(e => e.BookingId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // CoachSessionEquipment Configuration
            modelBuilder.Entity<CoachSessionEquipment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.CoachBookingId);

                entity.HasOne(e => e.CoachBooking)
                    .WithMany()
                    .HasForeignKey(e => e.CoachBookingId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.EquipmentBooking)
                    .WithMany()
                    .HasForeignKey(e => e.EquipmentBookingId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Equipment)
                    .WithMany()
                    .HasForeignKey(e => e.EquipmentId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.WorkoutPlanExercise)
                    .WithMany()
                    .HasForeignKey(e => e.WorkoutPlanExerciseId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Performance Indexes
            modelBuilder.Entity<User>().HasIndex(e => e.IsActive);
            modelBuilder.Entity<User>().HasIndex(e => e.Role);
            modelBuilder.Entity<User>().HasIndex(e => e.CreatedAt);
            modelBuilder.Entity<User>().HasIndex(e => e.LastLoginAt);

            modelBuilder.Entity<WorkoutPlan>().HasIndex(e => new { e.UserId, e.IsActive });
            modelBuilder.Entity<WorkoutPlan>().HasIndex(e => e.CreatedAt);

            modelBuilder.Entity<NutritionPlan>().HasIndex(e => new { e.UserId, e.IsActive });
            modelBuilder.Entity<NutritionPlan>().HasIndex(e => e.CreatedAt);

            modelBuilder.Entity<Booking>().HasIndex(e => new { e.UserId, e.StartTime });
            modelBuilder.Entity<Booking>().HasIndex(e => new { e.CoachId, e.StartTime });
            modelBuilder.Entity<Booking>().HasIndex(e => new { e.EquipmentId, e.StartTime });
            modelBuilder.Entity<Booking>().HasIndex(e => e.Status);

            modelBuilder.Entity<TokenTransaction>().HasIndex(e => new { e.UserId, e.CreatedAt });
            modelBuilder.Entity<TokenTransaction>().HasIndex(e => e.TransactionType);

            modelBuilder.Entity<ChatMessage>().HasIndex(e => new { e.ConversationId, e.CreatedAt });

            modelBuilder.Entity<WorkoutLog>().HasIndex(e => new { e.UserId, e.WorkoutDate });
            modelBuilder.Entity<WorkoutLog>().HasIndex(e => e.WorkoutDate);

            modelBuilder.Entity<AiChatLog>().HasIndex(e => new { e.UserId, e.SessionId });
            modelBuilder.Entity<AiChatLog>().HasIndex(e => e.CreatedAt);

            modelBuilder.Entity<CoachReview>().HasIndex(e => new { e.CoachId, e.CreatedAt });
            modelBuilder.Entity<CoachReview>().HasIndex(e => e.Rating);

            modelBuilder.Entity<UserSubscription>().HasIndex(e => new { e.UserId, e.Status });
            modelBuilder.Entity<UserSubscription>().HasIndex(e => e.EndDate);

            modelBuilder.Entity<Payment>().HasIndex(e => new { e.UserId, e.CreatedAt });
            modelBuilder.Entity<Payment>().HasIndex(e => e.Status);

            modelBuilder.Entity<Exercise>().HasIndex(e => e.MuscleGroup);
            modelBuilder.Entity<Exercise>().HasIndex(e => e.DifficultyLevel);
        }
    }
}
