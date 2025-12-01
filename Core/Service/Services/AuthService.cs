using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using ServiceAbstraction.Services;
using Shared.DTOs.Auth;
using Shared.DTOs.User;
using BCrypt.Net;

namespace Service.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITokenService _tokenService;

        public AuthService(IUnitOfWork unitOfWork, ITokenService tokenService)
        {
            _unitOfWork = unitOfWork;
            _tokenService = tokenService;
        }

        /// <summary>
        /// Helper method to determine User Role from TPT derived type
        /// </summary>
        private string GetUserRole(User user)
        {
            return user switch
            {
                Member => "Member",
                Coach => "Coach",
                Receptionist => "Receptionist",
                Admin => "Admin",
                _ => throw new InvalidOperationException($"Unknown user type: {user.GetType().Name}")
            };
        }

        // Ensure DateTime values persisted to PostgreSQL with timestamptz are UTC
        private DateTime? EnsureUtc(DateTime? value)
        {
            if (!value.HasValue) return null;
            var dt = value.Value;
            if (dt.Kind == DateTimeKind.Utc) return dt;
            if (dt.Kind == DateTimeKind.Unspecified)
            {
                // Treat unspecified as UTC for storage consistency
                return DateTime.SpecifyKind(dt, DateTimeKind.Utc);
            }
            // Local -> convert to UTC
            return dt.ToUniversalTime();
        }

        public async Task<AuthResponseDto> LoginAsync(LoginRequestDto loginDto)
        {
            var user = await _unitOfWork.Repository<User>()
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            if (!user.IsActive)
            {
                throw new UnauthorizedAccessException("Account is deactivated");
            }

            // Detect role from TPT derived type
            var userRole = GetUserRole(user);

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            var token = _tokenService.GenerateJwtToken(user.UserId, user.Email, userRole);

            return new AuthResponseDto
            {
                User = MapToUserDto(user),
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterRequestDto registerDto)
        {
            if (await EmailExistsAsync(registerDto.Email))
            {
                throw new InvalidOperationException("Email already exists");
            }

            // Create correct derived user type based on Role (TPT pattern)
            User user = registerDto.Role.ToLowerInvariant() switch
            {
                "member" => new Member
                {
                    Email = registerDto.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                    Name = registerDto.Name,
                    Phone = registerDto.Phone,
                    DateOfBirth = EnsureUtc(registerDto.DateOfBirth),
                    Gender = registerDto.Gender.HasValue ? (GenderType)registerDto.Gender.Value : null,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                "coach" => new Coach
                {
                    Email = registerDto.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                    Name = registerDto.Name,
                    Phone = registerDto.Phone,
                    DateOfBirth = EnsureUtc(registerDto.DateOfBirth),
                    Gender = registerDto.Gender.HasValue ? (GenderType)registerDto.Gender.Value : null,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                "receptionist" => new Receptionist
                {
                    Email = registerDto.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                    Name = registerDto.Name,
                    Phone = registerDto.Phone,
                    DateOfBirth = EnsureUtc(registerDto.DateOfBirth),
                    Gender = registerDto.Gender.HasValue ? (GenderType)registerDto.Gender.Value : null,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                "admin" => new Admin
                {
                    Email = registerDto.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                    Name = registerDto.Name,
                    Phone = registerDto.Phone,
                    DateOfBirth = EnsureUtc(registerDto.DateOfBirth),
                    Gender = registerDto.Gender.HasValue ? (GenderType)registerDto.Gender.Value : null,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                _ => throw new InvalidOperationException($"Invalid role: {registerDto.Role}")
            };

            await _unitOfWork.Repository<User>().AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            var token = _tokenService.GenerateJwtToken(user.UserId, user.Email, GetUserRole(user));

            return new AuthResponseDto
            {
                User = MapToUserDto(user),
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };
        }

        public async Task<bool> EmailExistsAsync(string email)
        {
            return await _unitOfWork.Repository<User>().AnyAsync(u => u.Email == email);
        }

        public async Task<bool> VerifyPasswordAsync(string email, string password)
        {
            var user = await _unitOfWork.Repository<User>()
                .FirstOrDefaultAsync(u => u.Email == email);

            return user != null && BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
        }

        private UserDto MapToUserDto(User user)
        {
            return new UserDto
            {
                UserId = user.UserId,
                Email = user.Email,
                Name = user.Name,
                Phone = user.Phone,
                DateOfBirth = user.DateOfBirth,
                Gender = user.Gender.HasValue ? (int)user.Gender.Value : null,
                Role = GetUserRole(user),
                ProfileImageUrl = user.ProfileImageUrl,
                Address = user.Address,
                TokenBalance = user.TokenBalance,
                IsActive = user.IsActive,
                EmailVerified = user.EmailVerified,
                LastLoginAt = user.LastLoginAt,
                CreatedAt = user.CreatedAt
            };
        }
    }
}
