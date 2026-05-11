-- Add "AI Nutrition Plan" feature to all plans that include AI features
-- Run this against your PostgreSQL database to update existing subscription plans

UPDATE subscription_plans SET "Features" = '["Equipment Booking", "AI Coach", "AI Workout Generator", "AI Nutrition Plan"]'
WHERE "PlanName" = 'Standard Monthly';

UPDATE subscription_plans SET "Features" = '["Equipment Booking", "AI Coach", "AI Workout Generator", "Coach Booking", "Coach Plan Review", "AI Nutrition Plan"]'
WHERE "PlanName" = 'Premium Monthly';

UPDATE subscription_plans SET "Features" = '["Equipment Booking", "AI Coach", "AI Workout Generator", "Progress Tracking", "AI Nutrition Plan"]'
WHERE "PlanName" = 'Standard Quarterly';

UPDATE subscription_plans SET "Features" = '["Equipment Booking", "AI Coach", "AI Workout Generator", "Coach Booking", "Coach Plan Review", "Priority Booking", "AI Nutrition Plan"]'
WHERE "PlanName" = 'Premium Quarterly';

UPDATE subscription_plans SET "Features" = '["Equipment Booking", "AI Coach", "AI Workout Generator", "Progress Tracking", "Free Guest Pass", "AI Nutrition Plan"]'
WHERE "PlanName" = 'Standard Annual';

UPDATE subscription_plans SET "Features" = '["Equipment Booking", "AI Coach", "AI Workout Generator", "Coach Booking", "Coach Plan Review", "Priority Booking", "Free Guest Pass", "AI Nutrition Plan"]'
WHERE "PlanName" = 'Premium Annual';
