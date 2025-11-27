-- ===============================================
-- DATABASE RELATIONSHIP & INTEGRITY TEST QUERIES
-- IntelliFit Smart Gym System (PostgreSQL)
-- Tests all foreign keys, cascades, and constraints
-- Created: November 28, 2025
-- Database: intellifit_db (PostgreSQL 14+)
-- ===============================================

-- Connect to intellifit_db database
\c intellifit_db

\echo '========================================'
\echo 'STARTING DATABASE RELATIONSHIP TESTS'
\echo '========================================'
\echo ''

-- ===============================================
-- SECTION 1: USER & PROFILE RELATIONSHIPS
-- Tests users, member_profiles, coach_profiles
-- ===============================================
\echo '--- SECTION 1: User & Profile Relationships ---'
\echo ''

-- 1.1: Count users by role
\echo '1.1: Users by Role (0=Member, 1=Coach, 2=Admin)...'
SELECT 
    "Role",
    CASE 
        WHEN "Role" = 0 THEN 'Member'
        WHEN "Role" = 1 THEN 'Coach'
        WHEN "Role" = 2 THEN 'Admin'
        ELSE 'Unknown'
    END as role_name,
    COUNT(*) AS user_count
FROM users
GROUP BY "Role"
ORDER BY "Role";

-- 1.2: Users with member profiles
\echo '1.2: Members with their profiles...'
SELECT 
    u."UserId",
    u."Name",
    u."Email",
    mp."FitnessGoal",
    mp."CurrentWeight",
    mp."TargetWeight",
    mp."Height"
FROM users u
INNER JOIN member_profiles mp ON u."UserId" = mp."UserId"
WHERE u."Role" = 0
ORDER BY u."UserId";

-- 1.3: Coaches with their profiles
\echo '1.3: Coaches with their profiles...'
SELECT 
    cp."CoachId",
    u."Name",
    u."Email",
    cp."Specialization",
    cp."ExperienceYears",
    cp."Rating",
    cp."Certifications"
FROM coach_profiles cp
INNER JOIN users u ON cp."UserId" = u."UserId"
WHERE u."Role" = 1
ORDER BY cp."CoachId";

-- 1.4: Check for orphaned profiles
\echo '1.4: Checking for orphaned profiles...'
SELECT 'Orphaned MemberProfile' AS issue_type, mp."UserId"
FROM member_profiles mp
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u."UserId" = mp."UserId")
UNION ALL
SELECT 'Orphaned CoachProfile' AS issue_type, cp."UserId"
FROM coach_profiles cp
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u."UserId" = cp."UserId");

-- ===============================================
-- SECTION 2: SUBSCRIPTION & PAYMENT RELATIONSHIPS
-- Tests subscription_plans, user_subscriptions, payments
-- ===============================================
\echo ''
\echo '--- SECTION 2: Subscription & Payment Relationships ---'
\echo ''

-- 2.1: Active subscriptions with plan details
\echo '2.1: Active user subscriptions...'
SELECT 
    us."SubscriptionId",
    u."Name" AS member_name,
    sp."PlanName",
    sp."Price",
    us."StartDate",
    us."EndDate",
    us."Status" -- 0=Active, 1=Expired, 2=Cancelled
FROM user_subscriptions us
INNER JOIN users u ON us."UserId" = u."UserId"
INNER JOIN subscription_plans sp ON us."PlanId" = sp."PlanId"
WHERE us."Status" = 0
ORDER BY us."StartDate" DESC;

-- 2.2: Payments with subscription/package details
\echo '2.2: Recent payments...'
SELECT 
    p."PaymentId",
    u."Name" AS user_name,
    p."Amount",
    p."PaymentMethod",
    p."Status", -- 0=Pending, 1=Completed, 2=Failed
    COALESCE(sp."PlanName", tp."PackageName") as purchased_item,
    p."CreatedAt"
FROM payments p
INNER JOIN users u ON p."UserId" = u."UserId"
LEFT JOIN user_subscriptions us ON p."PaymentId" = us."PaymentId"
LEFT JOIN subscription_plans sp ON us."PlanId" = sp."PlanId"
LEFT JOIN token_packages tp ON p."PackageId" = tp."PackageId"
ORDER BY p."CreatedAt" DESC
LIMIT 20;

-- 2.3: Token transactions
\echo '2.3: Token transactions...'
SELECT 
    tt."TransactionId",
    u."Name" AS user_name,
    tt."TransactionType", -- 0=Purchase, 1=Deduction, 2=Refund, 3=Bonus
    tt."Amount",
    tt."Description",
    tt."CreatedAt"
FROM token_transactions tt
INNER JOIN users u ON tt."UserId" = u."UserId"
ORDER BY tt."CreatedAt" DESC
LIMIT 20;

-- ===============================================
-- SECTION 3: EQUIPMENT & BOOKING RELATIONSHIPS
-- Tests equipment, equipment_categories, bookings
-- ===============================================
\echo ''
\echo '--- SECTION 3: Equipment & Booking Relationships ---'
\echo ''

-- 3.1: Equipment with categories and booking counts
\echo '3.1: Equipment utilization...'
SELECT 
    e."EquipmentId",
    e."Name" AS equipment_name,
    ec."CategoryName",
    e."Status", -- 0=Available, 1=InUse, 2=UnderMaintenance
    COUNT(b."BookingId") AS total_bookings
FROM equipment e
LEFT JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
LEFT JOIN bookings b ON e."EquipmentId" = b."EquipmentId"
GROUP BY e."EquipmentId", e."Name", ec."CategoryName", e."Status"
ORDER BY total_bookings DESC;

-- 3.2: Recent bookings with details
\echo '3.2: Recent bookings...'
SELECT 
    b."BookingId",
    u."Name" AS member_name,
    e."Name" AS equipment_name,
    c."Name" AS coach_name,
    b."StartTime",
    b."EndTime",
    b."BookingStatus" -- 0=Pending, 1=Confirmed, 2=InProgress, 3=Completed, 4=Cancelled
FROM bookings b
INNER JOIN users u ON b."UserId" = u."UserId"
LEFT JOIN equipment e ON b."EquipmentId" = e."EquipmentId"
LEFT JOIN coach_profiles cp ON b."CoachId" = cp."CoachId"
LEFT JOIN users c ON cp."UserId" = c."UserId"
ORDER BY b."StartTime" DESC
LIMIT 20;

-- 3.3: Check for orphaned bookings
\echo '3.3: Checking for orphaned booking FKs...'
SELECT 'Invalid UserId' AS issue_type, b."BookingId", b."UserId"
FROM bookings b
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u."UserId" = b."UserId")
UNION ALL
SELECT 'Invalid EquipmentId' AS issue_type, b."BookingId", b."EquipmentId"
FROM bookings b
WHERE b."EquipmentId" IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM equipment e WHERE e."EquipmentId" = b."EquipmentId")
UNION ALL
SELECT 'Invalid CoachId' AS issue_type, b."BookingId", b."CoachId"
FROM bookings b
WHERE b."CoachId" IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM coach_profiles cp WHERE cp."CoachId" = b."CoachId");

-- ===============================================
-- SECTION 4: WORKOUT SYSTEM RELATIONSHIPS
-- Tests exercises, workout_plans, workout_logs, workout_templates
-- ===============================================
\echo ''
\echo '--- SECTION 4: Workout System Relationships ---'
\echo ''

-- 4.1: Workout templates with exercise counts
\echo '4.1: Workout templates...'
SELECT 
    wt."TemplateId",
    wt."TemplateName",
    wt."DifficultyLevel",
    u."Name" AS created_by_coach,
    COUNT(wte."ExerciseId") AS total_exercises
FROM workout_templates wt
LEFT JOIN workout_template_exercises wte ON wt."TemplateId" = wte."TemplateId"
LEFT JOIN coach_profiles cp ON wt."CreatedByCoachId" = cp."CoachId"
LEFT JOIN users u ON cp."UserId" = u."UserId"
GROUP BY wt."TemplateId", wt."TemplateName", wt."DifficultyLevel", u."Name"
ORDER BY wt."TemplateId";

-- 4.2: Workout plans with relationships
\echo '4.2: Member workout plans...'
SELECT 
    wp."PlanId",
    wp."PlanName",
    u."Name" AS member_name,
    c."Name" AS coach_name,
    wp."Status",
    wp."StartDate",
    wp."EndDate",
    COUNT(wpe."WorkoutPlanExerciseId") AS exercise_count
FROM workout_plans wp
INNER JOIN users u ON wp."UserId" = u."UserId"
LEFT JOIN coach_profiles cp ON wp."GeneratedByCoachId" = cp."CoachId"
LEFT JOIN users c ON cp."UserId" = c."UserId"
LEFT JOIN workout_plan_exercises wpe ON wp."PlanId" = wpe."WorkoutPlanId"
GROUP BY wp."PlanId", wp."PlanName", u."Name", c."Name", wp."Status", wp."StartDate", wp."EndDate"
ORDER BY wp."StartDate" DESC
LIMIT 20;

-- 4.3: Workout logs summary
\echo '4.3: Recent workout logs...'
SELECT 
    wl."LogId",
    u."Name" AS member_name,
    wl."WorkoutDate",
    wl."DurationMinutes",
    wl."CaloriesBurned",
    wl."ExercisesCompleted",
    wl."Completed"
FROM workout_logs wl
INNER JOIN users u ON wl."UserId" = u."UserId"
ORDER BY wl."WorkoutDate" DESC
LIMIT 20;

-- 4.4: Exercises by category and difficulty
\echo '4.4: Exercises by category...'
SELECT 
    "Category",
    "DifficultyLevel",
    COUNT(*) AS exercise_count
FROM exercises
WHERE "IsActive" = true
GROUP BY "Category", "DifficultyLevel"
ORDER BY "Category", "DifficultyLevel";

-- ===============================================
-- SECTION 5: NUTRITION SYSTEM RELATIONSHIPS
-- Tests nutrition_plans, meals, meal_ingredients, ingredients
-- ===============================================
\echo ''
\echo '--- SECTION 5: Nutrition System Relationships ---'
\echo ''

-- 5.1: Nutrition plans with meal counts
\echo '5.1: Nutrition plans...'
SELECT 
    np."PlanId",
    np."PlanName",
    u."Name" AS member_name,
    c."Name" AS coach_name,
    np."DailyCalories",
    np."ProteinGrams",
    COUNT(m."MealId") AS meal_count
FROM nutrition_plans np
INNER JOIN users u ON np."UserId" = u."UserId"
LEFT JOIN coach_profiles cp ON np."GeneratedByCoachId" = cp."CoachId"
LEFT JOIN users c ON cp."UserId" = c."UserId"
LEFT JOIN meals m ON np."PlanId" = m."NutritionPlanId"
GROUP BY np."PlanId", np."PlanName", u."Name", c."Name", np."DailyCalories", np."ProteinGrams"
ORDER BY np."CreatedAt" DESC
LIMIT 20;

-- 5.2: Meals with ingredient counts
\echo '5.2: Meals with ingredients...'
SELECT 
    m."MealId",
    m."MealName",
    m."MealType",
    m."Calories",
    m."Protein",
    COUNT(mi."MealIngredientId") AS ingredient_count
FROM meals m
LEFT JOIN meal_ingredients mi ON m."MealId" = mi."MealId"
GROUP BY m."MealId", m."MealName", m."MealType", m."Calories", m."Protein"
ORDER BY m."MealId"
LIMIT 20;

-- 5.3: Ingredients by category
\echo '5.3: Ingredients by category...'
SELECT 
    "Category",
    COUNT(*) AS ingredient_count,
    ROUND(AVG("CaloriesPer100g"), 2) AS avg_calories,
    ROUND(AVG("ProteinPer100g"), 2) AS avg_protein
FROM ingredients
WHERE "IsActive" = true
GROUP BY "Category"
ORDER BY ingredient_count DESC;

-- ===============================================
-- SECTION 6: HEALTH MONITORING RELATIONSHIPS
-- Tests inbody_measurements
-- ===============================================
\echo ''
\echo '--- SECTION 6: Health Monitoring Relationships ---'
\echo ''

-- 6.1: Recent InBody measurements
\echo '6.1: Recent InBody measurements...'
SELECT 
    ibm."InBodyId",
    u."Name" AS member_name,
    ibm."MeasurementDate",
    ibm."Weight",
    ibm."BodyFatPercentage",
    ibm."MuscleMass",
    ibm."Bmi"
FROM inbody_measurements ibm
INNER JOIN users u ON ibm."UserId" = u."UserId"
ORDER BY ibm."MeasurementDate" DESC
LIMIT 20;

-- 6.2: Member progress tracking
\echo '6.2: Member weight progress...'
WITH ranked_measurements AS (
    SELECT 
        "UserId",
        "Weight",
        "BodyFatPercentage",
        "MeasurementDate",
        ROW_NUMBER() OVER (PARTITION BY "UserId" ORDER BY "MeasurementDate") as first_scan,
        ROW_NUMBER() OVER (PARTITION BY "UserId" ORDER BY "MeasurementDate" DESC) as latest_scan
    FROM inbody_measurements
)
SELECT 
    u."Name",
    first."Weight" as initial_weight,
    latest."Weight" as current_weight,
    latest."Weight" - first."Weight" as weight_change,
    first."BodyFatPercentage" as initial_bf,
    latest."BodyFatPercentage" as current_bf,
    latest."MeasurementDate" - first."MeasurementDate" as days_tracked
FROM ranked_measurements first
INNER JOIN ranked_measurements latest ON first."UserId" = latest."UserId"
INNER JOIN users u ON first."UserId" = u."UserId"
WHERE first.first_scan = 1 AND latest.latest_scan = 1
ORDER BY weight_change;

-- ===============================================
-- SECTION 7: COACH RELATIONSHIPS
-- Tests coach_reviews, member_coach_subscriptions
-- ===============================================
\echo ''
\echo '--- SECTION 7: Coach Relationships ---'
\echo ''

-- 7.1: Coach reviews and ratings
\echo '7.1: Coach reviews...'
SELECT 
    c."Name" AS coach_name,
    cp."Specialization",
    COUNT(cr."ReviewId") AS review_count,
    ROUND(AVG(cr."Rating"), 2) AS avg_rating,
    cp."Rating" AS profile_rating
FROM coach_profiles cp
INNER JOIN users c ON cp."UserId" = c."UserId"
LEFT JOIN coach_reviews cr ON cp."CoachId" = cr."CoachId"
GROUP BY c."Name", cp."Specialization", cp."Rating"
ORDER BY avg_rating DESC;

-- 7.2: Member-Coach subscriptions
\echo '7.2: Member-Coach subscriptions...'
SELECT 
    mcs."SubscriptionId",
    m."Name" AS member_name,
    c."Name" AS coach_name,
    mcs."SubscriptionStatus", -- 0=Active, 1=Expired, 2=Cancelled
    mcs."StartDate",
    mcs."EndDate",
    mcs."SessionsIncluded",
    mcs."SessionsUsed"
FROM member_coach_subscriptions mcs
INNER JOIN users m ON mcs."UserId" = m."UserId"
INNER JOIN coach_profiles cp ON mcs."CoachId" = cp."CoachId"
INNER JOIN users c ON cp."UserId" = c."UserId"
ORDER BY mcs."StartDate" DESC
LIMIT 20;

-- ===============================================
-- SECTION 8: AI & ENGAGEMENT FEATURES
-- Tests ai_chat_logs, ai_program_generations, notifications
-- ===============================================
\echo ''
\echo '--- SECTION 8: AI & Engagement Features ---'
\echo ''

-- 8.1: AI chat logs summary
\echo '8.1: AI chat activity...'
SELECT 
    u."Name",
    COUNT(acl."ChatId") AS chat_count,
    SUM(acl."TokensUsed") AS total_tokens,
    MAX(acl."CreatedAt") AS last_chat
FROM ai_chat_logs acl
INNER JOIN users u ON acl."UserId" = u."UserId"
GROUP BY u."UserId", u."Name"
ORDER BY total_tokens DESC
LIMIT 10;

-- 8.2: AI program generations
\echo '8.2: AI-generated programs...'
SELECT 
    "ProgramType",
    "Status",
    COUNT(*) AS generation_count,
    ROUND(AVG("TokensUsed"), 0) AS avg_tokens
FROM ai_program_generations
GROUP BY "ProgramType", "Status"
ORDER BY "ProgramType", generation_count DESC;

-- 8.3: Recent notifications
\echo '8.3: Recent notifications...'
SELECT 
    n."NotificationId",
    u."Name" AS user_name,
    n."NotificationType",
    n."Priority",
    n."IsRead",
    n."CreatedAt"
FROM notifications n
INNER JOIN users u ON n."UserId" = u."UserId"
ORDER BY n."CreatedAt" DESC
LIMIT 20;

-- 8.4: User milestones
\echo '8.4: User milestone achievements...'
SELECT 
    u."Name" AS member_name,
    pm."MilestoneName",
    um."CurrentProgress",
    pm."TargetValue",
    um."IsCompleted",
    um."CompletedAt"
FROM user_milestones um
INNER JOIN users u ON um."UserId" = u."UserId"
INNER JOIN progress_milestones pm ON um."MilestoneId" = pm."MilestoneId"
WHERE um."IsCompleted" = true
ORDER BY um."CompletedAt" DESC
LIMIT 20;

-- 8.5: Activity feed
\echo '8.5: Recent activity feed...'
SELECT 
    af."ActivityId",
    u."Name" AS user_name,
    af."ActivityType",
    af."Title",
    af."LikesCount",
    af."CommentsCount",
    af."CreatedAt"
FROM activity_feeds af
INNER JOIN users u ON af."UserId" = u."UserId"
WHERE af."IsVisible" = true
ORDER BY af."CreatedAt" DESC
LIMIT 20;

-- ===============================================
-- SECTION 9: FOREIGN KEY INTEGRITY CHECKS
-- Comprehensive orphaned FK detection
-- ===============================================
\echo ''
\echo '--- SECTION 9: Foreign Key Integrity Checks ---'
\echo ''

\echo '9.1: Checking all foreign key relationships...'

-- Check member_profiles
SELECT 'member_profiles->users' AS relationship, COUNT(*) AS orphan_count
FROM member_profiles mp
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u."UserId" = mp."UserId")

UNION ALL

-- Check coach_profiles
SELECT 'coach_profiles->users', COUNT(*)
FROM coach_profiles cp
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u."UserId" = cp."UserId")

UNION ALL

-- Check user_subscriptions
SELECT 'user_subscriptions->users', COUNT(*)
FROM user_subscriptions us
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u."UserId" = us."UserId")

UNION ALL

-- Check bookings
SELECT 'bookings->users', COUNT(*)
FROM bookings b
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u."UserId" = b."UserId")

UNION ALL

-- Check workout_plans
SELECT 'workout_plans->users', COUNT(*)
FROM workout_plans wp
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u."UserId" = wp."UserId")

UNION ALL

-- Check nutrition_plans
SELECT 'nutrition_plans->users', COUNT(*)
FROM nutrition_plans np
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u."UserId" = np."UserId")

UNION ALL

-- Check payments
SELECT 'payments->users', COUNT(*)
FROM payments p
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u."UserId" = p."UserId")

ORDER BY orphan_count DESC;

-- ===============================================
-- SECTION 10: CONSTRAINT & INDEX INFORMATION
-- View database constraints and indexes
-- ===============================================
\echo ''
\echo '--- SECTION 10: Constraints & Indexes ---'
\echo ''

-- 10.1: Foreign key constraints
\echo '10.1: Foreign key constraints...'
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 10.2: Indexes on tables
\echo '10.2: Database indexes...'
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ===============================================
-- SECTION 11: DATABASE SUMMARY STATISTICS
-- Overall database health metrics
-- ===============================================
\echo ''
\echo '--- SECTION 11: Database Summary Statistics ---'
\echo ''

\echo '11.1: Table row counts...'
SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'member_profiles', COUNT(*) FROM member_profiles
UNION ALL SELECT 'coach_profiles', COUNT(*) FROM coach_profiles
UNION ALL SELECT 'subscription_plans', COUNT(*) FROM subscription_plans
UNION ALL SELECT 'user_subscriptions', COUNT(*) FROM user_subscriptions
UNION ALL SELECT 'token_packages', COUNT(*) FROM token_packages
UNION ALL SELECT 'token_transactions', COUNT(*) FROM token_transactions
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'equipment_categories', COUNT(*) FROM equipment_categories
UNION ALL SELECT 'equipment', COUNT(*) FROM equipment
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'inbody_measurements', COUNT(*) FROM inbody_measurements
UNION ALL SELECT 'exercises', COUNT(*) FROM exercises
UNION ALL SELECT 'workout_plans', COUNT(*) FROM workout_plans
UNION ALL SELECT 'workout_plan_exercises', COUNT(*) FROM workout_plan_exercises
UNION ALL SELECT 'workout_logs', COUNT(*) FROM workout_logs
UNION ALL SELECT 'workout_templates', COUNT(*) FROM workout_templates
UNION ALL SELECT 'workout_template_exercises', COUNT(*) FROM workout_template_exercises
UNION ALL SELECT 'nutrition_plans', COUNT(*) FROM nutrition_plans
UNION ALL SELECT 'meals', COUNT(*) FROM meals
UNION ALL SELECT 'ingredients', COUNT(*) FROM ingredients
UNION ALL SELECT 'meal_ingredients', COUNT(*) FROM meal_ingredients
UNION ALL SELECT 'coach_reviews', COUNT(*) FROM coach_reviews
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'activity_feeds', COUNT(*) FROM activity_feeds
UNION ALL SELECT 'progress_milestones', COUNT(*) FROM progress_milestones
UNION ALL SELECT 'user_milestones', COUNT(*) FROM user_milestones
UNION ALL SELECT 'ai_chat_logs', COUNT(*) FROM ai_chat_logs
UNION ALL SELECT 'ai_program_generations', COUNT(*) FROM ai_program_generations
UNION ALL SELECT 'ai_workflow_jobs', COUNT(*) FROM ai_workflow_jobs
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs
ORDER BY row_count DESC;

\echo ''
\echo '========================================'
\echo 'DATABASE RELATIONSHIP TESTS COMPLETED'
\echo '========================================'
\echo ''
\echo 'Review the output above for:'
\echo '  - Orphaned foreign keys (should be 0)'
\echo '  - Relationship integrity'
\echo '  - Data distribution across tables'
\echo '  - Constraint configurations'
\echo ''
