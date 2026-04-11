-- Active: 1764278759643@@127.0.0.1@5432@PulseGym_v1.0.1
-- IntelliFit Database Complete Seed Data - PostgreSQL
-- ==========================================
-- Test Account Credentials (password for ALL users: 224466):
-- Member (ID 1): member@intellifit.com
-- Member (ID 12): alex.martinez@intellifit.com
-- Coach (ID 7): sarah.johnson@intellifit.com
-- Receptionist (ID 10): reception@intellifit.com
-- Admin (ID 11): admin@intellifit.com
-- ==========================================
-- DATE REFERENCE: "today" ≈ 2025-06-15
-- ==========================================

-- ==========================================
-- TRUNCATE ALL TABLES (reverse FK order)
-- ==========================================
TRUNCATE TABLE
  workout_feedbacks, user_strength_profiles, workout_log_exercises, workout_logs,
  workout_plan_exercises, workout_plans, workout_template_exercises, workout_templates,
  user_ai_workout_plan_exercises, user_ai_workout_plan_days, user_ai_workout_plans,
  muscle_development_scans, inbody_measurements,
  meal_ingredients, meals, nutrition_plans,
  user_achievements, achievements, user_milestones, progress_milestones,
  coach_reviews, coach_session_equipments, bookings,
  equipment_time_slots, equipment, equipment_categories,
  activity_feeds, notifications, chat_messages,
  ai_chat_logs, ai_workflow_jobs, ai_program_generations,
  ai_inference_logs, ai_model_versions, fitness_knowledge,
  user_feature_snapshots, vector_embeddings,
  audit_logs, token_transactions, payments,
  user_subscriptions, subscription_plans, token_packages,
  exercises, ingredients,
  member_profiles, coach_profiles, users
RESTART IDENTITY CASCADE;


-- ==========================================
-- 1. USERS (12 users: IDs 1-12)
-- ==========================================
INSERT INTO users ("Email", "PasswordHash", "Name", "Phone", "DateOfBirth", "Gender", "Role", "ProfileImageUrl", "Address", "EmergencyContactName", "EmergencyContactPhone", "TokenBalance", "IsActive", "EmailVerified", "MustChangePassword", "IsFirstLogin", "LastLoginAt", "CreatedAt", "UpdatedAt") VALUES
-- ID 1: Primary test member
('member@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'John Doe', '+1234567890', '1995-05-15', 0, 'Member', NULL, '123 Main St, New York, NY 10001', 'Jane Doe', '+1234567800', 85, true, true, false, false, '2025-06-15 08:30:00+00', '2024-09-01 10:00:00+00', '2025-06-15 08:30:00+00'),
-- IDs 2-6: Additional members
('michael.smith@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Michael Smith', '+1234567892', '1992-08-18', 0, 'Member', NULL, '789 Pine Rd, Queens, NY 11354', 'Emma Smith', '+1234567802', 75, true, true, false, false, '2025-06-14 18:00:00+00', '2024-08-15 10:00:00+00', '2025-06-14 18:00:00+00'),
('david.wilson@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'David Wilson', '+1234567894', '1998-03-10', 0, 'Member', NULL, '654 Maple Dr, Bronx, NY 10451', 'Lisa Wilson', '+1234567804', 0, true, true, false, false, '2025-04-20 10:00:00+00', '2025-01-05 10:00:00+00', '2025-04-20 10:00:00+00'),
('jessica.brown@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Jessica Brown', '+1234567895', '1996-11-05', 1, 'Member', NULL, '987 Cedar Ln, Staten Island, NY 10301', 'James Brown', '+1234567805', 100, true, true, false, false, '2025-06-13 07:00:00+00', '2024-10-01 10:00:00+00', '2025-06-13 07:00:00+00'),
('lisa.anderson@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Lisa Anderson', '+1234567897', '1994-07-18', 1, 'Member', NULL, '258 Spruce Way, White Plains, NY 10601', 'John Anderson', '+1234567807', 25, false, true, false, false, '2025-03-01 15:00:00+00', '2024-11-01 10:00:00+00', '2025-03-01 15:00:00+00'),
('amanda.garcia@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Amanda Garcia', '+1234567899', '1997-12-08', 1, 'Member', NULL, '741 Ash Pl, New Rochelle, NY 10801', 'Carlos Garcia', '+1234567809', 60, true, true, false, false, '2025-06-12 19:00:00+00', '2024-12-01 10:00:00+00', '2025-06-12 19:00:00+00'),
-- ID 7: Primary test coach
('sarah.johnson@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Sarah Johnson', '+1234567891', '1990-03-22', 1, 'Coach', NULL, '456 Oak Ave, Brooklyn, NY 11201', 'Mike Johnson', '+1234567801', 0, true, true, false, false, '2025-06-15 07:00:00+00', '2024-06-01 10:00:00+00', '2025-06-15 07:00:00+00'),
-- IDs 8-9: Additional coaches
('emily.davis@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Emily Davis', '+1234567893', '1988-11-30', 1, 'Coach', NULL, '321 Elm St, Manhattan, NY 10002', 'Tom Davis', '+1234567803', 0, true, true, false, false, '2025-06-14 09:00:00+00', '2024-06-01 10:00:00+00', '2025-06-14 09:00:00+00'),
('robert.taylor@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Robert Taylor', '+1234567896', '1985-07-14', 0, 'Coach', NULL, '147 Birch St, Long Island, NY 11530', 'Mary Taylor', '+1234567806', 0, true, true, false, false, '2025-06-10 14:00:00+00', '2024-06-01 10:00:00+00', '2025-06-10 14:00:00+00'),
-- ID 10: Receptionist
('reception@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Reception Staff', '+1234567898', '1993-06-20', 1, 'Receptionist', NULL, '100 Gym Plaza, New York, NY 10003', NULL, NULL, 0, true, true, false, false, '2025-06-15 06:30:00+00', '2024-06-01 10:00:00+00', '2025-06-15 06:30:00+00'),
-- ID 11: Admin
('admin@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Admin User', '+1234567810', '1985-01-01', 0, 'Admin', NULL, 'IntelliFit HQ, NY', NULL, NULL, 100, true, true, false, false, '2025-06-15 09:00:00+00', '2024-06-01 10:00:00+00', '2025-06-15 09:00:00+00'),
-- ID 12: Second primary test member
('alex.martinez@intellifit.com', '$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6', 'Alex Martinez', '+1234567811', '1993-09-25', 0, 'Member', NULL, '512 Broadway, New York, NY 10012', 'Maria Martinez', '+1234567812', 120, true, true, false, false, '2025-06-15 10:00:00+00', '2024-10-15 10:00:00+00', '2025-06-15 10:00:00+00');


-- ==========================================
-- 2. SUBSCRIPTION PLANS (10 plans)
-- ==========================================
INSERT INTO subscription_plans ("PlanName", "Description", "Price", "DurationDays", "TokensIncluded", "Features", "MaxBookingsPerDay", "IsPopular", "IsActive", "CreatedAt", "UpdatedAt") VALUES
('Basic Monthly', 'Book gym equipment with tokens', 49.99, 30, 20, '["Equipment Booking", "Locker Room"]', 2, false, true, '2024-01-01', '2024-01-01'),
('Standard Monthly', 'Equipment booking plus AI-powered workout and coaching features', 79.99, 30, 50, '["Equipment Booking", "AI Coach", "AI Workout Generator"]', 5, true, true, '2024-01-01', '2024-01-01'),
('Premium Monthly', 'Full access: equipment booking, AI features, personal coach booking and plan reviews', 129.99, 30, 100, '["Equipment Booking", "AI Coach", "AI Workout Generator", "Coach Booking", "Coach Plan Review"]', 10, true, true, '2024-01-01', '2024-01-01'),
('Standard Quarterly', '3-month membership with equipment booking and AI features', 214.99, 90, 150, '["Equipment Booking", "AI Coach", "AI Workout Generator", "Progress Tracking"]', 5, true, true, '2024-01-01', '2024-01-01'),
('Premium Quarterly', '3-month premium with equipment, AI, and personal coach', 349.99, 90, 300, '["Equipment Booking", "AI Coach", "AI Workout Generator", "Coach Booking", "Coach Plan Review", "Priority Booking"]', 10, true, true, '2024-01-01', '2024-01-01'),
('Basic Annual', 'Full year basic - book equipment and best value', 499.99, 365, 240, '["Equipment Booking", "Locker Room", "Free Guest Pass"]', 2, false, true, '2024-01-01', '2024-01-01'),
('Standard Annual', 'Full year membership with equipment booking and AI features', 799.99, 365, 600, '["Equipment Booking", "AI Coach", "AI Workout Generator", "Progress Tracking", "Free Guest Pass"]', 5, true, true, '2024-01-01', '2024-01-01'),
('Premium Annual', 'Full year premium - equipment, AI, personal coach, all benefits', 1299.99, 365, 1200, '["Equipment Booking", "AI Coach", "AI Workout Generator", "Coach Booking", "Coach Plan Review", "Priority Booking", "Free Guest Pass"]', 10, true, true, '2024-01-01', '2024-01-01'),
('Student Monthly', 'Student pricing - equipment booking and group classes', 39.99, 30, 30, '["Equipment Booking", "Group Classes"]', 3, false, true, '2024-01-01', '2024-01-01'),
('Trial 7-Day', 'Free 7-day trial to explore the gym', 0.00, 7, 10, '["Equipment Booking", "AI Coach Trial"]', 1, false, true, '2024-01-01', '2024-01-01');


-- ==========================================
-- 3. TOKEN PACKAGES (10 packages)
-- ==========================================
INSERT INTO token_packages ("PackageName", "TokenAmount", "Price", "BonusTokens", "Description", "IsActive", "UpdatedAt") VALUES
('Starter Pack', 50, 9.99, 0, 'Perfect for trying out AI features', true, '2024-01-01'),
('Basic Pack', 100, 17.99, 10, 'Good for casual users', true, '2024-01-01'),
('Popular Pack', 250, 39.99, 50, 'Most popular choice', true, '2024-01-01'),
('Pro Pack', 500, 69.99, 100, 'For serious fitness enthusiasts', true, '2024-01-01'),
('Ultimate Pack', 1000, 119.99, 250, 'Best value for power users', true, '2024-01-01'),
('Micro Pack', 20, 4.99, 0, 'Quick top-up for a single session', true, '2024-06-01'),
('Weekend Pack', 75, 13.99, 5, 'Perfect for weekend warriors', true, '2024-06-01'),
('Duo Pack', 150, 24.99, 20, 'Share tokens between sessions', true, '2024-06-01'),
('Coach Session Pack', 200, 34.99, 30, 'Ideal for coach booking sessions', true, '2024-06-01'),
('Seasonal Pack', 300, 44.99, 75, 'Great quarterly value', true, '2024-06-01');


-- ==========================================
-- 4. COACH PROFILES (3 coaches)
-- ==========================================
INSERT INTO coach_profiles ("UserId", "Specialization", "Certifications", "ExperienceYears", "Bio", "HourlyRate", "Rating", "TotalReviews", "TotalClients", "AvailabilitySchedule", "IsAvailable", "CreatedAt", "UpdatedAt") VALUES
(7, 'Strength Training & Weight Loss', ARRAY['NASM-CPT', 'CSCS'], 5, 'Certified personal trainer specializing in strength training and body transformations. 5+ years of helping clients achieve their fitness goals.', 75.00, 4.8, 45, 28, 'Mon-Fri: 6AM-8PM, Sat: 8AM-2PM', true, '2024-06-01', '2025-06-15'),
(8, 'Powerlifting & Muscle Building', ARRAY['CSCS', 'ISSA'], 8, 'Former competitive powerlifter with 8 years of coaching experience. Specializes in hypertrophy and strength programming.', 95.00, 4.9, 67, 35, 'Mon-Fri: 7AM-9PM, Sat-Sun: 8AM-4PM', true, '2024-06-01', '2025-06-14'),
(9, 'CrossFit & Athletic Performance', ARRAY['CrossFit L2', 'NASM-CPT'], 7, 'CrossFit Level 2 trainer focusing on functional fitness and athletic performance.', 85.00, 4.7, 52, 41, 'Mon-Sat: 5AM-7PM', true, '2024-06-01', '2025-06-10');


-- ==========================================
-- 5. MEMBER PROFILES (7 members: IDs 1-6 + 12)
-- ==========================================
INSERT INTO member_profiles ("UserId", "FitnessGoal", "MedicalConditions", "Allergies", "FitnessLevel", "PreferredWorkoutTime", "SubscriptionPlanId", "MembershipStartDate", "MembershipEndDate", "CurrentWeight", "TargetWeight", "Height", "TotalWorkoutsCompleted", "TotalCaloriesBurned", "Achievements", "CreatedAt", "UpdatedAt") VALUES
(1,  'Weight Loss',      'None',                  'None',      'Intermediate', 'Morning',   3, '2025-06-01', '2025-07-01', 82.0, 75.0, 175.0, 48, 15200, '["First Workout", "Week Warrior", "Month Champion"]', '2024-09-01', '2025-06-15'),
(2,  'Muscle Gain',      'Asthma',                'Peanuts',   'Advanced',     'Evening',   8, '2025-01-01', '2025-12-31', 78.5, 85.0, 180.0, 120, 42000, '["First Workout", "Week Warrior", "Month Champion", "Calorie Crusher"]', '2024-08-15', '2025-06-14'),
(3,  'General Fitness',  'None',                  'None',      'Beginner',     'Afternoon', NULL, NULL, NULL, 70.0, 70.0, 170.0, 8, 2400, '["First Workout"]', '2025-01-05', '2025-04-20'),
(4,  'Weight Loss',      'None',                  'Lactose',   'Intermediate', 'Morning',   4, '2025-05-01', '2025-07-30', 90.0, 80.0, 165.0, 35, 11200, '["First Workout", "Week Warrior"]', '2024-10-01', '2025-06-13'),
(5,  'Endurance',        'Previous knee injury',  'None',      'Intermediate', 'Evening',   NULL, NULL, NULL, 75.0, 72.0, 178.0, 12, 3600, '["First Workout"]', '2024-11-01', '2025-03-01'),
(6,  'Flexibility',      'None',                  'Shellfish', 'Beginner',     'Morning',   1, '2025-06-01', '2025-07-01', 65.0, 65.0, 168.0, 6, 1800, '[]', '2024-12-01', '2025-06-12'),
(12, 'Muscle Gain',      'Mild lower back pain',  'None',      'Intermediate', 'Evening',   5, '2025-04-01', '2025-06-30', 76.0, 82.0, 178.0, 62, 20500, '["First Workout", "Week Warrior", "Month Champion"]', '2024-10-15', '2025-06-15');


-- ==========================================
-- 6. EQUIPMENT CATEGORIES (7 categories)
-- ==========================================
INSERT INTO equipment_categories ("CategoryName", "Description", "Icon") VALUES
('Cardio', 'Cardiovascular training equipment', '🏃'),
('Strength', 'Free weights and strength training machines', '💪'),
('Functional', 'Functional training and CrossFit equipment', '🏋'),
('Recovery', 'Recovery and flexibility equipment', '🧘'),
('Olympic', 'Olympic weightlifting platforms and equipment', '🏅'),
('Cable Machines', 'Cable and pulley-based resistance machines', '🔗'),
('Bodyweight', 'Bodyweight training stations and rigs', '🤸');


-- ==========================================
-- 7. EQUIPMENT (12 items)
-- ==========================================
INSERT INTO equipment ("CategoryId", "Name", "Model", "Manufacturer", "SerialNumber", "Location", "Status", "ConditionRating", "LastMaintenanceDate", "NextMaintenanceDate", "BookingCostTokens", "MaxBookingDurationMinutes", "ImageUrl", "IsActive", "CreatedAt", "UpdatedAt") VALUES
(1, 'Treadmill Pro X1',      'TX-2024',  'ProFit',     'TM-001',  'Cardio Zone A',      0, 5, '2025-05-01', '2025-08-01', 5, 60,  NULL, true, '2024-06-01', '2025-05-01'),
(1, 'Concept2 Rower',        'Model D',  'Concept2',   'ROW-001', 'Cardio Zone A',      0, 5, '2025-04-15', '2025-07-15', 4, 60,  NULL, true, '2024-06-01', '2025-04-15'),
(2, 'Squat Rack Elite',      'SR-500',   'IronMaster', 'SR-001',  'Strength Zone B',    0, 5, '2025-05-10', '2025-08-10', 8, 90,  NULL, true, '2024-06-01', '2025-05-10'),
(2, 'Bench Press Station',   'BP-300',   'IronMaster', 'BP-001',  'Strength Zone B',    0, 5, '2025-05-10', '2025-08-10', 7, 90,  NULL, true, '2024-06-01', '2025-05-10'),
(3, 'Assault Bike',          'AB-2024',  'Rogue',      'AB-001',  'Functional Zone C',  0, 5, '2025-04-20', '2025-07-20', 6, 45,  NULL, true, '2024-06-01', '2025-04-20'),
(1, 'Elliptical Trainer',    'ET-500',   'Life Fitness','EL-001',  'Cardio Zone A',      0, 4, '2025-03-01', '2025-06-01', 4, 60,  NULL, true, '2024-06-01', '2025-03-01'),
(2, 'Leg Press Machine',     'LP-800',   'IronMaster', 'LP-001',  'Strength Zone B',    0, 5, '2025-05-10', '2025-08-10', 6, 60,  NULL, true, '2024-06-01', '2025-05-10'),
(5, 'Olympic Platform A',    'OP-100',   'Eleiko',     'OP-001',  'Olympic Zone D',     0, 5, '2025-04-01', '2025-07-01', 10, 90, NULL, true, '2024-06-01', '2025-04-01'),
(6, 'Cable Crossover Station','CC-200',  'Life Fitness','CC-001',  'Cable Zone E',       0, 5, '2025-05-15', '2025-08-15', 5, 45,  NULL, true, '2024-09-01', '2025-05-15'),
(4, 'Foam Roller Station',   'FR-10',    'TriggerPoint','FR-001', 'Recovery Zone F',    0, 4, '2025-02-01', '2025-05-01', 2, 30,  NULL, true, '2024-06-01', '2025-02-01'),
(7, 'Pull-up / Dip Station', 'PD-300',   'Rogue',      'PD-001',  'Bodyweight Zone G',  0, 5, '2025-04-01', '2025-07-01', 3, 45,  NULL, true, '2024-06-01', '2025-04-01'),
(2, 'Smith Machine',         'SM-600',   'IronMaster', 'SM-001',  'Strength Zone B',    1, 3, '2025-06-10', '2025-06-20', 7, 90,  NULL, false, '2024-06-01', '2025-06-10');


-- ==========================================
-- 8. EXERCISES (12 exercises)
-- ==========================================
INSERT INTO exercises ("Name", "Description", "Category", "MuscleGroup", "DifficultyLevel", "EquipmentRequired", "EquipmentId", "Instructions", "VideoUrl", "CaloriesPerMinute", "IsActive", "CreatedByCoachId", "CreatedAt", "UpdatedAt") VALUES
('Barbell Squat',       'Fundamental lower body compound exercise',              'Strength',   'Legs',      'Intermediate', 'Barbell, Squat Rack', 3,    '["Stand with feet shoulder-width apart","Bar on upper back","Lower until thighs parallel","Drive through heels to stand"]', NULL, 8,  true, 1, '2024-06-01', '2024-06-01'),
('Bench Press',         'Upper body pressing exercise for chest',                'Strength',   'Chest',     'Intermediate', 'Barbell, Bench',      4,    '["Lie on bench, feet flat","Grip bar slightly wider than shoulders","Lower to chest","Press up explosively"]', NULL, 7,  true, 2, '2024-06-01', '2024-06-01'),
('Deadlift',            'Full body compound pulling exercise',                   'Strength',   'Back',      'Advanced',     'Barbell',             8,    '["Stand with bar over mid-foot","Grip bar, chest up","Drive through floor","Stand tall, squeeze glutes"]', NULL, 10, true, 2, '2024-06-01', '2024-06-01'),
('Pull-ups',            'Bodyweight back and bicep exercise',                    'Bodyweight',  'Back',      'Intermediate', 'Pull-up Bar',         11,   '["Hang from bar, full extension","Pull chest to bar","Control descent","Repeat"]', NULL, 9,  true, 3, '2024-06-01', '2024-06-01'),
('Plank',               'Core stability exercise',                               'Core',       'Core',      'Beginner',     'None',                NULL, '["Forearms on ground, body straight","Engage core","Hold position","Breathe steadily"]', NULL, 5,  true, 3, '2024-06-01', '2024-06-01'),
('Overhead Press',      'Standing shoulder press with barbell',                  'Strength',   'Shoulders', 'Intermediate', 'Barbell',             3,    '["Stand with bar at shoulder height","Press overhead","Lock out at top","Lower under control"]', NULL, 7,  true, 1, '2024-06-01', '2024-06-01'),
('Barbell Row',         'Bent-over row for upper back thickness',                'Strength',   'Back',      'Intermediate', 'Barbell',             8,    '["Hinge at hips, flat back","Pull bar to lower chest","Squeeze shoulder blades","Lower slowly"]', NULL, 7,  true, 2, '2024-06-01', '2024-06-01'),
('Leg Press',           'Machine-based lower body pressing movement',            'Strength',   'Legs',      'Beginner',     'Leg Press Machine',   7,    '["Sit in machine, feet shoulder-width","Lower platform until 90 degrees","Press through heels","Do not lock knees"]', NULL, 6,  true, 1, '2024-06-01', '2024-06-01'),
('Cable Fly',           'Chest isolation exercise using cable machine',          'Strength',   'Chest',     'Beginner',     'Cable Crossover',     9,    '["Stand between cables","Slight bend in elbows","Bring hands together at chest height","Control the return"]', NULL, 5,  true, 2, '2024-06-01', '2024-06-01'),
('Rowing Machine',      'Full body cardiovascular exercise',                     'Cardio',     'Full Body', 'Beginner',     'Rowing Machine',      2,    '["Sit with feet strapped","Push with legs first","Pull handle to chest","Return in reverse order"]', NULL, 12, true, 3, '2024-06-01', '2024-06-01'),
('Treadmill Running',   'Cardiovascular running on treadmill',                   'Cardio',     'Full Body', 'Beginner',     'Treadmill',           1,    '["Set speed and incline","Start walking, gradually increase","Maintain good posture","Cool down at end"]', NULL, 11, true, 1, '2024-06-01', '2024-06-01'),
('Romanian Deadlift',   'Hip hinge movement targeting hamstrings and glutes',    'Strength',   'Legs',      'Intermediate', 'Barbell',             3,    '["Hold barbell at hip height","Push hips back, slight knee bend","Lower bar along legs","Return to standing"]', NULL, 8,  true, 2, '2024-06-01', '2024-06-01');


-- ==========================================
-- 9. INGREDIENTS (12 ingredients)
-- ==========================================
INSERT INTO ingredients ("Name", "Category", "CaloriesPer100g", "ProteinPer100g", "CarbsPer100g", "FatsPer100g", "IsActive") VALUES
('Chicken Breast',   'Protein',     165, 31.0, 0.0,  3.6,  true),
('Brown Rice',       'Carbs',       112, 2.6,  23.5, 0.9,  true),
('Broccoli',         'Vegetables',  34,  2.8,  7.0,  0.4,  true),
('Salmon',           'Protein',     208, 20.0, 0.0,  13.0, true),
('Eggs',             'Protein',     155, 13.0, 1.1,  11.0, true),
('Sweet Potato',     'Carbs',       86,  1.6,  20.1, 0.1,  true),
('Greek Yogurt',     'Dairy',       59,  10.0, 3.6,  0.4,  true),
('Oats',             'Carbs',       389, 16.9, 66.3, 6.9,  true),
('Avocado',          'Fats',        160, 2.0,  8.5,  14.7, true),
('Spinach',          'Vegetables',  23,  2.9,  3.6,  0.4,  true),
('Almonds',          'Fats',        579, 21.2, 21.6, 49.9, true),
('Banana',           'Fruits',      89,  1.1,  22.8, 0.3,  true);


-- ==========================================
-- 10. PROGRESS MILESTONES (10 milestones)
-- ==========================================
INSERT INTO progress_milestones ("MilestoneName", "Description", "Category", "TargetValue", "Icon", "PointsReward", "IsActive", "CreatedAt") VALUES
('First Workout',    'Complete your first workout session',          'Workout',     1,     '🎯', 10,   true, '2024-01-01'),
('Week Warrior',     'Complete 7 consecutive days of workouts',      'Streak',      7,     '🔥', 50,   true, '2024-01-01'),
('Month Champion',   'Complete 30 days of workouts',                 'Streak',      30,    '👑', 200,  true, '2024-01-01'),
('Calorie Crusher',  'Burn 10,000 calories total',                   'Calories',    10000, '💪', 100,  true, '2024-01-01'),
('Goal Getter',      'Achieve your fitness goal',                    'Achievement', 1,     '🎉', 1000, true, '2024-01-01'),
('Iron Lifter',      'Lift a total of 50,000 kg in workouts',       'Workout',     50000, '🏋', 150,  true, '2024-01-01'),
('Early Bird',       'Complete 20 morning workouts',                 'Workout',     20,    '🌅', 75,   true, '2024-01-01'),
('Century Club',     'Complete 100 total workouts',                  'Workout',     100,   '💯', 500,  true, '2024-01-01'),
('Nutrition Master', 'Follow a nutrition plan for 30 consecutive days', 'Nutrition', 30,   '🥗', 200,  true, '2024-01-01'),
('Social Butterfly', 'Book 10 coach sessions',                       'Social',      10,    '🦋', 100,  true, '2024-01-01');


-- ==========================================
-- 11. ACHIEVEMENTS (10 achievements)
-- ==========================================
INSERT INTO achievements ("Code", "Name", "Description", "Category", "Rarity", "IconUrl", "ThresholdValue", "IsSecret", "XpReward", "TokenReward", "DisplayOrder", "IsActive", "CreatedAt") VALUES
('FIRST_WORKOUT',     'First Step',         'Complete your very first workout',           'Performance', 'Common',    NULL, 1,     false, 50,   5,   1,  true, '2024-01-01'),
('WEEK_STREAK',       'Consistency King',   'Work out 7 days in a row',                  'Endurance',   'Rare',      NULL, 7,     false, 200,  10,  2,  true, '2024-01-01'),
('MONTH_STREAK',      'Iron Will',          'Work out 30 days in a row',                 'Endurance',   'Epic',      NULL, 30,    false, 500,  25,  3,  true, '2024-01-01'),
('WEIGHT_LOSS_5KG',   'Shedding Machine',   'Lose 5 kg from your starting weight',       'Performance', 'Rare',      NULL, 5,     false, 300,  15,  4,  true, '2024-01-01'),
('MUSCLE_GAIN_3KG',   'Mass Builder',       'Gain 3 kg of muscle mass',                  'Performance', 'Rare',      NULL, 3,     false, 300,  15,  5,  true, '2024-01-01'),
('PR_CRUSHER',        'Record Breaker',     'Set 10 personal records',                   'Performance', 'Epic',      NULL, 10,    false, 400,  20,  6,  true, '2024-01-01'),
('SOCIAL_STARTER',    'Team Player',        'Complete 5 coach sessions',                 'Social',      'Common',    NULL, 5,     false, 100,  5,   7,  true, '2024-01-01'),
('CALORIE_10K',       'Furnace',            'Burn 10,000 total calories',                'Performance', 'Rare',      NULL, 10000, false, 250,  10,  8,  true, '2024-01-01'),
('EARLY_BIRD',        'Dawn Warrior',       'Complete 20 workouts before 8 AM',          'Endurance',   'Rare',      NULL, 20,    false, 200,  10,  9,  true, '2024-01-01'),
('SECRET_LEGEND',     'Gym Legend',         'Complete 365 consecutive days of workouts', 'Endurance',   'Legendary', NULL, 365,   true,  2000, 100, 10, true, '2024-01-01');


-- ==========================================
-- 12. USER SUBSCRIPTIONS (12 subscriptions — various scenarios)
-- Statuses: 0=Active, 1=Expired
-- ==========================================
INSERT INTO user_subscriptions ("UserId", "PlanId", "StartDate", "EndDate", "Status", "AutoRenew", "PaymentId", "RenewalReminderSent", "CreatedAt", "UpdatedAt") VALUES
-- User 1: subscription history (expired → expired → active)
(1,  1, '2024-09-01', '2024-10-01', 1, false, NULL, false, '2024-09-01', '2024-10-01'),   -- Expired Basic
(1,  2, '2024-10-01', '2024-11-01', 1, false, NULL, false, '2024-10-01', '2024-11-01'),   -- Expired Standard
(1,  3, '2025-06-01', '2025-07-01', 0, true,  NULL, false, '2025-06-01', '2025-06-15'),   -- ACTIVE Premium Monthly

(12, 2, '2024-10-15', '2024-11-15', 1, false, NULL, false, '2024-10-15', '2024-11-15'),   -- Expired Standard
(12, 5, '2025-04-01', '2025-06-30', 0, true,  NULL, true,  '2025-04-01', '2025-06-15'),   -- ACTIVE Premium Quarterly, expiring in ~15 days

(2,  8, '2025-01-01', '2025-12-31', 0, true,  NULL, false, '2025-01-01', '2025-06-14'),   -- Active Premium Annual
(3,  1, '2025-01-05', '2025-02-04', 1, false, NULL, false, '2025-01-05', '2025-02-04'),   -- Expired Basic (lapsed)
(4,  4, '2025-05-01', '2025-07-30', 0, true,  NULL, false, '2025-05-01', '2025-06-13'),   -- Active Standard Quarterly
(5,  2, '2024-11-01', '2024-12-01', 1, false, NULL, true,  '2024-11-01', '2024-12-01'),   -- Expired Standard (lapsed)
(6,  1, '2025-06-01', '2025-07-01', 0, false, NULL, false, '2025-06-01', '2025-06-12'),   -- Active Basic Monthly
(1,  10,'2024-08-20', '2024-08-27', 1, false, NULL, false, '2024-08-20', '2024-08-27'),   -- User 1 trial (expired)
(12, 10,'2024-10-08', '2024-10-15', 1, false, NULL, false, '2024-10-08', '2024-10-15');   -- User 12 trial (expired)


-- ==========================================
-- 13. PAYMENTS (15 payments — Completed, Failed, Refunded, Pending)
-- Statuses: 0=Pending, 1=Completed, 2=Failed, 3=Refunded, 4=Cancelled
-- ==========================================
INSERT INTO payments ("UserId", "Amount", "Currency", "PaymentMethod", "PaymentType", "Status", "TransactionReference", "PackageId", "CreatedAt", "UpdatedAt") VALUES
-- User 1 subscription & token payments
(1,  49.99,  'USD', 'CreditCard', 'Subscription',   1, 'TXN-001-2024', NULL, '2024-09-01', '2024-09-01'),
(1,  79.99,  'USD', 'CreditCard', 'Subscription',   1, 'TXN-002-2024', NULL, '2024-10-01', '2024-10-01'),
(1,  129.99, 'USD', 'CreditCard', 'Subscription',   1, 'TXN-003-2025', NULL, '2025-06-01', '2025-06-01'),
(1,  39.99,  'USD', 'CreditCard', 'TokenPurchase',  1, 'TXN-004-2025', 3,    '2025-03-15', '2025-03-15'),
(1,  69.99,  'USD', 'PayPal',     'TokenPurchase',  2, 'TXN-005-2025', 4,    '2025-04-01', '2025-04-01'),  -- FAILED payment

(12, 79.99,  'USD', 'CreditCard', 'Subscription',   1, 'TXN-006-2024', NULL, '2024-10-15', '2024-10-15'),
(12, 349.99, 'USD', 'CreditCard', 'Subscription',   1, 'TXN-007-2025', NULL, '2025-04-01', '2025-04-01'),
(12, 17.99,  'USD', 'PayPal',     'TokenPurchase',  1, 'TXN-008-2025', 2,    '2025-02-10', '2025-02-10'),
(12, 119.99, 'USD', 'CreditCard', 'TokenPurchase',  3, 'TXN-009-2025', 5,    '2025-01-20', '2025-01-25'),  -- REFUNDED


(2,  1299.99,'USD', 'CreditCard', 'Subscription',   1, 'TXN-010-2025', NULL, '2025-01-01', '2025-01-01'),
(3,  49.99,  'USD', 'CreditCard', 'Subscription',   1, 'TXN-011-2025', NULL, '2025-01-05', '2025-01-05'),
(4,  214.99, 'USD', 'CreditCard', 'Subscription',   1, 'TXN-012-2025', NULL, '2025-05-01', '2025-05-01'),
(5,  79.99,  'USD', 'PayPal',     'Subscription',   1, 'TXN-013-2024', NULL, '2024-11-01', '2024-11-01'),
(6,  49.99,  'USD', 'CreditCard', 'Subscription',   1, 'TXN-014-2025', NULL, '2025-06-01', '2025-06-01'),
(1,  9.99,   'USD', 'CreditCard', 'TokenPurchase',  0, 'TXN-015-2025', 1,    '2025-06-14', '2025-06-14');  -- PENDING payment


-- ==========================================
-- 14. TOKEN TRANSACTIONS (15 transactions)
-- Types: 0=Purchase, 1=Deduction, 2=Refund, 3=Bonus, 4=Earned
-- ==========================================
INSERT INTO token_transactions ("UserId", "Amount", "TransactionType", "Description", "ReferenceId", "ReferenceType", "BalanceBefore", "BalanceAfter", "CreatedAt") VALUES
-- User 1 token history
(1,  20,  0, 'Basic subscription tokens',           1,  'Subscription',        0,   20,  '2024-09-01'),
(1,  50,  0, 'Standard subscription tokens',        2,  'Subscription',        20,  70,  '2024-10-01'),
(1,  -20, 1, 'AI workout plan generation',          NULL, 'WorkoutPlan',       70,  50,  '2024-10-15'),
(1,  100, 0, 'Premium subscription tokens',         3,  'Subscription',        50,  150, '2025-06-01'),
(1,  300, 0, 'Popular Pack purchase (250+50 bonus)', 4,  'TokenPackage',       150, 450, '2025-03-15'),
(1,  -15, 1, 'Coach session booking',                NULL, 'Booking',          450, 435, '2025-06-05'),
(1,  -5,  1, 'Treadmill booking',                    NULL, 'Booking',          435, 430, '2025-06-10'),

(12, 50,  0, 'Standard subscription tokens',        4,  'Subscription',        0,   50,  '2024-10-15'),
(12, 300, 0, 'Premium Quarterly tokens',             5,  'Subscription',        50,  350, '2025-04-01'),
(12, 110, 0, 'Basic Pack purchase (100+10 bonus)',   8,  'TokenPackage',       350, 460, '2025-02-10'),
(12, -30, 1, 'AI nutrition plan generation',         NULL, 'NutritionPlan',    460, 430, '2025-04-05'),
(12, -8,  1, 'Squat Rack booking',                   NULL, 'Booking',          430, 422, '2025-05-20'),
(12, 1250,2, 'Refund for Ultimate Pack',             9,  'TokenPackage',       422, 1672,'2025-01-25'),
(12, -1250,1,'Reversal of refunded tokens',          9,  'TokenPackage',      1672, 422, '2025-01-25'),
(12, 10,  4, 'Earned: completed workout streak',     NULL, 'Achievement',      422, 432, '2025-05-15');


-- ==========================================
-- 15. BOOKINGS (15 bookings for users 1 & 12)
-- Statuses: 0=Pending, 1=Confirmed, 2=Cancelled, 3=Completed, 4=NoShow
-- BookingType: Equipment or Coach
-- ==========================================
INSERT INTO bookings ("UserId", "EquipmentId", "CoachId", "BookingType", "StartTime", "EndTime", "Status", "TokensCost", "CheckInTime", "CheckOutTime", "IsAiGenerated", "IsAutoBookedForCoachSession", "ParentCoachBookingId", "CancellationReason", "Notes", "CreatedAt", "UpdatedAt") VALUES

(1,  1,    NULL, 'Equipment', '2025-05-20 07:00:00+00', '2025-05-20 08:00:00+00', 3, 5,  '2025-05-20 06:58:00+00', '2025-05-20 07:55:00+00', false, false, NULL, NULL, 'Morning cardio',           '2025-05-19', '2025-05-20'),
(1,  3,    NULL, 'Equipment', '2025-05-22 08:00:00+00', '2025-05-22 09:30:00+00', 3, 8,  '2025-05-22 07:58:00+00', '2025-05-22 09:25:00+00', false, false, NULL, NULL, 'Squat day',                '2025-05-21', '2025-05-22'),

(1,  NULL, 1,    'Coach',     '2025-06-05 09:00:00+00', '2025-06-05 10:00:00+00', 3, 15, '2025-06-05 08:55:00+00', '2025-06-05 10:00:00+00', false, false, NULL, NULL, 'Strength coaching',        '2025-06-03', '2025-06-05'),

(1,  4,    NULL, 'Equipment', '2025-06-08 07:00:00+00', '2025-06-08 08:30:00+00', 2, 7,  NULL, NULL, false, false, NULL, 'Feeling unwell', 'Bench day cancelled',      '2025-06-06', '2025-06-07'),

(1,  1,    NULL, 'Equipment', '2025-06-18 07:00:00+00', '2025-06-18 08:00:00+00', 1, 5,  NULL, NULL, false, false, NULL, NULL, 'Morning cardio',           '2025-06-15', '2025-06-15'),

(1,  NULL, 1,    'Coach',     '2025-06-20 09:00:00+00', '2025-06-20 10:00:00+00', 1, 15, NULL, NULL, false, false, NULL, NULL, 'Weekly coaching session',   '2025-06-14', '2025-06-14'),

(1,  2,    NULL, 'Equipment', '2025-06-01 06:00:00+00', '2025-06-01 07:00:00+00', 4, 4,  NULL, NULL, false, false, NULL, NULL, 'Rower session',            '2025-05-30', '2025-06-01'),


(12, 3,    NULL, 'Equipment', '2025-05-15 18:00:00+00', '2025-05-15 19:30:00+00', 3, 8,  '2025-05-15 17:55:00+00', '2025-05-15 19:25:00+00', false, false, NULL, NULL, 'Squat session',            '2025-05-14', '2025-05-15'),
(12, 7,    NULL, 'Equipment', '2025-05-18 18:00:00+00', '2025-05-18 19:00:00+00', 3, 6,  '2025-05-18 17:58:00+00', '2025-05-18 18:55:00+00', false, false, NULL, NULL, 'Leg press day',            '2025-05-17', '2025-05-18'),

(12, NULL, 2,    'Coach',     '2025-05-25 19:00:00+00', '2025-05-25 20:00:00+00', 3, 20, '2025-05-25 18:55:00+00', '2025-05-25 20:00:00+00', false, false, NULL, NULL, 'Hypertrophy coaching',     '2025-05-23', '2025-05-25'),
(12, NULL, 1,    'Coach',     '2025-06-10 18:00:00+00', '2025-06-10 19:00:00+00', 3, 15, '2025-06-10 17:58:00+00', '2025-06-10 19:00:00+00', false, false, NULL, NULL, 'Form check session',       '2025-06-08', '2025-06-10'),

(12, 8,    NULL, 'Equipment', '2025-06-02 19:00:00+00', '2025-06-02 20:30:00+00', 2, 10, NULL, NULL, false, false, NULL, 'Schedule conflict', 'Olympic lifts cancelled', '2025-06-01', '2025-06-01'),

(12, 9,    NULL, 'Equipment', '2025-06-17 18:00:00+00', '2025-06-17 18:45:00+00', 1, 5,  NULL, NULL, false, false, NULL, NULL, 'Cable work',               '2025-06-15', '2025-06-15'),

(12, 4,    NULL, 'Equipment', '2025-06-19 19:00:00+00', '2025-06-19 20:30:00+00', 0, 7,  NULL, NULL, false, false, NULL, NULL, 'Bench press session',      '2025-06-15', '2025-06-15'),

(12, 3,    NULL, 'Equipment', '2025-06-22 18:00:00+00', '2025-06-22 19:30:00+00', 1, 8,  NULL, NULL, true,  false, NULL, NULL, 'AI recommended squat session', '2025-06-15', '2025-06-15');


-- ==========================================
-- 16. WORKOUT TEMPLATES (5 templates)
-- ==========================================
INSERT INTO workout_templates ("CreatedByCoachId", "TemplateName", "Description", "DifficultyLevel", "DurationWeeks", "WorkoutsPerWeek", "IsPublic", "IsActive", "CreatedAt", "UpdatedAt") VALUES
(1, 'Push Day - Upper Body',       'Chest, shoulders, and triceps workout',       'Intermediate', 4, 3, true,  true,  '2024-06-01', '2024-06-01'),
(2, 'Pull Day - Back & Biceps',    'Back and bicep focused training',             'Intermediate', 4, 3, true,  true,  '2024-06-01', '2024-06-01'),
(2, 'Leg Day Hypertrophy',         'Complete lower body workout for growth',      'Advanced',     6, 4, true,  true,  '2024-06-01', '2024-06-01'),
(1, 'Full Body Strength',          'Compound-focused full body session',          'Beginner',     8, 3, true,  true,  '2024-09-01', '2024-09-01'),
(3, 'HIIT Cardio Blaster',         '30-min high-intensity interval training',     'Intermediate', 4, 4, true,  true,  '2024-09-01', '2024-09-01');


-- ==========================================
-- 17. WORKOUT TEMPLATE EXERCISES (12 entries)
-- ==========================================
INSERT INTO workout_template_exercises ("TemplateId", "ExerciseId", "WeekNumber", "DayNumber", "OrderInDay", "Sets", "Reps", "RestSeconds", "Notes", "CreatedAt") VALUES
(1, 2,  1, 1, 1, 4, 8,  120, 'Focus on controlled descent', '2024-06-01'),
(1, 6,  1, 1, 2, 3, 10, 90,  'Strict form, no leg drive',   '2024-06-01'),
(1, 9,  1, 1, 3, 3, 12, 60,  'Squeeze at peak contraction',  '2024-06-01'),
(2, 3,  1, 1, 1, 4, 5,  180, 'Heavy weight, perfect form',   '2024-06-01'),
(2, 7,  1, 1, 2, 4, 8,  90,  'Pull to lower chest',         '2024-06-01'),
(2, 4,  1, 1, 3, 3, 10, 60,  'Controlled tempo',            '2024-06-01'),
(3, 1,  1, 1, 1, 5, 8,  150, 'Main compound movement',       '2024-06-01'),
(3, 8,  1, 1, 2, 4, 12, 90,  'Deep range of motion',        '2024-06-01'),
(3, 12, 1, 1, 3, 3, 10, 90,  'Stretch at bottom',           '2024-06-01'),
(4, 1,  1, 1, 1, 3, 8,  120, 'Start with squats',           '2024-09-01'),
(4, 2,  1, 1, 2, 3, 8,  120, 'Bench after squats',          '2024-09-01'),
(4, 3,  1, 1, 3, 3, 5,  180, 'Finish with deadlifts',       '2024-09-01');


-- ==========================================
-- 18. WORKOUT PLANS (10 plans, mainly for users 1 & 12)
-- Status: Draft, PendingApproval, Active, Paused, Completed
-- ==========================================
INSERT INTO workout_plans ("UserId", "PlanName", "Description", "PlanType", "DifficultyLevel", "FitnessLevel", "DurationWeeks", "DaysPerWeek", "Schedule", "Goal", "Status", "IsActive", "IsCompleted", "GeneratedByCoachId", "ApprovedBy", "ApprovalNotes", "ApprovedAt", "ActivatedAt", "CompletedAt", "StartDate", "EndDate", "TokensSpent", "AiPrompt", "ModelVersion", "CreatedAt", "UpdatedAt") VALUES
-- User 1 plans
(1,  'Weight Loss Kickstart',      '4-week fat-burning intro program',     'Custom',       'Beginner',     'Beginner',     4, 3, '3 days per week', 'Weight Loss', 'Completed', false, true,  1,    1,    'Great starting plan',   '2024-09-05', '2024-09-05', '2024-10-01', '2024-09-05', '2024-10-01', 0,  NULL, NULL, '2024-09-03', '2024-10-01'),
(1,  'Intermediate Fat Loss',      '8-week body recomposition',            'Custom',       'Intermediate', 'Intermediate', 8, 4, '4 days per week', 'Weight Loss', 'Completed', false, true,  1,    1,    'Good progression',      '2024-10-05', '2024-10-05', '2024-12-01', '2024-10-05', '2024-12-01', 0,  NULL, NULL, '2024-10-03', '2024-12-01'),
(1,  'AI Lean Machine',            'AI-generated cutting program',         'AI-Generated', 'Intermediate', 'Intermediate', 6, 5, '5 days per week', 'Weight Loss', 'Active',    true,  false, NULL, 1,    'AI plan looks solid',   '2025-06-02', '2025-06-02', NULL,         '2025-06-02', '2025-07-14', 25, 'Create a 6-week weight loss program for intermediate male, 82kg, targeting 75kg', 'flan-t5-small-v3', '2025-06-01', '2025-06-15'),
(1,  'Summer Shred Draft',         'Planning a summer cut',                'Custom',       'Intermediate', 'Intermediate', 4, 5, '5 days per week', 'Weight Loss', 'Draft',     false, false, NULL, NULL, NULL,                    NULL,         NULL,         NULL,         NULL,         NULL,         0,  NULL, NULL, '2025-06-14', '2025-06-14'),


(12, 'Beginner Muscle Builder',    'First mass-gaining program',           'Custom',       'Beginner',     'Beginner',     6, 3, '3 days per week', 'Muscle Gain', 'Completed', false, true,  2,    2,    'Perfect for beginner',  '2024-11-01', '2024-11-01', '2024-12-15', '2024-11-01', '2024-12-15', 0,  NULL, NULL, '2024-10-28', '2024-12-15'),
(12, 'Hypertrophy Phase 1',        '10-week volume training',              'Custom',       'Intermediate', 'Intermediate', 10,4, '4 days per week', 'Muscle Gain', 'Completed', false, true,  2,    2,    'Great volume plan',     '2025-01-05', '2025-01-05', '2025-03-15', '2025-01-05', '2025-03-15', 0,  NULL, NULL, '2025-01-02', '2025-03-15'),
(12, 'AI Power Builder',           'AI-generated strength & size program', 'AI-Generated', 'Intermediate', 'Intermediate', 8, 5, '5 days per week', 'Muscle Gain', 'Active',    true,  false, NULL, 2,    'Approved with minor tweaks', '2025-04-10', '2025-04-10', NULL, '2025-04-10', '2025-06-05', 30, 'Create an 8-week muscle building program for intermediate male, 76kg, targeting 82kg, mild lower back pain', 'flan-t5-small-v3', '2025-04-08', '2025-06-15'),
(12, 'Deload Week',                'Recovery week plan',                   'Custom',       'Beginner',     'Intermediate', 1, 3, '3 light days',    'Recovery',    'Paused',    false, false, 1,    1,    'Take it easy this week','2025-03-16', '2025-03-16', NULL,         '2025-03-16', '2025-03-22', 0,  NULL, NULL, '2025-03-15', '2025-03-18'),
(12, 'Pending Coach Review',       'New program awaiting coach feedback',  'Custom',       'Intermediate', 'Intermediate', 6, 4, '4 days per week', 'Muscle Gain', 'PendingApproval', false, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '2025-06-14', '2025-06-14'),
(1,  'Quick HIIT Plan',            '2-week high intensity program',        'Custom',       'Intermediate', 'Intermediate', 2, 4, '4 days per week', 'Weight Loss', 'PendingApproval', false, false, NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-20', '2025-07-04', 0, NULL, NULL, '2025-06-13', '2025-06-13');


-- ==========================================
-- 19. WORKOUT PLAN EXERCISES (15 entries)
-- ==========================================
INSERT INTO workout_plan_exercises ("WorkoutPlanId", "ExerciseId", "DayNumber", "OrderInDay", "Sets", "Reps", "RestSeconds", "DurationMinutes", "Notes", "CreatedAt") VALUES
-- Plan 3 (User 1 AI Lean Machine) — Day 1: Upper
(3, 2,  1, 1, 4, 10, 90,  NULL, 'Warm up with lighter sets', '2025-06-02'),
(3, 6,  1, 2, 3, 12, 60,  NULL, 'Strict form',               '2025-06-02'),
(3, 9,  1, 3, 3, 15, 45,  NULL, 'Burnout set on last',       '2025-06-02'),
-- Plan 3 — Day 2: Lower
(3, 1,  2, 1, 4, 8,  120, NULL, 'Go deep',                    '2025-06-02'),
(3, 8,  2, 2, 3, 12, 90,  NULL, 'Full ROM',                   '2025-06-02'),
(3, 12, 2, 3, 3, 10, 90,  NULL, 'Feel the stretch',           '2025-06-02'),
-- Plan 3 — Day 3: Cardio
(3, 11, 3, 1, 1, 1,  0,   30,   '30 min steady state',        '2025-06-02'),
(3, 10, 3, 2, 1, 1,  0,   15,   '15 min rowing intervals',    '2025-06-02'),

(7, 2,  1, 1, 5, 5,  180, NULL, 'Heavy compound',             '2025-04-10'),
(7, 6,  1, 2, 4, 8,  90,  NULL, 'Moderate weight',            '2025-04-10'),
(7, 9,  1, 3, 3, 12, 60,  NULL, 'Isolation finisher',         '2025-04-10'),
-- Plan 7 — Day 2: Pull
(7, 3,  2, 1, 5, 5,  180, NULL, 'Primary movement',           '2025-04-10'),
(7, 7,  2, 2, 4, 8,  90,  NULL, 'Upper back focus',           '2025-04-10'),
(7, 4,  2, 3, 3, 10, 60,  NULL, 'Bodyweight finisher',        '2025-04-10'),
-- Plan 7 — Day 3: Legs
(7, 1,  3, 1, 5, 5,  180, NULL, 'King of exercises',          '2025-04-10');


-- ==========================================
-- 20. WORKOUT LOGS (15 logs for users 1 & 12)
-- ==========================================
INSERT INTO workout_logs ("UserId", "PlanId", "WorkoutDate", "ExercisesCompleted", "DurationMinutes", "CaloriesBurned", "FeelingRating", "OverallRpe", "Notes", "Completed", "CreatedAt", "UpdatedAt") VALUES
-- User 1 workout history
(1,  1, '2024-09-10 07:00:00+00', '6', 40, 280, 3, 6, 'First real workout, tough but good',    true, '2024-09-10', '2024-09-10'),
(1,  1, '2024-09-15 07:00:00+00', '6', 42, 300, 4, 5, 'Getting easier already',                true, '2024-09-15', '2024-09-15'),
(1,  2, '2024-10-10 07:00:00+00', '8', 50, 380, 4, 7, 'Solid intermediate session',            true, '2024-10-10', '2024-10-10'),
(1,  2, '2024-11-05 07:00:00+00', '8', 55, 420, 5, 8, 'Personal best on squats today!',        true, '2024-11-05', '2024-11-05'),
(1,  3, '2025-06-03 07:00:00+00', '8', 55, 400, 4, 7, 'First day of new AI plan',              true, '2025-06-03', '2025-06-03'),
(1,  3, '2025-06-05 07:00:00+00', '6', 48, 350, 4, 6, 'Lower body day, legs sore',             true, '2025-06-05', '2025-06-05'),
(1,  3, '2025-06-10 07:00:00+00', '5', 42, 320, 3, 7, 'Tired today, still pushed through',     true, '2025-06-10', '2025-06-10'),
(1,  3, '2025-06-13 07:00:00+00', '8', 58, 430, 5, 8, 'Best session this week!',               true, '2025-06-13', '2025-06-13'),

(12, 5, '2024-11-05 18:00:00+00', '5', 35, 220, 3, 5, 'First gym session ever, loved it',      true, '2024-11-05', '2024-11-05'),
(12, 6, '2025-01-10 18:00:00+00', '8', 60, 420, 4, 7, 'Volume day feels great',                true, '2025-01-10', '2025-01-10'),
(12, 6, '2025-02-15 18:00:00+00', '8', 65, 480, 5, 8, 'Hit new PR on bench press!',            true, '2025-02-15', '2025-02-15'),
(12, 7, '2025-04-15 18:00:00+00', '8', 55, 400, 4, 7, 'Started new AI plan, challenging',      true, '2025-04-15', '2025-04-15'),
(12, 7, '2025-05-20 18:00:00+00', '8', 58, 430, 4, 7, 'Consistent progress on all lifts',      true, '2025-05-20', '2025-05-20'),
(12, 7, '2025-06-10 18:00:00+00', '8', 60, 450, 5, 8, 'Feeling strong! Deadlift PR',           true, '2025-06-10', '2025-06-10'),
(12, 7, '2025-06-14 18:00:00+00', '6', 45, 300, 3, 5, 'Light recovery session',                true, '2025-06-14', '2025-06-14');


-- ==========================================
-- 21. WORKOUT LOG EXERCISES (15 entries)
-- ==========================================
INSERT INTO workout_log_exercises ("LogId", "ExerciseId", "PlannedExerciseId", "OrderPerformed", "SetsCompleted", "RepsPerSet", "WeightPerSet", "TotalVolume", "RestSecondsBetweenSets", "DurationSeconds", "Rpe", "IsPersonalRecord", "Notes", "CreatedAt") VALUES
-- User 1, Log 5 (AI plan day 1)
(5, 2,  1,  1, 4, '10,10,10,8', '60,60,60,60',  2280.00, 90,  NULL, 7, false, NULL, '2025-06-03'),
(5, 6,  2,  2, 3, '12,12,10',   '40,40,40',      1360.00, 60,  NULL, 7, false, NULL, '2025-06-03'),
(5, 9,  3,  3, 3, '15,15,12',   '15,15,15',      630.00,  45,  NULL, 6, false, NULL, '2025-06-03'),
-- User 1, Log 8 (best session)
(8, 2,  1,  1, 4, '10,10,10,10','65,65,65,65',   2600.00, 90,  NULL, 8, true,  'New PR!', '2025-06-13'),
(8, 6,  2,  2, 3, '12,12,12',   '45,45,45',      1620.00, 60,  NULL, 7, false, NULL,      '2025-06-13'),
(8, 9,  3,  3, 3, '15,15,15',   '17.5,17.5,17.5',787.50,  45,  NULL, 7, false, NULL,      '2025-06-13'),
-- User 12, Log 11 (bench PR)
(11, 2,  NULL, 1, 5, '5,5,5,5,5', '80,85,90,90,92.5', 2212.50, 180, NULL, 9, true,  'Bench PR: 92.5kg x5!', '2025-02-15'),
(11, 6,  NULL, 2, 4, '8,8,8,8',   '50,50,50,50',  1600.00,  90,  NULL, 7, false, NULL,                '2025-02-15'),

(14, 3,  12, 1, 5, '5,5,5,5,3',  '120,130,140,140,150', 3530.00, 180, NULL, 9, true,  'Deadlift PR: 150kg x3!', '2025-06-10'),
(14, 7,  13, 2, 4, '8,8,8,8',    '70,70,70,70',  2240.00,  90,  NULL, 7, false, NULL,                     '2025-06-10'),
(14, 4,  14, 3, 3, '10,8,7',     NULL,            NULL,     60,  NULL, 8, false, 'Bodyweight pulls',        '2025-06-10'),

(15, 1,  NULL, 1, 3, '8,8,8',    '60,60,60',      1440.00, 120, NULL, 4, false, 'Light recovery squats', '2025-06-14'),
(15, 5,  NULL, 2, 3, '1,1,1',    NULL,            NULL,     0,   60,  3, false, '60 sec holds',          '2025-06-14'),

(7, 11, 7, 1, 1, '1', NULL, NULL, 0, 1800, 5, false, '30 min treadmill at 8km/h', '2025-06-10');


-- ==========================================
-- 22. WORKOUT FEEDBACKS (10 entries)
-- ==========================================
INSERT INTO workout_feedbacks ("UserId", "WorkoutLogId", "WorkoutPlanId", "FeedbackType", "DifficultyLevel", "Rating", "ExerciseFeedback", "Comments", "CreatedAt") VALUES
(1,  5,  3, 'form_submit', 'Just Right',  4, '{"bench_press": "good", "overhead_press": "challenging"}', 'Great first day on the new plan', '2025-06-03'),
(1,  6,  3, 'form_submit', 'Too Hard',    3, '{"squat": "heavy", "leg_press": "ok"}',                   'Legs are really sore',             '2025-06-05'),
(1,  7,  3, 'text',        'Just Right',  3, '{}',                                                       'Cardio was manageable',            '2025-06-10'),
(1,  8,  3, 'form_submit', 'Just Right',  5, '{"bench_press": "PR!", "overhead_press": "strong"}',       'Best session this week!',          '2025-06-13'),
(12, 9,  5, 'form_submit', 'Too Easy',    3, '{"squat": "light"}',                                       'Need to increase weights',         '2024-11-05'),
(12, 10, 6, 'form_submit', 'Just Right',  4, '{"all": "good volume"}',                                   'Enjoying the program',             '2025-01-10'),
(12, 11, 6, 'form_submit', 'Just Right',  5, '{"bench_press": "PR"}',                                    'Hit a personal record!',           '2025-02-15'),
(12, 12, 7, 'form_submit', 'Too Hard',    3, '{"deadlift": "heavy", "rows": "hard"}',                    'AI plan is challenging',           '2025-04-15'),
(12, 14, 7, 'form_submit', 'Just Right',  5, '{"deadlift": "PR!", "rows": "strong"}',                    'Deadlift PR day!',                 '2025-06-10'),
(12, 15, 7, 'text',        'Too Easy',    4, '{}',                                                       'Light recovery, felt good',        '2025-06-14');


-- ==========================================
-- 23. USER STRENGTH PROFILES (10 entries)
-- ==========================================
INSERT INTO user_strength_profiles ("UserId", "ExerciseId", "Estimated1RM", "MaxWeightLifted", "AvgWorkingWeight", "LastWorkoutDate", "StrengthTrend", "ConfidenceScore", "FeedbackCount", "LastUpdatedFrom", "CreatedAt", "UpdatedAt") VALUES
-- User 1
(1,  1, 100.00,  85.0,  70.0,  '2025-06-13', 'Improving',  0.850, 15, 'WorkoutLog', '2024-09-10', '2025-06-13'),
(1,  2, 85.00,   70.0,  60.0,  '2025-06-13', 'Improving',  0.900, 18, 'WorkoutLog', '2024-09-10', '2025-06-13'),
(1,  6, 55.00,   47.5,  42.5,  '2025-06-13', 'Improving',  0.800, 12, 'WorkoutLog', '2024-10-10', '2025-06-13'),
(1,  3, 120.00,  100.0, 90.0,  '2024-11-05', 'Stable',     0.750, 8,  'WorkoutLog', '2024-10-10', '2024-11-05'),

(12, 1, 130.00,  110.0, 90.0,  '2025-06-14', 'Improving',  0.920, 22, 'WorkoutLog', '2024-11-05', '2025-06-14'),
(12, 2, 110.00,  92.5,  80.0,  '2025-06-10', 'Improving',  0.910, 20, 'WorkoutLog', '2024-11-05', '2025-06-10'),
(12, 3, 175.00,  150.0, 130.0, '2025-06-10', 'Improving',  0.950, 25, 'WorkoutLog', '2025-01-10', '2025-06-10'),
(12, 7, 95.00,   75.0,  65.0,  '2025-06-10', 'Improving',  0.850, 15, 'WorkoutLog', '2025-01-10', '2025-06-10'),
(12, 6, 65.00,   55.0,  47.5,  '2025-05-20', 'Stable',     0.800, 10, 'WorkoutLog', '2025-01-10', '2025-05-20'),
(12, 12,105.00,  90.0,  75.0,  '2025-05-20', 'Improving',  0.880, 12, 'WorkoutLog', '2025-01-10', '2025-05-20');


-- ==========================================
-- 24. NUTRITION PLANS (10 plans for users 1 & 12)
-- ==========================================
INSERT INTO nutrition_plans ("UserId", "PlanName", "Description", "PlanType", "DailyCalories", "ProteinGrams", "CarbsGrams", "FatsGrams", "DietaryRestrictions", "GeneratedByCoachId", "ApprovedByCoachId", "Status", "ApprovalNotes", "ApprovedAt", "StartDate", "EndDate", "TokensSpent", "AiPrompt", "IsActive", "CreatedAt", "UpdatedAt") VALUES
-- User 1 nutrition history
(1,  'Initial Cut Diet',        'Moderate deficit for fat loss',         'Custom',       1800, 150, 180, 50, NULL,                   1,    1,    'Completed', 'Well balanced',     '2024-09-05', '2024-09-05', '2024-10-05', 0,  NULL, false, '2024-09-03', '2024-10-05'),
(1,  'Aggressive Cut',          'Larger deficit for faster results',     'Custom',       1600, 160, 140, 45, NULL,                   1,    1,    'Completed', 'Monitor energy',    '2024-10-10', '2024-10-10', '2024-12-01', 0,  NULL, false, '2024-10-08', '2024-12-01'),
(1,  'AI Lean Nutrition',       'AI-generated cutting meal plan',        'AI-Generated', 1900, 170, 190, 55, NULL,                   NULL, 1,    'Active',    'Good macro split',  '2025-06-02', '2025-06-02', '2025-07-14', 20, 'Create a calorie deficit nutrition plan for 82kg male targeting 75kg', false, '2025-06-01', '2025-06-15'),
(1,  'Summer Nutrition Draft',  'Planning summer meals',                 'Custom',       2000, 180, 200, 55, NULL,                   NULL, NULL, 'Draft',     NULL,                NULL,         NULL,         NULL,         0,  NULL, false, '2025-06-14', '2025-06-14'),

(12, 'Beginner Bulk Diet',      'Calorie surplus for new lifter',        'Custom',       2500, 170, 300, 70, NULL,                   2,    2,    'Completed', 'Great starting plan','2024-11-01', '2024-11-01', '2024-12-15', 0,  NULL, false, '2024-10-28', '2024-12-15'),
(12, 'Clean Bulk',              'Quality calories for lean gains',       'Custom',       2800, 200, 320, 75, NULL,                   2,    2,    'Completed', 'Excellent macros',  '2025-01-05', '2025-01-05', '2025-03-15', 0,  NULL, false, '2025-01-02', '2025-03-15'),
(12, 'AI Muscle Fuel',          'AI-generated bulking plan',             'AI-Generated', 2900, 210, 340, 80, NULL,                   NULL, 2,    'Active',    'Approved with notes','2025-04-10', '2025-04-10', '2025-06-05', 30, 'Create a muscle gain nutrition plan for 76kg male targeting 82kg, mild lower back pain', true, '2025-04-08', '2025-06-15'),
(12, 'Maintenance Phase',       'Calories at maintenance level',         'Custom',       2200, 180, 250, 65, NULL,                   1,    1,    'Paused',    'Good for deload',   '2025-03-16', '2025-03-16', '2025-03-22', 0,  NULL, false, '2025-03-15', '2025-03-18'),
(12, 'Pending Nutrition Plan',  'Awaiting coach approval',               'Custom',       2700, 195, 310, 75, ARRAY['Gluten-Free'],   NULL, NULL, 'PendingApproval', NULL,          NULL,         NULL,         NULL,         0,  NULL, false, '2025-06-14', '2025-06-14'),
(1,  'Quick Meal Prep Plan',    'Simple weekly meal prep guide',         'Custom',       1850, 155, 185, 52, NULL,                   NULL, NULL, 'PendingApproval', NULL,          NULL,         NULL,         NULL,         0,  NULL, false, '2025-06-13', '2025-06-13');


-- ==========================================
-- 25. MEALS (15 meals linked to nutrition plans)
-- ==========================================
INSERT INTO meals ("NutritionPlanId", "MealType", "Name", "Calories", "ProteinGrams", "CarbsGrams", "FatsGrams", "RecommendedTime", "CreatedByCoachId", "CreatedAt") VALUES
-- Plan 3 (User 1 AI Lean Nutrition)
(3, 'Breakfast', 'Egg White Omelette with Spinach',  320, 35, 15, 14, '07:00:00'::interval, NULL, '2025-06-01'),
(3, 'Lunch',     'Grilled Chicken & Brown Rice',     480, 45, 50, 10, '12:00:00'::interval, NULL, '2025-06-01'),
(3, 'Dinner',    'Baked Salmon with Sweet Potato',   520, 42, 48, 16, '19:00:00'::interval, NULL, '2025-06-01'),
(3, 'Snack',     'Greek Yogurt with Almonds',        180, 18, 10, 8,  '15:30:00'::interval, NULL, '2025-06-01'),
(7, 'Breakfast', 'Protein Oats with Banana',         620, 40, 80, 14, '07:30:00'::interval, NULL, '2025-04-08'),
(7, 'Lunch',     'Double Chicken Rice Bowl',          700, 60, 75, 15, '12:30:00'::interval, NULL, '2025-04-08'),
(7, 'Snack',     'Protein Shake with Oats',          400, 35, 45, 8,  '16:00:00'::interval, NULL, '2025-04-08'),
(7, 'Dinner',    'Steak with Brown Rice & Broccoli', 680, 50, 65, 20, '19:30:00'::interval, NULL, '2025-04-08'),
(7, 'Snack',     'Cottage Cheese with Avocado',      300, 25, 10, 18, '21:00:00'::interval, NULL, '2025-04-08'),

(1, 'Breakfast', 'Scrambled Eggs on Toast',           350, 25, 30, 15, '07:00:00'::interval, 1, '2024-09-03'),
(1, 'Lunch',     'Chicken Salad',                     420, 40, 20, 18, '12:00:00'::interval, 1, '2024-09-03'),
(1, 'Dinner',    'Grilled Fish with Vegetables',      450, 38, 30, 18, '19:00:00'::interval, 1, '2024-09-03'),

(5, 'Breakfast', 'Full English Protein Breakfast',    650, 45, 55, 25, '08:00:00'::interval, 2, '2024-10-28'),
(5, 'Lunch',     'Pasta with Chicken & Sauce',        700, 50, 80, 18, '13:00:00'::interval, 2, '2024-10-28'),
(5, 'Dinner',    'Salmon Rice Bowl',                   600, 40, 60, 20, '19:00:00'::interval, 2, '2024-10-28');


-- ==========================================
-- 26. MEAL INGREDIENTS (15 entries)
-- ==========================================
INSERT INTO meal_ingredients ("MealId", "IngredientId", "Quantity", "Unit") VALUES
-- Meal 1: Egg White Omelette
(1,  5,  4,   'whole'),   -- 4 eggs
(1,  10, 80,  'g'),       -- Spinach
-- Meal 2: Grilled Chicken & Rice
(2,  1,  200, 'g'),       -- Chicken
(2,  2,  150, 'g'),       -- Brown Rice
(2,  3,  100, 'g'),       -- Broccoli
-- Meal 3: Salmon with Sweet Potato
(3,  4,  180, 'g'),       -- Salmon
(3,  6,  200, 'g'),       -- Sweet Potato
-- Meal 4: Greek Yogurt with Almonds
(4,  7,  150, 'g'),       -- Greek Yogurt
(4,  11, 20,  'g'),       -- Almonds
-- Meal 5: Protein Oats with Banana
(5,  8,  80,  'g'),       -- Oats
(5,  12, 1,   'whole'),   -- Banana
-- Meal 6: Double Chicken Rice Bowl
(6,  1,  300, 'g'),       -- Chicken
(6,  2,  200, 'g'),       -- Brown Rice
-- Meal 8: Steak with Rice & Broccoli
(8,  2,  150, 'g'),       -- Brown Rice
(8,  3,  150, 'g');       -- Broccoli


-- ==========================================
-- 27. INBODY MEASUREMENTS (12 measurements for users 1 & 12)
-- ==========================================
INSERT INTO inbody_measurements ("UserId", "MeasurementDate", "Weight", "Height", "BodyFatPercentage", "MuscleMass", "BodyWaterPercentage", "VisceralFatLevel", "Bmr", "MetabolicAge", "Minerals", "Protein", "BodyType", "SegmentalTrunkLean", "SegmentalTrunkFat", "SegmentalLeftArmLean", "SegmentalLeftArmFat", "SegmentalRightArmLean", "SegmentalRightArmFat", "SegmentalLeftLegLean", "SegmentalLeftLegFat", "SegmentalRightLegLean", "SegmentalRightLegFat", "MeasuredBy", "Notes", "CreatedAt") VALUES
-- User 1: Weight loss journey (85.5 → 82.0 over 9 months)
(1, '2024-09-01 10:00:00+00', 85.50, 175.0, 24.5, 61.0, 56.0, 9,  1780, 32, 3.10, 10.50, 'Endomorph',  24.5, 5.8, 2.8, 0.9, 2.9, 0.9, 8.5, 2.2, 8.6, 2.1, 10, 'Baseline measurement',        '2024-09-01'),
(1, '2024-11-01 10:00:00+00', 84.00, 175.0, 22.8, 61.5, 57.2, 8,  1800, 30, 3.15, 10.60, 'Endomorph',  24.8, 5.4, 2.9, 0.8, 3.0, 0.8, 8.7, 2.0, 8.8, 1.9, 10, '2 months in - good progress', '2024-11-01'),
(1, '2025-01-15 10:00:00+00', 83.00, 175.0, 21.5, 62.0, 58.0, 7,  1810, 29, 3.18, 10.70, 'Mesomorph',  25.0, 5.0, 3.0, 0.7, 3.1, 0.7, 8.9, 1.8, 9.0, 1.8, 10, '4 months - body recomp',      '2025-01-15'),
(1, '2025-03-15 10:00:00+00', 82.50, 175.0, 20.2, 62.5, 58.8, 7,  1820, 28, 3.20, 10.80, 'Mesomorph',  25.2, 4.6, 3.1, 0.6, 3.2, 0.6, 9.1, 1.6, 9.2, 1.6, 10, '6 months - leaning out',      '2025-03-15'),
(1, '2025-05-15 10:00:00+00', 82.00, 175.0, 19.5, 62.8, 59.2, 6,  1830, 27, 3.22, 10.90, 'Mesomorph',  25.4, 4.3, 3.2, 0.5, 3.3, 0.5, 9.2, 1.5, 9.3, 1.4, 10, '8 months - great results',    '2025-05-15'),
(1, '2025-06-14 10:00:00+00', 82.00, 175.0, 19.0, 63.0, 59.5, 6,  1835, 27, 3.23, 10.95, 'Mesomorph',  25.5, 4.1, 3.2, 0.5, 3.3, 0.5, 9.3, 1.4, 9.4, 1.3, 7,  'Latest scan - maintaining',   '2025-06-14'),

(12, '2024-10-15 18:00:00+00', 73.00, 178.0, 14.0, 60.0, 62.5, 4, 1750, 25, 3.00, 10.00, 'Ectomorph',  22.0, 2.8, 2.5, 0.4, 2.6, 0.4, 8.0, 1.2, 8.1, 1.2, 10, 'Baseline - starting lean',    '2024-10-15'),
(12, '2024-12-15 18:00:00+00', 74.00, 178.0, 13.5, 61.2, 62.8, 4, 1770, 24, 3.05, 10.20, 'Ectomorph',  22.5, 2.7, 2.6, 0.4, 2.7, 0.4, 8.2, 1.1, 8.3, 1.1, 10, '2 months - gaining well',     '2024-12-15'),
(12, '2025-02-15 18:00:00+00', 75.00, 178.0, 13.2, 62.5, 63.0, 3, 1790, 23, 3.10, 10.40, 'Mesomorph',  23.0, 2.6, 2.8, 0.4, 2.9, 0.4, 8.5, 1.0, 8.6, 1.0, 10, '4 months - muscle up',        '2025-02-15'),
(12, '2025-04-15 18:00:00+00', 75.50, 178.0, 12.8, 63.0, 63.2, 3, 1800, 23, 3.12, 10.50, 'Mesomorph',  23.2, 2.5, 2.9, 0.3, 3.0, 0.3, 8.6, 1.0, 8.7, 1.0, 10, '6 months - lean gains',       '2025-04-15'),
(12, '2025-06-01 18:00:00+00', 76.00, 178.0, 12.5, 63.5, 63.5, 3, 1810, 22, 3.15, 10.60, 'Mesomorph',  23.5, 2.4, 3.0, 0.3, 3.1, 0.3, 8.8, 0.9, 8.9, 0.9, 7,  '8 months - excellent gains',  '2025-06-01'),
(12, '2025-06-14 18:00:00+00', 76.00, 178.0, 12.3, 63.8, 63.8, 3, 1815, 22, 3.16, 10.65, 'Mesomorph',  23.6, 2.3, 3.0, 0.3, 3.1, 0.3, 8.9, 0.9, 9.0, 0.8, 7,  'Latest scan - on track',      '2025-06-14');


-- ==========================================
-- 28. MUSCLE DEVELOPMENT SCANS (10 entries for users 1 & 12)
-- ==========================================
INSERT INTO muscle_development_scans ("UserId", "ScanDate", "ImageUrl", "ImageType", "ModelVersion", "ConfidenceScore", "MuscleDefinitionScore", "BodyFatEstimate", "WellDevelopedMuscles", "UnderdevelopedMuscles", "MuscleScores", "AsymmetryDetected", "PostureNotes", "ProcessingTimeMs") VALUES
-- User 1 scans
(1,  '2024-09-01 10:30:00+00', '/scans/user1/front_2024-09.jpg',  'Front', 'vision-v1.0', 0.850, 0.520, 24.5, ARRAY['Quadriceps', 'Calves'],            ARRAY['Chest', 'Shoulders'],     '{"chest": 0.45, "back": 0.55, "legs": 0.65, "arms": 0.50, "core": 0.48}', false, 'Slight forward lean',    1250),
(1,  '2025-01-15 10:30:00+00', '/scans/user1/front_2025-01.jpg',  'Front', 'vision-v1.1', 0.890, 0.580, 21.5, ARRAY['Quadriceps', 'Back', 'Calves'],     ARRAY['Chest'],                  '{"chest": 0.50, "back": 0.62, "legs": 0.68, "arms": 0.55, "core": 0.55}', false, 'Improved posture',       1180),
(1,  '2025-06-14 10:30:00+00', '/scans/user1/front_2025-06.jpg',  'Front', 'vision-v1.2', 0.920, 0.650, 19.0, ARRAY['Quadriceps', 'Back', 'Arms'],       ARRAY['Chest'],                  '{"chest": 0.58, "back": 0.70, "legs": 0.72, "arms": 0.65, "core": 0.62}', false, 'Good posture maintained', 1050),
(1,  '2025-06-14 10:32:00+00', '/scans/user1/back_2025-06.jpg',   'Back',  'vision-v1.2', 0.910, 0.640, 19.0, ARRAY['Lats', 'Traps'],                    ARRAY['Lower Back'],             '{"upper_back": 0.68, "lower_back": 0.52, "glutes": 0.60, "hamstrings": 0.58}', false, NULL, 1080),
(1,  '2025-06-14 10:34:00+00', '/scans/user1/side_2025-06.jpg',   'Side',  'vision-v1.2', 0.900, 0.630, 19.0, ARRAY['Quadriceps'],                       ARRAY['Glutes'],                 '{"quads": 0.72, "hamstrings": 0.58, "glutes": 0.50, "calves": 0.65}', false, 'Good anterior chain', 1100),

(12, '2024-10-15 18:30:00+00', '/scans/user12/front_2024-10.jpg', 'Front', 'vision-v1.0', 0.860, 0.450, 14.0, ARRAY['Core'],                              ARRAY['Chest', 'Shoulders', 'Arms'], '{"chest": 0.35, "back": 0.40, "legs": 0.45, "arms": 0.38, "core": 0.55}', false, 'Lean but underdeveloped', 1220),
(12, '2025-02-15 18:30:00+00', '/scans/user12/front_2025-02.jpg', 'Front', 'vision-v1.1', 0.900, 0.580, 13.2, ARRAY['Core', 'Back', 'Legs'],              ARRAY['Chest'],                  '{"chest": 0.48, "back": 0.58, "legs": 0.62, "arms": 0.52, "core": 0.60}', false, 'Visible improvement',    1150),

(12, '2025-06-14 18:34:00+00', '/scans/user12/side_2025-06.jpg',  'Side',  'vision-v1.2', 0.905, 0.660, 12.3, ARRAY['Quadriceps', 'Calves'],              ARRAY['Glutes'],                 '{"quads": 0.75, "hamstrings": 0.62, "glutes": 0.55, "calves": 0.68}', false, 'Good leg development', 1090);


-- ==========================================
-- 29. USER MILESTONES (12 entries)
-- ==========================================
INSERT INTO user_milestones ("UserId", "MilestoneId", "CurrentProgress", "IsCompleted", "CompletedAt", "CreatedAt") VALUES
-- User 1
(1,  1, 1,     true,  '2024-09-10', '2024-09-10'),
(1,  2, 7,     true,  '2024-09-17', '2024-09-10'),
(1,  3, 30,    true,  '2024-10-10', '2024-09-10'),
(1,  4, 15200, true,  '2025-04-20', '2024-09-10'),
(1,  7, 18,    false, NULL,         '2024-09-10'),
(1,  8, 48,    false, NULL,         '2024-09-10'),

(12, 1, 1,     true,  '2024-11-05', '2024-11-05'),
(12, 2, 7,     true,  '2024-11-12', '2024-11-05'),
(12, 3, 30,    true,  '2024-12-05', '2024-11-05'),
(12, 4, 20500, true,  '2025-05-10', '2024-11-05'),
(12, 8, 62,    false, NULL,         '2024-11-05'),
(12, 6, 38000, false, NULL,         '2024-11-05');


-- ==========================================
-- 30. USER ACHIEVEMENTS (10 entries)
-- ==========================================
INSERT INTO user_achievements ("UserId", "AchievementId", "CurrentProgress", "IsEarned", "EarnedAt", "IsNotified", "RewardClaimed", "RewardClaimedAt", "CreatedAt", "UpdatedAt") VALUES
-- User 1
(1,  1, 1,     true,  '2024-09-10', true,  true,  '2024-09-10', '2024-09-10', '2024-09-10'),
(1,  2, 7,     true,  '2024-09-17', true,  true,  '2024-09-17', '2024-09-10', '2024-09-17'),
(1,  3, 30,    true,  '2024-10-10', true,  true,  '2024-10-10', '2024-09-10', '2024-10-10'),
(1,  4, 3,     false, NULL,         false, false, NULL,          '2024-09-10', '2025-06-13'),
(1,  8, 15200, true,  '2025-04-20', true,  false, NULL,          '2024-09-10', '2025-04-20'),

(12, 1, 1,     true,  '2024-11-05', true,  true,  '2024-11-05', '2024-11-05', '2024-11-05'),
(12, 2, 7,     true,  '2024-11-12', true,  true,  '2024-11-12', '2024-11-05', '2024-11-12'),
(12, 3, 30,    true,  '2024-12-05', true,  true,  '2024-12-05', '2024-11-05', '2024-12-05'),
(12, 5, 3,     true,  '2025-06-01', true,  true,  '2025-06-01', '2024-11-05', '2025-06-01'),
(12, 6, 8,     false, NULL,         false, false, NULL,          '2024-11-05', '2025-06-14');


-- ==========================================
-- 31. NOTIFICATIONS (15 notifications)
-- ==========================================
INSERT INTO notifications ("UserId", "Title", "Message", "NotificationType", "Priority", "ReferenceType", "ReferenceId", "ActionUrl", "IsRead", "ReadAt", "ExpiresAt", "SentVia", "CreatedAt", "UpdatedAt") VALUES
-- User 1 notifications
(1,  'Welcome to IntelliFit!',             'Your account has been created successfully.',                            0, 'normal', NULL,           NULL, NULL,                    true,  '2024-09-01 10:05:00+00', NULL,                      ARRAY['InApp'],        '2024-09-01 10:00:00+00', '2024-09-01 10:05:00+00'),
(1,  'Subscription Activated',             'Your Premium Monthly plan is now active.',                               0, 'normal', 'Subscription', 3,    NULL,                    true,  '2025-06-01 10:05:00+00', NULL,                      ARRAY['InApp','Email'],'2025-06-01 10:00:00+00', '2025-06-01 10:05:00+00'),
(1,  'Workout Plan Ready!',               'Your AI Lean Machine plan has been approved and is ready to start.',     0, 'high',   'WorkoutPlan',  3,    '/plans/3',              true,  '2025-06-02 09:00:00+00', NULL,                      ARRAY['InApp','Push'], '2025-06-02 08:30:00+00', '2025-06-02 09:00:00+00'),
(1,  'New Personal Record!',              'You set a new PR on Bench Press: 65kg x10!',                             3, 'high',   'WorkoutLog',   8,    NULL,                    true,  '2025-06-13 08:00:00+00', NULL,                      ARRAY['InApp'],        '2025-06-13 07:30:00+00', '2025-06-13 08:00:00+00'),
(1,  'No-Show Warning',                   'You missed your booking on June 1st. Repeated no-shows may incur penalties.', 0, 'high', 'Booking', 7,  NULL,                    false, NULL,                     NULL,                      ARRAY['InApp','Email'],'2025-06-01 08:00:00+00', '2025-06-01 08:00:00+00'),
(1,  'Upcoming Booking Reminder',         'Your treadmill session is tomorrow at 7:00 AM.',                          0, 'normal', 'Booking',      5,    NULL,                    false, NULL,                     '2025-06-18 10:00:00+00', ARRAY['InApp','Push'], '2025-06-17 18:00:00+00', '2025-06-17 18:00:00+00'),
(1,  'Weekly Progress Summary',           'This week: 4 workouts, 1500 calories burned. Keep it up!',               0, 'normal', NULL,           NULL, '/progress',             false, NULL,                     NULL,                      ARRAY['InApp'],        '2025-06-15 09:00:00+00', '2025-06-15 09:00:00+00'),
(12, 'Welcome to IntelliFit!',             'Your account has been created successfully.',                            0, 'normal', NULL,           NULL, NULL,                    true,  '2024-10-15 18:05:00+00', NULL,                      ARRAY['InApp'],        '2024-10-15 18:00:00+00', '2024-10-15 18:05:00+00'),
(12, 'Subscription Expiring Soon!',        'Your Premium Quarterly plan expires on June 30. Renew now to keep access!', 4, 'urgent', 'Subscription', 5, '/subscriptions/renew', false, NULL,                     '2025-07-01 00:00:00+00', ARRAY['InApp','Email','Push'], '2025-06-15 09:00:00+00', '2025-06-15 09:00:00+00'),
(12, 'Deadlift PR!',                       'Congratulations! New deadlift PR: 150kg x3!',                           3, 'high',   'WorkoutLog',   14,   NULL,                    true,  '2025-06-10 19:30:00+00', NULL,                      ARRAY['InApp'],        '2025-06-10 19:00:00+00', '2025-06-10 19:30:00+00'),
(12, 'Coach Session Completed',            'Your session with Emily Davis has been completed. Leave a review!',     0, 'normal', 'Booking',      10,   '/reviews/new',          false, NULL,                     '2025-06-25 00:00:00+00', ARRAY['InApp'],        '2025-05-25 20:30:00+00', '2025-05-25 20:30:00+00'),
(12, 'Achievement Unlocked: Mass Builder', 'You gained 3kg of muscle mass! Token reward: 15 tokens.',               3, 'high',   'Achievement',  5,    NULL,                    true,  '2025-06-01 19:00:00+00', NULL,                      ARRAY['InApp','Push'], '2025-06-01 18:30:00+00', '2025-06-01 19:00:00+00'),
(12, 'Plan Pending Review',                'Your workout plan "Pending Coach Review" is awaiting approval.',        0, 'normal', 'WorkoutPlan',  9,    NULL,                    false, NULL,                     NULL,                      ARRAY['InApp'],        '2025-06-14 18:00:00+00', '2025-06-14 18:00:00+00'),
(12, 'Upcoming Booking',                   'Your cable work session is on June 17 at 6:00 PM.',                     0, 'normal', 'Booking',      13,   NULL,                    false, NULL,                     '2025-06-17 20:00:00+00', ARRAY['InApp','Push'], '2025-06-16 18:00:00+00', '2025-06-16 18:00:00+00'),
(12, 'AI Booking Suggestion',              'Based on your plan, we recommend a squat session on June 22.',          0, 'normal', 'Booking',      15,   NULL,                    false, NULL,                     '2025-06-22 20:00:00+00', ARRAY['InApp'],        '2025-06-15 10:00:00+00', '2025-06-15 10:00:00+00');


-- ==========================================
-- 32. ACTIVITY FEEDS (15 entries)
-- ==========================================
INSERT INTO activity_feeds ("UserId", "ActivityType", "Title", "Description", "ReferenceType", "ReferenceId", "Icon", "CreatedAt") VALUES
-- User 1
(1,  'Achievement', 'Completed First Workout!',          'John achieved the First Workout milestone',         'Milestone',   1,  '🎯', '2024-09-10 09:00:00+00'),
(1,  'Achievement', 'Week Warrior Unlocked!',             'John completed 7 consecutive workout days',         'Milestone',   2,  '🔥', '2024-09-17 09:00:00+00'),
(1,  'Achievement', 'Month Champion!',                    'John completed 30 days of training',                'Milestone',   3,  '👑', '2024-10-10 09:00:00+00'),
(1,  'Workout',     'New Bench Press PR!',                'John hit 65kg x10 on bench press',                  'WorkoutLog',  8,  '💪', '2025-06-13 07:30:00+00'),
(1,  'Booking',     'Booked Coach Session',               'John booked a session with Sarah Johnson',          'Booking',     6,  '📅', '2025-06-14 09:00:00+00'),
(1,  'Plan',        'Started AI Lean Machine Plan',       'John activated a new AI-generated workout plan',    'WorkoutPlan', 3,  '🤖', '2025-06-02 08:00:00+00'),
(1,  'Achievement', 'Calorie Crusher Unlocked!',          'John burned 10,000 total calories',                 'Milestone',   4,  '💪', '2025-04-20 09:00:00+00'),

(12, 'Achievement', 'Completed First Workout!',           'Alex achieved the First Workout milestone',         'Milestone',   7,  '🎯', '2024-11-05 18:30:00+00'),
(12, 'Achievement', 'Week Warrior Unlocked!',             'Alex completed 7 consecutive workout days',         'Milestone',   8,  '🔥', '2024-11-12 18:30:00+00'),
(12, 'Workout',     'Bench Press PR: 92.5kg!',            'Alex set a new bench press record of 92.5kg x5',   'WorkoutLog',  11, '💪', '2025-02-15 19:00:00+00'),
(12, 'Workout',     'Deadlift PR: 150kg!',                'Alex pulled 150kg for 3 reps - new personal best', 'WorkoutLog',  14, '💪', '2025-06-10 19:00:00+00'),
(12, 'Achievement', 'Mass Builder Achieved!',             'Alex gained 3kg of muscle mass',                    'Achievement', 5,  '🏋', '2025-06-01 18:30:00+00'),
(12, 'Booking',     'Booked Equipment Session',           'Alex booked cable crossover for June 17',           'Booking',     13, '📅', '2025-06-15 10:00:00+00'),
(12, 'Plan',        'Started AI Power Builder Plan',      'Alex activated a new AI-generated workout plan',    'WorkoutPlan', 7,  '🤖', '2025-04-10 18:00:00+00'),
(12, 'Booking',     'Coach Session with Emily Davis',     'Alex completed hypertrophy coaching session',       'Booking',     10, '👨‍🏫', '2025-05-25 20:00:00+00');


-- ==========================================
-- 33. COACH REVIEWS (10 reviews from users 1 & 12)
-- ==========================================
INSERT INTO coach_reviews ("UserId", "CoachId", "BookingId", "Rating", "ReviewText", "IsAnonymous", "CreatedAt", "UpdatedAt") VALUES
-- User 1 reviews
(1,  1, 3,    5, 'Sarah is an excellent coach! She helped me perfect my squat form and kept me motivated throughout the session.', false, '2025-06-05 11:00:00+00', '2025-06-05 11:00:00+00'),
(1,  1, NULL, 4, 'Great strength coaching session. Would recommend for anyone looking to improve their lifts.',                    false, '2024-10-20 09:00:00+00', '2024-10-20 09:00:00+00'),
(1,  2, NULL, 5, 'Emily is incredibly knowledgeable about powerlifting. Her cues helped me break through a plateau.',              false, '2025-01-15 09:00:00+00', '2025-01-15 09:00:00+00'),
(1,  3, NULL, 4, 'Robert has great energy and pushes you to your limits in a good way.',                                           false, '2024-12-01 09:00:00+00', '2024-12-01 09:00:00+00'),

(12, 2, 10,   5, 'Emily is the best coach I have had. Her hypertrophy programming is top-notch and she explains everything clearly.', false, '2025-05-26 09:00:00+00', '2025-05-26 09:00:00+00'),
(12, 1, 11,   5, 'Sarah helped me with form checks and identified issues with my deadlift stance. Very professional.',              false, '2025-06-11 09:00:00+00', '2025-06-11 09:00:00+00'),
(12, 2, NULL, 4, 'Great session focusing on progressive overload. Recommended adjustments to my program that are working.',          false, '2025-03-01 09:00:00+00', '2025-03-01 09:00:00+00'),
(12, 3, NULL, 3, 'Good workout but I felt the session was a bit rushed. Would have liked more time for form correction.',             true,  '2025-02-01 09:00:00+00', '2025-02-01 09:00:00+00'),
(12, 1, NULL, 5, 'Two sessions in with Sarah and already seeing improvements in my squat depth.',                                    false, '2024-12-20 09:00:00+00', '2024-12-20 09:00:00+00'),
(12, 2, NULL, 5, 'Emily created a deload week program that was exactly what I needed. Thoughtful coaching.',                         false, '2025-03-20 09:00:00+00', '2025-03-20 09:00:00+00');


-- ==========================================
-- 34. CHAT MESSAGES (12 messages)
-- ==========================================
INSERT INTO chat_messages ("SenderId", "ReceiverId", "ConversationId", "Message", "IsRead", "ReadAt", "IsPermanent", "ExpiresAt", "CreatedAt") VALUES
-- User 1 ↔ Coach Sarah (ID 7)
(1,  7, 'conv-1-7',  'Hi Sarah, I wanted to ask about my squat form. Should I go below parallel?',    true,  '2025-06-05 09:10:00+00', true,  '2025-12-31 00:00:00+00', '2025-06-05 09:05:00+00'),
(7,  1, 'conv-1-7',  'Hi John! Yes, going below parallel is great for quad development. Make sure your heels stay flat.', true, '2025-06-05 09:15:00+00', true, '2025-12-31 00:00:00+00', '2025-06-05 09:12:00+00'),
(1,  7, 'conv-1-7',  'Thanks! I will focus on that in my next session.',                                true,  '2025-06-05 09:25:00+00', true,  '2025-12-31 00:00:00+00', '2025-06-05 09:20:00+00'),
(7,  1, 'conv-1-7',  'Great! Let me know how it goes. See you on the 20th!',                            false, NULL,                      true,  '2025-12-31 00:00:00+00', '2025-06-05 09:30:00+00'),


(12, 8, 'conv-12-8', 'Hey Emily, my lower back has been a bit sore after deadlifts. Any advice?',       true,  '2025-05-26 10:15:00+00', true,  '2025-12-31 00:00:00+00', '2025-05-26 10:00:00+00'),
(8, 12, 'conv-12-8', 'Hi Alex! Lower back soreness after deadlifts can mean your hips are rising too fast. Try starting with your hips slightly higher.',  true, '2025-05-26 10:30:00+00', true, '2025-12-31 00:00:00+00', '2025-05-26 10:20:00+00'),
(12, 8, 'conv-12-8', 'I will try that next session. Also, should I add Romanian deadlifts to my routine?', true,  '2025-05-26 11:00:00+00', true,  '2025-12-31 00:00:00+00', '2025-05-26 10:45:00+00'),
(8, 12, 'conv-12-8', 'Absolutely! RDLs are perfect for hamstring development and will help your conventional deadlift. Start light and focus on the stretch.', true, '2025-05-26 11:15:00+00', true, '2025-12-31 00:00:00+00', '2025-05-26 11:05:00+00'),

(12, 7, 'conv-12-7', 'Hi Sarah, thanks for the form check session! My deadlift already feels better.',  true,  '2025-06-11 10:00:00+00', true,  '2025-12-31 00:00:00+00', '2025-06-11 09:30:00+00'),
(7, 12, 'conv-12-7', 'Glad to hear it Alex! Remember the cue: chest up, hips back. See you next time!', false, NULL,                      true,  '2025-12-31 00:00:00+00', '2025-06-11 10:15:00+00'),

(1,  8, 'conv-1-8',  'Hi Emily, I heard great things about your powerlifting coaching. Can I book a session for July?', false, NULL, true, '2025-12-31 00:00:00+00', '2025-06-14 20:00:00+00'),
(8,  1, 'conv-1-8',  'Hi John! Of course, I have availability on Monday and Thursday evenings in July. Which works better?', false, NULL, true, '2025-12-31 00:00:00+00', '2025-06-15 08:00:00+00');


-- ==========================================
-- 35. AI CHAT LOGS (12 entries)
-- ==========================================
INSERT INTO ai_chat_logs ("UserId", "SessionId", "MessageType", "MessageContent", "AiModel", "TokensUsed", "ResponseTimeMs", "ContextData", "CreatedAt") VALUES
-- User 1 session 1
(1, 1, 'Question', 'How can I improve my squat form?', 'gpt-4-mini', 5, NULL, NULL, '2025-05-20 12:00:00+00'),
(1, 1, 'Response', 'To improve your squat form: 1) Keep your chest up and core braced 2) Drive your knees out over your toes 3) Break at the hips first 4) Go to at least parallel depth 5) Keep weight on mid-foot.', 'gpt-4-mini', 15, 850, NULL, '2025-05-20 12:00:02+00'),
-- User 1 session 2
(1, 2, 'Question', 'What should I eat after a morning workout for weight loss?', 'gpt-4-mini', 6, NULL, NULL, '2025-06-10 10:00:00+00'),
(1, 2, 'Response', 'After a morning workout for weight loss: 1) Eat within 30-60 minutes 2) Focus on lean protein (30-40g) like eggs or chicken 3) Add moderate carbs like oats or sweet potato 4) Keep fats low post-workout 5) Stay hydrated.', 'gpt-4-mini', 18, 920, NULL, '2025-06-10 10:00:03+00'),
(1, 2, 'Question', 'Is intermittent fasting good while on a weight loss program?', 'gpt-4-mini', 7, NULL, NULL, '2025-06-10 10:05:00+00'),
(1, 2, 'Response', 'Intermittent fasting can be effective for weight loss but is not required. It works by making it easier to control calorie intake. If you work out in the morning, consider a 16:8 window starting with your post-workout meal.', 'gpt-4-mini', 20, 1050, NULL, '2025-06-10 10:05:03+00'),

(12, 3, 'Question', 'I have mild lower back pain. What exercises should I avoid?', 'gpt-4-mini', 6, NULL, '{"medical": "mild lower back pain"}', '2025-04-10 20:00:00+00'),
(12, 3, 'Response', 'With mild lower back pain: 1) Avoid heavy good mornings and hyperextensions 2) Be cautious with conventional deadlifts - consider sumo or trap bar 3) Use belt for heavy lifts 4) Strengthen core with planks and dead bugs 5) Consult a physiotherapist if pain persists.', 'gpt-4-mini', 22, 980, NULL, '2025-04-10 20:00:03+00'),

(12, 4, 'Question', 'How much protein should I eat daily for muscle gain?', 'gpt-4-mini', 5, NULL, NULL, '2025-05-15 21:00:00+00'),
(12, 4, 'Response', 'For muscle gain at your weight (76kg), aim for 1.6-2.2g of protein per kg of bodyweight. That is 120-170g of protein daily. Spread this across 4-5 meals for optimal muscle protein synthesis.', 'gpt-4-mini', 18, 900, '{"weight": 76, "goal": "muscle_gain"}', '2025-05-15 21:00:03+00'),
(12, 4, 'Question', 'Should I take creatine?', 'gpt-4-mini', 4, NULL, NULL, '2025-05-15 21:05:00+00'),
(12, 4, 'Response', 'Yes, creatine monohydrate is one of the most researched and effective supplements. Take 5g daily (no need to load). It helps with strength, power, and muscle recovery. Take it at any time of day with water.', 'gpt-4-mini', 16, 870, NULL, '2025-05-15 21:05:03+00');


-- ==========================================
-- 36. AI PROGRAM GENERATIONS (10 entries)
-- ==========================================
INSERT INTO ai_program_generations ("UserId", "ProgramType", "WorkoutPlanId", "NutritionPlanId", "InputPrompt", "GeneratedPlan", "AiModel", "UserContext", "TokensUsed", "GenerationTimeMs", "QualityRating", "CreatedAt") VALUES
-- User 1
(1,  'Workout',   3,    NULL, 'Create a 6-week weight loss program for intermediate male, 82kg, targeting 75kg', '{"weeks": 6, "days_per_week": 5, "exercises": [...]}', 'flan-t5-small-v3', '{"weight": 82, "height": 175, "level": "Intermediate"}', 250, 3500, 4, '2025-06-01 08:00:00+00'),
(1,  'Nutrition',  NULL, 3,   'Create a calorie deficit nutrition plan for 82kg male targeting 75kg',              '{"daily_calories": 1900, "meals": 4}',                  'gpt-4-mini',       '{"weight": 82, "target": 75, "goal": "weight_loss"}',    180, 2800, 4, '2025-06-01 08:30:00+00'),
(1,  'Workout',   1,    NULL, 'Create a beginner 4-week fat-burning intro program',                                '{"weeks": 4, "days_per_week": 3}',                      'flan-t5-small-v2', '{"weight": 85.5, "level": "Beginner"}',                   200, 3200, 3, '2024-09-03 08:00:00+00'),
(1,  'Nutrition',  NULL, 1,   'Create a moderate calorie deficit plan for 85kg male',                               '{"daily_calories": 1800, "meals": 3}',                  'gpt-4-mini',       '{"weight": 85.5}',                                        150, 2500, 4, '2024-09-03 08:30:00+00'),

(12, 'Workout',   7,    NULL, 'Create an 8-week muscle building program for intermediate male, 76kg, targeting 82kg, mild lower back pain', '{"weeks": 8, "days_per_week": 5, "exercises": [...]}', 'flan-t5-small-v3', '{"weight": 76, "height": 178, "level": "Intermediate", "conditions": "mild lower back pain"}', 280, 3800, 5, '2025-04-08 18:00:00+00'),
(12, 'Nutrition',  NULL, 7,   'Create a muscle gain nutrition plan for 76kg male targeting 82kg, mild lower back pain', '{"daily_calories": 2900, "meals": 5}', 'gpt-4-mini', '{"weight": 76, "target": 82, "goal": "muscle_gain"}', 200, 2900, 5, '2025-04-08 18:30:00+00'),
(12, 'Workout',   5,    NULL, 'Create a beginner 6-week muscle building program',                                   '{"weeks": 6, "days_per_week": 3}',                      'flan-t5-small-v2', '{"weight": 73, "level": "Beginner"}',                     220, 3100, 3, '2024-10-28 18:00:00+00'),
(12, 'Nutrition',  NULL, 5,   'Create a calorie surplus plan for 73kg beginner',                                     '{"daily_calories": 2500, "meals": 3}',                  'gpt-4-mini',       '{"weight": 73}',                                          160, 2600, 4, '2024-10-28 18:30:00+00'),

(1,  'Workout',   NULL, NULL, 'What exercises are best for core stability with a desk job?',                        '{"recommendations": ["Plank", "Dead Bug", "Bird Dog"]}', 'gpt-4-mini',    '{"occupation": "desk job"}',                              100, 1800, NULL, '2025-05-20 12:00:00+00'),
(12, 'Workout',   NULL, NULL, 'Recommend a deload week structure for intermediate lifter',                           '{"deload_approach": "reduce volume 40%, keep intensity"}', 'gpt-4-mini',   '{"level": "Intermediate", "context": "after 6 weeks hypertrophy"}', 120, 2000, NULL, '2025-03-14 18:00:00+00');


-- ==========================================
-- 37. AI WORKFLOW JOBS (10 entries)
-- ==========================================
INSERT INTO ai_workflow_jobs ("UserId", "JobType", "Status", "N8nWorkflowId", "RequestPayload", "ResponsePayload", "ErrorMessage", "CreatedAt", "CompletedAt") VALUES
(1,  'WorkoutPlanGeneration',   'Completed',  'wf-001', '{"prompt": "weight loss plan"}',     '{"plan_id": 3}',             NULL,                          '2025-06-01 08:00:00+00', '2025-06-01 08:01:00+00'),
(1,  'NutritionPlanGeneration', 'Completed',  'wf-002', '{"prompt": "cutting nutrition"}',    '{"plan_id": 3}',             NULL,                          '2025-06-01 08:30:00+00', '2025-06-01 08:31:00+00'),
(12, 'WorkoutPlanGeneration',   'Completed',  'wf-003', '{"prompt": "muscle building plan"}', '{"plan_id": 7}',             NULL,                          '2025-04-08 18:00:00+00', '2025-04-08 18:01:00+00'),
(12, 'NutritionPlanGeneration', 'Completed',  'wf-004', '{"prompt": "bulking nutrition"}',    '{"plan_id": 7}',             NULL,                          '2025-04-08 18:30:00+00', '2025-04-08 18:31:00+00'),
(1,  'MuscleScanAnalysis',      'Completed',  'wf-005', '{"image": "/scans/user1/front.jpg"}','{"score": 0.65}',            NULL,                          '2025-06-14 10:30:00+00', '2025-06-14 10:30:02+00'),
(12, 'MuscleScanAnalysis',      'Completed',  'wf-006', '{"image": "/scans/user12/front.jpg"}','{"score": 0.68}',           NULL,                          '2025-06-14 18:30:00+00', '2025-06-14 18:30:02+00'),
(1,  'WorkoutPlanGeneration',   'Failed',     'wf-007', '{"prompt": "advanced powerlifting"}','{}',                          'Model timeout after 30s',     '2025-06-13 20:00:00+00', '2025-06-13 20:00:30+00'),
(12, 'ProgressReport',          'Completed',  'wf-008', '{"period": "last_3_months"}',        '{"summary": "excellent progress"}', NULL,                    '2025-06-14 19:00:00+00', '2025-06-14 19:00:05+00'),
(1,  'ChatResponse',            'Completed',  'wf-009', '{"question": "squat form"}',         '{"response": "..."}',        NULL,                          '2025-05-20 12:00:00+00', '2025-05-20 12:00:01+00'),
(12, 'WorkoutPlanGeneration',   'Processing', 'wf-010', '{"prompt": "new hypertrophy phase"}','{}',                          NULL,                          '2025-06-15 10:30:00+00', NULL);


-- ==========================================
-- 38. AUDIT LOGS (10 entries)
-- ==========================================
INSERT INTO audit_logs ("UserId", "Action", "TableName", "RecordId", "OldValues", "NewValues", "IpAddress", "UserAgent", "CreatedAt") VALUES
(11, 'INSERT', 'users',             12, NULL, '{"Email": "alex.martinez@intellifit.com", "Name": "Alex Martinez"}', '192.168.1.100', 'Mozilla/5.0', '2024-10-15 10:00:00+00'),
(1,  'UPDATE', 'member_profiles',   1,  '{"CurrentWeight": 85.50}', '{"CurrentWeight": 82.00}',                    '192.168.1.101', 'Mozilla/5.0', '2025-06-14 10:00:00+00'),
(11, 'UPDATE', 'equipment',         12, '{"Status": 0}', '{"Status": 1}',                                           '192.168.1.100', 'Mozilla/5.0', '2025-06-10 09:00:00+00'),
(7,  'INSERT', 'workout_plans',     3,  NULL, '{"PlanName": "AI Lean Machine", "UserId": 1}',                        '192.168.1.102', 'Mozilla/5.0', '2025-06-01 08:00:00+00'),
(8,  'UPDATE', 'workout_plans',     7,  '{"Status": "PendingApproval"}', '{"Status": "Active"}',                     '192.168.1.103', 'Mozilla/5.0', '2025-04-10 18:05:00+00'),
(1,  'INSERT', 'bookings',          5,  NULL, '{"BookingType": "Equipment", "EquipmentId": 1}',                      '192.168.1.101', 'Mozilla/5.0', '2025-06-15 08:00:00+00'),
(12, 'INSERT', 'bookings',          15, NULL, '{"BookingType": "Equipment", "EquipmentId": 3, "IsAiGenerated": true}','192.168.1.104','Mozilla/5.0', '2025-06-15 10:00:00+00'),
(10, 'UPDATE', 'users',             5,  '{"IsActive": true}', '{"IsActive": false}',                                 '192.168.1.105', 'Mozilla/5.0', '2025-03-01 15:00:00+00'),
(11, 'UPDATE', 'subscription_plans',10, '{"IsActive": false}', '{"IsActive": true}',                                 '192.168.1.100', 'Mozilla/5.0', '2024-06-01 10:00:00+00'),
(12, 'INSERT', 'coach_reviews',     5,  NULL, '{"CoachId": 2, "Rating": 5}',                                          '192.168.1.104', 'Mozilla/5.0', '2025-05-26 09:00:00+00');


-- ==========================================
-- LINK SUBSCRIPTIONS TO PAYMENTS
-- ==========================================
UPDATE user_subscriptions us
SET "PaymentId" = p."PaymentId"
FROM payments p
WHERE us."UserId" = p."UserId"
  AND p."PaymentType" = 'Subscription'
  AND p."Status" = 1
  AND us."PaymentId" IS NULL
  AND p."CreatedAt"::date = us."StartDate"::date;


-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 'member_profiles',       COUNT(*) FROM member_profiles
UNION ALL SELECT 'coach_profiles',        COUNT(*) FROM coach_profiles
UNION ALL SELECT 'subscription_plans',    COUNT(*) FROM subscription_plans
UNION ALL SELECT 'token_packages',        COUNT(*) FROM token_packages
UNION ALL SELECT 'equipment_categories',  COUNT(*) FROM equipment_categories
UNION ALL SELECT 'equipment',             COUNT(*) FROM equipment
UNION ALL SELECT 'exercises',             COUNT(*) FROM exercises
UNION ALL SELECT 'ingredients',           COUNT(*) FROM ingredients
UNION ALL SELECT 'progress_milestones',   COUNT(*) FROM progress_milestones
UNION ALL SELECT 'achievements',          COUNT(*) FROM achievements
UNION ALL SELECT 'user_subscriptions',    COUNT(*) FROM user_subscriptions
UNION ALL SELECT 'payments',              COUNT(*) FROM payments
UNION ALL SELECT 'token_transactions',    COUNT(*) FROM token_transactions
UNION ALL SELECT 'bookings',              COUNT(*) FROM bookings
UNION ALL SELECT 'workout_templates',     COUNT(*) FROM workout_templates
UNION ALL SELECT 'workout_template_ex',   COUNT(*) FROM workout_template_exercises
UNION ALL SELECT 'workout_plans',         COUNT(*) FROM workout_plans
UNION ALL SELECT 'workout_plan_exercises',COUNT(*) FROM workout_plan_exercises
UNION ALL SELECT 'workout_logs',          COUNT(*) FROM workout_logs
UNION ALL SELECT 'workout_log_exercises', COUNT(*) FROM workout_log_exercises
UNION ALL SELECT 'workout_feedbacks',     COUNT(*) FROM workout_feedbacks
UNION ALL SELECT 'user_strength_profiles',COUNT(*) FROM user_strength_profiles
UNION ALL SELECT 'nutrition_plans',       COUNT(*) FROM nutrition_plans
UNION ALL SELECT 'meals',                 COUNT(*) FROM meals
UNION ALL SELECT 'meal_ingredients',      COUNT(*) FROM meal_ingredients
UNION ALL SELECT 'inbody_measurements',   COUNT(*) FROM inbody_measurements
UNION ALL SELECT 'muscle_dev_scans',      COUNT(*) FROM muscle_development_scans
UNION ALL SELECT 'user_milestones',       COUNT(*) FROM user_milestones
UNION ALL SELECT 'user_achievements',     COUNT(*) FROM user_achievements
UNION ALL SELECT 'notifications',         COUNT(*) FROM notifications
UNION ALL SELECT 'activity_feeds',        COUNT(*) FROM activity_feeds
UNION ALL SELECT 'coach_reviews',         COUNT(*) FROM coach_reviews
UNION ALL SELECT 'chat_messages',         COUNT(*) FROM chat_messages
UNION ALL SELECT 'ai_chat_logs',          COUNT(*) FROM ai_chat_logs
UNION ALL SELECT 'ai_program_generations',COUNT(*) FROM ai_program_generations
UNION ALL SELECT 'ai_workflow_jobs',      COUNT(*) FROM ai_workflow_jobs
UNION ALL SELECT 'audit_logs',            COUNT(*) FROM audit_logs
ORDER BY table_name;
