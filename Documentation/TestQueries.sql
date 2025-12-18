-- IntelliFit Database Analytics & Test Queries
-- Optimized for Admin and Receptionist roles with date-range parameters
-- Updated for single-table schema with Role column and separate profile tables

-- ==========================================
-- SECTION 1: USER ANALYTICS (Admin/Receptionist)
-- ==========================================

-- 1. Get active member from [StartDate] to [EndDate] with their tokens
-- Parameters: @StartDate, @EndDate
SELECT u."UserId", u."Name", u."Email", u."Role", u."TokenBalance", u."CreatedAt", u."LastLoginAt"
FROM users u
WHERE u."IsActive" = true and u."Role" = 'Member'
  AND u."CreatedAt" BETWEEN '2025-12-14' AND '2025-12-30' -- Replace with parameters
ORDER BY u."CreatedAt" DESC;

-- 2. Get user registrations by role from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
SELECT u."Role", 
       COUNT(*) as total_users,
       COUNT(CASE WHEN u."EmailVerified" = true THEN 1 END) as verified_users
FROM users u
WHERE u."CreatedAt" BETWEEN '2025-12-14' AND '2025-12-30' -- Replace with parameters
GROUP BY u."Role"
ORDER BY total_users DESC;

-- 3. Get all active members with subscription status from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
SELECT u."UserId", u."Name", u."Email", u."TokenBalance",
       mp."FitnessGoal", mp."FitnessLevel",
       sp."PlanName", us."Status" as subscription_status,us."StartDate", us."EndDate"
FROM users u
INNER JOIN member_profiles mp ON u."UserId" = mp."UserId"
LEFT JOIN user_subscriptions us ON u."UserId" = us."UserId" AND us."Status" = 0
LEFT JOIN subscription_plans sp ON us."PlanId" = sp."PlanId"
WHERE u."IsActive" = true
  AND us."StartDate" BETWEEN '2024-11-01' AND '2025-11-30' -- Replace with parameters
ORDER BY u."CreatedAt" DESC;


-- 4. Get all coaches with their performance metrics  
SELECT u."UserId" as coach_ID, u."Name" as coach_name, u."Email",
       cp."Specialization", cp."ExperienceYears", cp."HourlyRate",
       cp."Rating", cp."TotalReviews", cp."TotalClients"
FROM users u
INNER JOIN coach_profiles cp ON u."UserId" = cp."UserId"
WHERE u."IsActive" = true
ORDER BY cp."Rating" DESC, cp."TotalClients" DESC;

-- 5. Get members booking equipments history from [StartDate] to [EndDate]
SELECT b."UserId" ,e."EquipmentId", e."Name", ec."CategoryName", e."Status",
	   b."StartTime" ,b."EndTime"
FROM equipment e 
JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
LEFT JOIN bookings b ON e."EquipmentId" = b."EquipmentId"
  AND b."StartTime" BETWEEN '2025-01-01' AND '2025-12-31' -- Replace with parameters


-- ==========================================
-- SECTION 2: SUBSCRIPTION & REVENUE ANALYTICS (Admin)
-- ==========================================

-- 6. Get subscription revenue from [StartDate] to [EndDate] by plan
-- Parameters: @StartDate, @EndDate
SELECT sp."PlanName", sp."Price",
       COUNT(p."PaymentId") as paid_subscriptions,
       SUM(COALESCE(p."Amount", 0)) as total_revenue
FROM subscription_plans sp
LEFT JOIN user_subscriptions us ON sp."PlanId" = us."PlanId"
  AND us."CreatedAt"  BETWEEN '2025-12-14' AND '2025-12-30' -- Replace with parameters
LEFT JOIN payments p ON us."PaymentId" = p."PaymentId" AND p."Status" = 1
GROUP BY sp."PlanId", sp."PlanName", sp."Price"
ORDER BY total_revenue DESC;

-- 7. Get members with active subscriptions expiring from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate (for renewal reminders)
SELECT u."UserId", u."Name", u."Email", u."Phone",
       sp."PlanName", us."EndDate",
       us."EndDate" - CURRENT_DATE as days_remaining,
       us."AutoRenew"
FROM users u
JOIN user_subscriptions us ON u."UserId" = us."UserId"
JOIN subscription_plans sp ON us."PlanId" = sp."PlanId"
WHERE us."Status" = 0
  AND us."EndDate" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '16 days' -- Replace with parameters
ORDER BY us."EndDate";

-- 8. Get token usage analytics from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
SELECT u."UserId", u."Name", u."TokenBalance",
       COUNT(tt."TransactionId") as total_transactions,
       SUM(CASE WHEN tt."TransactionType" = 0 THEN tt."Amount" ELSE 0 END) as tokens_purchased,
       SUM(CASE WHEN tt."TransactionType" = 1 THEN ABS(tt."Amount") ELSE 0 END) as tokens_spent
FROM users u
LEFT JOIN token_transactions tt ON u."UserId" = tt."UserId"
  AND tt."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
WHERE u."Role" = 'Member'
GROUP BY u."UserId", u."Name", u."TokenBalance"
ORDER BY tokens_spent DESC;

-- ==========================================
-- SECTION 3: BOOKING & ATTENDANCE ANALYTICS (Receptionist/Admin)
-- ==========================================

-- 9. Get equipment availability and upcoming bookings
SELECT e."EquipmentId", e."Name" as equipment_name, ec."CategoryName", e."Location", e."Status",
       CASE 
           WHEN EXISTS (
               SELECT 1 FROM bookings b2 
               WHERE b2."EquipmentId" = e."EquipmentId" 
               AND b2."Status" IN (1, 2) 
               AND CURRENT_TIMESTAMP BETWEEN b2."StartTime" AND b2."EndTime"
           ) THEN 'Busy Now'
           WHEN e."Status" = 2 THEN 'Under Maintenance'
           ELSE 'Available Now'
       END as current_status,
       b."BookingId", u."Name" as booked_by, b."StartTime", b."EndTime"
FROM equipment e
JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
LEFT JOIN bookings b ON e."EquipmentId" = b."EquipmentId" 
    AND b."StartTime" >= CURRENT_TIMESTAMP
    AND b."Status" IN (0, 1)
LEFT JOIN users u ON b."UserId" = u."UserId"
WHERE e."IsActive" = true
ORDER BY e."Name", b."StartTime";

-- 10. Get member bookings from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
SELECT u."UserId", u."Name" as member_name, u."Email",
       b."BookingId", b."BookingType", b."StartTime", b."EndTime", b."Status",
       COALESCE(e."Name", coach_u."Name") as resource_name,
       b."TokensCost"
FROM bookings b
JOIN users u ON b."UserId" = u."UserId"
LEFT JOIN equipment e ON b."EquipmentId" = e."EquipmentId"
LEFT JOIN coach_profiles cp ON b."CoachId" = cp."Id"
LEFT JOIN users coach_u ON cp."UserId" = coach_u."UserId"
WHERE b."StartTime" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND b."Status" IN (1, 2, 3) -- Confirmed, InProgress, Completed
ORDER BY b."StartTime" DESC, u."Name";

-- 11. Get member workout logs from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
SELECT u."UserId", u."Name", wl."WorkoutDate",
       wl."DurationMinutes", wl."CaloriesBurned", 
       wl."ExercisesCompleted", wl."FeelingRating",
       wl."Notes", wl."Completed"
FROM users u
INNER JOIN member_profiles mp ON u."UserId" = mp."UserId"
INNER JOIN workout_logs wl ON u."UserId" = wl."UserId"
WHERE wl."WorkoutDate" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND u."IsActive" = true
ORDER BY wl."WorkoutDate" DESC, u."Name";

-- 12. Get inactive members from [LastActivityDate] to now (no activity in X days)
-- Parameters: @DaysSinceLastActivity
SELECT u."UserId", u."Name", u."Email", u."Phone",
       mp."FitnessGoal",
       MAX(GREATEST(
           COALESCE(wl."WorkoutDate", '1900-01-01'::timestamp),
           COALESCE(b."StartTime", '1900-01-01'::timestamp),
           u."LastLoginAt"
       )) as last_activity_date,
       CURRENT_DATE - DATE(MAX(GREATEST(
           COALESCE(wl."WorkoutDate", '1900-01-01'::timestamp),
           COALESCE(b."StartTime", '1900-01-01'::timestamp),
           u."LastLoginAt"
       ))) as days_inactive
FROM users u
INNER JOIN member_profiles mp ON u."UserId" = mp."UserId"
LEFT JOIN workout_logs wl ON u."UserId" = wl."UserId"
LEFT JOIN bookings b ON u."UserId" = b."UserId"
WHERE u."IsActive" = true
GROUP BY u."UserId", u."Name", u."Email", u."Phone", mp."FitnessGoal"
HAVING CURRENT_DATE - DATE(MAX(GREATEST(
    COALESCE(wl."WorkoutDate", '1900-01-01'::timestamp),
    COALESCE(b."StartTime", '1900-01-01'::timestamp),
    u."LastLoginAt"
))) > 30 -- Replace with parameter
ORDER BY days_inactive DESC;

-- 13. Get coach performance from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
SELECT u."UserId", u."Name" as coach_name,
       cp."Specialization", cp."Rating", cp."TotalClients",
       COUNT(b."BookingId") as sessions_conducted,
       COUNT(cr."ReviewId") as new_reviews,
       COALESCE(ROUND(AVG(cr."Rating"), 2), cp."Rating") as period_avg_rating,
       COUNT(DISTINCT wp."PlanId") as workout_plans_created,
       COUNT(DISTINCT np."PlanId") as nutrition_plans_created
FROM users u
INNER JOIN coach_profiles cp ON u."UserId" = cp."UserId"
LEFT JOIN bookings b ON cp."Id" = b."CoachId"
  AND b."StartTime" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND b."Status" = 3 -- Completed
LEFT JOIN coach_reviews cr ON cp."Id" = cr."CoachId"
  AND cr."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
LEFT JOIN workout_plans wp ON cp."Id" = wp."GeneratedByCoachId"
  AND wp."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
LEFT JOIN nutrition_plans np ON cp."Id" = np."GeneratedByCoachId"
  AND np."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
WHERE u."IsActive" = true
GROUP BY u."UserId", u."Name", cp."Specialization", cp."Rating", cp."TotalClients"
ORDER BY sessions_conducted DESC;

-- ==========================================
-- SECTION 4: EQUIPMENT & MAINTENANCE (Receptionist/Admin)
-- ==========================================

-- 14. Get equipment availability status
SELECT e."EquipmentId", e."Name", ec."CategoryName", e."Location", e."Status",
       e."ConditionRating", e."LastMaintenanceDate", e."NextMaintenanceDate",
       CURRENT_DATE - e."LastMaintenanceDate" as days_since_maintenance,
       e."NextMaintenanceDate" - CURRENT_DATE as days_until_maintenance
FROM equipment e
JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
WHERE e."IsActive" = true
ORDER BY e."NextMaintenanceDate", e."Name";

-- 15. Get equipment requiring maintenance soon (within [Days] days)
-- Parameters: @DaysAhead
SELECT e."EquipmentId", e."Name", ec."CategoryName", e."Location",
       e."Status", e."LastMaintenanceDate", e."NextMaintenanceDate",
       e."NextMaintenanceDate" - CURRENT_DATE as days_until_maintenance
FROM equipment e
JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
WHERE e."NextMaintenanceDate" <= CURRENT_DATE + INTERVAL '14 days' -- Replace with parameter
   OR e."Status" = 2 -- Under Maintenance
ORDER BY e."NextMaintenanceDate";

-- 16. Get equipment bookings by machine in each category from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
SELECT ec."CategoryName",
       e."EquipmentId", e."Name" as equipment_name, e."Location",
       COUNT(b."BookingId") as total_bookings,
       ROUND(AVG(EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/60), 0) as avg_duration_minutes
FROM equipment_categories ec
JOIN equipment e ON ec."CategoryId" = e."CategoryId"
LEFT JOIN bookings b ON e."EquipmentId" = b."EquipmentId"
  AND b."StartTime" BETWEEN '2025-01-01' AND '2025-12-31' -- Replace with parameters
  AND b."BookingType" = 'Equipment'
WHERE e."IsActive" = true
GROUP BY ec."CategoryName", e."EquipmentId", e."Name", e."Location"
ORDER BY ec."CategoryName", total_bookings DESC;

-- ==========================================
-- SECTION 5: AI USAGE & TOKEN ANALYTICS (Admin)
-- ==========================================

-- 17. Get AI generated workout and nutrition plan details from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
SELECT ag."ProgramType", u."UserId", u."Name" as member_name,
       COALESCE(wp."PlanName", np."PlanName") as plan_name,
       COALESCE(wp."Description", np."Description") as plan_description,
       COALESCE(wp."DurationWeeks"::text, np."DailyCalories"::text || ' cal') as plan_details,
       COALESCE(wp."DifficultyLevel", np."PlanType") as plan_type,
       COALESCE(wp."Status", np."Status") as status,
       ag."TokensUsed", ag."CreatedAt"
FROM ai_program_generations ag
JOIN users u ON ag."UserId" = u."UserId"
LEFT JOIN workout_plans wp ON ag."ProgramType" = 'WorkoutPlan' 
    AND wp."UserId" = ag."UserId"
LEFT JOIN nutrition_plans np ON ag."ProgramType" = 'NutritionPlan' 
    AND np."UserId" = ag."UserId"
WHERE ag."CreatedAt" >= '2024-01-01' -- Replace with parameters
  AND ag."ProgramType" IN ('WorkoutPlan', 'NutritionPlan')
ORDER BY ag."CreatedAt" DESC;

-- 18. Get members with highest AI usage from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
SELECT u."UserId", u."Name", u."Email",
       COUNT(ag."GenerationId") as ai_generations,
       SUM(ag."TokensUsed") as tokens_consumed,
       COUNT(acl."ChatId") as chat_messages,
       SUM(acl."TokensUsed") as chat_tokens
FROM users u
INNER JOIN member_profiles mp ON u."UserId" = mp."UserId"
LEFT JOIN ai_program_generations ag ON u."UserId" = ag."UserId"
  AND ag."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
LEFT JOIN ai_chat_logs acl ON u."UserId" = acl."UserId"
  AND acl."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
GROUP BY u."UserId", u."Name", u."Email"
HAVING COUNT(ag."GenerationId") > 0 OR COUNT(acl."ChatId") > 0
ORDER BY tokens_consumed DESC;

-- ==========================================
-- SECTION 6: NOTIFICATIONS & MEMBER ENGAGEMENT (Receptionist/Admin)
-- ==========================================

-- 19. Get members needing attention (expiring subscriptions, inactive, low tokens)
-- For proactive member retention
-- Parameters: @DaysUntilExpiry, @MinTokenBalance, @InactiveDays
SELECT u."UserId", u."Name", u."Email", u."Phone", u."TokenBalance",
       us."EndDate" as subscription_end,
       CONCAT_WS(', ',
           CASE WHEN us."EndDate" <= CURRENT_DATE + INTERVAL '7 days' AND us."EndDate" IS NOT NULL 
                THEN 'Subscription Expiring Soon' END,
           CASE WHEN u."TokenBalance" < 50 THEN 'Low Token Balance' END,
           CASE WHEN u."LastLoginAt" IS NULL OR u."LastLoginAt" < CURRENT_DATE - INTERVAL '7 days' 
                THEN 'Inactive Member' END
       ) as attention_reasons,
       u."LastLoginAt",
       CASE WHEN u."LastLoginAt" IS NOT NULL 
            THEN CURRENT_DATE - DATE(u."LastLoginAt") 
            ELSE NULL END as days_since_login
FROM users u
INNER JOIN member_profiles mp ON u."UserId" = mp."UserId"
LEFT JOIN user_subscriptions us ON u."UserId" = us."UserId" AND us."Status" = 0
WHERE u."IsActive" = true
  AND u."Role" = 'Member'
  AND (
      (us."EndDate" IS NOT NULL AND us."EndDate" <= CURRENT_DATE + INTERVAL '7 days')
      OR u."TokenBalance" < 50
      OR u."LastLoginAt" IS NULL
      OR u."LastLoginAt" < CURRENT_DATE - INTERVAL '7 days'
  )
ORDER BY u."TokenBalance", u."LastLoginAt" NULLS FIRST, us."EndDate" NULLS LAST;

-- 20. Get milestone achievements from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
SELECT pm."MilestoneName", pm."Category",
       COUNT(um."UserMilestoneId") as times_achieved,
       COUNT(DISTINCT um."UserId") as unique_achievers
FROM progress_milestones pm
LEFT JOIN user_milestones um ON pm."MilestoneId" = um."MilestoneId"
  AND um."CompletedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND um."IsCompleted" = true
WHERE pm."IsActive" = true
GROUP BY pm."MilestoneId", pm."MilestoneName", pm."Category"
ORDER BY times_achieved DESC;

-- ==========================================
-- SECTION 7: COMPREHENSIVE DASHBOARD QUERIES (Admin)
-- ==========================================

-- 21. Get overall gym statistics from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate - Executive Summary Dashboard
SELECT 
    (SELECT COUNT(*) FROM users WHERE "IsActive" = true AND "Role" = 'Member') as total_active_members,
    (SELECT COUNT(*) FROM users WHERE "Role" = 'Coach' AND "IsActive" = true) as total_coaches,
    (SELECT COUNT(*) FROM user_subscriptions WHERE "Status" = 0 AND "EndDate" >= CURRENT_DATE) as active_subscriptions,
    (SELECT SUM("Amount") FROM payments WHERE "Status" = 1 
        AND "CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31') as total_revenue, -- Replace with parameters
    (SELECT COUNT(*) FROM bookings WHERE "Status" = 3 
        AND "StartTime" BETWEEN '2024-01-01' AND '2024-12-31') as completed_bookings, -- Replace with parameters
    (SELECT COUNT(DISTINCT "UserId") FROM workout_logs 
        WHERE "WorkoutDate" BETWEEN '2024-01-01' AND '2024-12-31') as active_workout_members, -- Replace with parameters
    (SELECT SUM("TokensUsed") FROM ai_program_generations 
        WHERE "CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31') as total_ai_tokens_used; -- Replace with parameters

-- 22. Get peak hours analysis from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
SELECT 
    EXTRACT(HOUR FROM b."StartTime") as hour_of_day,
    COUNT(b."BookingId") as total_bookings,
    COUNT(DISTINCT b."UserId") as unique_members,
    ROUND(AVG(EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/60), 0) as avg_duration_minutes
FROM bookings b
WHERE b."StartTime" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND b."Status" IN (2, 3) -- InProgress or Completed
GROUP BY EXTRACT(HOUR FROM b."StartTime")
ORDER BY hour_of_day;

-- 23. Get member retention rate from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
WITH member_cohorts AS (
    SELECT 
        DATE_TRUNC('month', u."CreatedAt") as cohort_month,
        COUNT(*) as cohort_size,
        COUNT(CASE WHEN u."LastLoginAt" >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as still_active
    FROM users u
    INNER JOIN member_profiles mp ON u."UserId" = mp."UserId"
    WHERE u."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
    GROUP BY DATE_TRUNC('month', u."CreatedAt")
)
SELECT 
    cohort_month,
    cohort_size,
    still_active,
    ROUND((still_active::numeric / NULLIF(cohort_size, 0)) * 100, 2) as retention_rate_percent
FROM member_cohorts
ORDER BY cohort_month DESC;

-- 24. Get top performing members from [StartDate] to [EndDate] (for recognition)
-- Parameters: @StartDate, @EndDate
SELECT u."UserId", u."Name", u."Email",
       COUNT(DISTINCT DATE(wl."WorkoutDate")) as workout_days,
       SUM(wl."CaloriesBurned") as total_calories,
       COUNT(um."UserMilestoneId") as milestones_achieved,
       mp."TotalWorkoutsCompleted",
       ROUND(AVG(wl."FeelingRating"), 2) as avg_satisfaction
FROM users u
INNER JOIN member_profiles mp ON u."UserId" = mp."UserId"
LEFT JOIN workout_logs wl ON u."UserId" = wl."UserId"
  AND wl."WorkoutDate" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
LEFT JOIN user_milestones um ON u."UserId" = um."UserId"
  AND um."CompletedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND um."IsCompleted" = true
WHERE u."IsActive" = true
GROUP BY u."UserId", u."Name", u."Email", mp."TotalWorkoutsCompleted"
ORDER BY workout_days DESC, total_calories DESC
LIMIT 20;

-- ==========================================
-- SECTION 8: MEMBER SEARCH & FILTERING (Receptionist/Admin)
-- ==========================================

-- 25. Search members by name, email, or phone (fuzzy search)
-- Parameters: @SearchTerm
-- Use case: Quick member lookup at reception desk or admin panel
SELECT u."UserId", u."Name", u."Email", u."Phone", u."TokenBalance",
       mp."FitnessGoal", mp."FitnessLevel", mp."Age", mp."Weight", mp."Height",
       us."EndDate" as subscription_end, sp."PlanName",
       u."LastLoginAt", u."CreatedAt"
FROM users u
INNER JOIN member_profiles mp ON u."UserId" = mp."UserId"
LEFT JOIN user_subscriptions us ON u."UserId" = us."UserId" AND us."Status" = 0
LEFT JOIN subscription_plans sp ON us."PlanId" = sp."PlanId"
WHERE u."IsActive" = true
  AND u."Role" = 'Member'
  AND (
      LOWER(u."Name") LIKE LOWER('%john%') -- Replace with parameter
      OR LOWER(u."Email") LIKE LOWER('%john%')
      OR u."Phone" LIKE '%john%'
  )
ORDER BY u."Name";

-- 26. Filter members by fitness goal and level with workout history
-- Parameters: @FitnessGoal, @FitnessLevel
-- Use case: Group members for targeted programs or class recommendations
SELECT u."UserId", u."Name", u."Email", u."Phone",
       mp."FitnessGoal", mp."FitnessLevel", mp."TotalWorkoutsCompleted",
       mp."Height",
       COUNT(DISTINCT DATE(wl."WorkoutDate")) as workout_days_last_month,
       AVG(wl."FeelingRating") as avg_satisfaction
FROM users u
INNER JOIN member_profiles mp ON u."UserId" = mp."UserId"
LEFT JOIN workout_logs wl ON u."UserId" = wl."UserId"
  AND wl."WorkoutDate" >= CURRENT_DATE - INTERVAL '30 days'
WHERE u."IsActive" = true
  AND mp."FitnessGoal" = 'Weight Loss' -- Replace with parameter: 'Weight Loss', 'Muscle Gain', 'Endurance', etc.
  AND mp."FitnessLevel" = 'Beginner' -- Replace with parameter: 'Beginner', 'Intermediate', 'Advanced'
GROUP BY u."UserId", u."Name", u."Email", u."Phone", mp."FitnessGoal", mp."FitnessLevel", 
         mp."TotalWorkoutsCompleted", mp."Height"
ORDER BY mp."TotalWorkoutsCompleted" DESC;

-- 27. Filter coaches by specialization, rating, and availability
-- Parameters: @Specialization, @MinRating, @MinAvailableSlots
-- Use case: Help members find suitable coaches for booking sessions
SELECT u."UserId", u."Name", u."Email", u."Phone",
       cp."Specialization", cp."ExperienceYears", cp."HourlyRate",
       cp."Rating", cp."TotalReviews", cp."TotalClients",
       cp."Bio", cp."Certifications",
       COUNT(b."BookingId") as upcoming_bookings,
       (SELECT COUNT(*) FROM coach_reviews cr2 WHERE cr2."CoachId" = cp."Id" 
        AND cr2."Rating" >= 4) as positive_reviews
FROM users u
INNER JOIN coach_profiles cp ON u."UserId" = cp."UserId"
LEFT JOIN bookings b ON cp."Id" = b."CoachId" 
  AND b."StartTime" >= CURRENT_TIMESTAMP
  AND b."Status" IN (0, 1)
WHERE u."IsActive" = true
  AND cp."Specialization" = 'Strength Training' -- Replace: 'Strength Training', 'Cardio', 'Yoga', 'CrossFit'
  AND cp."Rating" >= 4.5 -- Replace with parameter
GROUP BY u."UserId", u."Name", u."Email", u."Phone", cp."Specialization", 
         cp."ExperienceYears", cp."HourlyRate", cp."Rating", cp."TotalReviews", 
         cp."TotalClients", cp."Bio", cp."Certifications", cp."Id"
ORDER BY cp."Rating" DESC, cp."TotalClients" DESC;

-- 28. Filter equipment by category, location, status, and condition
-- Parameters: @CategoryId, @Location, @Status, @MinConditionRating
-- Use case: Equipment maintenance planning and member equipment recommendations
SELECT e."EquipmentId", e."Name", ec."CategoryName", e."Location",
       e."Status", e."ConditionRating", e."LastMaintenanceDate", e."NextMaintenanceDate",
       CURRENT_DATE - e."LastMaintenanceDate" as days_since_maintenance,
       COUNT(b."BookingId") as bookings_this_week
FROM equipment e
JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
LEFT JOIN bookings b ON e."EquipmentId" = b."EquipmentId"
  AND b."StartTime" >= CURRENT_DATE - INTERVAL '7 days'
  AND b."Status" IN (2, 3)
WHERE e."IsActive" = true
  AND ec."CategoryId" = 1 -- Replace: Cardio=1, Strength=2, Functional=3, etc.
  AND e."Location" = 'Ground Floor' -- Replace with parameter (optional)
  AND e."Status" = 1 -- Replace: 0=Inactive, 1=Active, 2=UnderMaintenance
  AND e."ConditionRating" >= 7 -- Replace with parameter (scale 1-10)
GROUP BY e."EquipmentId", e."Name", ec."CategoryName", e."Location", e."Status", 
         e."ConditionRating", e."LastMaintenanceDate", e."NextMaintenanceDate"
ORDER BY e."Name";

-- 29. Get detailed member booking history with filters
-- Parameters: @UserId, @StartDate, @EndDate, @BookingType, @Status
-- Use case: Track individual member booking patterns and resource usage
SELECT u."UserId", u."Name" as member_name, u."Email", u."TokenBalance",
       b."BookingId", b."BookingType", b."StartTime", b."EndTime", b."Status", b."TokensCost",
       EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/60 as duration_minutes,
       COALESCE(e."Name", coach_u."Name") as resource_name,
       COALESCE(ec."CategoryName", cp."Specialization") as category_spec,
       COALESCE(e."Location", 'Coach Session') as location
FROM users u
JOIN bookings b ON u."UserId" = b."UserId"
LEFT JOIN equipment e ON b."EquipmentId" = e."EquipmentId"
LEFT JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
LEFT JOIN coach_profiles cp ON b."CoachId" = cp."Id"
LEFT JOIN users coach_u ON cp."UserId" = coach_u."UserId"
WHERE u."UserId" = 1 -- Replace with parameter
  AND b."StartTime" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND b."BookingType" = 'Equipment' -- Replace with parameter (optional): 'Equipment', 'Coach', or NULL for all
  AND b."Status" = 3 -- Replace: 0=Pending, 1=Confirmed, 2=InProgress, 3=Completed, 4=Cancelled
ORDER BY b."StartTime" DESC;

-- 30. Filter subscription plans by price range, duration, and availability
-- Parameters: @MinPrice, @MaxPrice, @MinDurationDays, @MaxDurationDays
-- Use case: Help members choose appropriate subscription plans
SELECT sp."PlanId", sp."PlanName", sp."Description",
       sp."Price", sp."DurationDays", sp."TokensIncluded",
       sp."MaxMembersAllowed", sp."CreatedAt",
       COUNT(us."SubscriptionId") as active_subscribers,
       sp."MaxMembersAllowed" - COUNT(us."SubscriptionId") as available_slots,
       ROUND((COUNT(us."SubscriptionId")::numeric / NULLIF(sp."MaxMembersAllowed", 0)) * 100, 2) as occupancy_percent
FROM subscription_plans sp
LEFT JOIN user_subscriptions us ON sp."PlanId" = us."PlanId" AND us."Status" = 0
WHERE sp."IsActive" = true
  AND sp."Price" BETWEEN 50 AND 200 -- Replace with parameters
  AND sp."DurationDays" BETWEEN 30 AND 365 -- Replace with parameters
GROUP BY sp."PlanId", sp."PlanName", sp."Description", sp."Price", sp."DurationDays", 
         sp."TokensIncluded", sp."MaxMembersAllowed", sp."CreatedAt"
HAVING sp."MaxMembersAllowed" - COUNT(us."SubscriptionId") > 0 -- Only show plans with available slots
ORDER BY sp."Price";

-- ==========================================
-- SECTION 9: WORKOUT & NUTRITION PLAN FILTERING (Coach/Member)
-- ==========================================

-- 31. Search workout plans by difficulty, target muscles, and status
-- Parameters: @DifficultyLevel, @TargetMuscleGroups, @Status, @StartDate, @EndDate
-- Use case: Find suitable workout plans for member assignment or modification
SELECT wp."PlanId", wp."PlanName", wp."Description",
       wp."DifficultyLevel", wp."DurationWeeks", wp."Status", wp."TargetMuscleGroups",
       wp."WorkoutsPerWeek", wp."CreatedAt",
       u."Name" as member_name, u."Email",
       coach_u."Name" as coach_name,
       COUNT(DISTINCT we."ExerciseId") as total_exercises
FROM workout_plans wp
JOIN users u ON wp."UserId" = u."UserId"
LEFT JOIN coach_profiles cp ON wp."GeneratedByCoachId" = cp."Id"
LEFT JOIN users coach_u ON cp."UserId" = coach_u."UserId"
LEFT JOIN workout_exercises we ON wp."PlanId" = we."PlanId"
WHERE wp."DifficultyLevel" = 'Intermediate' -- Replace: 'Beginner', 'Intermediate', 'Advanced'
  AND wp."TargetMuscleGroups" LIKE '%Chest%' -- Replace with parameter
  AND wp."Status" = 1 -- Replace: 0=Draft, 1=Active, 2=Completed, 3=Archived
  AND wp."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
GROUP BY wp."PlanId", wp."PlanName", wp."Description", wp."DifficultyLevel", wp."DurationWeeks", 
         wp."Status", wp."TargetMuscleGroups", wp."WorkoutsPerWeek", wp."CreatedAt", 
         u."Name", u."Email", coach_u."Name"
ORDER BY wp."CreatedAt" DESC;

-- 32. Filter nutrition plans by type, calorie range, and macros
-- Parameters: @PlanType, @MinCalories, @MaxCalories, @MinProtein, @MaxProtein
-- Use case: Match nutrition plans to member dietary goals and requirements
SELECT np."PlanId", np."PlanName", np."Description",
       np."PlanType", np."DailyCalories", np."ProteinGrams",
       np."CarbsGrams", np."FatsGrams", np."Status", np."CreatedAt",
       u."Name" as member_name, u."Email",
       coach_u."Name" as coach_name,
       mp."FitnessGoal", mp."Weight", mp."Height"
FROM nutrition_plans np
JOIN users u ON np."UserId" = u."UserId"
JOIN member_profiles mp ON u."UserId" = mp."UserId"
LEFT JOIN coach_profiles cp ON np."GeneratedByCoachId" = cp."Id"
LEFT JOIN users coach_u ON cp."UserId" = coach_u."UserId"
WHERE np."PlanType" = 'Weight Loss' -- Replace: 'Weight Loss', 'Muscle Gain', 'Maintenance', 'Keto', 'Vegan'
  AND np."DailyCalories" BETWEEN 1500 AND 2000 -- Replace with parameters
  AND np."ProteinGrams" BETWEEN 100 AND 150 -- Replace with parameters (optional)
  AND np."Status" = 1 -- Replace: 0=Draft, 1=Active, 2=Completed, 3=Archived
ORDER BY np."CreatedAt" DESC;

-- ==========================================
-- SECTION 10: PAYMENT & TRANSACTION ANALYTICS (Admin/Finance)
-- ==========================================

-- 33. Get detailed payments by status, method, and date range
-- Parameters: @Status, @PaymentMethod, @StartDate, @EndDate, @MinAmount
-- Use case: Financial reporting, reconciliation, and fraud detection
SELECT p."PaymentId", p."Amount", p."PaymentMethod", p."Status",
       p."TransactionId", p."CreatedAt", p."UpdatedAt",
       u."UserId", u."Name" as member_name, u."Email", u."Phone",
       us."PlanId", sp."PlanName",
       CASE p."Status"
           WHEN 0 THEN 'Pending'
           WHEN 1 THEN 'Completed'
           WHEN 2 THEN 'Failed'
           WHEN 3 THEN 'Refunded'
       END as status_text
FROM payments p
JOIN users u ON p."UserId" = u."UserId"
LEFT JOIN user_subscriptions us ON p."PaymentId" = us."PaymentId"
LEFT JOIN subscription_plans sp ON us."PlanId" = sp."PlanId"
WHERE p."Status" = 1 -- Replace: 0=Pending, 1=Completed, 2=Failed, 3=Refunded
  AND p."PaymentMethod" = 'CreditCard' -- Replace: 'CreditCard', 'Cash', 'BankTransfer', 'Wallet'
  AND p."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND p."Amount" >= 0 -- Replace with minimum amount filter
ORDER BY p."CreatedAt" DESC;

-- 34. Filter token transactions with detailed breakdown
-- Parameters: @TransactionType, @MinAmount, @MaxAmount, @StartDate, @EndDate, @UserId
-- Use case: Track token economy, identify spending patterns, detect anomalies
SELECT tt."TransactionId", tt."Amount", tt."TransactionType",
       tt."Description", tt."CreatedAt",
       u."UserId", u."Name", u."Email", u."TokenBalance",
       CASE tt."TransactionType"
           WHEN 0 THEN 'Purchase'
           WHEN 1 THEN 'Booking'
           WHEN 2 THEN 'Refund'
           WHEN 3 THEN 'Expiry'
           WHEN 4 THEN 'Bonus'
       END as transaction_type_text,
       ABS(tt."Amount") as absolute_amount,
       CASE WHEN tt."Amount" > 0 THEN 'Credit' ELSE 'Debit' END as transaction_direction
FROM token_transactions tt
JOIN users u ON tt."UserId" = u."UserId"
WHERE tt."TransactionType" = 0 -- Replace: 0=Purchase, 1=Booking, 2=Refund, 3=Expiry, 4=Bonus
  AND ABS(tt."Amount") BETWEEN 10 AND 100 -- Replace with parameters
  AND tt."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND (u."UserId" = 0 OR 0 = 0) -- Replace first 0 with @UserId, second 0 to disable filter
ORDER BY tt."CreatedAt" DESC;

-- ==========================================
-- SECTION 11: REVIEW & FEEDBACK ANALYTICS (Admin/Coach)
-- ==========================================

-- 35. Get coach reviews filtered by rating, date, and coach
-- Parameters: @CoachId, @MinRating, @StartDate, @EndDate
-- Use case: Monitor coach performance, identify improvement areas, showcase testimonials
SELECT cr."ReviewId", cr."Rating", cr."ReviewText", cr."CreatedAt",
       u."Name" as member_name, u."Email",
       mp."FitnessGoal", mp."FitnessLevel",
       coach_u."Name" as coach_name, cp."Specialization",
       b."BookingId", b."StartTime" as session_date,
       CASE 
           WHEN cr."Rating" >= 4 THEN 'Positive'
           WHEN cr."Rating" = 3 THEN 'Neutral'
           ELSE 'Needs Attention'
       END as sentiment
FROM coach_reviews cr
JOIN users u ON cr."UserId" = u."UserId"
JOIN member_profiles mp ON u."UserId" = mp."UserId"
JOIN coach_profiles cp ON cr."CoachId" = cp."Id"
JOIN users coach_u ON cp."UserId" = coach_u."UserId"
LEFT JOIN bookings b ON cr."BookingId" = b."BookingId"
WHERE cr."CoachId" = 1 -- Replace with parameter (0 for all coaches)
  AND cr."Rating" >= 4 -- Replace with parameter (1-5 scale)
  AND cr."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
ORDER BY cr."CreatedAt" DESC;

-- 36. Filter members by subscription status, token balance, and activity level
-- Parameters: @SubscriptionStatus, @MinTokens, @MaxTokens, @MinWorkouts, @StartDate
-- Use case: Identify at-risk members, target marketing campaigns, retention efforts
SELECT u."UserId", u."Name", u."Email", u."Phone", u."TokenBalance", u."CreatedAt",
       us."Status" as subscription_status, us."StartDate", us."EndDate",
       us."AutoRenew", sp."PlanName", sp."Price",
       mp."FitnessGoal", mp."TotalWorkoutsCompleted",
       COUNT(DISTINCT wl."LogId") as workouts_in_period,
       u."EndDate" - CURRENT_DATE as days_until_expiry,
       CASE 
           WHEN u."TokenBalance" < 20 THEN 'Critical'
           WHEN u."TokenBalance" < 50 THEN 'Low'
           ELSE 'Adequate'
       END as token_status
FROM users u
INNER JOIN member_profiles mp ON u."UserId" = mp."UserId"
LEFT JOIN user_subscriptions us ON u."UserId" = us."UserId" AND us."Status" = 0
LEFT JOIN subscription_plans sp ON us."PlanId" = sp."PlanId"
LEFT JOIN workout_logs wl ON u."UserId" = wl."UserId"
  AND wl."WorkoutDate" >= '2024-01-01' -- Replace with @StartDate
WHERE u."IsActive" = true
  AND u."Role" = 'Member'
  AND us."Status" = 0 -- Replace: 0=Active, 1=Expired, 2=Cancelled, 3=Suspended
  AND u."TokenBalance" BETWEEN 0 AND 50 -- Replace with parameters
  AND mp."TotalWorkoutsCompleted" >= 0 -- Replace with @MinWorkouts
GROUP BY u."UserId", u."Name", u."Email", u."Phone", u."TokenBalance", u."CreatedAt",
         us."Status", us."StartDate", us."EndDate", us."AutoRenew", sp."PlanName", sp."Price",
         mp."FitnessGoal", mp."TotalWorkoutsCompleted"
ORDER BY u."TokenBalance" ASC, days_until_expiry;

-- 37. Get workout logs filtered by completion, feeling, and performance metrics
-- Parameters: @UserId, @Completed, @MinFeelingRating, @MinCalories, @StartDate, @EndDate
-- Use case: Track member progress, identify struggling members, celebrate achievements
SELECT wl."LogId", wl."WorkoutDate", wl."DurationMinutes",
       wl."CaloriesBurned", wl."ExercisesCompleted", wl."FeelingRating",
       wl."Notes", wl."Completed", wl."CreatedAt",
       u."Name" as member_name, u."Email",
       mp."FitnessGoal", mp."FitnessLevel", mp."Weight",
       wp."PlanName" as workout_plan,
       CASE 
           WHEN wl."FeelingRating" >= 4 THEN 'Excellent Session'
           WHEN wl."FeelingRating" = 3 THEN 'Good Session'
           ELSE 'Challenging Session'
       END as session_quality
FROM workout_logs wl
JOIN users u ON wl."UserId" = u."UserId"
JOIN member_profiles mp ON u."UserId" = mp."UserId"
LEFT JOIN workout_plans wp ON wl."PlanId" = wp."PlanId"
WHERE wl."UserId" = 1 -- Replace with parameter (0 for all members)
  AND wl."Completed" = true -- Replace with parameter
  AND wl."FeelingRating" >= 4 -- Replace with parameter (1-5 scale)
  AND wl."CaloriesBurned" >= 0 -- Replace with @MinCalories parameter
  AND wl."WorkoutDate" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
ORDER BY wl."WorkoutDate" DESC;

-- 38. Filter AI chat logs with token usage and content analysis
-- Parameters: @UserId, @MinTokensUsed, @StartDate, @EndDate
-- Use case: Monitor AI system usage, identify heavy users, track support needs
SELECT acl."ChatId", acl."MessageContent", acl."ResponseContent",
       acl."TokensUsed", acl."CreatedAt",
       u."Name" as member_name, u."Email", u."TokenBalance",
       mp."FitnessGoal", mp."FitnessLevel",
       LENGTH(acl."MessageContent") as message_length,
       LENGTH(acl."ResponseContent") as response_length,
       CASE 
           WHEN acl."TokensUsed" > 500 THEN 'High Usage'
           WHEN acl."TokensUsed" > 200 THEN 'Medium Usage'
           ELSE 'Low Usage'
       END as usage_category
FROM ai_chat_logs acl
JOIN users u ON acl."UserId" = u."UserId"
JOIN member_profiles mp ON u."UserId" = mp."UserId"
WHERE acl."UserId" = 1 -- Replace with parameter (0 for all users)
  AND acl."TokensUsed" >= 0 -- Replace with @MinTokensUsed parameter
  AND acl."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
ORDER BY acl."CreatedAt" DESC
LIMIT 100;

-- 39. Get user milestones filtered by category, completion, and progress
-- Parameters: @UserId, @Category, @IsCompleted, @MinProgress
-- Use case: Track member achievements, motivate members, identify goals
SELECT um."UserMilestoneId", um."Progress", um."IsCompleted", um."CompletedAt", um."CreatedAt",
       pm."MilestoneName", pm."Description", pm."Category",
       pm."TargetValue", pm."Unit", pm."TokenReward",
       u."Name" as member_name, u."Email", u."TokenBalance",
       mp."FitnessGoal",
       ROUND((um."Progress" / NULLIF(pm."TargetValue", 0)) * 100, 2) as completion_percent,
       CASE 
           WHEN um."IsCompleted" THEN 'Achieved'
           WHEN um."Progress" >= pm."TargetValue" * 0.75 THEN 'Almost There'
           WHEN um."Progress" >= pm."TargetValue" * 0.50 THEN 'Halfway'
           ELSE 'Just Started'
       END as progress_status
FROM user_milestones um
JOIN progress_milestones pm ON um."MilestoneId" = pm."MilestoneId"
JOIN users u ON um."UserId" = u."UserId"
JOIN member_profiles mp ON u."UserId" = mp."UserId"
WHERE um."UserId" = 1 -- Replace with parameter (0 for all users)
  AND pm."Category" = 'Workout' -- Replace: 'Workout', 'Nutrition', 'Weight', 'Attendance'
  AND um."IsCompleted" = true -- Replace with parameter
  AND um."Progress" >= 0 -- Replace with @MinProgress parameter
ORDER BY um."CompletedAt" DESC NULLS LAST, um."Progress" DESC;

ORDER BY um."CompletedAt" DESC NULLS LAST, um."Progress" DESC;

-- ==========================================
-- SECTION 12: COMPARATIVE & TREND ANALYSIS (Admin/Coach)
-- ==========================================

-- 40. Compare member progress between two time periods with detailed metrics
-- Parameters: @UserId, @Period1Start, @Period1End, @Period2Start, @Period2End
-- Use case: Track member improvement, validate training effectiveness, adjust programs
WITH period1 AS (
    SELECT 
        u."UserId", u."Name",
        COUNT(wl."LogId") as workouts,
        COALESCE(SUM(wl."CaloriesBurned"), 0) as calories,
        COALESCE(AVG(wl."FeelingRating"), 0) as avg_feeling,
        COALESCE(SUM(wl."DurationMinutes"), 0) as total_minutes,
        mp."Weight" as weight_start
    FROM users u
    JOIN member_profiles mp ON u."UserId" = mp."UserId"
    LEFT JOIN workout_logs wl ON u."UserId" = wl."UserId"
      AND wl."WorkoutDate" BETWEEN '2024-01-01' AND '2024-03-31' -- Replace Period 1 parameters
    WHERE u."UserId" = 1 -- Replace with parameter
    GROUP BY u."UserId", u."Name", mp."Weight"
),
period2 AS (
    SELECT 
        u."UserId",
        COUNT(wl."LogId") as workouts,
        COALESCE(SUM(wl."CaloriesBurned"), 0) as calories,
        COALESCE(AVG(wl."FeelingRating"), 0) as avg_feeling,
        COALESCE(SUM(wl."DurationMinutes"), 0) as total_minutes,
        mp."Weight" as weight_end
    FROM users u
    JOIN member_profiles mp ON u."UserId" = mp."UserId"
    LEFT JOIN workout_logs wl ON u."UserId" = wl."UserId"
      AND wl."WorkoutDate" BETWEEN '2024-04-01' AND '2024-06-30' -- Replace Period 2 parameters
    WHERE u."UserId" = 1 -- Replace with parameter
    GROUP BY u."UserId", mp."Weight"
)
SELECT 
    p1."UserId", p1."Name",
    'Q1 2024' as period, p1.workouts, p1.calories, ROUND(p1.avg_feeling, 2) as avg_feeling,
    p1.total_minutes, p1.weight_start as weight
FROM period1 p1
UNION ALL
SELECT 
    p2."UserId", p1."Name",
    'Q2 2024' as period, p2.workouts, p2.calories, ROUND(p2.avg_feeling, 2) as avg_feeling,
    p2.total_minutes, p2.weight_end as weight
FROM period2 p2
JOIN period1 p1 ON p2."UserId" = p1."UserId"
ORDER BY period;

-- 41. Get equipment usage statistics by time of day with utilization rates
-- Parameters: @StartDate, @EndDate, @CategoryId
-- Use case: Optimize gym hours, staff scheduling, equipment acquisition planning
SELECT 
    CASE 
        WHEN EXTRACT(HOUR FROM b."StartTime") BETWEEN 6 AND 11 THEN 'Morning (6-11AM)'
        WHEN EXTRACT(HOUR FROM b."StartTime") BETWEEN 12 AND 17 THEN 'Afternoon (12-5PM)'
        WHEN EXTRACT(HOUR FROM b."StartTime") BETWEEN 18 AND 22 THEN 'Evening (6-10PM)'
        ELSE 'Night/Early Morning'
    END as time_slot,
    ec."CategoryName",
    COUNT(b."BookingId") as total_bookings,
    COUNT(DISTINCT b."UserId") as unique_users,
    COUNT(DISTINCT b."EquipmentId") as equipment_used,
    ROUND(AVG(EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/60), 0) as avg_duration_minutes,
    SUM(b."TokensCost") as total_tokens_spent
FROM bookings b
JOIN equipment e ON b."EquipmentId" = e."EquipmentId"
JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
WHERE b."BookingType" = 'Equipment'
  AND b."StartTime" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND b."Status" IN (2, 3) -- InProgress or Completed
  AND (ec."CategoryId" = 0 OR 0 = 0) -- Replace first 0 with @CategoryId, second to disable
GROUP BY time_slot, ec."CategoryName"
ORDER BY ec."CategoryName", total_bookings DESC;

-- 42. Get coach booking trends by day of week with revenue analysis
-- Parameters: @CoachId, @StartDate, @EndDate
-- Use case: Optimize coach schedules, predict busy days, revenue forecasting
SELECT 
    TO_CHAR(b."StartTime", 'Day') as day_of_week,
    EXTRACT(DOW FROM b."StartTime") as day_number,
    coach_u."Name" as coach_name,
    cp."Specialization",
    COUNT(b."BookingId") as total_sessions,
    COUNT(DISTINCT b."UserId") as unique_clients,
    ROUND(AVG(EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/60), 0) as avg_duration_minutes,
    SUM(b."TokensCost") as total_tokens_earned,
    ROUND(AVG(b."TokensCost"), 2) as avg_tokens_per_session
FROM bookings b
JOIN coach_profiles cp ON b."CoachId" = cp."Id"
JOIN users coach_u ON cp."UserId" = coach_u."UserId"
WHERE b."BookingType" = 'Coach'
  AND (cp."Id" = 1 OR 1 = 0) -- Replace: @CoachId (0 for all coaches)
  AND b."StartTime" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND b."Status" = 3 -- Completed
GROUP BY day_of_week, day_number, coach_u."Name", cp."Specialization"
ORDER BY day_number, total_sessions DESC;

-- 43. Analyze subscription renewals vs cancellations with retention metrics
-- Parameters: @StartDate, @EndDate
-- Use case: Track subscription health, identify cancellation trends, improve retention
SELECT 
    DATE_TRUNC('month', us."CreatedAt") as month,
    COUNT(*) as new_subscriptions,
    COUNT(CASE WHEN us."AutoRenew" = true THEN 1 END) as auto_renew_enabled,
    COUNT(CASE WHEN us."Status" = 2 THEN 1 END) as cancelled,
    COUNT(CASE WHEN us."Status" = 1 AND us."EndDate" < CURRENT_DATE THEN 1 END) as expired,
    COUNT(CASE WHEN us."Status" = 0 THEN 1 END) as currently_active,
    ROUND((COUNT(CASE WHEN us."AutoRenew" = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) as auto_renew_percent,
    ROUND((COUNT(CASE WHEN us."Status" = 2 THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) as cancellation_rate
FROM user_subscriptions us
WHERE us."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
GROUP BY month
ORDER BY month DESC;

-- 44. Get token spending patterns with ROI analysis
-- Parameters: @UserId, @StartDate, @EndDate
-- Use case: Understand member spending behavior, optimize token pricing, identify value seekers
SELECT 
    u."UserId", u."Name", u."Email", u."TokenBalance",
    b."BookingType",
    COUNT(b."BookingId") as total_bookings,
    SUM(b."TokensCost") as total_tokens_spent,
    ROUND(AVG(b."TokensCost"), 2) as avg_tokens_per_booking,
    MIN(b."TokensCost") as min_tokens,
    MAX(b."TokensCost") as max_tokens,
    SUM(EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/60) as total_minutes_booked,
    ROUND(SUM(b."TokensCost")::numeric / NULLIF(SUM(EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/60), 0), 2) as tokens_per_minute
FROM users u
JOIN bookings b ON u."UserId" = b."UserId"
WHERE (u."UserId" = 1 OR 1 = 0) -- Replace: @UserId (0 for all members)
  AND b."StartTime" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND b."Status" != 4 -- Exclude cancelled
GROUP BY u."UserId", u."Name", u."Email", u."TokenBalance", b."BookingType"
ORDER BY total_tokens_spent DESC;

-- ==========================================
-- SECTION 13: AVAILABILITY & SCHEDULING (Receptionist/Operations)
-- ==========================================

-- 45. Check equipment availability for specific time slot with detailed status
-- Parameters: @StartTime, @EndTime, @CategoryId, @Location
-- Use case: Real-time booking system, member self-service, reception desk operations
SELECT e."EquipmentId", e."Name", ec."CategoryName", e."Location",
       e."Status", e."ConditionRating", e."LastMaintenanceDate",
       CASE 
           WHEN EXISTS (
               SELECT 1 FROM bookings b 
               WHERE b."EquipmentId" = e."EquipmentId"
                 AND b."Status" IN (0, 1, 2)
                 AND (b."StartTime", b."EndTime") OVERLAPS ('2024-06-15 10:00:00'::timestamp, '2024-06-15 11:00:00'::timestamp)
           ) THEN 'Booked'
           WHEN e."Status" = 2 THEN 'Under Maintenance'
           WHEN e."ConditionRating" < 5 THEN 'Available (Needs Attention)'
           ELSE 'Available'
       END as availability_status,
       (SELECT u."Name" FROM bookings b 
        JOIN users u ON b."UserId" = u."UserId"
        WHERE b."EquipmentId" = e."EquipmentId"
          AND b."Status" IN (0, 1, 2)
          AND (b."StartTime", b."EndTime") OVERLAPS ('2024-06-15 10:00:00'::timestamp, '2024-06-15 11:00:00'::timestamp)
        LIMIT 1) as booked_by
FROM equipment e
JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
WHERE e."IsActive" = true
  AND (ec."CategoryId" = 1 OR 1 = 0) -- Replace: @CategoryId (0 for all)
  AND (e."Location" = 'Ground Floor' OR 'Ground Floor' = '') -- Replace with @Location
  AND e."Status" != 0
ORDER BY availability_status, ec."CategoryName", e."Name";

-- 46. Get coach availability with booking calendar
-- Parameters: @CoachId, @StartDate, @EndDate, @MinHourlyRate, @MaxHourlyRate
-- Use case: Coach booking system, schedule management, member coach selection
WITH coach_schedule AS (
    SELECT 
        b."CoachId",
        DATE(b."StartTime") as booking_date,
        EXTRACT(HOUR FROM b."StartTime") as booking_hour,
        b."BookingId",
        u."Name" as member_name
    FROM bookings b
    JOIN users u ON b."UserId" = u."UserId"
    WHERE b."CoachId" = 1 -- Replace with parameter
      AND b."StartTime" BETWEEN '2024-06-15' AND '2024-06-21' -- Replace with parameters
      AND b."Status" IN (0, 1, 2) -- Pending, Confirmed, InProgress
)
SELECT 
    coach_u."Name" as coach_name,
    coach_u."Email", coach_u."Phone",
    cp."Specialization", cp."ExperienceYears",
    cp."HourlyRate", cp."Rating", cp."TotalClients",
    COUNT(cs."BookingId") as booked_slots,
    ARRAY_AGG(DISTINCT cs.booking_date ORDER BY cs.booking_date) FILTER (WHERE cs.booking_date IS NOT NULL) as booked_dates,
    ARRAY_AGG(DISTINCT cs.booking_hour ORDER BY cs.booking_hour) FILTER (WHERE cs.booking_hour IS NOT NULL) as booked_hours
FROM coach_profiles cp
JOIN users coach_u ON cp."UserId" = coach_u."UserId"
LEFT JOIN coach_schedule cs ON cp."Id" = cs."CoachId"
WHERE cp."Id" = 1 -- Replace with parameter
  AND cp."HourlyRate" BETWEEN 0 AND 1000 -- Replace with @MinHourlyRate and @MaxHourlyRate
  AND coach_u."IsActive" = true
GROUP BY coach_u."Name", coach_u."Email", coach_u."Phone", cp."Specialization", 
         cp."ExperienceYears", cp."HourlyRate", cp."Rating", cp."TotalClients";

-- 47. Find members with overlapping bookings (data integrity check)
-- Parameters: @StartDate, @EndDate
-- Use case: Prevent double-booking, data quality assurance, system health monitoring
SELECT u."UserId", u."Name", u."Email", u."Phone",
       b1."BookingId" as booking1_id,
       b1."BookingType" as booking1_type,
       b1."StartTime" as booking1_start,
       b1."EndTime" as booking1_end,
       b2."BookingId" as booking2_id,
       b2."BookingType" as booking2_type,
       b2."StartTime" as booking2_start,
       b2."EndTime" as booking2_end,
       EXTRACT(EPOCH FROM (
           LEAST(b1."EndTime", b2."EndTime") - GREATEST(b1."StartTime", b2."StartTime")
       ))/60 as overlap_minutes
FROM users u
JOIN bookings b1 ON u."UserId" = b1."UserId"
JOIN bookings b2 ON u."UserId" = b2."UserId"
WHERE b1."BookingId" < b2."BookingId"
  AND (b1."StartTime", b1."EndTime") OVERLAPS (b2."StartTime", b2."EndTime")
  AND b1."Status" IN (0, 1, 2)
  AND b2."Status" IN (0, 1, 2)
  AND b1."StartTime" >= CURRENT_DATE - INTERVAL '30 days' -- Recent bookings only
ORDER BY u."Name", b1."StartTime";

-- 48. Get busiest equipment for maintenance planning and capacity analysis
-- Parameters: @StartDate, @EndDate, @MinUsageHours, @CategoryId
-- Use case: Equipment maintenance scheduling, capacity planning, purchase decisions
SELECT e."EquipmentId", e."Name", ec."CategoryName", e."Location",
       e."Status", e."ConditionRating", e."LastMaintenanceDate", e."NextMaintenanceDate",
       COUNT(b."BookingId") as total_bookings,
       COUNT(DISTINCT b."UserId") as unique_users,
       COUNT(DISTINCT DATE(b."StartTime")) as days_used,
       ROUND(AVG(EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/3600), 2) as avg_hours_per_booking,
       ROUND(SUM(EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/3600), 2) as total_usage_hours,
       ROUND((SUM(EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/3600) / 
             NULLIF(EXTRACT(EPOCH FROM ('2024-12-31'::timestamp - '2024-01-01'::timestamp))/24, 0)) * 100, 2) as utilization_percent,
       CASE 
           WHEN e."ConditionRating" <= 5 THEN 'High Priority Maintenance'
           WHEN SUM(EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/3600) > 500 THEN 'Schedule Maintenance Soon'
           ELSE 'Good Condition'
       END as maintenance_priority
FROM equipment e
JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
LEFT JOIN bookings b ON e."EquipmentId" = b."EquipmentId"
  AND b."StartTime" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND b."Status" IN (2, 3)
WHERE e."IsActive" = true
  AND (ec."CategoryId" = 0 OR 0 = 0) -- Replace: @CategoryId (0 for all)
GROUP BY e."EquipmentId", e."Name", ec."CategoryName", e."Location", e."Status", 
         e."ConditionRating", e."LastMaintenanceDate", e."NextMaintenanceDate"
HAVING ROUND(SUM(EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/3600), 2) >= 0 -- Replace with @MinUsageHours
ORDER BY total_usage_hours DESC NULLS LAST, total_bookings DESC;

-- ==========================================
-- SECTION 14: OPERATIONAL DASHBOARDS (Receptionist/Operations)
-- ==========================================

-- 49. Get upcoming bookings for today/tomorrow with complete details
-- Parameters: @DaysAhead (1 for today+tomorrow, 7 for next week)
-- Use case: Reception desk dashboard, daily operations, member check-in preparation
SELECT 
    DATE(b."StartTime") as booking_date,
    EXTRACT(DOW FROM b."StartTime") as day_of_week,
    TO_CHAR(b."StartTime", 'Day') as day_name,
    b."BookingId", b."BookingType", 
    TO_CHAR(b."StartTime", 'HH24:MI') as start_time,
    TO_CHAR(b."EndTime", 'HH24:MI') as end_time,
    b."Status", b."TokensCost",
    u."UserId", u."Name" as member_name, u."Email", u."Phone",
    mp."FitnessGoal", mp."FitnessLevel",
    COALESCE(e."Name", coach_u."Name") as resource_name,
    COALESCE(e."Location", 'Coach Session') as location,
    COALESCE(ec."CategoryName", cp."Specialization") as category,
    CASE b."Status"
        WHEN 0 THEN 'Pending'
        WHEN 1 THEN 'Confirmed'
        WHEN 2 THEN 'In Progress'
        WHEN 3 THEN 'Completed'
        WHEN 4 THEN 'Cancelled'
    END as status_text
FROM bookings b
JOIN users u ON b."UserId" = u."UserId"
JOIN member_profiles mp ON u."UserId" = mp."UserId"
LEFT JOIN equipment e ON b."EquipmentId" = e."EquipmentId"
LEFT JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
LEFT JOIN coach_profiles cp ON b."CoachId" = cp."Id"
LEFT JOIN users coach_u ON cp."UserId" = coach_u."UserId"
WHERE b."StartTime" BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '2 days' -- Replace: 2 with @DaysAhead
  AND b."Status" IN (0, 1, 2) -- Pending, Confirmed, InProgress
ORDER BY b."StartTime", u."Name";

-- ==========================================
-- SECTION 15: CHAT & COMMUNICATION ANALYTICS (Admin/Support)
-- ==========================================

-- 50. Get unread messages by conversation with sender/receiver details
-- Parameters: @UserId (for specific user), @StartDate, @EndDate
-- Use case: Message inbox, notification system, support monitoring
SELECT cm."ChatMessageId", cm."ConversationId", cm."Message",
       cm."CreatedAt", cm."IsRead", cm."ReadAt",
       sender."UserId" as sender_id, sender."Name" as sender_name, sender."Email" as sender_email,
       sender."Role" as sender_role, sender."ProfileImageUrl" as sender_image,
       receiver."UserId" as receiver_id, receiver."Name" as receiver_name, receiver."Email" as receiver_email,
       receiver."Role" as receiver_role,
       LENGTH(cm."Message") as message_length,
       CASE 
           WHEN cm."IsRead" = false AND cm."CreatedAt" <= CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 'Urgent - Unread 24h+'
           WHEN cm."IsRead" = false THEN 'Unread'
           ELSE 'Read'
       END as message_status
FROM chat_messages cm
JOIN users sender ON cm."SenderId" = sender."UserId"
JOIN users receiver ON cm."ReceiverId" = receiver."UserId"
WHERE cm."IsRead" = false -- Replace with parameter
  AND (cm."ReceiverId" = 1 OR 1 = 0) -- Replace: @UserId (0 for all unread messages)
  AND cm."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
ORDER BY cm."CreatedAt" DESC;

-- 51. Get conversation history between two users with message threading
-- Parameters: @UserId1, @UserId2, @StartDate, @EndDate
-- Use case: View complete chat history, support ticket review, conversation export
SELECT cm."ChatMessageId", cm."ConversationId", cm."Message",
       cm."CreatedAt", cm."IsRead", cm."ReadAt",
       sender."UserId" as sender_id, sender."Name" as sender_name,
       sender."Role" as sender_role,
       receiver."UserId" as receiver_id, receiver."Name" as receiver_name,
       receiver."Role" as receiver_role,
       EXTRACT(EPOCH FROM (cm."CreatedAt" - LAG(cm."CreatedAt") OVER (PARTITION BY cm."ConversationId" ORDER BY cm."CreatedAt")))/60 as minutes_since_prev_message
FROM chat_messages cm
JOIN users sender ON cm."SenderId" = sender."UserId"
JOIN users receiver ON cm."ReceiverId" = receiver."UserId"
WHERE cm."ConversationId" = '1-5' -- Replace with parameter (format: "userId1-userId2")
  AND cm."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
ORDER BY cm."CreatedAt";

-- 52. Get chat activity statistics by user role with response times
-- Parameters: @StartDate, @EndDate
-- Use case: Analyze coach-member communication patterns, support effectiveness
SELECT 
    sender."Role" as sender_role,
    receiver."Role" as receiver_role,
    COUNT(cm."ChatMessageId") as total_messages,
    COUNT(DISTINCT cm."ConversationId") as unique_conversations,
    COUNT(DISTINCT cm."SenderId") as unique_senders,
    COUNT(DISTINCT cm."ReceiverId") as unique_receivers,
    ROUND(AVG(LENGTH(cm."Message")), 0) as avg_message_length,
    COUNT(CASE WHEN cm."IsRead" = true THEN 1 END) as messages_read,
    ROUND(AVG(EXTRACT(EPOCH FROM (cm."ReadAt" - cm."CreatedAt"))/60), 2) as avg_read_time_minutes,
    ROUND((COUNT(CASE WHEN cm."IsRead" = true THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) as read_rate_percent
FROM chat_messages cm
JOIN users sender ON cm."SenderId" = sender."UserId"
JOIN users receiver ON cm."ReceiverId" = receiver."UserId"
WHERE cm."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
GROUP BY sender."Role", receiver."Role"
ORDER BY total_messages DESC;

-- 53. Get most active conversations with engagement metrics
-- Parameters: @MinMessages, @StartDate, @EndDate
-- Use case: Identify engaged members, active coaches, relationship building success
SELECT cm."ConversationId",
       COUNT(cm."ChatMessageId") as message_count,
       MIN(cm."CreatedAt") as first_message_at,
       MAX(cm."CreatedAt") as last_message_at,
       EXTRACT(DAY FROM (MAX(cm."CreatedAt") - MIN(cm."CreatedAt"))) as conversation_duration_days,
       COUNT(DISTINCT DATE(cm."CreatedAt")) as active_days,
       u1."UserId" as user1_id, u1."Name" as user1_name, u1."Role" as user1_role,
       u2."UserId" as user2_id, u2."Name" as user2_name, u2."Role" as user2_role,
       COUNT(CASE WHEN cm."SenderId" < cm."ReceiverId" THEN 1 END) as user1_messages,
       COUNT(CASE WHEN cm."SenderId" > cm."ReceiverId" THEN 1 END) as user2_messages,
       ROUND(AVG(LENGTH(cm."Message")), 0) as avg_message_length
FROM chat_messages cm
JOIN users u1 ON u1."UserId" = LEAST(CAST(SPLIT_PART(cm."ConversationId", '-', 1) AS INTEGER), CAST(SPLIT_PART(cm."ConversationId", '-', 2) AS INTEGER))
JOIN users u2 ON u2."UserId" = GREATEST(CAST(SPLIT_PART(cm."ConversationId", '-', 1) AS INTEGER), CAST(SPLIT_PART(cm."ConversationId", '-', 2) AS INTEGER))
WHERE cm."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
GROUP BY cm."ConversationId", u1."UserId", u1."Name", u1."Role", u2."UserId", u2."Name", u2."Role"
HAVING COUNT(cm."ChatMessageId") >= 5 -- Replace with @MinMessages parameter
ORDER BY message_count DESC, last_message_at DESC;

-- ==========================================
-- SECTION 16: AUDIT & SECURITY TRACKING (Admin/Security)
-- ==========================================

-- 54. Get system audit logs with user action details
-- Parameters: @Action, @TableName, @UserId, @StartDate, @EndDate
-- Use case: Security monitoring, compliance auditing, troubleshooting user issues
SELECT al."LogId", al."Action", al."TableName", al."RecordId",
       al."OldValues", al."NewValues", al."IpAddress", al."UserAgent",
       al."CreatedAt",
       u."UserId", u."Name" as user_name, u."Email", u."Role",
       CASE 
           WHEN al."Action" = 'DELETE' THEN 'Critical'
           WHEN al."Action" = 'UPDATE' AND al."TableName" = 'users' THEN 'Important'
           WHEN al."Action" = 'INSERT' THEN 'Normal'
           ELSE 'Info'
       END as severity_level
FROM audit_logs al
LEFT JOIN users u ON al."UserId" = u."UserId"
WHERE al."Action" = 'UPDATE' -- Replace: 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
  AND (al."TableName" = 'users' OR 'users' = '') -- Replace with @TableName parameter
  AND (al."UserId" = 1 OR 1 = 0) -- Replace: @UserId (0 for all users)
  AND al."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
ORDER BY al."CreatedAt" DESC;

-- 55. Detect suspicious login patterns with IP tracking
-- Parameters: @StartDate, @EndDate, @MinLoginAttempts
-- Use case: Security threat detection, fraud prevention, account compromise alerts
WITH user_logins AS (
    SELECT al."UserId", al."IpAddress", al."UserAgent",
           COUNT(*) as login_count,
           COUNT(DISTINCT al."IpAddress") as unique_ips,
           COUNT(DISTINCT DATE(al."CreatedAt")) as login_days,
           MIN(al."CreatedAt") as first_login,
           MAX(al."CreatedAt") as last_login
    FROM audit_logs al
    WHERE al."Action" = 'LOGIN'
      AND al."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
    GROUP BY al."UserId", al."IpAddress", al."UserAgent"
)
SELECT u."UserId", u."Name", u."Email", u."Role", u."IsActive",
       ul.login_count, ul.unique_ips, ul.login_days,
       ul."IpAddress", ul."UserAgent",
       ul.first_login, ul.last_login,
       CASE 
           WHEN ul.unique_ips > 5 THEN 'High Risk - Multiple IPs'
           WHEN ul.login_count > 50 THEN 'Unusual - High Login Count'
           WHEN ul.login_days = 1 AND ul.login_count > 10 THEN 'Suspicious - Same Day Spam'
           ELSE 'Normal'
       END as risk_assessment
FROM user_logins ul
JOIN users u ON ul."UserId" = u."UserId"
WHERE ul.login_count >= 3 -- Replace with @MinLoginAttempts parameter
   OR ul.unique_ips > 3
ORDER BY ul.unique_ips DESC, ul.login_count DESC;

-- 56. Track data modifications by table with user accountability
-- Parameters: @StartDate, @EndDate, @TableName
-- Use case: Change management, data quality audits, rollback planning
SELECT al."TableName",
       al."Action",
       COUNT(*) as modification_count,
       COUNT(DISTINCT al."RecordId") as affected_records,
       COUNT(DISTINCT al."UserId") as users_involved,
       COUNT(DISTINCT DATE(al."CreatedAt")) as modification_days,
       STRING_AGG(DISTINCT u."Name", ', ') as modified_by_users,
       MIN(al."CreatedAt") as first_modification,
       MAX(al."CreatedAt") as last_modification
FROM audit_logs al
LEFT JOIN users u ON al."UserId" = u."UserId"
WHERE al."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND (al."TableName" = 'bookings' OR 'bookings' = '') -- Replace with @TableName
  AND al."Action" IN ('INSERT', 'UPDATE', 'DELETE')
GROUP BY al."TableName", al."Action"
ORDER BY modification_count DESC;

-- ==========================================
-- SECTION 17: ACTIVITY FEED & ENGAGEMENT (Social Features)
-- ==========================================

-- 57. Get user activity feed with details and engagement tracking
-- Parameters: @UserId, @ActivityType, @StartDate, @EndDate
-- Use case: Member dashboard, social features, gamification, progress visibility
SELECT af."ActivityId", af."ActivityType", af."Title", af."Description",
       af."Icon", af."ReferenceId", af."ReferenceType", af."CreatedAt",
       u."UserId", u."Name", u."Email", u."Role", u."ProfileImageUrl",
       mp."FitnessGoal", mp."FitnessLevel",
       CASE af."ActivityType"
           WHEN 'workout_completed' THEN 'Fitness Progress'
           WHEN 'milestone_achieved' THEN 'Achievement Unlocked'
           WHEN 'plan_created' THEN 'New Goal Set'
           WHEN 'booking_completed' THEN 'Session Complete'
           WHEN 'review_posted' THEN 'Feedback Given'
           ELSE 'General Activity'
       END as activity_category
FROM activity_feeds af
JOIN users u ON af."UserId" = u."UserId"
LEFT JOIN member_profiles mp ON u."UserId" = mp."UserId"
WHERE (af."UserId" = 1 OR 1 = 0) -- Replace: @UserId (0 for all users)
  AND (af."ActivityType" = 'workout_completed' OR 'workout_completed' = '') -- Replace with @ActivityType
  AND af."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
ORDER BY af."CreatedAt" DESC
LIMIT 50;

-- 58. Get trending activities across the gym with popularity metrics
-- Parameters: @StartDate, @EndDate, @MinActivityCount
-- Use case: Social engagement dashboard, community building, trend analysis
SELECT af."ActivityType",
       COUNT(*) as activity_count,
       COUNT(DISTINCT af."UserId") as unique_users,
       COUNT(DISTINCT DATE(af."CreatedAt")) as active_days,
       STRING_AGG(DISTINCT af."Title", ' | ' ORDER BY af."CreatedAt" DESC) as recent_titles,
       MIN(af."CreatedAt") as first_activity,
       MAX(af."CreatedAt") as latest_activity,
       ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT af."UserId"), 0), 2) as activities_per_user
FROM activity_feeds af
WHERE af."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
GROUP BY af."ActivityType"
HAVING COUNT(*) >= 5 -- Replace with @MinActivityCount parameter
ORDER BY activity_count DESC;

-- 59. Get member activity timeline with milestone integration
-- Parameters: @UserId, @DaysBack
-- Use case: Personal progress dashboard, coach review, member motivation
SELECT 
    af."CreatedAt"::date as activity_date,
    COUNT(*) as daily_activities,
    STRING_AGG(af."Title", '; ' ORDER BY af."CreatedAt") as activities,
    STRING_AGG(af."ActivityType", ', ' ORDER BY af."CreatedAt") as activity_types,
    COUNT(CASE WHEN af."ActivityType" = 'workout_completed' THEN 1 END) as workouts,
    COUNT(CASE WHEN af."ActivityType" = 'milestone_achieved' THEN 1 END) as milestones,
    COUNT(CASE WHEN af."ActivityType" = 'booking_completed' THEN 1 END) as sessions
FROM activity_feeds af
WHERE af."UserId" = 1 -- Replace with @UserId parameter
  AND af."CreatedAt" >= CURRENT_DATE - INTERVAL '30 days' -- Replace 30 with @DaysBack parameter
GROUP BY af."CreatedAt"::date
ORDER BY activity_date DESC;

-- ==========================================
-- SECTION 18: TOKEN PACKAGE MANAGEMENT (Admin/Sales)
-- ==========================================

-- 60. Get token package sales performance with revenue analysis
-- Parameters: @StartDate, @EndDate, @MinPurchases
-- Use case: Sales optimization, pricing strategy, package popularity analysis
SELECT tp."PackageId", tp."PackageName", tp."TokenAmount", tp."BonusTokens",
       tp."Price", tp."Description", tp."IsActive",
       COUNT(p."PaymentId") as total_purchases,
       SUM(p."Amount") as total_revenue,
       SUM(tp."TokenAmount" + tp."BonusTokens") as total_tokens_sold,
       COUNT(DISTINCT p."UserId") as unique_customers,
       ROUND(AVG(p."Amount"), 2) as avg_purchase_amount,
       ROUND((tp."Price" / NULLIF(tp."TokenAmount" + tp."BonusTokens", 0)), 2) as price_per_token,
       ROUND((SUM(p."Amount") / NULLIF(COUNT(p."PaymentId"), 0)), 2) as avg_order_value
FROM token_packages tp
LEFT JOIN payments p ON tp."PackageId" = p."PackageId"
  AND p."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND p."Status" = 1 -- Completed
WHERE tp."IsActive" = true
GROUP BY tp."PackageId", tp."PackageName", tp."TokenAmount", tp."BonusTokens", 
         tp."Price", tp."Description", tp."IsActive"
HAVING COUNT(p."PaymentId") >= 0 -- Replace with @MinPurchases parameter
ORDER BY total_revenue DESC NULLS LAST, total_purchases DESC;

-- 61. Analyze token package purchase patterns by member segment
-- Parameters: @StartDate, @EndDate
-- Use case: Customer segmentation, targeted marketing, package optimization
SELECT 
    mp."FitnessGoal",
    mp."FitnessLevel",
    tp."PackageName",
    COUNT(p."PaymentId") as purchase_count,
    COUNT(DISTINCT p."UserId") as unique_buyers,
    SUM(p."Amount") as segment_revenue,
    ROUND(AVG(p."Amount"), 2) as avg_purchase_price,
    ROUND(SUM(p."Amount") / NULLIF(COUNT(DISTINCT p."UserId"), 0), 2) as revenue_per_customer
FROM payments p
JOIN token_packages tp ON p."PackageId" = tp."PackageId"
JOIN users u ON p."UserId" = u."UserId"
JOIN member_profiles mp ON u."UserId" = mp."UserId"
WHERE p."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND p."Status" = 1
  AND p."PackageId" IS NOT NULL
GROUP BY mp."FitnessGoal", mp."FitnessLevel", tp."PackageName"
ORDER BY segment_revenue DESC;

-- ==========================================
-- SECTION 19: BOOKING CHECK-IN/CHECK-OUT ANALYTICS (Operations)
-- ==========================================

-- 62. Get booking check-in/check-out compliance with attendance tracking
-- Parameters: @StartDate, @EndDate, @Status
-- Use case: Attendance monitoring, no-show tracking, facility management
SELECT b."BookingId", b."BookingType", b."StartTime", b."EndTime",
       b."Status", b."CheckInTime", b."CheckOutTime", b."TokensCost",
       u."UserId", u."Name" as member_name, u."Email", u."Phone",
       COALESCE(e."Name", coach_u."Name") as resource_name,
       CASE 
           WHEN b."CheckInTime" IS NOT NULL AND b."CheckOutTime" IS NOT NULL THEN 'Complete'
           WHEN b."CheckInTime" IS NOT NULL AND b."CheckOutTime" IS NULL THEN 'Checked In Only'
           WHEN b."StartTime" < CURRENT_TIMESTAMP AND b."CheckInTime" IS NULL THEN 'No Show'
           ELSE 'Pending'
       END as attendance_status,
       CASE 
           WHEN b."CheckInTime" IS NOT NULL 
           THEN EXTRACT(EPOCH FROM (b."CheckInTime" - b."StartTime"))/60
           ELSE NULL
       END as checkin_delay_minutes,
       CASE 
           WHEN b."CheckInTime" IS NOT NULL AND b."CheckOutTime" IS NOT NULL
           THEN EXTRACT(EPOCH FROM (b."CheckOutTime" - b."CheckInTime"))/60
           ELSE NULL
       END as actual_duration_minutes
FROM bookings b
JOIN users u ON b."UserId" = u."UserId"
LEFT JOIN equipment e ON b."EquipmentId" = e."EquipmentId"
LEFT JOIN coach_profiles cp ON b."CoachId" = cp."Id"
LEFT JOIN users coach_u ON cp."UserId" = coach_u."UserId"
WHERE b."StartTime" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND b."Status" IN (2, 3, 4) -- InProgress, Completed, Cancelled
ORDER BY b."StartTime" DESC;

-- 63. Calculate no-show rates by member with financial impact
-- Parameters: @StartDate, @EndDate, @MinNoShows
-- Use case: Identify problematic members, policy enforcement, lost revenue tracking
SELECT u."UserId", u."Name", u."Email", u."Phone", u."TokenBalance",
       mp."FitnessGoal",
       COUNT(b."BookingId") as total_bookings,
       COUNT(CASE WHEN b."Status" = 4 THEN 1 END) as cancelled_bookings,
       COUNT(CASE WHEN b."Status" != 4 AND b."StartTime" < CURRENT_TIMESTAMP AND b."CheckInTime" IS NULL THEN 1 END) as no_shows,
       COUNT(CASE WHEN b."CheckInTime" IS NOT NULL THEN 1 END) as attended_bookings,
       SUM(CASE WHEN b."Status" != 4 AND b."StartTime" < CURRENT_TIMESTAMP AND b."CheckInTime" IS NULL THEN b."TokensCost" ELSE 0 END) as lost_tokens,
       ROUND((COUNT(CASE WHEN b."Status" != 4 AND b."StartTime" < CURRENT_TIMESTAMP AND b."CheckInTime" IS NULL THEN 1 END)::numeric / 
              NULLIF(COUNT(CASE WHEN b."Status" != 4 THEN 1 END), 0)) * 100, 2) as no_show_rate_percent
FROM users u
JOIN member_profiles mp ON u."UserId" = mp."UserId"
JOIN bookings b ON u."UserId" = b."UserId"
WHERE b."StartTime" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
GROUP BY u."UserId", u."Name", u."Email", u."Phone", u."TokenBalance", mp."FitnessGoal"
HAVING COUNT(CASE WHEN b."Status" != 4 AND b."StartTime" < CURRENT_TIMESTAMP AND b."CheckInTime" IS NULL THEN 1 END) >= 3 -- Replace with @MinNoShows
ORDER BY no_shows DESC, no_show_rate_percent DESC;

-- 64. Analyze actual vs scheduled session durations with efficiency metrics
-- Parameters: @StartDate, @EndDate, @BookingType
-- Use case: Resource optimization, scheduling accuracy, operational efficiency
SELECT 
    b."BookingType",
    COALESCE(ec."CategoryName", cp."Specialization") as resource_category,
    COUNT(b."BookingId") as completed_sessions,
    ROUND(AVG(EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/60), 0) as avg_scheduled_minutes,
    ROUND(AVG(EXTRACT(EPOCH FROM (b."CheckOutTime" - b."CheckInTime"))/60), 0) as avg_actual_minutes,
    ROUND(AVG(EXTRACT(EPOCH FROM (b."CheckInTime" - b."StartTime"))/60), 0) as avg_late_arrival_minutes,
    ROUND(AVG(EXTRACT(EPOCH FROM (b."EndTime" - b."CheckOutTime"))/60), 0) as avg_early_departure_minutes,
    COUNT(CASE WHEN b."CheckInTime" > b."StartTime" + INTERVAL '5 minutes' THEN 1 END) as late_arrivals,
    COUNT(CASE WHEN b."CheckOutTime" < b."EndTime" - INTERVAL '5 minutes' THEN 1 END) as early_departures,
    ROUND((COUNT(CASE WHEN b."CheckInTime" > b."StartTime" + INTERVAL '5 minutes' THEN 1 END)::numeric / 
           NULLIF(COUNT(*), 0)) * 100, 2) as late_arrival_rate_percent
FROM bookings b
LEFT JOIN equipment e ON b."EquipmentId" = e."EquipmentId"
LEFT JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
LEFT JOIN coach_profiles cp ON b."CoachId" = cp."Id"
WHERE b."CheckInTime" IS NOT NULL
  AND b."CheckOutTime" IS NOT NULL
  AND b."StartTime" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND (b."BookingType" = 'Equipment' OR 'Equipment' = '') -- Replace with @BookingType
GROUP BY b."BookingType", COALESCE(ec."CategoryName", cp."Specialization")
ORDER BY completed_sessions DESC;

-- ==========================================
-- SECTION 20: USER PROFILE & DEMOGRAPHICS (Admin/Marketing)
-- ==========================================

-- 65. Get member demographics with profile completeness scoring
-- Parameters: @Role, @Gender, @MinAge, @MaxAge
-- Use case: Marketing campaigns, service customization, demographic analysis
SELECT u."UserId", u."Name", u."Email", u."Phone", u."Role",
       u."DateOfBirth", u."Gender", u."Address",
       u."ProfileImageUrl", u."EmergencyContactName", u."EmergencyContactPhone",
       u."EmailVerified", u."IsFirstLogin", u."MustChangePassword",
       u."CreatedAt", u."LastLoginAt",
       EXTRACT(YEAR FROM AGE(u."DateOfBirth")) as age,
       mp."FitnessGoal", mp."FitnessLevel", mp."Height", mp."Weight",
       (CASE WHEN u."Phone" IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN u."DateOfBirth" IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN u."Gender" IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN u."Address" IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN u."ProfileImageUrl" IS NOT NULL THEN 15 ELSE 0 END +
        CASE WHEN u."EmergencyContactName" IS NOT NULL THEN 15 ELSE 0 END +
        CASE WHEN u."EmergencyContactPhone" IS NOT NULL THEN 15 ELSE 0 END +
        CASE WHEN mp."Height" IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN mp."Weight" IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN u."EmailVerified" = true THEN 5 ELSE 0 END) as profile_completeness_score
FROM users u
LEFT JOIN member_profiles mp ON u."UserId" = mp."UserId"
WHERE u."Role" = 'Member' -- Replace with @Role parameter
  AND (u."Gender" = 0 OR 0 IS NULL) -- Replace: 0=Male, 1=Female, 2=Other, NULL for all
  AND u."IsActive" = true
  AND EXTRACT(YEAR FROM AGE(u."DateOfBirth")) BETWEEN 18 AND 65 -- Replace with @MinAge and @MaxAge
ORDER BY profile_completeness_score DESC, u."CreatedAt" DESC;

-- 66. Find users with incomplete profiles requiring attention
-- Parameters: @MinCompleteness
-- Use case: Onboarding follow-up, profile completion campaigns, data quality
SELECT u."UserId", u."Name", u."Email", u."Phone", u."Role",
       u."CreatedAt", u."LastLoginAt", u."IsFirstLogin", u."EmailVerified",
       CASE WHEN u."Phone" IS NULL THEN 'Missing Phone' ELSE NULL END as missing_phone,
       CASE WHEN u."DateOfBirth" IS NULL THEN 'Missing DOB' ELSE NULL END as missing_dob,
       CASE WHEN u."Gender" IS NULL THEN 'Missing Gender' ELSE NULL END as missing_gender,
       CASE WHEN u."Address" IS NULL THEN 'Missing Address' ELSE NULL END as missing_address,
       CASE WHEN u."ProfileImageUrl" IS NULL THEN 'No Profile Image' ELSE NULL END as missing_image,
       CASE WHEN u."EmergencyContactName" IS NULL THEN 'No Emergency Contact' ELSE NULL END as missing_emergency,
       CASE WHEN u."EmailVerified" = false THEN 'Email Not Verified' ELSE NULL END as email_status,
       CONCAT_WS(', ',
           CASE WHEN u."Phone" IS NULL THEN 'Phone' END,
           CASE WHEN u."DateOfBirth" IS NULL THEN 'DOB' END,
           CASE WHEN u."Gender" IS NULL THEN 'Gender' END,
           CASE WHEN u."Address" IS NULL THEN 'Address' END,
           CASE WHEN u."ProfileImageUrl" IS NULL THEN 'Image' END,
           CASE WHEN u."EmergencyContactName" IS NULL THEN 'Emergency Contact' END,
           CASE WHEN u."EmailVerified" = false THEN 'Email Verification' END
       ) as missing_fields_summary
FROM users u
WHERE u."IsActive" = true
  AND (u."Phone" IS NULL 
       OR u."DateOfBirth" IS NULL
       OR u."Gender" IS NULL
       OR u."ProfileImageUrl" IS NULL
       OR u."EmergencyContactName" IS NULL
       OR u."EmailVerified" = false)
ORDER BY u."CreatedAt" DESC;

-- 67. Get first-time login users needing onboarding assistance
-- Parameters: @DaysNew
-- Use case: Onboarding process, welcome campaigns, initial support
SELECT u."UserId", u."Name", u."Email", u."Phone", u."Role",
       u."CreatedAt", u."LastLoginAt", u."IsFirstLogin",
       u."MustChangePassword", u."EmailVerified",
       mp."FitnessGoal", mp."FitnessLevel",
       CURRENT_DATE - u."CreatedAt"::date as days_since_registration,
       CASE 
           WHEN u."LastLoginAt" IS NULL THEN 'Never Logged In'
           WHEN u."IsFirstLogin" = true THEN 'First Login Not Completed'
           ELSE 'Onboarded'
       END as onboarding_status,
       CASE 
           WHEN u."EmailVerified" = false THEN 'Verify Email'
           WHEN u."MustChangePassword" = true THEN 'Change Password'
           WHEN u."IsFirstLogin" = true THEN 'Complete Profile Setup'
           ELSE 'Ready'
       END as next_action
FROM users u
LEFT JOIN member_profiles mp ON u."UserId" = mp."UserId"
WHERE (u."IsFirstLogin" = true OR u."LastLoginAt" IS NULL OR u."EmailVerified" = false)
  AND u."IsActive" = true
  AND u."CreatedAt" >= CURRENT_DATE - INTERVAL '30 days' -- Replace 30 with @DaysNew parameter
ORDER BY u."CreatedAt" DESC;

-- ==========================================
-- SECTION 21: BOOKING CANCELLATION ANALYTICS (Operations/Finance)
-- ==========================================

-- 68. Analyze booking cancellations with reason categorization
-- Parameters: @StartDate, @EndDate, @MinCancellations
-- Use case: Service improvement, refund policy analysis, member satisfaction
SELECT b."CancellationReason",
       COUNT(*) as cancellation_count,
       COUNT(DISTINCT b."UserId") as unique_users,
       SUM(b."TokensCost") as refunded_tokens,
       ROUND(AVG(b."TokensCost"), 2) as avg_tokens_per_cancellation,
       ROUND(AVG(EXTRACT(EPOCH FROM (b."UpdatedAt" - b."CreatedAt"))/3600), 2) as avg_hours_before_cancel,
       COUNT(CASE WHEN b."BookingType" = 'Equipment' THEN 1 END) as equipment_cancellations,
       COUNT(CASE WHEN b."BookingType" = 'Coach' THEN 1 END) as coach_cancellations,
       COUNT(CASE WHEN b."StartTime" - b."UpdatedAt" < INTERVAL '24 hours' THEN 1 END) as late_cancellations
FROM bookings b
WHERE b."Status" = 4 -- Cancelled
  AND b."UpdatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND b."CancellationReason" IS NOT NULL
GROUP BY b."CancellationReason"
HAVING COUNT(*) >= 2 -- Replace with @MinCancellations parameter
ORDER BY cancellation_count DESC;

-- 69. Identify high cancellation rate members with impact assessment
-- Parameters: @StartDate, @EndDate, @MinCancellationRate
-- Use case: Member behavior analysis, policy enforcement, retention strategies
SELECT u."UserId", u."Name", u."Email", u."Phone", u."TokenBalance",
       COUNT(b."BookingId") as total_bookings,
       COUNT(CASE WHEN b."Status" = 4 THEN 1 END) as cancelled_bookings,
       COUNT(CASE WHEN b."Status" = 3 THEN 1 END) as completed_bookings,
       SUM(CASE WHEN b."Status" = 4 THEN b."TokensCost" ELSE 0 END) as tokens_refunded,
       ROUND((COUNT(CASE WHEN b."Status" = 4 THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) as cancellation_rate_percent,
       STRING_AGG(DISTINCT b."CancellationReason", ' | ') as cancellation_reasons,
       COUNT(CASE WHEN b."Status" = 4 AND b."StartTime" - b."UpdatedAt" < INTERVAL '24 hours' THEN 1 END) as late_cancellations
FROM users u
JOIN bookings b ON u."UserId" = b."UserId"
WHERE b."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
GROUP BY u."UserId", u."Name", u."Email", u."Phone", u."TokenBalance"
HAVING ROUND((COUNT(CASE WHEN b."Status" = 4 THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) >= 20 -- Replace with @MinCancellationRate
ORDER BY cancellation_rate_percent DESC, cancelled_bookings DESC;

-- ==========================================
-- SECTION 22: CROSS-FEATURE CORRELATION ANALYTICS (Strategic)
-- ==========================================

-- 70. Correlate member BMI with workout intensity and progress
-- Parameters: @StartDate, @EndDate
-- Use case: Program effectiveness analysis, personalization insights, health outcomes
SELECT 
    CASE 
        WHEN (mp."Weight" / POWER(mp."Height" / 100.0, 2)) < 18.5 THEN 'Underweight'
        WHEN (mp."Weight" / POWER(mp."Height" / 100.0, 2)) BETWEEN 18.5 AND 24.9 THEN 'Normal'
        WHEN (mp."Weight" / POWER(mp."Height" / 100.0, 2)) BETWEEN 25 AND 29.9 THEN 'Overweight'
        ELSE 'Obese'
    END as bmi_category,
    mp."FitnessGoal",
    COUNT(DISTINCT u."UserId") as member_count,
    COUNT(wl."LogId") as total_workouts,
    ROUND(AVG(wl."DurationMinutes"), 0) as avg_workout_duration,
    ROUND(AVG(wl."CaloriesBurned"), 0) as avg_calories_burned,
    ROUND(AVG(wl."FeelingRating"), 2) as avg_satisfaction,
    ROUND(AVG(mp."TotalWorkoutsCompleted"), 0) as avg_lifetime_workouts
FROM users u
JOIN member_profiles mp ON u."UserId" = mp."UserId"
LEFT JOIN workout_logs wl ON u."UserId" = wl."UserId"
  AND wl."WorkoutDate" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
WHERE mp."Height" IS NOT NULL 
  AND mp."Weight" IS NOT NULL
  AND u."IsActive" = true
GROUP BY bmi_category, mp."FitnessGoal"
ORDER BY bmi_category, member_count DESC;

-- 71. Analyze subscription tier vs service utilization patterns
-- Parameters: @StartDate, @EndDate
-- Use case: Package optimization, upsell opportunities, value proposition analysis
SELECT sp."PlanName", sp."Price", sp."TokensIncluded",
       COUNT(DISTINCT us."UserId") as subscribers,
       ROUND(AVG(b.booking_count), 2) as avg_bookings_per_member,
       ROUND(AVG(b.tokens_spent), 2) as avg_tokens_spent,
       ROUND(AVG(wl.workout_count), 2) as avg_workouts_per_member,
       ROUND(AVG(u."TokenBalance"), 2) as avg_remaining_tokens,
       ROUND((AVG(b.tokens_spent) / NULLIF(sp."TokensIncluded", 0)) * 100, 2) as token_utilization_percent,
       COUNT(CASE WHEN u."TokenBalance" < 10 THEN 1 END) as low_balance_count
FROM subscription_plans sp
JOIN user_subscriptions us ON sp."PlanId" = us."PlanId" AND us."Status" = 0
JOIN users u ON us."UserId" = u."UserId"
LEFT JOIN LATERAL (
    SELECT COUNT(*) as booking_count, SUM(b."TokensCost") as tokens_spent
    FROM bookings b
    WHERE b."UserId" = u."UserId"
      AND b."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
) b ON true
LEFT JOIN LATERAL (
    SELECT COUNT(*) as workout_count
    FROM workout_logs wl
    WHERE wl."UserId" = u."UserId"
      AND wl."WorkoutDate" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
) wl ON true
GROUP BY sp."PlanId", sp."PlanName", sp."Price", sp."TokensIncluded"
ORDER BY sp."Price" DESC;

-- 72. Member lifetime value calculation with predictive retention scoring
-- Parameters: @MinLTV
-- Use case: Member segmentation, retention focus, VIP program identification
SELECT u."UserId", u."Name", u."Email", u."Role",
       u."CreatedAt", u."LastLoginAt",
       EXTRACT(DAY FROM (COALESCE(u."LastLoginAt", CURRENT_TIMESTAMP) - u."CreatedAt")) as member_tenure_days,
       mp."TotalWorkoutsCompleted",
       COUNT(DISTINCT us."SubscriptionId") as subscription_count,
       SUM(p."Amount") as total_spent,
       COUNT(DISTINCT b."BookingId") as total_bookings,
       COUNT(DISTINCT wl."LogId") as total_workout_logs,
       ROUND(SUM(p."Amount") / NULLIF(EXTRACT(DAY FROM (COALESCE(u."LastLoginAt", CURRENT_TIMESTAMP) - u."CreatedAt")), 0) * 365, 2) as annual_value_estimate,
       CASE 
           WHEN u."LastLoginAt" >= CURRENT_DATE - INTERVAL '7 days' 
                AND mp."TotalWorkoutsCompleted" > 20 
                AND SUM(p."Amount") > 500 THEN 'VIP - High Retention'
           WHEN u."LastLoginAt" >= CURRENT_DATE - INTERVAL '30 days' 
                AND SUM(p."Amount") > 200 THEN 'Active - Medium Retention'
           WHEN u."LastLoginAt" < CURRENT_DATE - INTERVAL '30 days' THEN 'At Risk - Low Retention'
           ELSE 'New - Monitor'
       END as retention_segment
FROM users u
JOIN member_profiles mp ON u."UserId" = mp."UserId"
LEFT JOIN user_subscriptions us ON u."UserId" = us."UserId"
LEFT JOIN payments p ON u."UserId" = p."UserId" AND p."Status" = 1
LEFT JOIN bookings b ON u."UserId" = b."UserId"
LEFT JOIN workout_logs wl ON u."UserId" = wl."UserId"
WHERE u."IsActive" = true
  AND u."Role" = 'Member'
GROUP BY u."UserId", u."Name", u."Email", u."Role", u."CreatedAt", 
         u."LastLoginAt", mp."TotalWorkoutsCompleted"
HAVING SUM(p."Amount") >= 0 -- Replace with @MinLTV parameter
ORDER BY total_spent DESC NULLS LAST, annual_value_estimate DESC NULLS LAST;

-- 73. Coach effectiveness correlation with member outcomes
-- Parameters: @CoachId, @StartDate, @EndDate
-- Use case: Coach performance optimization, member-coach matching, training quality
WITH coach_members AS (
    SELECT cp."Id" as coach_id,
           b."UserId" as member_id,
           COUNT(b."BookingId") as sessions_with_coach,
           MIN(b."StartTime") as first_session,
           MAX(b."StartTime") as last_session
    FROM coach_profiles cp
    JOIN bookings b ON cp."Id" = b."CoachId"
    WHERE b."Status" = 3
      AND b."StartTime" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
    GROUP BY cp."Id", b."UserId"
    HAVING COUNT(b."BookingId") >= 3
)
SELECT coach_u."Name" as coach_name,
       cp."Specialization", cp."Rating" as coach_rating,
       COUNT(DISTINCT cm.member_id) as active_members,
       ROUND(AVG(cm.sessions_with_coach), 2) as avg_sessions_per_member,
       ROUND(AVG(wl_stats.total_workouts), 2) as avg_member_workouts,
       ROUND(AVG(wl_stats.avg_feeling), 2) as avg_member_satisfaction,
       COUNT(um."UserMilestoneId") as milestones_achieved_by_members,
       ROUND(AVG(EXTRACT(DAY FROM (cm.last_session - cm.first_session))), 0) as avg_engagement_days
FROM coach_members cm
JOIN coach_profiles cp ON cm.coach_id = cp."Id"
JOIN users coach_u ON cp."UserId" = coach_u."UserId"
LEFT JOIN LATERAL (
    SELECT COUNT(*) as total_workouts, AVG(wl."FeelingRating") as avg_feeling
    FROM workout_logs wl
    WHERE wl."UserId" = cm.member_id
      AND wl."WorkoutDate" BETWEEN cm.first_session AND cm.last_session
) wl_stats ON true
LEFT JOIN user_milestones um ON cm.member_id = um."UserId"
  AND um."CompletedAt" BETWEEN cm.first_session AND cm.last_session
  AND um."IsCompleted" = true
WHERE (cp."Id" = 1 OR 1 = 0) -- Replace: @CoachId (0 for all coaches)
GROUP BY coach_u."Name", cp."Specialization", cp."Rating"
ORDER BY avg_member_satisfaction DESC NULLS LAST, active_members DESC;

-- 74. Equipment category preference by demographics
-- Parameters: @StartDate, @EndDate
-- Use case: Equipment purchase planning, facility layout optimization, targeted marketing
SELECT 
    CASE 
        WHEN mp."Age" < 25 THEN '18-24'
        WHEN mp."Age" BETWEEN 25 AND 34 THEN '25-34'
        WHEN mp."Age" BETWEEN 35 AND 44 THEN '35-44'
        WHEN mp."Age" BETWEEN 45 AND 54 THEN '45-54'
        ELSE '55+'
    END as age_group,
    u."Gender",
    mp."FitnessGoal",
    ec."CategoryName",
    COUNT(b."BookingId") as booking_count,
    COUNT(DISTINCT b."UserId") as unique_users,
    ROUND(AVG(EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/60), 0) as avg_duration_minutes,
    ROUND(SUM(EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/60), 0) as total_usage_minutes
FROM bookings b
JOIN users u ON b."UserId" = u."UserId"
JOIN member_profiles mp ON u."UserId" = mp."UserId"
JOIN equipment e ON b."EquipmentId" = e."EquipmentId"
JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
WHERE b."BookingType" = 'Equipment'
  AND b."Status" IN (2, 3)
  AND b."StartTime" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND mp."Age" IS NOT NULL
GROUP BY age_group, u."Gender", mp."FitnessGoal", ec."CategoryName"
ORDER BY age_group, booking_count DESC;

-- ==========================================
-- END OF EXTENDED ANALYTICS QUERIES
-- ==========================================
-- Total: 74 comprehensive queries for database testing and operations
-- All queries properly numbered sequentially (1-74)
-- 
-- Query Categories:
-- SECTION 1: User Analytics (Queries 1-5)
-- SECTION 2: Subscription & Revenue Analytics (Queries 6-8)
-- SECTION 3: Booking & Attendance Analytics (Queries 9-13)
-- SECTION 4: Equipment & Maintenance (Queries 14-16)
-- SECTION 5: AI Usage & Token Analytics (Queries 17-18)
-- SECTION 6: Notifications & Member Engagement (Queries 19-20)
-- SECTION 7: Comprehensive Dashboard Queries (Queries 21-24)
-- SECTION 8: Member Search & Filtering (Queries 25-30)
-- SECTION 9: Workout & Nutrition Plan Filtering (Queries 31-32)
-- SECTION 10: Payment & Transaction Analytics (Queries 33-34)
-- SECTION 11: Review & Feedback Analytics (Queries 35-39)
-- SECTION 12: Comparative & Trend Analysis (Queries 40-44)
-- SECTION 13: Availability & Scheduling (Queries 45-48)
-- SECTION 14: Operational Dashboards (Query 49)
-- SECTION 15: Chat & Communication Analytics (Queries 50-53) **NEW**
-- SECTION 16: Audit & Security Tracking (Queries 54-56) **NEW**
-- SECTION 17: Activity Feed & Engagement (Queries 57-59) **NEW**
-- SECTION 18: Token Package Management (Queries 60-61) **NEW**
-- SECTION 19: Booking Check-In/Check-Out Analytics (Queries 62-64) **NEW**
-- SECTION 20: User Profile & Demographics (Queries 65-67) **NEW**
-- SECTION 21: Booking Cancellation Analytics (Queries 68-69) **NEW**
-- SECTION 22: Cross-Feature Correlation Analytics (Queries 70-74) **NEW**
--
-- Key Features:
-- - All queries use VERIFIED attribute names from C# domain models
-- - Covers ALL database tables including chat_messages, audit_logs, activity_feeds, token_packages
-- - Advanced analytics: BMI correlation, lifetime value, coach effectiveness, demographic preferences
-- - Security features: audit trails, suspicious login detection, IP tracking
-- - Operational features: check-in/check-out tracking, no-show analysis, cancellation patterns
-- - Social features: activity feeds, chat analytics, engagement metrics
-- - Profile management: completeness scoring, onboarding tracking, demographics
-- - All queries support parameterization for flexible filtering
-- - Optimized for PostgreSQL with proper date/time handling and window functions
-- - Comprehensive comments explaining use cases and parameters
-- ==========================================