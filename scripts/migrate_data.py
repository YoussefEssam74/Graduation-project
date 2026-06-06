import os
import psycopg2
from psycopg2.extras import execute_values
from psycopg2.extensions import register_adapter
from psycopg2.extras import Json
import sys

# Register adapter to automatically handle dict to json/jsonb conversion
register_adapter(dict, Json)

# Connection configurations
OLD_DB = {
    "host": "ep-purple-sun-ali1v059.c-3.eu-central-1.aws.neon.tech",
    "dbname": "neondb",
    "user": "neondb_owner",
    "password": "npg_JpaFCdHcU20O",
    "sslmode": "require"
}

NEW_DB = {
    "host": "ep-fancy-sound-a2toab50.eu-central-1.aws.neon.tech",
    "dbname": "neondb",
    "user": "neondb_owner",
    "password": "npg_C3Qm6VqSjUMu",
    "sslmode": "require"
}

# Order of tables to satisfy foreign key constraints (parents first, children last)
ORDERED_TABLES = [
    # Group 1: Independent parent tables (no foreign keys)
    "subscription_plans",
    "token_packages",
    "progress_milestones",
    "equipment_categories",
    "ingredients",
    "achievements",
    "ai_model_versions",
    "coupons",
    "allergies",
    "disease_rules",
    "vector_embeddings",
    
    # Group 2: User table (no external FKs)
    "users",
    
    # Group 3: Tables depending directly on users or basic parent tables
    "equipment",                       # CategoryId -> equipment_categories
    "ingredient_allergies",            # IngredientId -> ingredients, AllergyId -> allergies
    "coach_profiles",                  # UserId -> users
    "member_profiles",                 # UserId -> users, SubscriptionPlanId -> subscription_plans
    "activity_feeds",                  # UserId -> users
    "ai_chat_logs",                    # UserId -> users
    "ai_workflow_jobs",                # UserId -> users
    "audit_logs",                      # UserId -> users
    "chat_messages",                   # SenderId -> users, ReceiverId -> users
    "notifications",                   # UserId -> users
    "token_transactions",              # UserId -> users
    "user_milestones",                 # UserId -> users, MilestoneId -> progress_milestones
    "user_achievements",               # UserId -> users, AchievementId -> achievements
    "user_feature_snapshots",          # UserId -> users
    "muscle_development_scans",        # UserId -> users
    "disease_avoided_ingredients",      # disease_rule_id -> disease_rules, ingredient_id -> ingredients
    "disease_recommended_ingredients",  # disease_rule_id -> disease_rules, ingredient_id -> ingredients
    "user_ai_workout_plans",           # UserId -> users
    
    # Group 4: Tables depending on Group 3 tables or multiple parents
    "member_allergies",                # MemberProfileId -> member_profiles, AllergyId -> allergies
    "inbody_measurements",             # UserId -> users, MeasuredBy -> users
    "fitness_knowledge",               # CreatedByUserId -> users, ApprovedByUserId -> users
    "payments",                        # UserId -> users, PackageId -> token_packages
    "bookings",                        # UserId -> users, CoachId -> coach_profiles, EquipmentId -> equipment, ParentCoachBookingId -> bookings
    "exercises",                       # CreatedByCoachId -> coach_profiles, EquipmentId -> equipment
    "workout_templates",               # CreatedByCoachId -> coach_profiles
    "invitations",                     # CreatedByUserId -> users, UsedByUserId -> users, SubscriptionPlanId -> subscription_plans
    "user_ai_workout_plan_days",       # PlanId -> user_ai_workout_plans
    
    # Group 5: Tables depending on Group 4 tables
    "user_subscriptions",              # UserId -> users, PlanId -> subscription_plans, PaymentId -> payments
    "coach_reviews",                   # CoachId -> coach_profiles, UserId -> users, BookingId -> bookings
    "workout_plans",                   # UserId -> users, GeneratedByCoachId -> coach_profiles, ApprovedBy -> coach_profiles
    "nutrition_plans",                 # UserId -> users, GeneratedByCoachId -> coach_profiles, ApprovedByCoachId -> coach_profiles
    "workout_template_exercises",      # TemplateId -> workout_templates, ExerciseId -> exercises
    "user_ai_workout_plan_exercises",  # PlanDayId -> user_ai_workout_plan_days, ExerciseId -> exercises, EquipmentId -> equipment
    "user_strength_profiles",          # UserId -> users, ExerciseId -> exercises
    
    # Group 6: Tables depending on Group 5 tables
    "workout_logs",                    # UserId -> users, PlanId -> workout_plans
    "meals",                           # NutritionPlanId -> nutrition_plans, CreatedByCoachId -> coach_profiles
    "ai_program_generations",          # UserId -> users, NutritionPlanId -> nutrition_plans, WorkoutPlanId -> workout_plans
    "workout_plan_exercises",          # WorkoutPlanId -> workout_plans, ExerciseId -> exercises
    
    # Group 7: Tables depending on Group 6 tables
    "workout_feedbacks",               # UserId -> users, WorkoutLogId -> workout_logs, WorkoutPlanId -> workout_plans
    "ActivityFeedComments",            # ActivityId -> activity_feeds, UserId -> users
    "ActivityFeedLikes",               # ActivityId -> activity_feeds, UserId -> users
    "meal_ingredients",                # MealId -> meals, IngredientId -> ingredients
    "coach_session_equipments",        # CoachBookingId -> bookings, EquipmentBookingId -> bookings, EquipmentId -> equipment, WorkoutPlanExerciseId -> workout_plan_exercises
    "equipment_time_slots",            # EquipmentId -> equipment, BookedByUserId -> users, BookingId -> bookings
    "workout_log_exercises",           # LogId -> workout_logs, ExerciseId -> exercises, PlannedExerciseId -> workout_plan_exercises
    "ai_inference_logs",               # UserId -> users, ModelVersionId -> ai_model_versions, FeatureSnapshotId -> user_feature_snapshots
]

def migrate_database():
    print("==================================================")
    print(f"SOURCE:      {OLD_DB['host']}")
    print(f"DESTINATION: {NEW_DB['host']}")
    print("==================================================")

    # Establish connections
    try:
        print("Connecting to source (old) database...")
        conn_src = psycopg2.connect(**OLD_DB)
        cur_src = conn_src.cursor()

        print("Connecting to destination (new) database...")
        conn_dest = psycopg2.connect(**NEW_DB)
        cur_dest = conn_dest.cursor()
    except Exception as e:
        print(f"[ERROR] Failed to connect: {e}")
        return

    try:
        # Get list of base tables in the public schema to ensure we don't miss any
        cur_src.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        all_db_tables = [row[0] for row in cur_src.fetchall()]
        all_db_tables = [t for t in all_db_tables if t != "__EFMigrationsHistory"]

        # Verify all database tables are covered by our ORDERED_TABLES list
        missing_tables = [t for t in all_db_tables if t not in ORDERED_TABLES]
        if missing_tables:
            print(f"[WARNING] The following tables in the DB are missing from ORDERED_TABLES: {missing_tables}")
            print("Appending them to the end of the migration list...")
            migration_list = ORDERED_TABLES + missing_tables
        else:
            migration_list = ORDERED_TABLES

        # Truncate tables in REVERSE order of insertion to respect foreign keys
        print("\nTruncating tables on destination database in reverse order...")
        reverse_ordered = list(reversed(migration_list))
        for table in reverse_ordered:
            print(f"  Truncating table '{table}'...")
            cur_dest.execute(f'TRUNCATE TABLE "{table}" CASCADE;')
        print("Done: All destination tables truncated successfully.")

        # Migrate data in FORWARD order
        print("\nStarting data migration in forward order...")
        for table in migration_list:
            # Check if source table has any data
            cur_src.execute(f'SELECT COUNT(*) FROM "{table}"')
            count = cur_src.fetchone()[0]
            if count == 0:
                print(f"Table '{table}' is empty, skipping.")
                continue

            print(f"Migrating table '{table}' ({count} rows)...")
            
            # Fetch columns and data
            cur_src.execute(f'SELECT * FROM "{table}"')
            columns = [desc[0] for desc in cur_src.description]
            col_str = ", ".join(f'"{col}"' for col in columns)
            insert_query = f'INSERT INTO "{table}" ({col_str}) VALUES %s'
            
            # Batch read/write in chunks to optimize memory usage
            chunk_size = 10000
            total_copied = 0
            while True:
                rows = cur_src.fetchmany(chunk_size)
                if not rows:
                    break
                execute_values(cur_dest, insert_query, rows)
                total_copied += len(rows)
            
            print(f"  Done: Successfully copied {total_copied} rows.")

        # Reset sequences for auto-incrementing fields
        print("\nSynchronizing auto-incrementing sequences on destination database...")
        cur_dest.execute("""
            SELECT 
                table_name, 
                column_name
            FROM 
                information_schema.columns 
            WHERE 
                table_schema = 'public' 
                AND (column_default LIKE 'nextval%' OR is_identity = 'YES');
        """)
        seq_cols = cur_dest.fetchall()
        for table_name, column_name in seq_cols:
            if table_name == "__EFMigrationsHistory":
                continue
            try:
                # Find the sequence name associated with the column
                cur_dest.execute(f"SELECT pg_get_serial_sequence('\"{table_name}\"', '{column_name}')")
                seq = cur_dest.fetchone()[0]
                if seq:
                    # Reset the sequence to the maximum ID currently in the table
                    cur_dest.execute(f'SELECT setval(\'{seq}\', COALESCE((SELECT MAX("{column_name}") FROM "{table_name}"), 1))')
                    print(f"  Done: Reset sequence for {table_name}.{column_name}")
            except Exception as e:
                print(f"  [WARNING] Could not reset sequence for {table_name}.{column_name}: {e}")

        # Commit all changes to the destination
        print("\nCommitting changes...")
        conn_dest.commit()
        print("==================================================")
        print("DATA MIGRATION COMPLETED SUCCESSFULLY!")
        print("==================================================")

    except Exception as e:
        print(f"\n[ERROR] Migration failed: {e}")
        print("Rolling back changes...")
        conn_dest.rollback()
    finally:
        # Close database connections
        cur_src.close()
        conn_src.close()
        cur_dest.close()
        conn_dest.close()

if __name__ == "__main__":
    migrate_database()
