using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class FixMaxFreezeDaysColumnCase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The column was created without quotes, resulting in lowercase "maxfreezedays".
            // Rename it to the quoted PascalCase name EF Core expects.
            migrationBuilder.Sql("ALTER TABLE subscription_plans RENAME COLUMN maxfreezedays TO \"MaxFreezeDays\"");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE subscription_plans RENAME COLUMN \"MaxFreezeDays\" TO maxfreezedays");
        }
    }
}
