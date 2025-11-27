-- ===============================================
-- DATABASE RELATIONSHIP & INTEGRITY TEST QUERIES
-- IntelliFit Smart Gym System (PostgreSQL)
-- Tests all foreign keys, cascades, and constraints
-- Created: November 22, 2025
-- Updated: November 28, 2025 for PostgreSQL
-- ===============================================

-- Connect to intellifit_db database
\c intellifit_db

\echo '========================================'
\echo 'STARTING DATABASE RELATIONSHIP TESTS'
\echo '========================================'
\echo ''

-- ===============================================
-- SECTION 1: USER & PROFILE RELATIONSHIPS
-- Tests users, member_profiles, coach_profiles relationships
-- ===============================================
\echo '--- SECTION 1: User & Profile Relationships ---'
\echo ''

-- 1.1: Verify User table structure
\echo '1.1: Checking users table columns...'
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 1.2: Count users by role (0=Member, 1=Coach, 2=Admin)
\echo '1.2: Count users by Role...'
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

-- 1.3: Users with their member profiles
\echo '1.3: Users with member profiles...'
SELECT 
    u."UserId",
    u."Name",
    u."Email",
    u."Role",
    mp."FitnessGoal",
    mp."CurrentWeight",
    mp."Height"
FROM users u
LEFT JOIN member_profiles mp ON u."UserId" = mp."UserId"
WHERE u."Role" = 0 -- Members only
ORDER BY u."UserId";

-- 1.4: Users with their coach profiles
\echo '1.4: Users with coach profiles...'
SELECT 
    u."UserId",
    u."Name",
    u."Email",
    cp."CoachId",
    cp."Specialization",
    cp."ExperienceYears",
    cp."Rating"
FROM users u
INNER JOIN coach_profiles cp ON u."UserId" = cp."UserId"
WHERE u."Role" = 1 -- Coaches only
ORDER BY cp."CoachId";

-- 1.5: Find orphaned profiles (profiles without valid user)
\echo '1.5: Checking for orphaned profile FKs...'
SELECT 'Orphaned MemberProfile' AS issue_type, mp."UserId"
FROM member_profiles mp
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u."UserId" = mp."UserId")
UNION ALL
SELECT 'Orphaned CoachProfile' AS issue_type, cp."UserId"
FROM coach_profiles cp
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u."UserId" = cp."UserId");

-- ===============================================
-- SECTION 2: EQUIPMENT & BOOKING RELATIONSHIPS
-- Tests equipment, equipment_categories, bookings relationships
-- ===============================================
\echo ''
\echo '--- SECTION 2: Equipment & Booking Relationships ---'
\echo ''

-- 2.1: Equipment with their categories and booking counts
\echo '2.1: Equipment with categories and bookings...'
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

-- 2.2: Bookings with User and Equipment details
\echo '2.2: Bookings with User and Equipment details...'
SELECT 
    b."BookingId",
    u."Name" AS user_name,
    e."Name" AS equipment_name,
    b."StartTime",
    b."EndTime",
    b."BookingStatus" -- 0=Pending, 1=Confirmed, 2=InProgress, 3=Completed, 4=Cancelled
FROM bookings b
INNER JOIN users u ON b."UserId" = u."UserId"
LEFT JOIN equipment e ON b."EquipmentId" = e."EquipmentId"
ORDER BY b."StartTime" DESC
LIMIT 20;

-- 2.3: Find orphaned Bookings (invalid User or Equipment FK)
\echo '2.3: Checking for orphaned Booking FKs...'
SELECT 'Invalid UserId' AS issue_type, b."BookingId", b."UserId"
FROM bookings b
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u."UserId" = b."UserId")
UNION ALL
SELECT 'Invalid EquipmentId' AS issue_type, b."BookingId", b."EquipmentId"
FROM bookings b
WHERE b."EquipmentId" IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM equipment e WHERE e."EquipmentId" = b."EquipmentId");

-- ===============================================
-- SECTION 3: WORKOUT SYSTEM RELATIONSHIPS
-- Tests exercises, workout_plans, workout_logs, workout_templates
-- ===============================================
\echo ''
\echo '--- SECTION 3: Workout System Relationships ---'
\echo ''

-- 3.1: Workout templates with their exercises
\echo '3.1: Workout templates with exercises...'
SELECT 
    wt."TemplateId",
    wt."TemplateName",
    wt."DifficultyLevel",
    u."Name" AS created_by_coach,
    COUNT(wte."ExerciseId") AS total_exercises,
    string_agg(e."Name", ', ') AS exercise_names
FROM workout_templates wt
LEFT JOIN workout_template_exercises wte ON wt."TemplateId" = wte."TemplateId"
LEFT JOIN exercises e ON wte."ExerciseId" = e."ExerciseId"
LEFT JOIN coach_profiles cp ON wt."CreatedByCoachId" = cp."CoachId"
LEFT JOIN users u ON cp."UserId" = u."UserId"
GROUP BY wt."TemplateId", wt."TemplateName", wt."DifficultyLevel", u."Name"
ORDER BY wt."TemplateId";

-- 3.2: Workout plans with their relationships
\echo '3.2: Workout plans with User and Coach...'
SELECT 
    wp."PlanId",
    wp."PlanName",
    u."Name" AS member_name,
    c."Name" AS coach_name,
    wp."Status",
    wp."StartDate",
    wp."EndDate"
FROM workout_plans wp
INNER JOIN users u ON wp."UserId" = u."UserId"
LEFT JOIN coach_profiles cp ON wp."GeneratedByCoachId" = cp."CoachId"
LEFT JOIN users c ON cp."UserId" = c."UserId"
ORDER BY wp."StartDate" DESC
LIMIT 20;

-- 3.3: Workout plan exercises
\echo '3.3: Workout plan exercises...'
SELECT 
    wp."PlanName",
    e."Name" AS exercise_name,
    wpe."Sets",
    wpe."Reps",
    wpe."DayNumber",
    wpe."OrderInDay"
FROM workout_plan_exercises wpe
INNER JOIN workout_plans wp ON wpe."WorkoutPlanId" = wp."PlanId"
INNER JOIN exercises e ON wpe."ExerciseId" = e."ExerciseId"
ORDER BY wp."PlanId", wpe."DayNumber", wpe."OrderInDay"
LIMIT 50;

-- 3.4: Workout logs by member
\echo '3.4: Recent workout logs...'
SELECT 
    wl."LogId",
    u."Name" AS member_name,
    wl."WorkoutDate",
    wl."DurationMinutes",
    wl."CaloriesBurned",
    wl."Completed"
FROM workout_logs wl
INNER JOIN users u ON wl."UserId" = u."UserId"
ORDER BY wl."WorkoutDate" DESC
LIMIT 20;

-- 3.5: Exercises not used in any workout plan
\echo '3.5: Unused exercises...'
SELECT 
    e."ExerciseId",
    e."Name",
    e."Category",
    e."MuscleGroup",
    e."DifficultyLevel"
FROM exercises e
WHERE NOT EXISTS (
    SELECT 1 FROM workout_plan_exercises wpe 
    WHERE wpe."ExerciseId" = e."ExerciseId"
)
AND e."IsActive" = true;

-- ===============================================
-- SECTION 4: NUTRITION SYSTEM RELATIONSHIPS
-- Tests nutrition_plans, meals, meal_ingredients, ingredients
-- ===============================================
\echo ''
\echo '--- SECTION 4: Nutrition System Relationships ---'
\echo ''

-- 4.1: Nutrition plans with their relationships
\echo '4.1: Nutrition plans with User and Coach...'
SELECT 
    np.PlanID,
    np.PlanName,
    u.Name AS MemberName,
    ai.ModelName AS AIModel,
    c.Name AS ReviewedByCoach,
    np.ApprovalStatus,
    np.PlanSource,
    np.DailyCalories
FROM NutritionPlans np
INNER JOIN Users u ON np.UserID = u.UserId
INNER JOIN AI_Agents ai ON np.AI_ID = ai.AI_ID
LEFT JOIN Users c ON np.ReviewedByCoachID = c.UserId
ORDER BY np.GeneratedAt DESC;
GO

-- 4.2: NutritionPlan -> Meal relationship
PRINT '4.2: Nutrition plans with their meals...';
SELECT 
    np.PlanID,
    np.PlanName,
    COUNT(m.MealID) AS TotalMeals,
    SUM(m.Calories) AS TotalCalories,
    STRING_AGG(m.MealName, ', ') AS MealNames
FROM NutritionPlans np
LEFT JOIN Meals m ON np.PlanID = m.PlanID
GROUP BY np.PlanID, np.PlanName
ORDER BY np.PlanID;
GO

-- 4.3: Meal -> MealIngredient -> Ingredient chain
PRINT '4.3: Meals with their ingredients...';
SELECT 
    m.MealID,
    m.MealName,
    COUNT(mi.IngredientID) AS TotalIngredients,
    STRING_AGG(i.IngredientName, ', ') AS Ingredients
FROM Meals m
LEFT JOIN MealIngredients mi ON m.MealID = mi.MealID
LEFT JOIN Ingredients i ON mi.IngredientID = i.IngredientID
GROUP BY m.MealID, m.MealName
ORDER BY m.MealID;
GO

-- 4.4: Find orphaned nutrition system records
PRINT '4.4: Checking for orphaned Nutrition FKs...';
SELECT 'NutritionPlan - Invalid UserID' AS IssueType, np.PlanID, np.UserID
FROM NutritionPlans np
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.UserId = np.UserID)
UNION ALL
SELECT 'NutritionPlan - Invalid AI_ID' AS IssueType, np.PlanID, np.AI_ID
FROM NutritionPlans np
WHERE NOT EXISTS (SELECT 1 FROM AI_Agents ai WHERE ai.AI_ID = np.AI_ID)
UNION ALL
SELECT 'Meal - Invalid PlanID' AS IssueType, m.MealID, m.PlanID
FROM Meals m
WHERE NOT EXISTS (SELECT 1 FROM NutritionPlans np WHERE np.PlanID = m.PlanID)
UNION ALL
SELECT 'MealIngredient - Invalid MealID' AS IssueType, mi.MealID, mi.IngredientID
FROM MealIngredients mi
WHERE NOT EXISTS (SELECT 1 FROM Meals m WHERE m.MealID = mi.MealID)
UNION ALL
SELECT 'MealIngredient - Invalid IngredientID' AS IssueType, mi.MealID, mi.IngredientID
FROM MealIngredients mi
WHERE NOT EXISTS (SELECT 1 FROM Ingredients i WHERE i.IngredientID = mi.IngredientID);
GO

-- ===============================================
-- SECTION 5: AI FEATURES RELATIONSHIPS
-- Tests AI_Agent connections to all AI-generated content
-- ===============================================
PRINT '';
PRINT '--- SECTION 5: AI Features Relationships ---';
PRINT '';

-- 5.1: AI_Agent usage across all features
PRINT '5.1: AI Agent usage statistics...';
SELECT 
    ai.AI_ID,
    ai.ModelName,
    ai.Provider,
    ai.Status,
    COUNT(DISTINCT wr.RecommendationID) AS WorkoutRecommendations,
    COUNT(DISTINCT np.PlanID) AS NutritionPlans,
    COUNT(DISTINCT efa.AnalysisID) AS FormAnalyses,
    COUNT(DISTINCT aq.QueryID) AS QueryLogs
FROM AI_Agents ai
LEFT JOIN WorkoutRecommendations wr ON ai.AI_ID = wr.AI_ID
LEFT JOIN NutritionPlans np ON ai.AI_ID = np.AI_ID
LEFT JOIN ExerciseFormAnalyses efa ON ai.AI_ID = efa.AI_ID
LEFT JOIN AIQueryLogs aq ON ai.AI_ID = aq.AI_ID
GROUP BY ai.AI_ID, ai.ModelName, ai.Provider, ai.Status;
GO

-- 5.2: WorkoutRecommendation -> RecommendedExercise relationship
PRINT '5.2: Workout recommendations with exercises...';
SELECT 
    wr.RecommendationID,
    wr.RecommendationName,
    u.Name AS MemberName,
    wr.ApprovalStatus,
    COUNT(re.ExerciseID) AS TotalExercises,
    STRING_AGG(e.Name, ', ') AS ExerciseNames
FROM WorkoutRecommendations wr
INNER JOIN Users u ON wr.UserID = u.UserId
LEFT JOIN RecommendedExercises re ON wr.RecommendationID = re.RecommendationID
LEFT JOIN Exercises e ON re.ExerciseID = e.ExerciseID
GROUP BY wr.RecommendationID, wr.RecommendationName, u.Name, wr.ApprovalStatus
ORDER BY wr.GeneratedAt DESC;
GO

-- 5.3: ChurnPrediction for users
PRINT '5.3: Churn predictions for members...';
SELECT 
    cp.PredictionID,
    u.Name AS MemberName,
    cp.RiskLevel,
    cp.ChurnProbability,
    cp.PredictionDate
FROM ChurnPredictions cp
INNER JOIN Users u ON cp.UserID = u.UserId
ORDER BY cp.ChurnProbability DESC;
GO

-- 5.4: EquipmentDemandPrediction
PRINT '5.4: Equipment demand predictions...';
SELECT 
    edp.PredictionID,
    e.Name AS EquipmentName,
    edp.PredictedDemand,
    edp.PredictionDate
FROM EquipmentDemandPredictions edp
INNER JOIN Equipments e ON edp.EquipmentID = e.EquipmentID
ORDER BY edp.PredictedDemand DESC;
GO

-- 5.5: ExerciseFormAnalysis -> WorkoutSession relationship
PRINT '5.5: Form analysis with workout sessions...';
SELECT 
    efa.AnalysisID,
    u.Name AS MemberName,
    e.Name AS Exercise,
    efa.FormScore,
    efa.FeedbackMessage,
    ws.StartTime AS SessionTime
FROM ExerciseFormAnalyses efa
INNER JOIN WorkoutSessions ws ON efa.SessionID = ws.SessionID
INNER JOIN Users u ON ws.UserID = u.UserId
INNER JOIN Exercises e ON efa.ExerciseID = e.ExerciseID
ORDER BY efa.AnalysisTimestamp DESC;
GO

-- ===============================================
-- SECTION 6: WORKOUT SESSION RELATIONSHIPS
-- Tests WorkoutSession multi-FK (User, Equipment, Coach)
-- ===============================================
PRINT '';
PRINT '--- SECTION 6: Workout Session Multi-FK Tests ---';
PRINT '';

-- 6.1: WorkoutSession with all relationships
PRINT '6.1: Workout sessions with User, Equipment, Coach...';
SELECT 
    ws.SessionID,
    u.Name AS MemberName,
    e.Name AS EquipmentName,
    c.Name AS CoachName,
    ws.StartTime,
    ws.DurationMinutes,
    ws.CaloriesBurned,
    ws.IsSupervisedByCoach
FROM WorkoutSessions ws
INNER JOIN Users u ON ws.UserID = u.UserId
INNER JOIN Equipments e ON ws.EquipmentID = e.EquipmentID
LEFT JOIN Users c ON ws.CoachID = c.UserId
ORDER BY ws.StartTime DESC;
GO

-- 6.2: Find sessions with invalid Coach FK (CoachID not pointing to Coach UserType)
PRINT '6.2: Checking WorkoutSession CoachID integrity...';
SELECT 
    ws.SessionID,
    ws.CoachID,
    u.Name,
    u.UserType
FROM WorkoutSessions ws
INNER JOIN Users u ON ws.CoachID = u.UserId
WHERE u.UserType != 'Coach';
GO

-- 6.3: WorkoutSession -> HeartRateData relationship
PRINT '6.3: Workout sessions with heart rate data...';
SELECT 
    ws.SessionID,
    u.Name AS MemberName,
    COUNT(hr.RecordID) AS HeartRateRecords,
    AVG(hr.HeartRate) AS AvgHeartRate,
    ws.AverageHeartRate AS SessionAvgHeartRate
FROM WorkoutSessions ws
INNER JOIN Users u ON ws.UserID = u.UserId
LEFT JOIN HeartRateData hr ON ws.SessionID = hr.SessionID
GROUP BY ws.SessionID, u.Name, ws.AverageHeartRate
ORDER BY ws.SessionID;
GO

-- ===============================================
-- SECTION 7: PAYMENT & BUSINESS RELATIONSHIPS
-- Tests Payment, TokenTransaction, MemberCoachSubscription, CoachReview
-- ===============================================
PRINT '';
PRINT '--- SECTION 7: Payment & Business Relationships ---';
PRINT '';

-- 7.1: Payment -> User relationship
PRINT '7.1: Payments with user details...';
SELECT 
    p.PaymentID,
    u.Name AS MemberName,
    u.UserType,
    p.PaymentDate,
    p.Amount,
    p.PaymentMethod,
    p.PaymentType,
    p.Status
FROM Payments p
INNER JOIN Users u ON p.UserID = u.UserId
ORDER BY p.PaymentDate DESC;
GO

-- 7.2: TokenTransaction with User and Receptionist
PRINT '7.2: Token transactions with User and Receptionist...';
SELECT 
    tt.TransactionID,
    u.Name AS UserName,
    r.Name AS ReceptionistName,
    tt.TransactionType,
    tt.TokensChanged,
    tt.TransactionDate,
    tt.Reason
FROM TokenTransactions tt
INNER JOIN Users u ON tt.UserID = u.UserId
LEFT JOIN Users r ON tt.ReceptionistID = r.UserId
ORDER BY tt.TransactionDate DESC;
GO

-- 7.3: Verify TokenTransaction ReceptionistID points to Receptionist UserType
PRINT '7.3: Checking TokenTransaction ReceptionistID integrity...';
SELECT 
    tt.TransactionID,
    tt.ReceptionistID,
    u.Name,
    u.UserType
FROM TokenTransactions tt
INNER JOIN Users u ON tt.ReceptionistID = u.UserId
WHERE u.UserType != 'Receptionist';
GO

-- 7.4: MemberCoachSubscription (User + Coach relationship)
PRINT '7.4: Member-Coach subscriptions...';
SELECT 
    mcs.SubscriptionID,
    m.Name AS MemberName,
    c.Name AS CoachName,
    mcs.SubscriptionStatus,
    mcs.StartDate,
    mcs.EndDate,
    mcs.SessionsIncluded,
    mcs.SessionsUsed
FROM MemberCoachSubscriptions mcs
INNER JOIN Users m ON mcs.UserID = m.UserId
INNER JOIN Users c ON mcs.CoachID = c.UserId
ORDER BY mcs.StartDate DESC;
GO

-- 7.5: Verify MemberCoachSubscription CoachID points to Coach UserType
PRINT '7.5: Checking MemberCoachSubscription CoachID integrity...';
SELECT 
    mcs.SubscriptionID,
    mcs.CoachID,
    u.Name,
    u.UserType
FROM MemberCoachSubscriptions mcs
INNER JOIN Users u ON mcs.CoachID = u.UserId
WHERE u.UserType != 'Coach';
GO

-- 7.6: CoachReview (User reviewing Coach)
PRINT '7.6: Coach reviews...';
SELECT 
    cr.ReviewID,
    m.Name AS ReviewerName,
    c.Name AS CoachName,
    cr.Rating,
    cr.ReviewText,
    cr.ReviewDate
FROM CoachReviews cr
INNER JOIN Users m ON cr.UserID = m.UserId
INNER JOIN Users c ON cr.CoachID = c.UserId
ORDER BY cr.ReviewDate DESC;
GO

-- 7.7: Verify CoachReview CoachID points to Coach UserType
PRINT '7.7: Checking CoachReview CoachID integrity...';
SELECT 
    cr.ReviewID,
    cr.CoachID,
    u.Name,
    u.UserType
FROM CoachReviews cr
INNER JOIN Users u ON cr.CoachID = u.UserId
WHERE u.UserType != 'Coach';
GO

-- ===============================================
-- SECTION 8: HEALTH MONITORING RELATIONSHIPS
-- Tests InBodyMeasurement, WearableDevice, HeartRateData
-- ===============================================
PRINT '';
PRINT '--- SECTION 8: Health Monitoring Relationships ---';
PRINT '';

-- 8.1: InBodyMeasurement with User and Receptionist
PRINT '8.1: InBody measurements with User and Receptionist...';
SELECT 
    ibm.InBodyID,
    u.Name AS MemberName,
    r.Name AS ReceptionistName,
    ibm.MeasurementDate,
    ibm.Weight,
    ibm.BodyFatPercentage,
    ibm.MuscleMass,
    ibm.BMI
FROM InBodyMeasurements ibm
INNER JOIN Users u ON ibm.UserID = u.UserId
LEFT JOIN Users r ON ibm.ReceptionistID = r.UserId
ORDER BY ibm.MeasurementDate DESC;
GO

-- 8.2: Verify InBodyMeasurement ReceptionistID points to Receptionist UserType
PRINT '8.2: Checking InBodyMeasurement ReceptionistID integrity...';
SELECT 
    ibm.InBodyID,
    ibm.ReceptionistID,
    u.Name,
    u.UserType
FROM InBodyMeasurements ibm
INNER JOIN Users u ON ibm.ReceptionistID = u.UserId
WHERE u.UserType != 'Receptionist';
GO

-- 8.3: WearableDevice -> User relationship
PRINT '8.3: Wearable devices by user...';
SELECT 
    wd.DeviceID,
    u.Name AS MemberName,
    wd.DeviceType,
    wd.DeviceBrand,
    wd.IsActive,
    wd.LastSyncedAt
FROM WearableDevices wd
INNER JOIN Users u ON wd.UserID = u.UserId
ORDER BY wd.LastSyncedAt DESC;
GO

-- 8.4: HeartRateData -> WearableDevice + WorkoutSession
PRINT '8.4: Heart rate data with device and session...';
SELECT 
    hr.RecordID,
    u.Name AS MemberName,
    wd.DeviceType,
    hr.HeartRate,
    hr.RecordedAt,
    ws.SessionID
FROM HeartRateData hr
INNER JOIN WearableDevices wd ON hr.DeviceID = wd.DeviceID
INNER JOIN Users u ON wd.UserID = u.UserId
LEFT JOIN WorkoutSessions ws ON hr.SessionID = ws.SessionID
ORDER BY hr.RecordedAt DESC;
GO

-- ===============================================
-- SECTION 9: PROGRESS & NOTIFICATION RELATIONSHIPS
-- Tests ProgressMilestone, Notification
-- ===============================================
PRINT '';
PRINT '--- SECTION 9: Progress & Notification Relationships ---';
PRINT '';

-- 9.1: ProgressMilestone -> User relationship
PRINT '9.1: Progress milestones by user...';
SELECT 
    pm.MilestoneID,
    u.Name AS MemberName,
    pm.MilestoneName,
    pm.Description,
    pm.AchievedAt
FROM ProgressMilestones pm
INNER JOIN Users u ON pm.UserID = u.UserId
ORDER BY pm.AchievedAt DESC;
GO

-- 9.2: Notification -> User relationship
PRINT '9.2: Notifications by user...';
SELECT 
    n.NotificationID,
    u.Name AS MemberName,
    n.NotificationType,
    n.Message,
    n.IsRead,
    n.CreatedAt
FROM Notifications n
INNER JOIN Users u ON n.UserID = u.UserId
ORDER BY n.CreatedAt DESC;
GO

-- ===============================================
-- SECTION 10: CASCADE DELETE & CONSTRAINT TESTS
-- Tests ON DELETE behaviors
-- ===============================================
PRINT '';
PRINT '--- SECTION 10: Cascade Delete & Constraint Tests ---';
PRINT '';

-- 10.1: List all foreign keys with their delete behavior
PRINT '10.1: Foreign key constraints with delete behavior...';
SELECT 
    OBJECT_NAME(f.parent_object_id) AS TableName,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
    OBJECT_NAME(f.referenced_object_id) AS ReferencedTable,
    COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS ReferencedColumn,
    f.name AS ForeignKeyName,
    f.delete_referential_action_desc AS DeleteAction
FROM sys.foreign_keys AS f
INNER JOIN sys.foreign_key_columns AS fc ON f.object_id = fc.constraint_object_id
ORDER BY TableName, ColumnName;
GO

-- 10.2: Find tables with CASCADE delete on Users
PRINT '10.2: Tables with CASCADE delete on Users...';
SELECT 
    OBJECT_NAME(f.parent_object_id) AS TableName,
    f.name AS ForeignKeyName,
    f.delete_referential_action_desc AS DeleteAction
FROM sys.foreign_keys AS f
INNER JOIN sys.foreign_key_columns AS fc ON f.object_id = fc.constraint_object_id
WHERE OBJECT_NAME(f.referenced_object_id) = 'Users'
  AND f.delete_referential_action_desc = 'CASCADE'
ORDER BY TableName;
GO

-- 10.3: Find tables with NO_ACTION delete on Users
PRINT '10.3: Tables with NO_ACTION delete on Users...';
SELECT 
    OBJECT_NAME(f.parent_object_id) AS TableName,
    COL_NAME(fc.parent_object_id, fc.parent_column_id) AS ColumnName,
    f.name AS ForeignKeyName,
    f.delete_referential_action_desc AS DeleteAction
FROM sys.foreign_keys AS f
INNER JOIN sys.foreign_key_columns AS fc ON f.object_id = fc.constraint_object_id
WHERE OBJECT_NAME(f.referenced_object_id) = 'Users'
  AND f.delete_referential_action_desc = 'NO_ACTION'
ORDER BY TableName;
GO

-- 10.4: Count child records per user (to test cascade impact)
PRINT '10.4: Count child records per user (cascade impact)...';
SELECT 
    u.UserId,
    u.Name,
    u.UserType,
    (SELECT COUNT(*) FROM Bookings WHERE UserID = u.UserId) AS Bookings,
    (SELECT COUNT(*) FROM WorkoutSessions WHERE UserID = u.UserId) AS WorkoutSessions,
    (SELECT COUNT(*) FROM Payments WHERE UserID = u.UserId) AS Payments,
    (SELECT COUNT(*) FROM MemberWorkoutPlans WHERE UserID = u.UserId) AS WorkoutPlans,
    (SELECT COUNT(*) FROM NutritionPlans WHERE UserID = u.UserId) AS NutritionPlans,
    (SELECT COUNT(*) FROM InBodyMeasurements WHERE UserID = u.UserId) AS InBodyMeasurements,
    (SELECT COUNT(*) FROM WearableDevices WHERE UserID = u.UserId) AS WearableDevices
FROM Users u
ORDER BY u.UserId;
GO

-- 10.5: Verify NO_ACTION constraints are properly configured (no cycles)
PRINT '10.5: Multi-FK tables (potential cascade conflicts)...';
SELECT 
    OBJECT_NAME(f.parent_object_id) AS TableName,
    COUNT(DISTINCT f.referenced_object_id) AS ReferencedTableCount,
    STRING_AGG(OBJECT_NAME(f.referenced_object_id), ', ') AS ReferencedTables
FROM sys.foreign_keys AS f
GROUP BY OBJECT_NAME(f.parent_object_id)
HAVING COUNT(DISTINCT f.referenced_object_id) > 1
ORDER BY ReferencedTableCount DESC;
GO

-- ===============================================
-- SECTION 11: SAFETY & GYM OCCUPANCY RELATIONSHIPS
-- Tests SafetyIncident, GymOccupancy
-- ===============================================
PRINT '';
PRINT '--- SECTION 11: Safety & Gym Occupancy Relationships ---';
PRINT '';

-- 11.1: SafetyIncident -> Equipment + User relationships
PRINT '11.1: Safety incidents with equipment and user...';
SELECT 
    si.IncidentID,
    u.Name AS ReportedByUser,
    e.Name AS EquipmentInvolved,
    si.IncidentType,
    si.Severity,
    si.IncidentDate,
    si.Description
FROM SafetyIncidents si
LEFT JOIN Users u ON si.ReportedByUserID = u.UserId
LEFT JOIN Equipments e ON si.EquipmentID = e.EquipmentID
ORDER BY si.IncidentDate DESC;
GO

-- 11.2: GymOccupancy statistics
PRINT '11.2: Gym occupancy data...';
SELECT 
    go.OccupancyID,
    go.RecordedAt,
    go.CurrentOccupancy,
    go.MaxCapacity,
    (go.CurrentOccupancy * 100.0 / go.MaxCapacity) AS OccupancyPercentage
FROM GymOccupancies go
ORDER BY go.RecordedAt DESC;
GO

-- ===============================================
-- SECTION 12: COMPREHENSIVE ORPHANED FK CHECK
-- Single query to find ALL orphaned foreign keys
-- ===============================================
PRINT '';
PRINT '--- SECTION 12: Comprehensive Orphaned FK Check ---';
PRINT '';

PRINT '12.1: Complete orphaned foreign key scan...';
PRINT 'Checking all foreign key relationships for integrity...';

-- This will show any FK that points to a non-existent record
SELECT 
    'Bookings->Users' AS Relationship,
    COUNT(*) AS OrphanCount
FROM Bookings b
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.UserId = b.UserID)
UNION ALL
SELECT 'Bookings->Equipments', COUNT(*)
FROM Bookings b
WHERE NOT EXISTS (SELECT 1 FROM Equipments e WHERE e.EquipmentID = b.EquipmentID)
UNION ALL
SELECT 'WorkoutSessions->Users', COUNT(*)
FROM WorkoutSessions ws
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.UserId = ws.UserID)
UNION ALL
SELECT 'WorkoutSessions->Equipments', COUNT(*)
FROM WorkoutSessions ws
WHERE NOT EXISTS (SELECT 1 FROM Equipments e WHERE e.EquipmentID = ws.EquipmentID)
UNION ALL
SELECT 'WorkoutSessions->Coach', COUNT(*)
FROM WorkoutSessions ws
WHERE ws.CoachID IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM Users u WHERE u.UserId = ws.CoachID)
UNION ALL
SELECT 'NutritionPlans->Users', COUNT(*)
FROM NutritionPlans np
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.UserId = np.UserID)
UNION ALL
SELECT 'NutritionPlans->AI_Agents', COUNT(*)
FROM NutritionPlans np
WHERE NOT EXISTS (SELECT 1 FROM AI_Agents ai WHERE ai.AI_ID = np.AI_ID)
UNION ALL
SELECT 'MemberWorkoutPlans->Users', COUNT(*)
FROM MemberWorkoutPlans mwp
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.UserId = mwp.UserID)
UNION ALL
SELECT 'Payments->Users', COUNT(*)
FROM Payments p
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.UserId = p.UserID)
UNION ALL
SELECT 'TokenTransactions->Users', COUNT(*)
FROM TokenTransactions tt
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.UserId = tt.UserID)
UNION ALL
SELECT 'InBodyMeasurements->Users', COUNT(*)
FROM InBodyMeasurements ibm
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.UserId = ibm.UserID)
UNION ALL
SELECT 'WearableDevices->Users', COUNT(*)
FROM WearableDevices wd
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.UserId = wd.UserID)
UNION ALL
SELECT 'CoachReviews->Coach', COUNT(*)
FROM CoachReviews cr
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.UserId = cr.CoachID)
UNION ALL
SELECT 'MemberCoachSubscriptions->Coach', COUNT(*)
FROM MemberCoachSubscriptions mcs
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.UserId = mcs.CoachID)
ORDER BY OrphanCount DESC;
GO

-- ===============================================
-- SECTION 13: SUMMARY STATISTICS
-- Overall database health metrics
-- ===============================================
PRINT '';
PRINT '--- SECTION 13: Database Summary Statistics ---';
PRINT '';

PRINT '13.1: Table row counts...';
SELECT 
    'Users' AS TableName, COUNT(*) AS RowCount FROM Users
UNION ALL SELECT 'Equipments', COUNT(*) FROM Equipments
UNION ALL SELECT 'Bookings', COUNT(*) FROM Bookings
UNION ALL SELECT 'WorkoutSessions', COUNT(*) FROM WorkoutSessions
UNION ALL SELECT 'Exercises', COUNT(*) FROM Exercises
UNION ALL SELECT 'WorkoutPlanTemplates', COUNT(*) FROM WorkoutPlanTemplates
UNION ALL SELECT 'MemberWorkoutPlans', COUNT(*) FROM MemberWorkoutPlans
UNION ALL SELECT 'NutritionPlans', COUNT(*) FROM NutritionPlans
UNION ALL SELECT 'Meals', COUNT(*) FROM Meals
UNION ALL SELECT 'Ingredients', COUNT(*) FROM Ingredients
UNION ALL SELECT 'AI_Agents', COUNT(*) FROM AI_Agents
UNION ALL SELECT 'WorkoutRecommendations', COUNT(*) FROM WorkoutRecommendations
UNION ALL SELECT 'Payments', COUNT(*) FROM Payments
UNION ALL SELECT 'TokenTransactions', COUNT(*) FROM TokenTransactions
UNION ALL SELECT 'InBodyMeasurements', COUNT(*) FROM InBodyMeasurements
UNION ALL SELECT 'WearableDevices', COUNT(*) FROM WearableDevices
UNION ALL SELECT 'CoachReviews', COUNT(*) FROM CoachReviews
UNION ALL SELECT 'MaintenanceLogs', COUNT(*) FROM MaintenanceLogs
UNION ALL SELECT 'SafetyIncidents', COUNT(*) FROM SafetyIncidents
UNION ALL SELECT 'GymOccupancies', COUNT(*) FROM GymOccupancies
ORDER BY RowCount DESC;
GO

PRINT '';
PRINT '========================================';
PRINT 'DATABASE RELATIONSHIP TESTS COMPLETED';
PRINT '========================================';
PRINT '';
PRINT 'Review the output above for:';
PRINT '  - Orphaned foreign keys (should be 0)';
PRINT '  - UserType integrity (Coach/Admin/Receptionist FKs)';
PRINT '  - Cascade delete configurations';
PRINT '  - Relationship counts and data distribution';
PRINT '';
