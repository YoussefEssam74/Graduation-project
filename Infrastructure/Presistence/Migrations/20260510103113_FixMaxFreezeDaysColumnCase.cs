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
            // Only rename if the column exists in lowercase (legacy databases).
            // Fresh databases created by EF Core already have the correct quoted name.
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'maxfreezedays'
    ) THEN
        ALTER TABLE subscription_plans RENAME COLUMN maxfreezedays TO ""MaxFreezeDays"";
    END IF;
END $$;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'subscription_plans' AND column_name = 'MaxFreezeDays'
    ) THEN
        ALTER TABLE subscription_plans RENAME COLUMN ""MaxFreezeDays"" TO maxfreezedays;
    END IF;
END $$;");
        }
    }
}
