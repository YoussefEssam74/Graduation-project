-- ==========================================
-- SEED DATA FOR TEST QUERIES
-- IntelliFit Gym Management System
-- Generated: December 2025
-- Purpose: Populate database with realistic test data for all 74 queries
-- ==========================================

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE TABLE chat_messages, audit_logs, activity_feeds, user_milestones, coach_reviews, 
-- ai_chat_logs, ai_program_generations, workout_logs, bookings, token_transactions, payments,
-- user_subscriptions, workout_plans, nutrition_plans, member_profiles, coach_profiles, 
-- users, equipment, equipment_categories, subscription_plans, token_packages, progress_milestones CASCADE;

-- ==========================================
-- 1. EQUIPMENT CATEGORIES
-- ==========================================
INSERT INTO equipment_categories ("CategoryName", "Description") VALUES
('Cardio', 'Cardiovascular equipment including treadmills, bikes, and ellipticals'),
('Strength', 'Weight training and resistance equipment'),
('Functional', 'Functional training equipment like kettlebells and TRX'),
('Recovery', 'Recovery and stretching equipment')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 2. EQUIPMENT
-- ==========================================
INSERT INTO equipment ("Name", "CategoryId", "Status", "Location", "ConditionRating", "LastMaintenanceDate", "NextMaintenanceDate", "IsActive", "CreatedAt") VALUES
('Treadmill 1', 1, 1, 'Ground Floor', 9, '2024-11-01', '2025-02-01', true, '2024-01-01'),
('Treadmill 2', 1, 1, 'Ground Floor', 8, '2024-11-15', '2025-02-15', true, '2024-01-01'),
('Rowing Machine 1', 1, 1, 'First Floor', 7, '2024-10-01', '2025-01-01', true, '2024-01-01'),
('Bench Press 1', 2, 1, 'Ground Floor', 9, '2024-11-20', '2025-02-20', true, '2024-01-01'),
('Squat Rack 1', 2, 1, 'Ground Floor', 8, '2024-11-10', '2025-02-10', true, '2024-01-01'),
('Leg Press 1', 2, 2, 'First Floor', 5, '2024-12-01', '2024-12-20', true, '2024-01-01'),
('Kettlebell Set', 3, 1, 'First Floor', 10, '2024-10-15', '2025-01-15', true, '2024-01-01'),
('Foam Rollers', 4, 1, 'Ground Floor', 9, '2024-11-01', '2025-02-01', true, '2024-01-01')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 3. SUBSCRIPTION PLANS
-- ==========================================
INSERT INTO subscription_plans ("PlanName", "Description", "Price", "DurationDays", "TokensIncluded", "MaxMembersAllowed", "IsActive", "CreatedAt") VALUES
('Basic Monthly', '1 month access with 100 tokens', 50.00, 30, 100, 100, true, '2024-01-01'),
('Premium Monthly', '1 month access with 300 tokens', 120.00, 30, 300, 50, true, '2024-01-01'),
('Annual VIP', '1 year access with 2000 tokens', 800.00, 365, 2000, 30, true, '2024-01-01'),
('Student Plan', '3 months with 200 tokens', 100.00, 90, 200, 80, true, '2024-01-01')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 4. TOKEN PACKAGES
-- ==========================================
INSERT INTO token_packages ("PackageName", "TokenAmount", "Price", "BonusTokens", "Description", "IsActive", "UpdatedAt") VALUES
('Starter Pack', 100, 20.00, 10, 'Perfect for beginners', true, '2024-01-01'),
('Power Pack', 300, 50.00, 50, 'Most popular choice', true, '2024-01-01'),
('Ultimate Pack', 1000, 150.00, 200, 'Best value for serious athletes', true, '2024-01-01')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 5. PROGRESS MILESTONES
-- ==========================================
INSERT INTO progress_milestones ("MilestoneName", "Description", "Category", "TargetValue", "Unit", "TokenReward", "IsActive", "CreatedAt") VALUES
('First Workout', 'Complete your first workout', 'Workout', 1, 'workouts', 50, true, '2024-01-01'),
('10 Workouts', 'Complete 10 workouts', 'Workout', 10, 'workouts', 100, true, '2024-01-01'),
('Weight Loss 5kg', 'Lose 5 kg', 'Weight', 5, 'kg', 200, true, '2024-01-01'),
('Consistency Streak', '30 day workout streak', 'Attendance', 30, 'days', 300, true, '2024-01-01'),
('Nutrition Plan Complete', 'Complete 30 days of nutrition plan', 'Nutrition', 30, 'days', 150, true, '2024-01-01')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 6. USERS - ADMINS & RECEPTIONISTS
-- ==========================================
INSERT INTO users ("Email", "PasswordHash", "Name", "Phone", "DateOfBirth", "Gender", "Role", "ProfileImageUrl", "Address", "EmergencyContactName", "EmergencyContactPhone", "TokenBalance", "IsActive", "EmailVerified", "MustChangePassword", "IsFirstLogin", "LastLoginAt", "CreatedAt", "UpdatedAt") VALUES
('admin@intellifit.com', '$2a$11$hashedpassword1', 'Admin User', '+1234567890', '1985-05-15', 0, 'Admin', '/images/admin.jpg', '123 Admin St', 'Emergency Admin', '+1234567899', 0, true, true, false, false, '2024-12-15 09:00:00', '2024-01-01', '2024-12-15'),
('receptionist@intellifit.com', '$2a$11$hashedpassword2', 'Sarah Johnson', '+1234567891', '1992-08-20', 1, 'Receptionist', '/images/receptionist.jpg', '456 Reception Ave', 'John Johnson', '+1234567898', 0, true, true, false, false, '2024-12-16 08:00:00', '2024-01-01', '2024-12-16')
ON CONFLICT (email) DO NOTHING;

-- ==========================================
-- 7. USERS - COACHES
-- ==========================================
INSERT INTO users ("Email", "PasswordHash", "Name", "Phone", "DateOfBirth", "Gender", "Role", "ProfileImageUrl", "Address", "TokenBalance", "IsActive", "EmailVerified", "IsFirstLogin", "LastLoginAt", "CreatedAt", "UpdatedAt") VALUES
('coach1@intellifit.com', '$2a$11$hashedpassword3', 'Mike Thompson', '+1234567892', '1988-03-12', 0, 'Coach', '/images/coach1.jpg', '789 Coach Rd', 0, true, true, false, '2024-12-14 10:00:00', '2024-01-01', '2024-12-14'),
('coach2@intellifit.com', '$2a$11$hashedpassword4', 'Emily Davis', '+1234567893', '1990-11-25', 1, 'Coach', '/images/coach2.jpg', '321 Trainer Blvd', 0, true, true, false, '2024-12-13 14:00:00', '2024-01-01', '2024-12-13'),
('coach3@intellifit.com', '$2a$11$hashedpassword5', 'David Martinez', '+1234567894', '1987-07-08', 0, 'Coach', '/images/coach3.jpg', '654 Fitness Lane', 0, true, true, false, '2024-12-12 11:00:00', '2024-01-01', '2024-12-12')
ON CONFLICT (email) DO NOTHING;

-- ==========================================
-- 8. COACH PROFILES
-- ==========================================
INSERT INTO coach_profiles ("UserId", "Specialization", "Bio", "Certifications", "ExperienceYears", "HourlyRate", "Rating", "TotalReviews", "TotalClients", "CreatedAt") 
SELECT u."UserId", 'Strength Training', 'Certified strength coach with 8 years experience', 'NASM-CPT, CSCS', 8, 75.00, 4.8, 45, 120, '2024-01-01'
FROM users u WHERE u."Email" = 'coach1@intellifit.com'
ON CONFLICT DO NOTHING;

INSERT INTO coach_profiles ("UserId", "Specialization", "Bio", "Certifications", "ExperienceYears", "HourlyRate", "Rating", "TotalReviews", "TotalClients", "CreatedAt")
SELECT u."UserId", 'Yoga', 'Yoga instructor specializing in mindfulness', 'RYT-500, ACE', 6, 60.00, 4.9, 38, 95, '2024-01-01'
FROM users u WHERE u."Email" = 'coach2@intellifit.com'
ON CONFLICT DO NOTHING;

INSERT INTO coach_profiles ("UserId", "Specialization", "Bio", "Certifications", "ExperienceYears", "HourlyRate", "Rating", "TotalReviews", "TotalClients", "CreatedAt")
SELECT u."UserId", 'CrossFit', 'CrossFit Level 2 trainer', 'CF-L2, ACE-CPT', 5, 70.00, 4.7, 30, 80, '2024-01-01'
FROM users u WHERE u."Email" = 'coach3@intellifit.com'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 9. USERS - MEMBERS (20 sample members)
-- ==========================================
INSERT INTO users ("Email", "PasswordHash", "Name", "Phone", "DateOfBirth", "Gender", "Role", "ProfileImageUrl", "Address", "EmergencyContactName", "EmergencyContactPhone", "TokenBalance", "IsActive", "EmailVerified", "IsFirstLogin", "LastLoginAt", "CreatedAt", "UpdatedAt") VALUES
('john.doe@email.com', '$2a$11$hashedpassword6', 'John Doe', '+1234567895', '1995-06-15', 0, 'Member', '/images/member1.jpg', '111 Member St', 'Jane Doe', '+1234567800', 150, true, true, false, '2024-12-16 18:00:00', '2024-02-01', '2024-12-16'),
('jane.smith@email.com', '$2a$11$hashedpassword7', 'Jane Smith', '+1234567896', '1992-09-22', 1, 'Member', '/images/member2.jpg', '222 Fitness Ave', 'Bob Smith', '+1234567801', 45, true, true, false, '2024-12-15 17:30:00', '2024-02-15', '2024-12-15'),
('bob.wilson@email.com', '$2a$11$hashedpassword8', 'Bob Wilson', '+1234567897', '1988-12-10', 0, 'Member', '/images/member3.jpg', '333 Health Rd', 'Mary Wilson', '+1234567802', 280, true, true, false, '2024-12-14 19:00:00', '2024-03-01', '2024-12-14'),
('alice.brown@email.com', '$2a$11$hashedpassword9', 'Alice Brown', '+1234567898', '1998-04-18', 1, 'Member', '/images/member4.jpg', '444 Wellness Blvd', 'Tom Brown', '+1234567803', 320, true, true, false, '2024-12-16 16:00:00', '2024-03-15', '2024-12-16'),
('charlie.davis@email.com', '$2a$11$hashedpassword10', 'Charlie Davis', '+1234567899', '1990-11-05', 0, 'Member', '/images/member5.jpg', '555 Gym Lane', 'Linda Davis', '+1234567804', 95, true, true, false, '2024-12-13 20:00:00', '2024-04-01', '2024-12-13'),
('emma.garcia@email.com', '$2a$11$hashedpassword11', 'Emma Garcia', '+1234567900', '1997-07-30', 1, 'Member', NULL, '666 Training St', 'Carlos Garcia', '+1234567805', 15, true, true, false, '2024-11-20 15:00:00', '2024-04-15', '2024-11-20'),
('david.miller@email.com', '$2a$11$hashedpassword12', 'David Miller', '+1234567901', '1985-03-25', 0, 'Member', '/images/member7.jpg', '777 Athlete Ave', 'Susan Miller', '+1234567806', 200, true, true, false, '2024-12-16 12:00:00', '2024-05-01', '2024-12-16'),
('sophia.rodriguez@email.com', '$2a$11$hashedpassword13', 'Sophia Rodriguez', '+1234567902', '1993-08-14', 1, 'Member', '/images/member8.jpg', '888 Fitness Rd', 'Miguel Rodriguez', '+1234567807', 175, true, true, false, '2024-12-15 14:00:00', '2024-05-15', '2024-12-15'),
('james.martinez@email.com', '$2a$11$hashedpassword14', 'James Martinez', '+1234567903', '1991-01-20', 0, 'Member', '/images/member9.jpg', '999 Strength Blvd', 'Maria Martinez', '+1234567808', 85, true, true, false, '2024-10-05 10:00:00', '2024-06-01', '2024-10-05'),
('olivia.anderson@email.com', '$2a$11$hashedpassword15', 'Olivia Anderson', '+1234567904', '1996-05-12', 1, 'Member', '/images/member10.jpg', '1010 Cardio Lane', 'Chris Anderson', '+1234567809', 250, true, true, false, '2024-12-16 13:00:00', '2024-06-15', '2024-12-16'),
('william.thomas@email.com', '$2a$11$hashedpassword16', 'William Thomas', '+1234567905', '1989-10-08', 0, 'Member', NULL, NULL, NULL, NULL, 120, true, false, true, NULL, '2024-12-01', '2024-12-01'),
('ava.jackson@email.com', '$2a$11$hashedpassword17', 'Ava Jackson', '+1234567906', '1994-02-28', 1, 'Member', '/images/member12.jpg', '1212 Power St', 'Jack Jackson', '+1234567811', 5, true, true, false, '2024-12-16 11:00:00', '2024-07-01', '2024-12-16'),
('ethan.white@email.com', '$2a$11$hashedpassword18', 'Ethan White', '+1234567907', '1987-09-17', 0, 'Member', '/images/member13.jpg', '1313 Elite Ave', 'Lisa White', '+1234567812', 310, true, true, false, '2024-12-15 15:00:00', '2024-07-15', '2024-12-15'),
('mia.harris@email.com', '$2a$11$hashedpassword19', 'Mia Harris', '+1234567908', '1999-12-03', 1, 'Member', '/images/member14.jpg', '1414 Champion Rd', 'Daniel Harris', '+1234567813', 90, true, true, false, '2024-12-14 16:00:00', '2024-08-01', '2024-12-14'),
('noah.martin@email.com', '$2a$11$hashedpassword20', 'Noah Martin', '+1234567909', '1986-06-22', 0, 'Member', '/images/member15.jpg', '1515 Victory Blvd', 'Rachel Martin', '+1234567814', 180, true, true, false, '2024-12-13 17:00:00', '2024-08-15', '2024-12-13'),
('isabella.lee@email.com', '$2a$11$hashedpassword21', 'Isabella Lee', '+1234567910', '1995-11-19', 1, 'Member', '/images/member16.jpg', '1616 Peak Lane', 'Kevin Lee', '+1234567815', 220, true, true, false, '2024-12-12 18:00:00', '2024-09-01', '2024-12-12'),
('lucas.walker@email.com', '$2a$11$hashedpassword22', 'Lucas Walker', '+1234567911', '1992-04-07', 0, 'Member', '/images/member17.jpg', '1717 Summit St', 'Amy Walker', '+1234567816', 140, true, true, false, '2024-12-11 19:00:00', '2024-09-15', '2024-12-11'),
('charlotte.hall@email.com', '$2a$11$hashedpassword23', 'Charlotte Hall', '+1234567912', '1998-07-26', 1, 'Member', '/images/member18.jpg', '1818 Horizon Ave', 'Mark Hall', '+1234567817', 265, true, true, false, '2024-12-10 20:00:00', '2024-10-01', '2024-12-10'),
('mason.allen@email.com', '$2a$11$hashedpassword24', 'Mason Allen', '+1234567913', '1990-01-14', 0, 'Member', '/images/member19.jpg', '1919 Zenith Rd', 'Laura Allen', '+1234567818', 110, true, true, false, '2024-12-09 21:00:00', '2024-10-15', '2024-12-09'),
('amelia.young@email.com', '$2a$11$hashedpassword25', 'Amelia Young', '+1234567914', '1997-10-31', 1, 'Member', '/images/member20.jpg', '2020 Apex Blvd', 'Steve Young', '+1234567819', 195, true, true, false, '2024-12-08 22:00:00', '2024-11-01', '2024-12-08')
ON CONFLICT (email) DO NOTHING;

-- ==========================================
-- 10. MEMBER PROFILES (for all members)
-- ==========================================
INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Weight Loss', 'Beginner', 175, 85, 29, 15, '2024-02-01'
FROM users u WHERE u."Email" = 'john.doe@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Muscle Gain', 'Intermediate', 165, 62, 32, 42, '2024-02-15'
FROM users u WHERE u."Email" = 'jane.smith@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Endurance', 'Advanced', 182, 78, 36, 128, '2024-03-01'
FROM users u WHERE u."Email" = 'bob.wilson@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Weight Loss', 'Intermediate', 168, 70, 26, 55, '2024-03-15'
FROM users u WHERE u."Email" = 'alice.brown@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Muscle Gain', 'Beginner', 178, 72, 34, 8, '2024-04-01'
FROM users u WHERE u."Email" = 'charlie.davis@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Flexibility', 'Beginner', 160, 55, 27, 3, '2024-04-15'
FROM users u WHERE u."Email" = 'emma.garcia@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Endurance', 'Advanced', 185, 90, 39, 95, '2024-05-01'
FROM users u WHERE u."Email" = 'david.miller@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Weight Loss', 'Intermediate', 170, 68, 31, 38, '2024-05-15'
FROM users u WHERE u."Email" = 'sophia.rodriguez@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Muscle Gain', 'Intermediate', 176, 75, 33, 22, '2024-06-01'
FROM users u WHERE u."Email" = 'james.martinez@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Endurance', 'Beginner', 163, 58, 28, 18, '2024-06-15'
FROM users u WHERE u."Email" = 'olivia.anderson@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Weight Loss', 'Beginner', 180, 95, 35, 0, '2024-12-01'
FROM users u WHERE u."Email" = 'william.thomas@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Flexibility', 'Intermediate', 165, 60, 30, 47, '2024-07-01'
FROM users u WHERE u."Email" = 'ava.jackson@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Muscle Gain', 'Advanced', 183, 88, 37, 110, '2024-07-15'
FROM users u WHERE u."Email" = 'ethan.white@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Weight Loss', 'Beginner', 158, 52, 25, 12, '2024-08-01'
FROM users u WHERE u."Email" = 'mia.harris@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Endurance', 'Advanced', 188, 92, 38, 85, '2024-08-15'
FROM users u WHERE u."Email" = 'noah.martin@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Weight Loss', 'Intermediate', 167, 65, 29, 32, '2024-09-01'
FROM users u WHERE u."Email" = 'isabella.lee@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Muscle Gain', 'Intermediate', 177, 76, 32, 28, '2024-09-15'
FROM users u WHERE u."Email" = 'lucas.walker@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Flexibility', 'Beginner', 162, 56, 26, 15, '2024-10-01'
FROM users u WHERE u."Email" = 'charlotte.hall@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Endurance', 'Intermediate', 181, 82, 34, 40, '2024-10-15'
FROM users u WHERE u."Email" = 'mason.allen@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO member_profiles ("UserId", "FitnessGoal", "FitnessLevel", "Height", "Weight", "Age", "TotalWorkoutsCompleted", "CreatedAt")
SELECT u."UserId", 'Weight Loss', 'Beginner', 164, 63, 27, 20, '2024-11-01'
FROM users u WHERE u."Email" = 'amelia.young@email.com'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 11. PAYMENTS & SUBSCRIPTIONS
-- ==========================================
-- Insert payments first
INSERT INTO payments ("UserId", "PackageId", "Amount", "PaymentMethod", "Status", "TransactionId", "CreatedAt", "UpdatedAt")
SELECT u."UserId", NULL, 50.00, 'CreditCard', 1, 'TXN-2024-0001', '2024-02-01 10:00:00', '2024-02-01 10:00:00'
FROM users u WHERE u."Email" = 'john.doe@email.com'
UNION ALL
SELECT u."UserId", NULL, 120.00, 'CreditCard', 1, 'TXN-2024-0002', '2024-02-15 11:00:00', '2024-02-15 11:00:00'
FROM users u WHERE u."Email" = 'jane.smith@email.com'
UNION ALL
SELECT u."UserId", NULL, 800.00, 'BankTransfer', 1, 'TXN-2024-0003', '2024-03-01 12:00:00', '2024-03-01 12:00:00'
FROM users u WHERE u."Email" = 'bob.wilson@email.com'
UNION ALL
SELECT u."UserId", NULL, 120.00, 'CreditCard', 1, 'TXN-2024-0004', '2024-03-15 13:00:00', '2024-03-15 13:00:00'
FROM users u WHERE u."Email" = 'alice.brown@email.com'
UNION ALL
SELECT u."UserId", NULL, 100.00, 'Cash', 1, 'TXN-2024-0005', '2024-04-01 14:00:00', '2024-04-01 14:00:00'
FROM users u WHERE u."Email" = 'charlie.davis@email.com'
ON CONFLICT DO NOTHING;

-- Then user_subscriptions
INSERT INTO user_subscriptions ("UserId", "PlanId", "PaymentId", "Status", "StartDate", "EndDate", "AutoRenew", "CreatedAt", "UpdatedAt")
SELECT u."UserId", 1, p."PaymentId", 0, '2024-02-01', '2024-03-02', true, '2024-02-01 10:00:00', '2024-02-01 10:00:00'
FROM users u 
JOIN payments p ON u."UserId" = p."UserId" AND p."TransactionId" = 'TXN-2024-0001'
WHERE u."Email" = 'john.doe@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO user_subscriptions ("UserId", "PlanId", "PaymentId", "Status", "StartDate", "EndDate", "AutoRenew", "CreatedAt", "UpdatedAt")
SELECT u."UserId", 2, p."PaymentId", 0, '2024-02-15', '2024-03-16', false, '2024-02-15 11:00:00', '2024-02-15 11:00:00'
FROM users u 
JOIN payments p ON u."UserId" = p."UserId" AND p."TransactionId" = 'TXN-2024-0002'
WHERE u."Email" = 'jane.smith@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO user_subscriptions ("UserId", "PlanId", "PaymentId", "Status", "StartDate", "EndDate", "AutoRenew", "CreatedAt", "UpdatedAt")
SELECT u."UserId", 3, p."PaymentId", 0, '2024-03-01', '2025-03-01', true, '2024-03-01 12:00:00', '2024-03-01 12:00:00'
FROM users u 
JOIN payments p ON u."UserId" = p."UserId" AND p."TransactionId" = 'TXN-2024-0003'
WHERE u."Email" = 'bob.wilson@email.com'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 12. TOKEN TRANSACTIONS
-- ==========================================
INSERT INTO token_transactions ("UserId", "Amount", "TransactionType", "Description", "CreatedAt")
SELECT u."UserId", 100, 0, 'Initial subscription tokens', '2024-02-01 10:00:00'
FROM users u WHERE u."Email" = 'john.doe@email.com'
UNION ALL
SELECT u."UserId", -10, 1, 'Equipment booking', '2024-03-15 14:00:00'
FROM users u WHERE u."Email" = 'john.doe@email.com'
UNION ALL
SELECT u."UserId", 300, 0, 'Subscription tokens', '2024-02-15 11:00:00'
FROM users u WHERE u."Email" = 'jane.smith@email.com'
UNION ALL
SELECT u."UserId", -15, 1, 'Coach session booking', '2024-04-20 16:00:00'
FROM users u WHERE u."Email" = 'jane.smith@email.com'
UNION ALL
SELECT u."UserId", 50, 4, 'Milestone bonus', '2024-05-10 10:00:00'
FROM users u WHERE u."Email" = 'alice.brown@email.com'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 13. WORKOUT PLANS & NUTRITION PLANS
-- ==========================================
INSERT INTO workout_plans ("UserId", "GeneratedByCoachId", "PlanName", "Description", "DifficultyLevel", "DurationWeeks", "WorkoutsPerWeek", "TargetMuscleGroups", "Status", "CreatedAt")
SELECT m."UserId", c."Id", 'Beginner Weight Loss', 'Full body workout for beginners', 'Beginner', 8, 3, 'Full Body, Core', 1, '2024-03-01'
FROM users m
JOIN users cu ON cu."Email" = 'coach1@intellifit.com'
JOIN coach_profiles c ON cu."UserId" = c."UserId"
WHERE m."Email" = 'john.doe@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO nutrition_plans ("UserId", "GeneratedByCoachId", "PlanName", "Description", "PlanType", "DailyCalories", "ProteinGrams", "CarbsGrams", "FatsGrams", "Status", "CreatedAt")
SELECT m."UserId", c."Id", 'Weight Loss Nutrition', 'Calorie deficit plan', 'Weight Loss', 1800, 120, 150, 60, 1, '2024-03-02'
FROM users m
JOIN users cu ON cu."Email" = 'coach1@intellifit.com'
JOIN coach_profiles c ON cu."UserId" = c."UserId"
WHERE m."Email" = 'member@intellifit.com'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 14. BOOKINGS (Equipment and Coach sessions)
-- ==========================================
INSERT INTO bookings ("UserId", "EquipmentId", "BookingType", "StartTime", "EndTime", "Status", "TokensCost", "CheckInTime", "CheckOutTime", "CreatedAt", "UpdatedAt")
SELECT u."UserId", 1, 'Equipment', '2024-06-15 08:00:00', '2024-06-15 09:00:00', 3, 10, '2024-06-15 08:05:00', '2024-06-15 08:58:00', '2024-06-14 10:00:00', '2024-06-15 09:00:00'
FROM users u WHERE u."Email" = 'john.doe@email.com'
UNION ALL
SELECT u."UserId", 2, 'Equipment', '2024-07-20 18:00:00', '2024-07-20 19:00:00', 3, 10, '2024-07-20 18:02:00', '2024-07-20 19:05:00', '2024-07-19 14:00:00', '2024-07-20 19:05:00'
FROM users u WHERE u."Email" = 'jane.smith@email.com'
UNION ALL
SELECT u."UserId", 4, 'Equipment', '2024-08-10 17:00:00', '2024-08-10 18:30:00', 3, 15, '2024-08-10 17:10:00', '2024-08-10 18:25:00', '2024-08-09 11:00:00', '2024-08-10 18:30:00'
FROM users u WHERE u."Email" = 'bob.wilson@email.com'
UNION ALL
SELECT u."UserId", 1, 'Equipment', '2024-12-18 09:00:00', '2024-12-18 10:00:00', 1, 10, NULL, NULL, '2024-12-17 15:00:00', '2024-12-17 15:00:00'
FROM users u WHERE u."Email" = 'alice.brown@email.com'
ON CONFLICT DO NOTHING;

-- Coach bookings
INSERT INTO bookings ("UserId", "CoachId", "BookingType", "StartTime", "EndTime", "Status", "TokensCost", "CheckInTime", "CheckOutTime", "CreatedAt", "UpdatedAt")
SELECT m."UserId", c."Id", 'Coach', '2024-04-20 16:00:00', '2024-04-20 17:00:00', 3, 15, '2024-04-20 16:00:00', '2024-04-20 17:00:00', '2024-04-18 10:00:00', '2024-04-20 17:00:00'
FROM users m
JOIN users cu ON cu."Email" = 'coach1@intellifit.com'
JOIN coach_profiles c ON cu."UserId" = c."UserId"
WHERE m."Email" = 'jane.smith@email.com'
UNION ALL
SELECT m."UserId", c."Id", 'Coach', '2024-09-15 14:00:00', '2024-09-15 15:00:00', 3, 15, '2024-09-15 14:05:00', '2024-09-15 15:10:00', '2024-09-13 12:00:00', '2024-09-15 15:10:00'
FROM users m
JOIN users cu ON cu."Email" = 'coach2@intellifit.com'
JOIN coach_profiles c ON cu."UserId" = c."UserId"
WHERE m."Email" = 'alice.brown@email.com'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 15. WORKOUT LOGS
-- ==========================================
INSERT INTO workout_logs ("UserId", "PlanId", "WorkoutDate", "DurationMinutes", "CaloriesBurned", "ExercisesCompleted", "FeelingRating", "Notes", "Completed", "CreatedAt")
SELECT u."UserId", NULL, '2024-06-15', 55, 450, 'Cardio, Strength', 4, 'Great workout!', true, '2024-06-15 09:00:00'
FROM users u WHERE u."Email" = 'john.doe@email.com'
UNION ALL
SELECT u."UserId", NULL, '2024-07-20', 60, 500, 'Full Body', 5, 'Felt strong today', true, '2024-07-20 19:00:00'
FROM users u WHERE u."Email" = 'jane.smith@email.com'
UNION ALL
SELECT u."UserId", NULL, '2024-08-10', 90, 720, 'Endurance Training', 4, 'Pushed hard', true, '2024-08-10 18:30:00'
FROM users u WHERE u."Email" = 'bob.wilson@email.com'
UNION ALL
SELECT u."UserId", NULL, '2024-09-25', 45, 380, 'Yoga', 5, 'Very relaxing', true, '2024-09-25 20:00:00'
FROM users u WHERE u."Email" = 'alice.brown@email.com'
UNION ALL
SELECT u."UserId", NULL, '2024-11-10', 50, 420, 'Cardio', 3, 'Was tough today', true, '2024-11-10 18:00:00'
FROM users u WHERE u."Email" = 'charlie.davis@email.com'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 16. COACH REVIEWS
-- ==========================================
INSERT INTO coach_reviews ("UserId", "CoachId", "BookingId", "Rating", "ReviewText", "CreatedAt")
SELECT m."UserId", c."Id", b."BookingId", 5, 'Excellent coach! Very knowledgeable and motivating.', '2024-04-21 10:00:00'
FROM users m
JOIN users cu ON cu."Email" = 'coach1@intellifit.com'
JOIN coach_profiles c ON cu."UserId" = c."UserId"
JOIN bookings b ON m."UserId" = b."UserId" AND b."CoachId" = c."Id"
WHERE m."Email" = 'jane.smith@email.com'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO coach_reviews ("UserId", "CoachId", "BookingId", "Rating", "ReviewText", "CreatedAt")
SELECT m."UserId", c."Id", b."BookingId", 4, 'Great session, very professional.', '2024-09-16 11:00:00'
FROM users m
JOIN users cu ON cu."Email" = 'coach2@intellifit.com'
JOIN coach_profiles c ON cu."UserId" = c."UserId"
JOIN bookings b ON m."UserId" = b."UserId" AND b."CoachId" = c."Id"
WHERE m."Email" = 'alice.brown@email.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ==========================================
-- 17. USER MILESTONES
-- ==========================================
INSERT INTO user_milestones ("UserId", "MilestoneId", "Progress", "IsCompleted", "CompletedAt", "CreatedAt")
SELECT u."UserId", pm."MilestoneId", 1, true, '2024-02-05 18:00:00', '2024-02-01'
FROM users u, progress_milestones pm
WHERE u."Email" = 'john.doe@email.com' AND pm."MilestoneName" = 'First Workout'
ON CONFLICT DO NOTHING;

INSERT INTO user_milestones ("UserId", "MilestoneId", "Progress", "IsCompleted", "CompletedAt", "CreatedAt")
SELECT u."UserId", pm."MilestoneId", 10, true, '2024-05-10 19:00:00', '2024-02-15'
FROM users u, progress_milestones pm
WHERE u."Email" = 'jane.smith@email.com' AND pm."MilestoneName" = '10 Workouts'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 18. AI PROGRAM GENERATIONS
-- ==========================================
INSERT INTO ai_program_generations ("UserId", "ProgramType", "TokensUsed", "CreatedAt")
SELECT u."UserId", 'WorkoutPlan', 250, '2024-03-01 10:00:00'
FROM users u WHERE u."Email" = 'john.doe@email.com'
UNION ALL
SELECT u."UserId", 'NutritionPlan', 200, '2024-03-02 11:00:00'
FROM users u WHERE u."Email" = 'john.doe@email.com'
UNION ALL
SELECT u."UserId", 'WorkoutPlan', 280, '2024-04-15 14:00:00'
FROM users u WHERE u."Email" = 'alice.brown@email.com'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 19. AI CHAT LOGS
-- ==========================================
INSERT INTO ai_chat_logs ("UserId", "MessageContent", "ResponseContent", "TokensUsed", "CreatedAt")
SELECT u."UserId", 'What exercises are best for weight loss?', 'For weight loss, I recommend a combination of cardio exercises like running, cycling, and HIIT workouts, along with strength training to build muscle mass...', 150, '2024-05-15 10:00:00'
FROM users u WHERE u."Email" = 'john.doe@email.com'
UNION ALL
SELECT u."UserId", 'Can you suggest a meal plan for muscle gain?', 'For muscle gain, focus on a high-protein diet with lean meats, eggs, Greek yogurt, and plant-based proteins...', 180, '2024-06-20 14:30:00'
FROM users u WHERE u."Email" = 'jane.smith@email.com'
UNION ALL
SELECT u."UserId", 'How often should I train for endurance?', 'For endurance training, aim for 4-5 sessions per week with varying intensities...', 120, '2024-07-10 16:00:00'
FROM users u WHERE u."Email" = 'bob.wilson@email.com'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 20. CHAT MESSAGES (between members and coaches)
-- ==========================================
INSERT INTO chat_messages ("SenderId", "ReceiverId", "ConversationId", "Message", "IsRead", "ReadAt", "CreatedAt")
SELECT m."UserId", c."UserId", CONCAT(LEAST(m."UserId", c."UserId"), '-', GREATEST(m."UserId", c."UserId")), 'Hi Coach! I have a question about my workout plan.', true, '2024-08-15 11:00:00', '2024-08-15 10:00:00'
FROM users m, users c
WHERE m."Email" = 'john.doe@email.com' AND c."Email" = 'coach1@intellifit.com'
UNION ALL
SELECT c."UserId", m."UserId", CONCAT(LEAST(m."UserId", c."UserId"), '-', GREATEST(m."UserId", c."UserId")), 'Sure! What would you like to know?', true, '2024-08-15 11:30:00', '2024-08-15 11:05:00'
FROM users m, users c
WHERE m."Email" = 'john.doe@email.com' AND c."Email" = 'coach1@intellifit.com'
UNION ALL
SELECT m."UserId", c."UserId", CONCAT(LEAST(m."UserId", c."UserId"), '-', GREATEST(m."UserId", c."UserId")), 'Can we schedule a session for next week?', false, NULL, '2024-12-16 14:00:00'
FROM users m, users c
WHERE m."Email" = 'jane.smith@email.com' AND c."Email" = 'coach2@intellifit.com'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 21. ACTIVITY FEEDS
-- ==========================================
INSERT INTO activity_feeds ("UserId", "ActivityType", "Title", "Description", "Icon", "ReferenceId", "ReferenceType", "CreatedAt")
SELECT u."UserId", 'workout_completed', 'Completed Cardio Workout', 'Burned 450 calories in 55 minutes', '🏃', NULL, 'workout_log', '2024-06-15 09:00:00'
FROM users u WHERE u."Email" = 'john.doe@email.com'
UNION ALL
SELECT u."UserId", 'milestone_achieved', 'First Workout Milestone!', 'Completed first workout - earned 50 tokens', '🏆', NULL, 'milestone', '2024-02-05 18:00:00'
FROM users u WHERE u."Email" = 'john.doe@email.com'
UNION ALL
SELECT u."UserId", 'plan_created', 'New Workout Plan Created', 'Started Beginner Weight Loss program', '📋', NULL, 'workout_plan', '2024-03-01 10:00:00'
FROM users u WHERE u."Email" = 'john.doe@email.com'
UNION ALL
SELECT u."UserId", 'booking_completed', 'Coach Session Complete', 'Completed session with Mike Thompson', '💪', NULL, 'booking', '2024-04-20 17:00:00'
FROM users u WHERE u."Email" = 'jane.smith@email.com'
UNION ALL
SELECT u."UserId", 'review_posted', 'Posted Coach Review', 'Rated Mike Thompson 5 stars', '⭐', NULL, 'review', '2024-04-21 10:00:00'
FROM users u WHERE u."Email" = 'jane.smith@email.com'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 22. AUDIT LOGS
-- ==========================================
INSERT INTO audit_logs ("UserId", "Action", "TableName", "RecordId", "OldValues", "NewValues", "IpAddress", "UserAgent", "CreatedAt")
SELECT u."UserId", 'LOGIN', NULL, NULL, NULL, NULL, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-12-16 08:00:00'
FROM users u WHERE u."Email" = 'john.doe@email.com'
UNION ALL
SELECT u."UserId", 'UPDATE', 'users', u."UserId", '{"TokenBalance":160}', '{"TokenBalance":150}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-12-16 08:30:00'
FROM users u WHERE u."Email" = 'john.doe@email.com'
UNION ALL
SELECT u."UserId", 'INSERT', 'bookings', NULL, NULL, '{"BookingId":1}', '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-12-16 09:00:00'
FROM users u WHERE u."Email" = 'jane.smith@email.com'
UNION ALL
SELECT u."UserId", 'LOGIN', NULL, NULL, NULL, NULL, '192.168.1.102', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', '2024-12-15 10:00:00'
FROM users u WHERE u."Email" = 'admin@intellifit.com'
UNION ALL
SELECT u."UserId", 'DELETE', 'bookings', 999, '{"Status":4}', NULL, '192.168.1.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', '2024-11-20 14:00:00'
FROM users u WHERE u."Email" = 'admin@intellifit.com'
ON CONFLICT DO NOTHING;

-- ==========================================
-- 23. MORE BOOKINGS FOR BETTER QUERY RESULTS
-- ==========================================
INSERT INTO bookings ("UserId", "EquipmentId", "BookingType", "StartTime", "EndTime", "Status", "TokensCost", "CheckInTime", "CheckOutTime", "CancellationReason", "CreatedAt", "UpdatedAt")
SELECT u."UserId", 1, 'Equipment', '2024-10-15 07:00:00', '2024-10-15 08:00:00', 4, 10, NULL, NULL, 'Schedule conflict', '2024-10-14 10:00:00', '2024-10-14 15:00:00'
FROM users u WHERE u."Email" = 'emma.garcia@email.com'
UNION ALL
SELECT u."UserId", 3, 'Equipment', '2024-11-20 19:00:00', '2024-11-20 20:00:00', 3, 10, '2024-11-20 19:00:00', '2024-11-20 20:00:00', NULL, '2024-11-19 12:00:00', '2024-11-20 20:00:00'
FROM users u WHERE u."Email" = 'olivia.anderson@email.com'
UNION ALL
SELECT u."UserId", 5, 'Equipment', '2024-09-05 16:00:00', '2024-09-05 17:30:00', 3, 12, '2024-09-05 16:10:00', '2024-09-05 17:20:00', NULL, '2024-09-04 14:00:00', '2024-09-05 17:30:00'
FROM users u WHERE u."Email" = 'david.miller@email.com'
ON CONFLICT DO NOTHING;

-- ==========================================
-- SUMMARY
-- ==========================================
-- This seed data provides:
-- - 22 users (2 staff, 3 coaches, 17 members)
-- - 3 coach profiles
-- - 20 member profiles  
-- - 4 subscription plans
-- - 3 token packages
-- - 5 progress milestones
-- - 8 equipment items across 4 categories
-- - 10+ bookings (equipment and coach sessions)
-- - 5+ workout logs
-- - 2 coach reviews
-- - 2 user milestones
-- - 3 AI program generations
-- - 3 AI chat logs
-- - 3 chat messages
-- - 5 activity feeds
-- - 5 audit logs
-- - Multiple payments and subscriptions
-- - Token transactions
--
-- All data uses dates in 2024 to match the query date filters
-- Data includes various statuses, ratings, and realistic scenarios
-- Ready to test all 74 queries in TestQueries.sql
-- ==========================================
