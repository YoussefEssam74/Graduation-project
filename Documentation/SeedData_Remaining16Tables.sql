-- IntelliFit Database Seed Data - PostgreSQL Version
-- Part 2: Remaining 16 Tables (Tables 16-31) with 10 Rows Each
-- ==========================================

-- TABLE 16: Workout Logs (10 rows)
-- ==========================================
INSERT INTO workout_logs (user_id, plan_id, exercise_id, sets_completed, reps_completed, weight_used, duration_minutes, calories_burned, notes, workout_date, created_at, updated_at) VALUES
(1, 1, 1, 4, 12, 135, 45, 320, 'Great squat session', '2024-11-20', NOW(), NOW()),
(3, 2, 3, 5, 5, 315, 60, 450, 'PR on deadlifts!', '2024-11-21', NOW(), NOW()),
(5, 3, 6, 3, 60, 0, 30, 150, 'Plank holds improving', '2024-11-22', NOW(), NOW()),
(6, 4, 2, 4, 10, 135, 40, 280, 'Bench press form perfect', '2024-11-23', NOW(), NOW()),
(8, 5, 7, 3, 15, 25, 35, 200, 'Lunges felt strong', '2024-11-24', NOW(), NOW()),
(1, 1, 4, 4, 8, 0, 25, 180, 'Pull-ups getting easier', '2024-11-25', NOW(), NOW()),
(3, 2, 8, 4, 8, 185, 35, 240, 'Row technique improved', '2024-11-26', NOW(), NOW()),
(5, 9, 5, 3, 12, 30, 20, 120, 'Shoulder press comfortable', '2024-11-26', NOW(), NOW()),
(6, 10, 1, 5, 10, 95, 50, 310, 'CrossFit squat workout', '2024-11-27', NOW(), NOW()),
(8, 5, 9, 3, 12, 20, 18, 95, 'Bicep curls focused', '2024-11-27', NOW(), NOW());

-- TABLE 17: Workout Templates (10 rows)
-- ==========================================
INSERT INTO workout_templates (template_name, description, difficulty_level, target_audience, estimated_duration_minutes, created_by_coach_id, is_public, created_at, updated_at) VALUES
('Full Body Blast', 'Complete full body workout for beginners', 'Beginner', 'Beginners, General Fitness', 45, 2, true, NOW(), NOW()),
('Upper Body Power', 'Intense upper body strength training', 'Advanced', 'Strength Training, Bodybuilding', 60, 4, true, NOW(), NOW()),
('Lower Body Sculpt', 'Leg and glute focused workout', 'Intermediate', 'Muscle Building, Weight Loss', 50, 7, true, NOW(), NOW()),
('Core Crusher', 'Abdominal and core strengthening', 'Intermediate', 'General Fitness, Athletes', 30, 2, true, NOW(), NOW()),
('HIIT Cardio', 'High intensity interval training', 'Advanced', 'Weight Loss, Endurance', 35, 7, true, NOW(), NOW()),
('Push Day', 'Chest, shoulders, triceps workout', 'Intermediate', 'Bodybuilding, Strength', 55, 4, true, NOW(), NOW()),
('Pull Day', 'Back and biceps training', 'Intermediate', 'Bodybuilding, Strength', 55, 4, true, NOW(), NOW()),
('Leg Day Classic', 'Traditional leg training protocol', 'Advanced', 'Strength, Powerlifting', 70, 2, true, NOW(), NOW()),
('Recovery Flow', 'Active recovery and mobility work', 'Beginner', 'All Levels, Recovery', 40, 7, true, NOW(), NOW()),
('Athletic Performance', 'Sport-specific training template', 'Advanced', 'Athletes, Sports Performance', 65, 4, true, NOW(), NOW());

-- TABLE 18: Workout Template Exercises (10 rows)
-- ==========================================
INSERT INTO workout_template_exercises (template_id, exercise_id, order_in_workout, sets, reps, rest_seconds, intensity_level, notes, created_at, updated_at) VALUES
(1, 1, 1, 3, 12, 90, 'Moderate', 'Full body foundational movement', NOW(), NOW()),
(1, 2, 2, 3, 10, 90, 'Moderate', 'Upper body pressing', NOW(), NOW()),
(1, 4, 3, 3, 8, 120, 'Moderate', 'Pull-ups or assisted', NOW(), NOW()),
(2, 2, 1, 5, 5, 180, 'Heavy', 'Heavy bench press', NOW(), NOW()),
(2, 5, 2, 4, 8, 120, 'Heavy', 'Shoulder press strength', NOW(), NOW()),
(2, 10, 3, 4, 10, 90, 'Moderate', 'Tricep isolation', NOW(), NOW()),
(3, 1, 1, 4, 10, 120, 'Heavy', 'Squats for legs', NOW(), NOW()),
(3, 7, 2, 4, 12, 60, 'Moderate', 'Lunges each leg', NOW(), NOW()),
(4, 6, 1, 4, 60, 60, 'Moderate', 'Plank holds', NOW(), NOW()),
(5, 1, 1, 6, 30, 30, 'High', 'HIIT squats', NOW(), NOW());

-- TABLE 19: Nutrition Plans (10 rows)
-- ==========================================
INSERT INTO nutrition_plans (user_id, plan_name, description, goals, total_calories, total_protein, total_carbs, total_fats, meals, dietary_restrictions, start_date, end_date, status, generated_by_coach_id, approved_by_coach_id, approval_date, source, is_active, created_at, updated_at) VALUES
(1, 'Weight Loss Nutrition', 'Calorie deficit plan for fat loss', 'Lose 2 lbs per week while maintaining muscle', 1800, 150, 180, 50, '{"breakfast": "Oatmeal with berries", "lunch": "Grilled chicken salad", "dinner": "Salmon with vegetables"}', 'None', '2024-11-01', '2024-12-31', 'Active', 4, 4, '2024-10-30', 'CoachCreated', true, NOW(), NOW()),
(3, 'Muscle Gain Nutrition', 'High protein calorie surplus plan', 'Gain lean muscle mass', 3200, 220, 380, 95, '{"breakfast": "Eggs and whole grain toast", "lunch": "Beef and rice bowl", "dinner": "Chicken pasta"}', 'None', '2024-10-15', '2024-12-15', 'Active', 4, 4, '2024-10-13', 'AIGenerated', true, NOW(), NOW()),
(5, 'Balanced Meal Plan', 'Maintenance calories with balanced macros', 'Maintain weight, improve health', 2400, 160, 270, 75, '{"breakfast": "Greek yogurt parfait", "lunch": "Turkey wrap", "dinner": "Stir fry with tofu"}', 'None', '2024-11-10', '2024-12-20', 'Active', NULL, 4, '2024-11-12', 'AIGenerated', true, NOW(), NOW()),
(6, 'Vegan Weight Loss', 'Plant-based calorie deficit plan', 'Lose weight on vegan diet', 1700, 120, 200, 55, '{"breakfast": "Smoothie bowl", "lunch": "Quinoa Buddha bowl", "dinner": "Lentil curry"}', 'Vegan', '2024-09-01', '2024-11-30', 'Completed', 4, 4, '2024-08-29', 'CoachCreated', false, NOW(), NOW()),
(8, 'Endurance Athlete Plan', 'High carb plan for endurance training', 'Fuel long cardio sessions', 2800, 140, 400, 70, '{"breakfast": "Pancakes with fruit", "lunch": "Pasta with lean meat", "dinner": "Rice and chicken"}', 'None', '2024-11-05', '2025-01-05', 'Active', 4, 4, '2024-11-03', 'CoachCreated', true, NOW(), NOW()),
(10, 'Keto Diet Plan', 'Low carb high fat ketogenic plan', 'Enter ketosis for fat burning', 2000, 130, 50, 155, '{"breakfast": "Eggs and bacon", "lunch": "Avocado chicken salad", "dinner": "Steak with butter"}', 'Low Carb', '2024-11-15', '2025-01-15', 'PendingApproval', NULL, NULL, NULL, 'AIGenerated', true, NOW(), NOW()),
(1, 'Maintenance Plan', 'Balanced maintenance calories', 'Maintain current physique', 2200, 165, 250, 70, '{"breakfast": "Protein shake", "lunch": "Chicken and rice", "dinner": "Fish tacos"}', 'None', '2024-08-01', '2024-10-31', 'Completed', 4, 4, '2024-07-28', 'CoachCreated', false, NOW(), NOW()),
(3, 'Competition Prep', 'Strict cutting diet for contest', 'Get stage lean', 1600, 180, 120, 35, '{"breakfast": "Egg whites and oatmeal", "lunch": "Tilapia and vegetables", "dinner": "Chicken breast and greens"}', 'None', '2024-07-01', '2024-09-30', 'Completed', 4, 4, '2024-06-28', 'CoachCreated', false, NOW(), NOW()),
(5, 'Family Friendly Meals', 'Healthy meals the whole family enjoys', 'Eat healthy without special meals', 2300, 145, 280, 75, '{"breakfast": "Breakfast burrito", "lunch": "Homemade pizza", "dinner": "Tacos with beans"}', 'None', '2024-10-01', '2024-11-30', 'Active', NULL, 4, '2024-10-03', 'AIGenerated', true, NOW(), NOW()),
(6, 'Mediterranean Diet', 'Heart-healthy Mediterranean approach', 'Improve cardiovascular health', 2100, 140, 230, 80, '{"breakfast": "Greek yogurt", "lunch": "Hummus and vegetables", "dinner": "Grilled fish"}', 'None', '2024-11-01', '2024-12-31', 'Active', 4, 4, '2024-10-29', 'CoachCreated', true, NOW(), NOW());

-- TABLE 20: Meals (10 rows)
-- ==========================================
INSERT INTO meals (meal_name, meal_type, description, calories, protein, carbs, fats, preparation_time, cooking_time, servings, instructions, recommended_time, created_by_coach_id, is_public, created_at, updated_at) VALUES
('High Protein Breakfast Bowl', 'Breakfast', 'Eggs, turkey bacon, and avocado bowl', 450, 35, 25, 28, '00:05:00', '00:10:00', 1, 'Cook eggs and bacon, slice avocado, combine in bowl', '07:00:00', 4, true, NOW(), NOW()),
('Chicken Rice Power Lunch', 'Lunch', 'Grilled chicken breast with brown rice and broccoli', 520, 45, 55, 12, '00:10:00', '00:25:00', 1, 'Grill chicken, cook rice, steam broccoli, portion and season', '12:00:00', 4, true, NOW(), NOW()),
('Salmon Dinner Plate', 'Dinner', 'Baked salmon with sweet potato and asparagus', 580, 42, 48, 22, '00:08:00', '00:20:00', 1, 'Bake salmon at 400F, roast vegetables, serve together', '18:00:00', 4, true, NOW(), NOW()),
('Post-Workout Shake', 'Snack', 'Protein shake with banana and peanut butter', 380, 40, 35, 10, '00:03:00', '00:00:00', 1, 'Blend protein powder, banana, peanut butter, and almond milk', '15:00:00', 2, true, NOW(), NOW()),
('Greek Salad Bowl', 'Lunch', 'Mediterranean salad with feta and olives', 420, 18, 32, 26, '00:15:00', '00:00:00', 1, 'Chop vegetables, add feta, olives, dress with olive oil', '12:30:00', 4, true, NOW(), NOW()),
('Oatmeal Power Breakfast', 'Breakfast', 'Steel cut oats with berries and nuts', 380, 12, 58, 12, '00:02:00', '00:10:00', 1, 'Cook oats, top with berries, nuts, and honey', '07:30:00', 4, true, NOW(), NOW()),
('Steak and Vegetables', 'Dinner', 'Grilled sirloin steak with mixed vegetables', 650, 52, 35, 32, '00:10:00', '00:15:00', 1, 'Grill steak to preference, sauté vegetables, serve', '19:00:00', 2, true, NOW(), NOW()),
('Tuna Salad Wrap', 'Lunch', 'Whole wheat wrap with tuna and vegetables', 420, 32, 42, 14, '00:10:00', '00:00:00', 1, 'Mix tuna with light mayo, add vegetables, wrap in tortilla', '13:00:00', 4, true, NOW(), NOW()),
('Veggie Stir Fry', 'Dinner', 'Tofu and vegetable stir fry with rice', 480, 24, 68, 14, '00:15:00', '00:12:00', 1, 'Stir fry tofu and vegetables, serve over rice', '18:30:00', 4, true, NOW(), NOW()),
('Protein Pancakes', 'Breakfast', 'High protein pancakes with berries', 420, 30, 52, 8, '00:05:00', '00:08:00', 1, 'Mix protein powder with pancake batter, cook, top with berries', '08:00:00', 2, true, NOW(), NOW());

-- TABLE 21: Meal Ingredients (10 rows)
-- ==========================================
INSERT INTO meal_ingredients (meal_id, ingredient_id, quantity, unit, created_at, updated_at) VALUES
(1, 1, 3, 'whole', NOW(), NOW()),
(1, 2, 100, 'grams', NOW(), NOW()),
(2, 3, 150, 'grams', NOW(), NOW()),
(2, 4, 200, 'grams', NOW(), NOW()),
(3, 5, 150, 'grams', NOW(), NOW()),
(3, 6, 200, 'grams', NOW(), NOW()),
(4, 7, 1, 'scoop', NOW(), NOW()),
(4, 8, 1, 'whole', NOW(), NOW()),
(5, 9, 100, 'grams', NOW(), NOW()),
(5, 10, 150, 'grams', NOW(), NOW());

-- TABLE 22: Ingredients (10 rows)
-- ==========================================
INSERT INTO ingredients (name, category, calories_per100g, protein_per100g, carbs_per100g, fats_per100g, is_active, created_at, updated_at) VALUES
('Whole Eggs', 'Protein', 155, 13.0, 1.1, 11.0, true, NOW(), NOW()),
('Turkey Bacon', 'Protein', 170, 20.0, 2.0, 9.0, true, NOW(), NOW()),
('Chicken Breast', 'Protein', 165, 31.0, 0.0, 3.6, true, NOW(), NOW()),
('Brown Rice', 'Carbohydrate', 112, 2.6, 24.0, 0.9, true, NOW(), NOW()),
('Salmon', 'Protein', 206, 22.0, 0.0, 13.0, true, NOW(), NOW()),
('Sweet Potato', 'Carbohydrate', 86, 1.6, 20.0, 0.1, true, NOW(), NOW()),
('Whey Protein', 'Supplement', 400, 80.0, 8.0, 5.0, true, NOW(), NOW()),
('Banana', 'Fruit', 89, 1.1, 23.0, 0.3, true, NOW(), NOW()),
('Feta Cheese', 'Dairy', 264, 14.0, 4.1, 21.0, true, NOW(), NOW()),
('Mixed Vegetables', 'Vegetable', 65, 3.0, 13.0, 0.5, true, NOW(), NOW());

-- TABLE 23: AI Chat Logs (10 rows)
-- ==========================================
INSERT INTO ai_chat_logs (user_id, session_id, message_type, message_content, prompt_tokens, completion_tokens, model_used, created_at) VALUES
(1, 'sess-001', 'user', 'Create me a workout plan for weight loss', 10, 0, 'gpt-4', NOW() - INTERVAL '5 days'),
(1, 'sess-001', 'assistant', 'I''ll create a comprehensive 8-week weight loss workout plan...', 10, 250, 'gpt-4', NOW() - INTERVAL '5 days'),
(3, 'sess-002', 'user', 'What exercises should I do for bigger arms?', 9, 0, 'gpt-4', NOW() - INTERVAL '4 days'),
(3, 'sess-002', 'assistant', 'For arm growth, focus on these exercises: bicep curls, tricep dips...', 9, 180, 'gpt-4', NOW() - INTERVAL '4 days'),
(5, 'sess-003', 'user', 'Generate a meal plan with 2000 calories', 8, 0, 'gpt-4', NOW() - INTERVAL '3 days'),
(5, 'sess-003', 'assistant', 'Here''s a balanced 2000 calorie meal plan with macros...', 8, 320, 'gpt-4', NOW() - INTERVAL '3 days'),
(6, 'sess-004', 'user', 'How can I improve my squat form?', 8, 0, 'gpt-4', NOW() - INTERVAL '2 days'),
(6, 'sess-004', 'assistant', 'To improve squat form: maintain neutral spine, knees track over toes...', 8, 220, 'gpt-4', NOW() - INTERVAL '2 days'),
(8, 'sess-005', 'user', 'Create a vegan high protein meal plan', 8, 0, 'gpt-4', NOW() - INTERVAL '1 day'),
(8, 'sess-005', 'assistant', 'Here''s a vegan meal plan with complete proteins from plant sources...', 8, 280, 'gpt-4', NOW() - INTERVAL '1 day');

-- TABLE 24: AI Program Generations (10 rows)
-- ==========================================
INSERT INTO ai_program_generations (user_id, plan_type, plan_id, prompt_used, tokens_used, model_used, status, generated_content, created_at, updated_at) VALUES
(1, 'Workout', 1, 'Create 8-week weight loss workout plan, 5 days/week, intermediate level', 450, 'gpt-4', 'Completed', '{"plan": "Full program with exercises"}', NOW() - INTERVAL '30 days', NOW()),
(3, 'Workout', 2, 'Generate hypertrophy program for muscle gain, 12 weeks, advanced', 520, 'gpt-4', 'Completed', '{"plan": "Muscle building program"}', NOW() - INTERVAL '45 days', NOW()),
(5, 'Workout', 3, 'Beginner general fitness plan, 4 days per week, 6 weeks', 380, 'gpt-4', 'Completed', '{"plan": "Balanced fitness program"}', NOW() - INTERVAL '20 days', NOW()),
(10, 'Workout', 6, 'Flexibility and mobility workout plan, 3 days/week', 350, 'gpt-4', 'PendingReview', '{"plan": "Flexibility focused program"}', NOW() - INTERVAL '12 days', NOW()),
(1, 'Nutrition', 2, 'Calorie deficit meal plan 1800 calories for fat loss', 420, 'gpt-4', 'Completed', '{"meals": "7-day meal plan"}', NOW() - INTERVAL '30 days', NOW()),
(3, 'Nutrition', 2, 'High protein 3200 calorie bulking meal plan', 480, 'gpt-4', 'Completed', '{"meals": "Muscle gain nutrition"}', NOW() - INTERVAL '45 days', NOW()),
(5, 'Nutrition', 3, 'Balanced 2400 calorie maintenance meal plan', 410, 'gpt-4', 'Completed', '{"meals": "Maintenance nutrition"}', NOW() - INTERVAL '20 days', NOW()),
(10, 'Nutrition', 6, 'Low carb keto meal plan 2000 calories', 440, 'gpt-4', 'PendingReview', '{"meals": "Keto nutrition plan"}', NOW() - INTERVAL '12 days', NOW()),
(5, 'Workout', 9, 'Home bodyweight workout plan 8 weeks', 390, 'gpt-4', 'Completed', '{"plan": "No equipment program"}', NOW() - INTERVAL '60 days', NOW()),
(5, 'Nutrition', 9, 'Family friendly healthy meals 2300 calories', 460, 'gpt-4', 'Completed', '{"meals": "Family meal plan"}', NOW() - INTERVAL '60 days', NOW());

-- TABLE 25: AI Workflow Jobs (10 rows)
-- ==========================================
INSERT INTO ai_workflow_jobs (user_id, job_type, status, request_payload, response_payload, n8n_workflow_id, error_message, created_at, updated_at) VALUES
(1, 'WorkoutPlanGeneration', 'Completed', '{"goal": "weight_loss", "level": "intermediate", "days": 5}', '{"plan_id": 1, "status": "success"}', 'wf-001', NULL, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
(3, 'WorkoutPlanGeneration', 'Completed', '{"goal": "muscle_gain", "level": "advanced", "days": 6}', '{"plan_id": 2, "status": "success"}', 'wf-001', NULL, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),
(5, 'NutritionPlanGeneration', 'Completed', '{"calories": 2400, "goal": "maintenance"}', '{"plan_id": 3, "status": "success"}', 'wf-002', NULL, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
(6, 'WorkoutPlanGeneration', 'Completed', '{"goal": "cutting", "level": "intermediate", "days": 5}', '{"plan_id": 4, "status": "success"}', 'wf-001', NULL, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days'),
(8, 'NutritionPlanGeneration', 'Completed', '{"calories": 2800, "goal": "endurance"}', '{"plan_id": 5, "status": "success"}', 'wf-002', NULL, NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
(10, 'WorkoutPlanGeneration', 'Pending', '{"goal": "flexibility", "level": "beginner", "days": 3}', NULL, 'wf-001', NULL, NOW() - INTERVAL '1 hour', NOW()),
(10, 'NutritionPlanGeneration', 'Failed', '{"calories": 2000, "goal": "keto"}', NULL, 'wf-002', 'API timeout after 30 seconds', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
(1, 'MealRecommendation', 'Completed', '{"preferences": "high_protein", "calories": 500}', '{"meals": [1, 2, 3]}', 'wf-003', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
(3, 'ExerciseFormCheck', 'Completed', '{"exercise": "squat", "video_url": "..."}', '{"feedback": "Good form, minor adjustments"}', 'wf-004', NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
(5, 'ProgressAnalysis', 'Completed', '{"member_id": 3, "period": "30_days"}', '{"summary": "Great progress, 5% body fat reduction"}', 'wf-005', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- TABLE 26: Notifications (10 rows)
-- ==========================================
INSERT INTO notifications (user_id, type, title, message, is_read, created_at, updated_at) VALUES
(1, 'BookingReminder', 'Upcoming Booking', 'Your equipment booking starts in 1 hour at 08:00 AM', false, NOW() - INTERVAL '1 hour', NOW()),
(3, 'WorkoutComplete', 'Workout Logged', 'Great job! You completed your workout today', true, NOW() - INTERVAL '2 days', NOW()),
(5, 'PaymentDue', 'Payment Reminder', 'Your subscription renews in 3 days for $49.99', false, NOW() - INTERVAL '12 hours', NOW()),
(6, 'MilestoneAchieved', 'New Achievement!', 'Congratulations! You''ve completed 30 workouts', true, NOW() - INTERVAL '1 day', NOW()),
(8, 'CoachMessage', 'Message from Coach Sarah', 'Great progress on your endurance goals!', false, NOW() - INTERVAL '3 hours', NOW()),
(10, 'SystemAlert', 'Workout Plan Pending', 'Your AI-generated workout plan is awaiting coach approval', false, NOW() - INTERVAL '2 hours', NOW()),
(1, 'MaintenanceAlert', 'Equipment Maintenance', 'Cable machine will be unavailable tomorrow for maintenance', true, NOW() - INTERVAL '1 day', NOW()),
(3, 'PromotionalOffer', 'Special Offer', 'Upgrade to Premium and get 500 bonus tokens!', false, NOW() - INTERVAL '6 hours', NOW()),
(5, 'WorkoutComplete', 'Weekly Goal Reached', 'You''ve hit your weekly workout goal of 4 sessions!', true, NOW() - INTERVAL '1 day', NOW()),
(6, 'PaymentDue', 'Subscription Expired', 'Your subscription has expired. Renew now to continue access', false, NOW() - INTERVAL '30 minutes', NOW());

-- TABLE 27: Coach Reviews (10 rows)
-- ==========================================
INSERT INTO coach_reviews (coach_id, member_id, rating, review_text, created_at, updated_at) VALUES
(2, 1, 5, 'Sarah is an amazing trainer! Really helped me with my form and motivation', NOW() - INTERVAL '10 days', NOW()),
(4, 3, 5, 'Emily''s nutrition advice was life-changing. Lost 15 lbs!', NOW() - INTERVAL '20 days', NOW()),
(7, 5, 4, 'Robert pushes you hard but gets results. CrossFit sessions are intense', NOW() - INTERVAL '5 days', NOW()),
(2, 6, 5, 'Best coach I''ve ever worked with. Very knowledgeable and patient', NOW() - INTERVAL '15 days', NOW()),
(4, 8, 5, 'Emily customized my meal plan perfectly for my dietary needs', NOW() - INTERVAL '8 days', NOW()),
(7, 10, 4, 'Great coach, would give 5 stars but sessions can run over time', NOW() - INTERVAL '3 days', NOW()),
(2, 3, 5, 'Sarah''s strength programming is excellent. Gained 10 lbs muscle', NOW() - INTERVAL '30 days', NOW()),
(4, 1, 4, 'Good nutritionist, meal plans are realistic and tasty', NOW() - INTERVAL '25 days', NOW()),
(7, 6, 5, 'Robert''s HIIT workouts are killer but super effective', NOW() - INTERVAL '12 days', NOW()),
(2, 8, 5, 'Helped me recover from injury safely. Very professional', NOW() - INTERVAL '18 days', NOW());

-- TABLE 28: Activity Feed (10 rows)
-- ==========================================
INSERT INTO activity_feeds (user_id, activity_type, title, content, likes_count, comments_count, is_visible, created_at, updated_at) VALUES
(1, 'WorkoutCompleted', 'Crushed Leg Day!', 'Just finished an intense squat session - 315lbs x 5!', 12, 3, true, NOW() - INTERVAL '2 hours', NOW()),
(3, 'PersonalRecord', 'New PR!', 'New deadlift personal record: 405 lbs!', 25, 8, true, NOW() - INTERVAL '1 day', NOW()),
(5, 'MilestoneAchieved', '30-Day Streak', 'Completed 30 consecutive days of training!', 18, 5, true, NOW() - INTERVAL '12 hours', NOW()),
(6, 'BodyTransformation', 'Progress Update', 'Down 15 lbs in 8 weeks! Feeling amazing!', 35, 12, true, NOW() - INTERVAL '3 days', NOW()),
(8, 'WorkoutCompleted', 'Morning Run Complete', 'Finished a 5K run in under 30 minutes!', 8, 2, true, NOW() - INTERVAL '4 hours', NOW()),
(1, 'NutritionWin', 'Meal Prep Sunday', 'Prepped all my meals for the week. Staying on track!', 14, 4, true, NOW() - INTERVAL '2 days', NOW()),
(3, 'WorkoutCompleted', 'Upper Body Blast', 'Great pump today on push day. Chest and shoulders on fire!', 10, 1, true, NOW() - INTERVAL '6 hours', NOW()),
(6, 'MilestoneAchieved', 'First Pull-up!', 'Finally did my first unassisted pull-up! Progress!', 42, 15, true, NOW() - INTERVAL '1 day', NOW()),
(8, 'CheckIn', 'Gym Check-in', 'Starting my workout at IntelliFit Gym', 5, 0, true, NOW() - INTERVAL '30 minutes', NOW()),
(10, 'MotivationalPost', 'Monday Motivation', 'New week, new goals! Let''s get after it!', 22, 6, true, NOW() - INTERVAL '8 hours', NOW());

-- TABLE 29: Progress Milestones (10 rows)
-- ==========================================
INSERT INTO progress_milestones (title, description, category, criteria, badge_url, points_awarded, created_at, updated_at) VALUES
('First Workout', 'Complete your first workout session', 'Beginner', '{"workouts_completed": 1}', 'https://badges.intellifit.com/first-workout.png', 10, NOW(), NOW()),
('Week Warrior', 'Complete 7 consecutive days of training', 'Consistency', '{"consecutive_days": 7}', 'https://badges.intellifit.com/week-warrior.png', 50, NOW(), NOW()),
('Month Master', 'Complete 30 consecutive days of training', 'Consistency', '{"consecutive_days": 30}', 'https://badges.intellifit.com/month-master.png', 200, NOW(), NOW()),
('Strength Starter', 'Log 50 strength training exercises', 'Strength', '{"strength_exercises": 50}', 'https://badges.intellifit.com/strength-starter.png', 75, NOW(), NOW()),
('Cardio King', 'Complete 25 cardio sessions', 'Cardio', '{"cardio_sessions": 25}', 'https://badges.intellifit.com/cardio-king.png', 75, NOW(), NOW()),
('Weight Loss Winner', 'Lose 10 pounds', 'Transformation', '{"weight_lost_lbs": 10}', 'https://badges.intellifit.com/weight-loss.png', 100, NOW(), NOW()),
('Muscle Builder', 'Gain 5 pounds of muscle', 'Transformation', '{"muscle_gained_lbs": 5}', 'https://badges.intellifit.com/muscle-builder.png', 100, NOW(), NOW()),
('Social Butterfly', 'Get 50 likes on activity posts', 'Social', '{"total_likes": 50}', 'https://badges.intellifit.com/social-butterfly.png', 50, NOW(), NOW()),
('Equipment Master', 'Use 10 different equipment types', 'Variety', '{"unique_equipment": 10}', 'https://badges.intellifit.com/equipment-master.png', 60, NOW(), NOW()),
('Century Club', 'Complete 100 total workouts', 'Achievement', '{"total_workouts": 100}', 'https://badges.intellifit.com/century-club.png', 300, NOW(), NOW());

-- TABLE 30: User Milestones (10 rows)
-- ==========================================
INSERT INTO user_milestones (user_id, milestone_id, progress_value, achieved_at, created_at, updated_at) VALUES
(1, 1, 1, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days', NOW()),
(1, 2, 7, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days', NOW()),
(1, 3, 30, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW()),
(3, 1, 1, NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days', NOW()),
(3, 4, 50, NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NOW()),
(3, 7, 5, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW()),
(5, 1, 1, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days', NOW()),
(5, 2, 7, NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', NOW()),
(6, 1, 1, NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days', NOW()),
(6, 6, 10, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW());

-- TABLE 31: Audit Logs (10 rows)
-- ==========================================
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at) VALUES
(1, 'CREATE', 'Booking', 1, NULL, '{"equipment_id": 1, "date": "2024-11-27", "time": "08:00"}', '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '2 days'),
(3, 'UPDATE', 'WorkoutPlan', 2, '{"status": "PendingApproval"}', '{"status": "Active"}', '192.168.1.101', 'Mozilla/5.0', NOW() - INTERVAL '45 days'),
(9, 'DELETE', 'Equipment', 8, '{"name": "Old Equipment"}', NULL, '192.168.1.102', 'Mozilla/5.0', NOW() - INTERVAL '10 days'),
(1, 'CREATE', 'Payment', 1, NULL, '{"amount": 129.99, "status": "Completed"}', '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '30 days'),
(5, 'UPDATE', 'MemberProfile', 3, '{"weight": 78}', '{"weight": 72}', '192.168.1.103', 'Mozilla/5.0', NOW() - INTERVAL '3 days'),
(6, 'CREATE', 'WorkoutLog', 4, NULL, '{"exercise": "Bench Press", "sets": 4}', '192.168.1.104', 'Mozilla/5.0', NOW() - INTERVAL '1 day'),
(4, 'UPDATE', 'NutritionPlan', 1, '{"status": "PendingApproval"}', '{"status": "Active"}', '192.168.1.105', 'Mozilla/5.0', NOW() - INTERVAL '30 days'),
(9, 'CREATE', 'User', 10, NULL, '{"email": "amanda.garcia@intellifit.com", "role": "Member"}', '192.168.1.102', 'Mozilla/5.0', NOW() - INTERVAL '90 days'),
(2, 'UPDATE', 'CoachProfile', 1, '{"rating": 4.7}', '{"rating": 4.8}', '192.168.1.106', 'Mozilla/5.0', NOW() - INTERVAL '5 days'),
(1, 'CREATE', 'ActivityFeed', 1, NULL, '{"title": "Crushed Leg Day!", "type": "WorkoutCompleted"}', '192.168.1.100', 'Mozilla/5.0', NOW() - INTERVAL '2 hours');

-- Verify row counts for all tables
SELECT 'workout_logs' as table_name, COUNT(*) as row_count FROM workout_logs
UNION ALL SELECT 'workout_templates', COUNT(*) FROM workout_templates
UNION ALL SELECT 'workout_template_exercises', COUNT(*) FROM workout_template_exercises
UNION ALL SELECT 'nutrition_plans', COUNT(*) FROM nutrition_plans
UNION ALL SELECT 'meals', COUNT(*) FROM meals
UNION ALL SELECT 'meal_ingredients', COUNT(*) FROM meal_ingredients
UNION ALL SELECT 'ingredients', COUNT(*) FROM ingredients
UNION ALL SELECT 'ai_chat_logs', COUNT(*) FROM ai_chat_logs
UNION ALL SELECT 'ai_program_generations', COUNT(*) FROM ai_program_generations
UNION ALL SELECT 'ai_workflow_jobs', COUNT(*) FROM ai_workflow_jobs
UNION ALL SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'coach_reviews', COUNT(*) FROM coach_reviews
UNION ALL SELECT 'activity_feeds', COUNT(*) FROM activity_feeds
UNION ALL SELECT 'progress_milestones', COUNT(*) FROM progress_milestones
UNION ALL SELECT 'user_milestones', COUNT(*) FROM user_milestones
UNION ALL SELECT 'audit_logs', COUNT(*) FROM audit_logs
ORDER BY table_name;
