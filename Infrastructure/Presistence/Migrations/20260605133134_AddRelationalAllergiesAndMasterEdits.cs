using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Presistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRelationalAllergiesAndMasterEdits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Ensure allergen columns and FoodRole exist on ingredients
            migrationBuilder.Sql("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS \"ContainsDairy\" BOOLEAN DEFAULT FALSE;");
            migrationBuilder.Sql("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS \"ContainsEggs\" BOOLEAN DEFAULT FALSE;");
            migrationBuilder.Sql("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS \"ContainsFish\" BOOLEAN DEFAULT FALSE;");
            migrationBuilder.Sql("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS \"ContainsGluten\" BOOLEAN DEFAULT FALSE;");
            migrationBuilder.Sql("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS \"ContainsNuts\" BOOLEAN DEFAULT FALSE;");
            migrationBuilder.Sql("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS \"ContainsSoy\" BOOLEAN DEFAULT FALSE;");
            migrationBuilder.Sql("ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS \"FoodRole\" VARCHAR(50);");

            // 2. Ensure disease rules tables exist
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS disease_rules (
                    disease_rule_id SERIAL PRIMARY KEY,
                    disease_key VARCHAR(100) UNIQUE NOT NULL,
                    disease_name VARCHAR(150) NOT NULL,
                    min_kcal INT,
                    max_kcal INT,
                    median_kcal INT,
                    calorie_source VARCHAR(250),
                    calorie_sample_size INT,
                    protein_pct DECIMAL(5,2),
                    carbs_pct DECIMAL(5,2),
                    fat_pct DECIMAL(5,2),
                    protein_g_avg DECIMAL(6,2),
                    carbs_g_avg DECIMAL(6,2),
                    fat_g_avg DECIMAL(6,2),
                    macro_source VARCHAR(250),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            ");

            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS disease_avoided_ingredients (
                    disease_rule_id INT REFERENCES disease_rules(disease_rule_id) ON DELETE CASCADE,
                    ingredient_id INT REFERENCES ingredients(""IngredientId"") ON DELETE CASCADE,
                    PRIMARY KEY (disease_rule_id, ingredient_id)
                );
            ");

            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS disease_recommended_ingredients (
                    disease_rule_id INT REFERENCES disease_rules(disease_rule_id) ON DELETE CASCADE,
                    ingredient_id INT REFERENCES ingredients(""IngredientId"") ON DELETE CASCADE,
                    PRIMARY KEY (disease_rule_id, ingredient_id)
                );
            ");

            // 3. Create dynamic allergies tables
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS allergies (
                    ""AllergyId"" SERIAL PRIMARY KEY,
                    ""Name"" VARCHAR(255) UNIQUE NOT NULL,
                    ""Description"" TEXT
                );
            ");

            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ingredient_allergies (
                    ""IngredientId"" INT REFERENCES ingredients(""IngredientId"") ON DELETE CASCADE,
                    ""AllergyId"" INT REFERENCES allergies(""AllergyId"") ON DELETE CASCADE,
                    PRIMARY KEY (""IngredientId"", ""AllergyId"")
                );
            ");

            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS member_allergies (
                    ""MemberProfileId"" INT REFERENCES member_profiles(""Id"") ON DELETE CASCADE,
                    ""AllergyId"" INT REFERENCES allergies(""AllergyId"") ON DELETE CASCADE,
                    PRIMARY KEY (""MemberProfileId"", ""AllergyId"")
                );
            ");

            // 4. Create Indexes
            migrationBuilder.Sql("CREATE UNIQUE INDEX IF NOT EXISTS \"IX_allergies_Name\" ON allergies (\"Name\");");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_ingredient_allergies_AllergyId\" ON ingredient_allergies (\"AllergyId\");");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS \"IX_member_allergies_AllergyId\" ON member_allergies (\"AllergyId\");");

            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name = 'disease_avoided_ingredients' 
                        AND column_name = 'ingredient_id'
                    ) THEN
                        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IX_disease_avoided_ingredients_ingredient_id') THEN
                            CREATE INDEX ""IX_disease_avoided_ingredients_ingredient_id"" ON disease_avoided_ingredients (ingredient_id);
                        END IF;
                    ELSE
                        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IX_disease_avoided_ingredients_ingredient_id') THEN
                            CREATE INDEX ""IX_disease_avoided_ingredients_ingredient_id"" ON disease_avoided_ingredients (""IngredientId"");
                        END IF;
                    END IF;
                END $$;
            ");

            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name = 'disease_recommended_ingredients' 
                        AND column_name = 'ingredient_id'
                    ) THEN
                        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IX_disease_recommended_ingredients_ingredient_id') THEN
                            CREATE INDEX ""IX_disease_recommended_ingredients_ingredient_id"" ON disease_recommended_ingredients (ingredient_id);
                        END IF;
                    ELSE
                        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IX_disease_recommended_ingredients_ingredient_id') THEN
                            CREATE INDEX ""IX_disease_recommended_ingredients_ingredient_id"" ON disease_recommended_ingredients (""IngredientId"");
                        END IF;
                    END IF;
                END $$;
            ");

            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name = 'disease_rules' 
                        AND column_name = 'disease_key'
                    ) THEN
                        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IX_disease_rules_disease_key') THEN
                            CREATE UNIQUE INDEX ""IX_disease_rules_disease_key"" ON disease_rules (disease_key);
                        END IF;
                    ELSE
                        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IX_disease_rules_disease_key') THEN
                            CREATE UNIQUE INDEX ""IX_disease_rules_disease_key"" ON disease_rules (""DiseaseKey"");
                        END IF;
                    END IF;
                END $$;
            ");

            // 5. Seed standard allergies and migrate existing boolean flags
            migrationBuilder.Sql(@"
                INSERT INTO allergies (""Name"") VALUES 
                ('Dairy'), ('Gluten'), ('Nuts'), ('Soy'), ('Eggs'), ('Fish'), ('Shellfish'), ('Sesame')
                ON CONFLICT (""Name"") DO NOTHING;

                -- Populate ingredient_allergies from old boolean columns
                INSERT INTO ingredient_allergies (""IngredientId"", ""AllergyId"")
                SELECT i.""IngredientId"", a.""AllergyId""
                FROM ingredients i
                JOIN allergies a ON LOWER(a.""Name"") = 'dairy'
                WHERE i.""ContainsDairy"" = TRUE
                ON CONFLICT DO NOTHING;

                INSERT INTO ingredient_allergies (""IngredientId"", ""AllergyId"")
                SELECT i.""IngredientId"", a.""AllergyId""
                FROM ingredients i
                JOIN allergies a ON LOWER(a.""Name"") = 'gluten'
                WHERE i.""ContainsGluten"" = TRUE
                ON CONFLICT DO NOTHING;

                INSERT INTO ingredient_allergies (""IngredientId"", ""AllergyId"")
                SELECT i.""IngredientId"", a.""AllergyId""
                FROM ingredients i
                JOIN allergies a ON LOWER(a.""Name"") = 'nuts'
                WHERE i.""ContainsNuts"" = TRUE
                ON CONFLICT DO NOTHING;

                INSERT INTO ingredient_allergies (""IngredientId"", ""AllergyId"")
                SELECT i.""IngredientId"", a.""AllergyId""
                FROM ingredients i
                JOIN allergies a ON LOWER(a.""Name"") = 'soy'
                WHERE i.""ContainsSoy"" = TRUE
                ON CONFLICT DO NOTHING;

                INSERT INTO ingredient_allergies (""IngredientId"", ""AllergyId"")
                SELECT i.""IngredientId"", a.""AllergyId""
                FROM ingredients i
                JOIN allergies a ON LOWER(a.""Name"") = 'eggs'
                WHERE i.""ContainsEggs"" = TRUE
                ON CONFLICT DO NOTHING;

                INSERT INTO ingredient_allergies (""IngredientId"", ""AllergyId"")
                SELECT i.""IngredientId"", a.""AllergyId""
                FROM ingredients i
                JOIN allergies a ON LOWER(a.""Name"") = 'fish'
                WHERE i.""ContainsFish"" = TRUE
                ON CONFLICT DO NOTHING;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ingredient_allergies");

            migrationBuilder.DropTable(
                name: "member_allergies");

            migrationBuilder.DropTable(
                name: "allergies");
        }
    }
}
