using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWgerExerciseModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExerciseCategoryId",
                table: "exercises",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "exercises",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VariationId",
                table: "exercises",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WgerUuid",
                table: "exercises",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WgerEquipmentId",
                table: "equipment",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "exercise_categories",
                columns: table => new
                {
                    CategoryId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exercise_categories", x => x.CategoryId);
                });

            migrationBuilder.CreateTable(
                name: "exercise_equipments",
                columns: table => new
                {
                    ExerciseId = table.Column<int>(type: "integer", nullable: false),
                    EquipmentId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exercise_equipments", x => new { x.ExerciseId, x.EquipmentId });
                    table.ForeignKey(
                        name: "FK_exercise_equipments_equipment_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "equipment",
                        principalColumn: "EquipmentId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_exercise_equipments_exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "exercises",
                        principalColumn: "ExerciseId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "muscles",
                columns: table => new
                {
                    MuscleId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    NameEn = table.Column<string>(type: "text", nullable: true),
                    IsFront = table.Column<bool>(type: "boolean", nullable: false),
                    ImageUrlMain = table.Column<string>(type: "text", nullable: true),
                    ImageUrlSecondary = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_muscles", x => x.MuscleId);
                });

            migrationBuilder.CreateTable(
                name: "exercise_muscles",
                columns: table => new
                {
                    ExerciseId = table.Column<int>(type: "integer", nullable: false),
                    MuscleId = table.Column<int>(type: "integer", nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_exercise_muscles", x => new { x.ExerciseId, x.MuscleId });
                    table.ForeignKey(
                        name: "FK_exercise_muscles_exercises_ExerciseId",
                        column: x => x.ExerciseId,
                        principalTable: "exercises",
                        principalColumn: "ExerciseId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_exercise_muscles_muscles_MuscleId",
                        column: x => x.MuscleId,
                        principalTable: "muscles",
                        principalColumn: "MuscleId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_exercises_ExerciseCategoryId",
                table: "exercises",
                column: "ExerciseCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_exercises_WgerUuid",
                table: "exercises",
                column: "WgerUuid");

            migrationBuilder.CreateIndex(
                name: "IX_exercise_categories_Name",
                table: "exercise_categories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_exercise_equipments_EquipmentId",
                table: "exercise_equipments",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_exercise_muscles_MuscleId",
                table: "exercise_muscles",
                column: "MuscleId");

            migrationBuilder.CreateIndex(
                name: "IX_muscles_Name",
                table: "muscles",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_exercises_exercise_categories_ExerciseCategoryId",
                table: "exercises",
                column: "ExerciseCategoryId",
                principalTable: "exercise_categories",
                principalColumn: "CategoryId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_exercises_exercise_categories_ExerciseCategoryId",
                table: "exercises");

            migrationBuilder.DropTable(
                name: "exercise_categories");

            migrationBuilder.DropTable(
                name: "exercise_equipments");

            migrationBuilder.DropTable(
                name: "exercise_muscles");

            migrationBuilder.DropTable(
                name: "muscles");

            migrationBuilder.DropIndex(
                name: "IX_exercises_ExerciseCategoryId",
                table: "exercises");

            migrationBuilder.DropIndex(
                name: "IX_exercises_WgerUuid",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "ExerciseCategoryId",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "VariationId",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "WgerUuid",
                table: "exercises");

            migrationBuilder.DropColumn(
                name: "WgerEquipmentId",
                table: "equipment");
        }
    }
}
