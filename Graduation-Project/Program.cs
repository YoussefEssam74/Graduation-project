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
using Presentation.Controllers;

namespace Graduation_Project
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add DbContext
            builder.Services.AddDbContext<IntelliFitDbContext>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

            // Add Repository Pattern (typed)
            builder.Services.AddScoped(typeof(IGenaricRepository<,>), typeof(GenericRepository<,>));
            builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

            // Add AutoMapper
            builder.Services.AddAutoMapper(typeof(Service.MappingProfiles.MappingProfile).Assembly);

            // Add Core Services (shared dependencies)
            builder.Services.AddScoped<ITokenService, TokenService>();

            // Add Service Manager (creates service instances internally with lazy loading - E-Commerce pattern)
            builder.Services.AddScoped<ServiceAbstraction.IServiceManager, Service.ServiceManager>();

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

            // Add Controllers from Presentation layer (explicitly reference Presentation assembly)
            builder.Services.AddControllers()
                .AddApplicationPart(typeof(AuthController).Assembly)
                .AddJsonOptions(options =>
                {
                    // Configure JSON serializer to treat all DateTime as UTC for PostgreSQL compatibility
                    options.JsonSerializerOptions.Converters.Add(new IntelliFit.Shared.Helpers.UtcDateTimeConverter());
                });
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

            // Fix users sequence on startup (one-time fix for seeded data)
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<IntelliFitDbContext>();
                try
                {
                    dbContext.Database.ExecuteSqlRaw("SELECT setval(pg_get_serial_sequence('users','UserId'), COALESCE((SELECT MAX(\"UserId\") FROM users), 1));");
                    Console.WriteLine("✓ Users sequence synchronized with max UserId");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Warning: Could not sync users sequence: {ex.Message}");
                }
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }
            else
            {
                app.UseHttpsRedirection();
            }

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
