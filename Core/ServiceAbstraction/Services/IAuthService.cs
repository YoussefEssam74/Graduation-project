using Shared.DTOs.Auth;

namespace ServiceAbstraction.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginRequestDto loginDto);
        Task<AuthResponseDto> RegisterAsync(RegisterRequestDto registerDto);
        Task<bool> EmailExistsAsync(string email);
        Task<bool> VerifyPasswordAsync(string email, string password);
    }
}
