-- ===============================================
-- DATABASE RELATIONSHIP & INTEGRITY TEST QUERIES
-- IntelliFit Smart Gym System
-- Tests all foreign keys, cascades, and constraints
-- Created: November 22, 2025
-- ===============================================

USE IntelliFitDb;
GO

PRINT '========================================';
PRINT 'STARTING DATABASE RELATIONSHIP TESTS';
PRINT '========================================';
PRINT '';

-- ===============================================
-- SECTION 1: USER INHERITANCE (TPH) TESTS
-- Tests Table Per Hierarchy for User/Admin/Coach/Receptionist
-- ===============================================
PRINT '--- SECTION 1: User Inheritance (TPH) Tests ---';
PRINT '';

-- 1.1: Verify User table has UserType discriminator column
PRINT '1.1: Checking UserType discriminator column exists...';
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'UserType';
GO

-- 1.2: Count users by type (TPH inheritance)
PRINT '1.2: Count users by UserType...';
SELECT 
    UserType,
    COUNT(*) AS UserCount
FROM Users
GROUP BY UserType;
GO

-- 1.3: Verify all user types have correct Role enum values
PRINT '1.3: Verify UserType matches Role...';
SELECT 
    UserType,
    Role,
    COUNT(*) AS Count
FROM Users
GROUP BY UserType, Role
ORDER BY UserType;
GO

-- 1.4: Test User -> SubscriptionPlan relationship (nullable FK)
PRINT '1.4: Users with subscription plans...';
SELECT 
    u.UserId,
    u.Name,
    u.UserType,
    u.SubscriptionPlanID,
    sp.PlanName,
    sp.MonthlyFee
FROM Users u
LEFT JOIN SubscriptionPlans sp ON u.SubscriptionPlanID = sp.PlanID
ORDER BY u.UserType, u.UserId;
GO

-- 1.5: Find orphaned users (SubscriptionPlanID pointing to non-existent plans)
PRINT '1.5: Checking for orphaned User->SubscriptionPlan FKs...';
SELECT 
    u.UserId,
    u.Name,
    u.SubscriptionPlanID AS InvalidPlanID
FROM Users u
WHERE u.SubscriptionPlanID IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM SubscriptionPlans sp WHERE sp.PlanID = u.SubscriptionPlanID);
GO

-- ===============================================
-- SECTION 2: EQUIPMENT & BOOKING RELATIONSHIPS
-- Tests Equipment connections to Bookings, WorkoutSessions, MaintenanceLogs, etc.
-- ===============================================
PRINT '';
PRINT '--- SECTION 2: Equipment & Booking Relationships ---';
PRINT '';

-- 2.1: Equipment -> Bookings relationship
PRINT '2.1: Equipment with their bookings...';
SELECT 
    e.EquipmentID,
    e.Name AS EquipmentName,
    e.Status,
    COUNT(b.BookingID) AS TotalBookings
FROM Equipments e
LEFT JOIN Bookings b ON e.EquipmentID = b.EquipmentID
GROUP BY e.EquipmentID, e.Name, e.Status
ORDER BY TotalBookings DESC;
GO

-- 2.2: Test Booking -> User + Equipment (both required FKs)
PRINT '2.2: Bookings with User and Equipment details...';
SELECT 
    b.BookingID,
    u.Name AS UserName,
    e.Name AS EquipmentName,
    b.StartTime,
    b.EndTime,
    b.Status,
    b.TokensDeducted
FROM Bookings b
INNER JOIN Users u ON b.UserID = u.UserId
INNER JOIN Equipments e ON b.EquipmentID = e.EquipmentID
ORDER BY b.StartTime DESC;
GO

-- 2.3: Find orphaned Bookings (invalid User or Equipment FK)
PRINT '2.3: Checking for orphaned Booking FKs...';
SELECT 'Invalid UserID' AS IssueType, b.* 
FROM Bookings b
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.UserId = b.UserID)
UNION ALL
SELECT 'Invalid EquipmentID' AS IssueType, b.* 
FROM Bookings b
WHERE NOT EXISTS (SELECT 1 FROM Equipments e WHERE e.EquipmentID = b.EquipmentID);
GO

-- 2.4: Equipment -> WorkoutSessions relationship
PRINT '2.4: Equipment usage in workout sessions...';
SELECT 
    e.EquipmentID,
    e.Name AS EquipmentName,
    COUNT(ws.SessionID) AS TotalSessions,
    SUM(ws.DurationMinutes) AS TotalMinutesUsed,
    AVG(ws.CaloriesBurned) AS AvgCaloriesBurned
FROM Equipments e
LEFT JOIN WorkoutSessions ws ON e.EquipmentID = ws.EquipmentID
GROUP BY e.EquipmentID, e.Name
ORDER BY TotalMinutesUsed DESC;
GO

-- 2.5: Equipment -> MaintenanceLogs relationship
PRINT '2.5: Equipment maintenance history...';
SELECT 
    e.EquipmentID,
    e.Name AS EquipmentName,
    e.LastMaintenanceDate,
    e.NextMaintenanceDate,
    COUNT(ml.MaintenanceID) AS MaintenanceRecords
FROM Equipments e
LEFT JOIN MaintenanceLogs ml ON e.EquipmentID = ml.EquipmentID
GROUP BY e.EquipmentID, e.Name, e.LastMaintenanceDate, e.NextMaintenanceDate
ORDER BY e.EquipmentID;
GO

-- ===============================================
-- SECTION 3: WORKOUT SYSTEM RELATIONSHIPS
-- Tests Exercise, WorkoutPlanTemplate, TemplateExercise, MemberWorkoutPlan
-- ===============================================
PRINT '';
PRINT '--- SECTION 3: Workout System Relationships ---';
PRINT '';

-- 3.1: WorkoutPlanTemplate -> TemplateExercise -> Exercise chain
PRINT '3.1: Workout templates with their exercises...';
SELECT 
    wpt.TemplateID,
    wpt.TemplateName,
    COUNT(te.ExerciseID) AS TotalExercises,
    STRING_AGG(e.Name, ', ') AS ExerciseNames
FROM WorkoutPlanTemplates wpt
LEFT JOIN TemplateExercises te ON wpt.TemplateID = te.TemplateID
LEFT JOIN Exercises e ON te.ExerciseID = e.ExerciseID
GROUP BY wpt.TemplateID, wpt.TemplateName
ORDER BY wpt.TemplateID;
GO

-- 3.2: MemberWorkoutPlan relationships (User, Template, Coach, AI)
PRINT '3.2: Member workout plans with all relationships...';
SELECT 
    mwp.PlanInstanceID,
    u.Name AS MemberName,
    wpt.TemplateName,
    c.Name AS AssignedByCoach,
    ai.ModelName AS GeneratedByAI,
    mwp.PlanSource,
    mwp.Status,
    mwp.StartDate,
    mwp.EndDate
FROM MemberWorkoutPlans mwp
INNER JOIN Users u ON mwp.UserID = u.UserId
LEFT JOIN WorkoutPlanTemplates wpt ON mwp.TemplateID = wpt.TemplateID
LEFT JOIN Users c ON mwp.AssignedByCoachID = c.UserId
LEFT JOIN AI_Agents ai ON mwp.GeneratedByAI_ID = ai.AI_ID
ORDER BY mwp.StartDate DESC;
GO

-- 3.3: Find orphaned MemberWorkoutPlans
PRINT '3.3: Checking for orphaned MemberWorkoutPlan FKs...';
SELECT 'Invalid UserID' AS IssueType, mwp.* 
FROM MemberWorkoutPlans mwp
WHERE NOT EXISTS (SELECT 1 FROM Users u WHERE u.UserId = mwp.UserID)
UNION ALL
SELECT 'Invalid TemplateID' AS IssueType, mwp.* 
FROM MemberWorkoutPlans mwp
WHERE mwp.TemplateID IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM WorkoutPlanTemplates wpt WHERE wpt.TemplateID = mwp.TemplateID)
UNION ALL
SELECT 'Invalid CoachID' AS IssueType, mwp.* 
FROM MemberWorkoutPlans mwp
WHERE mwp.AssignedByCoachID IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM Users u WHERE u.UserId = mwp.AssignedByCoachID AND u.UserType = 'Coach')
UNION ALL
SELECT 'Invalid AI_ID' AS IssueType, mwp.* 
FROM MemberWorkoutPlans mwp
WHERE mwp.GeneratedByAI_ID IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM AI_Agents ai WHERE ai.AI_ID = mwp.GeneratedByAI_ID);
GO

-- 3.4: Exercises not used in any template
PRINT '3.4: Unused exercises (not in any template)...';
SELECT 
    e.ExerciseID,
    e.Name,
    e.Category,
    e.DifficultyLevel
FROM Exercises e
WHERE NOT EXISTS (SELECT 1 FROM TemplateExercises te WHERE te.ExerciseID = e.ExerciseID);
GO

-- ===============================================
-- SECTION 4: NUTRITION SYSTEM RELATIONSHIPS
-- Tests NutritionPlan, Meal, MealIngredient, Ingredient chain
-- ===============================================
PRINT '';
PRINT '--- SECTION 4: Nutrition System Relationships ---';
PRINT '';

-- 4.1: NutritionPlan -> User, AI_Agent, Coach relationships
PRINT '4.1: Nutrition plans with their relationships...';
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
