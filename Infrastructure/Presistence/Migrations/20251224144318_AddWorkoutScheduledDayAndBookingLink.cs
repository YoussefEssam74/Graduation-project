using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkoutScheduledDayAndBookingLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeSpan>(
                name: "PreferredWorkoutTime",
                table: "workout_plans",
                type: "interval",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WorkoutScheduledDayId",
                table: "bookings",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "workout_scheduled_days",
                columns: table => new
                {
                    ScheduledDayId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WorkoutPlanId = table.Column<int>(type: "integer", nullable: false),
                    DayNumber = table.Column<int>(type: "integer", nullable: false),
                    WeekNumber = table.Column<int>(type: "integer", nullable: false),
                    ScheduledDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartTime = table.Column<TimeSpan>(type: "interval", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "interval", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workout_scheduled_days", x => x.ScheduledDayId);
                    table.ForeignKey(
                        name: "FK_workout_scheduled_days_workout_plans_WorkoutPlanId",
                        column: x => x.WorkoutPlanId,
                        principalTable: "workout_plans",
                        principalColumn: "PlanId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_bookings_WorkoutScheduledDayId",
                table: "bookings",
                column: "WorkoutScheduledDayId");

            migrationBuilder.CreateIndex(
                name: "IX_workout_scheduled_days_ScheduledDate",
                table: "workout_scheduled_days",
                column: "ScheduledDate");

            migrationBuilder.CreateIndex(
                name: "IX_workout_scheduled_days_WorkoutPlanId_ScheduledDate",
                table: "workout_scheduled_days",
                columns: new[] { "WorkoutPlanId", "ScheduledDate" });

            migrationBuilder.AddForeignKey(
                name: "FK_bookings_workout_scheduled_days_WorkoutScheduledDayId",
                table: "bookings",
                column: "WorkoutScheduledDayId",
                principalTable: "workout_scheduled_days",
                principalColumn: "ScheduledDayId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_bookings_workout_scheduled_days_WorkoutScheduledDayId",
                table: "bookings");

            migrationBuilder.DropTable(
                name: "workout_scheduled_days");

            migrationBuilder.DropIndex(
                name: "IX_bookings_WorkoutScheduledDayId",
                table: "bookings");

            migrationBuilder.DropColumn(
                name: "PreferredWorkoutTime",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "WorkoutScheduledDayId",
                table: "bookings");
        }
    }
}
