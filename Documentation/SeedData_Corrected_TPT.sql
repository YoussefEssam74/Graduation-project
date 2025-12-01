-- IntelliFit Database Seed Data - PostgreSQL Version with TPT Structure
-- ==========================================
-- This file uses the NEW TPT (Table-Per-Type) structure
-- Users are inserted into base 'users' table, then specific data goes into derived tables
-- ==========================================

-- ==========================================
-- DROP ALL TABLES AND RESTART
-- ==========================================

TRUNCATE TABLE user_milestones, activity_feeds, notifications, coach_reviews, 
user_subscriptions, payments, token_transactions, inbody_measurements, 
meal_ingredients, meals, nutrition_plans, workout_templates, workout_template_exercises,
workout_logs, workout_plan_exercises, workout_plans, bookings, equipment, equipment_categories,
ai_program_generations, ai_chat_logs, ai_workflow_jobs, audit_logs, exercises, ingredients,
progress_milestones, subscription_plans, token_packages,
admins, coaches, receptionists, members, users RESTART IDENTITY CASCADE;

-- ==========================================
-- STEP 1: Insert Users (Base Table)
-- ==========================================
-- Gender: 0=Male, 1=Female, 2=Other, 3=PreferNotToSay
-- No Role column (determined by TPT derived table)
-- All passwords are BCrypt hashed "password": $2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm

INSERT INTO users ("UserId", "Email", "PasswordHash", "Name", "Phone", "DateOfBirth", "Gender", "TokenBalance", "IsActive", "EmailVerified", "CreatedAt", "UpdatedAt") VALUES
(1, 'john.doe@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'John Doe', '+1234567890', '1995-05-15', 0, 50, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'sarah.johnson@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Sarah Johnson', '+1234567891', '1990-03-22', 1, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'michael.smith@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Michael Smith', '+1234567892', '1992-08-18', 0, 75, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'emily.davis@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Emily Davis', '+1234567893', '1988-11-30', 1, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'david.wilson@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'David Wilson', '+1234567894', '1998-03-10', 0, 30, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'jessica.brown@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Jessica Brown', '+1234567895', '1996-11-05', 1, 100, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 'robert.taylor@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Robert Taylor', '+1234567896', '1985-07-14', 0, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 'lisa.anderson@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Lisa Anderson', '+1234567897', '1994-07-18', 1, 25, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 'james.martinez@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'James Martinez', '+1234567898', '1982-01-25', 0, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 'amanda.garcia@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Amanda Garcia', '+1234567899', '1997-12-08', 1, 60, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==========================================
-- STEP 2: Insert Members (TPT Derived Table)
-- ==========================================
-- Users 1, 3, 5, 6, 8, 10 are Members

INSERT INTO members ("UserId", "FitnessGoal", "MedicalConditions", "TotalWorkoutsCompleted", "TotalCaloriesBurned", "Achievements") VALUES
(1, 'Weight Loss', 'None', 15, 4500, '["First Workout"]'),
(3, 'Muscle Gain', 'Asthma', 42, 12600, '["Week Warrior", "Month Champion"]'),
(5, 'General Fitness', 'None', 8, 2400, '["First Workout"]'),
(6, 'Weight Loss', 'None', 28, 8400, '["Week Warrior"]'),
(8, 'Endurance', 'Previous knee injury', 12, 3600, '["First Workout"]'),
(10, 'Flexibility', 'None', 6, 1800, '[]');

-- ==========================================
-- STEP 3: Insert Coaches (TPT Derived Table)
-- ==========================================
-- Users 2, 4, 7 are Coaches

INSERT INTO coaches ("UserId", "Specialization", "Certifications", "ExperienceYears", "Bio", "Rating", "TotalReviews", "TotalClients", "IsAvailable") VALUES
(2, 'Strength Training & Weight Loss', ARRAY['NASM-CPT', 'CSCS'], 5, 'Certified personal trainer specializing in strength training', 4.8, 45, 28, true),
(4, 'Powerlifting & Muscle Building', ARRAY['CSCS', 'ISSA'], 8, 'Former competitive powerlifter', 4.9, 67, 35, true),
(7, 'CrossFit & Athletic Performance', ARRAY['CrossFit L2', 'NASM-CPT'], 7, 'CrossFit Level 2 trainer', 4.7, 52, 41, true);

-- ==========================================
-- STEP 4: Insert Receptionist (TPT Derived Table)
-- ==========================================
-- User 9 is Receptionist

INSERT INTO receptionists ("UserId", "ShiftSchedule", "HireDate", "Department", "TotalCheckIns", "TotalPaymentsProcessed") VALUES
(9, 'Monday-Friday 9AM-5PM', '2024-01-15', 'Front Desk', 150, 75);

-- ==========================================
-- STEP 4.5: Insert Admins (TPT Derived Table)
-- ==========================================
-- Note: We need to add admin users to the users table first
-- Adding two admin users: UserIds 11 and 12

INSERT INTO users ("UserId", "Email", "PasswordHash", "Name", "Phone", "DateOfBirth", "Gender", "TokenBalance", "IsActive", "EmailVerified", "CreatedAt", "UpdatedAt") VALUES
(11, 'admin@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Admin User', '555-0011', '1985-01-01', 0, 100, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(12, 'superadmin@intellifit.com', '$2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm', 'Super Admin', '555-0012', '1980-01-01', 0, 100, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO admins ("UserId", "IsSuperAdmin") VALUES
(11, false),
(12, true);

-- ==========================================
-- STEP 5: Subscription Plans
-- ==========================================

INSERT INTO subscription_plans ("PlanName", "Description", "Price", "DurationDays", "TokensIncluded", "Features", "MaxBookingsPerDay", "IsPopular", "IsActive", "CreatedAt", "UpdatedAt") VALUES
('Basic Monthly', 'Access to gym facilities and basic equipment', 49.99, 30, 20, '["Gym Access", "Equipment Use", "Locker Room"]', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Standard Monthly', 'Includes group classes and nutrition consultation', 79.99, 30, 50, '["Gym Access", "Group Classes", "Nutrition Consultation", "Progress Tracking"]', 5, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Premium Monthly', 'Full access with personal training sessions', 129.99, 30, 100, '["Gym Access", "Group Classes", "Personal Training", "Nutrition Plan", "Workout Plan", "Priority Booking"]', 10, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Basic Quarterly', '3-month basic membership with discount', 134.99, 90, 60, '["Gym Access", "Equipment Use", "Locker Room"]', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Standard Quarterly', '3-month standard membership', 214.99, 90, 150, '["Gym Access", "Group Classes", "Nutrition Consultation", "Progress Tracking"]', 5, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Premium Quarterly', '3-month premium with personal training', 349.99, 90, 300, '["Gym Access", "Group Classes", "Personal Training", "Nutrition Plan", "Workout Plan", "Priority Booking"]', 10, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Basic Annual', 'Full year basic membership with best value', 499.99, 365, 240, '["Gym Access", "Equipment Use", "Locker Room", "Free Guest Pass"]', 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Standard Annual', 'Full year standard membership', 799.99, 365, 600, '["Gym Access", "Group Classes", "Nutrition Consultation", "Progress Tracking", "Free Guest Pass"]', 5, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Premium Annual', 'Full year premium with all benefits', 1299.99, 365, 1200, '["Gym Access", "Group Classes", "Personal Training", "Nutrition Plan", "Workout Plan", "Priority Booking", "Free Guest Pass"]', 10, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Student Monthly', 'Special student pricing with valid ID', 39.99, 30, 30, '["Gym Access", "Group Classes", "Student Lounge"]', 3, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==========================================
-- STEP 6: Token Packages
-- ==========================================

INSERT INTO token_packages ("PackageName", "TokenAmount", "Price", "BonusTokens", "Description", "IsActive", "UpdatedAt") VALUES
('Starter Pack', 50, 9.99, 0, 'Perfect for trying out AI features', true, CURRENT_TIMESTAMP),
('Basic Pack', 100, 17.99, 10, 'Good for casual users', true, CURRENT_TIMESTAMP),
('Popular Pack', 250, 39.99, 50, 'Most popular choice', true, CURRENT_TIMESTAMP),
('Pro Pack', 500, 69.99, 100, 'For serious fitness enthusiasts', true, CURRENT_TIMESTAMP),
('Ultimate Pack', 1000, 119.99, 250, 'Best value for power users', true, CURRENT_TIMESTAMP),
('Mini Pack', 25, 4.99, 0, 'Quick top-up', true, CURRENT_TIMESTAMP),
('Monthly Bundle', 300, 44.99, 75, 'Recurring monthly tokens', true, CURRENT_TIMESTAMP),
('Quarterly Bundle', 1000, 139.99, 300, 'Best for regular users', true, CURRENT_TIMESTAMP),
('Elite Pack', 2000, 199.99, 500, 'Premium tier with maximum tokens', true, CURRENT_TIMESTAMP),
('Trial Pack', 10, 0.99, 5, 'New user trial offer', true, CURRENT_TIMESTAMP);

-- ==========================================
-- STEP 7: Equipment Categories
-- ==========================================

INSERT INTO equipment_categories ("CategoryName", "Description", "Icon") VALUES
('Cardio', 'Cardiovascular training equipment', '🏃'),
('Strength', 'Free weights and strength training machines', '💪'),
('Functional', 'Functional training and CrossFit equipment', '🏋️'),
('Recovery', 'Recovery and flexibility equipment', '🧘'),
('Olympic', 'Olympic weightlifting platforms and equipment', '🏅'),
('Cable', 'Cable machines and attachments', '🔗'),
('Bodyweight', 'Bodyweight training stations', '🤸'),
('Plyometric', 'Plyometric and explosive training equipment', '⚡'),
('Core', 'Core and ab training equipment', '🎯'),
('Specialty', 'Specialized training equipment', '⭐');

-- ==========================================
-- STEP 8: Equipment
-- ==========================================
-- Status enum: 0=Available, 1=InUse, 2=UnderMaintenance, 3=OutOfService, 4=Reserved

INSERT INTO equipment ("CategoryId", "Name", "Model", "Manufacturer", "SerialNumber", "Location", "Status", "ConditionRating", "LastMaintenanceDate", "NextMaintenanceDate", "BookingCostTokens", "MaxBookingDurationMinutes", "ImageUrl", "IsActive", "CreatedAt", "UpdatedAt") VALUES
(1, 'Treadmill Pro X1', 'TX-2024', 'ProFit', 'TM-001', 'Cardio Zone A', 0, 5, '2024-10-01', '2025-01-01', 5, 60, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 'Concept2 Rower', 'Model D', 'Concept2', 'ROW-001', 'Cardio Zone A', 0, 5, '2024-09-15', '2024-12-15', 4, 60, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Squat Rack Elite', 'SR-500', 'IronMaster', 'SR-001', 'Strength Zone B', 0, 5, '2024-10-10', '2025-01-10', 8, 90, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Bench Press Station', 'BP-300', 'IronMaster', 'BP-001', 'Strength Zone B', 1, 5, '2024-10-10', '2025-01-10', 7, 90, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Assault Bike', 'AB-2024', 'Rogue', 'AB-001', 'Functional Zone C', 0, 5, '2024-09-20', '2024-12-20', 6, 45, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Foam Roller Set', 'FR-SET', 'TriggerPoint', 'FR-001', 'Recovery Zone D', 0, 4, '2024-08-01', '2024-11-01', 2, 30, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Olympic Platform 1', 'OP-2023', 'Rogue', 'OP-001', 'Olympic Zone E', 0, 5, '2024-10-05', '2025-01-05', 10, 120, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'Cable Crossover Machine', 'CC-500', 'LifeFitness', 'CC-001', 'Cable Zone F', 2, 4, '2024-11-15', '2024-11-30', 6, 60, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 'Pull-up Station', 'PU-200', 'Rogue', 'PU-001', 'Bodyweight Zone G', 0, 5, '2024-09-10', '2024-12-10', 3, 45, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 'Plyo Box Set', 'PB-SET', 'Again Faster', 'PB-001', 'Functional Zone C', 0, 5, '2024-10-01', '2025-01-01', 4, 45, NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==========================================
-- STEP 9: Bookings
-- ==========================================
-- Status enum: 0=Pending, 1=Confirmed, 2=Cancelled, 3=Completed, 4=NoShow
-- BookingType: 'Equipment' or 'Coach'

INSERT INTO bookings ("UserId", "EquipmentId", "CoachId", "BookingType", "StartTime", "EndTime", "Status", "TokensCost", "Notes", "CreatedAt", "UpdatedAt") VALUES
(1, 1, NULL, 'Equipment', '2024-12-02 08:00:00+00', '2024-12-02 09:00:00+00', 1, 5, 'Morning cardio session', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 3, 2, 'Coach', '2024-12-02 10:00:00+00', '2024-12-02 11:00:00+00', 1, 15, 'Squat training with coach', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 5, NULL, 'Equipment', '2024-12-02 14:00:00+00', '2024-12-02 15:00:00+00', 1, 6, 'HIIT workout', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 2, NULL, 'Equipment', '2024-12-03 07:00:00+00', '2024-12-03 08:00:00+00', 1, 4, 'Rowing session', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, NULL, 7, 'Coach', '2024-12-03 17:00:00+00', '2024-12-03 18:00:00+00', 1, 20, 'Olympic lifting practice', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 9, NULL, 'Equipment', '2024-12-03 12:00:00+00', '2024-12-03 13:00:00+00', 1, 3, 'Pull-up training', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 4, 2, 'Coach', '2024-12-04 09:00:00+00', '2024-12-04 10:00:00+00', 0, 15, 'Bench press session', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 10, NULL, 'Equipment', '2024-12-04 15:00:00+00', '2024-12-04 16:00:00+00', 1, 4, 'Box jumps training', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 1, NULL, 'Equipment', '2024-11-25 18:00:00+00', '2024-11-25 19:00:00+00', 3, 5, 'Evening run completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 6, NULL, 'Equipment', '2024-11-26 11:00:00+00', '2024-11-26 12:00:00+00', 2, 6, 'Schedule conflict', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==========================================
-- STEP 10: Exercises
-- ==========================================

INSERT INTO exercises ("Name", "Description", "Category", "MuscleGroup", "DifficultyLevel", "EquipmentRequired", "Instructions", "VideoUrl", "CaloriesPerMinute", "IsActive", "CreatedByCoachId", "CreatedAt", "UpdatedAt") VALUES
('Barbell Squat', 'Fundamental lower body compound exercise', 'Strength', 'Legs', 'Intermediate', 'Barbell, Squat Rack', '["Stand with feet shoulder-width apart", "Bar on upper back", "Lower until thighs parallel", "Drive through heels to stand"]', 'https://videos.intellifit.com/squat', 8, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Bench Press', 'Upper body pressing exercise for chest', 'Strength', 'Chest', 'Intermediate', 'Barbell, Bench', '["Lie on bench, feet flat", "Grip bar slightly wider than shoulders", "Lower to chest", "Press up explosively"]', 'https://videos.intellifit.com/benchpress', 7, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Deadlift', 'Full body compound pulling exercise', 'Strength', 'Back', 'Advanced', 'Barbell', '["Stand with bar over mid-foot", "Grip bar, chest up", "Drive through floor", "Stand tall, squeeze glutes"]', 'https://videos.intellifit.com/deadlift', 10, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Pull-ups', 'Bodyweight back and bicep exercise', 'Bodyweight', 'Back', 'Intermediate', 'Pull-up Bar', '["Hang from bar, full extension", "Pull chest to bar", "Control descent", "Repeat"]', 'https://videos.intellifit.com/pullups', 9, true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Shoulder Press', 'Overhead pressing for shoulders', 'Strength', 'Shoulders', 'Beginner', 'Dumbbells', '["Stand or sit, dumbbells at shoulders", "Press overhead", "Lower with control", "Repeat"]', 'https://videos.intellifit.com/shoulderpress', 6, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Plank', 'Core stability exercise', 'Core', 'Core', 'Beginner', 'None', '["Forearms on ground, body straight", "Engage core", "Hold position", "Breathe steadily"]', 'https://videos.intellifit.com/plank', 5, true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Lunges', 'Unilateral leg exercise', 'Strength', 'Legs', 'Beginner', 'Dumbbells (optional)', '["Step forward into lunge", "Lower back knee toward ground", "Push back to start", "Alternate legs"]', 'https://videos.intellifit.com/lunges', 7, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Bent Over Row', 'Back thickness builder', 'Strength', 'Back', 'Intermediate', 'Barbell', '["Hinge at hips, back straight", "Pull bar to lower chest", "Squeeze shoulder blades", "Lower with control"]', 'https://videos.intellifit.com/row', 8, true, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Bicep Curl', 'Isolation exercise for biceps', 'Isolation', 'Arms', 'Beginner', 'Dumbbells', '["Stand with dumbbells at sides", "Curl up, keeping elbows stationary", "Squeeze at top", "Lower slowly"]', 'https://videos.intellifit.com/curl', 4, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Tricep Dips', 'Bodyweight tricep exercise', 'Bodyweight', 'Arms', 'Intermediate', 'Dip Station', '["Support body on bars", "Lower by bending elbows", "Press back to start", "Keep core tight"]', 'https://videos.intellifit.com/dips', 6, true, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==========================================
-- STEP 11: Ingredients
-- ==========================================

INSERT INTO ingredients ("Name", "Category", "CaloriesPer100g", "ProteinPer100g", "CarbsPer100g", "FatsPer100g", "IsActive") VALUES
('Chicken Breast', 'Protein', 165, 31.0, 0.0, 3.6, true),
('Brown Rice', 'Carbs', 112, 2.6, 23.5, 0.9, true),
('Broccoli', 'Vegetables', 34, 2.8, 7.0, 0.4, true),
('Salmon', 'Protein', 208, 20.0, 0.0, 13.0, true),
('Sweet Potato', 'Carbs', 86, 1.6, 20.0, 0.1, true),
('Eggs', 'Protein', 155, 13.0, 1.1, 11.0, true),
('Oatmeal', 'Carbs', 389, 16.9, 66.3, 6.9, true),
('Almonds', 'Fats', 579, 21.0, 22.0, 50.0, true),
('Greek Yogurt', 'Protein', 59, 10.0, 3.6, 0.4, true),
('Spinach', 'Vegetables', 23, 2.9, 3.6, 0.4, true);

-- ==========================================
-- STEP 12: Progress Milestones
-- ==========================================

INSERT INTO progress_milestones ("MilestoneName", "Description", "Category", "TargetValue", "Icon", "PointsReward", "IsActive", "CreatedAt") VALUES
('First Workout', 'Complete your first workout session', 'Workout', 1, '🎯', 10, true, CURRENT_TIMESTAMP),
('Week Warrior', 'Complete 7 consecutive days of workouts', 'Streak', 7, '🔥', 50, true, CURRENT_TIMESTAMP),
('Month Champion', 'Complete 30 days of workouts', 'Streak', 30, '👑', 200, true, CURRENT_TIMESTAMP),
('Calorie Crusher', 'Burn 10,000 calories total', 'Calories', 10000, '💪', 100, true, CURRENT_TIMESTAMP),
('Early Bird', 'Complete 10 morning workouts', 'Workout', 10, '🌅', 75, true, CURRENT_TIMESTAMP),
('Strength Beast', 'Complete 50 strength training sessions', 'Workout', 50, '🏋️', 150, true, CURRENT_TIMESTAMP),
('Cardio King', 'Complete 50 cardio sessions', 'Workout', 50, '🏃', 150, true, CURRENT_TIMESTAMP),
('Consistency Master', 'Workout 100 times', 'Workout', 100, '⭐', 500, true, CURRENT_TIMESTAMP),
('Team Player', 'Attend 20 group classes', 'Social', 20, '🤝', 100, true, CURRENT_TIMESTAMP),
('Goal Getter', 'Achieve your fitness goal', 'Achievement', 1, '🎉', 1000, true, CURRENT_TIMESTAMP);

-- ==========================================
-- Verification Query
-- ==========================================

SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 'members', COUNT(*) FROM members
UNION ALL SELECT 'coaches', COUNT(*) FROM coaches
UNION ALL SELECT 'receptionists', COUNT(*) FROM receptionists
UNION ALL SELECT 'subscription_plans', COUNT(*) FROM subscription_plans
UNION ALL SELECT 'token_packages', COUNT(*) FROM token_packages
UNION ALL SELECT 'equipment_categories', COUNT(*) FROM equipment_categories
UNION ALL SELECT 'equipment', COUNT(*) FROM equipment
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'exercises', COUNT(*) FROM exercises
UNION ALL SELECT 'ingredients', COUNT(*) FROM ingredients
UNION ALL SELECT 'progress_milestones', COUNT(*) FROM progress_milestones
ORDER BY table_name;
