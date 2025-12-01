using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.Domain.Enums;
using ServiceAbstraction.Services;
using Shared.DTOs.User;

namespace Service.Services
{
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;

        public UserService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
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

        public async Task<UserDto?> GetUserByIdAsync(int userId)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
            return user == null ? null : MapToUserDto(user);
        }

        public async Task<UserDto?> GetUserByEmailAsync(string email)
        {
            var user = await _unitOfWork.Repository<User>()
                .FirstOrDefaultAsync(u => u.Email == email);
            return user == null ? null : MapToUserDto(user);
        }

        public async Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileDto updateDto)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);

            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found");
            }

            user.Name = updateDto.Name;
            user.Phone = updateDto.Phone;
            user.DateOfBirth = updateDto.DateOfBirth;
            user.Gender = updateDto.Gender.HasValue ? (IntelliFit.Domain.Enums.GenderType)updateDto.Gender.Value : null;
            user.ProfileImageUrl = updateDto.ProfileImageUrl;
            user.Address = updateDto.Address;
            user.EmergencyContactName = updateDto.EmergencyContactName;
            user.EmergencyContactPhone = updateDto.EmergencyContactPhone;
            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            return MapToUserDto(user);
        }

        public async Task<bool> DeactivateUserAsync(int userId)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);

            if (user == null)
            {
                return false;
            }

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<int> GetTokenBalanceAsync(int userId)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);
            return user?.TokenBalance ?? 0;
        }

        public async Task UpdateTokenBalanceAsync(int userId, int amount)
        {
            var user = await _unitOfWork.Repository<User>().GetByIdAsync(userId);

            if (user == null)
            {
                throw new KeyNotFoundException($"User with ID {userId} not found");
            }

            user.TokenBalance += amount;
            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Repository<User>().Update(user);
            await _unitOfWork.SaveChangesAsync();
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
