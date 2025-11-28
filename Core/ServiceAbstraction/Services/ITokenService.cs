namespace ServiceAbstraction.Services
{
    public interface ITokenService
    {
        string GenerateJwtToken(int userId, string email, int role);
        int? ValidateToken(string token);
    }
}
