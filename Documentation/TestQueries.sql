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


-- 8. Get members with active subscriptions expiring from [StartDate] to [EndDate]
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

-- 9. Get token usage analytics from [StartDate] to [EndDate]  !!!
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

-- 10. Get equipment availability and upcoming bookings
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
-- 11. Get daily attendance summary from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
SELECT DATE(b."StartTime") as attendance_date,
       COUNT(DISTINCT b."UserId") as unique_members,
       COUNT(b."BookingId") as total_bookings,
       COUNT(CASE WHEN b."BookingType" = 'Equipment' THEN 1 END) as equipment_bookings,
       COUNT(CASE WHEN b."BookingType" = 'Coach' THEN 1 END) as coach_sessions
FROM bookings b
WHERE b."StartTime" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND b."Status" IN (1, 2, 3) -- Confirmed, InProgress, Completed
GROUP BY DATE(b."StartTime")
ORDER BY attendance_date DESC;

-- 12. Get member workout activity from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
SELECT u."UserId", u."Name", u."Email",
       mp."FitnessGoal", mp."FitnessLevel",
       COUNT(wl."LogId") as total_workouts,
       SUM(wl."DurationMinutes") as total_minutes,
       SUM(wl."CaloriesBurned") as total_calories,
       MAX(wl."WorkoutDate") as last_workout,
       ROUND(AVG(wl."FeelingRating"), 2) as avg_satisfaction
FROM users u
INNER JOIN member_profiles mp ON u."UserId" = mp."UserId"
LEFT JOIN workout_logs wl ON u."UserId" = wl."UserId"
  AND wl."WorkoutDate" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
WHERE u."IsActive" = true
GROUP BY u."UserId", u."Name", u."Email", mp."FitnessGoal", mp."FitnessLevel"
ORDER BY total_workouts DESC;

-- 13. Get inactive members from [LastActivityDate] to now (no activity in X days)
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

-- 14. Get coach performance from [StartDate] to [EndDate]
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

-- 15. Get equipment availability status
SELECT e."EquipmentId", e."Name", ec."CategoryName", e."Location", e."Status",
       e."ConditionRating", e."LastMaintenanceDate", e."NextMaintenanceDate",
       CURRENT_DATE - e."LastMaintenanceDate" as days_since_maintenance,
       e."NextMaintenanceDate" - CURRENT_DATE as days_until_maintenance
FROM equipment e
JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
WHERE e."IsActive" = true
ORDER BY e."NextMaintenanceDate", e."Name";

-- 16. Get equipment requiring maintenance soon (within [Days] days)
-- Parameters: @DaysAhead
SELECT e."EquipmentId", e."Name", ec."CategoryName", e."Location",
       e."Status", e."LastMaintenanceDate", e."NextMaintenanceDate",
       e."NextMaintenanceDate" - CURRENT_DATE as days_until_maintenance
FROM equipment e
JOIN equipment_categories ec ON e."CategoryId" = ec."CategoryId"
WHERE e."NextMaintenanceDate" <= CURRENT_DATE + INTERVAL '14 days' -- Replace with parameter
   OR e."Status" = 2 -- Under Maintenance
ORDER BY e."NextMaintenanceDate";

-- 17. Get equipment usage patterns by category from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
SELECT ec."CategoryName",
       COUNT(DISTINCT e."EquipmentId") as total_equipment,
       COUNT(b."BookingId") as total_bookings,
       ROUND(COUNT(b."BookingId")::numeric / NULLIF(COUNT(DISTINCT e."EquipmentId"), 0), 2) as avg_bookings_per_equipment,
       ROUND(AVG(EXTRACT(EPOCH FROM (b."EndTime" - b."StartTime"))/60), 0) as avg_duration_minutes
FROM equipment_categories ec
LEFT JOIN equipment e ON ec."CategoryId" = e."CategoryId"
LEFT JOIN bookings b ON e."EquipmentId" = b."EquipmentId"
  AND b."StartTime" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
  AND b."Status" = 3 -- Completed
GROUP BY ec."CategoryId", ec."CategoryName"
ORDER BY total_bookings DESC;

-- ==========================================
-- SECTION 5: AI USAGE & TOKEN ANALYTICS (Admin)
-- ==========================================

-- 18. Get AI token consumption from [StartDate] to [EndDate]
-- Parameters: @StartDate, @EndDate
SELECT ag."ProgramType",
       COUNT(ag."GenerationId") as total_generations,
       SUM(ag."TokensUsed") as total_tokens_consumed,
       ROUND(AVG(ag."TokensUsed"), 0) as avg_tokens_per_generation,
       COUNT(DISTINCT ag."UserId") as unique_users
FROM ai_program_generations ag
WHERE ag."CreatedAt" BETWEEN '2024-01-01' AND '2024-12-31' -- Replace with parameters
GROUP BY ag."ProgramType"
ORDER BY total_tokens_consumed DESC;

-- 19. Get members with highest AI usage from [StartDate] to [EndDate]
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

-- 20. Get members needing attention (expiring subscriptions, inactive, low tokens)
-- For proactive member retention
SELECT u."UserId", u."Name", u."Email", u."Phone", u."TokenBalance",
       us."EndDate" as subscription_end,
       CASE 
           WHEN us."EndDate" <= CURRENT_DATE + INTERVAL '7 days' THEN 'Subscription Expiring Soon'
           WHEN u."TokenBalance" < 10 THEN 'Low Token Balance'
           WHEN u."LastLoginAt" < CURRENT_DATE - INTERVAL '14 days' THEN 'Inactive Member'
           ELSE 'Other'
       END as attention_reason,
       u."LastLoginAt"
FROM users u
INNER JOIN member_profiles mp ON u."UserId" = mp."UserId"
LEFT JOIN user_subscriptions us ON u."UserId" = us."UserId" AND us."Status" = 0
WHERE u."IsActive" = true
  AND (
      us."EndDate" <= CURRENT_DATE + INTERVAL '7 days'
      OR u."TokenBalance" < 10
      OR u."LastLoginAt" < CURRENT_DATE - INTERVAL '14 days'
  )
ORDER BY us."EndDate" NULLS LAST, u."TokenBalance";

-- 21. Get milestone achievements from [StartDate] to [EndDate]
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

-- 22. Get overall gym statistics from [StartDate] to [EndDate]
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

-- 23. Get peak hours analysis from [StartDate] to [EndDate]
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

-- 24. Get member retention rate from [StartDate] to [EndDate]
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

-- 25. Get top performing members from [StartDate] to [EndDate] (for recognition)
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
-- END OF ANALYTICS QUERIES
-- ==========================================
-- Total: 25 focused queries for Admin and Receptionist roles
-- All queries support date range parameters for flexible reporting periods
-- 
-- Schema Updates Applied:
-- - Removed TPT (Table-Per-Type) references
-- - Updated to use single users table with Role column
-- - Fixed coach references to use coach_profiles.Id instead of UserId
-- - Fixed member references to use member_profiles
-- - All queries optimized for date-range filtering
--
-- Query Categories:
-- 1. User Analytics (Queries 1-3)
-- 2. Subscription & Revenue Analytics (Queries 6-9)
-- 3. Booking & Attendance Analytics (Queries 10-13)
-- 4. Equipment & Maintenance (Queries 15-17)
-- 5. AI Usage & Token Analytics (Queries 18-19)
-- 6. Notifications & Member Engagement (Queries 20-21)
-- 7. Comprehensive Dashboard Queries (Queries 22-25)
-- ==========================================