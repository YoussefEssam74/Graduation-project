# Seed Data Update Summary

## Date: December 14, 2024

### Overview
Updated both seed data files (`SeedData_Complete.sql` and `SeedData_Extended.sql`) to align with the new database schema that transitioned from Table-Per-Type (TPT) inheritance to a single users table with Role column.

---

## Schema Changes Applied

### 1. User Table Structure
**OLD Structure (TPT):**
- Base `users` table
- Separate tables: `members`, `coaches`, `receptionists`, `admins`
- Inheritance-based relationships

**NEW Structure (Single Table):**
- Single `users` table with `Role` column (varchar(50))
- Values: 'Member', 'Coach', 'Admin'
- Separate profile tables: `member_profiles`, `coach_profiles`
- New columns added:
  - `Role` (default: 'Member')
  - `MustChangePassword` (default: false)
  - `IsFirstLogin` (default: true)

### 2. User ID Reorganization
**NEW ID Assignment:**
- **Members**: UserId 1-6
  - john.doe@intellifit.com (1)
  - michael.smith@intellifit.com (2)
  - david.wilson@intellifit.com (3)
  - jessica.brown@intellifit.com (4)
  - lisa.anderson@intellifit.com (5)
  - amanda.garcia@intellifit.com (6)

- **Coaches**: UserId 7-9
  - sarah.johnson@intellifit.com (7)
  - emily.davis@intellifit.com (8)
  - robert.taylor@intellifit.com (9)

- **Admin**: UserId 10
  - admin@intellifit.com (10)
  - Password: 224466
  - BCrypt Hash: `$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6`

---

## Files Updated

### SeedData_Complete.sql
**Changes Made:**
1. **TRUNCATE Statement**: Removed old TPT tables (admins, coaches, receptionists, members), added new tables (member_profiles, coach_profiles)
2. **Users INSERT**: Added Role, MustChangePassword, IsFirstLogin columns to all user records
3. **Member Profiles**: Changed from `members` table to `member_profiles` table
4. **Coach Profiles**: Changed from `coaches` table to `coach_profiles` table
5. **Foreign Key Updates**: Updated coach references in:
   - bookings (coach 2→7)
   - workout_plans (2→7, 4→8)
   - nutrition_plans (4→8)
   - meals (4→8)
   - exercises (2→7, 4→8, 7→9)
6. **Admin Account**: Added with correct BCrypt hash for password "224466"

### SeedData_Extended.sql
**Changes Made:**
1. **Schema Note**: Added comment about new structure at top of file
2. **User ID Updates**: Changed all member references (old IDs 3,5,6 → new IDs 2,3,4)
3. **Foreign Key Updates**: Updated in:
   - workout_plan_exercises
   - workout_logs
   - inbody_measurements (MeasuredBy: 9→10)
   - user_subscriptions
   - payments
   - token_transactions
   - coach_reviews (coach 2,4→7,8)
   - notifications
   - activity_feeds
   - user_milestones
   - ai_chat_logs
   - ai_workflow_jobs
   - ai_program_generations
   - audit_logs (coach 2→7, receptionist 9→admin 10)
   - workout_templates (coach 2,4,7→7,8,9)

---

## Admin Account Details

**Credentials:**
- Email: `admin@intellifit.com`
- Password: `224466`
- UserId: 10
- Role: Admin
- BCrypt Hash: `$2a$11$PWTp8fypbCqoyv/gC1HqTem8sRjs0n12yHnzaD/Anucm16Z13yKA6`

**Attributes:**
- TokenBalance: 100
- IsActive: true
- EmailVerified: true
- MustChangePassword: false
- IsFirstLogin: false

---

## Testing Steps

### 1. Database Cleanup
```sql
-- Run this to clear existing data if needed
TRUNCATE TABLE users CASCADE;
```

### 2. Run Seed Data Scripts (in order)
```bash
# In pgAdmin or psql:
\i 'C:/Users/youss/source/repos/Graduation-Project/Documentation/SeedData_Complete.sql'
\i 'C:/Users/youss/source/repos/Graduation-Project/Documentation/SeedData_Extended.sql'
```

### 3. Verify Admin Login
```sql
-- Test admin credentials
SELECT "UserId", "Email", "Role", "IsActive", "EmailVerified" 
FROM users 
WHERE "Email" = 'admin@intellifit.com';

-- Verify BCrypt hash (should match in application)
-- Use BCrypt.Net.BCrypt.Verify("224466", hash) in C#
```

### 4. Verify Foreign Keys
```sql
-- Check coach assignments in bookings
SELECT b."BookingId", b."UserId", b."CoachId", u."Name" as CoachName
FROM bookings b
LEFT JOIN users u ON b."CoachId" = u."UserId"
WHERE b."CoachId" IS NOT NULL;

-- Check workout plan coaches
SELECT wp."PlanId", wp."UserId", wp."GeneratedByCoachId", u."Name" as CoachName
FROM workout_plans wp
LEFT JOIN users u ON wp."GeneratedByCoachId" = u."UserId"
WHERE wp."GeneratedByCoachId" IS NOT NULL;
```

---

## Removed Tables
The following tables are NO LONGER USED and should not be referenced:
- ❌ `admins`
- ❌ `coaches`
- ❌ `receptionists`
- ❌ `members`

---

## New Profile Tables
✅ `member_profiles` - Stores member-specific data (linked via UserId FK)
✅ `coach_profiles` - Stores coach-specific data (linked via UserId FK)

---

## Migration Applied
- Migration Name: `20251212204025_InitialCreateUsersProfilesRefactor.cs`
- Status: Successfully applied (dotnet ef database update - Exit Code: 0)
- Date: December 12, 2024

---

## Notes
1. All user passwords use BCrypt hashing (work factor 11)
2. Admin password is intentionally simple for initial setup (224466)
3. Consider prompting admin to change password on first login in production
4. Member profiles and coach profiles are now in separate tables linked by UserId
5. The Role column in users table determines user type, not separate tables

---

## Next Steps
1. ✅ Test seed data insertion
2. ✅ Verify admin login works
3. ✅ Check all foreign key relationships
4. ⏳ Test application functionality with new schema
5. ⏳ Update API endpoints if needed
6. ⏳ Update frontend to work with new user structure
