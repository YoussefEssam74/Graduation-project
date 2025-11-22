-- ===============================================
-- SQL Script to Insert 10 Rows for First 11 Tables
-- IntelliFit Database - Test Data
-- Created: November 22, 2025
-- ===============================================

USE IntelliFitDb;
GO

-- ===============================================
-- Clear existing data (in correct order to respect FK constraints)
-- ===============================================
PRINT 'Clearing existing data...';

DELETE FROM NutritionPlans;
DELETE FROM MemberWorkoutPlans;
DELETE FROM TemplateExercises;
DELETE FROM WorkoutPlanTemplates;
DELETE FROM Exercises;
DELETE FROM MaintenanceLogs;
DELETE FROM WorkoutSessions;
DELETE FROM Bookings;
DELETE FROM Equipments;
DELETE FROM Users;
DELETE FROM SubscriptionPlans;
DELETE FROM AI_Agents;

PRINT 'Data cleared successfully.';
GO

-- ===============================================
-- 0. AI_Agents (Required for NutritionPlans)
-- ===============================================
SET IDENTITY_INSERT AI_Agents ON;

INSERT INTO AI_Agents (AI_ID, ModelName, Version, Provider, Status)
VALUES
(1, 'GPT-4', '1.0', 'OpenAI', 'Active');

SET IDENTITY_INSERT AI_Agents OFF;
GO

-- ===============================================
-- 1. SubscriptionPlans (Master Table - No Dependencies)
-- ===============================================
SET IDENTITY_INSERT SubscriptionPlans ON;

INSERT INTO SubscriptionPlans (PlanID, PlanName, Description, MonthlyFee, TokensIncluded, HasAIFeatures, IsActive)
VALUES
(1, 'Basic', 'Basic membership with access to gym facilities', 299.99, 0, 0, 1),
(2, 'Standard', 'Standard membership with 10 tokens monthly', 499.99, 10, 0, 1),
(3, 'Premium', 'Premium membership with AI features', 799.99, 30, 1, 1),
(4, 'Elite', 'Elite membership with full AI access', 1299.99, 100, 1, 1),
(5, 'Student', 'Special student discount plan', 199.99, 5, 0, 1),
(6, 'Senior', 'Senior citizen special plan', 249.99, 5, 0, 1),
(7, 'Family', 'Family package for multiple users', 999.99, 50, 1, 1),
(8, 'Corporate', 'Corporate wellness program', 699.99, 20, 1, 1),
(9, 'Trial', 'Trial membership for new members', 0.00, 3, 0, 1),
(10, 'VIP', 'VIP membership with unlimited access', 1999.99, 200, 1, 1);

SET IDENTITY_INSERT SubscriptionPlans OFF;
GO

-- ===============================================
-- 2. Users (Base Table with TPH Inheritance)
-- Uses: Name, Email, PasswordHash, Age, Gender(int), FitnessGoal, TokenBalance, CreatedAt, Role(int), UserType, Phone, SubscriptionPlanID
-- Gender: 0=Male, 1=Female, Role: 0=Member, 1=Coach, 2=Admin, 3=Receptionist
-- ===============================================
SET IDENTITY_INSERT Users ON;

INSERT INTO Users (UserId, Name, Email, PasswordHash, Age, Gender, FitnessGoal, TokenBalance, CreatedAt, Role, Phone, SubscriptionPlanID, UserType)
VALUES
-- Members (UserType = NULL or 'Member', Role = 0)
(1, 'Ahmed Hassan', 'ahmed.hassan@gmail.com', 'hash123', 29, 0, 'Muscle Gain', 50, '2024-01-10 10:00:00', 0, '01012345678', 3, 'Member'),
(2, 'Sara Mohamed', 'sara.mohamed@gmail.com', 'hash456', 26, 1, 'Weight Loss', 30, '2024-02-15 10:00:00', 0, '01098765432', 2, 'Member'),
(3, 'Omar Khalil', 'omar.khalil@gmail.com', 'hash789', 32, 0, 'Strength Training', 100, '2024-03-20 10:00:00', 0, '01123456789', 4, 'Member'),
(4, 'Nour Ali', 'nour.ali@gmail.com', 'hash321', 24, 1, 'General Fitness', 10, '2024-04-05 10:00:00', 0, '01087654321', 2, 'Member'),
(5, 'Mahmoud Samy', 'mahmoud.samy@gmail.com', 'hash654', 34, 0, 'Endurance', 200, '2024-05-18 10:00:00', 0, '01156789012', 10, 'Member'),

-- Admins (UserType = 'Admin', Role = 2)
(6, 'Youssef Essam', 'youssef.admin@intellifit.com', 'adminHash1', 36, 0, 'Management', 0, '2023-01-01 08:00:00', 2, '01011111111', NULL, 'Admin'),
(7, 'Mona Ibrahim', 'mona.admin@intellifit.com', 'adminHash2', 34, 1, 'Administration', 0, '2023-02-01 08:00:00', 2, '01022222222', NULL, 'Admin'),

-- Coaches (UserType = 'Coach', Role = 1)
(8, 'Khaled Mostafa', 'khaled.coach@intellifit.com', 'coachHash1', 39, 0, 'Strength Training', 0, '2023-03-01 08:00:00', 1, '01033333333', NULL, 'Coach'),
(9, 'Dina Farouk', 'dina.coach@intellifit.com', 'coachHash2', 32, 1, 'Yoga & Pilates', 0, '2023-04-01 08:00:00', 1, '01044444444', NULL, 'Coach'),

-- Receptionists (UserType = 'Receptionist', Role = 3)
(10, 'Hana Salem', 'hana.reception@intellifit.com', 'recepHash1', 29, 1, 'Customer Service', 0, '2023-05-01 08:00:00', 3, '01055555555', NULL, 'Receptionist');

SET IDENTITY_INSERT Users OFF;
GO

-- ===============================================
-- 3. Equipments (No Dependencies)
-- Uses: Name, Category, QRCode, Status(int), Description, MaintenanceIntervalDays, LastMaintenanceDate, NextMaintenanceDate, TokenCostPerHour
-- Status: 0=Available, 1=InUse, 2=UnderMaintenance, 3=OutOfService
-- ===============================================
SET IDENTITY_INSERT Equipments ON;

INSERT INTO Equipments (EquipmentID, Name, Category, QRCode, Status, Description, MaintenanceIntervalDays, LastMaintenanceDate, NextMaintenanceDate, TokenCostPerHour)
VALUES
(1, 'Treadmill Pro X1', 'Cardio', 'QR001', 0, 'Professional treadmill with heart rate monitor', 90, '2024-10-20', '2025-01-20', 2),
(2, 'Bench Press Station', 'Strength', 'QR002', 0, 'Olympic bench press with safety bars', 120, '2024-09-15', '2025-01-15', 3),
(3, 'Elliptical Trainer E200', 'Cardio', 'QR003', 0, 'Low-impact elliptical trainer', 90, '2024-11-01', '2025-02-01', 2),
(4, 'Squat Rack Heavy Duty', 'Strength', 'QR004', 0, 'Heavy duty squat rack with pull-up bar', 120, '2024-10-10', '2025-02-10', 3),
(5, 'Rowing Machine R500', 'Cardio', 'QR005', 2, 'Water resistance rowing machine', 90, '2024-08-25', '2024-11-25', 2),
(6, 'Cable Machine Dual', 'Strength', 'QR006', 0, 'Dual cable crossover station', 120, '2024-11-05', '2025-03-05', 3),
(7, 'Spin Bike Pro', 'Cardio', 'QR007', 0, 'Professional spin bike with digital display', 60, '2024-10-30', '2024-12-30', 2),
(8, 'Leg Press Machine', 'Strength', 'QR008', 0, '45-degree leg press machine', 120, '2024-09-20', '2025-01-20', 3),
(9, 'Smith Machine', 'Strength', 'QR009', 0, 'Smith machine with safety stops', 120, '2024-11-10', '2025-03-10', 3),
(10, 'Assault Bike AB1', 'Cardio', 'QR010', 0, 'Air resistance assault bike', 60, '2024-10-15', '2024-12-15', 2);

SET IDENTITY_INSERT Equipments OFF;
GO

-- ===============================================
-- 4. Bookings (Depends on: Users, Equipments)
-- Uses: UserID, EquipmentID, StartTime, EndTime, Status(int), TokensDeducted
-- Status: 0=Pending, 1=Confirmed, 2=Completed, 3=Cancelled
-- ===============================================
SET IDENTITY_INSERT Bookings ON;

INSERT INTO Bookings (BookingID, UserID, EquipmentID, StartTime, EndTime, Status, TokensDeducted)
VALUES
(1, 1, 1, '2024-11-22 08:00:00', '2024-11-22 09:00:00', 1, 2),
(2, 2, 3, '2024-11-22 09:00:00', '2024-11-22 10:00:00', 1, 2),
(3, 3, 2, '2024-11-22 10:00:00', '2024-11-22 11:00:00', 1, 3),
(4, 4, 7, '2024-11-22 14:00:00', '2024-11-22 15:00:00', 1, 2),
(5, 5, 4, '2024-11-22 16:00:00', '2024-11-22 17:00:00', 1, 3),
(6, 1, 6, '2024-11-23 08:00:00', '2024-11-23 09:00:00', 0, 0),
(7, 2, 8, '2024-11-23 10:00:00', '2024-11-23 11:00:00', 0, 0),
(8, 3, 9, '2024-11-23 12:00:00', '2024-11-23 13:00:00', 0, 0),
(9, 4, 10, '2024-11-23 14:00:00', '2024-11-23 15:00:00', 1, 2),
(10, 5, 1, '2024-11-23 18:00:00', '2024-11-23 19:00:00', 1, 2);

SET IDENTITY_INSERT Bookings OFF;
GO

-- ===============================================
-- 5. WorkoutSessions (Depends on: Users [Member & Coach], Equipments)
-- Uses: UserID, EquipmentID, CoachID, StartTime, EndTime, DurationMinutes, CaloriesBurned, IntensityLevel(int), AverageHeartRate, IsSupervisedByCoach
-- IntensityLevel: 0=Low, 1=Medium, 2=High, 3=VeryHigh
-- ===============================================
SET IDENTITY_INSERT WorkoutSessions ON;

INSERT INTO WorkoutSessions (SessionID, UserID, EquipmentID, CoachID, StartTime, EndTime, DurationMinutes, CaloriesBurned, IntensityLevel, AverageHeartRate, IsSupervisedByCoach)
VALUES
(1, 1, 1, 8, '2024-11-20 08:00:00', '2024-11-20 09:00:00', 60, 450, 2, 145.5, 1),
(2, 2, 3, 9, '2024-11-20 09:00:00', '2024-11-20 10:00:00', 60, 380, 1, 130.2, 1),
(3, 3, 2, 8, '2024-11-20 10:00:00', '2024-11-20 11:00:00', 60, 320, 2, 140.8, 1),
(4, 4, 7, 9, '2024-11-20 14:00:00', '2024-11-20 15:00:00', 60, 520, 3, 165.3, 1),
(5, 5, 4, 8, '2024-11-20 16:00:00', '2024-11-20 17:00:00', 60, 410, 2, 150.1, 1),
(6, 1, 6, 8, '2024-11-21 08:00:00', '2024-11-21 09:00:00', 60, 390, 2, 142.7, 1),
(7, 2, 1, 9, '2024-11-21 10:00:00', '2024-11-21 11:00:00', 60, 470, 2, 138.9, 1),
(8, 3, 8, 8, '2024-11-21 12:00:00', '2024-11-21 13:00:00', 60, 350, 1, 128.4, 1),
(9, 4, 9, 9, '2024-11-21 14:00:00', '2024-11-21 15:00:00', 60, 340, 2, 135.6, 1),
(10, 5, 10, 8, '2024-11-21 18:00:00', '2024-11-21 19:00:00', 60, 580, 3, 172.3, 1);

SET IDENTITY_INSERT WorkoutSessions OFF;
GO

-- ===============================================
-- 6. MaintenanceLogs (Depends on: Equipments)
-- Uses: EquipmentID, MaintenanceDate, MaintenanceType(int), Description, Cost, DowntimeDays
-- MaintenanceType: 0=Routine, 1=Repair, 2=Upgrade, 3=Emergency
-- ===============================================
SET IDENTITY_INSERT MaintenanceLogs ON;

INSERT INTO MaintenanceLogs (MaintenanceID, EquipmentID, MaintenanceDate, MaintenanceType, Description, Cost, DowntimeDays)
VALUES
(1, 1, '2024-10-20', 0, 'Belt replacement and motor lubrication', 450.00, 2),
(2, 2, '2024-09-15', 0, 'Bar replacement and safety check', 280.00, 1),
(3, 3, '2024-11-01', 0, 'Pedal adjustment and resistance calibration', 150.00, 1),
(4, 4, '2024-10-10', 0, 'Safety bar inspection and rack alignment', 200.00, 1),
(5, 5, '2024-08-25', 1, 'Chain replacement and seat repair', 520.00, 5),
(6, 6, '2024-11-05', 0, 'Cable replacement and pulley lubrication', 380.00, 2),
(7, 7, '2024-10-30', 0, 'Resistance adjustment and seat replacement', 320.00, 1),
(8, 8, '2024-09-20', 0, 'Hydraulic system check and pad replacement', 410.00, 2),
(9, 9, '2024-11-10', 0, 'Bar guide lubrication and safety latch check', 180.00, 1),
(10, 10, '2024-10-15', 0, 'Fan replacement and resistance calibration', 290.00, 1);

SET IDENTITY_INSERT MaintenanceLogs OFF;
GO

-- ===============================================
-- 7. Exercises (No Dependencies)
-- Uses: Name, Category, MuscleGroup, Difficulty(int), Description, VideoUrl
-- Difficulty: 0=Beginner, 1=Intermediate, 2=Advanced, 3=Expert
-- ===============================================
SET IDENTITY_INSERT Exercises ON;

INSERT INTO Exercises (ExerciseID, Name, Category, MuscleGroup, Difficulty, Description, VideoUrl)
VALUES
(1, 'Barbell Bench Press', 'Strength', 'Chest', 1, 'Compound exercise for chest development', 'https://example.com/videos/bench-press'),
(2, 'Barbell Squat', 'Strength', 'Legs', 1, 'King of leg exercises', 'https://example.com/videos/squat'),
(3, 'Running', 'Cardio', 'Full Body', 0, 'Classic cardio exercise', 'https://example.com/videos/running'),
(4, 'Pull-ups', 'Strength', 'Back', 2, 'Bodyweight back exercise', 'https://example.com/videos/pullups'),
(5, 'Deadlift', 'Strength', 'Back', 2, 'Full posterior chain exercise', 'https://example.com/videos/deadlift'),
(6, 'Dumbbell Shoulder Press', 'Strength', 'Shoulders', 1, 'Overhead pressing movement', 'https://example.com/videos/shoulder-press'),
(7, 'Plank', 'Core', 'Core', 0, 'Isometric core strengthener', 'https://example.com/videos/plank'),
(8, 'Cycling', 'Cardio', 'Legs', 0, 'Low-impact cardio', 'https://example.com/videos/cycling'),
(9, 'Lat Pulldown', 'Strength', 'Back', 0, 'Machine-based back exercise', 'https://example.com/videos/lat-pulldown'),
(10, 'Leg Press', 'Strength', 'Legs', 0, 'Machine-based leg exercise', 'https://example.com/videos/leg-press');

SET IDENTITY_INSERT Exercises OFF;
GO

-- ===============================================
-- 8. WorkoutPlanTemplates (Depends on: Users [Coach])
-- Uses: CoachID, TemplateName, Description, DifficultyLevel(int), DurationWeeks, WorkoutsPerWeek, IsPublic, CreatedAt
-- DifficultyLevel: 0=Beginner, 1=Intermediate, 2=Advanced, 3=Expert
-- ===============================================
SET IDENTITY_INSERT WorkoutPlanTemplates ON;

INSERT INTO WorkoutPlanTemplates (TemplateID, CoachID, TemplateName, Description, DifficultyLevel, DurationWeeks, WorkoutsPerWeek, IsPublic, CreatedAt)
VALUES
(1, 8, 'Beginner Full Body', 'Complete body workout for beginners', 0, 8, 3, 1, '2024-01-15 10:00:00'),
(2, 8, 'Strength Building Program', 'Focus on compound lifts and strength gains', 1, 12, 4, 1, '2024-01-20 10:00:00'),
(3, 9, 'Fat Loss Circuit', 'High intensity circuit training for fat loss', 1, 8, 5, 1, '2024-02-01 10:00:00'),
(4, 8, 'Advanced Powerlifting', 'Competition prep for powerlifting', 2, 16, 4, 1, '2024-02-10 10:00:00'),
(5, 9, 'Yoga Flow Essentials', 'Basic to intermediate yoga sequences', 0, 6, 3, 1, '2024-02-15 10:00:00'),
(6, 8, 'HIIT Cardio Blast', 'High intensity interval training', 1, 6, 4, 1, '2024-03-01 10:00:00'),
(7, 8, 'Bodybuilding Split', '5-day body part split for hypertrophy', 2, 12, 5, 1, '2024-03-10 10:00:00'),
(8, 9, 'Core Strength Builder', 'Comprehensive core development', 1, 8, 3, 1, '2024-03-15 10:00:00'),
(9, 8, 'Athletic Performance', 'Sport-specific conditioning', 2, 10, 5, 1, '2024-04-01 10:00:00'),
(10, 9, 'Senior Fitness Program', 'Safe and effective for older adults', 0, 8, 2, 1, '2024-04-10 10:00:00');

SET IDENTITY_INSERT WorkoutPlanTemplates OFF;
GO

-- ===============================================
-- 9. TemplateExercises (Depends on: WorkoutPlanTemplates, Exercises)
-- Uses: TemplateExerciseId, TemplateID, ExerciseId, DayNumber, Sets, Reps, Weight, RestTime, Order, Notes
-- ===============================================
SET IDENTITY_INSERT TemplateExercises ON;

INSERT INTO TemplateExercises (TemplateExerciseId, TemplateID, ExerciseId, DayNumber, Sets, Reps, Weight, RestTime, [Order], Notes)
VALUES
-- Beginner Full Body (TemplateID = 1)
(1, 1, 3, 1, 1, 20, 0, '00:01:00', 1, 'Warm-up with light jog'),
(2, 1, 7, 1, 3, 30, 0, '00:00:45', 2, 'Hold plank for 30 seconds'),
(3, 1, 10, 1, 3, 12, 50, '00:01:30', 3, 'Start with comfortable weight'),

-- Strength Building Program (TemplateID = 2)
(4, 2, 2, 1, 5, 5, 100, '00:03:00', 1, 'Focus on form, progressive overload'),
(5, 2, 1, 1, 5, 5, 80, '00:03:00', 2, 'Bench press after squats'),
(6, 2, 5, 2, 5, 5, 120, '00:03:00', 1, 'Deadlift day'),

-- Fat Loss Circuit (TemplateID = 3)
(7, 3, 3, 1, 3, 10, 0, '00:00:30', 1, 'Sprint intervals - 30 seconds on/off'),
(8, 3, 8, 1, 3, 15, 0, '00:00:30', 2, 'High cadence cycling'),

-- Advanced Powerlifting (TemplateID = 4)
(9, 4, 2, 1, 8, 3, 150, '00:04:00', 1, 'Heavy squat day - 85-90% 1RM'),
(10, 4, 5, 3, 8, 3, 180, '00:04:00', 1, 'Heavy deadlift day - 85-90% 1RM');

SET IDENTITY_INSERT TemplateExercises OFF;
GO

-- ===============================================
-- 10. MemberWorkoutPlans (Depends on: Users [Member & Coach], WorkoutPlanTemplates)
-- Uses: UserID, TemplateID, AssignedByCoachID, GeneratedByAI_ID, StartDate, EndDate, Status(int), CompletedWorkouts, PlanSource(int), ApprovalStatus(int)
-- Status: 0=Pending, 1=Active, 2=Completed, 3=Cancelled
-- PlanSource: 0=CoachAssigned, 1=AIGenerated, 2=SelfSelected
-- ApprovalStatus: 0=Pending, 1=Approved, 2=Rejected, 3=NeedsRevision
-- ===============================================
SET IDENTITY_INSERT MemberWorkoutPlans ON;

INSERT INTO MemberWorkoutPlans (PlanInstanceID, UserID, TemplateID, AssignedByCoachID, GeneratedByAI_ID, StartDate, EndDate, Status, CompletedWorkouts, PlanSource, ApprovalStatus)
VALUES
(1, 1, 1, 8, NULL, '2024-11-01', '2024-12-27', 1, 12, 0, 1),
(2, 2, 3, 9, NULL, '2024-11-05', '2024-12-31', 1, 8, 0, 1),
(3, 3, 2, 8, NULL, '2024-10-15', '2025-01-15', 1, 24, 0, 1),
(4, 4, 5, 9, NULL, '2024-11-10', '2024-12-22', 1, 6, 0, 1),
(5, 5, 4, 8, NULL, '2024-10-01', '2025-01-31', 1, 32, 0, 1),
(6, 1, 6, 8, NULL, '2024-09-01', '2024-10-15', 2, 18, 0, 1),
(7, 2, 1, 9, NULL, '2024-08-01', '2024-09-30', 2, 24, 0, 1),
(8, 3, 7, 8, NULL, '2024-11-15', '2025-02-15', 1, 4, 0, 1),
(9, 4, 8, 9, NULL, '2024-10-20', '2024-12-15', 1, 15, 0, 1),
(10, 5, 9, 8, NULL, '2024-11-01', '2025-01-10', 1, 20, 0, 1);

SET IDENTITY_INSERT MemberWorkoutPlans OFF;
GO

-- ===============================================
-- 11. NutritionPlans (Depends on: Users [Member], AI_Agents [for AI_ID])
-- Uses: UserID, AI_ID, ReviewedByCoachID, PlanName, DailyCalories, ProteinGrams, CarbsGrams, FatsGrams, GeneratedAt, ApprovalStatus(int), ReviewedAt, ReviewComments, IsActive, PlanSource(int), AIAgentAI_ID
-- ApprovalStatus: 0=Pending, 1=Approved, 2=Rejected, 3=NeedsRevision
-- PlanSource: 0=AIGenerated, 1=CoachCreated, 2=UserCustomized
-- Note: Both AI_ID and AIAgentAI_ID are required (not nullable)
-- ===============================================
SET IDENTITY_INSERT NutritionPlans ON;

INSERT INTO NutritionPlans (PlanID, UserID, AI_ID, ReviewedByCoachID, PlanName, DailyCalories, ProteinGrams, CarbsGrams, FatsGrams, GeneratedAt, ApprovalStatus, ReviewedAt, ReviewComments, IsActive, PlanSource, AIAgentAI_ID)
VALUES
(1, 1, 1, 8, 'Muscle Gain Plan', 2500, 180, 280, 70, '2024-11-01 10:00:00', 1, '2024-11-02 10:00:00', 'Clean bulk phase, focus on whole foods', 1, 1, 1),
(2, 2, 1, 9, 'Weight Loss Plan', 1800, 120, 180, 50, '2024-11-05 10:00:00', 1, '2024-11-06 10:00:00', 'Moderate deficit, sustainable approach', 1, 1, 1),
(3, 3, 1, 8, 'Powerlifting Bulk', 3200, 220, 400, 90, '2024-10-15 10:00:00', 1, '2024-10-16 10:00:00', 'Aggressive bulk for powerlifting prep', 1, 1, 1),
(4, 4, 1, 9, 'Maintenance Plan', 2000, 100, 250, 55, '2024-11-10 10:00:00', 1, '2024-11-11 10:00:00', 'Balanced nutrition for yoga practice', 1, 1, 1),
(5, 5, 1, 8, 'Strength Performance', 3500, 250, 420, 100, '2024-10-01 10:00:00', 1, '2024-10-02 10:00:00', 'High calorie for competition prep', 1, 1, 1),
(6, 1, 1, 8, 'Fat Loss Plan', 2200, 160, 240, 65, '2024-09-01 10:00:00', 1, '2024-09-02 10:00:00', 'Successfully lost 5kg', 0, 1, 1),
(7, 2, 1, 9, 'Maintenance Phase', 2100, 140, 220, 60, '2024-08-01 10:00:00', 1, '2024-08-02 10:00:00', 'Maintenance phase completed', 0, 1, 1),
(8, 3, 1, 8, 'Lean Bulk Plan', 2800, 200, 320, 75, '2024-11-15 10:00:00', 1, '2024-11-16 10:00:00', 'Lean bulking phase', 1, 1, 1),
(9, 4, 1, 9, 'Gradual Cut Plan', 1900, 110, 200, 55, '2024-10-20 10:00:00', 1, '2024-10-21 10:00:00', 'Gradual fat loss approach', 1, 1, 1),
(10, 5, 1, 8, 'Athletic Performance', 3000, 230, 380, 85, '2024-11-01 10:00:00', 1, '2024-11-02 10:00:00', 'Optimized for athletic performance', 1, 1, 1);

SET IDENTITY_INSERT NutritionPlans OFF;
GO

PRINT 'Successfully inserted 10 rows into first 11 tables!';
PRINT 'Tables populated:';
PRINT '  1. SubscriptionPlans (10 rows)';
PRINT '  2. Users (10 rows - 5 Members, 2 Admins, 2 Coaches, 1 Receptionist)';
PRINT '  3. Equipments (10 rows)';
PRINT '  4. Bookings (10 rows)';
PRINT '  5. WorkoutSessions (10 rows)';
PRINT '  6. MaintenanceLogs (10 rows)';
PRINT '  7. Exercises (10 rows)';
PRINT '  8. WorkoutPlanTemplates (10 rows)';
PRINT '  9. TemplateExercises (10 rows)';
PRINT ' 10. MemberWorkoutPlans (10 rows)';
PRINT ' 11. NutritionPlans (10 rows)';
PRINT '';
PRINT 'Note: AI_Agents table must exist with AI_ID = 1 for NutritionPlans to work correctly.';
GO
