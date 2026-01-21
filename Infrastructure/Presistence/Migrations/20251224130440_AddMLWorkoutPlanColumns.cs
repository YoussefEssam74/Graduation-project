using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMLWorkoutPlanColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DaysPerWeek",
                table: "workout_plans",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Goal",
                table: "workout_plans",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MlPlanJson",
                table: "workout_plans",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SplitType",
                table: "workout_plans",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DaysPerWeek",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "Goal",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "MlPlanJson",
                table: "workout_plans");

            migrationBuilder.DropColumn(
                name: "SplitType",
                table: "workout_plans");
        }
    }
}
