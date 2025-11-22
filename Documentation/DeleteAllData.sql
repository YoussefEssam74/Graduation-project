-- =============================================
-- Delete All Data from IntelliFit Database
-- Generated: November 22, 2025
-- =============================================

USE [IntelliFitDb];
GO

-- Delete in reverse order of dependencies to avoid FK constraint violations

-- AI Features - Child tables first
DELETE FROM [ExerciseFormAnalyses];
DELETE FROM [RecommendedExercises];
DELETE FROM [WorkoutRecommendations];
DELETE FROM [AIQueryLogs];

-- Analytics & Predictions
DELETE FROM [ChurnPredictions];
DELETE FROM [EquipmentDemandPredictions];
DELETE FROM [GymOccupancies];
DELETE FROM [SafetyIncidents];

-- Health Monitoring
DELETE FROM [HeartRateData];
DELETE FROM [WearableDevices];
DELETE FROM [InBodyMeasurements];

-- Workout Management
DELETE FROM [WorkoutSessions];
DELETE FROM [MemberWorkoutPlans];
DELETE FROM [TemplateExercises];
DELETE FROM [WorkoutPlanTemplates];
DELETE FROM [Exercises];

-- Nutrition Management
DELETE FROM [MealIngredients];
DELETE FROM [Meals];
DELETE FROM [Ingredients];
DELETE FROM [NutritionPlans];

-- Business Management
DELETE FROM [CoachReviews];
DELETE FROM [TokenTransactions];
DELETE FROM [MemberCoachSubscriptions];
DELETE FROM [Payments];
DELETE FROM [Notifications];

-- Equipment & Facility
DELETE FROM [MaintenanceLogs];
DELETE FROM [Bookings];
DELETE FROM [Equipments];

-- AI Agents
DELETE FROM [AI_Agents];

-- Subscription Plans
DELETE FROM [SubscriptionPlans];

-- Users (includes Admin, Coach, Receptionist via TPH)
DELETE FROM [Users];

PRINT 'All data deleted successfully from all tables.';
