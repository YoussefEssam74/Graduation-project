# IntelliFit Test Credentials

All test accounts use the password: **`password`**

## Test Accounts

### Members

- **Email**: `john.doe@intellifit.com`
- **Password**: `password`
- **UserId**: 1
- **Role**: Member
- **Description**: Weight loss goal, 15 workouts completed

### Coaches

- **Email**: `sarah.johnson@intellifit.com`
- **Password**: `password`
- **UserId**: 2
- **Role**: Coach
- **Specialization**: Strength Training & Weight Loss
- **Rating**: 4.8

### Receptionists

- **Email**: `mike.brown@intellifit.com`
- **Password**: `password`
- **UserId**: 9
- **Role**: Receptionist
- **Department**: Front Desk

### Admins

- **Email**: `admin@intellifit.com`
- **Password**: `password`
- **UserId**: 11
- **Role**: Admin
- **Super Admin**: No

- **Email**: `superadmin@intellifit.com`
- **Password**: `password`
- **UserId**: 12
- **Role**: Admin
- **Super Admin**: Yes

## Additional Test Members

2. **Email**: `emily.wilson@intellifit.com` (UserId: 3) - Member
3. **Email**: `michael.chen@intellifit.com` (UserId: 5) - Member
4. **Email**: `jessica.martinez@intellifit.com` (UserId: 6) - Member
5. **Email**: `david.anderson@intellifit.com` (UserId: 8) - Member
6. **Email**: `sophia.taylor@intellifit.com` (UserId: 10) - Member

## Additional Test Coaches

- **Email**: `alex.rodriguez@intellifit.com` (UserId: 4) - Coach (Powerlifting)
- **Email**: `chris.thompson@intellifit.com` (UserId: 7) - Coach (CrossFit)

## Database Setup Instructions

1. **Drop all tables and seed fresh data**:

   ```bash
   psql -U postgres -d intellifit_db -f Documentation/SeedData_Corrected_TPT.sql
   ```

2. **Add additional data (workout plans, nutrition plans, etc.)**:

   ```bash
   psql -U postgres -d intellifit_db -f Documentation/SeedData_Part2_TPT.sql
   ```

3. **Verify data loaded correctly**:

   ```sql
   SELECT 'users' as table_name, COUNT(*) as row_count FROM users
   UNION ALL SELECT 'members', COUNT(*) FROM members
   UNION ALL SELECT 'coaches', COUNT(*) FROM coaches
   UNION ALL SELECT 'receptionists', COUNT(*) FROM receptionists
   UNION ALL SELECT 'admins', COUNT(*) FROM admins;
   ```

   Expected results:

   - users: 12
   - members: 6
   - coaches: 3
   - receptionists: 1
   - admins: 2

## BCrypt Hash Details

All passwords are hashed using BCrypt with 11 work factor:

```
Password: "password"
Hash: $2a$11$TDXqE3Rq5Oe5Ju5fYZ3pGeEwHqLlEWWDWZ8i3qYjHvZnXqLGXGXGm
```

## Database Schema Notes

- **TPT Pattern**: Users are stored in base `users` table with role-specific data in derived tables (`members`, `coaches`, `receptionists`, `admins`)
- **Required Fields**:
  - Members: `TotalWorkoutsCompleted`, `TotalCaloriesBurned`, `Achievements` (all NOT NULL)
  - All users: `Name`, `Phone`, `Email`, `PasswordHash`
- **Gender Enum**: 0=Male, 1=Female
- **Foreign Keys**: All use RESTRICT, requiring careful deletion order

## Troubleshooting

### "Invalid credentials" error

- Verify password is exactly "password" (lowercase)
- Check email matches exactly (case-sensitive)
- Ensure database is seeded correctly

### "Unable to discriminate" TPT error

- User exists in `users` table but not in derived table
- Re-run seed scripts to ensure both tables are populated

### "null value in column" error

- Missing required NOT NULL fields
- Re-run SeedData_Corrected_TPT.sql which includes all required fields
