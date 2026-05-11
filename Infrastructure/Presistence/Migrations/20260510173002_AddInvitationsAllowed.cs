using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInvitationsAllowed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "InvitationsAllowed",
                table: "subscription_plans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "invitations",
                columns: table => new
                {
                    InvitationId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    UsedByUserId = table.Column<int>(type: "integer", nullable: true),
                    SubscriptionPlanId = table.Column<int>(type: "integer", nullable: true),
                    IsUsed = table.Column<bool>(type: "boolean", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_invitations", x => x.InvitationId);
                    table.ForeignKey(
                        name: "FK_invitations_subscription_plans_SubscriptionPlanId",
                        column: x => x.SubscriptionPlanId,
                        principalTable: "subscription_plans",
                        principalColumn: "PlanId",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_invitations_users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_invitations_users_UsedByUserId",
                        column: x => x.UsedByUserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_invitations_Code",
                table: "invitations",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_invitations_CreatedByUserId",
                table: "invitations",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_invitations_IsUsed_ExpiresAt",
                table: "invitations",
                columns: new[] { "IsUsed", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_invitations_SubscriptionPlanId",
                table: "invitations",
                column: "SubscriptionPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_invitations_UsedByUserId",
                table: "invitations",
                column: "UsedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "invitations");

            migrationBuilder.DropColumn(
                name: "InvitationsAllowed",
                table: "subscription_plans");
        }
    }
}
