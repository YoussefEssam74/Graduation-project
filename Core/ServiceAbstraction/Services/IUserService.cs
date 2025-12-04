using Shared.DTOs.User;

namespace ServiceAbstraction.Services
{
    public interface IUserService
    {
        Task<UserDto?> GetUserByIdAsync(int userId);
        Task<UserDto?> GetUserByEmailAsync(string email);
        Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileDto updateDto);
        Task<bool> DeactivateUserAsync(int userId);
        Task<int> GetTokenBalanceAsync(int userId);
        Task UpdateTokenBalanceAsync(int userId, int amount);
        Task<IEnumerable<UserDto>> GetCoachesListAsync();
    }
}
