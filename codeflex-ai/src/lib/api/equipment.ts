import { apiFetch, type ApiResponse } from './client';

export interface EquipmentDto {
  equipmentId: number;
  name: string;
  category: string;
  description?: string;
  status: number;
  location?: string;
  maintenanceSchedule?: string;
  lastMaintenanceDate?: string;
  tokensCost: number;
}

export const equipmentApi = {
  /**
   * Get all equipment
   */
  async getAllEquipment(): Promise<ApiResponse<EquipmentDto[]>> {
    return apiFetch<EquipmentDto[]>('/equipment');
  },

  /**
   * Get available equipment only
   */
  async getAvailableEquipment(): Promise<ApiResponse<EquipmentDto[]>> {
    return apiFetch<EquipmentDto[]>('/equipment/available');
  },

  /**
   * Get equipment by ID
   */
  async getEquipment(id: number): Promise<ApiResponse<EquipmentDto>> {
    return apiFetch<EquipmentDto>(`/equipment/${id}`);
  },

  /**
   * Update equipment status (Admin/Reception only)
   */
  async updateEquipmentStatus(id: number, status: number): Promise<ApiResponse<EquipmentDto>> {
    return apiFetch<EquipmentDto>(`/equipment/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(status),
    });
  },
};
