using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityFeedLikeComment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ActivityFeedComments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ActivityId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityFeedComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityFeedComments_activity_feeds_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "activity_feeds",
                        principalColumn: "ActivityId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActivityFeedComments_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ActivityFeedLikes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ActivityId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityFeedLikes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ActivityFeedLikes_activity_feeds_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "activity_feeds",
                        principalColumn: "ActivityId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActivityFeedLikes_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActivityFeedComments_ActivityId",
                table: "ActivityFeedComments",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityFeedComments_UserId",
                table: "ActivityFeedComments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityFeedLikes_ActivityId",
                table: "ActivityFeedLikes",
                column: "ActivityId");

            migrationBuilder.CreateIndex(
                name: "IX_ActivityFeedLikes_UserId",
                table: "ActivityFeedLikes",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivityFeedComments");

            migrationBuilder.DropTable(
                name: "ActivityFeedLikes");
        }
    }
}
