-- ===============================================
-- SQL Script to Insert 10 Rows for Next 11 Tables (Part 2)
-- IntelliFit Database - Test Data
-- Created: November 22, 2025
-- ===============================================

USE IntelliFitDb;
GO

-- ===============================================
-- Clear existing data for Part 2 tables
-- ===============================================
PRINT 'Clearing existing data for Part 2 tables...';

DELETE FROM MealIngredients;
DELETE FROM Meals;
DELETE FROM Ingredients;
DELETE FROM CoachReviews;
DELETE FROM Payments;
DELETE FROM TokenTransactions;
DELETE FROM MemberCoachSubscriptions;
DELETE FROM WearableDevices;
DELETE FROM InBodyMeasurements;
DELETE FROM Notifications;
DELETE FROM ProgressMilestones;

PRINT 'Part 2 data cleared successfully.';
GO

-- ===============================================
-- 12. Ingredients (No Dependencies)
-- ===============================================
SET IDENTITY_INSERT Ingredients ON;

INSERT INTO Ingredients (IngredientId, Name, Category, CaloriesPer100g, ProteinPer100g, CarbsPer100g, FatsPer100g, Unit)
VALUES
(1, 'Chicken Breast', 'Protein', 165, 31.0, 0, 3.6, 'grams'),
(2, 'Brown Rice', 'Carbs', 112, 2.6, 23.5, 0.9, 'grams'),
(3, 'Broccoli', 'Vegetables', 34, 2.8, 7.0, 0.4, 'grams'),
(4, 'Salmon', 'Protein', 208, 20.0, 0, 13.0, 'grams'),
(5, 'Sweet Potato', 'Carbs', 86, 1.6, 20.0, 0.1, 'grams'),
(6, 'Eggs', 'Protein', 155, 13.0, 1.1, 11.0, 'grams'),
(7, 'Oatmeal', 'Carbs', 389, 16.9, 66.3, 6.9, 'grams'),
(8, 'Almonds', 'Fats', 579, 21.0, 22.0, 49.0, 'grams'),
(9, 'Greek Yogurt', 'Protein', 59, 10.0, 3.6, 0.4, 'grams'),
(10, 'Spinach', 'Vegetables', 23, 2.9, 3.6, 0.4, 'grams');

SET IDENTITY_INSERT Ingredients OFF;
GO

-- ===============================================
-- 13. Meals (Depends on: NutritionPlans)
-- Uses: NutritionPlanId, MealType, Name, Calories, ProteinGrams, CarbsGrams, FatsGrams, RecommendedTime, IsAddedByCoach, AddedByCoachID
-- ===============================================
SET IDENTITY_INSERT Meals ON;

INSERT INTO Meals (MealId, NutritionPlanId, MealType, Name, Calories, ProteinGrams, CarbsGrams, FatsGrams, RecommendedTime, IsAddedByCoach, AddedByCoachID)
VALUES
(1, 1, 'Breakfast', 'High Protein Breakfast', 450, 35, 45, 12, '07:00:00', 1, 8),
(2, 1, 'Lunch', 'Chicken and Rice Bowl', 650, 55, 70, 15, '12:00:00', 1, 8),
(3, 1, 'Dinner', 'Salmon with Sweet Potato', 580, 45, 55, 18, '18:00:00', 1, 8),
(4, 2, 'Breakfast', 'Oatmeal with Berries', 320, 12, 52, 8, '07:00:00', 1, 9),
(5, 2, 'Lunch', 'Grilled Chicken Salad', 380, 42, 25, 12, '12:00:00', 1, 9),
(6, 2, 'Dinner', 'Fish with Vegetables', 420, 38, 28, 15, '18:00:00', 1, 9),
(7, 3, 'Breakfast', 'Egg White Omelet', 550, 48, 55, 18, '07:00:00', 1, 8),
(8, 3, 'Lunch', 'Beef and Rice', 780, 62, 82, 22, '12:00:00', 1, 8),
(9, 4, 'Breakfast', 'Greek Yogurt Bowl', 280, 22, 35, 6, '07:00:00', 1, 9),
(10, 5, 'Dinner', 'Steak and Potatoes', 850, 68, 75, 28, '18:00:00', 1, 8);

SET IDENTITY_INSERT Meals OFF;
GO

-- ===============================================
-- 14. MealIngredients (Depends on: Meals, Ingredients)
-- Uses: MealId, IngredientId, Quantity, Notes, IsAddedByCoach, ModifiedByCoachID
-- ===============================================
SET IDENTITY_INSERT MealIngredients ON;

INSERT INTO MealIngredients (MealIngredientId, MealId, IngredientId, Quantity, Notes, IsAddedByCoach, ModifiedByCoachID)
VALUES
(1, 1, 6, 3, '3 whole eggs', 1, 8),
(2, 1, 7, 50, '50g dry oats', 1, 8),
(3, 2, 1, 200, '200g grilled chicken', 1, 8),
(4, 2, 2, 150, '150g cooked brown rice', 1, 8),
(5, 2, 3, 100, '100g steamed broccoli', 1, 8),
(6, 3, 4, 180, '180g grilled salmon', 1, 8),
(7, 3, 5, 200, '200g baked sweet potato', 1, 8),
(8, 4, 7, 60, '60g dry oatmeal', 1, 9),
(9, 5, 1, 180, '180g chicken breast', 1, 9),
(10, 5, 10, 100, '100g fresh spinach', 1, 9);

SET IDENTITY_INSERT MealIngredients OFF;
GO

-- ===============================================
-- 15. CoachReviews (Depends on: Users [Member & Coach])
-- Uses: UserID, CoachID, Rating, Comment, CreatedAt
-- Rating: 1-5 stars
-- ===============================================
SET IDENTITY_INSERT CoachReviews ON;

INSERT INTO CoachReviews (ReviewID, UserID, CoachID, Rating, Comment, CreatedAt)
VALUES
(1, 1, 8, 5, 'Excellent coach! Very knowledgeable about strength training.', '2024-11-15 10:00:00'),
(2, 2, 9, 5, 'Best yoga instructor I have ever had. Very patient and supportive.', '2024-11-16 10:00:00'),
(3, 3, 8, 5, 'Helped me achieve my powerlifting goals. Highly recommended!', '2024-11-17 10:00:00'),
(4, 4, 9, 4, 'Great instructor, very professional and motivating.', '2024-11-18 10:00:00'),
(5, 5, 8, 5, 'Amazing results in just 3 months. Thank you Coach Khaled!', '2024-11-19 10:00:00'),
(6, 1, 9, 4, 'Good experience with yoga classes, very relaxing.', '2024-11-20 10:00:00'),
(7, 2, 8, 5, 'Transformed my body and mindset. Best decision ever!', '2024-11-21 10:00:00'),
(8, 3, 9, 4, 'Professional and caring coach. Highly recommended.', '2024-11-21 14:00:00'),
(9, 4, 8, 5, 'Very knowledgeable and supportive throughout my journey.', '2024-11-21 16:00:00'),
(10, 5, 9, 5, 'Excellent coaching style, very effective workouts.', '2024-11-22 10:00:00');

SET IDENTITY_INSERT CoachReviews OFF;
GO

-- ===============================================
-- 16. Payments (Depends on: Users)
-- Uses: UserID, PaymentDate, Amount, PaymentMethod, PaymentType, Status(int)
-- Status: 0=Pending, 1=Completed, 2=Failed, 3=Refunded
-- ===============================================
SET IDENTITY_INSERT Payments ON;

INSERT INTO Payments (PaymentID, UserID, PaymentDate, Amount, PaymentMethod, PaymentType, Status)
VALUES
(1, 1, '2024-11-01 10:00:00', 799.99, 'Credit Card', 'Subscription', 1),
(2, 2, '2024-11-05 10:00:00', 499.99, 'Debit Card', 'Subscription', 1),
(3, 3, '2024-10-15 10:00:00', 1299.99, 'Credit Card', 'Subscription', 1),
(4, 4, '2024-11-10 10:00:00', 499.99, 'Cash', 'Subscription', 1),
(5, 5, '2024-10-01 10:00:00', 1999.99, 'Credit Card', 'Subscription', 1),
(6, 1, '2024-11-15 10:00:00', 100.00, 'Credit Card', 'Tokens', 1),
(7, 2, '2024-11-18 10:00:00', 50.00, 'Debit Card', 'Tokens', 1),
(8, 3, '2024-11-20 10:00:00', 200.00, 'Credit Card', 'Tokens', 1),
(9, 4, '2024-11-21 10:00:00', 75.00, 'Cash', 'Tokens', 1),
(10, 5, '2024-11-22 10:00:00', 150.00, 'Credit Card', 'Tokens', 1);

SET IDENTITY_INSERT Payments OFF;
GO

-- ===============================================
-- 17. TokenTransactions (Depends on: Users [Member & Receptionist])
-- Uses: UserID, ReceptionistID, Amount, Type(int), PaymentRef, CreatedAt
-- Type: 0=Purchase, 1=Usage, 2=Refund, 3=Bonus
-- ===============================================
SET IDENTITY_INSERT TokenTransactions ON;

INSERT INTO TokenTransactions (TransactionID, UserID, ReceptionistID, Amount, Type, PaymentRef, CreatedAt)
VALUES
(1, 1, 10, 50, 0, 'PAY-001', '2024-11-01 10:00:00'),
(2, 2, 10, 30, 0, 'PAY-002', '2024-11-05 10:00:00'),
(3, 3, 10, 100, 0, 'PAY-003', '2024-10-15 10:00:00'),
(4, 1, NULL, -2, 1, 'BOOKING-001', '2024-11-22 08:00:00'),
(5, 2, NULL, -2, 1, 'BOOKING-002', '2024-11-22 09:00:00'),
(6, 3, NULL, -3, 1, 'BOOKING-003', '2024-11-22 10:00:00'),
(7, 4, 10, 10, 0, 'PAY-004', '2024-11-10 10:00:00'),
(8, 5, 10, 200, 0, 'PAY-005', '2024-10-01 10:00:00'),
(9, 1, 10, 20, 3, 'BONUS-001', '2024-11-15 10:00:00'),
(10, 2, 10, 10, 3, 'BONUS-002', '2024-11-18 10:00:00');

SET IDENTITY_INSERT TokenTransactions OFF;
GO

-- ===============================================
-- 18. MemberCoachSubscriptions (Depends on: Users [Member & Coach])
-- Uses: UserID, CoachID, StartDate, EndDate, Status(int), Fee
-- Status: 0=Pending, 1=Active, 2=Expired, 3=Cancelled
-- ===============================================
SET IDENTITY_INSERT MemberCoachSubscriptions ON;

INSERT INTO MemberCoachSubscriptions (SubscriptionID, UserID, CoachID, StartDate, EndDate, Status, Fee)
VALUES
(1, 1, 8, '2024-11-01', '2024-12-01', 1, 500.00),
(2, 2, 9, '2024-11-05', '2024-12-05', 1, 450.00),
(3, 3, 8, '2024-10-15', '2024-11-15', 2, 500.00),
(4, 4, 9, '2024-11-10', '2024-12-10', 1, 450.00),
(5, 5, 8, '2024-10-01', '2024-11-01', 2, 500.00),
(6, 1, 9, '2024-09-01', '2024-10-01', 2, 450.00),
(7, 2, 8, '2024-08-01', '2024-09-01', 2, 500.00),
(8, 3, 9, '2024-11-15', '2024-12-15', 1, 450.00),
(9, 4, 8, '2024-10-20', '2024-11-20', 2, 500.00),
(10, 5, 9, '2024-11-01', '2024-12-01', 1, 450.00);

SET IDENTITY_INSERT MemberCoachSubscriptions OFF;
GO

-- ===============================================
-- 19. WearableDevices (Depends on: Users)
-- Uses: UserID, DeviceType, Brand, DeviceIdentifier, PairedAt, IsActive
-- ===============================================
SET IDENTITY_INSERT WearableDevices ON;

INSERT INTO WearableDevices (DeviceID, UserID, DeviceType, Brand, DeviceIdentifier, PairedAt, IsActive)
VALUES
(1, 1, 'Smart Watch', 'Apple', 'AW-001-12345', '2024-01-15 10:00:00', 1),
(2, 2, 'Fitness Band', 'Fitbit', 'FB-002-67890', '2024-02-20 10:00:00', 1),
(3, 3, 'Smart Watch', 'Samsung', 'SW-003-11111', '2024-03-25 10:00:00', 1),
(4, 4, 'Fitness Band', 'Xiaomi', 'XM-004-22222', '2024-04-10 10:00:00', 1),
(5, 5, 'Smart Watch', 'Garmin', 'GR-005-33333', '2024-05-20 10:00:00', 1),
(6, 1, 'Heart Rate Monitor', 'Polar', 'PL-006-44444', '2024-06-15 10:00:00', 1),
(7, 2, 'Smart Watch', 'Apple', 'AW-007-55555', '2024-07-20 10:00:00', 1),
(8, 3, 'Fitness Band', 'Fitbit', 'FB-008-66666', '2024-08-10 10:00:00', 0),
(9, 4, 'Smart Watch', 'Samsung', 'SW-009-77777', '2024-09-15 10:00:00', 1),
(10, 5, 'Fitness Band', 'Xiaomi', 'XM-010-88888', '2024-10-20 10:00:00', 1);

SET IDENTITY_INSERT WearableDevices OFF;
GO

-- ===============================================
-- 20. InBodyMeasurements (Depends on: Users [Member & Receptionist])
-- Uses: UserID, ReceptionistID, Weight, FatPercentage, MuscleMass, BMI, CreatedAt, ReceiptPhotoUrl, AIInsights
-- ===============================================
SET IDENTITY_INSERT InBodyMeasurements ON;

INSERT INTO InBodyMeasurements (InBodyID, UserID, ReceptionistID, Weight, FatPercentage, MuscleMass, BMI, CreatedAt, ReceiptPhotoUrl, AIInsights)
VALUES
(1, 1, 10, 82.5, 18.2, 38.5, 24.8, '2024-11-01 10:00:00', 'https://storage.com/inbody/001.jpg', 'Good muscle mass, continue strength training'),
(2, 2, 10, 65.0, 22.5, 28.3, 22.1, '2024-11-05 10:00:00', 'https://storage.com/inbody/002.jpg', 'Fat percentage slightly high, recommend cardio'),
(3, 3, 10, 95.0, 15.8, 48.2, 27.5, '2024-10-15 10:00:00', 'https://storage.com/inbody/003.jpg', 'Excellent muscle mass for powerlifting'),
(4, 4, 10, 58.0, 24.0, 24.1, 20.5, '2024-11-10 10:00:00', 'https://storage.com/inbody/004.jpg', 'Focus on muscle building exercises'),
(5, 5, 10, 88.0, 16.5, 42.8, 26.2, '2024-10-01 10:00:00', 'https://storage.com/inbody/005.jpg', 'Great condition for athletic performance'),
(6, 1, 10, 81.0, 17.5, 39.2, 24.3, '2024-11-15 10:00:00', 'https://storage.com/inbody/006.jpg', 'Good progress, fat down, muscle up'),
(7, 2, 10, 63.5, 21.8, 28.9, 21.6, '2024-11-18 10:00:00', 'https://storage.com/inbody/007.jpg', 'Fat loss progressing well'),
(8, 3, 10, 96.5, 15.2, 49.5, 27.9, '2024-11-20 10:00:00', 'https://storage.com/inbody/008.jpg', 'Muscle gain on track'),
(9, 4, 10, 59.0, 23.2, 24.8, 20.8, '2024-11-21 10:00:00', 'https://storage.com/inbody/009.jpg', 'Slight improvement in muscle mass'),
(10, 5, 10, 87.0, 16.0, 43.5, 25.9, '2024-11-22 10:00:00', 'https://storage.com/inbody/010.jpg', 'Maintaining excellent condition');

SET IDENTITY_INSERT InBodyMeasurements OFF;
GO

-- ===============================================
-- 21. Notifications (Depends on: Users)
-- Uses: UserID, Message, Type(int), Status, CreatedAt
-- Type: 0=Info, 1=Warning, 2=Success, 3=Error
-- ===============================================
SET IDENTITY_INSERT Notifications ON;

INSERT INTO Notifications (NotificationID, UserID, Message, Type, Status, CreatedAt)
VALUES
(1, 1, 'Your booking for Treadmill Pro X1 is confirmed', 2, 'Read', '2024-11-22 08:00:00'),
(2, 2, 'Your workout session with Coach Dina is scheduled for tomorrow', 0, 'Unread', '2024-11-22 09:00:00'),
(3, 3, 'New workout plan assigned by Coach Khaled', 2, 'Read', '2024-11-15 10:00:00'),
(4, 4, 'Your subscription will expire in 7 days', 1, 'Unread', '2024-11-22 10:00:00'),
(5, 5, 'Payment of 1999.99 EGP received successfully', 2, 'Read', '2024-10-01 10:00:00'),
(6, 1, 'You earned 20 bonus tokens!', 2, 'Read', '2024-11-15 10:00:00'),
(7, 2, 'Your InBody measurement is ready', 0, 'Read', '2024-11-18 10:00:00'),
(8, 3, 'Equipment maintenance scheduled, booking cancelled', 1, 'Read', '2024-11-20 10:00:00'),
(9, 4, 'New nutrition plan created by Coach Dina', 2, 'Unread', '2024-11-21 10:00:00'),
(10, 5, 'Congratulations! You achieved a new milestone', 2, 'Unread', '2024-11-22 10:00:00');

SET IDENTITY_INSERT Notifications OFF;
GO

-- ===============================================
-- 22. ProgressMilestones (Depends on: Users)
-- Uses: UserID, Title, Description, AchievedAt, IsAIGenerated
-- ===============================================
SET IDENTITY_INSERT ProgressMilestones ON;

INSERT INTO ProgressMilestones (MilestoneID, UserID, Title, Description, AchievedAt, IsAIGenerated)
VALUES
(1, 1, 'First Month Complete', 'Completed first month of training consistently', '2024-02-10 10:00:00', 0),
(2, 2, 'Lost 5kg', 'Successfully lost 5kg through diet and exercise', '2024-10-01 10:00:00', 1),
(3, 3, 'Bench Press 100kg', 'Achieved 100kg bench press for the first time', '2024-11-01 10:00:00', 0),
(4, 4, 'Perfect Attendance', 'Attended all scheduled yoga classes for 30 days', '2024-11-10 10:00:00', 1),
(5, 5, 'Squat Personal Record', 'New personal record: 180kg squat', '2024-11-15 10:00:00', 0),
(6, 1, 'Body Fat Reduced', 'Reduced body fat percentage by 3%', '2024-11-15 10:00:00', 1),
(7, 2, 'Improved Flexibility', 'Can now touch toes comfortably', '2024-11-18 10:00:00', 0),
(8, 3, 'Deadlift 200kg', 'Achieved 200kg deadlift milestone', '2024-11-20 10:00:00', 0),
(9, 4, 'Core Strength Up', 'Can hold plank for 3 minutes', '2024-11-21 10:00:00', 1),
(10, 5, '50 Workouts Done', 'Completed 50 workout sessions', '2024-11-22 10:00:00', 1);

SET IDENTITY_INSERT ProgressMilestones OFF;
GO

PRINT 'Successfully inserted 10 rows into next 11 tables!';
PRINT 'Tables populated (Part 2):';
PRINT ' 12. Ingredients (10 rows)';
PRINT ' 13. Meals (10 rows)';
PRINT ' 14. MealIngredients (10 rows)';
PRINT ' 15. CoachReviews (10 rows)';
PRINT ' 16. Payments (10 rows)';
PRINT ' 17. TokenTransactions (10 rows)';
PRINT ' 18. MemberCoachSubscriptions (10 rows)';
PRINT ' 19. WearableDevices (10 rows)';
PRINT ' 20. InBodyMeasurements (10 rows)';
PRINT ' 21. Notifications (10 rows)';
PRINT ' 22. ProgressMilestones (10 rows)';
GO
