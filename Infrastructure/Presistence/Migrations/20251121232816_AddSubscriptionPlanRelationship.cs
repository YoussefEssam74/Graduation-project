using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptionPlanRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SubscriptionPlan",
                table: "Users");

            migrationBuilder.AddColumn<int>(
                name: "SubscriptionPlanID",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_SubscriptionPlanID",
                table: "Users",
                column: "SubscriptionPlanID");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_SubscriptionPlans_SubscriptionPlanID",
                table: "Users",
                column: "SubscriptionPlanID",
                principalTable: "SubscriptionPlans",
                principalColumn: "PlanID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_SubscriptionPlans_SubscriptionPlanID",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_SubscriptionPlanID",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SubscriptionPlanID",
                table: "Users");

            migrationBuilder.AddColumn<string>(
                name: "SubscriptionPlan",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
