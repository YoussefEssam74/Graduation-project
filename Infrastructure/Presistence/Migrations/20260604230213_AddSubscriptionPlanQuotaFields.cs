using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptionPlanQuotaFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExtraNutritionPlanTokenCost",
                table: "subscription_plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ExtraWorkoutPlanTokenCost",
                table: "subscription_plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FreeNutritionPlans",
                table: "subscription_plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FreeWorkoutPlans",
                table: "subscription_plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExtraNutritionPlanTokenCost",
                table: "subscription_plans");

            migrationBuilder.DropColumn(
                name: "ExtraWorkoutPlanTokenCost",
                table: "subscription_plans");

            migrationBuilder.DropColumn(
                name: "FreeNutritionPlans",
                table: "subscription_plans");

            migrationBuilder.DropColumn(
                name: "FreeWorkoutPlans",
                table: "subscription_plans");
        }
    }
}
