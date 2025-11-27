-- IntelliFit Database Seed Data - PostgreSQL Version
-- Part 1: First 15 Tables with 10 Rows Each
-- ==========================================
-- NOTE: This file uses the ACTUAL database schema with PascalCase column names
-- All foreign key references use proper IDs from the database

-- TABLE 1: Users (10 rows)
-- ==========================================
INSERT INTO users ("Email", "PasswordHash", "Name", "Phone", "DateOfBirth", "Gender", "Role", "TokenBalance", "IsActive", "EmailVerified", "CreatedAt", "UpdatedAt") VALUES
('john.doe@intellifit.com', '$2a$11$hashedpassword1', 'John Doe', '+1234567890', '1995-05-15', 0, 0, 50, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sarah.johnson@intellifit.com', '$2a$11$hashedpassword2', 'Sarah Johnson', '+1234567891', '1990-03-22', 1, 1, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('michael.smith@intellifit.com', '$2a$11$hashedpassword3', 'Michael Smith', '+1234567892', '1992-08-18', 0, 0, 75, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('emily.davis@intellifit.com', '$2a$11$hashedpassword4', 'Emily Davis', '+1234567893', '1988-11-30', 1, 1, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('david.wilson@intellifit.com', '$2a$11$hashedpassword5', 'David Wilson', '+1234567894', '1998-03-10', 0, 0, 30, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('jessica.brown@intellifit.com', '$2a$11$hashedpassword6', 'Jessica Brown', '+1234567895', '1996-11-05', 1, 0, 100, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('robert.taylor@intellifit.com', '$2a$11$hashedpassword7', 'Robert Taylor', '+1234567896', '1985-07-14', 0, 1, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('lisa.anderson@intellifit.com', '$2a$11$hashedpassword8', 'Lisa Anderson', '+1234567897', '1994-07-18', 1, 0, 25, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('james.martinez@intellifit.com', '$2a$11$hashedpassword9', 'James Martinez', '+1234567898', '1982-01-25', 0, 2, 0, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('amanda.garcia@intellifit.com', '$2a$11$hashedpassword10', 'Amanda Garcia', '+1234567899', '1997-12-08', 1, 0, 60, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- TABLE 2: Member Profiles (6 rows linked to member users)
-- ==========================================
-- Note: UserId must reference actual user IDs from users table where Role = 0 (Member)
-- This example assumes you'll get actual user IDs after inserting users
INSERT INTO member_profiles ("UserId", "FitnessGoal", "MedicalConditions", "FitnessLevel", "CurrentWeight", "TargetWeight", "Height", "TotalWorkoutsCompleted", "TotalCaloriesBurned", "Achievements", "CreatedAt", "UpdatedAt") VALUES
-- Replace <USER_ID_X> with actual user IDs from your users table where Role = 0
(<USER_ID_1>, 'Weight Loss', NULL, 'Beginner', 85.0, 75.0, 180.0, 15, 4500, '["First Workout"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(<USER_ID_2>, 'Muscle Gain', 'Asthma', 'Intermediate', 78.0, 85.0, 175.0, 42, 12600, '["Week Warrior", "Month Champion"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(<USER_ID_3>, 'General Fitness', NULL, 'Beginner', 72.0, 70.0, 170.0, 8, 2400, '["First Workout"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(<USER_ID_4>, 'Weight Loss', NULL, 'Intermediate', 60.0, 55.0, 165.0, 28, 8400, '["Week Warrior"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(<USER_ID_5>, 'Endurance', 'Previous knee injury', 'Beginner', 65.0, 63.0, 168.0, 12, 3600, '["First Workout"]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(<USER_ID_6>, 'Flexibility', NULL, 'Beginner', 58.0, 58.0, 162.0, 6, 1800, '[]'::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- TABLE 3: Coach Profiles (3 rows linked to coach users)
-- ==========================================
-- Note: UserId must reference actual user IDs from users table where Role = 1 (Coach)
INSERT INTO coach_profiles ("UserId", "Specialization", "Certifications", "ExperienceYears", "Bio", "HourlyRate", "Rating", "TotalReviews", "TotalClients", "IsAvailable", "CreatedAt", "UpdatedAt") VALUES
-- Replace <COACH_USER_ID_X> with actual user IDs from your users table where Role = 1
(<COACH_USER_ID_1>, 'Strength Training & Weight Loss', ARRAY['NASM-CPT', 'CSCS', 'Precision Nutrition L1'], 5, 'Certified personal trainer specializing in strength training and sustainable weight loss programs', 75.00, 4.8, 45, 28, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(<COACH_USER_ID_2>, 'Powerlifting & Muscle Building', ARRAY['CSCS', 'USATF Level 1', 'ISSA'], 8, 'Former competitive powerlifter specializing in strength development and hypertrophy training', 85.00, 4.9, 67, 35, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(<COACH_USER_ID_3>, 'CrossFit & Athletic Performance', ARRAY['CrossFit L2', 'NASM-CPT', 'USAW L1'], 7, 'CrossFit Level 2 trainer with expertise in Olympic lifting and sports performance', 90.00, 4.7, 52, 41, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- TABLE 4: Subscription Plans (10 rows)
-- ==========================================
INSERT INTO subscription_plans ("PlanName", "Description", "Price", "DurationDays", "TokensIncluded", "Features", "MaxBookingsPerDay", "IsPopular", "IsActive", "CreatedAt", "UpdatedAt") VALUES
('Basic Monthly', 'Access to gym facilities and basic equipment', 49.99, 30, 20, '{"features": ["Gym Access", "Equipment Use", "Locker Room"]}'::jsonb, 2, false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Standard Monthly', 'Includes group classes and nutrition consultation', 79.99, 30, '["Gym Access", "Group Classes", "Nutrition Consultation", "Progress Tracking"]', 10, true, false, true, NOW(), NOW()),
('Premium Monthly', 'Full access with personal training sessions', 129.99, 30, '["Gym Access", "Group Classes", "Personal Training", "Nutrition Plan", "Workout Plan", "Priority Booking"]', 20, true, true, true, NOW(), NOW()),
('Basic Quarterly', '3-month basic membership with discount', 134.99, 90, '["Gym Access", "Equipment Use", "Locker Room"]', 5, false, false, true, NOW(), NOW()),
('Standard Quarterly', '3-month standard membership', 214.99, 90, '["Gym Access", "Group Classes", "Nutrition Consultation", "Progress Tracking"]', 10, true, false, true, NOW(), NOW()),
('Premium Quarterly', '3-month premium with personal training', 349.99, 90, '["Gym Access", "Group Classes", "Personal Training", "Nutrition Plan", "Workout Plan", "Priority Booking"]', 20, true, true, true, NOW(), NOW()),
('Basic Annual', 'Full year basic membership with best value', 499.99, 365, '["Gym Access", "Equipment Use", "Locker Room", "Free Guest Pass"]', 5, false, false, true, NOW(), NOW()),
('Standard Annual', 'Full year standard membership', 799.99, 365, '["Gym Access", "Group Classes", "Nutrition Consultation", "Progress Tracking", "Free Guest Pass"]', 10, true, false, true, NOW(), NOW()),
('Premium Annual', 'Full year premium with all benefits', 1299.99, 365, '["Gym Access", "Group Classes", "Personal Training", "Nutrition Plan", "Workout Plan", "Priority Booking", "Free Guest Pass"]', 20, true, true, true, NOW(), NOW()),
('Student Monthly', 'Special student pricing with valid ID', 39.99, 30, '["Gym Access", "Group Classes", "Student Lounge"]', 8, false, false, true, NOW(), NOW());

-- TABLE 5: User Subscriptions (10 rows)
-- ==========================================
-- Note: Replace <USER_ID_X> and <PLAN_ID_X> with actual IDs from your database
INSERT INTO user_subscriptions ("UserId", "PlanId", "StartDate", "EndDate", "Status", "PaymentId", "AutoRenew", "RenewalReminderSent", "CreatedAt", "UpdatedAt") VALUES
(<USER_ID_1>, <PLAN_ID_3>, '2024-11-01', '2024-11-30', 0, NULL, true, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 2, '2024-10-15', '2024-11-14', 'Active', NULL, false, false, NOW(), NOW()),
(5, 1, '2024-11-10', '2024-12-09', 'Active', NULL, true, false, NOW(), NOW()),
(6, 3, '2024-09-01', '2024-11-30', 'Active', NULL, true, false, NOW(), NOW()),
(8, 2, '2024-11-05', '2024-12-04', 'Active', NULL, false, false, NOW(), NOW()),
(10, 1, '2024-08-01', '2024-08-30', 'Expired', NULL, false, true, NOW(), NOW()),
(1, 3, '2024-11-15', '2024-12-14', 'Active', NULL, true, false, NOW(), NOW()),
(3, 9, '2024-01-01', '2024-12-31', 'Active', NULL, true, false, NOW(), NOW()),
(5, 2, '2024-10-20', '2024-11-19', 'Active', NULL, false, false, NOW(), NOW()),
(6, 1, '2024-11-01', '2024-11-30', 'Active', NULL, true, false, NOW(), NOW());

-- TABLE 6: Token Packages (10 rows)
-- ==========================================
INSERT INTO token_packages ("PackageName", "TokenAmount", "Price", "BonusTokens", "Description", "IsActive", "UpdatedAt") VALUES
('Starter Pack', 50, 9.99, 0, 'Perfect for trying out AI features', true, CURRENT_TIMESTAMP),
('Basic Pack', 'Good for casual users', 100, 17.99, 10, true, NOW(), NOW()),
('Popular Pack', 'Most popular choice', 250, 39.99, 50, true, NOW(), NOW()),
('Pro Pack', 'For serious fitness enthusiasts', 500, 69.99, 100, true, NOW(), NOW()),
('Ultimate Pack', 'Best value for power users', 1000, 119.99, 250, true, NOW(), NOW()),
('Mini Pack', 'Quick top-up', 25, 4.99, 0, true, NOW(), NOW()),
('Monthly Bundle', 'Recurring monthly tokens', 300, 44.99, 75, true, NOW(), NOW()),
('Quarterly Bundle', 'Best for regular users', 1000, 139.99, 300, true, NOW(), NOW()),
('Elite Pack', 'Premium tier with maximum tokens', 2000, 199.99, 500, true, NOW(), NOW()),
('Trial Pack', 'New user trial offer', 10, 0.99, 5, true, NOW(), NOW());

-- TABLE 7: Token Transactions (10 rows)
-- ==========================================
-- Note: Replace <USER_ID_X> with actual IDs, TransactionType: 0=Purchase, 1=Deduction, 2=Refund, 3=Bonus
INSERT INTO token_transactions ("UserId", "Amount", "TransactionType", "Description", "ReferenceId", "ReferenceType", "BalanceBefore", "BalanceAfter", "CreatedAt") VALUES
(<USER_ID_1>, 100, 0, 'Purchased Basic Pack', NULL, NULL, 50, 150, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(3, 'Deduction', -20, 'Generated workout plan', NOW() - INTERVAL '4 days'),
(5, 'Purchase', 50, 'Purchased Starter Pack', NOW() - INTERVAL '3 days'),
(6, 'Deduction', -15, 'Generated nutrition plan', NOW() - INTERVAL '2 days'),
(8, 'Purchase', 250, 'Purchased Popular Pack', NOW() - INTERVAL '1 day'),
(10, 'Deduction', -10, 'AI chat consultation', NOW() - INTERVAL '12 hours'),
(1, 'Bonus', 25, 'Referral bonus', NOW() - INTERVAL '10 days'),
(3, 'Purchase', 500, 'Purchased Pro Pack', NOW() - INTERVAL '8 days'),
(5, 'Deduction', -30, 'Custom meal plan generation', NOW() - INTERVAL '6 days'),
(6, 'Refund', 20, 'Refunded unused tokens', NOW() - INTERVAL '5 days');

-- TABLE 8: Payments (10 rows)
-- ==========================================
-- Note: Status: 0=Pending, 1=Completed, 2=Failed, 3=Refunded, 4=Cancelled
INSERT INTO payments ("UserId", "Amount", "Currency", "PaymentMethod", "PaymentType", "Status", "TransactionReference", "SubscriptionId", "PackageId", "InvoiceNumber", "InvoiceUrl", "PaymentGateway", "GatewayResponse", "CreatedAt", "UpdatedAt") VALUES
(<USER_ID_1>, 129.99, 'USD', 'Credit Card', 'Subscription', 1, 'TXN-001-2024', <SUBSCRIPTION_ID_1>, NULL, 'INV-001', 'https://invoices.intellifit.com/001', 'Stripe', '{"status": "succeeded"}'::jsonb, CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP),
(3, 79.99, 'USD', 'PayPal', 'Subscription', 'Completed', 'TXN-002-2024', 2, NULL, 'INV-002', 'https://invoices.intellifit.com/002', 'PayPal', '{"status": "approved"}', NOW() - INTERVAL '25 days', NOW()),
(5, 49.99, 'USD', 'Credit Card', 'Subscription', 'Completed', 'TXN-003-2024', 3, NULL, 'INV-003', 'https://invoices.intellifit.com/003', 'Stripe', '{"status": "succeeded"}', NOW() - INTERVAL '20 days', NOW()),
(6, 39.99, 'USD', 'Debit Card', 'TokenPackage', 'Completed', 'TXN-004-2024', NULL, 3, 'INV-004', 'https://invoices.intellifit.com/004', 'Stripe', '{"status": "succeeded"}', NOW() - INTERVAL '15 days', NOW()),
(8, 17.99, 'USD', 'Credit Card', 'TokenPackage', 'Completed', 'TXN-005-2024', NULL, 2, 'INV-005', 'https://invoices.intellifit.com/005', 'Stripe', '{"status": "succeeded"}', NOW() - INTERVAL '10 days', NOW()),
(10, 49.99, 'USD', 'PayPal', 'Subscription', 'Failed', 'TXN-006-2024', 6, NULL, 'INV-006', NULL, 'PayPal', '{"error": "insufficient_funds"}', NOW() - INTERVAL '5 days', NOW()),
(1, 69.99, 'USD', 'Credit Card', 'TokenPackage', 'Completed', 'TXN-007-2024', NULL, 4, 'INV-007', 'https://invoices.intellifit.com/007', 'Stripe', '{"status": "succeeded"}', NOW() - INTERVAL '8 days', NOW()),
(3, 1299.99, 'USD', 'Bank Transfer', 'Subscription', 'Pending', 'TXN-008-2024', 8, NULL, 'INV-008', 'https://invoices.intellifit.com/008', 'Manual', '{"status": "pending"}', NOW() - INTERVAL '2 days', NOW()),
(5, 119.99, 'USD', 'Credit Card', 'TokenPackage', 'Completed', 'TXN-009-2024', NULL, 5, 'INV-009', 'https://invoices.intellifit.com/009', 'Stripe', '{"status": "succeeded"}', NOW() - INTERVAL '12 days', NOW()),
(6, 39.99, 'USD', 'PayPal', 'Subscription', 'Completed', 'TXN-010-2024', 10, NULL, 'INV-010', 'https://invoices.intellifit.com/010', 'PayPal', '{"status": "approved"}', NOW() - INTERVAL '1 day', NOW());

-- TABLE 9: Equipment Categories (10 rows)
-- ==========================================
INSERT INTO equipment_categories ("CategoryName", "Description", "Icon") VALUES
('Cardio', 'Cardiovascular training equipment', '🏃'),
('Strength', 'Free weights and strength training machines', NOW(), NOW()),
('Functional', 'Functional training and CrossFit equipment', NOW(), NOW()),
('Recovery', 'Recovery and flexibility equipment', NOW(), NOW()),
('Olympic', 'Olympic weightlifting platforms and equipment', NOW(), NOW()),
('Cable', 'Cable machines and attachments', NOW(), NOW()),
('Bodyweight', 'Bodyweight training stations', NOW(), NOW()),
('Plyometric', 'Plyometric and explosive training equipment', NOW(), NOW()),
('Core', 'Core and ab training equipment', NOW(), NOW()),
('Specialty', 'Specialized training equipment', NOW(), NOW());

-- TABLE 10: Equipment (10 rows)
-- ==========================================
INSERT INTO equipment (category_id, name, description, status, location, purchase_date, last_maintenance_date, next_maintenance_due, created_at, updated_at) VALUES
(1, 'Treadmill Pro X1', 'Professional-grade treadmill with incline', 'Available', 'Cardio Zone A', '2023-01-15', '2024-10-01', '2025-01-01', NOW(), NOW()),
(1, 'Concept2 Rower', 'Indoor rowing machine model D', 'Available', 'Cardio Zone A', '2023-02-20', '2024-09-15', '2024-12-15', NOW(), NOW()),
(2, 'Squat Rack Elite', 'Heavy-duty power rack with pull-up bar', 'Available', 'Strength Zone B', '2023-03-10', '2024-10-10', '2025-01-10', NOW(), NOW()),
(2, 'Bench Press Station', 'Olympic bench press with safety bars', 'InUse', 'Strength Zone B', '2023-03-10', '2024-10-10', '2025-01-10', NOW(), NOW()),
(3, 'Assault Bike', 'Air resistance assault bike', 'Available', 'Functional Zone C', '2023-04-05', '2024-09-20', '2024-12-20', NOW(), NOW()),
(4, 'Foam Roller Set', 'High-density foam rollers various sizes', 'Available', 'Recovery Zone D', '2023-05-15', '2024-08-01', '2024-11-01', NOW(), NOW()),
(5, 'Olympic Platform 1', 'Competition-grade lifting platform', 'Available', 'Olympic Zone E', '2023-01-20', '2024-10-05', '2025-01-05', NOW(), NOW()),
(6, 'Cable Crossover Machine', 'Dual adjustable pulleys', 'UnderMaintenance', 'Cable Zone F', '2023-06-01', '2024-11-15', '2024-11-30', NOW(), NOW()),
(7, 'Pull-up Station', 'Multi-grip pull-up and dip station', 'Available', 'Bodyweight Zone G', '2023-07-10', '2024-09-10', '2024-12-10', NOW(), NOW()),
(8, 'Plyo Box Set', 'Adjustable plyometric boxes 20/24/30 inch', 'Available', 'Functional Zone C', '2023-08-15', '2024-10-01', '2025-01-01', NOW(), NOW());

-- TABLE 11: Bookings (10 rows)
-- ==========================================
INSERT INTO bookings (user_id, equipment_id, coach_id, booking_date, start_time, end_time, status, notes, created_at, updated_at) VALUES
(1, 1, NULL, '2024-11-27', '08:00:00', '09:00:00', 'Confirmed', 'Morning cardio session', NOW(), NOW()),
(3, 3, 2, '2024-11-27', '10:00:00', '11:00:00', 'Confirmed', 'Squat training with coach', NOW(), NOW()),
(5, 5, NULL, '2024-11-27', '14:00:00', '15:00:00', 'Confirmed', 'HIIT workout', NOW(), NOW()),
(6, 2, NULL, '2024-11-28', '07:00:00', '08:00:00', 'Confirmed', 'Rowing session', NOW(), NOW()),
(8, 7, 7, '2024-11-28', '17:00:00', '18:00:00', 'Confirmed', 'Olympic lifting practice', NOW(), NOW()),
(10, 9, NULL, '2024-11-28', '12:00:00', '13:00:00', 'Confirmed', 'Pull-up training', NOW(), NOW()),
(1, 4, 2, '2024-11-29', '09:00:00', '10:00:00', 'Pending', 'Bench press session', NOW(), NOW()),
(3, 10, NULL, '2024-11-29', '15:00:00', '16:00:00', 'Confirmed', 'Box jumps training', NOW(), NOW()),
(5, 1, NULL, '2024-11-25', '18:00:00', '19:00:00', 'Completed', 'Evening run completed', NOW(), NOW()),
(6, 6, NULL, '2024-11-26', '11:00:00', '12:00:00', 'Cancelled', 'Schedule conflict', NOW(), NOW());

-- TABLE 12: In Body Measurements (10 rows)
-- ==========================================
INSERT INTO in_body_measurements (member_id, weight, height, body_fat_percentage, muscle_mass, body_water_percentage, bone_mass, bmr, visceral_fat_level, protein_percentage, measurement_date, notes, created_at, updated_at) VALUES
(1, 85.5, 180.0, 18.5, 68.2, 58.3, 3.2, 1850, 8, 17.2, '2024-11-01', 'Initial assessment', NOW(), NOW()),
(2, 78.2, 175.0, 15.2, 66.5, 60.1, 3.1, 1780, 6, 18.5, '2024-11-01', 'Good muscle mass', NOW(), NOW()),
(3, 72.0, 170.0, 20.5, 55.8, 56.2, 2.8, 1620, 9, 16.8, '2024-11-05', 'Focus on fat reduction', NOW(), NOW()),
(4, 60.5, 165.0, 24.3, 43.2, 54.5, 2.4, 1420, 7, 15.5, '2024-11-10', 'Starting weight loss program', NOW(), NOW()),
(5, 65.8, 168.0, 22.1, 48.5, 55.8, 2.6, 1520, 8, 16.2, '2024-11-12', 'Moderate fitness level', NOW(), NOW()),
(1, 84.2, 180.0, 17.8, 69.0, 58.9, 3.2, 1870, 7, 17.5, '2024-11-20', 'Good progress, fat down', NOW(), NOW()),
(2, 77.5, 175.0, 14.8, 67.2, 60.5, 3.1, 1800, 5, 18.8, '2024-11-20', 'Excellent improvement', NOW(), NOW()),
(6, 58.2, 162.0, 26.5, 40.5, 53.2, 2.3, 1380, 6, 15.1, '2024-11-15', 'High body fat percentage', NOW(), NOW()),
(3, 71.0, 170.0, 19.8, 56.5, 56.9, 2.8, 1640, 8, 17.0, '2024-11-22', 'Significant improvement', NOW(), NOW()),
(7, 82.5, 178.0, 16.2, 67.8, 59.5, 3.0, 1820, 6, 17.8, '2024-11-18', 'Athletic build', NOW(), NOW());

-- TABLE 13: Exercises (10 rows)
-- ==========================================
INSERT INTO exercises (name, description, muscle_group, difficulty_level, equipment_required, instructions, video_url, is_active, created_at, updated_at) VALUES
('Barbell Squat', 'Fundamental lower body compound exercise', 'Legs', 'Intermediate', 'Barbell, Squat Rack', '["Stand with feet shoulder-width apart", "Bar on upper back", "Lower until thighs parallel", "Drive through heels to stand"]', 'https://videos.intellifit.com/squat', true, NOW(), NOW()),
('Bench Press', 'Upper body pressing exercise for chest', 'Chest', 'Intermediate', 'Barbell, Bench', '["Lie on bench, feet flat", "Grip bar slightly wider than shoulders", "Lower to chest", "Press up explosively"]', 'https://videos.intellifit.com/benchpress', true, NOW(), NOW()),
('Deadlift', 'Full body compound pulling exercise', 'Back', 'Advanced', 'Barbell', '["Stand with bar over mid-foot", "Grip bar, chest up", "Drive through floor", "Stand tall, squeeze glutes"]', 'https://videos.intellifit.com/deadlift', true, NOW(), NOW()),
('Pull-ups', 'Bodyweight back and bicep exercise', 'Back', 'Intermediate', 'Pull-up Bar', '["Hang from bar, full extension", "Pull chest to bar", "Control descent", "Repeat"]', 'https://videos.intellifit.com/pullups', true, NOW(), NOW()),
('Shoulder Press', 'Overhead pressing for shoulders', 'Shoulders', 'Beginner', 'Dumbbells', '["Stand or sit, dumbbells at shoulders", "Press overhead", "Lower with control", "Repeat"]', 'https://videos.intellifit.com/shoulderpress', true, NOW(), NOW()),
('Plank', 'Core stability exercise', 'Core', 'Beginner', 'None', '["Forearms on ground, body straight", "Engage core", "Hold position", "Breathe steadily"]', 'https://videos.intellifit.com/plank', true, NOW(), NOW()),
('Lunges', 'Unilateral leg exercise', 'Legs', 'Beginner', 'Dumbbells (optional)', '["Step forward into lunge", "Lower back knee toward ground", "Push back to start", "Alternate legs"]', 'https://videos.intellifit.com/lunges', true, NOW(), NOW()),
('Bent Over Row', 'Back thickness builder', 'Back', 'Intermediate', 'Barbell', '["Hinge at hips, back straight", "Pull bar to lower chest", "Squeeze shoulder blades", "Lower with control"]', 'https://videos.intellifit.com/row', true, NOW(), NOW()),
('Bicep Curl', 'Isolation exercise for biceps', 'Arms', 'Beginner', 'Dumbbells', '["Stand with dumbbells at sides", "Curl up, keeping elbows stationary", "Squeeze at top", "Lower slowly"]', 'https://videos.intellifit.com/curl', true, NOW(), NOW()),
('Tricep Dips', 'Bodyweight tricep exercise', 'Arms', 'Intermediate', 'Dip Station', '["Support body on bars", "Lower by bending elbows", "Press back to start", "Keep core tight"]', 'https://videos.intellifit.com/dips', true, NOW(), NOW());

-- TABLE 14: Workout Plans (10 rows)
-- ==========================================
INSERT INTO workout_plans (user_id, plan_name, description, goals, difficulty_level, duration_weeks, days_per_week, start_date, end_date, status, generated_by_coach_id, approved_by_coach_id, approval_date, source, ai_generated, created_at, updated_at) VALUES
(1, 'Weight Loss Transformation', '8-week fat loss program with cardio and resistance training', 'Lose 10-15 lbs, improve cardiovascular fitness', 'Intermediate', 8, 5, '2024-11-01', '2024-12-26', 'Active', 2, 2, '2024-10-30', 'CoachCreated', false, NOW(), NOW()),
(3, 'Muscle Building Program', '12-week hypertrophy focused training', 'Gain 5-10 lbs muscle mass, increase strength', 'Advanced', 12, 6, '2024-10-15', '2025-01-07', 'Active', 4, 4, '2024-10-13', 'AIGenerated', true, NOW(), NOW()),
(5, 'General Fitness Plan', 'Balanced workout for overall fitness', 'Improve general fitness, build habit', 'Beginner', 6, 4, '2024-11-10', '2024-12-21', 'Active', NULL, 7, '2024-11-12', 'AIGenerated', true, NOW(), NOW()),
(6, 'Cut Phase Program', '8-week cutting program for definition', 'Reduce body fat while maintaining muscle', 'Intermediate', 8, 5, '2024-09-01', '2024-10-26', 'Completed', 2, 2, '2024-08-29', 'CoachCreated', false, NOW(), NOW()),
(8, 'Endurance Builder', '10-week program for cardio improvement', 'Run 5K, improve stamina', 'Beginner', 10, 4, '2024-11-05', '2025-01-13', 'Active', 7, 7, '2024-11-03', 'CoachCreated', false, NOW(), NOW()),
(10, 'Flexibility & Mobility', '6-week program for improved flexibility', 'Increase range of motion, reduce stiffness', 'Beginner', 6, 3, '2024-11-15', '2024-12-26', 'PendingApproval', NULL, NULL, NULL, 'AIGenerated', true, NOW(), NOW()),
(1, 'Strength Foundation', '12-week beginner strength program', 'Learn proper form, build base strength', 'Beginner', 12, 4, '2024-08-01', '2024-10-23', 'Completed', 2, 2, '2024-07-28', 'CoachCreated', false, NOW(), NOW()),
(3, 'Advanced Powerlifting', '16-week powerlifting peaking program', 'Increase squat, bench, deadlift maxes', 'Advanced', 16, 5, '2024-07-01', '2024-10-23', 'Completed', 4, 4, '2024-06-28', 'CoachCreated', false, NOW(), NOW()),
(5, 'Home Workout Plan', '8-week bodyweight training', 'Build strength with minimal equipment', 'Beginner', 8, 5, '2024-10-01', '2024-11-25', 'Active', NULL, 7, '2024-10-03', 'AIGenerated', true, NOW(), NOW()),
(6, 'CrossFit Fundamentals', '8-week CrossFit introduction', 'Learn CrossFit movements, build work capacity', 'Intermediate', 8, 4, '2024-11-01', '2024-12-26', 'Active', 7, 7, '2024-10-29', 'CoachCreated', false, NOW(), NOW());

-- TABLE 15: Workout Plan Exercises (10 rows)
-- ==========================================
INSERT INTO workout_plan_exercises (plan_id, exercise_id, day_of_week, order_in_workout, sets, reps, rest_seconds, intensity_level, notes, created_at, updated_at) VALUES
(1, 1, 'Monday', 1, 4, 12, 90, 'Moderate', 'Focus on depth and control', NOW(), NOW()),
(1, 2, 'Monday', 2, 4, 10, 90, 'Moderate', 'Full range of motion', NOW(), NOW()),
(1, 7, 'Monday', 3, 3, 15, 60, 'Light', 'Each leg', NOW(), NOW()),
(1, 6, 'Monday', 4, 3, 60, 60, 'Moderate', 'Hold plank position', NOW(), NOW()),
(2, 3, 'Monday', 1, 5, 5, 180, 'Heavy', 'Heavy deadlift day', NOW(), NOW()),
(2, 8, 'Monday', 2, 4, 8, 120, 'Heavy', 'Explosive pulls', NOW(), NOW()),
(2, 4, 'Monday', 3, 4, 8, 120, 'Moderate', 'Weighted if possible', NOW(), NOW()),
(3, 1, 'Tuesday', 1, 3, 15, 75, 'Light', 'Bodyweight or light weight', NOW(), NOW()),
(3, 5, 'Tuesday', 2, 3, 12, 60, 'Light', 'Light dumbbells', NOW(), NOW()),
(3, 6, 'Tuesday', 3, 3, 45, 45, 'Moderate', 'Maintain form', NOW(), NOW());

-- Verify row counts
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL SELECT 'member_profiles', COUNT(*) FROM member_profiles
UNION ALL SELECT 'coach_profiles', COUNT(*) FROM coach_profiles
UNION ALL SELECT 'subscription_plans', COUNT(*) FROM subscription_plans
UNION ALL SELECT 'user_subscriptions', COUNT(*) FROM user_subscriptions
UNION ALL SELECT 'token_packages', COUNT(*) FROM token_packages
UNION ALL SELECT 'token_transactions', COUNT(*) FROM token_transactions
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'equipment_category', COUNT(*) FROM equipment_category
UNION ALL SELECT 'equipment', COUNT(*) FROM equipment
UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL SELECT 'in_body_measurements', COUNT(*) FROM in_body_measurements
UNION ALL SELECT 'exercises', COUNT(*) FROM exercises
UNION ALL SELECT 'workout_plans', COUNT(*) FROM workout_plans
UNION ALL SELECT 'workout_plan_exercises', COUNT(*) FROM workout_plan_exercises
ORDER BY table_name;
