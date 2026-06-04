using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCouponTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:booking_status", "pending,confirmed,cancelled,completed,no_show")
                .Annotation("Npgsql:Enum:discount_type", "percentage,fixed_amount")
                .Annotation("Npgsql:Enum:equipment_status", "available,in_use,under_maintenance,out_of_service,reserved")
                .Annotation("Npgsql:Enum:gender_type", "male,female")
                .Annotation("Npgsql:Enum:notification_type", "booking_reminder,maintenance_alert,payment_due,workout_complete,milestone_achieved,coach_message,system_alert,promotional_offer")
                .Annotation("Npgsql:Enum:payment_status", "pending,completed,failed,refunded,cancelled")
                .Annotation("Npgsql:Enum:subscription_status", "active,expired,cancelled,suspended,pending_payment")
                .Annotation("Npgsql:Enum:transaction_type", "purchase,deduction,refund,bonus,earned")
                .OldAnnotation("Npgsql:Enum:booking_status", "pending,confirmed,cancelled,completed,no_show")
                .OldAnnotation("Npgsql:Enum:equipment_status", "available,in_use,under_maintenance,out_of_service,reserved")
                .OldAnnotation("Npgsql:Enum:gender_type", "male,female")
                .OldAnnotation("Npgsql:Enum:notification_type", "booking_reminder,maintenance_alert,payment_due,workout_complete,milestone_achieved,coach_message,system_alert,promotional_offer")
                .OldAnnotation("Npgsql:Enum:payment_status", "pending,completed,failed,refunded,cancelled")
                .OldAnnotation("Npgsql:Enum:subscription_status", "active,expired,cancelled,suspended,pending_payment")
                .OldAnnotation("Npgsql:Enum:transaction_type", "purchase,deduction,refund,bonus,earned");

            migrationBuilder.CreateTable(
                name: "coupons",
                columns: table => new
                {
                    CouponId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DiscountType = table.Column<int>(type: "integer", nullable: false),
                    DiscountValue = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    MaxUsage = table.Column<int>(type: "integer", nullable: true),
                    CurrentUsage = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_coupons", x => x.CouponId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_coupons_Code",
                table: "coupons",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "coupons");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:booking_status", "pending,confirmed,cancelled,completed,no_show")
                .Annotation("Npgsql:Enum:equipment_status", "available,in_use,under_maintenance,out_of_service,reserved")
                .Annotation("Npgsql:Enum:gender_type", "male,female")
                .Annotation("Npgsql:Enum:notification_type", "booking_reminder,maintenance_alert,payment_due,workout_complete,milestone_achieved,coach_message,system_alert,promotional_offer")
                .Annotation("Npgsql:Enum:payment_status", "pending,completed,failed,refunded,cancelled")
                .Annotation("Npgsql:Enum:subscription_status", "active,expired,cancelled,suspended,pending_payment")
                .Annotation("Npgsql:Enum:transaction_type", "purchase,deduction,refund,bonus,earned")
                .OldAnnotation("Npgsql:Enum:booking_status", "pending,confirmed,cancelled,completed,no_show")
                .OldAnnotation("Npgsql:Enum:discount_type", "percentage,fixed_amount")
                .OldAnnotation("Npgsql:Enum:equipment_status", "available,in_use,under_maintenance,out_of_service,reserved")
                .OldAnnotation("Npgsql:Enum:gender_type", "male,female")
                .OldAnnotation("Npgsql:Enum:notification_type", "booking_reminder,maintenance_alert,payment_due,workout_complete,milestone_achieved,coach_message,system_alert,promotional_offer")
                .OldAnnotation("Npgsql:Enum:payment_status", "pending,completed,failed,refunded,cancelled")
                .OldAnnotation("Npgsql:Enum:subscription_status", "active,expired,cancelled,suspended,pending_payment")
                .OldAnnotation("Npgsql:Enum:transaction_type", "purchase,deduction,refund,bonus,earned");
        }
    }
}
