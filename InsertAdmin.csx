#r "nuget: Npgsql, 8.0.3"
#r "nuget: BCrypt.Net-Next, 4.0.3"

using Npgsql;
using BCrypt.Net;

var connectionString = "Host=localhost;Port=5432;Database=intellifit_db;Username=postgres;Password=123;SSL Mode=Disable";

try
{
    using var connection = new NpgsqlConnection(connectionString);
    await connection.OpenAsync();

    Console.WriteLine("✅ Connected to database successfully!");
    Console.WriteLine();

    // Check if admin already exists
    using (var checkCmd = new NpgsqlCommand(@"SELECT COUNT(*) FROM users WHERE ""Email"" = 'admin@intellifit.com'", connection))
    {
        var count = (long)(await checkCmd.ExecuteScalarAsync() ?? 0);
        if (count > 0)
        {
            Console.WriteLine("⚠️  Admin account with email admin@intellifit.com already exists!");

            // Show existing admin details
            using var selectCmd = new NpgsqlCommand(@"
                SELECT ""UserId"", ""Email"", ""Name"", ""Role"", ""IsActive"", ""CreatedAt""
                FROM users
                WHERE ""Email"" = 'admin@intellifit.com'
            ", connection);

            using var reader = await selectCmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                Console.WriteLine($"   UserId: {reader.GetInt32(0)}");
                Console.WriteLine($"   Email: {reader.GetString(1)}");
                Console.WriteLine($"   Name: {reader.GetString(2)}");
                Console.WriteLine($"   Role: {reader.GetString(3)}");
                Console.WriteLine($"   IsActive: {reader.GetBoolean(4)}");
                Console.WriteLine($"   CreatedAt: {reader.GetDateTime(5)}");
            }

            return;
        }
    }

    // Generate BCrypt hash for password "123123"
    var passwordHash = BCrypt.Net.BCrypt.HashPassword("123123");

    // Insert admin user
    using (var insertCmd = new NpgsqlCommand(@"
        INSERT INTO users (
            ""Email"",
            ""PasswordHash"",
            ""Name"",
            ""Phone"",
            ""DateOfBirth"",
            ""Gender"",
            ""Role"",
            ""ProfileImageUrl"",
            ""Address"",
            ""TokenBalance"",
            ""IsActive"",
            ""EmailVerified"",
            ""MustChangePassword"",
            ""IsFirstLogin"",
            ""LastLoginAt"",
            ""CreatedAt"",
            ""UpdatedAt""
        ) VALUES (
            @Email,
            @PasswordHash,
            @Name,
            NULL,
            NULL,
            NULL,
            @Role,
            NULL,
            NULL,
            0,
            true,
            true,
            false,
            false,
            NULL,
            @CreatedAt,
            @UpdatedAt
        )
        RETURNING ""UserId""
    ", connection))
    {
        insertCmd.Parameters.AddWithValue("Email", "admin@intellifit.com");
        insertCmd.Parameters.AddWithValue("PasswordHash", passwordHash);
        insertCmd.Parameters.AddWithValue("Name", "System Administrator");
        insertCmd.Parameters.AddWithValue("Role", "Admin");
        insertCmd.Parameters.AddWithValue("CreatedAt", DateTime.UtcNow);
        insertCmd.Parameters.AddWithValue("UpdatedAt", DateTime.UtcNow);

        var userId = await insertCmd.ExecuteScalarAsync();

        Console.WriteLine($"✅ Admin account created successfully!");
        Console.WriteLine($"   UserId: {userId}");
        Console.WriteLine($"   Email: admin@intellifit.com");
        Console.WriteLine($"   Name: System Administrator");
        Console.WriteLine($"   Role: Admin");
        Console.WriteLine();
        Console.WriteLine("🔑 Login Credentials:");
        Console.WriteLine("   Email: admin@intellifit.com");
        Console.WriteLine("   Password: 123123");
    }

    Console.WriteLine();
    Console.WriteLine("✅ Admin account is ready to use!");
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Error: {ex.Message}");
    if (ex.InnerException != null)
    {
        Console.WriteLine($"   Details: {ex.InnerException.Message}");
    }
}
