using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using IntelliFit.Infrastructure.Persistence;
using IntelliFit.Infrastructure.Persistence.Repository;
using DomainLayer.Contracts;
using ServiceAbstraction.Services;
using Service.Services;

namespace Graduation_Project
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add DbContext with automatic database creation
            builder.Services.AddDbContext<IntelliFitDbContext>(options =>
            {
                var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
                options.UseNpgsql(connectionString);
            });

            // Add Repository Pattern
            builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

            // Add Services
            builder.Services.AddScoped<ITokenService, TokenService>();
            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IBookingService, BookingService>();
            builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
            builder.Services.AddScoped<IPaymentService, PaymentService>();
            builder.Services.AddScoped<IExerciseService, ExerciseService>();
            builder.Services.AddScoped<IEquipmentService, EquipmentService>();

            // Add New Services
            builder.Services.AddScoped<IWorkoutPlanService, WorkoutPlanService>();
            builder.Services.AddScoped<INutritionPlanService, NutritionPlanService>();
            builder.Services.AddScoped<IInBodyService, InBodyService>();
            builder.Services.AddScoped<IStatsService, StatsService>();
            builder.Services.AddScoped<IMealService, MealService>();
            builder.Services.AddScoped<IAIChatService, AIChatService>();
            builder.Services.AddScoped<INotificationService, NotificationService>();

            // Add Google Gemini AI Service
            builder.Services.AddScoped<IntelliFit.ServiceAbstraction.IAIService, IntelliFit.Service.Services.AIService>();

            // Add JWT Authentication
            var jwtKey = builder.Configuration["Jwt:Key"];
            var jwtIssuer = builder.Configuration["Jwt:Issuer"];
            var jwtAudience = builder.Configuration["Jwt:Audience"];

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
                };

                // Allow SignalR to use JWT token from query string
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;

                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

            builder.Services.AddAuthorization();

            // Add CORS (Updated for SignalR - Allow all origins in development)
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    policy.SetIsOriginAllowed(_ => true) // Allow all origins in development
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials(); // Required for SignalR
                });
            });

            // Add SignalR
            builder.Services.AddSignalR();

            // Add Controllers from Presentation layer
            builder.Services.AddControllers()
                .AddApplicationPart(typeof(IntelliFit.Presentation.Controllers.AuthController).Assembly);
            builder.Services.AddEndpointsApiExplorer();

            // Configure Swagger with JWT support
            builder.Services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "IntelliFit API",
                    Version = "v1",
                    Description = "Smart Gym Management System API"
                });

                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "Enter 'Bearer' [space] and then your token"
                });

                options.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            var app = builder.Build();

            // Automatically apply database migrations and ensure database is created
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<IntelliFitDbContext>();
                try
                {
                    dbContext.Database.Migrate();
                    Console.WriteLine("Database migrations applied successfully.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Database migration error: {ex.Message}");
                    Console.WriteLine("Attempting to create database...");
                    try
                    {
                        dbContext.Database.EnsureCreated();
                        Console.WriteLine("Database created successfully.");
                    }
                    catch (Exception createEx)
                    {
                        Console.WriteLine($"Database creation error: {createEx.Message}");
                    }
                }
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseCors("AllowAll");

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            // Map SignalR Hubs
            app.MapHub<IntelliFit.Presentation.Hubs.NotificationHub>("/hubs/notifications");
            app.MapHub<IntelliFit.Presentation.Hubs.ChatHub>("/hubs/chat");

            app.Run();
        }
    }
}
