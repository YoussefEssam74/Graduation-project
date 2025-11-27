-- IntelliFit Database Test Queries
-- 50 comprehensive queries to test all tables and relationships

-- ==========================================
-- SECTION 1: BASIC DATA RETRIEVAL (10 queries)
-- ==========================================

-- 1. Get all available equipment
SELECT e.equipment_id, e.name, e.status, ec.category_name
FROM equipment e
JOIN equipment_category ec ON e.category_id = ec.category_id
WHERE e.status = 'Available';

-- 2. Get all active users with their roles
SELECT user_id, first_name, last_name, email, role, registration_date
FROM users
WHERE is_active = true
ORDER BY registration_date DESC;

-- 3. Get all active subscription plans with pricing
SELECT plan_id, name, price, duration_in_days, features
FROM subscription_plans
WHERE is_active = true
ORDER BY price;

-- 4. Get all token packages available for purchase
SELECT package_id, name, token_count, price, bonus_tokens
FROM token_packages
WHERE is_active = true
ORDER BY token_count;

-- 5. Get all equipment categories with equipment count
SELECT ec.category_id, ec.category_name, ec.description, COUNT(e.equipment_id) as equipment_count
FROM equipment_category ec
LEFT JOIN equipment e ON ec.category_id = e.category_id
GROUP BY ec.category_id, ec.category_name, ec.description;

-- 6. Get all exercises grouped by difficulty
SELECT difficulty_level, COUNT(*) as exercise_count
FROM exercises
WHERE is_active = true
GROUP BY difficulty_level
ORDER BY exercise_count DESC;

-- 7. Get all active nutrition plans with coach info
SELECT np.plan_id, np.plan_name, u.first_name || ' ' || u.last_name as coach_name, np.created_at
FROM nutrition_plans np
JOIN users u ON np.generated_by_coach_id = u.user_id
WHERE np.is_active = true
ORDER BY np.created_at DESC;

-- 8. Get all ingredients with their nutritional values
SELECT ingredient_id, name, category, 
       calories_per100g, protein_per100g, carbs_per100g, fats_per100g
FROM ingredients
WHERE is_active = true
ORDER BY name;

-- 9. Get all workout templates created by coaches
SELECT wt.template_id, wt.template_name, wt.description, u.first_name || ' ' || u.last_name as coach_name
FROM workout_templates wt
JOIN users u ON wt.created_by_coach_id = u.user_id
ORDER BY wt.created_at DESC;

-- 10. Get all active notifications for users
SELECT n.notification_id, n.user_id, n.type, n.title, n.created_at
FROM notifications n
WHERE n.is_read = false
ORDER BY n.created_at DESC;

-- ==========================================
-- SECTION 2: MEMBER & PROFILE QUERIES (8 queries)
-- ==========================================

-- 11. Get member profiles with latest InBody measurements
SELECT mp.profile_id, u.first_name || ' ' || u.last_name as member_name,
       mp.date_of_birth, mp.gender, mp.fitness_goal,
       ibm.weight, ibm.height, ibm.body_fat_percentage, ibm.measurement_date
FROM member_profiles mp
JOIN users u ON mp.user_id = u.user_id
LEFT JOIN LATERAL (
    SELECT * FROM in_body_measurements
    WHERE member_id = mp.profile_id
    ORDER BY measurement_date DESC
    LIMIT 1
) ibm ON true
ORDER BY u.first_name;

-- 12. Get members with their current token balance
SELECT u.user_id, u.first_name || ' ' || u.last_name as name, mp.token_balance, mp.total_tokens_purchased
FROM users u
JOIN member_profiles mp ON u.user_id = mp.user_id
WHERE u.role = 'Member'
ORDER BY mp.token_balance DESC;

-- 13. Get coach profiles with their specializations and ratings
SELECT cp.profile_id, u.first_name || ' ' || u.last_name as coach_name,
       cp.specialization, cp.years_of_experience, cp.rating, cp.total_reviews
FROM coach_profiles cp
JOIN users u ON cp.user_id = u.user_id
WHERE cp.is_available = true
ORDER BY cp.rating DESC;

-- 14. Get members by fitness goal distribution
SELECT mp.fitness_goal, COUNT(*) as member_count
FROM member_profiles mp
GROUP BY mp.fitness_goal
ORDER BY member_count DESC;

-- 15. Get members who joined in the last 30 days
SELECT u.user_id, u.first_name || ' ' || u.last_name as name, u.email, u.registration_date
FROM users u
JOIN member_profiles mp ON u.user_id = mp.user_id
WHERE u.registration_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY u.registration_date DESC;

-- 16. Get all InBody measurements for a specific member with trends
SELECT member_id, measurement_date, weight, body_fat_percentage, muscle_mass,
       weight - LAG(weight) OVER (PARTITION BY member_id ORDER BY measurement_date) as weight_change,
       body_fat_percentage - LAG(body_fat_percentage) OVER (PARTITION BY member_id ORDER BY measurement_date) as fat_change
FROM in_body_measurements
ORDER BY member_id, measurement_date DESC;

-- 17. Get members with active subscriptions
SELECT u.user_id, u.first_name || ' ' || u.last_name as name, 
       sp.name as plan_name, us.start_date, us.end_date, us.status
FROM users u
JOIN member_profiles mp ON u.user_id = mp.user_id
JOIN user_subscriptions us ON u.user_id = us.user_id
JOIN subscription_plans sp ON us.plan_id = sp.plan_id
WHERE us.status = 'Active' AND us.end_date >= CURRENT_DATE
ORDER BY us.end_date;

-- 18. Get members who need subscription renewal reminders
SELECT u.user_id, u.first_name || ' ' || u.last_name as name, u.email,
       us.end_date, us.end_date - CURRENT_DATE as days_remaining
FROM users u
JOIN user_subscriptions us ON u.user_id = us.user_id
WHERE us.status = 'Active' 
  AND us.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
  AND us.renewal_reminder_sent = false
ORDER BY us.end_date;

-- ==========================================
-- SECTION 3: WORKOUT & EXERCISE QUERIES (10 queries)
-- ==========================================

-- 19. Get all workout plans assigned to members with their status
SELECT wp.plan_id, u.first_name || ' ' || u.last_name as member_name,
       wp.plan_name, wp.status, wp.start_date, wp.end_date,
       c.first_name || ' ' || c.last_name as coach_name
FROM workout_plans wp
JOIN users u ON wp.user_id = u.user_id
LEFT JOIN users c ON wp.generated_by_coach_id = c.user_id
ORDER BY wp.created_at DESC;

-- 20. Get exercises by muscle group and difficulty
SELECT muscle_group, difficulty_level, COUNT(*) as exercise_count
FROM exercises
WHERE is_active = true
GROUP BY muscle_group, difficulty_level
ORDER BY muscle_group, difficulty_level;

-- 21. Get workout plan with all exercises and details
SELECT wp.plan_id, wp.plan_name, 
       e.name as exercise_name, wpe.sets, wpe.reps, wpe.rest_seconds, wpe.day_of_week
FROM workout_plans wp
JOIN workout_plan_exercises wpe ON wp.plan_id = wpe.plan_id
JOIN exercises e ON wpe.exercise_id = e.exercise_id
ORDER BY wp.plan_id, wpe.day_of_week, wpe.order_in_workout;

-- 22. Get workout logs with exercise performance
SELECT wl.log_id, u.first_name || ' ' || u.last_name as member_name,
       e.name as exercise_name, wl.sets_completed, wl.reps_completed, 
       wl.weight_used, wl.duration_minutes, wl.workout_date
FROM workout_logs wl
JOIN users u ON wl.user_id = u.user_id
JOIN exercises e ON wl.exercise_id = e.exercise_id
ORDER BY wl.workout_date DESC;

-- 23. Get member workout frequency and consistency
SELECT u.user_id, u.first_name || ' ' || u.last_name as name,
       COUNT(DISTINCT DATE(wl.workout_date)) as total_workout_days,
       COUNT(wl.log_id) as total_exercises_logged,
       MAX(wl.workout_date) as last_workout_date
FROM users u
JOIN member_profiles mp ON u.user_id = mp.user_id
LEFT JOIN workout_logs wl ON u.user_id = wl.user_id
GROUP BY u.user_id, u.first_name, u.last_name
ORDER BY total_workout_days DESC;

-- 24. Get AI-generated workout plans pending coach approval
SELECT wp.plan_id, u.first_name || ' ' || u.last_name as member_name,
       wp.plan_name, wp.status, wp.created_at,
       ag.generation_id, ag.tokens_used
FROM workout_plans wp
JOIN users u ON wp.user_id = u.user_id
JOIN ai_program_generations ag ON wp.plan_id = ag.plan_id AND ag.plan_type = 'Workout'
WHERE wp.status = 'PendingApproval'
ORDER BY wp.created_at;

-- 25. Get workout templates with exercise count
SELECT wt.template_id, wt.template_name, wt.description, wt.difficulty_level,
       COUNT(wte.exercise_id) as exercise_count,
       u.first_name || ' ' || u.last_name as created_by
FROM workout_templates wt
JOIN workout_template_exercises wte ON wt.template_id = wte.template_id
JOIN users u ON wt.created_by_coach_id = u.user_id
GROUP BY wt.template_id, wt.template_name, wt.description, wt.difficulty_level, u.first_name, u.last_name
ORDER BY wt.template_name;

-- 26. Get exercises that are most logged by members
SELECT e.exercise_id, e.name, e.muscle_group, COUNT(wl.log_id) as times_logged
FROM exercises e
JOIN workout_logs wl ON e.exercise_id = wl.exercise_id
GROUP BY e.exercise_id, e.name, e.muscle_group
ORDER BY times_logged DESC
LIMIT 20;

-- 27. Get member progress comparison (first vs latest workout)
WITH first_workout AS (
    SELECT user_id, exercise_id, AVG(weight_used) as first_weight, MIN(workout_date) as first_date
    FROM workout_logs
    GROUP BY user_id, exercise_id
),
latest_workout AS (
    SELECT user_id, exercise_id, AVG(weight_used) as latest_weight, MAX(workout_date) as latest_date
    FROM workout_logs
    GROUP BY user_id, exercise_id
)
SELECT u.first_name || ' ' || u.last_name as name, e.name as exercise,
       fw.first_weight, lw.latest_weight, 
       lw.latest_weight - fw.first_weight as weight_improvement,
       lw.latest_date - fw.first_date as days_training
FROM first_workout fw
JOIN latest_workout lw ON fw.user_id = lw.user_id AND fw.exercise_id = lw.exercise_id
JOIN users u ON fw.user_id = u.user_id
JOIN exercises e ON fw.exercise_id = e.exercise_id
WHERE lw.latest_weight > fw.first_weight
ORDER BY weight_improvement DESC;

-- 28. Get workout plans expiring in next 7 days
SELECT wp.plan_id, u.first_name || ' ' || u.last_name as member_name,
       wp.plan_name, wp.end_date, wp.end_date - CURRENT_DATE as days_remaining
FROM workout_plans wp
JOIN users u ON wp.user_id = u.user_id
WHERE wp.status = 'Active' 
  AND wp.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY wp.end_date;

-- ==========================================
-- SECTION 4: NUTRITION QUERIES (7 queries)
-- ==========================================

-- 29. Get nutrition plans with meal count
SELECT np.plan_id, np.plan_name, u.first_name || ' ' || u.last_name as member_name,
       np.total_calories, np.total_protein, np.total_carbs, np.total_fats,
       jsonb_array_length(np.meals) as meal_count
FROM nutrition_plans np
JOIN users u ON np.user_id = u.user_id
WHERE np.is_active = true
ORDER BY np.created_at DESC;

-- 30. Get all meals with ingredient details
SELECT m.meal_id, m.meal_name, m.meal_type, m.calories, m.protein, m.carbs, m.fats,
       COUNT(mi.ingredient_id) as ingredient_count
FROM meals m
LEFT JOIN meal_ingredients mi ON m.meal_id = mi.meal_id
GROUP BY m.meal_id, m.meal_name, m.meal_type, m.calories, m.protein, m.carbs, m.fats
ORDER BY m.meal_name;

-- 31. Get meal ingredients with nutritional breakdown
SELECT m.meal_name, i.name as ingredient_name, 
       mi.quantity, mi.unit,
       (mi.quantity / 100.0) * i.calories_per100g as calories_contribution,
       (mi.quantity / 100.0) * i.protein_per100g as protein_contribution
FROM meals m
JOIN meal_ingredients mi ON m.meal_id = mi.meal_id
JOIN ingredients i ON mi.ingredient_id = i.ingredient_id
ORDER BY m.meal_name, i.name;

-- 32. Get nutrition plans pending coach approval
SELECT np.plan_id, u.first_name || ' ' || u.last_name as member_name,
       np.plan_name, np.status, np.created_at,
       ag.generation_id, ag.tokens_used
FROM nutrition_plans np
JOIN users u ON np.user_id = u.user_id
JOIN ai_program_generations ag ON np.plan_id = ag.plan_id AND ag.plan_type = 'Nutrition'
WHERE np.status = 'PendingApproval'
ORDER BY np.created_at;

-- 33. Get ingredients by category with usage count
SELECT i.category, COUNT(i.ingredient_id) as ingredient_count,
       COUNT(mi.meal_ingredient_id) as times_used_in_meals
FROM ingredients i
LEFT JOIN meal_ingredients mi ON i.ingredient_id = mi.ingredient_id
WHERE i.is_active = true
GROUP BY i.category
ORDER BY ingredient_count DESC;

-- 34. Get meals created by coaches with their specialization
SELECT m.meal_id, m.meal_name, m.meal_type, m.calories,
       u.first_name || ' ' || u.last_name as coach_name,
       cp.specialization
FROM meals m
JOIN users u ON m.created_by_coach_id = u.user_id
JOIN coach_profiles cp ON u.user_id = cp.user_id
ORDER BY m.created_at DESC;

-- 35. Get high-protein meal recommendations (>30g protein)
SELECT meal_id, meal_name, meal_type, calories, protein, carbs, fats,
       ROUND((protein * 4.0 / calories) * 100, 2) as protein_percentage
FROM meals
WHERE protein > 30
ORDER BY protein DESC;

-- ==========================================
-- SECTION 5: BOOKING & EQUIPMENT QUERIES (6 queries)
-- ==========================================

-- 36. Get all equipment bookings for today
SELECT b.booking_id, u.first_name || ' ' || u.last_name as member_name,
       e.name as equipment_name, b.booking_date, b.start_time, b.end_time, b.status
FROM bookings b
JOIN users u ON b.user_id = u.user_id
JOIN equipment e ON b.equipment_id = e.equipment_id
WHERE b.booking_date = CURRENT_DATE
ORDER BY b.start_time;

-- 37. Get equipment utilization rate
SELECT e.equipment_id, e.name, ec.category_name,
       COUNT(b.booking_id) as total_bookings,
       COUNT(CASE WHEN b.status = 'Completed' THEN 1 END) as completed_bookings
FROM equipment e
JOIN equipment_category ec ON e.category_id = ec.category_id
LEFT JOIN bookings b ON e.equipment_id = b.equipment_id
GROUP BY e.equipment_id, e.name, ec.category_name
ORDER BY total_bookings DESC;

-- 38. Get available equipment for booking right now
SELECT e.equipment_id, e.name, ec.category_name, e.location
FROM equipment e
JOIN equipment_category ec ON e.category_id = ec.category_id
WHERE e.status = 'Available'
  AND e.equipment_id NOT IN (
    SELECT equipment_id FROM bookings
    WHERE booking_date = CURRENT_DATE
      AND CURRENT_TIME BETWEEN start_time AND end_time
      AND status IN ('Confirmed', 'InProgress')
  )
ORDER BY ec.category_name, e.name;

-- 39. Get member booking history
SELECT u.first_name || ' ' || u.last_name as member_name,
       COUNT(b.booking_id) as total_bookings,
       COUNT(CASE WHEN b.status = 'Completed' THEN 1 END) as completed,
       COUNT(CASE WHEN b.status = 'Cancelled' THEN 1 END) as cancelled,
       MAX(b.booking_date) as last_booking_date
FROM users u
JOIN member_profiles mp ON u.user_id = mp.user_id
LEFT JOIN bookings b ON u.user_id = b.user_id
GROUP BY u.user_id, u.first_name, u.last_name
ORDER BY total_bookings DESC;

-- 40. Get equipment requiring maintenance
SELECT e.equipment_id, e.name, e.status, e.last_maintenance_date,
       CURRENT_DATE - e.last_maintenance_date as days_since_maintenance,
       e.next_maintenance_due
FROM equipment e
WHERE e.status = 'UnderMaintenance' 
   OR e.next_maintenance_due <= CURRENT_DATE + INTERVAL '7 days'
ORDER BY e.next_maintenance_due;

-- 41. Get bookings with coach assistance
SELECT b.booking_id, 
       u.first_name || ' ' || u.last_name as member_name,
       e.name as equipment_name,
       c.first_name || ' ' || c.last_name as coach_name,
       b.booking_date, b.start_time
FROM bookings b
JOIN users u ON b.user_id = u.user_id
JOIN equipment e ON b.equipment_id = e.equipment_id
LEFT JOIN users c ON b.coach_id = c.user_id
WHERE b.coach_id IS NOT NULL
ORDER BY b.booking_date DESC, b.start_time;

-- ==========================================
-- SECTION 6: PAYMENT & SUBSCRIPTION QUERIES (5 queries)
-- ==========================================

-- 42. Get all payments with subscription/package details
SELECT p.payment_id, u.first_name || ' ' || u.last_name as user_name,
       p.amount, p.payment_method, p.payment_type, p.status,
       COALESCE(sp.name, tp.name) as purchased_item,
       p.created_at
FROM payments p
JOIN users u ON p.user_id = u.user_id
LEFT JOIN user_subscriptions us ON p.subscription_id = us.subscription_id
LEFT JOIN subscription_plans sp ON us.plan_id = sp.plan_id
LEFT JOIN token_packages tp ON p.package_id = tp.package_id
ORDER BY p.created_at DESC;

-- 43. Get subscription revenue by plan
SELECT sp.name as plan_name, sp.price,
       COUNT(us.subscription_id) as total_subscriptions,
       SUM(p.amount) as total_revenue
FROM subscription_plans sp
LEFT JOIN user_subscriptions us ON sp.plan_id = us.plan_id
LEFT JOIN payments p ON us.payment_id = p.payment_id AND p.status = 'Completed'
GROUP BY sp.plan_id, sp.name, sp.price
ORDER BY total_revenue DESC;

-- 44. Get token transactions for members
SELECT u.first_name || ' ' || u.last_name as member_name,
       tt.transaction_type, tt.amount, tt.description, tt.created_at
FROM token_transactions tt
JOIN users u ON tt.user_id = u.user_id
ORDER BY tt.created_at DESC;

-- 45. Get failed payments for follow-up
SELECT p.payment_id, u.first_name || ' ' || u.last_name as user_name,
       u.email, p.amount, p.payment_method, p.status, p.created_at
FROM payments p
JOIN users u ON p.user_id = u.user_id
WHERE p.status = 'Failed'
ORDER BY p.created_at DESC;

-- 46. Get monthly revenue report
SELECT DATE_TRUNC('month', p.created_at) as month,
       COUNT(p.payment_id) as total_payments,
       SUM(CASE WHEN p.status = 'Completed' THEN p.amount ELSE 0 END) as completed_revenue,
       SUM(CASE WHEN p.status = 'Failed' THEN p.amount ELSE 0 END) as failed_revenue
FROM payments p
GROUP BY DATE_TRUNC('month', p.created_at)
ORDER BY month DESC;

-- ==========================================
-- SECTION 7: AI & ENGAGEMENT QUERIES (4 queries)
-- ==========================================

-- 47. Get AI chat logs with token usage
SELECT acl.log_id, u.first_name || ' ' || u.last_name as user_name,
       acl.session_id, acl.prompt_tokens, acl.completion_tokens, 
       acl.prompt_tokens + acl.completion_tokens as total_tokens,
       acl.created_at
FROM ai_chat_logs acl
JOIN users u ON acl.user_id = u.user_id
ORDER BY acl.created_at DESC;

-- 48. Get AI program generations summary
SELECT ag.plan_type, ag.status,
       COUNT(ag.generation_id) as generation_count,
       AVG(ag.tokens_used) as avg_tokens_used,
       SUM(ag.tokens_used) as total_tokens_used
FROM ai_program_generations ag
GROUP BY ag.plan_type, ag.status
ORDER BY ag.plan_type, generation_count DESC;

-- 49. Get member milestones and achievements
SELECT u.first_name || ' ' || u.last_name as member_name,
       pm.title as milestone_title, pm.description, pm.badge_url,
       um.achieved_at, um.progress_value
FROM user_milestones um
JOIN users u ON um.user_id = u.user_id
JOIN progress_milestones pm ON um.milestone_id = pm.milestone_id
ORDER BY um.achieved_at DESC;

-- 50. Get activity feed for social engagement
SELECT af.activity_id, u.first_name || ' ' || u.last_name as user_name,
       af.activity_type, af.title, af.content, af.likes_count, af.comments_count,
       af.created_at
FROM activity_feeds af
JOIN users u ON af.user_id = u.user_id
WHERE af.is_visible = true
ORDER BY af.created_at DESC
LIMIT 50;
