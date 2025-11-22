USE IntelliFitDb;



SELECT  *
FROM Users u
LEFT JOIN SubscriptionPlans sp ON u.SubscriptionPlanID = sp.PlanID
WHERE u.Name = 'Ahmed Hassan';



SELECT *
FROM Payments p
INNER JOIN Users u ON p.UserID = u.UserId
WHERE u.Name = 'Ahmed Hassan'
ORDER BY p.PaymentDate;




-- 2.1: View available equipment
PRINT '2.1: Available Equipment for Booking';
SELECT *
FROM Equipments e
WHERE e.Status = 0  -- 0 = Available
ORDER BY e.Category, e.Name;


-- 2.2: View Ahmed's booking
PRINT '2.2: Ahmed''s Equipment Booking';
SELECT *
FROM Bookings b
INNER JOIN Users u ON b.UserID = u.UserId
INNER JOIN Equipments e ON b.EquipmentID = e.EquipmentID
WHERE u.Name = 'Ahmed Hassan'
ORDER BY b.StartTime DESC;


-- 2.3: View token transaction for booking
PRINT '2.3: Token Transaction History';
SELECT *
FROM TokenTransactions tt
INNER JOIN Users u ON tt.UserID = u.UserId
WHERE u.Name = 'Ahmed Hassan'
ORDER BY tt.CreatedAt DESC;



-- ===============================================
-- SCENARIO 3: MEMBER WORKOUT SESSION
-- Shows: Workout session with equipment, heart rate data, form analysis
-- ===============================================



-- 3.1: View workout session details
PRINT '3.1: Workout Session Summary';
SELECT *
FROM WorkoutSessions ws
INNER JOIN Users u ON ws.UserID = u.UserId
INNER JOIN Equipments e ON ws.EquipmentID = e.EquipmentID
LEFT JOIN Users c ON ws.CoachID = c.UserId
WHERE u.Name = 'Ahmed Hassan'
ORDER BY ws.StartTime DESC;


-- 3.2: View heart rate data during session
PRINT '3.2: Heart Rate Data Stream (Sample)';
SELECT TOP 10 *
FROM HeartRateData hr
INNER JOIN WearableDevices wd ON hr.DeviceID = wd.DeviceID
INNER JOIN Users u ON wd.UserID = u.UserId
LEFT JOIN WorkoutSessions ws ON hr.SessionID = ws.SessionID
WHERE u.Name = 'Ahmed Hassan'
ORDER BY hr.Timestamp DESC;


-- 3.3: View exercise form analysis
PRINT '3.3: AI Form Analysis Results';
SELECT *
FROM ExerciseFormAnalyses efa
INNER JOIN WorkoutSessions ws ON efa.SessionID = ws.SessionID
INNER JOIN Users u ON ws.UserID = u.UserId
INNER JOIN AI_Agents ai ON efa.AI_ID = ai.AI_ID
WHERE u.Name = 'Ahmed Hassan'
ORDER BY efa.CreatedAt DESC;


-- 3.4: View progress milestones achieved
PRINT '3.4: Member Progress Milestones';
SELECT *
FROM ProgressMilestones pm
INNER JOIN Users u ON pm.UserID = u.UserId
WHERE u.Name = 'Ahmed Hassan'
ORDER BY pm.AchievedAt DESC;


-- ===============================================
-- SCENARIO 4: AI GENERATES WORKOUT RECOMMENDATION
-- Shows: AI analysis, workout plan generation, exercise selection
-- ===============================================


-- 4.1: View AI's data analysis inputs
SELECT 
    'Member Profile' AS DataSource,
    u.Name,
    u.Age,
    CASE u.Gender WHEN 0 THEN 'Male' ELSE 'Female' END AS Gender,
    u.FitnessGoal,
    sp.PlanName AS Subscription,
    CASE WHEN sp.HasAIFeatures = 1 THEN 'Enabled' ELSE 'Disabled' END AS AIAccess
FROM Users u
LEFT JOIN SubscriptionPlans sp ON u.SubscriptionPlanID = sp.PlanID
WHERE u.Name = 'Ahmed Hassan'

UNION ALL

SELECT 
    'Workout History' AS DataSource,
    u.Name,
    NULL AS Age,
    NULL AS Gender,
    CAST(COUNT(ws.SessionID) AS VARCHAR) + ' sessions completed',
    NULL AS Subscription,
    CAST(AVG(ws.CaloriesBurned) AS VARCHAR) + ' avg calories'
FROM Users u
LEFT JOIN WorkoutSessions ws ON u.UserId = ws.UserID
WHERE u.Name = 'Ahmed Hassan'
GROUP BY u.Name

UNION ALL

SELECT 
    'Latest InBody Data' AS DataSource,
    u.Name,
    CAST(ibm.Weight AS VARCHAR) + ' kg',
    CAST(ibm.FatPercentage AS VARCHAR) + '% body fat',
    CAST(ibm.MuscleMass AS VARCHAR) + ' kg muscle'
FROM Users u
LEFT JOIN InBodyMeasurements ibm ON u.UserId = ibm.UserID
WHERE u.Name = 'Ahmed Hassan'
  AND ibm.InBodyID = (SELECT TOP 1 InBodyID FROM InBodyMeasurements WHERE UserID = u.UserId ORDER BY CreatedAt DESC);


-- 4.2: View AI-generated workout recommendation
SELECT 
    wr.*,
    u.Name AS MemberName,
    ai.ModelName AS GeneratedByAI,
    c.Name AS ReviewedByCoach
FROM WorkoutRecommendations wr
INNER JOIN Users u ON wr.UserID = u.UserId
INNER JOIN AI_Agents ai ON wr.AI_ID = ai.AI_ID
LEFT JOIN Users c ON wr.ReviewedByCoachID = c.UserId
WHERE u.Name = 'Ahmed Hassan'
ORDER BY wr.GeneratedAt DESC;


-- 4.3: View exercises in AI recommendation
SELECT 
    wr.RecommendationName AS PlanName,
    e.*,
    re.Sets,
    re.Reps,
    re.Weight,
    re.RestTime,
    re.CoachNotes,
    re.[Order]
FROM WorkoutRecommendations wr
INNER JOIN Users u ON wr.UserID = u.UserId
INNER JOIN RecommendedExercises re ON wr.RecommendationID = re.WorkoutRecommendationId
INNER JOIN Exercises e ON re.ExerciseId = e.ExerciseID
WHERE u.Name = 'Ahmed Hassan'
  AND wr.RecommendationID = (SELECT TOP 1 RecommendationID FROM WorkoutRecommendations WHERE UserID = u.UserId ORDER BY GeneratedAt DESC)
ORDER BY re.[Order];


-- 4.4: View AI query log (what AI was asked)
SELECT 
    aq.QueryID,
    u.Name AS MemberName,
    aq.QueryText,
    aq.CreatedAt AS QueryTimestamp,
    ai.ModelName,
    LEFT(aq.ResponseText, 100) + '...' AS ResponsePreview
FROM AIQueryLogs aq
INNER JOIN Users u ON aq.UserID = u.UserId
INNER JOIN AI_Agents ai ON aq.AI_ID = ai.AI_ID
WHERE u.Name = 'Ahmed Hassan'
ORDER BY aq.CreatedAt DESC;


-- ===============================================
-- SCENARIO 5: COACH REVIEWS & ASSIGNS PLAN
-- Shows: Coach dashboard, plan review, approval, assignment
-- ===============================================

-- 5.1: Coach's pending review queue
SELECT 
    c.Name AS CoachName,
    COUNT(CASE WHEN wr.ApprovalStatus = 0 THEN 1 END) AS PendingWorkoutPlans,
    COUNT(CASE WHEN np.ApprovalStatus = 0 THEN 1 END) AS PendingNutritionPlans,
    COUNT(mcs.SubscriptionID) AS ActiveClients
FROM Users c
LEFT JOIN WorkoutRecommendations wr ON c.UserId = wr.ReviewedByCoachID AND wr.ApprovalStatus = 0
LEFT JOIN NutritionPlans np ON c.UserId = np.ReviewedByCoachID AND np.ApprovalStatus = 0
LEFT JOIN MemberCoachSubscriptions mcs ON c.UserId = mcs.CoachID AND mcs.Status = 0
WHERE c.UserType = 'Coach'
  AND c.Name = 'Khaled Mostafa'
GROUP BY c.Name;


-- 5.2: View specific plan coach is reviewing
SELECT 
    wr.RecommendationID,
    u.Name AS MemberName,
    u.Age,
    u.FitnessGoal,
    wr.RecommendationName,
    wr.DifficultyLevel,
    wr.DurationWeeks,
    wr.WorkoutsPerWeek,
    wr.GeneratedAt,
    ai.ModelName AS GeneratedBy,
    COUNT(re.ExerciseID) AS TotalExercises
FROM WorkoutRecommendations wr
INNER JOIN Users u ON wr.UserID = u.UserId
INNER JOIN AI_Agents ai ON wr.AI_ID = ai.AI_ID
LEFT JOIN RecommendedExercises re ON wr.RecommendationID = re.WorkoutRecommendationId
WHERE wr.ApprovalStatus = 0  -- Pending
GROUP BY wr.RecommendationID, u.Name, u.Age, u.FitnessGoal, wr.RecommendationName,
         wr.DifficultyLevel, wr.DurationWeeks, wr.WorkoutsPerWeek, wr.GeneratedAt, ai.ModelName;


-- 5.3: After coach approval - assigned plan
SELECT 
    mwp.*,
    u.Name AS MemberName,
    wpt.TemplateName,
    coach.Name AS AssignedByCoach,
    ai.ModelName AS GeneratedByAI
FROM MemberWorkoutPlans mwp
INNER JOIN Users u ON mwp.UserID = u.UserId
LEFT JOIN WorkoutPlanTemplates wpt ON mwp.TemplateID = wpt.TemplateID
LEFT JOIN Users coach ON mwp.AssignedByCoachID = coach.UserId
LEFT JOIN AI_Agents ai ON mwp.GeneratedByAI_ID = ai.AI_ID
WHERE u.Name = 'Ahmed Hassan'
ORDER BY mwp.StartDate DESC;


-- 5.4: What coach can see about member
SELECT 
    'Basic Info' AS Section,
    u.Name,
    CAST(u.Age AS VARCHAR) AS Detail1,
    u.FitnessGoal AS Detail2,
    CAST(u.TokenBalance AS VARCHAR) + ' tokens' AS Detail3
FROM Users u
WHERE u.Name = 'Ahmed Hassan'

UNION ALL

SELECT 
    'Latest InBody',
    u.Name,
    CAST(ibm.Weight AS VARCHAR) + ' kg',
    CAST(ibm.FatPercentage AS VARCHAR) + '% fat',
    CAST(ibm.MuscleMass AS VARCHAR) + ' kg muscle'
FROM Users u
LEFT JOIN InBodyMeasurements ibm ON u.UserId = ibm.UserID
WHERE u.Name = 'Ahmed Hassan'
  AND ibm.InBodyID = (SELECT TOP 1 InBodyID FROM InBodyMeasurements WHERE UserID = u.UserId ORDER BY CreatedAt DESC)

UNION ALL

SELECT 
    'Workout Stats',
    u.Name,
    CAST(COUNT(ws.SessionID) AS VARCHAR) + ' sessions',
    CAST(AVG(ws.CaloriesBurned) AS VARCHAR) + ' avg cal',
    CAST(SUM(ws.DurationMinutes) AS VARCHAR) + ' total mins'
FROM Users u
LEFT JOIN WorkoutSessions ws ON u.UserId = ws.UserID
WHERE u.Name = 'Ahmed Hassan'
GROUP BY u.Name;


-- ===============================================
-- SCENARIO 6: AI GENERATES NUTRITION PLAN
-- Shows: Nutrition plan creation, meal selection, macro calculations
-- ===============================================


-- 6.1: View AI-generated nutrition plan
PRINT '6.1: Nutrition Plan Overview';
SELECT 
    np.*,
    u.Name AS MemberName,
    ai.ModelName AS GeneratedByAI,
    c.Name AS ReviewedByCoach
FROM NutritionPlans np
INNER JOIN Users u ON np.UserID = u.UserId
INNER JOIN AI_Agents ai ON np.AI_ID = ai.AI_ID
LEFT JOIN Users c ON np.ReviewedByCoachID = c.UserId
WHERE u.Name = 'Ahmed Hassan'
ORDER BY np.GeneratedAt DESC;


-- 6.2: View meals in nutrition plan
PRINT '6.2: Meal Plan (7-Day Schedule)';
SELECT 
    np.PlanName,
    m.MealId,
    m.Name AS MealName,
    m.MealType,
    m.Calories,
    m.ProteinGrams,
    m.CarbsGrams,
    m.FatsGrams,
    COUNT(mi.IngredientId) AS TotalIngredients
FROM NutritionPlans np
INNER JOIN Users u ON np.UserID = u.UserId
INNER JOIN Meals m ON np.PlanID = m.NutritionPlanId
LEFT JOIN MealIngredients mi ON m.MealId = mi.MealId
WHERE u.Name = 'Ahmed Hassan'
  AND np.PlanID = (SELECT TOP 1 PlanID FROM NutritionPlans WHERE UserID = u.UserId ORDER BY GeneratedAt DESC)
GROUP BY np.PlanName, m.MealId, m.Name, m.MealType, m.Calories, 
         m.ProteinGrams, m.CarbsGrams, m.FatsGrams
ORDER BY 
    CASE m.MealType 
        WHEN 'Breakfast' THEN 1 
        WHEN 'Lunch' THEN 2 
        WHEN 'Dinner' THEN 3 
        ELSE 4 
    END;


-- 6.3: View ingredients in a specific meal
PRINT '6.3: Meal Ingredients Breakdown';
SELECT 
    m.Name AS MealName,
    i.Name AS IngredientName,
    mi.Quantity,
    i.Unit,
    i.CaloriesPer100g,
    i.ProteinPer100g,
    i.CarbsPer100g,
    i.FatsPer100g
FROM Meals m
INNER JOIN NutritionPlans np ON m.NutritionPlanId = np.PlanID
INNER JOIN Users u ON np.UserID = u.UserId
INNER JOIN MealIngredients mi ON m.MealId = mi.MealId
INNER JOIN Ingredients i ON mi.IngredientId = i.IngredientId
WHERE u.Name = 'Ahmed Hassan'
  AND np.PlanID = (SELECT TOP 1 PlanID FROM NutritionPlans WHERE UserID = u.UserId ORDER BY GeneratedAt DESC)
ORDER BY m.MealId, i.Name;


-- 6.4: Daily macro totals validation
PRINT '6.4: Daily Nutrition Totals';
SELECT 
    np.PlanName,
    np.DailyCalories AS TargetCalories,
    SUM(m.Calories) AS ActualCalories,
    np.ProteinGrams AS TargetProtein,
    SUM(m.ProteinGrams) AS ActualProtein,
    np.CarbsGrams AS TargetCarbs,
    SUM(m.CarbsGrams) AS ActualCarbs,
    np.FatsGrams AS TargetFats,
    SUM(m.FatsGrams) AS ActualFats
FROM NutritionPlans np
INNER JOIN Users u ON np.UserID = u.UserId
LEFT JOIN Meals m ON np.PlanID = m.NutritionPlanId
WHERE u.Name = 'Ahmed Hassan'
  AND np.PlanID = (SELECT TOP 1 PlanID FROM NutritionPlans WHERE UserID = u.UserId ORDER BY GeneratedAt DESC)
GROUP BY np.PlanName, np.DailyCalories, np.ProteinGrams, np.CarbsGrams, np.FatsGrams;


-- ===============================================
-- SCENARIO 7: MEMBER USES TOKENS & PAYMENT
-- Shows: Token balance check, purchase, payment, balance update
-- ===============================================


-- 7.1: Token balance before purchase
PRINT '7.1: Current Token Balance';
SELECT 
    u.UserId,
    u.Name,
    u.TokenBalance AS CurrentTokens,
    sp.TokensIncluded AS MonthlyTokens,
    sp.PlanName
FROM Users u
LEFT JOIN SubscriptionPlans sp ON u.SubscriptionPlanID = sp.PlanID
WHERE u.Name = 'Ahmed Hassan';


-- 7.2: Token purchase transaction
PRINT '7.2: Token Purchase Transaction';
SELECT 
    tt.TransactionID,
    u.Name AS MemberName,
    tt.Type AS TransactionType,
    tt.Amount AS TokenAmount,
    tt.CreatedAt AS TransactionDate,
    tt.PaymentRef AS PaymentReference,
    r.Name AS ProcessedByReceptionist
FROM TokenTransactions tt
INNER JOIN Users u ON tt.UserID = u.UserId
LEFT JOIN Users r ON tt.ReceptionistID = r.UserId
WHERE u.Name = 'Ahmed Hassan'
  AND tt.Type = 0  -- 0 = Purchase
ORDER BY tt.CreatedAt DESC;


-- 7.3: Payment for tokens
PRINT '7.3: Payment History';
SELECT 
    p.PaymentID,
    u.Name AS MemberName,
    p.PaymentDate,
    p.Amount,
    p.PaymentMethod,
    p.PaymentType,
    p.Status
FROM Payments p
INNER JOIN Users u ON p.UserID = u.UserId
WHERE u.Name = 'Ahmed Hassan'
ORDER BY p.PaymentDate DESC;


-- 7.4: Token usage history
PRINT '7.4: Token Usage Analytics';
SELECT 
    u.Name AS MemberName,
    COUNT(CASE WHEN tt.Type = 0 THEN 1 END) AS TotalPurchases,
    SUM(CASE WHEN tt.Type = 0 THEN tt.Amount ELSE 0 END) AS TokensPurchased,
    COUNT(CASE WHEN tt.Type = 1 THEN 1 END) AS TotalDeductions,
    SUM(CASE WHEN tt.Type = 1 THEN ABS(tt.Amount) ELSE 0 END) AS TokensDeducted,
    u.TokenBalance AS CurrentBalance
FROM Users u
LEFT JOIN TokenTransactions tt ON u.UserId = tt.UserID
WHERE u.Name = 'Ahmed Hassan'
GROUP BY u.Name, u.TokenBalance;


-- ===============================================
-- SCENARIO 8: INBODY MEASUREMENT BY RECEPTIONIST
-- Shows: InBody scan, progress tracking, receptionist recording
-- ===============================================


-- 8.1: Latest InBody measurement
PRINT '8.1: Latest InBody Scan Results';
SELECT TOP 1
    ibm.*,
    u.Name AS MemberName,
    r.Name AS RecordedByReceptionist
FROM InBodyMeasurements ibm
INNER JOIN Users u ON ibm.UserID = u.UserId
LEFT JOIN Users r ON ibm.ReceptionistID = r.UserId
WHERE u.Name = 'Ahmed Hassan'
ORDER BY ibm.CreatedAt DESC;


-- 8.2: InBody progress over time
PRINT '8.2: InBody Progress History';
SELECT 
    u.Name AS MemberName,
    ibm.CreatedAt AS MeasurementDate,
    ibm.Weight,
    ibm.FatPercentage,
    ibm.MuscleMass,
    ibm.BMI,
    -- Calculate changes from previous measurement
    LAG(ibm.Weight) OVER (ORDER BY ibm.CreatedAt) AS PreviousWeight,
    ibm.Weight - LAG(ibm.Weight) OVER (ORDER BY ibm.CreatedAt) AS WeightChange,
    LAG(ibm.MuscleMass) OVER (ORDER BY ibm.CreatedAt) AS PreviousMuscle,
    ibm.MuscleMass - LAG(ibm.MuscleMass) OVER (ORDER BY ibm.CreatedAt) AS MuscleGain
FROM InBodyMeasurements ibm
INNER JOIN Users u ON ibm.UserID = u.UserId
WHERE u.Name = 'Ahmed Hassan'
ORDER BY ibm.CreatedAt DESC;


-- 8.3: Receptionist activity log
PRINT '8.3: Receptionist Activity Log';
SELECT 
    r.Name AS ReceptionistName,
    COUNT(ibm.InBodyID) AS TotalScans,
    COUNT(DISTINCT ibm.UserID) AS UniqueMembersServed,
    MIN(ibm.CreatedAt) AS FirstScan,
    MAX(ibm.CreatedAt) AS LatestScan
FROM Users r
LEFT JOIN InBodyMeasurements ibm ON r.UserId = ibm.ReceptionistID
WHERE r.UserType = 'Receptionist'
  AND r.Name = 'Hana Salem'
GROUP BY r.Name;


-- ===============================================
-- SCENARIO 9: COACH TRAINING SESSION
-- Shows: 1-on-1 coaching, session booking, supervised workout
-- ===============================================


-- 9.1: Member-Coach subscription
PRINT '9.1: Coaching Subscription Details';
SELECT 
    mcs.*,
    m.Name AS MemberName,
    c.Name AS CoachName,
    (mcs.SessionsIncluded - mcs.SessionsUsed) AS SessionsRemaining
FROM MemberCoachSubscriptions mcs
INNER JOIN Users m ON mcs.UserID = m.UserId
INNER JOIN Users c ON mcs.CoachID = c.UserId
WHERE m.Name = 'Ahmed Hassan'
  AND c.Name = 'Khaled Mostafa'
ORDER BY mcs.StartDate DESC;


-- 9.2: Coached workout sessions
PRINT '9.2: Supervised Training Sessions';
SELECT 
    ws.*,
    m.Name AS MemberName,
    c.Name AS CoachName,
    e.Name AS EquipmentUsed
FROM WorkoutSessions ws
INNER JOIN Users m ON ws.UserID = m.UserId
INNER JOIN Users c ON ws.CoachID = c.UserId
INNER JOIN Equipments e ON ws.EquipmentID = e.EquipmentID
WHERE m.Name = 'Ahmed Hassan'
  AND c.Name = 'Khaled Mostafa'
  AND ws.IsSupervisedByCoach = 1
ORDER BY ws.StartTime DESC;


-- 9.3: Coach's schedule for the day
PRINT '9.3: Coach Daily Schedule';
SELECT 
    c.Name AS CoachName,
    ws.StartTime,
    ws.EndTime,
    m.Name AS ClientName,
    e.Name AS Equipment,
    'Training Session' AS SessionType
FROM WorkoutSessions ws
INNER JOIN Users c ON ws.CoachID = c.UserId
INNER JOIN Users m ON ws.UserID = m.UserId
INNER JOIN Equipments e ON ws.EquipmentID = e.EquipmentID
WHERE c.Name = 'Khaled Mostafa'
  AND CAST(ws.StartTime AS DATE) = CAST(GETDATE() AS DATE)
ORDER BY ws.StartTime;


-- 9.4: Coach performance metrics
PRINT '9.4: Coach Performance Metrics';
SELECT 
    c.Name AS CoachName,
    COUNT(DISTINCT mcs.UserID) AS TotalClients,
    COUNT(ws.SessionID) AS TotalSessionsConducted,
    SUM(mcs.SessionsUsed) AS TotalSessionsUsed,
    AVG(CAST(cr.Rating AS FLOAT)) AS AverageRating,
    COUNT(cr.ReviewID) AS TotalReviews
FROM Users c
LEFT JOIN MemberCoachSubscriptions mcs ON c.UserId = mcs.CoachID
LEFT JOIN WorkoutSessions ws ON c.UserId = ws.CoachID AND ws.IsSupervisedByCoach = 1
LEFT JOIN CoachReviews cr ON c.UserId = cr.CoachID
WHERE c.UserType = 'Coach'
  AND c.Name = 'Khaled Mostafa'
GROUP BY c.Name;


-- ===============================================
-- SCENARIO 10: EQUIPMENT MAINTENANCE
-- Shows: Equipment status, maintenance logs, downtime tracking
-- ===============================================


-- 10.1: Equipment status overview
PRINT '10.1: Equipment Status Dashboard';
SELECT 
    e.*,
    CASE e.Status
        WHEN 0 THEN 'Available'
        WHEN 1 THEN 'In Use'
        WHEN 2 THEN 'Under Maintenance'
        WHEN 3 THEN 'Out of Service'
    END AS StatusDescription,
    DATEDIFF(DAY, GETDATE(), e.NextMaintenanceDate) AS DaysUntilMaintenance
FROM Equipments e
ORDER BY e.NextMaintenanceDate;


-- 10.2: Maintenance history for equipment
PRINT '10.2: Maintenance Log History';
SELECT 
    ml.*,
    e.Name AS EquipmentName,
    CASE ml.MaintenanceType
        WHEN 0 THEN 'Preventive'
        WHEN 1 THEN 'Repair'
        WHEN 2 THEN 'Inspection'
    END AS MaintenanceTypeDescription
FROM MaintenanceLogs ml
INNER JOIN Equipments e ON ml.EquipmentID = e.EquipmentID
ORDER BY ml.MaintenanceDate DESC;


-- 10.3: Safety incidents reported
PRINT '10.3: Safety Incidents Log';
SELECT 
    si.*,
    u.Name AS ReportedBy,
    e.Name AS EquipmentInvolved,
    CASE si.Severity
        WHEN 0 THEN 'Low'
        WHEN 1 THEN 'Medium'
        WHEN 2 THEN 'High'
        WHEN 3 THEN 'Critical'
    END AS SeverityDescription
FROM SafetyIncidents si
LEFT JOIN Users u ON si.ReportedByUserID = u.UserId
LEFT JOIN Equipments e ON si.EquipmentID = e.EquipmentID
ORDER BY si.IncidentDate DESC;


-- 10.4: Equipment downtime analysis
PRINT '10.4: Equipment Downtime Statistics';
SELECT 
    e.Name AS EquipmentName,
    COUNT(ml.MaintenanceID) AS MaintenanceCount,
    SUM(CASE WHEN ml.MaintenanceType = 1 THEN 1 ELSE 0 END) AS RepairCount,
    SUM(ml.Cost) AS TotalMaintenanceCost,
    MAX(ml.MaintenanceDate) AS LastMaintenance
FROM Equipments e
LEFT JOIN MaintenanceLogs ml ON e.EquipmentID = ml.EquipmentID
GROUP BY e.Name
ORDER BY TotalMaintenanceCost DESC;


-- ===============================================
-- SCENARIO 11: AI CHURN PREDICTION & RETENTION
-- Shows: Churn risk analysis, engagement metrics, retention actions
-- ===============================================


-- 11.1: Churn predictions for members
PRINT '11.1: Member Churn Risk Analysis';
SELECT 
    cp.PredictionID,
    u.Name AS MemberName,
    CASE cp.RiskLevel
        WHEN 0 THEN 'Low'
        WHEN 1 THEN 'Medium'
        WHEN 2 THEN 'High'
    END AS RiskLevel,
    CAST(cp.ChurnProbability * 100 AS DECIMAL(5,2)) AS ChurnProbability_Percent,
    cp.PredictionDate,
    cp.RecommendedAction,
    DATEDIFF(DAY, 
        (SELECT MAX(StartTime) FROM WorkoutSessions WHERE UserID = u.UserId),
        GETDATE()
    ) AS DaysSinceLastWorkout
FROM ChurnPredictions cp
INNER JOIN Users u ON cp.UserID = u.UserId
ORDER BY cp.ChurnProbability DESC, cp.PredictionDate DESC;


-- 11.2: Member engagement metrics
PRINT '11.2: Member Engagement Dashboard';
SELECT 
    u.Name AS MemberName,
    u.CreatedAt AS MemberSince,
    DATEDIFF(DAY, u.CreatedAt, GETDATE()) AS DaysMember,
    COUNT(DISTINCT ws.SessionID) AS TotalWorkouts,
    MAX(ws.StartTime) AS LastWorkout,
    DATEDIFF(DAY, MAX(ws.StartTime), GETDATE()) AS DaysSinceLastWorkout,
    COUNT(DISTINCT b.BookingID) AS TotalBookings,
    u.TokenBalance AS CurrentTokens,
    COUNT(DISTINCT n.NotificationID) AS UnreadNotifications
FROM Users u
LEFT JOIN WorkoutSessions ws ON u.UserId = ws.UserID
LEFT JOIN Bookings b ON u.UserId = b.UserID
LEFT JOIN Notifications n ON u.UserId = n.UserID AND n.IsRead = 0
WHERE u.UserType = 'Member'
GROUP BY u.UserId, u.Name, u.CreatedAt, u.TokenBalance
ORDER BY DaysSinceLastWorkout DESC;


-- 11.3: Retention notifications sent
PRINT '11.3: Retention Campaign Notifications';
SELECT 
    n.NotificationID,
    u.Name AS MemberName,
    n.NotificationType,
    n.Message,
    n.CreatedAt,
    n.IsRead,
    n.ReadAt
FROM Notifications n
INNER JOIN Users u ON n.UserID = u.UserId
WHERE n.NotificationType = 5  -- Assuming 5 = Retention type
ORDER BY n.CreatedAt DESC;


-- 11.4: At-risk members summary
PRINT '11.4: At-Risk Members Requiring Action';
SELECT 
    u.Name AS MemberName,
    sp.PlanName AS Subscription,
    DATEDIFF(DAY, MAX(ws.StartTime), GETDATE()) AS DaysInactive,
    u.TokenBalance AS UnusedTokens,
    COUNT(DISTINCT n.NotificationID) AS UnreadNotifications,
    'High Churn Risk' AS Status
FROM Users u
LEFT JOIN SubscriptionPlans sp ON u.SubscriptionPlanID = sp.PlanID
LEFT JOIN WorkoutSessions ws ON u.UserId = ws.UserID
LEFT JOIN Notifications n ON u.UserId = n.UserID AND n.IsRead = 0
WHERE u.UserType = 'Member'
  AND EXISTS (SELECT 1 FROM ChurnPredictions cp WHERE cp.UserID = u.UserId AND cp.RiskLevel = 2)
GROUP BY u.UserId, u.Name, sp.PlanName, u.TokenBalance
HAVING DATEDIFF(DAY, MAX(ws.StartTime), GETDATE()) > 14
ORDER BY DaysInactive DESC;


-- ===============================================
-- SCENARIO 12: MEMBER REVIEWS COACH
-- Shows: Review submission, coach ratings, feedback system
-- ===============================================


-- 12.1: Member's coach review
PRINT '12.1: Member Review Submission';
SELECT 
    cr.ReviewID,
    m.Name AS ReviewerName,
    c.Name AS CoachName,
    cr.Rating AS Stars,
    cr.ReviewText,
    cr.ReviewDate,
    mcs.SessionsUsed AS SessionsCompleted
FROM CoachReviews cr
INNER JOIN Users m ON cr.UserID = m.UserId
INNER JOIN Users c ON cr.CoachID = c.UserId
LEFT JOIN MemberCoachSubscriptions mcs ON m.UserId = mcs.UserID AND c.UserId = mcs.CoachID
WHERE m.Name = 'Ahmed Hassan'
  AND c.Name = 'Khaled Mostafa'
ORDER BY cr.ReviewDate DESC;


-- 12.2: Coach's complete review profile
PRINT '12.2: Coach Review Summary';
SELECT 
    c.Name AS CoachName,
    COUNT(cr.ReviewID) AS TotalReviews,
    AVG(CAST(cr.Rating AS FLOAT)) AS AverageRating,
    COUNT(CASE WHEN cr.Rating = 5 THEN 1 END) AS FiveStarReviews,
    COUNT(CASE WHEN cr.Rating = 4 THEN 1 END) AS FourStarReviews,
    COUNT(CASE WHEN cr.Rating <= 3 THEN 1 END) AS ThreeOrLess,
    MAX(cr.ReviewDate) AS LatestReview
FROM Users c
LEFT JOIN CoachReviews cr ON c.UserId = cr.CoachID
WHERE c.UserType = 'Coach'
  AND c.Name = 'Khaled Mostafa'
GROUP BY c.Name;


-- 12.3: Recent reviews for coach
PRINT '12.3: Recent Coach Reviews';
SELECT TOP 5
    m.Name AS Member,
    cr.Rating AS Stars,
    cr.ReviewText,
    cr.ReviewDate
FROM CoachReviews cr
INNER JOIN Users m ON cr.UserID = m.UserId
INNER JOIN Users c ON cr.CoachID = c.UserId
WHERE c.Name = 'Khaled Mostafa'
ORDER BY cr.ReviewDate DESC;


-- 12.4: All coaches ranked by rating
PRINT '12.4: Coach Leaderboard';
SELECT 
    c.Name AS CoachName,
    COUNT(cr.ReviewID) AS TotalReviews,
    CAST(AVG(CAST(cr.Rating AS FLOAT)) AS DECIMAL(3,2)) AS AvgRating,
    COUNT(DISTINCT mcs.UserID) AS TotalClients,
    COUNT(ws.SessionID) AS TotalSessionsConducted
FROM Users c
LEFT JOIN CoachReviews cr ON c.UserId = cr.CoachID
LEFT JOIN MemberCoachSubscriptions mcs ON c.UserId = mcs.CoachID
LEFT JOIN WorkoutSessions ws ON c.UserId = ws.CoachID AND ws.IsSupervisedByCoach = 1
WHERE c.UserType = 'Coach'
GROUP BY c.Name
ORDER BY AvgRating DESC, TotalReviews DESC;


-- ===============================================
-- BONUS: ADMIN DASHBOARD OVERVIEW
-- Shows: System-wide statistics and KPIs
-- ===============================================


-- Admin: Key Performance Indicators
PRINT 'Admin KPIs';
SELECT 
    'Total Members' AS Metric,
    CAST(COUNT(*) AS VARCHAR) AS Value
FROM Users WHERE UserType = 'Member'
UNION ALL
SELECT 'Active Members (Last 30 Days)', CAST(COUNT(DISTINCT UserID) AS VARCHAR)
FROM WorkoutSessions WHERE StartTime >= DATEADD(DAY, -30, GETDATE())
UNION ALL
SELECT 'Total Revenue (Current Month)', CAST(CAST(SUM(Amount) AS DECIMAL(10,2)) AS VARCHAR)
FROM Payments WHERE MONTH(PaymentDate) = MONTH(GETDATE()) AND YEAR(PaymentDate) = YEAR(GETDATE())
UNION ALL
SELECT 'Equipment Utilization Rate', CAST(CAST(
    (SELECT COUNT(*) * 100.0 / (SELECT COUNT(*) FROM Equipments) FROM Equipments WHERE Status = 1)
AS DECIMAL(5,2)) AS VARCHAR) + '%'
UNION ALL
SELECT 'AI Plans Generated (This Month)', CAST(COUNT(*) AS VARCHAR)
FROM WorkoutRecommendations WHERE MONTH(GeneratedAt) = MONTH(GETDATE())
UNION ALL
SELECT 'High Churn Risk Members', CAST(COUNT(*) AS VARCHAR)
FROM ChurnPredictions WHERE RiskLevel = 2;


