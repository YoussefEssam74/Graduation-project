-- IntelliFit Database Extended Seed Data - Additional Tables
-- ==========================================
-- This file should be run AFTER SeedData_Complete.sql
-- Contains: workout plan exercises, workout logs, meals, meal ingredients, 
-- inbody measurements, user subscriptions, payments, token transactions,
-- coach reviews, notifications, activity feeds, user milestones, 
-- AI chat logs, AI workflow jobs, AI program generations, and audit logs
-- ==========================================

-- ==========================================
-- WORKOUT PLAN EXERCISES
-- ==========================================
INSERT INTO workout_plan_exercises ("WorkoutPlanId", "ExerciseId", "DayNumber", "OrderInDay", "Sets", "Reps", "RestSeconds", "Notes", "CreatedAt") VALUES
-- Plan 1 (John Doe - Weight Loss) Day 1
(1, 1, 1, 1, 3, 12, 90, 'Focus on form', CURRENT_TIMESTAMP),
(1, 2, 1, 2, 3, 10, 90, 'Controlled tempo', CURRENT_TIMESTAMP),
(1, 5, 1, 3, 3, 60, 30, 'Hold for 60 seconds', CURRENT_TIMESTAMP),
-- Plan 2 (Michael Smith - Muscle Building) Day 1 & 2
(2, 1, 1, 1, 4, 8, 120, 'Heavy weight, good form', CURRENT_TIMESTAMP),
(2, 3, 1, 2, 4, 6, 180, 'Progressive overload', CURRENT_TIMESTAMP),
(2, 4, 2, 1, 4, 8, 120, 'Full range of motion', CURRENT_TIMESTAMP);

-- ==========================================
-- WORKOUT LOGS
-- ==========================================
INSERT INTO workout_logs ("UserId", "PlanId", "WorkoutDate", "DurationMinutes", "CaloriesBurned", "ExercisesCompleted", "Notes", "FeelingRating", "Completed", "CreatedAt") VALUES
(1, 1, '2024-11-15 08:00:00+00', 45, 300, 'Barbell Squat, Bench Press, Plank', 'Good workout, felt strong', 4, true, CURRENT_TIMESTAMP),
(3, 2, '2024-11-16 09:00:00+00', 60, 420, 'Barbell Squat, Deadlift', 'New PR on squats! Heavy deadlift day', 5, true, CURRENT_TIMESTAMP),
(1, 1, '2024-11-17 08:00:00+00', 50, 330, 'Barbell Squat, Bench Press, Plank', 'Consistent progress', 4, true, CURRENT_TIMESTAMP),
(3, 2, '2024-11-18 09:00:00+00', 65, 450, 'Pull-ups, Deadlift, Bench Press', 'Great session, feeling pumped', 5, true, CURRENT_TIMESTAMP);

-- ==========================================
-- MEALS
-- ==========================================
INSERT INTO meals ("NutritionPlanId", "MealType", "Name", "Calories", "ProteinGrams", "CarbsGrams", "FatsGrams", "RecommendedTime", "CreatedAt") VALUES
(1, 'Lunch', 'Chicken & Rice Bowl', 450, 45, 50, 12, '12:00:00', CURRENT_TIMESTAMP),
(1, 'Dinner', 'Salmon Dinner', 520, 40, 35, 28, '18:00:00', CURRENT_TIMESTAMP),
(2, 'Breakfast', 'Bulking Breakfast', 720, 50, 85, 22, '08:00:00', CURRENT_TIMESTAMP);

-- ==========================================
-- MEAL INGREDIENTS
-- ==========================================
INSERT INTO meal_ingredients ("MealId", "IngredientId", "Quantity", "Unit") VALUES
(1, 1, 200, 'g'),
(1, 2, 150, 'g'),
(1, 3, 100, 'g'),
(2, 4, 180, 'g'),
(2, 3, 150, 'g'),
(3, 5, 180, 'g'),
(3, 2, 200, 'g');

-- ==========================================
-- INBODY MEASUREMENTS
-- ==========================================
INSERT INTO inbody_measurements ("UserId", "MeasurementDate", "Weight", "BodyFatPercentage", "MuscleMass", "BodyWaterPercentage", "VisceralFatLevel", "Bmr", "MeasuredBy", "Notes", "CreatedAt") VALUES
(1, '2024-11-01 10:00:00+00', 85.5, 22.3, 63.2, 58.5, 8, 1850, 9, 'Initial assessment', CURRENT_TIMESTAMP),
(1, '2024-11-15 10:00:00+00', 83.8, 20.9, 64.1, 59.2, 7, 1870, 9, 'Good progress', CURRENT_TIMESTAMP),
(3, '2024-10-15 11:00:00+00', 78.5, 12.5, 66.8, 62.1, 4, 2020, 9, 'Baseline measurement', CURRENT_TIMESTAMP),
(3, '2024-11-15 11:00:00+00', 81.2, 12.8, 69.5, 62.8, 4, 2105, 9, 'Gaining muscle mass', CURRENT_TIMESTAMP);

-- ==========================================
-- PAYMENTS
-- ==========================================
INSERT INTO payments ("UserId", "Amount", "Currency", "PaymentMethod", "PaymentType", "Status", "TransactionReference", "PackageId", "GatewayResponse", "CreatedAt", "UpdatedAt") VALUES
(1, 79.99, 'USD', 'CreditCard', 'Subscription', 1, 'TXN-1001', NULL, '{"status": "success", "authCode": "ABC123"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 129.99, 'USD', 'CreditCard', 'Subscription', 1, 'TXN-1002', NULL, '{"status": "success", "authCode": "DEF456"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 49.99, 'USD', 'DebitCard', 'Subscription', 1, 'TXN-1003', NULL, '{"status": "success", "authCode": "GHI789"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 79.99, 'USD', 'CreditCard', 'Subscription', 1, 'TXN-1004', NULL, '{"status": "success", "authCode": "JKL012"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 39.99, 'USD', 'CreditCard', 'TokenPurchase', 1, 'TXN-1005', 3, '{"status": "success", "authCode": "MNO345"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==========================================
-- USER SUBSCRIPTIONS
-- ==========================================
INSERT INTO user_subscriptions ("UserId", "PlanId", "StartDate", "EndDate", "Status", "AutoRenew", "RenewalReminderSent", "PaymentId", "CreatedAt", "UpdatedAt") VALUES
(1, 2, '2024-11-01', '2024-12-01', 0, true, false, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 3, '2024-10-15', '2024-11-15', 0, true, false, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 1, '2024-11-10', '2024-12-10', 0, false, false, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 2, '2024-10-20', '2024-11-20', 0, true, false, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==========================================
-- TOKEN TRANSACTIONS
-- ==========================================
INSERT INTO token_transactions ("UserId", "Amount", "TransactionType", "Description", "ReferenceType", "ReferenceId", "BalanceBefore", "BalanceAfter", "CreatedAt") VALUES
(1, 50, 0, 'Subscription plan tokens', 'Subscription', 1, 0, 50, CURRENT_TIMESTAMP),
(1, -5, 1, 'Equipment booking', 'Booking', 1, 50, 45, CURRENT_TIMESTAMP),
(3, 100, 0, 'Subscription plan tokens', 'Subscription', 2, 0, 100, CURRENT_TIMESTAMP),
(3, -15, 1, 'Coach session booking', 'Booking', 2, 100, 85, CURRENT_TIMESTAMP),
(5, 20, 0, 'Subscription plan tokens', 'Subscription', 3, 0, 20, CURRENT_TIMESTAMP),
(5, -6, 1, 'Equipment booking', 'Booking', 3, 20, 14, CURRENT_TIMESTAMP),
(1, 250, 0, 'Token package purchase', 'TokenPackage', 3, 45, 295, CURRENT_TIMESTAMP);

-- ==========================================
-- COACH REVIEWS
-- ==========================================
INSERT INTO coach_reviews ("CoachId", "UserId", "BookingId", "Rating", "ReviewText", "IsAnonymous", "CreatedAt", "UpdatedAt") VALUES
(2, 1, 2, 5, 'Sarah is an amazing coach! Very knowledgeable and supportive.', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 3, 2, 5, 'Great training session, learned proper squat form.', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 3, NULL, 5, 'Emily really knows her stuff about powerlifting. Highly recommend!', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==========================================
-- NOTIFICATIONS
-- ==========================================
INSERT INTO notifications ("UserId", "NotificationType", "Priority", "Title", "Message", "ReferenceType", "ReferenceId", "IsRead", "ReadAt", "CreatedAt", "UpdatedAt") VALUES
(1, 0, 'normal', 'Booking Confirmed', 'Your equipment booking for Treadmill Pro X1 is confirmed', 'Booking', 1, true, '2024-11-28 10:00:00+00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 0, 'normal', 'Coach Session Confirmed', 'Your training session with Sarah Johnson is confirmed', 'Booking', 2, true, '2024-11-27 15:30:00+00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 2, 'normal', 'Subscription Active', 'Your Standard Monthly subscription is now active', 'Subscription', 1, true, '2024-10-31 14:30:00+00', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 3, 'high', 'Achievement Unlocked!', 'You earned the "First Workout" milestone!', 'Milestone', 1, false, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==========================================
-- ACTIVITY FEEDS
-- ==========================================
INSERT INTO activity_feeds ("UserId", "ActivityType", "Title", "Description", "ReferenceType", "ReferenceId", "CreatedAt") VALUES
(1, 'WorkoutCompleted', 'Workout Completed', 'Completed workout: Weight Loss Transformation - Day 1', 'Workout', 1, '2024-11-15 09:00:00+00'),
(3, 'WorkoutCompleted', 'Workout Completed', 'Completed workout: Muscle Building Program - Day 1', 'Workout', 3, '2024-11-16 10:00:00+00'),
(1, 'MilestoneAchieved', 'Milestone Achieved', 'Achieved milestone: First Workout', 'Milestone', 1, '2024-11-15 09:00:00+00'),
(3, 'ReviewPosted', 'Review Posted', 'Posted review for coach Sarah Johnson', 'Review', 2, '2024-11-17 11:00:00+00');

-- ==========================================
-- USER MILESTONES
-- ==========================================
INSERT INTO user_milestones ("UserId", "MilestoneId", "CurrentProgress", "IsCompleted", "CompletedAt", "CreatedAt") VALUES
(1, 1, 1, true, '2024-11-15 09:00:00+00', CURRENT_TIMESTAMP),
(3, 1, 1, true, '2024-10-16 10:00:00+00', CURRENT_TIMESTAMP),
(3, 2, 7, true, '2024-10-23 10:00:00+00', CURRENT_TIMESTAMP),
(3, 3, 30, true, '2024-11-15 10:00:00+00', CURRENT_TIMESTAMP);

-- ==========================================
-- AI CHAT LOGS
-- ==========================================
INSERT INTO ai_chat_logs ("UserId", "SessionId", "MessageType", "MessageContent", "TokensUsed", "AiModel", "CreatedAt") VALUES
(1, gen_random_uuid(), 'user', 'I need help creating a weight loss workout plan', 0, 'gpt-4', '2024-10-25 14:00:00+00'),
(1, gen_random_uuid(), 'assistant', 'I can help you create a personalized weight loss workout plan. Let me ask a few questions about your fitness level and goals.', 15, 'gpt-4', '2024-10-25 14:00:15+00'),
(3, gen_random_uuid(), 'user', 'What exercises should I do for muscle building?', 0, 'gpt-4', '2024-10-10 16:30:00+00'),
(3, gen_random_uuid(), 'assistant', 'For muscle building, focus on compound exercises like squats, deadlifts, bench press, and pull-ups. I recommend training 4-6 days per week.', 20, 'gpt-4', '2024-10-10 16:30:20+00');

-- ==========================================
-- AI WORKFLOW JOBS
-- ==========================================
INSERT INTO ai_workflow_jobs ("UserId", "JobType", "Status", "RequestPayload", "ResponsePayload", "CompletedAt", "CreatedAt") VALUES
(1, 'WorkoutPlanGeneration', 'Completed', '{"goal": "weight_loss", "experience": "intermediate", "days_per_week": 5}', '{"plan_id": 1, "duration_weeks": 8}', '2024-10-28 10:02:00+00', CURRENT_TIMESTAMP),
(3, 'NutritionPlanGeneration', 'Completed', '{"goal": "muscle_gain", "daily_calories": 2800, "protein_grams": 200}', '{"plan_id": 2, "meals_count": 5}', '2024-10-12 14:03:00+00', CURRENT_TIMESTAMP);

-- ==========================================
-- AI PROGRAM GENERATIONS
-- ==========================================
INSERT INTO ai_program_generations ("UserId", "ProgramType", "InputPrompt", "GeneratedPlan", "TokensUsed", "WorkoutPlanId", "NutritionPlanId", "CreatedAt") VALUES
(1, 'Workout', 'Create an 8-week weight loss program for intermediate level', '{"plan": "Weight Loss Transformation", "details": "5 days per week focusing on compound movements and cardio"}', 20, 1, NULL, CURRENT_TIMESTAMP),
(3, 'Nutrition', 'Create a muscle building nutrition plan with 2800 calories', '{"plan": "Muscle Gain Diet", "details": "High protein, moderate carbs, healthy fats distribution"}', 25, NULL, 2, CURRENT_TIMESTAMP);

-- ==========================================
-- AUDIT LOGS
-- ==========================================
INSERT INTO audit_logs ("UserId", "Action", "TableName", "RecordId", "NewValues", "IpAddress", "UserAgent", "CreatedAt") VALUES
(1, 'Login', 'User', 1, '{"status": "success"}', '192.168.1.100', 'Mozilla/5.0', '2024-11-15 08:00:00+00'),
(1, 'Create', 'Booking', 1, '{"equipment_id": 1, "start_time": "2024-12-02 08:00:00"}', '192.168.1.100', 'Mozilla/5.0', '2024-11-28 09:30:00+00'),
(2, 'Create', 'WorkoutPlan', 1, '{"member_id": 1, "plan_name": "Weight Loss Transformation"}', '192.168.1.105', 'Mozilla/5.0', '2024-10-28 10:00:00+00'),
(9, 'Create', 'Payment', 1, '{"user_id": 1, "amount": 79.99, "status": "completed"}', '192.168.1.110', 'Mozilla/5.0', '2024-10-31 14:30:00+00');

-- ==========================================
-- WORKOUT TEMPLATES (Used by coaches)
-- ==========================================
INSERT INTO workout_templates ("CreatedByCoachId", "TemplateName", "Description", "DifficultyLevel", "DurationWeeks", "WorkoutsPerWeek", "IsPublic", "IsActive", "CreatedAt", "UpdatedAt") VALUES
(2, 'Beginner Full Body', 'Perfect starter routine for beginners', 'Beginner', 4, 3, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Advanced Powerlifting', 'Focus on main lifts with progressive overload', 'Advanced', 12, 5, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 'CrossFit WOD', 'High intensity workout of the day', 'Intermediate', 8, 5, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ==========================================
-- WORKOUT TEMPLATE EXERCISES
-- ==========================================
INSERT INTO workout_template_exercises ("TemplateId", "ExerciseId", "WeekNumber", "DayNumber", "OrderInDay", "Sets", "Reps", "RestSeconds", "Notes", "CreatedAt") VALUES
(1, 1, 1, 1, 1, 3, 12, 90, 'Focus on form over weight', CURRENT_TIMESTAMP),
(1, 2, 1, 1, 2, 3, 10, 90, 'Controlled descent', CURRENT_TIMESTAMP),
(1, 5, 1, 1, 3, 3, 60, 30, 'Core stability', CURRENT_TIMESTAMP),
(2, 1, 1, 1, 1, 5, 5, 180, 'Heavy weight', CURRENT_TIMESTAMP),
(2, 3, 1, 1, 2, 5, 3, 240, 'Progressive overload', CURRENT_TIMESTAMP),
(2, 2, 1, 1, 3, 5, 5, 180, 'Explosive press', CURRENT_TIMESTAMP);

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 'workout_plan_exercises' as table_name, COUNT(*) FROM workout_plan_exercises
UNION ALL SELECT 'workout_logs', COUNT(*) FROM workout_logs
UNION ALL SELECT 'meals', COUNT(*) FROM meals
UNION ALL SELECT 'meal_ingredients', COUNT(*) FROM meal_ingredients
UNION ALL SELECT 'inbody_measurements', COUNT(*) FROM inbody_measurements
UNION ALL SELECT 'user_subscriptions', COUNT(*) FROM user_subscriptions
UNION ALL SELECT 'payments', COUNT(*) FROM payments
UNION ALL SELECT 'token_transactions', COUNT(*) FROM token_transactions
UNION ALL SELECT 'coach_reviews', COUNT(*) FROM coach_reviews
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'activity_feeds', COUNT(*) FROM activity_feeds
UNION ALL SELECT 'user_milestones', COUNT(*) FROM user_milestones
UNION ALL SELECT 'ai_chat_logs', COUNT(*) FROM ai_chat_logs
UNION ALL SELECT 'ai_workflow_jobs', COUNT(*) FROM ai_workflow_jobs
UNION ALL SELECT 'ai_program_generations', COUNT(*) FROM ai_program_generations
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL SELECT 'workout_templates', COUNT(*) FROM workout_templates
UNION ALL SELECT 'workout_template_exercises', COUNT(*) FROM workout_template_exercises
ORDER BY table_name;
