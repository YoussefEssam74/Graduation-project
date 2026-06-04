import { apiFetch, type ApiResponse } from "./client";

export interface AuditLogDto {
  logId: number;
  userId: number;
  action: string;
  tableName: string;
  recordId: number;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  userName?: string;
}

export interface AuditLogFilterDto {
  page?: number;
  pageSize?: number;
  action?: string;
  table?: string;
}

export const auditLogsApi = {
  /**
   * Get all audit logs (Admin only, paginated and filterable)
   */
  async getAllAuditLogs(filter: AuditLogFilterDto = {}): Promise<ApiResponse<AuditLogDto[]>> {
    const params = new URLSearchParams();
    if (filter.page) params.append("page", filter.page.toString());
    if (filter.pageSize) params.append("pageSize", filter.pageSize.toString());
    if (filter.action) params.append("action", filter.action);
    if (filter.table) params.append("table", filter.table);

    return apiFetch<AuditLogDto[]>(`/audit-logs?${params.toString()}`);
  },

  /**
   * Get an audit log by ID
   */
  async getAuditLog(id: number): Promise<ApiResponse<AuditLogDto>> {
    return apiFetch<AuditLogDto>(`/audit-logs/${id}`);
  },

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(userId: number, limit = 100): Promise<ApiResponse<AuditLogDto[]>> {
    return apiFetch<AuditLogDto[]>(`/audit-logs/user/${userId}?limit=${limit}`);
  },

  /**
   * Get audit logs for a specific table
   */
  async getTableAuditLogs(tableName: string, limit = 100): Promise<ApiResponse<AuditLogDto[]>> {
    return apiFetch<AuditLogDto[]>(`/audit-logs/table/${tableName}?limit=${limit}`);
  },
};
