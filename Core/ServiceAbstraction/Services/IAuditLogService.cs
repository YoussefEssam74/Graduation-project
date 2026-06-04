using IntelliFit.Shared.DTOs.User;

namespace IntelliFit.ServiceAbstraction.Services
{
    public interface IAuditLogService
    {
        Task<AuditLogDto> CreateAuditLogAsync(CreateAuditLogDto dto);
        Task<IEnumerable<AuditLogDto>> GetUserAuditLogsAsync(int userId, int limit = 100);
        Task<IEnumerable<AuditLogDto>> GetTableAuditLogsAsync(string tableName, int limit = 100);
        Task<AuditLogDto> GetAuditLogByIdAsync(int logId);
        Task<IEnumerable<AuditLogDto>> GetAllAuditLogsAsync(int page, int pageSize, string? actionFilter = null, string? tableFilter = null);
    }
}
