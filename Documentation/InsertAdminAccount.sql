-- Insert Admin Account
-- Email: admin@intellifit.com
-- Password: 123123
-- This script creates an admin account directly in the database

-- First, check if the email already exists
DO $$
DECLARE
    admin_user_id INT;
BEGIN
    -- Check if admin account already exists
    IF EXISTS (SELECT 1 FROM "Users" WHERE "Email" = 'admin@intellifit.com') THEN
        RAISE NOTICE 'Admin account with email admin@intellifit.com already exists!';
    ELSE
        -- Insert the admin user
        -- Password hash for "123123" using BCrypt (generated with work factor 11)
        INSERT INTO "Users" (
            "Email",
            "PasswordHash",
            "Name",
            "Phone",
            "DateOfBirth",
            "Gender",
            "Role",
            "ProfileImageUrl",
            "Address",
            "TokenBalance",
            "IsActive",
            "EmailVerified",
            "MustChangePassword",
            "IsFirstLogin",
            "LastLoginAt",
            "CreatedAt",
            "UpdatedAt"
        ) VALUES (
            'admin@intellifit.com',
            '$2a$11$zQl5yJVhN8L3Qz9VjGhXG.VJp0nKX1QhK3X1oa8BqwYzJqvE8YvyK',  -- BCrypt hash for "123123"
            'System Administrator',
            NULL,
            NULL,
            NULL,
            2,  -- 2 = Admin role
            NULL,
            NULL,
            0,
            true,
            true,
            false,
            false,
            NULL,
            NOW() AT TIME ZONE 'UTC',
            NOW() AT TIME ZONE 'UTC'
        )
        RETURNING "UserId" INTO admin_user_id;

        RAISE NOTICE 'Admin account created successfully with UserId: %', admin_user_id;
        RAISE NOTICE 'Email: admin@intellifit.com';
        RAISE NOTICE 'Password: 123123';
    END IF;
END $$;

-- Verify the admin account was created
SELECT 
    "UserId",
    "Email",
    "Name",
    "Role",
    "IsActive",
    "CreatedAt"
FROM "Users"
WHERE "Email" = 'admin@intellifit.com';
