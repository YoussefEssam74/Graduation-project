-- ================================================================
-- Part 3: Seed Data for Remaining 9 Tables (AI-related & Operational)
-- Database: IntelliFitDb
-- Tables: AIQueryLogs, ChurnPredictions, EquipmentDemandPredictions, ExerciseFormAnalyses, 
--         GymOccupancies, HeartRateData, RecommendedExercises, SafetyIncidents, WorkoutRecommendations
-- ================================================================

USE IntelliFitDb;
GO

-- ================================================================
-- Section 1: Clean Existing Data (in reverse dependency order)
-- ================================================================
PRINT 'Clearing existing data from Part 3 tables...';

DELETE FROM RecommendedExercises;
DELETE FROM WorkoutRecommendations;
DELETE FROM ExerciseFormAnalyses;
DELETE FROM AIQueryLogs;
DELETE FROM HeartRateData;
DELETE FROM ChurnPredictions;
DELETE FROM EquipmentDemandPredictions;
DELETE FROM SafetyIncidents;
DELETE FROM GymOccupancies;

PRINT 'Part 3 tables cleared successfully.';
GO

-- ================================================================
-- Section 2: Insert Data into Tables
-- ================================================================

-- ================================================================
-- Table: AIQueryLogs
-- Purpose: Logs AI queries and responses from users
-- Dependencies: Users (UserID), AI_Agents (AI_ID, AIAgentAI_ID)
-- Note: Both AI_ID and AIAgentAI_ID reference AI_Agents.AI_ID (EF duplicate FK)
-- Note: QueryID is IDENTITY, auto-generated
-- ================================================================
PRINT 'Inserting data into AIQueryLogs...';
INSERT INTO AIQueryLogs (UserID, AI_ID, QueryText, ResponseText, CreatedAt, AIAgentAI_ID)
VALUES
(1, 1, 'What is the best workout for weight loss?', 'A combination of cardio and strength training 3-4 times per week is ideal for weight loss. Focus on compound movements like squats, deadlifts, and burpees.', '2025-01-15 09:30:00', 1),
(2, 1, 'How many calories should I eat to gain muscle?', 'For muscle gain, aim for a caloric surplus of 300-500 calories above your maintenance level, with 1.6-2.2g of protein per kg of body weight.', '2025-02-10 14:20:00', 1),
(3, 1, 'Can you suggest a nutrition plan for cutting?', 'A cutting phase requires a caloric deficit of 300-500 calories, high protein (2g/kg), moderate carbs, and low fat. Prioritize whole foods and minimize processed items.', '2025-03-05 11:00:00', 1),
(4, 1, 'What exercises are good for lower back pain?', 'Gentle exercises like cat-cow stretches, bird dogs, and planks can strengthen your core and alleviate lower back pain. Avoid heavy deadlifts until cleared by a professional.', '2025-04-12 16:45:00', 1),
(5, 1, 'How to improve my bench press?', 'Focus on proper form, increase training frequency to 2-3 times per week, incorporate accessory work like tricep dips and chest flies, and ensure adequate rest.', '2025-05-08 10:15:00', 1),
(6, 1, 'What is the best time to workout?', 'The best time is when you can be most consistent. Morning workouts boost metabolism, while evening workouts can utilize peak strength levels. Choose what fits your schedule.', '2025-06-20 08:30:00', 1),
(7, 1, 'How much water should I drink during workout?', 'Drink 200-300ml every 15-20 minutes during exercise. For sessions over 60 minutes, consider electrolyte drinks to replenish minerals lost through sweat.', '2025-07-15 13:50:00', 1),
(1, 1, 'Can I workout everyday?', 'You can workout daily if you vary intensity and target different muscle groups. Ensure at least 1-2 rest days per week for full recovery and adaptation.', '2025-08-22 09:00:00', 1),
(2, 1, 'What supplements do I need?', 'Focus on whole foods first. Basic supplements include whey protein, creatine monohydrate, and a multivitamin. Omega-3s are beneficial for joint health and inflammation.', '2025-09-10 15:30:00', 1),
(3, 1, 'How to track my progress effectively?', 'Track body weight weekly, take progress photos monthly, measure body circumferences, log workout performance (weight/reps), and monitor energy levels and sleep quality.', '2025-10-05 12:00:00', 1);
PRINT '10 rows inserted into AIQueryLogs.';
GO

-- ================================================================
-- Table: ChurnPredictions
-- Purpose: Predicts member churn risk using AI
-- Dependencies: Users (UserID)
-- Enum: RiskLevel (0=Low, 1=Medium, 2=High, 3=Critical)
-- Note: PredictionID is IDENTITY, auto-generated
-- ================================================================
PRINT 'Inserting data into ChurnPredictions...';
INSERT INTO ChurnPredictions (UserID, ChurnProbability, RiskLevel, PredictionDate)
VALUES
(1, 0.15, 0, '2025-11-01 00:00:00'), -- Low risk
(2, 0.28, 1, '2025-11-02 00:00:00'), -- Medium risk
(3, 0.65, 2, '2025-11-03 00:00:00'), -- High risk
(4, 0.42, 1, '2025-11-04 00:00:00'), -- Medium risk
(5, 0.88, 3, '2025-11-05 00:00:00'), -- Critical risk
(6, 0.10, 0, '2025-11-06 00:00:00'), -- Low risk
(7, 0.55, 2, '2025-11-07 00:00:00'), -- High risk
(1, 0.20, 0, '2025-11-08 00:00:00'), -- Low risk
(2, 0.73, 2, '2025-11-09 00:00:00'), -- High risk
(3, 0.35, 1, '2025-11-10 00:00:00'); -- Medium risk
PRINT '10 rows inserted into ChurnPredictions.';
GO

-- ================================================================
-- Table: EquipmentDemandPredictions
-- Purpose: Predicts equipment usage demand
-- Dependencies: Equipments (EquipmentID)
-- Note: PredictionID is IDENTITY, auto-generated
-- ================================================================
PRINT 'Inserting data into EquipmentDemandPredictions...';
INSERT INTO EquipmentDemandPredictions (EquipmentID, PredictedForDate, DemandScore, CreatedAt)
VALUES
(1, '2025-11-23 18:00:00', 0.85, '2025-11-22 08:00:00'), -- Treadmill - High demand evening
(2, '2025-11-23 18:00:00', 0.92, '2025-11-22 08:00:00'), -- Bench Press - Very high demand
(3, '2025-11-23 18:00:00', 0.78, '2025-11-22 08:00:00'), -- Dumbbells - High demand
(4, '2025-11-23 18:00:00', 0.65, '2025-11-22 08:00:00'), -- Leg Press - Moderate demand
(5, '2025-11-23 18:00:00', 0.55, '2025-11-22 08:00:00'), -- Cable Machine - Moderate demand
(6, '2025-11-24 07:00:00', 0.70, '2025-11-22 08:00:00'), -- Rowing Machine - Morning demand
(7, '2025-11-24 07:00:00', 0.60, '2025-11-22 08:00:00'), -- Smith Machine - Morning demand
(8, '2025-11-24 18:00:00', 0.88, '2025-11-22 08:00:00'), -- Squat Rack - Evening peak
(9, '2025-11-24 18:00:00', 0.45, '2025-11-22 08:00:00'), -- Lat Pulldown - Lower demand
(10, '2025-11-24 18:00:00', 0.72, '2025-11-22 08:00:00'); -- Elliptical - Evening demand
PRINT '10 rows inserted into EquipmentDemandPredictions.';
GO

-- ================================================================
-- Table: ExerciseFormAnalyses
-- Purpose: AI analysis of exercise form from workout sessions
-- Dependencies: WorkoutSessions (SessionID), AI_Agents (AI_ID, AIAgentAI_ID)
-- Note: Both AI_ID and AIAgentAI_ID reference AI_Agents.AI_ID
-- Note: AnalysisID is IDENTITY, auto-generated
-- ================================================================
PRINT 'Inserting data into ExerciseFormAnalyses...';
INSERT INTO ExerciseFormAnalyses (SessionID, AI_ID, ExerciseName, RepCount, FormScore, FormFeedback, InjuryRiskScore, PoseDataJson, CreatedAt, AIAgentAI_ID)
VALUES
(1, 1, 'Squat', 10, 0.85, 'Good depth and knee alignment. Keep chest up throughout the movement.', 0.15, '{"Keypoints":[{"Name":"left_knee","X":120.5,"Y":340.2,"Confidence":0.95,"IsVisible":true},{"Name":"right_knee","X":125.3,"Y":338.7,"Confidence":0.93,"IsVisible":true}],"FrameNumber":45}', '2025-01-15 10:00:00', 1),
(2, 1, 'Bench Press', 8, 0.78, 'Elbow flare is slightly wide. Tuck elbows to 45 degrees for safer pressing.', 0.35, '{"Keypoints":[{"Name":"left_elbow","X":200.1,"Y":250.4,"Confidence":0.91,"IsVisible":true},{"Name":"right_elbow","X":210.8,"Y":252.1,"Confidence":0.89,"IsVisible":true}],"FrameNumber":32}', '2025-02-10 11:00:00', 1),
(3, 1, 'Deadlift', 5, 0.92, 'Excellent form! Back remains neutral, hips hinge properly. Keep this up.', 0.08, '{"Keypoints":[{"Name":"spine_base","X":150.2,"Y":400.5,"Confidence":0.97,"IsVisible":true},{"Name":"hip_center","X":155.1,"Y":380.3,"Confidence":0.96,"IsVisible":true}],"FrameNumber":28}', '2025-03-05 12:00:00', 1),
(4, 1, 'Overhead Press', 10, 0.70, 'Bar path deviates forward. Press straight up and slightly back to maintain balance.', 0.40, '{"Keypoints":[{"Name":"left_wrist","X":180.4,"Y":200.1,"Confidence":0.88,"IsVisible":true},{"Name":"right_wrist","X":185.7,"Y":198.5,"Confidence":0.87,"IsVisible":true}],"FrameNumber":52}', '2025-04-12 17:00:00', 1),
(5, 1, 'Barbell Row', 10, 0.88, 'Strong pull with good back engagement. Minimize momentum by controlling the eccentric.', 0.12, '{"Keypoints":[{"Name":"spine_mid","X":160.3,"Y":320.8,"Confidence":0.94,"IsVisible":true},{"Name":"left_shoulder","X":165.2,"Y":300.4,"Confidence":0.92,"IsVisible":true}],"FrameNumber":38}', '2025-05-08 10:30:00', 1),
(6, 1, 'Pull-Up', 8, 0.82, 'Full range of motion achieved. Try to minimize leg swing for stricter form.', 0.18, '{"Keypoints":[{"Name":"chin","X":140.5,"Y":280.2,"Confidence":0.90,"IsVisible":true},{"Name":"left_hand","X":145.8,"Y":260.7,"Confidence":0.91,"IsVisible":true}],"FrameNumber":41}', '2025-06-20 09:00:00', 1),
(7, 1, 'Leg Press', 12, 0.75, 'Knees track inward slightly. Focus on pushing knees outward to protect joints.', 0.30, '{"Keypoints":[{"Name":"left_knee","X":190.2,"Y":360.5,"Confidence":0.89,"IsVisible":true},{"Name":"right_knee","X":195.4,"Y":362.1,"Confidence":0.88,"IsVisible":true}],"FrameNumber":55}', '2025-07-15 14:00:00', 1),
(8, 1, 'Dumbbell Curl', 12, 0.90, 'Great isolation and control. Maintain this tempo for muscle growth.', 0.10, '{"Keypoints":[{"Name":"left_elbow","X":130.6,"Y":290.3,"Confidence":0.95,"IsVisible":true},{"Name":"left_wrist","X":135.2,"Y":270.8,"Confidence":0.94,"IsVisible":true}],"FrameNumber":48}', '2025-08-22 09:30:00', 1),
(9, 1, 'Plank', 1, 0.86, 'Core engaged well. Avoid sagging hips by squeezing glutes throughout.', 0.14, '{"Keypoints":[{"Name":"spine_base","X":170.4,"Y":330.5,"Confidence":0.93,"IsVisible":true},{"Name":"shoulder_center","X":175.1,"Y":280.2,"Confidence":0.92,"IsVisible":true}],"FrameNumber":60}', '2025-09-10 16:00:00', 1),
(10, 1, 'Lunges', 10, 0.80, 'Good stride length. Ensure front knee stays behind toes to prevent strain.', 0.20, '{"Keypoints":[{"Name":"left_knee","X":145.3,"Y":350.7,"Confidence":0.91,"IsVisible":true},{"Name":"left_ankle","X":150.8,"Y":420.2,"Confidence":0.89,"IsVisible":true}],"FrameNumber":35}', '2025-10-05 12:30:00', 1);
PRINT '10 rows inserted into ExerciseFormAnalyses.';
GO

-- ================================================================
-- Table: GymOccupancies
-- Purpose: Tracks gym occupancy by zone using AI vision
-- Dependencies: None (standalone operational data)
-- Note: OccupancyID is IDENTITY, auto-generated
-- ================================================================
PRINT 'Inserting data into GymOccupancies...';
INSERT INTO GymOccupancies (Timestamp, PeopleCount, ZoneName, OccupancyPercentage, CameraID)
VALUES
('2025-11-22 06:00:00', 5, 'Cardio Zone', 0.20, 'CAM-001'),
('2025-11-22 08:00:00', 18, 'Cardio Zone', 0.72, 'CAM-001'),
('2025-11-22 06:30:00', 8, 'Free Weights Zone', 0.40, 'CAM-002'),
('2025-11-22 18:00:00', 22, 'Free Weights Zone', 0.88, 'CAM-002'),
('2025-11-22 07:00:00', 4, 'Functional Training Zone', 0.33, 'CAM-003'),
('2025-11-22 17:30:00', 12, 'Functional Training Zone', 0.80, 'CAM-003'),
('2025-11-22 09:00:00', 6, 'Stretching Area', 0.50, 'CAM-004'),
('2025-11-22 19:00:00', 10, 'Stretching Area', 0.83, 'CAM-004'),
('2025-11-22 12:00:00', 3, 'CrossFit Zone', 0.25, 'CAM-005'),
('2025-11-22 18:30:00', 11, 'CrossFit Zone', 0.92, 'CAM-005');
PRINT '10 rows inserted into GymOccupancies.';
GO

-- ================================================================
-- Table: HeartRateData
-- Purpose: Tracks heart rate data from wearable devices
-- Dependencies: WearableDevices (DeviceID), WorkoutSessions (SessionID - nullable)
-- Note: RecordID is IDENTITY, auto-generated
-- ================================================================
PRINT 'Inserting data into HeartRateData...';
INSERT INTO HeartRateData (DeviceID, SessionID, Timestamp, HeartRate, CaloriesBurned)
VALUES
(1, 1, '2025-01-15 10:00:00', 120, 8.5),
(1, 1, '2025-01-15 10:05:00', 135, 9.2),
(2, 2, '2025-02-10 11:00:00', 110, 7.8),
(2, 2, '2025-02-10 11:10:00', 142, 10.1),
(3, 3, '2025-03-05 12:00:00', 128, 8.9),
(4, 4, '2025-04-12 17:00:00', 155, 11.5),
(5, 5, '2025-05-08 10:30:00', 145, 10.3),
(6, 6, '2025-06-20 09:00:00', 132, 9.4),
(7, 7, '2025-07-15 14:00:00', 118, 8.2),
(8, 8, '2025-08-22 09:30:00', 140, 9.8);
PRINT '10 rows inserted into HeartRateData.';
GO

-- ================================================================
-- Table: WorkoutRecommendations
-- Purpose: AI-generated workout recommendations for users
-- Dependencies: Users (UserID), AI_Agents (AI_ID, AIAgentAI_ID), Users/Coach (ReviewedByCoachID - nullable)
-- Enum: DifficultyLevel (0=Beginner, 1=Intermediate, 2=Advanced, 3=Expert)
--       ApprovalStatus (0=Pending, 1=Approved, 2=Rejected, 3=NeedsRevision)
--       PlanSource (0=AI, 1=Coach, 2=Hybrid)
-- Note: ReviewedByCoachID should reference Coach users (UserType=1)
-- Note: RecommendationID is IDENTITY, auto-generated
-- ================================================================
PRINT 'Inserting data into WorkoutRecommendations...';
INSERT INTO WorkoutRecommendations (UserID, AI_ID, ReviewedByCoachID, RecommendationName, DifficultyLevel, DurationWeeks, WorkoutsPerWeek, GeneratedAt, ApprovalStatus, ReviewedAt, ReviewComments, UserResponseAt, IsAccepted, PlanSource, AIAgentAI_ID)
VALUES
(1, 1, 8, 'Weight Loss Starter Program', 0, 8, 3, '2025-01-10 09:00:00', 1, '2025-01-12 10:00:00', 'Good foundation for beginners. Approved.', '2025-01-13 14:00:00', 1, 2, 1),
(2, 1, 8, 'Muscle Building Phase 1', 1, 12, 4, '2025-02-05 11:00:00', 1, '2025-02-07 09:00:00', 'Well-structured progressive overload. Approved.', '2025-02-08 16:00:00', 1, 2, 1),
(3, 1, 9, 'Advanced Strength Training', 2, 16, 5, '2025-03-01 08:00:00', 1, '2025-03-03 11:00:00', 'Excellent periodization. Ready for execution.', '2025-03-04 10:00:00', 1, 2, 1),
(4, 1, NULL, 'Core & Flexibility Program', 0, 6, 3, '2025-04-08 14:00:00', 0, NULL, NULL, NULL, 0, 0, 1),
(5, 1, 9, 'Powerlifting Prep Cycle', 3, 20, 4, '2025-05-03 10:00:00', 1, '2025-05-05 13:00:00', 'Peak week needs adjustment for recovery.', '2025-05-06 09:00:00', 1, 2, 1),
(6, 1, NULL, 'Fat Loss & Conditioning', 1, 10, 4, '2025-06-15 09:00:00', 0, NULL, NULL, NULL, 0, 0, 1),
(7, 1, 8, 'Bodyweight Mastery', 1, 12, 3, '2025-07-10 12:00:00', 2, '2025-07-12 10:00:00', 'Progression too aggressive for skill work. Needs revision.', NULL, 0, 2, 1),
(1, 1, 9, 'General Fitness Maintenance', 0, 8, 3, '2025-08-18 08:00:00', 1, '2025-08-20 11:00:00', 'Perfect for sustained health. Approved.', '2025-08-21 15:00:00', 1, 2, 1),
(2, 1, NULL, 'Hypertrophy Focus Block', 2, 12, 5, '2025-09-05 10:00:00', 0, NULL, NULL, NULL, 0, 0, 1),
(3, 1, 8, 'Endurance & Stamina Builder', 1, 10, 4, '2025-10-01 09:00:00', 1, '2025-10-03 14:00:00', 'Balanced cardio and strength. Approved.', '2025-10-04 11:00:00', 1, 2, 1);
PRINT '10 rows inserted into WorkoutRecommendations.';
GO

-- ================================================================
-- Table: RecommendedExercises
-- Purpose: Individual exercises within workout recommendations
-- Dependencies: WorkoutRecommendations (WorkoutRecommendationId), Exercises (ExerciseId), Users/Coach (AddedByCoachID - nullable)
-- Note: AddedByCoachID should reference Coach users when IsAddedByCoach=1
-- Note: RecommendedExerciseId is IDENTITY, auto-generated
-- Note: WorkoutRecommendationId references auto-generated IDs, so we use dynamic lookup
-- ================================================================
PRINT 'Inserting data into RecommendedExercises...';

DECLARE @RecommendationIDs TABLE (ID int, RowNum int);
INSERT INTO @RecommendationIDs (ID, RowNum)
SELECT TOP 10 RecommendationID, ROW_NUMBER() OVER (ORDER BY RecommendationID) as RowNum
FROM WorkoutRecommendations
ORDER BY RecommendationID;

DECLARE @Rec1 int = (SELECT ID FROM @RecommendationIDs WHERE RowNum = 1);
DECLARE @Rec2 int = (SELECT ID FROM @RecommendationIDs WHERE RowNum = 2);
DECLARE @Rec3 int = (SELECT ID FROM @RecommendationIDs WHERE RowNum = 3);
DECLARE @Rec5 int = (SELECT ID FROM @RecommendationIDs WHERE RowNum = 5);
DECLARE @Rec8 int = (SELECT ID FROM @RecommendationIDs WHERE RowNum = 8);
DECLARE @Rec10 int = (SELECT ID FROM @RecommendationIDs WHERE RowNum = 10);

INSERT INTO RecommendedExercises (WorkoutRecommendationId, ExerciseId, Sets, Reps, Weight, RestTime, [Order], CoachNotes, IsAddedByCoach, AddedByCoachID)
VALUES
(@Rec1, 1, 3, 10, 20.0, '00:01:30', 1, 'Focus on form over weight', 0, NULL),
(@Rec1, 2, 3, 12, 15.0, '00:01:00', 2, 'Control the descent', 0, NULL),
(@Rec2, 3, 4, 8, 60.0, '00:02:00', 1, 'Explode on the concentric', 1, 8),
(@Rec2, 4, 4, 10, 40.0, '00:01:30', 2, 'Maintain core tension', 0, NULL),
(@Rec3, 5, 5, 5, 100.0, '00:03:00', 1, 'Peak strength work', 1, 9),
(@Rec3, 6, 4, 6, 80.0, '00:02:30', 2, 'Depth below parallel', 1, 9),
(@Rec5, 7, 5, 3, 120.0, '00:04:00', 1, 'Competition prep intensity', 1, 9),
(@Rec8, 8, 3, 15, 10.0, '00:00:45', 1, 'Light maintenance work', 0, NULL),
(@Rec10, 9, 4, 12, 25.0, '00:01:15', 1, 'Superset with cardio', 1, 8),
(@Rec10, 10, 3, 20, 0.0, '00:01:00', 2, 'Bodyweight conditioning', 0, NULL);

PRINT '10 rows inserted into RecommendedExercises.';
GO

-- ================================================================
-- Table: SafetyIncidents
-- Purpose: Tracks safety incidents detected by AI or reported
-- Dependencies: Users (UserID - nullable), Equipments (EquipmentID - nullable)
-- Enum: Severity (0=Minor, 1=Moderate, 2=Serious, 3=Critical)
-- Note: IncidentID is IDENTITY, auto-generated
-- ================================================================
PRINT 'Inserting data into SafetyIncidents...';
INSERT INTO SafetyIncidents (UserID, EquipmentID, IncidentType, Severity, Description, DetectedAt, IsResolved)
VALUES
(1, 1, 'Near Fall', 1, 'Member lost balance on treadmill due to high speed. AI detected unsteady gait pattern.', '2025-01-20 18:30:00', 1),
(NULL, 2, 'Equipment Malfunction', 2, 'Bench press safety bar failed to lock properly. Immediate maintenance required.', '2025-02-15 11:00:00', 1),
(3, 4, 'Improper Form', 0, 'Excessive weight on leg press causing lower back rounding. Trainer intervened.', '2025-03-10 17:00:00', 1),
(NULL, 5, 'Cable Snap', 3, 'Cable machine wire snapped during use. No injuries reported. Equipment quarantined.', '2025-04-05 14:30:00', 1),
(5, NULL, 'Slip Hazard', 1, 'Water spill detected in free weights zone. Cleaning crew notified immediately.', '2025-05-12 09:00:00', 1),
(6, 8, 'Dropped Weight', 2, 'Member dropped barbell from squat rack. AI detected loss of control. Minor injury.', '2025-06-25 19:00:00', 1),
(NULL, 10, 'Maintenance Issue', 1, 'Elliptical machine producing unusual noise. Scheduled for inspection.', '2025-07-18 08:00:00', 0),
(7, NULL, 'Overexertion', 1, 'Heart rate exceeded safe threshold (195 bpm). Member advised to rest.', '2025-08-28 18:00:00', 1),
(NULL, 3, 'Weight Drop', 0, 'Dumbbells dropped improperly causing loud noise. Reminded about proper etiquette.', '2025-09-15 17:30:00', 1),
(2, 6, 'Collision Risk', 1, 'Two members nearly collided in rowing machine area. AI suggested zone reorganization.', '2025-10-10 12:00:00', 0);
PRINT '10 rows inserted into SafetyIncidents.';
GO

-- ================================================================
-- Section 3: Verification
-- ================================================================
PRINT '';
PRINT '================================================================';
PRINT 'Part 3 Seed Data Insertion Complete!';
PRINT '================================================================';
PRINT 'Summary:';
PRINT '- AIQueryLogs: 10 rows';
PRINT '- ChurnPredictions: 10 rows';
PRINT '- EquipmentDemandPredictions: 10 rows';
PRINT '- ExerciseFormAnalyses: 10 rows';
PRINT '- GymOccupancies: 10 rows';
PRINT '- HeartRateData: 10 rows';
PRINT '- WorkoutRecommendations: 10 rows';
PRINT '- RecommendedExercises: 10 rows';
PRINT '- SafetyIncidents: 10 rows';
PRINT 'Total: 90 rows inserted';
PRINT '';
PRINT 'All 34 tables in IntelliFitDb now have seed data!';
PRINT '================================================================';
GO
