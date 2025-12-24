-- Active: 1764278759643@@127.0.0.1@5432@intellifit_db
-- IntelliFit Database Complete Seed Data - PostgreSQL
-- ==========================================
-- Password for admin@intellifit.com: 224466 (BCrypt hashed)
-- Password for all other test accounts: password (BCrypt hashed)
-- ==========================================

-- ==========================================
-- TRUNCATE ALL TABLES
-- ==========================================
TRUNCATE TABLE user_milestones, activity_feeds, notifications, coach_reviews, 
user_subscriptions, payments, token_transactions, inbody_measurements, 
meal_ingredients, meals, nutrition_plans, workout_templates, workout_template_exercises,
workout_logs, workout_plan_exercises, workout_plans, 
coach_session_equipments, equipment_time_slots, bookings, 
equipment, equipment_categories,
ai_program_generations, ai_chat_logs, ai_workflow_jobs, chat_messages, audit_logs, exercises, ingredients,
progress_milestones, subscription_plans, token_packages,
member_profiles, coach_profiles, users RESTART IDENTITY CASCADE;

TRUNCATE TABLE "users" RESTART IDENTITY CASCADE;
-- ==========================================
-- USERS (Main Table - Single table with Role column)
-- Note: UserId is auto-generated. Role determines user type (Member, Coach, Admin)
-- Focus users: member@intellifit.com (1), sarah.johnson@intellifit.com (7), reception@intellifit.com (10), admin@intellifit.com (11)
-- ==========================================
INSERT INTO users ("Email", "PasswordHash", "Name", "Phone", "DateOfBirth", "Gender", "Role", "ProfileImageUrl", "Address", "EmergencyContactName", "EmergencyContactPhone", "TokenBalance", "IsActive", "EmailVerified", "MustChangePassword", "IsFirstLogin", "LastLoginAt", "CreatedAt", "UpdatedAt") VALUES
-- Members (UserId: 1-6)
('member@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'John Doe', '+1234567890', '1995-05-15', 0, 'Member', NULL, '123 Main St, New York, NY 10001', 'Jane Doe', '+1234567800', 100, true, true, false, false, NULL, NOW(), NOW()),
('michael.smith@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Michael Smith', '+1234567892', '1992-08-18', 0, 'Member', NULL, '789 Pine Rd, Queens, NY 11354', 'Emma Smith', '+1234567802', 75, true, true, false, false, NULL, NOW(), NOW()),
('david.wilson@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'David Wilson', '+1234567894', '1998-03-10', 0, 'Member', NULL, '654 Maple Dr, Bronx, NY 10451', 'Lisa Wilson', '+1234567804', 30, true, true, false, false, NULL, NOW(), NOW()),
('jessica.brown@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Jessica Brown', '+1234567895', '1996-11-05', 1, 'Member', NULL, '987 Cedar Ln, Staten Island, NY 10301', 'James Brown', '+1234567805', 100, true, true, false, false, NULL, NOW(), NOW()),
('lisa.anderson@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Lisa Anderson', '+1234567897', '1994-07-18', 1, 'Member', NULL, '258 Spruce Way, White Plains, NY 10601', 'John Anderson', '+1234567807', 25, true, true, false, false, NULL, NOW(), NOW()),
('amanda.garcia@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Amanda Garcia', '+1234567899', '1997-12-08', 1, 'Member', NULL, '741 Ash Pl, New Rochelle, NY 10801', 'Carlos Garcia', '+1234567809', 60, true, true, false, false, NULL, NOW(), NOW()),
-- Coaches (UserId: 7-9)
('sarah.johnson@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Sarah Johnson', '+1234567891', '1990-03-22', 1, 'Coach', NULL, '456 Oak Ave, Brooklyn, NY 11201', 'Mike Johnson', '+1234567801', 0, true, true, false, false, NULL, NOW(), NOW()),
('emily.davis@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Emily Davis', '+1234567893', '1988-11-30', 1, 'Coach', NULL, '321 Elm St, Manhattan, NY 10002', 'Tom Davis', '+1234567803', 0, true, true, false, false, NULL, NOW(), NOW()),
('robert.taylor@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Robert Taylor', '+1234567896', '1985-07-14', 0, 'Coach', NULL, '147 Birch St, Long Island, NY 11530', 'Mary Taylor', '+1234567806', 0, true, true, false, false, NULL, NOW(), NOW()),
-- Receptionists (UserId: 10)
('reception@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Michael Smith', '+1234567892', '1992-08-18', 0, 'Receptionist', NULL, '789 Pine Rd, Queens, NY 11354', 'Emma Smith', '+1234567802', 75, true, true, false, false, NULL, NOW(), NOW()),
-- Admin (UserId: 11) - Password: 224466
('admin@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Admin User', '+1234567810', '1985-01-01', 0, 'Admin', NULL, 'IntelliFit HQ, NY', NULL, NULL, 100, true, true, false, false, NULL, NOW(), NOW());

-- ==========================================
-- SUBSCRIPTION PLANS (Must be inserted BEFORE members due to FK constraint)
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
-- MEMBER PROFILES (Role-specific data for Members)
-- Focus on member@intellifit.com (UserId: 1)
-- ==========================================
INSERT INTO member_profiles ("UserId", "FitnessGoal", "MedicalConditions", "Allergies", "FitnessLevel", "PreferredWorkoutTime", "SubscriptionPlanId", "MembershipStartDate", "MembershipEndDate", "CurrentWeight", "TargetWeight", "Height", "TotalWorkoutsCompleted", "TotalCaloriesBurned", "Achievements", "CreatedAt", "UpdatedAt") VALUES
(1, 'Weight Loss', 'None', 'None', 'Intermediate', 'Morning', 3, '2024-11-01', '2025-12-01', 85.5, 75.0, 175.0, 15, 4500, '["First Workout", "Week Warrior"]', NOW(), NOW()),
(2, 'Muscle Gain', 'Asthma', 'Peanuts', 'Advanced', 'Evening', 3, '2024-10-15', '2024-11-15', 78.5, 85.0, 180.0, 42, 12600, '["Week Warrior", "Month Champion"]', NOW(), NOW()),
(3, 'General Fitness', 'None', 'None', 'Beginner', 'Afternoon', 1, '2024-11-10', '2024-12-10', 70.0, 70.0, 170.0, 8, 2400, '["First Workout"]', NOW(), NOW()),
(4, 'Weight Loss', 'None', 'Lactose', 'Intermediate', 'Morning', 2, '2024-10-20', '2024-11-20', 92.0, 80.0, 165.0, 28, 8400, '["Week Warrior"]', NOW(), NOW()),
(5, 'Endurance', 'Previous knee injury', 'None', 'Intermediate', 'Evening', NULL, NULL, NULL, 75.0, 72.0, 178.0, 12, 3600, '["First Workout"]', NOW(), NOW()),
(6, 'Flexibility', 'None', 'Shellfish', 'Beginner', 'Morning', NULL, NULL, NULL, 65.0, 65.0, 168.0, 6, 1800, '[]', NOW(), NOW());

-- ==========================================
-- COACH PROFILES (Role-specific data for Coaches)
-- Focus on sarah.johnson@intellifit.com (UserId: 7, CoachProfileId: 1)
-- ==========================================
INSERT INTO coach_profiles ("UserId", "Specialization", "Certifications", "ExperienceYears", "Bio", "HourlyRate", "Rating", "TotalReviews", "TotalClients", "AvailabilitySchedule", "IsAvailable", "CreatedAt", "UpdatedAt") VALUES
(7, 'Strength Training & Weight Loss', ARRAY['NASM-CPT', 'CSCS'], 5, 'Certified personal trainer specializing in strength training', 75.00, 4.8, 45, 28, 'Mon-Fri: 6AM-8PM, Sat: 8AM-2PM', true, NOW(), NOW()),
(8, 'Powerlifting & Muscle Building', ARRAY['CSCS', 'ISSA'], 8, 'Former competitive powerlifter', 95.00, 4.9, 67, 35, 'Mon-Fri: 7AM-9PM, Sat-Sun: 8AM-4PM', true, NOW(), NOW()),
(9, 'CrossFit & Athletic Performance', ARRAY['CrossFit L2', 'NASM-CPT'], 7, 'CrossFit Level 2 trainer', 85.00, 4.7, 52, 41, 'Mon-Sat: 5AM-7PM', true, NOW(), NOW());

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
-- EQUIPMENT (EquipmentId: 1-10)
-- ==========================================
INSERT INTO equipment ("CategoryId", "Name", "Model", "Manufacturer", "SerialNumber", "Location", "Status", "ConditionRating", "LastMaintenanceDate", "NextMaintenanceDate", "BookingCostTokens", "MaxBookingDurationMinutes", "ImageUrl", "IsActive", "CreatedAt", "UpdatedAt") VALUES
(1, 'Treadmill Pro X1', 'TX-2024', 'ProFit', 'TM-001', 'Cardio Zone A', 0, 5, '2024-10-01', '2025-01-01', 5, 60, NULL, true, NOW(), NOW()),
(1, 'Concept2 Rower', 'Model D', 'Concept2', 'ROW-001', 'Cardio Zone A', 0, 5, '2024-09-15', '2024-12-15', 4, 60, NULL, true, NOW(), NOW()),
(2, 'Squat Rack Elite', 'SR-500', 'IronMaster', 'SR-001', 'Strength Zone B', 0, 5, '2024-10-10', '2025-01-10', 8, 90, NULL, true, NOW(), NOW()),
(2, 'Bench Press Station', 'BP-300', 'IronMaster', 'BP-001', 'Strength Zone B', 0, 5, '2024-10-10', '2025-01-10', 7, 90, NULL, true, NOW(), NOW()),
(3, 'Assault Bike', 'AB-2024', 'Rogue', 'AB-001', 'Functional Zone C', 0, 5, '2024-09-20', '2024-12-20', 6, 45, NULL, true, NOW(), NOW()),
(2, 'Cable Machine', 'CM-Pro', 'Life Fitness', 'CM-001', 'Strength Zone B', 0, 5, '2024-10-15', '2025-01-15', 5, 60, NULL, true, NOW(), NOW()),
(3, 'Pull-Up Station', 'PU-100', 'Rogue', 'PU-001', 'Functional Zone C', 0, 5, '2024-10-01', '2025-01-01', 3, 45, NULL, true, NOW(), NOW()),
(5, 'Olympic Platform', 'OP-Elite', 'Eleiko', 'OP-001', 'Olympic Zone D', 0, 5, '2024-10-20', '2025-01-20', 10, 120, NULL, true, NOW(), NOW()),
(5, 'Barbell Set (Olympic)', 'OB-20kg', 'Eleiko', 'OB-001', 'Olympic Zone D', 0, 5, '2024-10-20', '2025-01-20', 8, 90, NULL, true, NOW(), NOW()),
(4, 'Foam Roller Station', 'FR-200', 'TriggerPoint', 'FR-001', 'Recovery Zone E', 0, 5, '2024-09-01', '2024-12-01', 2, 30, NULL, true, NOW(), NOW());

-- ==========================================
-- EXERCISES (With EquipmentId linking exercises to equipment)
-- ExerciseId: 1-10, EquipmentId references equipment table above
-- ==========================================
INSERT INTO exercises ("Name", "Description", "Category", "MuscleGroup", "DifficultyLevel", "EquipmentRequired", "EquipmentId", "Instructions", "VideoUrl", "CaloriesPerMinute", "IsActive", "CreatedByCoachId", "CreatedAt", "UpdatedAt") VALUES
('Barbell Squat', 'Fundamental lower body compound exercise', 'Strength', 'Legs', 'Intermediate', 'Barbell, Squat Rack', 3, '["Stand with feet shoulder-width apart", "Bar on upper back", "Lower until thighs parallel", "Drive through heels to stand"]', 'https://videos.intellifit.com/squat', 8, true, 1, NOW(), NOW()),
('Bench Press', 'Upper body pressing exercise for chest', 'Strength', 'Chest', 'Intermediate', 'Barbell, Bench', 4, '["Lie on bench, feet flat", "Grip bar slightly wider than shoulders", "Lower to chest", "Press up explosively"]', 'https://videos.intellifit.com/benchpress', 7, true, 2, NOW(), NOW()),
('Deadlift', 'Full body compound pulling exercise', 'Strength', 'Back', 'Advanced', 'Barbell', 8, '["Stand with bar over mid-foot", "Grip bar, chest up", "Drive through floor", "Stand tall, squeeze glutes"]', 'https://videos.intellifit.com/deadlift', 10, true, 2, NOW(), NOW()),
('Pull-ups', 'Bodyweight back and bicep exercise', 'Bodyweight', 'Back', 'Intermediate', 'Pull-up Bar', 7, '["Hang from bar, full extension", "Pull chest to bar", "Control descent", "Repeat"]', 'https://videos.intellifit.com/pullups', 9, true, 3, NOW(), NOW()),
('Plank', 'Core stability exercise', 'Core', 'Core', 'Beginner', 'None', NULL, '["Forearms on ground, body straight", "Engage core", "Hold position", "Breathe steadily"]', 'https://videos.intellifit.com/plank', 5, true, 3, NOW(), NOW()),
('Treadmill Run', 'Cardiovascular running exercise', 'Cardio', 'Full Body', 'Beginner', 'Treadmill', 1, '["Start at walking pace", "Gradually increase speed", "Maintain proper form", "Cool down slowly"]', 'https://videos.intellifit.com/treadmill', 12, true, 1, NOW(), NOW()),
('Rowing', 'Full body cardiovascular exercise', 'Cardio', 'Full Body', 'Intermediate', 'Rowing Machine', 2, '["Secure feet in straps", "Push with legs first", "Pull handle to chest", "Return with control"]', 'https://videos.intellifit.com/rowing', 11, true, 2, NOW(), NOW()),
('Cable Fly', 'Isolation chest exercise', 'Strength', 'Chest', 'Intermediate', 'Cable Machine', 6, '["Stand between cables", "Arms extended to sides", "Bring hands together", "Control return"]', 'https://videos.intellifit.com/cablefly', 6, true, 1, NOW(), NOW()),
('Assault Bike Sprint', 'High intensity cardio intervals', 'Cardio', 'Full Body', 'Advanced', 'Assault Bike', 5, '["Adjust seat height", "Sprint for 20 seconds", "Rest for 10 seconds", "Repeat for sets"]', 'https://videos.intellifit.com/assaultbike', 15, true, 3, NOW(), NOW()),
('Foam Rolling', 'Muscle recovery and mobility', 'Recovery', 'Full Body', 'Beginner', 'Foam Roller', 10, '["Place target muscle on roller", "Roll slowly back and forth", "Pause on tight spots", "Breathe deeply"]', 'https://videos.intellifit.com/foamrolling', 2, true, 2, NOW(), NOW());

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
-- WORKOUT PLANS (For member@intellifit.com UserId: 1, Coach Sarah UserId: 7 = CoachProfileId: 1)
-- ==========================================
INSERT INTO workout_plans ("UserId", "PlanName", "Description", "PlanType", "DifficultyLevel", "DurationWeeks", "Schedule", "GeneratedByCoachId", "Status", "ApprovalNotes", "ApprovedBy", "ApprovedAt", "TokensSpent", "IsActive", "StartDate", "EndDate", "CreatedAt", "UpdatedAt") VALUES
(1, 'Weight Loss Transformation', '8-week fat loss program focusing on compound movements', 'Custom', 'Intermediate', 8, '5 days per week', 1, 'Approved', 'Approved - great plan for weight loss', 1, '2024-10-30', 0, true, '2024-11-01', '2024-12-26', NOW(), NOW()),
(2, 'Muscle Building Program', '12-week hypertrophy training', 'Custom', 'Advanced', 12, '6 days per week', 2, 'Active', 'Excellent plan', 2, '2024-10-13', 20, true, '2024-10-15', '2025-01-07', NOW(), NOW()),
(3, 'AI Generated Strength Plan', 'AI-generated 10-week strength training program', 'Custom', 'Intermediate', 10, '4 days per week', NULL, 'PendingApproval', NULL, NULL, NULL, 30, true, '2024-12-01', '2025-02-09', NOW(), NOW());

-- ==========================================
-- NUTRITION PLANS
-- ==========================================
INSERT INTO nutrition_plans ("UserId", "PlanName", "Description", "PlanType", "DailyCalories", "ProteinGrams", "CarbsGrams", "FatsGrams", "GeneratedByCoachId", "Status", "ApprovalNotes", "ApprovedByCoachId", "ApprovedAt", "TokensSpent", "IsActive", "StartDate", "EndDate", "CreatedAt", "UpdatedAt") VALUES
(1, 'Weight Loss Nutrition', 'Calorie deficit plan', 'Custom', 1800, 150, 180, 50, 2, 'Active', 'Well balanced plan', 2, '2024-10-30', 0, true, '2024-11-01', '2024-12-31', NOW(), NOW()),
(2, 'Muscle Gain Diet', 'Calorie surplus for bulking', 'Custom', 2800, 200, 350, 80, 2, 'Active', 'Great for bulking', 2, '2024-10-13', 25, true, '2024-10-15', '2025-01-07', NOW(), NOW());

-- ==========================================
-- MEALS
-- ==========================================
INSERT INTO meals ("NutritionPlanId", "MealType", "Name", "Calories", "ProteinGrams", "CarbsGrams", "FatsGrams", "RecommendedTime", "CreatedByCoachId", "CreatedAt") VALUES
(1, 'Lunch', 'Grilled Chicken with Rice', 450, 45, 50, 8, '12:00:00'::interval, 2, NOW()),
(1, 'Breakfast', 'Greek Yogurt Parfait', 280, 25, 35, 6, '08:00:00'::interval, 2, NOW()),
(2, 'Dinner', 'Salmon Power Bowl', 650, 55, 60, 22, '19:00:00'::interval, 2, NOW()),
(2, 'Breakfast', 'Protein Pancakes', 520, 38, 65, 12, '08:00:00'::interval, 2, NOW());

-- ==========================================
-- MEAL INGREDIENTS
-- ==========================================
INSERT INTO meal_ingredients ("MealId", "IngredientId", "Quantity", "Unit") VALUES
(1, 1, 200, 'g'),
(1, 2, 150, 'g'),
(1, 3, 100, 'g'),
(2, 5, 2, 'whole'),
(3, 4, 180, 'g'),
(4, 1, 150, 'g');

-- ==========================================
-- WORKOUT TEMPLATES
-- ==========================================
INSERT INTO workout_templates ("CreatedByCoachId", "TemplateName", "Description", "DifficultyLevel", "DurationWeeks", "WorkoutsPerWeek", "IsPublic", "IsActive", "CreatedAt", "UpdatedAt") VALUES
(1, 'Push Day - Upper Body', 'Chest, shoulders, and triceps workout', 'Intermediate', 4, 3, true, true, NOW(), NOW()),
(2, 'Pull Day - Back & Biceps', 'Back and bicep focused training', 'Intermediate', 4, 3, true, true, NOW(), NOW()),
(2, 'Leg Day Hypertrophy', 'Complete lower body workout', 'Advanced', 6, 4, true, true, NOW(), NOW());

-- ==========================================
-- WORKOUT TEMPLATE EXERCISES
-- ==========================================
INSERT INTO workout_template_exercises ("TemplateId", "ExerciseId", "WeekNumber", "DayNumber", "OrderInDay", "Sets", "Reps", "RestSeconds", "Notes", "CreatedAt") VALUES
(1, 2, 1, 1, 1, 4, 8, 120, 'Focus on controlled descent', NOW()),
(1, 1, 1, 1, 2, 4, 10, 90, 'Go deep on squats', NOW()),
(2, 3, 1, 1, 1, 4, 5, 180, 'Heavy weight, perfect form', NOW()),
(2, 4, 1, 1, 2, 3, 10, 60, 'Controlled tempo', NOW()),
(3, 1, 1, 1, 1, 5, 8, 150, 'Main compound movement', NOW());

-- ==========================================
-- WORKOUT PLAN EXERCISES (Used for auto-booking equipment in coach sessions)
-- Exercises linked to equipment for member@intellifit.com (UserId: 1, WorkoutPlanId: 1)
-- ==========================================
INSERT INTO workout_plan_exercises ("WorkoutPlanId", "ExerciseId", "DayNumber", "OrderInDay", "Sets", "Reps", "RestSeconds", "Notes", "CreatedAt") VALUES
-- Plan 1 Day 1: Squat (EquipmentId: 3), Bench (EquipmentId: 4), Plank (no equipment)
(1, 1, 1, 1, 4, 10, 90, 'Warm up properly - Barbell Squat', NOW()),
(1, 2, 1, 2, 3, 12, 60, 'Focus on form - Bench Press', NOW()),
(1, 5, 1, 3, 3, 60, 45, 'Core finisher - Plank', NOW()),
-- Plan 1 Day 2: Treadmill (EquipmentId: 1), Rowing (EquipmentId: 2)
(1, 6, 2, 1, 1, 30, 0, 'Cardio - 30 min treadmill run', NOW()),
(1, 7, 2, 2, 1, 20, 0, 'Cardio - 20 min rowing', NOW()),
-- Plan 1 Day 3: Deadlift (EquipmentId: 8), Pull-ups (EquipmentId: 7), Cable Fly (EquipmentId: 6)
(1, 3, 3, 1, 4, 8, 120, 'Heavy deadlifts', NOW()),
(1, 4, 3, 2, 3, 10, 60, 'Pull-ups for back', NOW()),
(1, 8, 3, 3, 3, 12, 45, 'Cable flies for chest', NOW()),
-- Plan 2
(2, 3, 1, 1, 5, 5, 180, 'Heavy day', NOW()),
(2, 1, 2, 1, 4, 8, 120, 'Volume day', NOW());

-- ==========================================
-- WORKOUT LOGS
-- ==========================================
INSERT INTO workout_logs ("UserId", "PlanId", "WorkoutDate", "ExercisesCompleted", "DurationMinutes", "CaloriesBurned", "FeelingRating", "Notes", "Completed", "CreatedAt") VALUES
(1, 1, '2024-11-15 09:00:00+00', 8, 45, 320, 4, 'Great session, felt strong', true, NOW()),
(1, 1, '2024-11-17 09:00:00+00', 8, 48, 340, 5, 'Personal best on squats!', true, NOW()),
(1, 1, '2024-11-20 09:00:00+00', 7, 42, 310, 3, 'Bit tired today', true, NOW()),
(3, 2, '2024-10-20 18:00:00+00', 10, 75, 580, 5, 'Excellent training day', true, NOW()),
(3, 2, '2024-10-22 18:00:00+00', 10, 78, 600, 5, 'Hit new PR on deadlift', true, NOW());

-- ==========================================
-- INBODY MEASUREMENTS
-- ==========================================
INSERT INTO inbody_measurements ("UserId", "MeasurementDate", "Weight", "BodyFatPercentage", "MuscleMass", "VisceralFatLevel", "BodyWaterPercentage", "BoneMass", "Bmr", "Notes", "CreatedAt") VALUES
(1, '2024-11-01', 85.5, 22.5, 62.8, 8, 58.2, 3.2, 1820, 'Baseline measurement', NOW()),
(1, '2024-11-15', 83.2, 20.8, 63.1, 7, 59.1, 3.2, 1830, 'Good progress', NOW()),
(1, '2024-11-29', 81.5, 19.5, 63.5, 6, 60.0, 3.2, 1840, 'Excellent results', NOW()),
(3, '2024-10-15', 78.5, 12.5, 66.2, 3, 62.5, 3.4, 1950, 'Starting bulk', NOW()),
(3, '2024-11-01', 80.8, 13.2, 68.5, 3, 62.0, 3.4, 1980, 'Gaining well', NOW());

-- ==========================================
-- BOOKINGS (With new columns: IsAutoBookedForCoachSession, ParentCoachBookingId, IsAiGenerated)
-- Focus: member@intellifit.com (UserId: 1), sarah.johnson@intellifit.com (CoachProfileId: 1)
-- ==========================================
INSERT INTO bookings ("UserId", "EquipmentId", "CoachId", "BookingType", "StartTime", "EndTime", "Status", "TokensCost", "Notes", "IsAutoBookedForCoachSession", "ParentCoachBookingId", "IsAiGenerated", "CreatedAt", "UpdatedAt") VALUES
-- Booking 1: Manual equipment booking by member (no coach session)
(1, 1, NULL, 'Equipment', '2025-12-21 08:00:00+00', '2025-12-21 09:00:00+00', 1, 5, 'Morning cardio session - Treadmill', false, NULL, false, NOW(), NOW()),
-- Booking 2: Coach session with Sarah (CoachProfileId: 1)
(1, NULL, 1, 'Session', '2025-12-22 10:00:00+00', '2025-12-22 11:00:00+00', 1, 75, 'Personal Training with Coach Sarah - Day 1 exercises', false, NULL, false, NOW(), NOW()),
-- Bookings 3-5: Auto-booked equipment for coach session 2 (Day 1: Squat Rack, Bench Press Station)
(1, 3, NULL, 'Equipment', '2025-12-22 10:00:00+00', '2025-12-22 11:00:00+00', 1, 0, 'Auto-booked for coach session #2 - Squat Rack', true, 2, false, NOW(), NOW()),
(1, 4, NULL, 'Equipment', '2025-12-22 10:00:00+00', '2025-12-22 11:00:00+00', 1, 0, 'Auto-booked for coach session #2 - Bench Press', true, 2, false, NOW(), NOW()),
-- Booking 5: Another coach session for testing
(1, NULL, 1, 'Session', '2025-12-23 14:00:00+00', '2025-12-23 15:00:00+00', 1, 75, 'Personal Training with Coach Sarah - Day 2 exercises', false, NULL, false, NOW(), NOW()),
-- Bookings 6-7: Auto-booked equipment for coach session 5 (Day 2: Treadmill, Rower)
(1, 1, NULL, 'Equipment', '2025-12-23 14:00:00+00', '2025-12-23 15:00:00+00', 1, 0, 'Auto-booked for coach session #5 - Treadmill', true, 5, false, NOW(), NOW()),
(1, 2, NULL, 'Equipment', '2025-12-23 14:00:00+00', '2025-12-23 15:00:00+00', 1, 0, 'Auto-booked for coach session #5 - Rower', true, 5, false, NOW(), NOW()),
-- Booking 8: Manual equipment booking by another member
(3, 5, NULL, 'Equipment', '2025-12-22 14:00:00+00', '2025-12-22 15:00:00+00', 1, 6, 'HIIT workout - Assault Bike', false, NULL, false, NOW(), NOW());

-- ==========================================
-- EQUIPMENT TIME SLOTS (For testing availability - focusing on today and tomorrow)
-- Slots for EquipmentId: 1 (Treadmill), 3 (Squat Rack), 4 (Bench Press)
-- ==========================================
INSERT INTO equipment_time_slots ("EquipmentId", "SlotDate", "StartTime", "EndTime", "IsBooked", "BookedByUserId", "BookingId", "IsCoachSession", "CreatedAt", "BookedAt") VALUES
-- Treadmill slots for 2025-12-21
(1, '2025-12-21', '06:00:00'::interval, '07:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(1, '2025-12-21', '07:00:00'::interval, '08:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(1, '2025-12-21', '08:00:00'::interval, '09:00:00'::interval, true, 1, 1, false, NOW(), NOW()),
(1, '2025-12-21', '09:00:00'::interval, '10:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(1, '2025-12-21', '10:00:00'::interval, '11:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(1, '2025-12-21', '11:00:00'::interval, '12:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(1, '2025-12-21', '12:00:00'::interval, '13:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(1, '2025-12-21', '13:00:00'::interval, '14:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(1, '2025-12-21', '14:00:00'::interval, '15:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(1, '2025-12-21', '15:00:00'::interval, '16:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(1, '2025-12-21', '16:00:00'::interval, '17:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(1, '2025-12-21', '17:00:00'::interval, '18:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(1, '2025-12-21', '18:00:00'::interval, '19:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(1, '2025-12-21', '19:00:00'::interval, '20:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(1, '2025-12-21', '20:00:00'::interval, '21:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(1, '2025-12-21', '21:00:00'::interval, '22:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
-- Squat Rack slots for 2025-12-22
(3, '2025-12-22', '06:00:00'::interval, '07:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(3, '2025-12-22', '07:00:00'::interval, '08:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(3, '2025-12-22', '08:00:00'::interval, '09:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(3, '2025-12-22', '09:00:00'::interval, '10:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(3, '2025-12-22', '10:00:00'::interval, '11:00:00'::interval, true, 1, 3, true, NOW(), NOW()),
(3, '2025-12-22', '11:00:00'::interval, '12:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(3, '2025-12-22', '12:00:00'::interval, '13:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(3, '2025-12-22', '13:00:00'::interval, '14:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(3, '2025-12-22', '14:00:00'::interval, '15:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(3, '2025-12-22', '15:00:00'::interval, '16:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
-- Bench Press slots for 2025-12-22
(4, '2025-12-22', '06:00:00'::interval, '07:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(4, '2025-12-22', '07:00:00'::interval, '08:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(4, '2025-12-22', '08:00:00'::interval, '09:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(4, '2025-12-22', '09:00:00'::interval, '10:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(4, '2025-12-22', '10:00:00'::interval, '11:00:00'::interval, true, 1, 4, true, NOW(), NOW()),
(4, '2025-12-22', '11:00:00'::interval, '12:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(4, '2025-12-22', '12:00:00'::interval, '13:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(4, '2025-12-22', '13:00:00'::interval, '14:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(4, '2025-12-22', '14:00:00'::interval, '15:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(4, '2025-12-22', '15:00:00'::interval, '16:00:00'::interval, false, NULL, NULL, false, NOW(), NULL);

-- ==========================================
-- COACH SESSION EQUIPMENTS (Links coach sessions to auto-booked equipment)
-- ==========================================
INSERT INTO coach_session_equipments ("CoachBookingId", "EquipmentBookingId", "EquipmentId", "WorkoutPlanExerciseId", "IsApprovedByCoach", "Notes", "CreatedAt") VALUES
-- Coach session 2 equipment links (Day 1: Squat and Bench)
(2, 3, 3, 1, true, 'Squat Rack for Barbell Squats - auto-booked', NOW()),
(2, 4, 4, 2, true, 'Bench Press Station - auto-booked', NOW()),
-- Coach session 5 equipment links (Day 2: Treadmill and Rower)
(5, 6, 1, 4, true, 'Treadmill for cardio - auto-booked', NOW()),
(5, 7, 2, 5, true, 'Concept2 Rower - auto-booked', NOW());

-- ==========================================
-- USER SUBSCRIPTIONS
-- ==========================================
INSERT INTO user_subscriptions ("UserId", "PlanId", "StartDate", "EndDate", "Status", "AutoRenew", "PaymentId", "RenewalReminderSent", "CreatedAt", "UpdatedAt") VALUES
(1, 3, '2024-11-01', '2025-12-01', 0, true, NULL, false, NOW(), NOW()),
(3, 3, '2024-10-15', '2025-11-15', 0, true, NULL, false, NOW(), NOW()),
(5, 1, '2024-11-10', '2025-12-10', 0, false, NULL, false, NOW(), NOW()),
(6, 2, '2024-10-20', '2025-11-20', 0, true, NULL, false, NOW(), NOW());

-- Link subscriptions to payments (update after both tables are populated)
UPDATE user_subscriptions us
SET "PaymentId" = p."PaymentId"
FROM payments p
WHERE us."UserId" = p."UserId" 
  AND p."PaymentType" = 'Subscription'
  AND p."Status" = 1;

-- ==========================================
-- PAYMENTS
-- ==========================================
INSERT INTO payments ("UserId", "Amount", "Currency", "PaymentMethod", "PaymentType", "Status", "TransactionReference", "PackageId", "CreatedAt", "UpdatedAt") VALUES
(1, 129.99, 'USD', 'CreditCard', 'Subscription', 1, 'TXN-001-2024', NULL, '2024-11-01', NOW()),
(3, 129.99, 'USD', 'CreditCard', 'Subscription', 1, 'TXN-002-2024', NULL, '2024-10-15', NOW()),
(5, 49.99, 'USD', 'CreditCard', 'Subscription', 1, 'TXN-003-2024', NULL, '2024-11-10', NOW()),
(6, 17.99, 'USD', 'PayPal', 'TokenPurchase', 1, 'TXN-004-2024', 2, '2024-11-05', NOW()),
(1, 39.99, 'USD', 'CreditCard', 'TokenPurchase', 2, 'TXN-005-2024', 3, '2024-11-12', NOW());

-- ==========================================
-- TOKEN TRANSACTIONS
-- ==========================================
INSERT INTO token_transactions ("UserId", "Amount", "TransactionType", "Description", "ReferenceId", "ReferenceType", "BalanceBefore", "BalanceAfter", "CreatedAt") VALUES
(1, 100, 0, 'Premium subscription tokens', 1, 'Subscription', 0, 100, NOW()),
(1, -5, 1, 'Equipment booking - Treadmill', 1, 'Booking', 100, 95, NOW()),
(1, -75, 1, 'Coach session with Sarah Johnson', 2, 'Booking', 95, 20, NOW()),
(1, -75, 1, 'Coach session with Sarah Johnson', 5, 'Booking', 20, -55, NOW()),
(3, 100, 0, 'Premium subscription tokens', 2, 'Subscription', 0, 100, NOW()),
(3, -30, 1, 'AI workout plan generation', 3, 'AIProgramGeneration', 100, 70, NOW()),
(6, 110, 0, 'Basic Pack with bonus', 2, 'TokenPackage', 0, 110, NOW());

-- ==========================================
-- NOTIFICATIONS
-- ==========================================
INSERT INTO notifications ("UserId", "NotificationType", "Priority", "Title", "Message", "IsRead", "ReferenceType", "ReferenceId", "CreatedAt", "UpdatedAt") VALUES
(1, 0, 'normal', 'Coach Session Confirmed!', 'Your training session with Sarah Johnson on Dec 22 is confirmed. Equipment has been auto-booked based on your workout plan.', false, 'Booking', 2, NOW(), NOW()),
(1, 3, 'high', 'New Milestone Unlocked!', 'Congratulations! You completed Week Warrior', false, 'Milestone', 2, NOW(), NOW()),
(1, 0, 'normal', 'Equipment Auto-Booked', 'Squat Rack and Bench Press have been reserved for your coach session', false, 'Booking', 2, NOW(), NOW()),
(5, 0, 'normal', 'Workout Reminder', 'Keep up the great work!', false, 'WorkoutPlan', NULL, NOW(), NOW());

-- ==========================================
-- USER MILESTONES
-- ==========================================
INSERT INTO user_milestones ("UserId", "MilestoneId", "CurrentProgress", "IsCompleted", "CompletedAt", "CreatedAt") VALUES
(1, 1, 1, true, '2024-11-01', NOW()),
(1, 2, 7, true, '2024-11-08', NOW()),
(3, 1, 1, true, '2024-10-15', NOW()),
(3, 2, 7, true, '2024-10-22', NOW()),
(3, 3, 30, true, '2024-11-14', NOW());

-- ==========================================
-- ACTIVITY FEEDS
-- ==========================================
INSERT INTO activity_feeds ("UserId", "ActivityType", "Title", "Description", "ReferenceType", "ReferenceId", "CreatedAt") VALUES
(1, 'Workout', 'Completed Weight Loss Workout', 'John Doe completed a 45-minute workout', 'WorkoutLog', 1, '2024-11-15 09:45:00+00'),
(1, 'Achievement', 'Unlocked Week Warrior!', 'John Doe completed 7 consecutive workout days', 'Milestone', 2, '2024-11-08 12:00:00+00'),
(1, 'Booking', 'Coach Session Booked', 'John Doe booked a training session with Sarah Johnson', 'Booking', 2, NOW()),
(3, 'Workout', 'Hit New Deadlift PR!', 'Michael Smith deadlifted 140kg for 5 reps', 'WorkoutLog', 4, '2024-10-22 19:00:00+00'),
(3, 'Achievement', 'Unlocked Month Champion!', 'Michael Smith completed 30 days of training', 'Milestone', 3, '2024-11-14 12:00:00+00');

-- ==========================================
-- COACH REVIEWS (For sarah.johnson@intellifit.com CoachProfileId: 1)
-- ==========================================
INSERT INTO coach_reviews ("CoachId", "UserId", "BookingId", "Rating", "ReviewText", "IsAnonymous", "CreatedAt", "UpdatedAt") VALUES
(1, 1, 2, 5, 'Sarah is an amazing coach! Very knowledgeable and supportive. The auto-booked equipment was perfect for our session.', false, NOW(), NOW()),
(2, 2, NULL, 5, 'Emily really knows her stuff about powerlifting. Highly recommend!', false, NOW(), NOW());

-- ==========================================
-- AI PROGRAM GENERATIONS
-- ==========================================
INSERT INTO ai_program_generations ("UserId", "ProgramType", "WorkoutPlanId", "NutritionPlanId", "TokensUsed", "InputPrompt", "GeneratedPlan", "CreatedAt") VALUES
(1, 'Workout', 1, NULL, 20, 'Create an 8-week weight loss program for intermediate level focusing on compound movements', 'Generated workout plan with progressive overload', '2024-10-28'),
(3, 'Nutrition', NULL, 2, 25, 'Create a 2800 calorie muscle gain nutrition plan', 'Generated high protein meal plan', '2024-10-12'),
(5, 'Workout', 3, NULL, 30, 'Create a 10-week strength training program focusing on compound movements', 'AI-generated strength program with progressive overload and deload weeks', '2024-11-28');

-- ==========================================
-- AI CHAT LOGS
-- ==========================================
INSERT INTO ai_chat_logs ("UserId", "SessionId", "MessageType", "MessageContent", "TokensUsed", "CreatedAt") VALUES
(1, 123456789, 'user', 'How can I improve my squat form?', 5, NOW()),
(1, 123456789, 'assistant', 'To improve squat form, focus on: 1) Keep chest up 2) Drive knees out 3) Break at hips first...', 10, NOW()),
(3, 987654321, 'user', 'What should I eat post-workout?', 4, NOW()),
(3, 987654321, 'assistant', 'Post-workout nutrition should include: 1) Protein (30-40g) 2) Fast-digesting carbs...', 8, NOW());

-- ==========================================
-- AUDIT LOGS
-- ==========================================
INSERT INTO audit_logs ("UserId", "Action", "TableName", "RecordId", "NewValues", "IpAddress", "UserAgent", "CreatedAt") VALUES
(1, 'Login', 'User', 1, '{"status": "success"}', '192.168.1.100', 'Mozilla/5.0', NOW()),
(1, 'Create', 'Booking', 2, '{"coach_id": 1, "booking_type": "Session", "auto_equipment": true}', '192.168.1.100', 'Mozilla/5.0', NOW()),
(7, 'Create', 'WorkoutPlan', 1, '{"member_id": 1, "plan_name": "Weight Loss Transformation"}', '192.168.1.105', 'Mozilla/5.0', '2025-10-28 10:00:00+00'),
(10, 'Create', 'Payment', 1, '{"user_id": 1, "amount": 129.99, "status": "completed"}', '192.168.1.110', 'Mozilla/5.0', '2025-10-31 14:30:00+00');

-- ==========================================
-- AI WORKFLOW JOBS
-- ==========================================
INSERT INTO ai_workflow_jobs ("UserId", "JobType", "Status", "RequestPayload", "ResponsePayload", "N8nWorkflowId", "ErrorMessage", "CreatedAt", "CompletedAt") VALUES
(1, 'WorkoutPlanGeneration', 'Completed', '{"goal": "weight_loss", "experience": "intermediate", "days_per_week": 5}', '{"plan_id": 1, "duration_weeks": 8}', 'wf-workout-001', NULL, NOW(), NOW()),
(3, 'NutritionPlanGeneration', 'Completed', '{"goal": "muscle_gain", "daily_calories": 2800}', '{"plan_id": 2, "meals_count": 5}', 'wf-nutrition-001', NULL, NOW(), NOW()),
(1, 'ExerciseRecommendation', 'Pending', '{"muscle_group": "chest", "equipment_available": ["bench", "barbell"]}', NULL, 'wf-exercise-001', NULL, NOW(), NULL);

-- ==========================================
-- CHAT MESSAGES (Member-Coach Communication)
-- member@intellifit.com (UserId: 1) <-> sarah.johnson@intellifit.com (UserId: 7)
-- ==========================================
INSERT INTO chat_messages ("SenderId", "ReceiverId", "Message", "IsRead", "ReadAt", "ConversationId", "IsPermanent", "CreatedAt", "ExpiresAt") VALUES
(1, 7, 'Hi Coach Sarah! I have a question about my workout plan.', true, NOW(), '1-7', false, NOW(), NOW() + INTERVAL '1 month'),
(7, 1, 'Hi John! Of course, what would you like to know?', true, NOW(), '1-7', false, NOW(), NOW() + INTERVAL '1 month'),
(1, 7, 'For the squat exercise, should I go below parallel?', true, NOW(), '1-7', false, NOW(), NOW() + INTERVAL '1 month'),
(7, 1, 'Yes, aim for just below parallel for best results. I will help you with form during our next session.', false, NULL, '1-7', false, NOW(), NOW() + INTERVAL '1 month');

-- ==========================================
-- VERIFICATION (All 34 tables)
-- ==========================================
SELECT 'users' as table_name, COUNT(*) FROM users
UNION ALL SELECT 'member_profiles', COUNT(*) FROM member_profiles
UNION ALL SELECT 'coach_profiles', COUNT(*) FROM coach_profiles
UNION ALL SELECT 'subscription_plans', COUNT(*) FROM subscription_plans
UNION ALL SELECT 'token_packages', COUNT(*) FROM token_packages
UNION ALL SELECT 'equipment_categories', COUNT(*) FROM equipment_categories
UNION ALL SELECT 'equipment', COUNT(*) FROM equipment
UNION ALL SELECT 'exercises', COUNT(*) FROM exercises
UNION ALL SELECT 'ingredients', COUNT(*) FROM ingredients
UNION ALL SELECT 'progress_milestones', COUNT(*) FROM progress_milestones
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'equipment_time_slots', COUNT(*) FROM equipment_time_slots
UNION ALL SELECT 'coach_session_equipments', COUNT(*) FROM coach_session_equipments
UNION ALL SELECT 'workout_plans', COUNT(*) FROM workout_plans
UNION ALL SELECT 'workout_plan_exercises', COUNT(*) FROM workout_plan_exercises
UNION ALL SELECT 'workout_templates', COUNT(*) FROM workout_templates
UNION ALL SELECT 'workout_template_exercises', COUNT(*) FROM workout_template_exercises
UNION ALL SELECT 'workout_logs', COUNT(*) FROM workout_logs
UNION ALL SELECT 'nutrition_plans', COUNT(*) FROM nutrition_plans
UNION ALL SELECT 'meals', COUNT(*) FROM meals
UNION ALL SELECT 'meal_ingredients', COUNT(*) FROM meal_ingredients
UNION ALL SELECT 'inbody_measurements', COUNT(*) FROM inbody_measurements
UNION ALL SELECT 'user_subscriptions', COUNT(*) FROM user_subscriptions
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'token_transactions', COUNT(*) FROM token_transactions
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'user_milestones', COUNT(*) FROM user_milestones
UNION ALL SELECT 'activity_feeds', COUNT(*) FROM activity_feeds
UNION ALL SELECT 'coach_reviews', COUNT(*) FROM coach_reviews
UNION ALL SELECT 'ai_chat_logs', COUNT(*) FROM ai_chat_logs
UNION ALL SELECT 'ai_workflow_jobs', COUNT(*) FROM ai_workflow_jobs
UNION ALL SELECT 'ai_program_generations', COUNT(*) FROM ai_program_generations
UNION ALL SELECT 'chat_messages', COUNT(*) FROM chat_messages
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs
ORDER BY table_name;