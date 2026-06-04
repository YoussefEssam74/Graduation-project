using DomainLayer.Contracts;
using IntelliFit.Domain.Models;
using IntelliFit.ServiceAbstraction.Services;
using IntelliFit.Shared.DTOs.User;
using AutoMapper;

namespace Service.Services
{
    public class AuditLogService : IAuditLogService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public AuditLogService(IUnitOfWork unitOfWork, IMapper mapper)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<AuditLogDto> CreateAuditLogAsync(CreateAuditLogDto dto)
        {
            var auditLog = _mapper.Map<AuditLog>(dto);

            await _unitOfWork.Repository<AuditLog>().AddAsync(auditLog);
            await _unitOfWork.SaveChangesAsync();

            return await MapToDtoAsync(auditLog);
        }

        public async Task<IEnumerable<AuditLogDto>> GetUserAuditLogsAsync(int userId, int limit = 100)
        {
            var logs = await _unitOfWork.Repository<AuditLog>().GetAllAsync();
            var userLogs = logs.Where(l => l.UserId == userId)
                              .OrderByDescending(l => l.CreatedAt)
                              .Take(limit);

            var logDtos = new List<AuditLogDto>();
            foreach (var log in userLogs)
            {
                logDtos.Add(await MapToDtoAsync(log));
            }
            return logDtos;
        }

        public async Task<IEnumerable<AuditLogDto>> GetTableAuditLogsAsync(string tableName, int limit = 100)
        {
            var logs = await _unitOfWork.Repository<AuditLog>().GetAllAsync();
            var tableLogs = logs.Where(l => l.TableName == tableName)
                               .OrderByDescending(l => l.CreatedAt)
                               .Take(limit);

            var logDtos = new List<AuditLogDto>();
            foreach (var log in tableLogs)
            {
                logDtos.Add(await MapToDtoAsync(log));
            }
            return logDtos;
        }

        public async Task<AuditLogDto?> GetAuditLogByIdAsync(int logId)
        {
            var log = await _unitOfWork.Repository<AuditLog>().GetByIdAsync(logId);
            return log != null ? await MapToDtoAsync(log) : null;
        }

        private async Task<AuditLogDto> MapToDtoAsync(AuditLog auditLog)
        {
            var dto = _mapper.Map<AuditLogDto>(auditLog);

            if (auditLog.UserId.HasValue)
            {
                var user = await _unitOfWork.Repository<User>().GetByIdAsync(auditLog.UserId.Value);
                dto.UserName = user?.Name;
            }

            return dto;
        }
        public async Task<IEnumerable<AuditLogDto>> GetAllAuditLogsAsync(int page, int pageSize, string? actionFilter = null, string? tableFilter = null)
        {
            var logs = await _unitOfWork.Repository<AuditLog>().GetAllAsync();
            var query = logs.AsQueryable();

            if (!string.IsNullOrEmpty(actionFilter))
            {
                query = query.Where(l => l.Action.Contains(actionFilter, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrEmpty(tableFilter))
            {
                query = query.Where(l => l.TableName.Contains(tableFilter, StringComparison.OrdinalIgnoreCase));
            }

            var pagedLogs = query.OrderByDescending(l => l.CreatedAt)
                                 .Skip((page - 1) * pageSize)
                                 .Take(pageSize)
                                 .ToList();

            var logDtos = new List<AuditLogDto>();
            foreach (var log in pagedLogs)
            {
                logDtos.Add(await MapToDtoAsync(log));
            }
            return logDtos;
        }
    }
}
