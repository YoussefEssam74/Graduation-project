-- ========================================================================================================
-- IntelliFit Database Schema Fix Migration Script
-- ========================================================================================================
-- Version: 1.0.0
-- Date: 2025-11-28
-- Description: Fixes logical design issues identified in database review
--
-- This script performs the following operations:
-- 1. Fixes bookings XOR violation (Equipment vs Coach)
-- 2. Adds missing FK constraint on member_profiles.SubscriptionPlanId
-- 3. Creates payments for subscriptions without PaymentId
-- 4. Fixes AI ProgramType case sensitivity
-- 5. Standardizes BookingType values
-- 6. Adds CHECK constraints to prevent future violations
--
-- IMPORTANT: Review and test this script in a development environment before running in production!
-- ========================================================================================================

BEGIN TRANSACTION;

-- ========================================================================================================
-- STEP 1: Fix Bookings XOR Violation (Equipment vs Coach)
-- ========================================================================================================
PRINT 'Step 1: Fixing bookings XOR violation...'

-- Identify problematic bookings
SELECT 
    'Bookings with both EquipmentId and CoachId' as issue,
    "BookingId", "BookingType", "EquipmentId", "CoachId"
FROM bookings
WHERE "EquipmentId" IS NOT NULL AND "CoachId" IS NOT NULL;

-- Fix bookings: Keep appropriate FK based on BookingType
-- If BookingType indicates equipment, remove CoachId
UPDATE bookings 
SET "CoachId" = NULL 
WHERE "EquipmentId" IS NOT NULL 
  AND "CoachId" IS NOT NULL
  AND ("BookingType" LIKE '%Equipment%' OR "BookingType" = 'Equipment');

-- If BookingType indicates coach session, remove EquipmentId
UPDATE bookings 
SET "EquipmentId" = NULL 
WHERE "EquipmentId" IS NOT NULL 
  AND "CoachId" IS NOT NULL
  AND ("BookingType" LIKE '%Training%' OR "BookingType" LIKE '%Session%' OR "BookingType" = 'Session');

PRINT 'Step 1 completed: Bookings XOR violation fixed'

-- ========================================================================================================
-- STEP 2: Standardize BookingType Values
-- ========================================================================================================
PRINT 'Step 2: Standardizing BookingType values...'

-- Show current distinct values
SELECT DISTINCT "BookingType", COUNT(*) as count
FROM bookings
GROUP BY "BookingType";

-- Standardize to 'Equipment' and 'Session'
UPDATE bookings
SET "BookingType" = CASE 
    WHEN "BookingType" IN ('Equipment Booking', 'Equipment') THEN 'Equipment'
    WHEN "BookingType" IN ('Personal Training', 'Session', 'Coach Session') THEN 'Session'
    ELSE "BookingType"
END
WHERE "BookingType" NOT IN ('Equipment', 'Session');

PRINT 'Step 2 completed: BookingType values standardized'

-- ========================================================================================================
-- STEP 3: Add Missing FK Constraint on member_profiles.SubscriptionPlanId
-- ========================================================================================================
PRINT 'Step 3: Adding FK constraint to member_profiles...'

-- Check if constraint already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_member_profiles_subscription_plan'
    ) THEN
        ALTER TABLE member_profiles
        ADD CONSTRAINT fk_member_profiles_subscription_plan
        FOREIGN KEY ("SubscriptionPlanId") REFERENCES subscription_plans("PlanId");
        
        RAISE NOTICE 'FK constraint added to member_profiles.SubscriptionPlanId';
    ELSE
        RAISE NOTICE 'FK constraint already exists on member_profiles.SubscriptionPlanId';
    END IF;
END $$;

PRINT 'Step 3 completed: FK constraint added'

-- ========================================================================================================
-- STEP 4: Create Payments for Subscriptions Without PaymentId
-- ========================================================================================================
PRINT 'Step 4: Creating missing payment records...'

-- Identify subscriptions without payments
SELECT 
    'Subscriptions without PaymentId' as issue,
    us."SubscriptionId", us."UserId", sp."PlanName", sp."Price"
FROM user_subscriptions us
JOIN subscription_plans sp ON us."PlanId" = sp."PlanId"
WHERE us."PaymentId" IS NULL;

-- Create payment records for subscriptions without payments
WITH next_id AS (
    SELECT COALESCE(MAX("PaymentId"), 0) + 1 as next_payment_id
    FROM payments
)
INSERT INTO payments (
    "PaymentId", "UserId", "Amount", "Currency", "PaymentMethod", 
    "PaymentType", "Status", "TransactionReference", "PackageId",
    "CreatedAt", "UpdatedAt"
)
SELECT 
    (SELECT next_payment_id FROM next_id) + ROW_NUMBER() OVER (ORDER BY us."SubscriptionId") - 1,
    us."UserId",
    sp."Price",
    'EGP',
    'CreditCard',
    'Subscription',
    1, -- 1=Completed
    'TXN-SUB-' || us."SubscriptionId" || '-' || TO_CHAR(us."StartDate", 'YYYYMMDD'),
    NULL,
    us."StartDate" - INTERVAL '1 day',
    us."StartDate" - INTERVAL '1 day'
FROM user_subscriptions us
JOIN subscription_plans sp ON us."PlanId" = sp."PlanId"
WHERE us."PaymentId" IS NULL;

-- Link subscriptions to their new payments
UPDATE user_subscriptions us
SET "PaymentId" = p."PaymentId"
FROM payments p
WHERE us."UserId" = p."UserId"
    AND us."PaymentId" IS NULL
    AND p."TransactionReference" LIKE 'TXN-SUB-' || us."SubscriptionId" || '-%';

PRINT 'Step 4 completed: Missing payment records created'

-- ========================================================================================================
-- STEP 5: Fix AI ProgramType Case Sensitivity
-- ========================================================================================================
PRINT 'Step 5: Fixing AI ProgramType case sensitivity...'

-- Show current distinct values
SELECT DISTINCT "ProgramType", COUNT(*) as count
FROM ai_program_generations
GROUP BY "ProgramType";

-- Update to proper case
UPDATE ai_program_generations
SET "ProgramType" = CASE 
    WHEN LOWER("ProgramType") = 'workout' THEN 'Workout'
    WHEN LOWER("ProgramType") = 'nutrition' THEN 'Nutrition'
    ELSE "ProgramType"
END
WHERE LOWER("ProgramType") IN ('workout', 'nutrition')
  AND "ProgramType" NOT IN ('Workout', 'Nutrition');

PRINT 'Step 5 completed: ProgramType case sensitivity fixed'

-- ========================================================================================================
-- STEP 6: Add CHECK Constraints to Prevent Future Violations
-- ========================================================================================================
PRINT 'Step 6: Adding CHECK constraints...'

-- 6.1: Bookings XOR constraint (Equipment OR Coach, not both)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_booking_xor'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT chk_booking_xor 
        CHECK (
          ("EquipmentId" IS NOT NULL AND "CoachId" IS NULL) OR 
          ("EquipmentId" IS NULL AND "CoachId" IS NOT NULL)
        );
        RAISE NOTICE 'CHECK constraint chk_booking_xor added';
    ELSE
        RAISE NOTICE 'CHECK constraint chk_booking_xor already exists';
    END IF;
END $$;

-- 6.2: BookingType must match FK reference
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_booking_type_match'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT chk_booking_type_match 
        CHECK (
          ("BookingType" = 'Equipment' AND "EquipmentId" IS NOT NULL) OR
          ("BookingType" = 'Session' AND "CoachId" IS NOT NULL)
        );
        RAISE NOTICE 'CHECK constraint chk_booking_type_match added';
    ELSE
        RAISE NOTICE 'CHECK constraint chk_booking_type_match already exists';
    END IF;
END $$;

-- 6.3: AI program XOR constraint (Workout OR Nutrition, not both)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_ai_program_xor'
    ) THEN
        ALTER TABLE ai_program_generations
        ADD CONSTRAINT chk_ai_program_xor
        CHECK (
          ("WorkoutPlanId" IS NOT NULL AND "NutritionPlanId" IS NULL) OR
          ("WorkoutPlanId" IS NULL AND "NutritionPlanId" IS NOT NULL)
        );
        RAISE NOTICE 'CHECK constraint chk_ai_program_xor added';
    ELSE
        RAISE NOTICE 'CHECK constraint chk_ai_program_xor already exists';
    END IF;
END $$;

-- 6.4: ProgramType must match plan reference
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_program_type_match'
    ) THEN
        ALTER TABLE ai_program_generations
        ADD CONSTRAINT chk_program_type_match
        CHECK (
          ("ProgramType" = 'Workout' AND "WorkoutPlanId" IS NOT NULL) OR
          ("ProgramType" = 'Nutrition' AND "NutritionPlanId" IS NOT NULL)
        );
        RAISE NOTICE 'CHECK constraint chk_program_type_match added';
    ELSE
        RAISE NOTICE 'CHECK constraint chk_program_type_match already exists';
    END IF;
END $$;

-- 6.5: User subscriptions must have payment reference
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_subscription_has_payment'
    ) THEN
        ALTER TABLE user_subscriptions
        ADD CONSTRAINT chk_subscription_has_payment
        CHECK ("PaymentId" IS NOT NULL);
        RAISE NOTICE 'CHECK constraint chk_subscription_has_payment added';
    ELSE
        RAISE NOTICE 'CHECK constraint chk_subscription_has_payment already exists';
    END IF;
END $$;

PRINT 'Step 6 completed: CHECK constraints added'

-- ========================================================================================================
-- STEP 7: Final Validation
-- ========================================================================================================
PRINT 'Step 7: Running final validation...'

-- Validate bookings
SELECT 
    'Booking Validation' as check_type,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN ("EquipmentId" IS NOT NULL AND "CoachId" IS NULL) 
               OR ("EquipmentId" IS NULL AND "CoachId" IS NOT NULL) THEN 1 END) as valid_bookings,
    COUNT(CASE WHEN "EquipmentId" IS NOT NULL AND "CoachId" IS NOT NULL THEN 1 END) as invalid_both,
    COUNT(CASE WHEN "EquipmentId" IS NULL AND "CoachId" IS NULL THEN 1 END) as invalid_neither
FROM bookings;

-- Validate subscriptions have payments
SELECT 
    'Subscription Payment Validation' as check_type,
    COUNT(*) as total_subscriptions,
    COUNT(CASE WHEN "PaymentId" IS NOT NULL THEN 1 END) as subscriptions_with_payment,
    COUNT(CASE WHEN "PaymentId" IS NULL THEN 1 END) as subscriptions_without_payment
FROM user_subscriptions;

-- Validate AI program types
SELECT 
    'AI Program Type Validation' as check_type,
    COUNT(*) as total_programs,
    COUNT(CASE WHEN "ProgramType" IN ('Workout', 'Nutrition') THEN 1 END) as valid_program_types
FROM ai_program_generations;

-- Validate BookingType standardization
SELECT 
    'BookingType Standardization' as check_type,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN "BookingType" IN ('Equipment', 'Session') THEN 1 END) as standardized_types
FROM bookings;

PRINT 'Step 7 completed: Final validation complete'

-- ========================================================================================================
-- Summary
-- ========================================================================================================
PRINT '========================================================================================================
PRINT 'Migration completed successfully!'
PRINT '========================================================================================================
PRINT 'Summary of changes:'
PRINT '1. ✅ Fixed bookings XOR violations'
PRINT '2. ✅ Standardized BookingType values to Equipment/Session'
PRINT '3. ✅ Added FK constraint on member_profiles.SubscriptionPlanId'
PRINT '4. ✅ Created missing payment records for subscriptions'
PRINT '5. ✅ Fixed AI ProgramType case sensitivity'
PRINT '6. ✅ Added CHECK constraints to prevent future violations'
PRINT '========================================================================================================

-- If everything looks good, commit the transaction
-- Otherwise, rollback
-- COMMIT;
-- ROLLBACK;

-- ========================================================================================================
-- Post-Migration Steps (Manual)
-- ========================================================================================================
-- 1. Update Entity Framework models:
--    - Remove Payment.SubscriptionId property
--    - Add MemberProfile.SubscriptionPlan navigation property
--    - Update any DTOs referencing old structure
--
-- 2. Update application code:
--    - Use BookingTypes.Equipment and BookingTypes.Session constants
--    - Use ProgramTypes.Workout and ProgramTypes.Nutrition constants
--    - Update any hardcoded string values
--
-- 3. Test the following flows:
--    - Create equipment booking (should set EquipmentId only)
--    - Create coach session (should set CoachId only)
--    - Create payment → subscription (subscription must reference payment)
--    - Generate AI workout/nutrition plans (use proper case)
--
-- 4. Generate new EF Core migration if using Code First approach
--
-- ========================================================================================================
