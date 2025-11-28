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

            if ((int)user.Role != loginDto.Role)
            {
                throw new UnauthorizedAccessException("Invalid role for this user");
            }

            // Update last login
            user.LastLoginAt = DateTime.UtcNow;
            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            var token = _tokenService.GenerateJwtToken(user.UserId, user.Email, (int)user.Role);

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

            var user = new User
            {
                Email = registerDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                Name = registerDto.Name,
                Phone = registerDto.Phone,
                DateOfBirth = registerDto.DateOfBirth,
                Gender = registerDto.Gender.HasValue ? (GenderType)registerDto.Gender.Value : null,
                Role = (UserRole)registerDto.Role,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<User>().AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            var token = _tokenService.GenerateJwtToken(user.UserId, user.Email, (int)user.Role);

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
                Role = (int)user.Role,
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
