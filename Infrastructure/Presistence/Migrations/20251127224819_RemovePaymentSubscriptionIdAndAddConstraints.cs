using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class RemovePaymentSubscriptionIdAndAddConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_user_subscriptions_payments_PaymentId",
                table: "user_subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_user_subscriptions_PaymentId",
                table: "user_subscriptions");

            migrationBuilder.DropColumn(
                name: "SubscriptionId",
                table: "payments");

            migrationBuilder.CreateIndex(
                name: "IX_user_subscriptions_PaymentId",
                table: "user_subscriptions",
                column: "PaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_member_profiles_SubscriptionPlanId",
                table: "member_profiles",
                column: "SubscriptionPlanId");

            migrationBuilder.AddForeignKey(
                name: "FK_member_profiles_subscription_plans_SubscriptionPlanId",
                table: "member_profiles",
                column: "SubscriptionPlanId",
                principalTable: "subscription_plans",
                principalColumn: "PlanId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_user_subscriptions_payments_PaymentId",
                table: "user_subscriptions",
                column: "PaymentId",
                principalTable: "payments",
                principalColumn: "PaymentId",
                onDelete: ReferentialAction.Restrict);

            // Add CHECK constraints for business logic enforcement
            // Note: These constraints should already exist if DatabaseMigration_SchemaFix_v1.0.0.sql was run
            // This is included for completeness if applying migrations to a fresh database
            
            migrationBuilder.Sql(@"
                -- Bookings: Equipment XOR Coach (never both, never neither)
                DO $$ BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'chk_booking_xor'
                    ) THEN
                        ALTER TABLE bookings 
                        ADD CONSTRAINT chk_booking_xor 
                        CHECK (
                          (""EquipmentId"" IS NOT NULL AND ""CoachId"" IS NULL) OR 
                          (""EquipmentId"" IS NULL AND ""CoachId"" IS NOT NULL)
                        );
                    END IF;
                END $$;
            ");

            migrationBuilder.Sql(@"
                -- Bookings: BookingType must match FK reference
                DO $$ BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'chk_booking_type_match'
                    ) THEN
                        ALTER TABLE bookings 
                        ADD CONSTRAINT chk_booking_type_match 
                        CHECK (
                          (""BookingType"" = 'Equipment' AND ""EquipmentId"" IS NOT NULL) OR
                          (""BookingType"" = 'Session' AND ""CoachId"" IS NOT NULL)
                        );
                    END IF;
                END $$;
            ");

            migrationBuilder.Sql(@"
                -- AI Programs: Workout XOR Nutrition (never both, never neither)
                DO $$ BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'chk_ai_program_xor'
                    ) THEN
                        ALTER TABLE ai_program_generations
                        ADD CONSTRAINT chk_ai_program_xor
                        CHECK (
                          (""WorkoutPlanId"" IS NOT NULL AND ""NutritionPlanId"" IS NULL) OR
                          (""WorkoutPlanId"" IS NULL AND ""NutritionPlanId"" IS NOT NULL)
                        );
                    END IF;
                END $$;
            ");

            migrationBuilder.Sql(@"
                -- AI Programs: ProgramType must match plan reference
                DO $$ BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'chk_program_type_match'
                    ) THEN
                        ALTER TABLE ai_program_generations
                        ADD CONSTRAINT chk_program_type_match
                        CHECK (
                          (""ProgramType"" = 'Workout' AND ""WorkoutPlanId"" IS NOT NULL) OR
                          (""ProgramType"" = 'Nutrition' AND ""NutritionPlanId"" IS NOT NULL)
                        );
                    END IF;
                END $$;
            ");

            migrationBuilder.Sql(@"
                -- User Subscriptions: Must have PaymentId (payment happens first)
                DO $$ BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = 'chk_subscription_has_payment'
                    ) THEN
                        ALTER TABLE user_subscriptions
                        ADD CONSTRAINT chk_subscription_has_payment
                        CHECK (""PaymentId"" IS NOT NULL);
                    END IF;
                END $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_member_profiles_subscription_plans_SubscriptionPlanId",
                table: "member_profiles");

            migrationBuilder.DropForeignKey(
                name: "FK_user_subscriptions_payments_PaymentId",
                table: "user_subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_user_subscriptions_PaymentId",
                table: "user_subscriptions");

            migrationBuilder.DropIndex(
                name: "IX_member_profiles_SubscriptionPlanId",
                table: "member_profiles");

            migrationBuilder.AddColumn<int>(
                name: "SubscriptionId",
                table: "payments",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_subscriptions_PaymentId",
                table: "user_subscriptions",
                column: "PaymentId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_user_subscriptions_payments_PaymentId",
                table: "user_subscriptions",
                column: "PaymentId",
                principalTable: "payments",
                principalColumn: "PaymentId",
                onDelete: ReferentialAction.SetNull);

            // Remove CHECK constraints on rollback
            migrationBuilder.Sql(@"
                ALTER TABLE bookings DROP CONSTRAINT IF EXISTS chk_booking_xor;
                ALTER TABLE bookings DROP CONSTRAINT IF EXISTS chk_booking_type_match;
                ALTER TABLE ai_program_generations DROP CONSTRAINT IF EXISTS chk_ai_program_xor;
                ALTER TABLE ai_program_generations DROP CONSTRAINT IF EXISTS chk_program_type_match;
                ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS chk_subscription_has_payment;
            ");
        }
    }
}
