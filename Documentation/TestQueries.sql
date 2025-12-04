-- IntelliFit Database Test Queries
-- 50 comprehensive queries to test all tables and relationships

-- ==========================================
-- SECTION 1: BASIC DATA RETRIEVAL (10 queries)
-- ==========================================

-- 1. Get all available equipment
SELECT e."EquipmentId", e."Name", e."Status", ec."CategoryName"
FROM equipment e
JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
WHERE e."Status" = 0; -- 0=Available

-- 2. Get all equipment categories with equipment count
SELECT ec."CategoryId", ec."CategoryName", ec."Description", COUNT(e."EquipmentId") as equipment_count
FROM equipment_categories ec
LEFT JOIN equipment e ON ec."CategoryId" = e."CategoryId"
GROUP BY ec."CategoryId", ec."CategoryName", ec."Description";


-- 3. Get all active users
SELECT "UserId", "Name", "Email", "CreatedAt"
FROM users
WHERE "IsActive" = true
ORDER BY "CreatedAt" DESC;

-- 4. Get all active subscription plans with pricing
SELECT "PlanId", "PlanName", "Price", "DurationDays", "Features"
FROM subscription_plans
WHERE "IsActive" = true
ORDER BY "Price";

-- 5. Get all token packages available for purchase
SELECT  "PackageName", "TokenAmount", "Price", "BonusTokens"
FROM token_packages
WHERE "IsActive" = true
ORDER BY "TokenAmount";


-- 6. Get all exercises grouped by difficulty
SELECT "DifficultyLevel", COUNT(*) as exercise_count
FROM exercises
WHERE "IsActive" = true
GROUP BY "DifficultyLevel"
ORDER BY exercise_count DESC;

-- 7. Get all active nutrition plans with coach info (TPT fixed)
SELECT np."PlanId", np."PlanName", u."Name" as coach_name, np."CreatedAt"
FROM nutrition_plans np
LEFT JOIN users u ON np."GeneratedByCoachId" = u."UserId"
WHERE np."IsActive" = true
ORDER BY np."CreatedAt" DESC;

-- 8. Get all ingredients with their nutritional values
SELECT "IngredientId", "Name", "Category", 
       "CaloriesPer100g", "ProteinPer100g", "CarbsPer100g", "FatsPer100g"
FROM ingredients
WHERE "IsActive" = true
ORDER BY "Name";

-- 9. Get all workout templates created by coaches (TPT fixed)
SELECT wt."TemplateId", wt."TemplateName", wt."Description", u."Name" as coach_name
FROM workout_templates wt
LEFT JOIN users u ON wt."CreatedByCoachId" = u."UserId"
ORDER BY wt."CreatedAt" DESC;

-- 10. Get all active notifications for users
SELECT n."NotificationId", n."UserId", n."NotificationType", n."Title", n."CreatedAt"
FROM notifications n
WHERE n."IsRead" = false
ORDER BY n."CreatedAt" DESC;

-- ==========================================
-- SECTION 2: MEMBER & PROFILE QUERIES (8 queries)
-- ==========================================

-- 11. Get member profiles with latest InBody measurements (TPT fixed)
SELECT u."UserId", u."Name" as member_name,
       m."FitnessGoal", m."CurrentWeight", m."Height",
       ibm."Weight", ibm."BodyFatPercentage", ibm."MeasurementDate"
FROM users u
INNER JOIN members m ON u."UserId" = m."UserId"
LEFT JOIN LATERAL (
    SELECT * FROM inbody_measurements
    WHERE "UserId" = m."UserId"
    ORDER BY "MeasurementDate" DESC
    LIMIT 1
) ibm ON true
ORDER BY u."Name";

-- 12. Get members with their current token balance (TPT fixed)
SELECT u."UserId", u."Name", u."TokenBalance"
FROM users u
INNER JOIN members m ON u."UserId" = m."UserId"
ORDER BY u."TokenBalance" DESC;

-- 13. Get coach profiles with their specializations and ratings (TPT fixed)
SELECT u."UserId", u."Name" as coach_name,
       c."Specialization", c."ExperienceYears", c."Rating", c."TotalReviews"
FROM users u
INNER JOIN coaches c ON u."UserId" = c."UserId"
WHERE c."IsAvailable" = true
ORDER BY c."Rating" DESC;

-- 14. Get members by fitness goal distribution (TPT fixed)
SELECT m."FitnessGoal", COUNT(*) as member_count
FROM members m
INNER JOIN users u ON m."UserId" = u."UserId"
WHERE u."IsActive" = true
GROUP BY m."FitnessGoal"
ORDER BY member_count DESC;

-- 15. Get members who joined in the last 30 days (TPT fixed)
SELECT u."UserId", u."Name", u."Email", u."CreatedAt"
FROM users u
INNER JOIN members m ON u."UserId" = m."UserId"
WHERE u."CreatedAt" >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY u."CreatedAt" DESC;

-- 16. Get all InBody measurements for a specific member with trends
SELECT "UserId", "MeasurementDate", "Weight", "BodyFatPercentage", "MuscleMass",
       "Weight" - LAG("Weight") OVER (PARTITION BY "UserId" ORDER BY "MeasurementDate") as weight_change,
       "BodyFatPercentage" - LAG("BodyFatPercentage") OVER (PARTITION BY "UserId" ORDER BY "MeasurementDate") as fat_change
FROM inbody_measurements
ORDER BY "UserId", "MeasurementDate" DESC;

-- 17. Get members with active subscriptions
SELECT u."UserId", u."Name", 
       sp."PlanName" as plan_name, us."StartDate", us."EndDate", us."Status"
FROM users u
JOIN user_subscriptions us ON u."UserId" = us."UserId"
JOIN subscription_plans sp ON us."PlanId" = sp."PlanId"
WHERE us."Status" = 0 AND us."EndDate" >= CURRENT_DATE -- 0=Active
ORDER BY us."EndDate";

-- 18. Get members who need subscription renewal reminders
SELECT u."UserId", u."Name", u."Email",
       us."EndDate", us."EndDate" - CURRENT_DATE as days_remaining
FROM users u
JOIN user_subscriptions us ON u."UserId" = us."UserId"
WHERE us."Status" = 0 -- 0=Active
  AND us."EndDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND us."RenewalReminderSent" = false
ORDER BY us."EndDate";

-- ==========================================
-- SECTION 3: WORKOUT & EXERCISE QUERIES (10 queries)
-- ==========================================

-- 19. Get all workout plans assigned to members with their status (TPT fixed)
SELECT wp."PlanId", u."Name" as member_name,
       wp."PlanName", wp."Status", wp."StartDate", wp."EndDate",
       coach."Name" as coach_name
FROM workout_plans wp
INNER JOIN users u ON wp."UserId" = u."UserId"
LEFT JOIN users coach ON wp."GeneratedByCoachId" = coach."UserId"
ORDER BY wp."CreatedAt" DESC;

-- 20. Get exercises by muscle group and difficulty
SELECT "MuscleGroup", "DifficultyLevel", COUNT(*) as exercise_count
FROM exercises
WHERE "IsActive" = true
GROUP BY "MuscleGroup", "DifficultyLevel"
ORDER BY "MuscleGroup", "DifficultyLevel";

-- 21. Get workout plan with all exercises and details
SELECT wp."PlanId", wp."PlanName", 
       e."Name" as exercise_name, wpe."Sets", wpe."Reps", wpe."RestSeconds", wpe."DayNumber"
FROM workout_plans wp
JOIN workout_plan_exercises wpe ON wp."PlanId" = wpe."WorkoutPlanId"
JOIN exercises e ON wpe."ExerciseId" = e."ExerciseId"
ORDER BY wp."PlanId", wpe."DayNumber", wpe."OrderInDay";

-- 22. Get workout logs with exercise performance
SELECT u."Name" as member_name,
       wl."ExercisesCompleted", wl."DurationMinutes", wl."CaloriesBurned", wl."WorkoutDate"
FROM workout_logs wl
JOIN users u ON wl."UserId" = u."UserId"
ORDER BY wl."WorkoutDate" DESC;

-- 23. Get member workout frequency and consistency (TPT fixed)
SELECT u."UserId", u."Name",
       COUNT(DISTINCT DATE(wl."WorkoutDate")) as total_workout_days,
       MAX(wl."WorkoutDate") as last_workout_date
FROM users u
INNER JOIN members m ON u."UserId" = m."UserId"
LEFT JOIN workout_logs wl ON u."UserId" = wl."UserId"
GROUP BY u."UserId", u."Name"
ORDER BY total_workout_days DESC;

-- 24. Get AI-generated workout plans pending coach approval
SELECT  u."Name" as member_name,
       wp."PlanName", wp."Status", wp."CreatedAt",
       ag."GenerationId", ag."TokensUsed"
FROM workout_plans wp
JOIN users u ON wp."UserId" = u."UserId"
JOIN ai_program_generations ag ON wp."PlanId" = ag."WorkoutPlanId" AND ag."ProgramType" = 'Workout'
WHERE wp."Status" = 'PendingApproval'
ORDER BY wp."CreatedAt";

-- 25. Get workout templates with exercise count (TPT fixed)
SELECT wt."TemplateId", wt."TemplateName", wt."Description", wt."DifficultyLevel",
       COUNT(wte."ExerciseId") as exercise_count,
       u."Name" as created_by
FROM workout_templates wt
JOIN workout_template_exercises wte ON wt."TemplateId" = wte."TemplateId"
LEFT JOIN users u ON wt."CreatedByCoachId" = u."UserId"
GROUP BY wt."TemplateId", wt."TemplateName", wt."Description", wt."DifficultyLevel", u."Name"
ORDER BY wt."TemplateName";

-- 26. Get exercises that are most logged by members
SELECT e."ExerciseId", e."Name", e."MuscleGroup", COUNT(wpe."WorkoutPlanExerciseId") as times_used
FROM exercises e
LEFT JOIN workout_plan_exercises wpe ON e."ExerciseId" = wpe."ExerciseId"
GROUP BY e."ExerciseId", e."Name", e."MuscleGroup"
ORDER BY times_used DESC
LIMIT 20;

-- 27. Get member progress comparison (first vs latest InBody scan)
WITH first_scan AS (
    SELECT "UserId", "Weight" as first_weight, "BodyFatPercentage" as first_bf, MIN("MeasurementDate") as first_date
    FROM inbody_measurements
    GROUP BY "UserId", "Weight", "BodyFatPercentage"
),
latest_scan AS (
    SELECT "UserId", "Weight" as latest_weight, "BodyFatPercentage" as latest_bf, MAX("MeasurementDate") as latest_date
    FROM inbody_measurements
    GROUP BY "UserId", "Weight", "BodyFatPercentage"
)
SELECT u."Name",
       fs.first_weight, ls.latest_weight, ls.latest_weight - fs.first_weight as weight_change,
       fs.first_bf, ls.latest_bf, ls.latest_bf - fs.first_bf as bf_change,
       ls.latest_date - fs.first_date as days_training
FROM first_scan fs
JOIN latest_scan ls ON fs."UserId" = ls."UserId"
JOIN users u ON fs."UserId" = u."UserId"
ORDER BY weight_change;

-- 28. Get workout plans expiring in next 7 days
SELECT  u."Name" as member_name,
       wp."PlanName", wp."EndDate", wp."EndDate" - CURRENT_DATE as days_remaining
FROM workout_plans wp
JOIN users u ON wp."UserId" = u."UserId"
WHERE wp."Status" = 'Active' 
  AND wp."EndDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY wp."EndDate";

-- ==========================================
-- SECTION 4: NUTRITION QUERIES (7 queries)
-- ==========================================

-- 29. Get nutrition plans with meal count or Get all meals with ingredient details
SELECT 
    m."MealId", 
    m."Name" AS "MealName", 
    m."MealType", 
    m."Calories", 
    m."ProteinGrams", 
    m."CarbsGrams", 
    m."FatsGrams",
    COUNT(mi."IngredientId") AS ingredient_count,
    STRING_AGG(ing."Name", ', ') AS ingredient_names
FROM meals m
LEFT JOIN meal_ingredients mi ON m."MealId" = mi."MealId"
LEFT JOIN ingredients ing ON mi."IngredientId" = ing."IngredientId"
GROUP BY 
    m."MealId", m."Name", m."MealType", m."Calories", m."ProteinGrams", m."CarbsGrams", m."FatsGrams"
ORDER BY m."Name";


-- 31. Get meal ingredients with nutritional breakdown (mesh mzbota awy el functions !!)
SELECT m."Name" as meal_name, i."Name" as ingredient_name, 
       mi."Quantity", mi."Unit",
       (mi."Quantity" / 100.0) * i."CaloriesPer100g" as calories_contribution,
       (mi."Quantity" / 100.0) * i."ProteinPer100g" as protein_contribution
FROM meals m
JOIN meal_ingredients mi ON m."MealId" = mi."MealId"
JOIN ingredients i ON mi."IngredientId" = i."IngredientId"
ORDER BY m."Name", i."Name";

-- 32. Get nutrition plans pending coach approval
SELECT np."PlanId", u."Name" as member_name,
       np."PlanName", np."Status", np."CreatedAt",
       ag."GenerationId", ag."TokensUsed"
FROM nutrition_plans np
JOIN users u ON np."UserId" = u."UserId"
JOIN ai_program_generations ag ON np."PlanId" = ag."NutritionPlanId" AND ag."ProgramType" = 'Nutrition'
WHERE np."Status" = 'PendingApproval'
ORDER BY np."CreatedAt";

-- 33. Get ingredients by category with usage count
SELECT 
    i."Category",
    COUNT(DISTINCT i."IngredientId") AS ingredient_count,
    COUNT(mi."MealIngredientId") AS times_used_in_meals,
    STRING_AGG(DISTINCT i."Name", ', ') AS ingredient_names,
    STRING_AGG(DISTINCT m."Name", ', ') AS meals_used_in
FROM ingredients i
LEFT JOIN meal_ingredients mi 
    ON i."IngredientId" = mi."IngredientId"
LEFT JOIN meals m
    ON mi."MealId" = m."MealId"
WHERE i."IsActive" = true
GROUP BY i."Category"
ORDER BY ingredient_count DESC;




-- 34. Get meals with nutrition plan and coach info (TPT fixed)
SELECT m."MealId", m."Name" as meal_name, m."MealType", m."Calories",
       u."Name" as coach_name,
       c."Specialization",
       np."PlanName"
FROM meals m
INNER JOIN nutrition_plans np ON m."NutritionPlanId" = np."PlanId"
LEFT JOIN users u ON np."GeneratedByCoachId" = u."UserId"
LEFT JOIN coaches c ON u."UserId" = c."UserId"
ORDER BY m."CreatedAt" DESC;

-- 35. Get high-protein meal recommendations (>30g protein)
SELECT "MealId", "Name" as meal_name, "MealType", "Calories", "ProteinGrams", "CarbsGrams", "FatsGrams",
       ROUND(("ProteinGrams" * 4.0 / "Calories") * 100, 2) as protein_percentage
FROM meals
WHERE "ProteinGrams" > 30
ORDER BY "ProteinGrams" DESC;

-- ==========================================
-- SECTION 5: BOOKING & EQUIPMENT QUERIES (6 queries)
-- ==========================================

-- 36. Get all equipment bookings for today
SELECT b."BookingId", u."Name" as member_name,
       e."Name" as equipment_name, b."StartTime", b."EndTime", b."Status"
FROM bookings b
JOIN users u ON b."UserId" = u."UserId"
LEFT JOIN equipment e ON b."EquipmentId" = e."EquipmentId"
WHERE b."BookingType" = 'Equipment' AND DATE(b."StartTime") = CURRENT_DATE
ORDER BY b."StartTime";

-- 37. Get equipment utilization rate
SELECT e."EquipmentId", e."Name", ec."CategoryName",
       COUNT(b."BookingId") as total_bookings,
       COUNT(CASE WHEN b."Status" = 1 THEN 1 END) as completed_bookings -- 1=Confirmed
FROM equipment e
JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
LEFT JOIN bookings b ON e."EquipmentId" = b."EquipmentId"
GROUP BY e."EquipmentId", e."Name", ec."CategoryName"
ORDER BY total_bookings DESC;

-- 38. Get available equipment for booking right now
SELECT e."EquipmentId", e."Name", ec."CategoryName", e."Location"
FROM equipment e
JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
WHERE e."Status" = 0 -- 0=Available
  AND e."EquipmentId" NOT IN (
    SELECT "EquipmentId" FROM bookings
    WHERE DATE("StartTime") = CURRENT_DATE
      AND CURRENT_TIME BETWEEN "StartTime"::time AND "EndTime"::time
      AND "Status" IN (1, 2) -- 1=Confirmed, 2=InProgress
  )
ORDER BY ec."CategoryName", e."Name";

-- 39. Get member booking history (TPT fixed)
SELECT u."Name" as member_name,
       COUNT(b."BookingId") as total_bookings,
       COUNT(CASE WHEN b."Status" = 3 THEN 1 END) as completed, -- 3=Completed
       COUNT(CASE WHEN b."Status" = 4 THEN 1 END) as cancelled, -- 4=Cancelled
       MAX(b."StartTime") as last_booking_date
FROM users u
INNER JOIN members m ON u."UserId" = m."UserId"
LEFT JOIN bookings b ON u."UserId" = b."UserId"
GROUP BY u."UserId", u."Name"
ORDER BY total_bookings DESC;

-- 40. Get equipment requiring maintenance
SELECT e."EquipmentId", e."Name", e."Status", e."LastMaintenanceDate",
       CURRENT_DATE - e."LastMaintenanceDate" as days_since_maintenance,
       e."NextMaintenanceDate"
FROM equipment e
WHERE e."Status" = 2 -- 2=UnderMaintenance
   OR e."NextMaintenanceDate" <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY e."NextMaintenanceDate";

-- 41. Get coach session bookings (TPT fixed)
SELECT b."BookingId", 
       member."Name" as member_name,
       coach."Name" as coach_name,
       b."BookingType",
       b."StartTime",
       b."EndTime",
       b."Status"
FROM bookings b
INNER JOIN users member ON b."UserId" = member."UserId"
LEFT JOIN users coach ON b."CoachId" = coach."UserId"
WHERE b."BookingType" = 'Coach'
ORDER BY b."StartTime" DESC;

-- ==========================================
-- SECTION 6: PAYMENT & SUBSCRIPTION QUERIES (5 queries)
-- ==========================================

-- 42. Get all payments with subscription/package details
SELECT p."PaymentId", u."Name" as user_name,
       p."Amount", p."PaymentMethod", p."PaymentType", p."Status",
       COALESCE(sp."PlanName", tp."PackageName") as purchased_item,
       p."CreatedAt"
FROM payments p
JOIN users u ON p."UserId" = u."UserId"
LEFT JOIN user_subscriptions us ON p."PaymentId" = us."PaymentId"
LEFT JOIN subscription_plans sp ON us."PlanId" = sp."PlanId"
LEFT JOIN token_packages tp ON p."PackageId" = tp."PackageId"
ORDER BY p."CreatedAt" DESC;

-- 43. Get subscription revenue by plan
SELECT sp."PlanName" as plan_name, 
       sp."Price",
       COUNT(us."SubscriptionId") as total_subscriptions,
	   COUNT(p."PaymentId") as paid_subscriptions,
       SUM(COALESCE(p."Amount", 0)) as total_revenue
FROM subscription_plans sp
LEFT JOIN user_subscriptions us 
       ON sp."PlanId" = us."PlanId"
LEFT JOIN payments p 
       ON us."PaymentId" = p."PaymentId" 
       AND p."Status" = 1 -- 1=Completed
GROUP BY sp."PlanId", sp."PlanName", sp."Price"
ORDER BY total_revenue DESC;




-- 44. Get token transactions for members
SELECT u."Name" as member_name,
       tt."TransactionType", tt."Amount", tt."Description", tt."CreatedAt"
FROM token_transactions tt
JOIN users u ON tt."UserId" = u."UserId"
ORDER BY tt."CreatedAt" DESC;

-- 45. Get failed payments for follow-up
SELECT p."PaymentId", u."Name" as user_name,
       u."Email", p."Amount", p."PaymentMethod", p."Status", p."CreatedAt"
FROM payments p
JOIN users u ON p."UserId" = u."UserId"
WHERE p."Status" = 2 -- 2=Failed
ORDER BY p."CreatedAt" DESC;

-- 46. Get monthly revenue report
SELECT DATE_TRUNC('month', p."CreatedAt") as month,
       COUNT(p."PaymentId") as total_payments,
       SUM(CASE WHEN p."Status" = 1 THEN p."Amount" ELSE 0 END) as completed_revenue, -- 1=Completed
       SUM(CASE WHEN p."Status" = 2 THEN p."Amount" ELSE 0 END) as failed_revenue -- 2=Failed
FROM payments p
GROUP BY DATE_TRUNC('month', p."CreatedAt")
ORDER BY month DESC;

-- ==========================================
-- SECTION 7: AI & ENGAGEMENT QUERIES (4 queries)
-- ==========================================

-- 47. Get AI chat logs with token usage
SELECT acl."ChatId", u."Name" as user_name,
       acl."SessionId", acl."TokensUsed", acl."MessageType",
       acl."CreatedAt"
FROM ai_chat_logs acl
JOIN users u ON acl."UserId" = u."UserId"
ORDER BY acl."CreatedAt" DESC;

-- 48. Get AI program generations summary
SELECT ag."ProgramType",
       COUNT(ag."GenerationId") as generation_count,
       AVG(ag."TokensUsed") as avg_tokens_used,
       SUM(ag."TokensUsed") as total_tokens_used
FROM ai_program_generations ag
GROUP BY ag."ProgramType"
ORDER BY ag."ProgramType", generation_count DESC;

-- 49. Get member milestones and achievements
SELECT u."Name" as member_name,
       pm."MilestoneName" as milestone_title, pm."Description", pm."Icon",
       um."CompletedAt", um."CurrentProgress"
FROM user_milestones um
JOIN users u ON um."UserId" = u."UserId"
JOIN progress_milestones pm ON um."MilestoneId" = pm."MilestoneId"
ORDER BY um."CompletedAt" DESC;

-- 50. Get activity feed for social engagement
SELECT af."ActivityId", u."Name" as user_name,
       af."ActivityType", af."Title", af."Description",
       af."CreatedAt"
FROM activity_feeds af
JOIN users u ON af."UserId" = u."UserId"
ORDER BY af."CreatedAt" DESC
LIMIT 50;