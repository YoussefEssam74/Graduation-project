-- IntelliFit Database Complete Seed Data - PostgreSQL
-- ==========================================
-- All passwords are BCrypt hashed "password": $2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm
-- ==========================================

-- ==========================================
-- TRUNCATE ALL TABLES
-- ==========================================
TRUNCATE TABLE user_milestones, activity_feeds, notifications, coach_reviews, 
user_subscriptions, payments, token_transactions, inbody_measurements, 
meal_ingredients, meals, nutrition_plans, workout_templates, workout_template_exercises,
workout_logs, workout_plan_exercises, workout_plans, bookings, equipment, equipment_categories,
ai_program_generations, ai_chat_logs, ai_workflow_jobs, audit_logs, exercises, ingredients,
progress_milestones, subscription_plans, token_packages,
admins, coaches, receptionists, members, users RESTART IDENTITY CASCADE;

-- ==========================================
-- USERS (Base Table - TPT)
-- Note: UserId is auto-generated. Role determined by derived table (members/coaches/receptionists/admins)
-- ==========================================
INSERT INTO users ("Email", "PasswordHash", "Name", "Phone", "DateOfBirth", "Gender", "TokenBalance", "IsActive", "EmailVerified", "CreatedAt", "UpdatedAt") VALUES
('john.doe@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'John Doe', '+1234567890', '1995-05-15', 0, 50, true, true, NOW(), NOW()),
('sarah.johnson@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Sarah Johnson', '+1234567891', '1990-03-22', 1, 0, true, true, NOW(), NOW()),
('michael.smith@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Michael Smith', '+1234567892', '1992-08-18', 0, 75, true, true, NOW(), NOW()),
('emily.davis@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Emily Davis', '+1234567893', '1988-11-30', 1, 0, true, true, NOW(), NOW()),
('david.wilson@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'David Wilson', '+1234567894', '1998-03-10', 0, 30, true, true, NOW(), NOW()),
('jessica.brown@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Jessica Brown', '+1234567895', '1996-11-05', 1, 100, true, true, NOW(), NOW()),
('robert.taylor@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Robert Taylor', '+1234567896', '1985-07-14', 0, 0, true, true, NOW(), NOW()),
('lisa.anderson@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGm', 'Lisa Anderson', '+1234567897', '1994-07-18', 1, 25, true, true, NOW(), NOW()),
('james.martinez@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'James Martinez', '+1234567898', '1982-01-25', 0, 0, true, true, NOW(), NOW()),
('amanda.garcia@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Amanda Garcia', '+1234567899', '1997-12-08', 1, 60, true, true, NOW(), NOW()),
('admin@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Admin User', '555-0011', '1985-01-01', 0, 100, true, true, NOW(), NOW()),
('superadmin@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Super Admin', '555-0012', '1980-01-01', 0, 100, true, true, NOW(), NOW());

-- ==========================================
-- MEMBERS (TPT Derived)
-- ==========================================
INSERT INTO members ("UserId", "FitnessGoal", "MedicalConditions", "TotalWorkoutsCompleted", "TotalCaloriesBurned", "Achievements") VALUES
(1, 'Weight Loss', 'None', 15, 4500, '["First Workout"]'),
(3, 'Muscle Gain', 'Asthma', 42, 12600, '["Week Warrior", "Month Champion"]'),
(5, 'General Fitness', 'None', 8, 2400, '["First Workout"]'),
(6, 'Weight Loss', 'None', 28, 8400, '["Week Warrior"]'),
(8, 'Endurance', 'Previous knee injury', 12, 3600, '["First Workout"]'),
(10, 'Flexibility', 'None', 6, 1800, '[]');

-- ==========================================
-- COACHES (TPT Derived)
-- ==========================================
INSERT INTO coaches ("UserId", "Specialization", "Certifications", "ExperienceYears", "Bio", "Rating", "TotalReviews", "TotalClients", "IsAvailable") VALUES
(2, 'Strength Training & Weight Loss', ARRAY['NASM-CPT', 'CSCS'], 5, 'Certified personal trainer specializing in strength training', 4.8, 45, 28, true),
(4, 'Powerlifting & Muscle Building', ARRAY['CSCS', 'ISSA'], 8, 'Former competitive powerlifter', 4.9, 67, 35, true),
(7, 'CrossFit & Athletic Performance', ARRAY['CrossFit L2', 'NASM-CPT'], 7, 'CrossFit Level 2 trainer', 4.7, 52, 41, true);

-- ==========================================
-- RECEPTIONISTS (TPT Derived)
-- ==========================================
INSERT INTO receptionists ("UserId", "ShiftSchedule", "HireDate", "Department", "TotalCheckIns", "TotalPaymentsProcessed") VALUES
(9, 'Monday-Friday 9AM-5PM', '2024-01-15', 'Front Desk', 150, 75);

-- ==========================================
-- ADMINS (TPT Derived)
-- ==========================================
INSERT INTO admins ("UserId", "IsSuperAdmin") VALUES
(11, false),
(12, true);

-- ==========================================
-- SUBSCRIPTION PLANS
-- ==========================================
INSERT INTO subscription_plans ("PlanName", "Description", "Price", "DurationDays", "TokensIncluded", "Features", "MaxBookingsPerDay", "IsPopular", "IsActive", "CreatedAt", "UpdatedAt") VALUES
('Basic Monthly', 'Access to gym facilities and basic equipment', 49.99, 30, 20, '["Gym Access", "Equipment Use", "Locker Room"]', 2, false, true, NOW(), NOW()),
('Standard Monthly', 'Includes group classes and nutrition consultation', 79.99, 30, 50, '["Gym Access", "Group Classes", "Nutrition Consultation", "Progress Tracking"]', 5, true, true, NOW(), NOW()),
('Premium Monthly', 'Full access with personal training sessions', 129.99, 30, 100, '["Gym Access", "Group Classes", "Personal Training", "Nutrition Plan", "Workout Plan", "Priority Booking"]', 10, true, true, NOW(), NOW()),
('Basic Quarterly', '3-month basic membership with discount', 134.99, 90, 60, '["Gym Access", "Equipment Use", "Locker Room"]', 2, false, true, NOW(), NOW()),
('Standard Quarterly', '3-month standard membership', 214.99, 90, 150, '["Gym Access", "Group Classes", "Nutrition Consultation", "Progress Tracking"]', 5, true, true, NOW(), NOW()),
('Premium Quarterly', '3-month premium with personal training', 349.99, 90, 300, '["Gym Access", "Group Classes", "Personal Training", "Nutrition Plan", "Workout Plan", "Priority Booking"]', 10, true, true, NOW(), NOW()),
('Basic Annual', 'Full year basic membership with best value', 499.99, 365, 240, '["Gym Access", "Equipment Use", "Locker Room", "Free Guest Pass"]', 2, false, true, NOW(), NOW()),
('Standard Annual', 'Full year standard membership', 799.99, 365, 600, '["Gym Access", "Group Classes", "Nutrition Consultation", "Progress Tracking", "Free Guest Pass"]', 5, true, true, NOW(), NOW()),
('Premium Annual', 'Full year premium with all benefits', 1299.99, 365, 1200, '["Gym Access", "Group Classes", "Personal Training", "Nutrition Plan", "Workout Plan", "Priority Booking", "Free Guest Pass"]', 10, true, true, NOW(), NOW()),
('Student Monthly', 'Special student pricing with valid ID', 39.99, 30, 30, '["Gym Access", "Group Classes", "Student Lounge"]', 3, false, true, NOW(), NOW());

-- ==========================================
-- TOKEN PACKAGES
-- ==========================================
INSERT INTO token_packages ("PackageName", "TokenAmount", "Price", "BonusTokens", "Description", "IsActive", "UpdatedAt") VALUES
('Starter Pack', 50, 9.99, 0, 'Perfect for trying out AI features', true, NOW()),
('Basic Pack', 100, 17.99, 10, 'Good for casual users', true, NOW()),
('Popular Pack', 250, 39.99, 50, 'Most popular choice', true, NOW()),
('Pro Pack', 500, 69.99, 100, 'For serious fitness enthusiasts', true, NOW()),
('Ultimate Pack', 1000, 119.99, 250, 'Best value for power users', true, NOW());

-- ==========================================
-- EQUIPMENT CATEGORIES
-- ==========================================
INSERT INTO equipment_categories ("CategoryName", "Description", "Icon") VALUES
('Cardio', 'Cardiovascular training equipment', '🏃'),
('Strength', 'Free weights and strength training machines', '💪'),
('Functional', 'Functional training and CrossFit equipment', '🏋'),
('Recovery', 'Recovery and flexibility equipment', '🧘'),
('Olympic', 'Olympic weightlifting platforms and equipment', '🏅');

-- ==========================================
-- EQUIPMENT
-- ==========================================
INSERT INTO equipment ("CategoryId", "Name", "Model", "Manufacturer", "SerialNumber", "Location", "Status", "ConditionRating", "LastMaintenanceDate", "NextMaintenanceDate", "BookingCostTokens", "MaxBookingDurationMinutes", "ImageUrl", "IsActive", "CreatedAt", "UpdatedAt") VALUES
(1, 'Treadmill Pro X1', 'TX-2024', 'ProFit', 'TM-001', 'Cardio Zone A', 0, 5, '2024-10-01', '2025-01-01', 5, 60, NULL, true, NOW(), NOW()),
(1, 'Concept2 Rower', 'Model D', 'Concept2', 'ROW-001', 'Cardio Zone A', 0, 5, '2024-09-15', '2024-12-15', 4, 60, NULL, true, NOW(), NOW()),
(2, 'Squat Rack Elite', 'SR-500', 'IronMaster', 'SR-001', 'Strength Zone B', 0, 5, '2024-10-10', '2025-01-10', 8, 90, NULL, true, NOW(), NOW()),
(2, 'Bench Press Station', 'BP-300', 'IronMaster', 'BP-001', 'Strength Zone B', 0, 5, '2024-10-10', '2025-01-10', 7, 90, NULL, true, NOW(), NOW()),
(3, 'Assault Bike', 'AB-2024', 'Rogue', 'AB-001', 'Functional Zone C', 0, 5, '2024-09-20', '2024-12-20', 6, 45, NULL, true, NOW(), NOW());

-- ==========================================
-- EXERCISES
-- ==========================================
INSERT INTO exercises ("Name", "Description", "Category", "MuscleGroup", "DifficultyLevel", "EquipmentRequired", "Instructions", "VideoUrl", "CaloriesPerMinute", "IsActive", "CreatedByCoachId", "CreatedAt", "UpdatedAt") VALUES
('Barbell Squat', 'Fundamental lower body compound exercise', 'Strength', 'Legs', 'Intermediate', 'Barbell, Squat Rack', '["Stand with feet shoulder-width apart", "Bar on upper back", "Lower until thighs parallel", "Drive through heels to stand"]', 'https://videos.intellifit.com/squat', 8, true, 2, NOW(), NOW()),
('Bench Press', 'Upper body pressing exercise for chest', 'Strength', 'Chest', 'Intermediate', 'Barbell, Bench', '["Lie on bench, feet flat", "Grip bar slightly wider than shoulders", "Lower to chest", "Press up explosively"]', 'https://videos.intellifit.com/benchpress', 7, true, 4, NOW(), NOW()),
('Deadlift', 'Full body compound pulling exercise', 'Strength', 'Back', 'Advanced', 'Barbell', '["Stand with bar over mid-foot", "Grip bar, chest up", "Drive through floor", "Stand tall, squeeze glutes"]', 'https://videos.intellifit.com/deadlift', 10, true, 4, NOW(), NOW()),
('Pull-ups', 'Bodyweight back and bicep exercise', 'Bodyweight', 'Back', 'Intermediate', 'Pull-up Bar', '["Hang from bar, full extension", "Pull chest to bar", "Control descent", "Repeat"]', 'https://videos.intellifit.com/pullups', 9, true, 7, NOW(), NOW()),
('Plank', 'Core stability exercise', 'Core', 'Core', 'Beginner', 'None', '["Forearms on ground, body straight", "Engage core", "Hold position", "Breathe steadily"]', 'https://videos.intellifit.com/plank', 5, true, 7, NOW(), NOW());

-- ==========================================
-- INGREDIENTS
-- ==========================================
INSERT INTO ingredients ("Name", "Category", "CaloriesPer100g", "ProteinPer100g", "CarbsPer100g", "FatsPer100g", "IsActive") VALUES
('Chicken Breast', 'Protein', 165, 31.0, 0.0, 3.6, true),
('Brown Rice', 'Carbs', 112, 2.6, 23.5, 0.9, true),
('Broccoli', 'Vegetables', 34, 2.8, 7.0, 0.4, true),
('Salmon', 'Protein', 208, 20.0, 0.0, 13.0, true),
('Eggs', 'Protein', 155, 13.0, 1.1, 11.0, true);

-- ==========================================
-- PROGRESS MILESTONES
-- ==========================================
INSERT INTO progress_milestones ("MilestoneName", "Description", "Category", "TargetValue", "Icon", "PointsReward", "IsActive", "CreatedAt") VALUES
('First Workout', 'Complete your first workout session', 'Workout', 1, '🎯', 10, true, NOW()),
('Week Warrior', 'Complete 7 consecutive days of workouts', 'Streak', 7, '🔥', 50, true, NOW()),
('Month Champion', 'Complete 30 days of workouts', 'Streak', 30, '👑', 200, true, NOW()),
('Calorie Crusher', 'Burn 10,000 calories total', 'Calories', 10000, '💪', 100, true, NOW()),
('Goal Getter', 'Achieve your fitness goal', 'Achievement', 1, '🎉', 1000, true, NOW());

-- ==========================================
-- BOOKINGS
-- ==========================================
INSERT INTO bookings ("UserId", "EquipmentId", "CoachId", "BookingType", "StartTime", "EndTime", "Status", "TokensCost", "Notes", "CreatedAt", "UpdatedAt") VALUES
(1, 1, NULL, 'Equipment', '2024-12-02 08:00:00+00', '2024-12-02 09:00:00+00', 1, 5, 'Morning cardio session', NOW(), NOW()),
(3, 3, 2, 'Coach', '2024-12-02 10:00:00+00', '2024-12-02 11:00:00+00', 1, 15, 'Squat training with coach', NOW(), NOW()),
(5, 5, NULL, 'Equipment', '2024-12-02 14:00:00+00', '2024-12-02 15:00:00+00', 1, 6, 'HIIT workout', NOW(), NOW());

-- ==========================================
-- WORKOUT PLANS
-- ==========================================
INSERT INTO workout_plans ("UserId", "PlanName", "Description", "PlanType", "DifficultyLevel", "DurationWeeks", "Schedule", "GeneratedByCoachId", "Status", "ApprovalNotes", "ApprovedBy", "ApprovedAt", "TokensSpent", "IsActive", "StartDate", "EndDate", "CreatedAt", "UpdatedAt") VALUES
(1, 'Weight Loss Transformation', '8-week fat loss program', 'Custom', 'Intermediate', 8, '5 days per week', 2, 'Active', 'Approved - great plan', 2, '2024-10-30', 0, true, '2024-11-01', '2024-12-26', NOW(), NOW()),
(3, 'Muscle Building Program', '12-week hypertrophy training', 'Custom', 'Advanced', 12, '6 days per week', 4, 'Active', 'Excellent plan', 4, '2024-10-13', 20, true, '2024-10-15', '2025-01-07', NOW(), NOW());

-- ==========================================
-- NUTRITION PLANS
-- ==========================================
INSERT INTO nutrition_plans ("UserId", "PlanName", "Description", "PlanType", "DailyCalories", "ProteinGrams", "CarbsGrams", "FatsGrams", "GeneratedByCoachId", "Status", "ApprovalNotes", "ApprovedByCoachId", "ApprovedAt", "TokensSpent", "IsActive", "StartDate", "EndDate", "CreatedAt", "UpdatedAt") VALUES
(1, 'Weight Loss Nutrition', 'Calorie deficit plan', 'Custom', 1800, 150, 180, 50, 4, 'Active', 'Well balanced plan', 4, '2024-10-30', 0, true, '2024-11-01', '2024-12-31', NOW(), NOW()),
(3, 'Muscle Gain Diet', 'Calorie surplus for bulking', 'Custom', 2800, 200, 350, 80, 4, 'Active', 'Great for bulking', 4, '2024-10-13', 25, true, '2024-10-15', '2025-01-07', NOW(), NOW());

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL SELECT 'members', COUNT(*) FROM members
UNION ALL SELECT 'coaches', COUNT(*) FROM coaches
UNION ALL SELECT 'receptionists', COUNT(*) FROM receptionists
UNION ALL SELECT 'admins', COUNT(*) FROM admins
UNION ALL SELECT 'subscription_plans', COUNT(*) FROM subscription_plans
UNION ALL SELECT 'token_packages', COUNT(*) FROM token_packages
UNION ALL SELECT 'equipment_categories', COUNT(*) FROM equipment_categories
UNION ALL SELECT 'equipment', COUNT(*) FROM equipment
UNION ALL SELECT 'exercises', COUNT(*) FROM exercises
UNION ALL SELECT 'ingredients', COUNT(*) FROM ingredients
UNION ALL SELECT 'progress_milestones', COUNT(*) FROM progress_milestones
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'workout_plans', COUNT(*) FROM workout_plans
UNION ALL SELECT 'nutrition_plans', COUNT(*) FROM nutrition_plans
ORDER BY table_name;