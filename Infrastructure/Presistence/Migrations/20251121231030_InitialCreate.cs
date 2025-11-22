using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AI_Agents",
                columns: table => new
                {
                    AI_ID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ModelName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Version = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Provider = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AI_Agents", x => x.AI_ID);
                });

            migrationBuilder.CreateTable(
                name: "Exercises",
                columns: table => new
                {
                    ExerciseID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MuscleGroup = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Difficulty = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    VideoUrl = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Exercises", x => x.ExerciseID);
                });

            migrationBuilder.CreateTable(
                name: "GymOccupancies",
                columns: table => new
                {
                    OccupancyID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PeopleCount = table.Column<int>(type: "int", nullable: false),
                    ZoneName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OccupancyPercentage = table.Column<float>(type: "real", nullable: false),
                    CameraID = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GymOccupancies", x => x.OccupancyID);
                });

            migrationBuilder.CreateTable(
                name: "Ingredients",
                columns: table => new
                {
                    IngredientId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CaloriesPer100g = table.Column<int>(type: "int", nullable: false),
                    ProteinPer100g = table.Column<float>(type: "real", nullable: false),
                    CarbsPer100g = table.Column<float>(type: "real", nullable: false),
                    FatsPer100g = table.Column<float>(type: "real", nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ingredients", x => x.IngredientId);
                });

            migrationBuilder.CreateTable(
                name: "SubscriptionPlans",
                columns: table => new
                {
                    PlanID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlanName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MonthlyFee = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TokensIncluded = table.Column<int>(type: "int", nullable: false),
                    HasAIFeatures = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionPlans", x => x.PlanID);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Age = table.Column<int>(type: "int", nullable: false),
                    Gender = table.Column<int>(type: "int", nullable: false),
                    FitnessGoal = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TokenBalance = table.Column<int>(type: "int", nullable: false),
                    SubscriptionPlan = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    AdminUserId = table.Column<int>(type: "int", nullable: true),
                    UserType = table.Column<string>(type: "nvarchar(13)", maxLength: 13, nullable: false),
                    AdminID = table.Column<int>(type: "int", nullable: true),
                    CoachID = table.Column<int>(type: "int", nullable: true),
                    Coach_Phone = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Specialty = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReceptionistID = table.Column<int>(type: "int", nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_Users_Users_AdminUserId",
                        column: x => x.AdminUserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "AIQueryLogs",
                columns: table => new
                {
                    QueryID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    AI_ID = table.Column<int>(type: "int", nullable: false),
                    QueryText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ResponseText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AIAgentAI_ID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIQueryLogs", x => x.QueryID);
                    table.ForeignKey(
                        name: "FK_AIQueryLogs_AI_Agents_AIAgentAI_ID",
                        column: x => x.AIAgentAI_ID,
                        principalTable: "AI_Agents",
                        principalColumn: "AI_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AIQueryLogs_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChurnPredictions",
                columns: table => new
                {
                    PredictionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    ChurnProbability = table.Column<float>(type: "real", nullable: false),
                    RiskLevel = table.Column<int>(type: "int", nullable: false),
                    PredictionDate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurnPredictions", x => x.PredictionID);
                    table.ForeignKey(
                        name: "FK_ChurnPredictions_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CoachReviews",
                columns: table => new
                {
                    ReviewID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    CoachID = table.Column<int>(type: "int", nullable: false),
                    Rating = table.Column<int>(type: "int", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CoachUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CoachReviews", x => x.ReviewID);
                    table.ForeignKey(
                        name: "FK_CoachReviews_Users_CoachID",
                        column: x => x.CoachID,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_CoachReviews_Users_CoachUserId",
                        column: x => x.CoachUserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_CoachReviews_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Equipments",
                columns: table => new
                {
                    EquipmentID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    QRCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MaintenanceIntervalDays = table.Column<int>(type: "int", nullable: false),
                    LastMaintenanceDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NextMaintenanceDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TokenCostPerHour = table.Column<int>(type: "int", nullable: false),
                    AdminUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipments", x => x.EquipmentID);
                    table.ForeignKey(
                        name: "FK_Equipments_Users_AdminUserId",
                        column: x => x.AdminUserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "InBodyMeasurements",
                columns: table => new
                {
                    InBodyID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    ReceptionistID = table.Column<int>(type: "int", nullable: false),
                    Weight = table.Column<float>(type: "real", nullable: false),
                    FatPercentage = table.Column<float>(type: "real", nullable: false),
                    MuscleMass = table.Column<float>(type: "real", nullable: false),
                    BMI = table.Column<float>(type: "real", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReceiptPhotoUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AIInsights = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CoachUserId = table.Column<int>(type: "int", nullable: true),
                    ReceptionistUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InBodyMeasurements", x => x.InBodyID);
                    table.ForeignKey(
                        name: "FK_InBodyMeasurements_Users_CoachUserId",
                        column: x => x.CoachUserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_InBodyMeasurements_Users_ReceptionistID",
                        column: x => x.ReceptionistID,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_InBodyMeasurements_Users_ReceptionistUserId",
                        column: x => x.ReceptionistUserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_InBodyMeasurements_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MemberCoachSubscriptions",
                columns: table => new
                {
                    SubscriptionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    CoachID = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Fee = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CoachUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberCoachSubscriptions", x => x.SubscriptionID);
                    table.ForeignKey(
                        name: "FK_MemberCoachSubscriptions_Users_CoachID",
                        column: x => x.CoachID,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_MemberCoachSubscriptions_Users_CoachUserId",
                        column: x => x.CoachUserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_MemberCoachSubscriptions_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    NotificationID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.NotificationID);
                    table.ForeignKey(
                        name: "FK_Notifications_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "NutritionPlans",
                columns: table => new
                {
                    PlanID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    AI_ID = table.Column<int>(type: "int", nullable: false),
                    ReviewedByCoachID = table.Column<int>(type: "int", nullable: true),
                    PlanName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DailyCalories = table.Column<int>(type: "int", nullable: false),
                    ProteinGrams = table.Column<float>(type: "real", nullable: false),
                    CarbsGrams = table.Column<float>(type: "real", nullable: false),
                    FatsGrams = table.Column<float>(type: "real", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ApprovalStatus = table.Column<int>(type: "int", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReviewComments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    PlanSource = table.Column<int>(type: "int", nullable: false),
                    AIAgentAI_ID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NutritionPlans", x => x.PlanID);
                    table.ForeignKey(
                        name: "FK_NutritionPlans_AI_Agents_AIAgentAI_ID",
                        column: x => x.AIAgentAI_ID,
                        principalTable: "AI_Agents",
                        principalColumn: "AI_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NutritionPlans_Users_ReviewedByCoachID",
                        column: x => x.ReviewedByCoachID,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_NutritionPlans_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    PaymentID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaymentMethod = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PaymentType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.PaymentID);
                    table.ForeignKey(
                        name: "FK_Payments_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TokenTransactions",
                columns: table => new
                {
                    TransactionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    ReceptionistID = table.Column<int>(type: "int", nullable: true),
                    Amount = table.Column<int>(type: "int", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    PaymentRef = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReceptionistUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TokenTransactions", x => x.TransactionID);
                    table.ForeignKey(
                        name: "FK_TokenTransactions_Users_ReceptionistID",
                        column: x => x.ReceptionistID,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_TokenTransactions_Users_ReceptionistUserId",
                        column: x => x.ReceptionistUserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_TokenTransactions_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WearableDevices",
                columns: table => new
                {
                    DeviceID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    DeviceType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Brand = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DeviceIdentifier = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PairedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WearableDevices", x => x.DeviceID);
                    table.ForeignKey(
                        name: "FK_WearableDevices_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkoutPlanTemplates",
                columns: table => new
                {
                    TemplateID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CoachID = table.Column<int>(type: "int", nullable: true),
                    TemplateName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DifficultyLevel = table.Column<int>(type: "int", nullable: false),
                    DurationWeeks = table.Column<int>(type: "int", nullable: false),
                    WorkoutsPerWeek = table.Column<int>(type: "int", nullable: false),
                    IsPublic = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutPlanTemplates", x => x.TemplateID);
                    table.ForeignKey(
                        name: "FK_WorkoutPlanTemplates_Users_CoachID",
                        column: x => x.CoachID,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "WorkoutRecommendations",
                columns: table => new
                {
                    RecommendationID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    AI_ID = table.Column<int>(type: "int", nullable: false),
                    ReviewedByCoachID = table.Column<int>(type: "int", nullable: true),
                    RecommendationName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DifficultyLevel = table.Column<int>(type: "int", nullable: false),
                    DurationWeeks = table.Column<int>(type: "int", nullable: false),
                    WorkoutsPerWeek = table.Column<int>(type: "int", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ApprovalStatus = table.Column<int>(type: "int", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReviewComments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserResponseAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsAccepted = table.Column<bool>(type: "bit", nullable: false),
                    PlanSource = table.Column<int>(type: "int", nullable: false),
                    AIAgentAI_ID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutRecommendations", x => x.RecommendationID);
                    table.ForeignKey(
                        name: "FK_WorkoutRecommendations_AI_Agents_AIAgentAI_ID",
                        column: x => x.AIAgentAI_ID,
                        principalTable: "AI_Agents",
                        principalColumn: "AI_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkoutRecommendations_Users_ReviewedByCoachID",
                        column: x => x.ReviewedByCoachID,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_WorkoutRecommendations_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    BookingID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    EquipmentID = table.Column<int>(type: "int", nullable: false),
                    StartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    TokensDeducted = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bookings", x => x.BookingID);
                    table.ForeignKey(
                        name: "FK_Bookings_Equipments_EquipmentID",
                        column: x => x.EquipmentID,
                        principalTable: "Equipments",
                        principalColumn: "EquipmentID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Bookings_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EquipmentDemandPredictions",
                columns: table => new
                {
                    PredictionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EquipmentID = table.Column<int>(type: "int", nullable: false),
                    PredictedForDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DemandScore = table.Column<float>(type: "real", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EquipmentDemandPredictions", x => x.PredictionID);
                    table.ForeignKey(
                        name: "FK_EquipmentDemandPredictions_Equipments_EquipmentID",
                        column: x => x.EquipmentID,
                        principalTable: "Equipments",
                        principalColumn: "EquipmentID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MaintenanceLogs",
                columns: table => new
                {
                    MaintenanceID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EquipmentID = table.Column<int>(type: "int", nullable: false),
                    MaintenanceDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MaintenanceType = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Cost = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DowntimeDays = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceLogs", x => x.MaintenanceID);
                    table.ForeignKey(
                        name: "FK_MaintenanceLogs_Equipments_EquipmentID",
                        column: x => x.EquipmentID,
                        principalTable: "Equipments",
                        principalColumn: "EquipmentID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SafetyIncidents",
                columns: table => new
                {
                    IncidentID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: true),
                    EquipmentID = table.Column<int>(type: "int", nullable: true),
                    IncidentType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Severity = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DetectedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsResolved = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SafetyIncidents", x => x.IncidentID);
                    table.ForeignKey(
                        name: "FK_SafetyIncidents_Equipments_EquipmentID",
                        column: x => x.EquipmentID,
                        principalTable: "Equipments",
                        principalColumn: "EquipmentID");
                    table.ForeignKey(
                        name: "FK_SafetyIncidents_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "WorkoutSessions",
                columns: table => new
                {
                    SessionID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    EquipmentID = table.Column<int>(type: "int", nullable: false),
                    CoachID = table.Column<int>(type: "int", nullable: true),
                    StartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DurationMinutes = table.Column<int>(type: "int", nullable: false),
                    CaloriesBurned = table.Column<int>(type: "int", nullable: false),
                    IntensityLevel = table.Column<int>(type: "int", nullable: false),
                    AverageHeartRate = table.Column<float>(type: "real", nullable: true),
                    IsSupervisedByCoach = table.Column<bool>(type: "bit", nullable: false),
                    CoachUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkoutSessions", x => x.SessionID);
                    table.ForeignKey(
                        name: "FK_WorkoutSessions_Equipments_EquipmentID",
                        column: x => x.EquipmentID,
                        principalTable: "Equipments",
                        principalColumn: "EquipmentID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkoutSessions_Users_CoachID",
                        column: x => x.CoachID,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_WorkoutSessions_Users_CoachUserId",
                        column: x => x.CoachUserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_WorkoutSessions_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Meals",
                columns: table => new
                {
                    MealId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NutritionPlanId = table.Column<int>(type: "int", nullable: false),
                    MealType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Calories = table.Column<int>(type: "int", nullable: false),
                    ProteinGrams = table.Column<float>(type: "real", nullable: false),
                    CarbsGrams = table.Column<float>(type: "real", nullable: false),
                    FatsGrams = table.Column<float>(type: "real", nullable: false),
                    RecommendedTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    IsAddedByCoach = table.Column<bool>(type: "bit", nullable: false),
                    AddedByCoachID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Meals", x => x.MealId);
                    table.ForeignKey(
                        name: "FK_Meals_NutritionPlans_NutritionPlanId",
                        column: x => x.NutritionPlanId,
                        principalTable: "NutritionPlans",
                        principalColumn: "PlanID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Meals_Users_AddedByCoachID",
                        column: x => x.AddedByCoachID,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateTable(
                name: "MemberWorkoutPlans",
                columns: table => new
                {
                    PlanInstanceID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    TemplateID = table.Column<int>(type: "int", nullable: true),
                    AssignedByCoachID = table.Column<int>(type: "int", nullable: true),
                    GeneratedByAI_ID = table.Column<int>(type: "int", nullable: true),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CompletedWorkouts = table.Column<int>(type: "int", nullable: false),
                    PlanSource = table.Column<int>(type: "int", nullable: false),
                    ApprovalStatus = table.Column<int>(type: "int", nullable: false),
                    GeneratedByAIAI_ID = table.Column<int>(type: "int", nullable: true),
                    CoachUserId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberWorkoutPlans", x => x.PlanInstanceID);
                    table.ForeignKey(
                        name: "FK_MemberWorkoutPlans_AI_Agents_GeneratedByAIAI_ID",
                        column: x => x.GeneratedByAIAI_ID,
                        principalTable: "AI_Agents",
                        principalColumn: "AI_ID");
                    table.ForeignKey(
                        name: "FK_MemberWorkoutPlans_Users_AssignedByCoachID",
                        column: x => x.AssignedByCoachID,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_MemberWorkoutPlans_Users_CoachUserId",
                        column: x => x.CoachUserId,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_MemberWorkoutPlans_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MemberWorkoutPlans_WorkoutPlanTemplates_TemplateID",
                        column: x => x.TemplateID,
                        principalTable: "WorkoutPlanTemplates",
                        principalColumn: "TemplateID");
                });

            migrationBuilder.CreateTable(
                name: "TemplateExercises",
                columns: table => new
                {
                    TemplateExerciseId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TemplateID = table.Column<int>(type: "int", nullable: false),
                    ExerciseId = table.Column<int>(type: "int", nullable: false),
                    DayNumber = table.Column<int>(type: "int", nullable: false),
                    Sets = table.Column<int>(type: "int", nullable: false),
                    Reps = table.Column<int>(type: "int", nullable: false),
                    Weight = table.Column<float>(type: "real", nullable: true),
                    RestTime = table.Column<TimeSpan>(type: "time", nullable: true),
                    Order = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TemplateExercises", x => x.TemplateExerciseId);
                    table.ForeignKey(
                        name: "FK_TemplateExercises_Exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "Exercises",
                        principalColumn: "ExerciseID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TemplateExercises_WorkoutPlanTemplates_TemplateID",
                        column: x => x.TemplateID,
                        principalTable: "WorkoutPlanTemplates",
                        principalColumn: "TemplateID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RecommendedExercises",
                columns: table => new
                {
                    RecommendedExerciseId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    WorkoutRecommendationId = table.Column<int>(type: "int", nullable: false),
                    ExerciseId = table.Column<int>(type: "int", nullable: false),
                    Sets = table.Column<int>(type: "int", nullable: false),
                    Reps = table.Column<int>(type: "int", nullable: false),
                    Weight = table.Column<float>(type: "real", nullable: true),
                    RestTime = table.Column<TimeSpan>(type: "time", nullable: true),
                    Order = table.Column<int>(type: "int", nullable: false),
                    CoachNotes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsAddedByCoach = table.Column<bool>(type: "bit", nullable: false),
                    AddedByCoachID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecommendedExercises", x => x.RecommendedExerciseId);
                    table.ForeignKey(
                        name: "FK_RecommendedExercises_Exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "Exercises",
                        principalColumn: "ExerciseID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RecommendedExercises_Users_AddedByCoachID",
                        column: x => x.AddedByCoachID,
                        principalTable: "Users",
                        principalColumn: "UserId");
                    table.ForeignKey(
                        name: "FK_RecommendedExercises_WorkoutRecommendations_WorkoutRecommendationId",
                        column: x => x.WorkoutRecommendationId,
                        principalTable: "WorkoutRecommendations",
                        principalColumn: "RecommendationID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ExerciseFormAnalyses",
                columns: table => new
                {
                    AnalysisID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionID = table.Column<int>(type: "int", nullable: false),
                    AI_ID = table.Column<int>(type: "int", nullable: false),
                    ExerciseName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RepCount = table.Column<int>(type: "int", nullable: false),
                    FormScore = table.Column<float>(type: "real", nullable: false),
                    FormFeedback = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InjuryRiskScore = table.Column<float>(type: "real", nullable: false),
                    PoseDataJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AIAgentAI_ID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExerciseFormAnalyses", x => x.AnalysisID);
                    table.ForeignKey(
                        name: "FK_ExerciseFormAnalyses_AI_Agents_AIAgentAI_ID",
                        column: x => x.AIAgentAI_ID,
                        principalTable: "AI_Agents",
                        principalColumn: "AI_ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ExerciseFormAnalyses_WorkoutSessions_SessionID",
                        column: x => x.SessionID,
                        principalTable: "WorkoutSessions",
                        principalColumn: "SessionID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HeartRateData",
                columns: table => new
                {
                    RecordID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DeviceID = table.Column<int>(type: "int", nullable: false),
                    SessionID = table.Column<int>(type: "int", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    HeartRate = table.Column<int>(type: "int", nullable: false),
                    CaloriesBurned = table.Column<float>(type: "real", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HeartRateData", x => x.RecordID);
                    table.ForeignKey(
                        name: "FK_HeartRateData_WearableDevices_DeviceID",
                        column: x => x.DeviceID,
                        principalTable: "WearableDevices",
                        principalColumn: "DeviceID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HeartRateData_WorkoutSessions_SessionID",
                        column: x => x.SessionID,
                        principalTable: "WorkoutSessions",
                        principalColumn: "SessionID");
                });

            migrationBuilder.CreateTable(
                name: "MealIngredients",
                columns: table => new
                {
                    MealIngredientId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MealId = table.Column<int>(type: "int", nullable: false),
                    IngredientId = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<float>(type: "real", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsAddedByCoach = table.Column<bool>(type: "bit", nullable: false),
                    ModifiedByCoachID = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MealIngredients", x => x.MealIngredientId);
                    table.ForeignKey(
                        name: "FK_MealIngredients_Ingredients_IngredientId",
                        column: x => x.IngredientId,
                        principalTable: "Ingredients",
                        principalColumn: "IngredientId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MealIngredients_Meals_MealId",
                        column: x => x.MealId,
                        principalTable: "Meals",
                        principalColumn: "MealId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MealIngredients_Users_ModifiedByCoachID",
                        column: x => x.ModifiedByCoachID,
                        principalTable: "Users",
                        principalColumn: "UserId");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AIQueryLogs_AIAgentAI_ID",
                table: "AIQueryLogs",
                column: "AIAgentAI_ID");

            migrationBuilder.CreateIndex(
                name: "IX_AIQueryLogs_UserID",
                table: "AIQueryLogs",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_EquipmentID",
                table: "Bookings",
                column: "EquipmentID");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_UserID",
                table: "Bookings",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_ChurnPredictions_UserID",
                table: "ChurnPredictions",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_CoachReviews_CoachID",
                table: "CoachReviews",
                column: "CoachID");

            migrationBuilder.CreateIndex(
                name: "IX_CoachReviews_CoachUserId",
                table: "CoachReviews",
                column: "CoachUserId");

            migrationBuilder.CreateIndex(
                name: "IX_CoachReviews_UserID",
                table: "CoachReviews",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_EquipmentDemandPredictions_EquipmentID",
                table: "EquipmentDemandPredictions",
                column: "EquipmentID");

            migrationBuilder.CreateIndex(
                name: "IX_Equipments_AdminUserId",
                table: "Equipments",
                column: "AdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ExerciseFormAnalyses_AIAgentAI_ID",
                table: "ExerciseFormAnalyses",
                column: "AIAgentAI_ID");

            migrationBuilder.CreateIndex(
                name: "IX_ExerciseFormAnalyses_SessionID",
                table: "ExerciseFormAnalyses",
                column: "SessionID");

            migrationBuilder.CreateIndex(
                name: "IX_HeartRateData_DeviceID",
                table: "HeartRateData",
                column: "DeviceID");

            migrationBuilder.CreateIndex(
                name: "IX_HeartRateData_SessionID",
                table: "HeartRateData",
                column: "SessionID");

            migrationBuilder.CreateIndex(
                name: "IX_InBodyMeasurements_CoachUserId",
                table: "InBodyMeasurements",
                column: "CoachUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InBodyMeasurements_ReceptionistID",
                table: "InBodyMeasurements",
                column: "ReceptionistID");

            migrationBuilder.CreateIndex(
                name: "IX_InBodyMeasurements_ReceptionistUserId",
                table: "InBodyMeasurements",
                column: "ReceptionistUserId");

            migrationBuilder.CreateIndex(
                name: "IX_InBodyMeasurements_UserID",
                table: "InBodyMeasurements",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceLogs_EquipmentID",
                table: "MaintenanceLogs",
                column: "EquipmentID");

            migrationBuilder.CreateIndex(
                name: "IX_MealIngredients_IngredientId",
                table: "MealIngredients",
                column: "IngredientId");

            migrationBuilder.CreateIndex(
                name: "IX_MealIngredients_MealId",
                table: "MealIngredients",
                column: "MealId");

            migrationBuilder.CreateIndex(
                name: "IX_MealIngredients_ModifiedByCoachID",
                table: "MealIngredients",
                column: "ModifiedByCoachID");

            migrationBuilder.CreateIndex(
                name: "IX_Meals_AddedByCoachID",
                table: "Meals",
                column: "AddedByCoachID");

            migrationBuilder.CreateIndex(
                name: "IX_Meals_NutritionPlanId",
                table: "Meals",
                column: "NutritionPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberCoachSubscriptions_CoachID",
                table: "MemberCoachSubscriptions",
                column: "CoachID");

            migrationBuilder.CreateIndex(
                name: "IX_MemberCoachSubscriptions_CoachUserId",
                table: "MemberCoachSubscriptions",
                column: "CoachUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberCoachSubscriptions_UserID",
                table: "MemberCoachSubscriptions",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_MemberWorkoutPlans_AssignedByCoachID",
                table: "MemberWorkoutPlans",
                column: "AssignedByCoachID");

            migrationBuilder.CreateIndex(
                name: "IX_MemberWorkoutPlans_CoachUserId",
                table: "MemberWorkoutPlans",
                column: "CoachUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MemberWorkoutPlans_GeneratedByAIAI_ID",
                table: "MemberWorkoutPlans",
                column: "GeneratedByAIAI_ID");

            migrationBuilder.CreateIndex(
                name: "IX_MemberWorkoutPlans_TemplateID",
                table: "MemberWorkoutPlans",
                column: "TemplateID");

            migrationBuilder.CreateIndex(
                name: "IX_MemberWorkoutPlans_UserID",
                table: "MemberWorkoutPlans",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserID",
                table: "Notifications",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_NutritionPlans_AIAgentAI_ID",
                table: "NutritionPlans",
                column: "AIAgentAI_ID");

            migrationBuilder.CreateIndex(
                name: "IX_NutritionPlans_ReviewedByCoachID",
                table: "NutritionPlans",
                column: "ReviewedByCoachID");

            migrationBuilder.CreateIndex(
                name: "IX_NutritionPlans_UserID",
                table: "NutritionPlans",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_UserID",
                table: "Payments",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_RecommendedExercises_AddedByCoachID",
                table: "RecommendedExercises",
                column: "AddedByCoachID");

            migrationBuilder.CreateIndex(
                name: "IX_RecommendedExercises_ExerciseId",
                table: "RecommendedExercises",
                column: "ExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_RecommendedExercises_WorkoutRecommendationId",
                table: "RecommendedExercises",
                column: "WorkoutRecommendationId");

            migrationBuilder.CreateIndex(
                name: "IX_SafetyIncidents_EquipmentID",
                table: "SafetyIncidents",
                column: "EquipmentID");

            migrationBuilder.CreateIndex(
                name: "IX_SafetyIncidents_UserID",
                table: "SafetyIncidents",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_TemplateExercises_ExerciseId",
                table: "TemplateExercises",
                column: "ExerciseId");

            migrationBuilder.CreateIndex(
                name: "IX_TemplateExercises_TemplateID",
                table: "TemplateExercises",
                column: "TemplateID");

            migrationBuilder.CreateIndex(
                name: "IX_TokenTransactions_ReceptionistID",
                table: "TokenTransactions",
                column: "ReceptionistID");

            migrationBuilder.CreateIndex(
                name: "IX_TokenTransactions_ReceptionistUserId",
                table: "TokenTransactions",
                column: "ReceptionistUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TokenTransactions_UserID",
                table: "TokenTransactions",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_Users_AdminUserId",
                table: "Users",
                column: "AdminUserId");

            migrationBuilder.CreateIndex(
                name: "IX_WearableDevices_UserID",
                table: "WearableDevices",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutPlanTemplates_CoachID",
                table: "WorkoutPlanTemplates",
                column: "CoachID");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutRecommendations_AIAgentAI_ID",
                table: "WorkoutRecommendations",
                column: "AIAgentAI_ID");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutRecommendations_ReviewedByCoachID",
                table: "WorkoutRecommendations",
                column: "ReviewedByCoachID");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutRecommendations_UserID",
                table: "WorkoutRecommendations",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutSessions_CoachID",
                table: "WorkoutSessions",
                column: "CoachID");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutSessions_CoachUserId",
                table: "WorkoutSessions",
                column: "CoachUserId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutSessions_EquipmentID",
                table: "WorkoutSessions",
                column: "EquipmentID");

            migrationBuilder.CreateIndex(
                name: "IX_WorkoutSessions_UserID",
                table: "WorkoutSessions",
                column: "UserID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AIQueryLogs");

            migrationBuilder.DropTable(
                name: "Bookings");

            migrationBuilder.DropTable(
                name: "ChurnPredictions");

            migrationBuilder.DropTable(
                name: "CoachReviews");

            migrationBuilder.DropTable(
                name: "EquipmentDemandPredictions");

            migrationBuilder.DropTable(
                name: "ExerciseFormAnalyses");

            migrationBuilder.DropTable(
                name: "GymOccupancies");

            migrationBuilder.DropTable(
                name: "HeartRateData");

            migrationBuilder.DropTable(
                name: "InBodyMeasurements");

            migrationBuilder.DropTable(
                name: "MaintenanceLogs");

            migrationBuilder.DropTable(
                name: "MealIngredients");

            migrationBuilder.DropTable(
                name: "MemberCoachSubscriptions");

            migrationBuilder.DropTable(
                name: "MemberWorkoutPlans");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "RecommendedExercises");

            migrationBuilder.DropTable(
                name: "SafetyIncidents");

            migrationBuilder.DropTable(
                name: "SubscriptionPlans");

            migrationBuilder.DropTable(
                name: "TemplateExercises");

            migrationBuilder.DropTable(
                name: "TokenTransactions");

            migrationBuilder.DropTable(
                name: "WearableDevices");

            migrationBuilder.DropTable(
                name: "WorkoutSessions");

            migrationBuilder.DropTable(
                name: "Ingredients");

            migrationBuilder.DropTable(
                name: "Meals");

            migrationBuilder.DropTable(
                name: "WorkoutRecommendations");

            migrationBuilder.DropTable(
                name: "Exercises");

            migrationBuilder.DropTable(
                name: "WorkoutPlanTemplates");

            migrationBuilder.DropTable(
                name: "Equipments");

            migrationBuilder.DropTable(
                name: "NutritionPlans");

            migrationBuilder.DropTable(
                name: "AI_Agents");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
