using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using IntelliFit.Infrastructure.Persistence.Contexts;

// Build configuration
var configuration = new ConfigurationBuilder()
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json")
    .AddJsonFile("appsettings.Development.json", optional: true)
    .Build();

// Setup DbContext
var serviceProvider = new ServiceCollection()
    .AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")))
    .BuildServiceProvider();

using (var scope = serviceProvider.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Read the SQL script
    var sqlScript = File.ReadAllText(@"d:\Youssef\Projects\_Graduation Project\Project Repo\Graduation-project\Documentation\InsertAdminAccount.sql");

    try
    {
        // Execute the SQL script
        await dbContext.Database.ExecuteSqlRawAsync(sqlScript);

        Console.WriteLine("✅ SQL script executed successfully!");
        Console.WriteLine();

        // Verify the admin account was created
        var adminUser = await dbContext.Database
            .SqlQueryRaw<AdminUserVerification>(@"
                SELECT 
                    ""UserId"",
                    ""Email"",
                    ""Name"",
                    ""Role"",
                    ""IsActive"",
                    ""CreatedAt""
                FROM ""Users""
                WHERE ""Email"" = 'admin@intellifit.com'
            ")
            .FirstOrDefaultAsync();

        if (adminUser != null)
        {
            Console.WriteLine("✅ Admin account verified:");
            Console.WriteLine($"   UserId: {adminUser.UserId}");
            Console.WriteLine($"   Email: {adminUser.Email}");
            Console.WriteLine($"   Name: {adminUser.Name}");
            Console.WriteLine($"   Role: {adminUser.Role}");
            Console.WriteLine($"   IsActive: {adminUser.IsActive}");
            Console.WriteLine($"   CreatedAt: {adminUser.CreatedAt}");
            Console.WriteLine();
            Console.WriteLine("🔑 Login Credentials:");
            Console.WriteLine("   Email: admin@intellifit.com");
            Console.WriteLine("   Password: 123123");
        }
        else
        {
            Console.WriteLine("⚠️ Admin account not found after insertion!");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error executing SQL script: {ex.Message}");
        Console.WriteLine($"   Details: {ex.InnerException?.Message}");
    }
}

public class AdminUserVerification
{
    public int UserId { get; set; }
    public string Email { get; set; } = null!;
    public string Name { get; set; } = null!;
    public int Role { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
