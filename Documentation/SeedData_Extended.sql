-- IntelliFit Database Extended Seed Data - Additional Test Scenarios
-- ==========================================
-- This file should be run AFTER SeedData_Complete.sql
-- Contains: Additional test data for specific scenarios
-- ==========================================

-- ==========================================
-- ADDITIONAL BOOKINGS FOR TESTING EDGE CASES
-- ==========================================
-- Test Case: Future coach session (next week) with auto-booked equipment
INSERT INTO bookings ("UserId", "EquipmentId", "CoachId", "BookingType", "StartTime", "EndTime", "Status", "TokensCost", "Notes", "IsAutoBookedForCoachSession", "ParentCoachBookingId", "IsAiGenerated", "CreatedAt", "UpdatedAt") VALUES
(1, NULL, 1, 'Session', '2025-12-28 09:00:00+00', '2025-12-28 10:00:00+00', 0, 75, 'Future session - Day 3 exercises (Deadlift, Pull-ups, Cable Fly)', false, NULL, false, NOW(), NOW());

-- Get the ID of the just-inserted booking and add auto-booked equipment
DO $$
DECLARE
    new_coach_booking_id INT;
BEGIN
    SELECT MAX("BookingId") INTO new_coach_booking_id FROM bookings WHERE "CoachId" IS NOT NULL;
    
    INSERT INTO bookings ("UserId", "EquipmentId", "CoachId", "BookingType", "StartTime", "EndTime", "Status", "TokensCost", "Notes", "IsAutoBookedForCoachSession", "ParentCoachBookingId", "IsAiGenerated", "CreatedAt", "UpdatedAt") VALUES
    (1, 8, NULL, 'Equipment', '2025-12-28 09:00:00+00', '2025-12-28 10:00:00+00', 0, 0, 'Auto-booked - Olympic Platform for Deadlifts', true, new_coach_booking_id, false, NOW(), NOW()),
    (1, 7, NULL, 'Equipment', '2025-12-28 09:00:00+00', '2025-12-28 10:00:00+00', 0, 0, 'Auto-booked - Pull-up Station', true, new_coach_booking_id, false, NOW(), NOW()),
    (1, 6, NULL, 'Equipment', '2025-12-28 09:00:00+00', '2025-12-28 10:00:00+00', 0, 0, 'Auto-booked - Cable Machine for Cable Fly', true, new_coach_booking_id, false, NOW(), NOW());
END $$;

-- ==========================================
-- ADDITIONAL EQUIPMENT TIME SLOTS (2025-12-28)
-- ==========================================
INSERT INTO equipment_time_slots ("EquipmentId", "SlotDate", "StartTime", "EndTime", "IsBooked", "BookedByUserId", "BookingId", "IsCoachSession", "CreatedAt", "BookedAt") VALUES
-- Olympic Platform (EquipmentId: 8)
(8, '2025-12-28', '06:00:00'::interval, '07:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(8, '2025-12-28', '07:00:00'::interval, '08:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(8, '2025-12-28', '08:00:00'::interval, '09:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(8, '2025-12-28', '09:00:00'::interval, '10:00:00'::interval, true, 1, NULL, true, NOW(), NOW()),
(8, '2025-12-28', '10:00:00'::interval, '11:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
-- Pull-up Station (EquipmentId: 7)
(7, '2025-12-28', '06:00:00'::interval, '07:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(7, '2025-12-28', '07:00:00'::interval, '08:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(7, '2025-12-28', '08:00:00'::interval, '09:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(7, '2025-12-28', '09:00:00'::interval, '10:00:00'::interval, true, 1, NULL, true, NOW(), NOW()),
(7, '2025-12-28', '10:00:00'::interval, '11:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
-- Cable Machine (EquipmentId: 6)
(6, '2025-12-28', '06:00:00'::interval, '07:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(6, '2025-12-28', '07:00:00'::interval, '08:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(6, '2025-12-28', '08:00:00'::interval, '09:00:00'::interval, false, NULL, NULL, false, NOW(), NULL),
(6, '2025-12-28', '09:00:00'::interval, '10:00:00'::interval, true, 1, NULL, true, NOW(), NOW()),
(6, '2025-12-28', '10:00:00'::interval, '11:00:00'::interval, false, NULL, NULL, false, NOW(), NULL);

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 'Extended seed data verification' as check_type;

SELECT 'Coach sessions with auto-booked equipment:' as check_type;
SELECT b."BookingId", b."BookingType", b."StartTime", 
       CASE WHEN b."CoachId" IS NOT NULL THEN 'Coach Session' ELSE 'Equipment' END as type,
       CASE WHEN b."IsAutoBookedForCoachSession" THEN 'Yes' ELSE 'No' END as auto_booked,
       b."ParentCoachBookingId"
FROM bookings b 
WHERE b."UserId" = 1 
ORDER BY b."StartTime", b."BookingId";