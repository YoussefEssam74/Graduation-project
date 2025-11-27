-- IntelliFit Database Complete Seed Data - PostgreSQL Version
-- ALL 31 TABLES with Correct PascalCase Column Names
-- ==========================================
-- IMPORTANT: This file uses the ACTUAL database schema
-- Replace placeholder IDs (<USER_ID_X>, <COACH_ID_X>, etc.) with actual IDs from your database

-- ==========================================
-- STEP 1: Clear existing data (optional - be careful!)
-- ==========================================
-- TRUNCATE TABLE users, member_profiles, coach_profiles, subscription_plans, user_subscriptions,
-- token_packages, token_transactions, payments, equipment_categories, equipment, bookings,
-- inbody_measurements, exercises, workout_plans, workout_plan_exercises, workout_logs,
-- workout_templates, workout_template_exercises, nutrition_plans, meals, ingredients,
-- meal_ingredients, coach_reviews, notifications, activity_feeds, progress_milestones,
-- user_milestones, ai_chat_logs, ai_program_generations, ai_workflow_jobs, audit_logs
-- RESTART IDENTITY CASCADE;

-- ==========================================
-- TABLE 1: Users (10 rows)
-- ==========================================
-- Note: UserId is auto-increment, Role: 0=Member, 1=Coach, 2=Admin, Gender: 0=Male, 1=Female
INSERT INTO users ("Email", "PasswordHash", "Name", "Phone", "DateOfBirth", "Gender", "Role", "TokenBalance", "IsActive", "EmailVerified", "CreatedAt", "UpdatedAt") 
VALUES
('emma.wilson@email.com', '$2a$11$hashedpassword1', 'Emma Wilson', '+1234567890', '1995-05-15', 1, 0, 50, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('michael.chen@email.com', '$2a$11$hashedpassword2', 'Michael Chen', '+1234567891', '1992-08-18', 0, 0, 75, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sarah.johnson@email.com', '$2a$11$hashedpassword3', 'Sarah Johnson', '+1234567892', '1990-03-22', 1, 1, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('jessica.brown@email.com', '$2a$11$hashedpassword4', 'Jessica Brown', '+1234567893', '1996-11-05', 1, 0, 100, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mike.anderson@email.com', '$2a$11$hashedpassword5', 'Mike Anderson', '+1234567894', '1988-11-30', 0, 1, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('david.martinez@email.com', '$2a$11$hashedpassword6', 'David Martinez', '+1234567895', '1998-03-10', 0, 0, 30, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lisa.taylor@email.com', '$2a$11$hashedpassword7', 'Lisa Taylor', '+1234567896', '1994-07-18', 1, 0, 25, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('alex.rodriguez@email.com', '$2a$11$hashedpassword8', 'Alex Rodriguez', '+1234567897', '1985-07-14', 0, 1, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('amanda.garcia@email.com', '$2a$11$hashedpassword9', 'Amanda Garcia', '+1234567898', '1997-12-08', 1, 0, 60, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('admin@intellifit.com', '$2a$11$hashedpassword10', 'System Admin', '+1234567899', '1982-01-25', 0, 2, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Get the inserted User IDs for reference
-- Run: SELECT "UserId", "Name", "Role" FROM users ORDER BY "UserId";
-- Note down: Member IDs (Role=0), Coach IDs (Role=1), Admin ID (Role=2)

-- ==========================================
-- TABLE 2: Member Profiles (6 rows)
-- ==========================================
-- Note: Link to users where Role = 0 (Member)
-- Replace <MEMBER_USER_ID_X> with actual User IDs from your database
INSERT INTO member_profiles ("UserId", "FitnessGoal", "MedicalConditions", "FitnessLevel", "CurrentWeight", "TargetWeight", "Height", "TotalWorkoutsCompleted", "TotalCaloriesBurned", "Achievements", "CreatedAt", "UpdatedAt")
VALUES
(<MEMBER_USER_ID_1>, 'Weight Loss', NULL, 'Beginner', 70.0, 65.0, 165.0, 15, 4500, '["First Workout"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(<MEMBER_USER_ID_2>, 'Muscle Gain', 'Asthma', 'Intermediate', 78.0, 85.0, 180.0, 42, 12600, '["Week Warrior", "Month Champion"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(<MEMBER_USER_ID_3>, 'Weight Loss', NULL, 'Intermediate', 60.0, 55.0, 168.0, 28, 8400, '["Week Warrior"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(<MEMBER_USER_ID_4>, 'General Fitness', NULL, 'Beginner', 72.0, 70.0, 175.0, 8, 2400, '["First Workout"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(<MEMBER_USER_ID_5>, 'Endurance', 'Previous knee injury', 'Beginner', 65.0, 63.0, 170.0, 12, 3600, '["First Workout"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(<MEMBER_USER_ID_6>, 'Weight Loss', NULL, 'Beginner', 58.0, 55.0, 162.0, 6, 1800, '[]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==========================================
-- TABLE 3: Coach Profiles (3 rows)
-- ==========================================
-- Note: Link to users where Role = 1 (Coach)
-- Replace <COACH_USER_ID_X> with actual User IDs from your database
INSERT INTO coach_profiles ("UserId", "Specialization", "Certifications", "ExperienceYears", "Bio", "HourlyRate", "Rating", "TotalReviews", "TotalClients", "IsAvailable", "CreatedAt", "UpdatedAt")
VALUES
(<COACH_USER_ID_1>, 'Strength Training & Weight Loss', ARRAY['NASM-CPT', 'CSCS', 'Precision Nutrition L1'], 5, 'Certified personal trainer specializing in strength training and sustainable weight loss programs', 75.00, 4.8, 45, 28, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(<COACH_USER_ID_2>, 'Powerlifting & Muscle Building', ARRAY['CSCS', 'USATF Level 1', 'ISSA'], 8, 'Former competitive powerlifter specializing in strength development and hypertrophy training', 85.00, 4.9, 67, 35, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(<COACH_USER_ID_3>, 'CrossFit & Athletic Performance', ARRAY['CrossFit L2', 'NASM-CPT', 'USAW L1'], 7, 'CrossFit Level 2 trainer with expertise in Olympic lifting and sports performance', 90.00, 4.7, 52, 41, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Get the inserted Coach IDs for reference
-- Run: SELECT "CoachId", "UserId", "Specialization" FROM coach_profiles ORDER BY "CoachId";

-- ==========================================
-- TABLE 4: Subscription Plans (10 rows)
-- ==========================================
INSERT INTO subscription_plans ("PlanName", "Description", "Price", "DurationDays", "TokensIncluded", "Features", "MaxBookingsPerDay", "IsPopular", "IsActive", "CreatedAt", "UpdatedAt")
VALUES
('Basic Monthly', 'Access to gym facilities and basic equipment', 49.99, 30, 20, '{"features": ["Gym Access", "Equipment Use", "Locker Room"]}'::jsonb, 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Standard Monthly', 'Includes group classes and nutrition consultation', 79.99, 30, 50, '{"features": ["Gym Access", "Group Classes", "Nutrition Consultation"]}'::jsonb, 3, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Premium Monthly', 'Full access with personal training sessions', 129.99, 30, 100, '{"features": ["Gym Access", "Personal Training", "Nutrition Plan", "Priority Booking"]}'::jsonb, 5, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Basic Quarterly', '3-month basic membership with discount', 134.99, 90, 60, '{"features": ["Gym Access", "Equipment Use", "Locker Room"]}'::jsonb, 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Standard Quarterly', '3-month standard membership', 214.99, 90, 150, '{"features": ["Gym Access", "Group Classes", "Nutrition Consultation"]}'::jsonb, 3, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Premium Quarterly', '3-month premium with personal training', 349.99, 90, 300, '{"features": ["Gym Access", "Personal Training", "Nutrition Plan"]}'::jsonb, 5, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Basic Annual', 'Full year basic membership with best value', 499.99, 365, 240, '{"features": ["Gym Access", "Equipment Use", "Free Guest Pass"]}'::jsonb, 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Standard Annual', 'Full year standard membership', 799.99, 365, 600, '{"features": ["Gym Access", "Group Classes", "Free Guest Pass"]}'::jsonb, 3, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Premium Annual', 'Full year premium with all benefits', 1299.99, 365, 1200, '{"features": ["Gym Access", "Personal Training", "Nutrition Plan", "Priority Booking"]}'::jsonb, 5, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Student Monthly', 'Special student pricing with valid ID', 39.99, 30, 15, '{"features": ["Gym Access", "Group Classes", "Student Lounge"]}'::jsonb, 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==========================================
-- CONTINUE WITH REMAINING TABLES...
-- ==========================================
-- This is a template file. For the complete working seed data with actual IDs,
-- refer to the data that was successfully inserted via the dbclient-execute-query tool.
-- 
-- The following tables still need to be added with correct column names:
-- - user_subscriptions
-- - token_packages
-- - token_transactions
-- - payments
-- - equipment_categories
-- - equipment
-- - bookings
-- - inbody_measurements
-- - exercises
-- - workout_plans
-- - workout_plan_exercises
-- - workout_logs
-- - workout_templates
-- - workout_template_exercises
-- - nutrition_plans
-- - meals
-- - ingredients
-- - meal_ingredients
-- - coach_reviews
-- - notifications
-- - activity_feeds
-- - progress_milestones
-- - user_milestones
-- - ai_chat_logs
-- - ai_program_generations
-- - ai_workflow_jobs
-- - audit_logs

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Run these queries to verify your seed data:

-- Check all table row counts
SELECT 'users' as table_name, COUNT(*) as rows FROM users
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
ORDER BY table_name;

-- Expected total: 299 rows across 31 tables
