using DomainLayer.Models;
using Microsoft.EntityFrameworkCore;

namespace Presistence;

public class IntelliFit_DbContext : DbContext
{
    // User Management
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Admin> Admins { get; set; } = null!;
    public DbSet<Coach> Coaches { get; set; } = null!;
    public DbSet<Receptionist> Receptionists { get; set; } = null!;

    // Equipment & Facility Management
    public DbSet<Equipment> Equipments { get; set; } = null!;
    public DbSet<Booking> Bookings { get; set; } = null!;
    public DbSet<WorkoutSession> WorkoutSessions { get; set; } = null!;
    public DbSet<MaintenanceLog> MaintenanceLogs { get; set; } = null!;

    // Workout Management
    public DbSet<Exercise> Exercises { get; set; } = null!;
    public DbSet<WorkoutPlanTemplate> WorkoutPlanTemplates { get; set; } = null!;
    public DbSet<TemplateExercise> TemplateExercises { get; set; } = null!;
    public DbSet<MemberWorkoutPlan> MemberWorkoutPlans { get; set; } = null!;

    // Nutrition Management
    public DbSet<NutritionPlan> NutritionPlans { get; set; } = null!;
    public DbSet<Meal> Meals { get; set; } = null!;
    public DbSet<Ingredient> Ingredients { get; set; } = null!;
    public DbSet<MealIngredient> MealIngredients { get; set; } = null!;

    // AI Features
    public DbSet<AI_Agent> AI_Agents { get; set; } = null!;
    public DbSet<WorkoutRecommendation> WorkoutRecommendations { get; set; } = null!;
    public DbSet<RecommendedExercise> RecommendedExercises { get; set; } = null!;
    public DbSet<ExerciseFormAnalysis> ExerciseFormAnalyses { get; set; } = null!;
    public DbSet<ChurnPrediction> ChurnPredictions { get; set; } = null!;
    public DbSet<EquipmentDemandPrediction> EquipmentDemandPredictions { get; set; } = null!;
    public DbSet<GymOccupancy> GymOccupancies { get; set; } = null!;
    public DbSet<SafetyIncident> SafetyIncidents { get; set; } = null!;
    public DbSet<AIQueryLog> AIQueryLogs { get; set; } = null!;

    // Business Management
    public DbSet<MemberCoachSubscription> MemberCoachSubscriptions { get; set; } = null!;
    public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; } = null!;
    public DbSet<Payment> Payments { get; set; } = null!;
    public DbSet<TokenTransaction> TokenTransactions { get; set; } = null!;
    public DbSet<CoachReview> CoachReviews { get; set; } = null!;

    // Health Monitoring
    public DbSet<InBodyMeasurement> InBodyMeasurements { get; set; } = null!;
    public DbSet<WearableDevice> WearableDevices { get; set; } = null!;
    public DbSet<HeartRateData> HeartRateData { get; set; } = null!;

    // Progress Tracking
    public DbSet<ProgressMilestone> ProgressMilestones { get; set; } = null!;

    // Communication
    public DbSet<Notification> Notifications { get; set; } = null!;
    public IntelliFit_DbContext(DbContextOptions<IntelliFit_DbContext> options) : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure primary keys for ALL entities with non-conventional naming
        modelBuilder.Entity<AI_Agent>().HasKey(x => x.AI_ID);
        modelBuilder.Entity<AIQueryLog>().HasKey(x => x.QueryID);
        modelBuilder.Entity<Booking>().HasKey(x => x.BookingID);
        modelBuilder.Entity<ChurnPrediction>().HasKey(x => x.PredictionID);
        modelBuilder.Entity<CoachReview>().HasKey(x => x.ReviewID);
        modelBuilder.Entity<Equipment>().HasKey(x => x.EquipmentID);
        modelBuilder.Entity<EquipmentDemandPrediction>().HasKey(x => x.PredictionID);
        modelBuilder.Entity<Exercise>().HasKey(x => x.ExerciseID);
        modelBuilder.Entity<ExerciseFormAnalysis>().HasKey(x => x.AnalysisID);
        modelBuilder.Entity<GymOccupancy>().HasKey(x => x.OccupancyID);
        modelBuilder.Entity<HeartRateData>().HasKey(x => x.RecordID);
        modelBuilder.Entity<InBodyMeasurement>().HasKey(x => x.InBodyID);
        modelBuilder.Entity<MaintenanceLog>().HasKey(x => x.MaintenanceID);
        modelBuilder.Entity<MemberCoachSubscription>().HasKey(x => x.SubscriptionID);
        modelBuilder.Entity<MemberWorkoutPlan>().HasKey(x => x.PlanInstanceID);
        modelBuilder.Entity<Notification>().HasKey(x => x.NotificationID);
        modelBuilder.Entity<NutritionPlan>().HasKey(x => x.PlanID);
        modelBuilder.Entity<Payment>().HasKey(x => x.PaymentID);
        modelBuilder.Entity<ProgressMilestone>().HasKey(x => x.MilestoneID);
        modelBuilder.Entity<SafetyIncident>().HasKey(x => x.IncidentID);
        modelBuilder.Entity<SubscriptionPlan>().HasKey(x => x.PlanID);
        modelBuilder.Entity<TokenTransaction>().HasKey(x => x.TransactionID);
        modelBuilder.Entity<WearableDevice>().HasKey(x => x.DeviceID);
        modelBuilder.Entity<WorkoutPlanTemplate>().HasKey(x => x.TemplateID);
        modelBuilder.Entity<WorkoutRecommendation>().HasKey(x => x.RecommendationID);
        modelBuilder.Entity<WorkoutSession>().HasKey(x => x.SessionID);

        // Configure User inheritance hierarchy
        modelBuilder.Entity<User>()
            .HasDiscriminator<string>("UserType")
            .HasValue<Admin>("Admin")
            .HasValue<Coach>("Coach")
            .HasValue<Receptionist>("Receptionist");

        // Prevent cascade delete conflicts by setting NO ACTION on secondary foreign keys
        // All entities with multiple FKs to Users table (TPH hierarchy)

        // CoachReview: UserID (CASCADE), CoachID (NO ACTION)
        modelBuilder.Entity<CoachReview>()
            .HasOne(cr => cr.User)
            .WithMany()
            .HasForeignKey(cr => cr.UserID)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CoachReview>()
            .HasOne(cr => cr.Coach)
            .WithMany()
            .HasForeignKey(cr => cr.CoachID)
            .OnDelete(DeleteBehavior.NoAction);

        // InBodyMeasurement: UserID (CASCADE), ReceptionistID (NO ACTION)
        modelBuilder.Entity<InBodyMeasurement>()
            .HasOne(ibm => ibm.User)
            .WithMany()
            .HasForeignKey(ibm => ibm.UserID)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<InBodyMeasurement>()
            .HasOne(ibm => ibm.Receptionist)
            .WithMany()
            .HasForeignKey(ibm => ibm.ReceptionistID)
            .OnDelete(DeleteBehavior.NoAction);

        // MemberCoachSubscription: UserID (CASCADE), CoachID (NO ACTION)
        modelBuilder.Entity<MemberCoachSubscription>()
            .HasOne(mcs => mcs.User)
            .WithMany()
            .HasForeignKey(mcs => mcs.UserID)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MemberCoachSubscription>()
            .HasOne(mcs => mcs.Coach)
            .WithMany()
            .HasForeignKey(mcs => mcs.CoachID)
            .OnDelete(DeleteBehavior.NoAction);

        // TokenTransaction: UserID (CASCADE), ReceptionistID (NO ACTION)
        modelBuilder.Entity<TokenTransaction>()
            .HasOne(tt => tt.User)
            .WithMany()
            .HasForeignKey(tt => tt.UserID)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TokenTransaction>()
            .HasOne(tt => tt.Receptionist)
            .WithMany()
            .HasForeignKey(tt => tt.ReceptionistID)
            .OnDelete(DeleteBehavior.NoAction);

        // WorkoutSession: UserID (CASCADE), CoachID (NO ACTION)
        modelBuilder.Entity<WorkoutSession>()
            .HasOne(ws => ws.User)
            .WithMany()
            .HasForeignKey(ws => ws.UserID)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WorkoutSession>()
            .HasOne(ws => ws.Coach)
            .WithMany()
            .HasForeignKey(ws => ws.CoachID)
            .OnDelete(DeleteBehavior.NoAction);

        // WorkoutRecommendation: UserID (CASCADE), ReviewedByCoachID (NO ACTION)
        modelBuilder.Entity<WorkoutRecommendation>()
            .HasOne(wr => wr.User)
            .WithMany()
            .HasForeignKey(wr => wr.UserID)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WorkoutRecommendation>()
            .HasOne(wr => wr.ReviewedByCoach)
            .WithMany()
            .HasForeignKey(wr => wr.ReviewedByCoachID)
            .OnDelete(DeleteBehavior.NoAction);

        // NutritionPlan: UserID (CASCADE), ReviewedByCoachID (NO ACTION)
        modelBuilder.Entity<NutritionPlan>()
            .HasOne(np => np.User)
            .WithMany()
            .HasForeignKey(np => np.UserID)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<NutritionPlan>()
            .HasOne(np => np.ReviewedByCoach)
            .WithMany()
            .HasForeignKey(np => np.ReviewedByCoachID)
            .OnDelete(DeleteBehavior.NoAction);

        // MemberWorkoutPlan: UserID (CASCADE), AssignedByCoachID (NO ACTION)
        modelBuilder.Entity<MemberWorkoutPlan>()
            .HasOne(mwp => mwp.User)
            .WithMany()
            .HasForeignKey(mwp => mwp.UserID)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MemberWorkoutPlan>()
            .HasOne(mwp => mwp.AssignedByCoach)
            .WithMany()
            .HasForeignKey(mwp => mwp.AssignedByCoachID)
            .OnDelete(DeleteBehavior.NoAction);

        // Meal: AddedByCoachID (NO ACTION) - only one FK to Users
        modelBuilder.Entity<Meal>()
            .HasOne(m => m.AddedByCoach)
            .WithMany()
            .HasForeignKey(m => m.AddedByCoachID)
            .OnDelete(DeleteBehavior.NoAction);

        // RecommendedExercise: AddedByCoachID (NO ACTION) - only one FK to Users
        modelBuilder.Entity<RecommendedExercise>()
            .HasOne(re => re.AddedByCoach)
            .WithMany()
            .HasForeignKey(re => re.AddedByCoachID)
            .OnDelete(DeleteBehavior.NoAction);

        // MealIngredient: ModifiedByCoachID (NO ACTION) - only one FK to Users
        modelBuilder.Entity<MealIngredient>()
            .HasOne(mi => mi.ModifiedByCoach)
            .WithMany()
            .HasForeignKey(mi => mi.ModifiedByCoachID)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
