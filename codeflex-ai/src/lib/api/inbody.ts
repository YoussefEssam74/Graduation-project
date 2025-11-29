import { apiFetch, type ApiResponse } from './client';

export interface InBodyMeasurementDto {
  measurementId: number;
  userId: number;
  measurementDate: string;
  weight: number;
  bodyFatPercentage: number;
  muscleMass: number;
  bmi: number;
  bodyWaterPercentage?: number;
  boneMass?: number;
  visceralFatLevel?: number;
  bmr?: number;
  notes?: string;
}

export interface CreateInBodyMeasurementDto {
  userId: number;
  weight: number;
  bodyFatPercentage: number;
  muscleMass: number;
  bmi: number;
  bodyWaterPercentage?: number;
  boneMass?: number;
  visceralFatLevel?: number;
  bmr?: number;
  notes?: string;
}

export const inbodyApi = {
  /**
   * Get all measurements for a user
   */
  async getUserMeasurements(userId: number): Promise<ApiResponse<InBodyMeasurementDto[]>> {
    return apiFetch<InBodyMeasurementDto[]>(`/inbody/user/${userId}`);
  },

  /**
   * Get measurement by ID
   */
  async getMeasurement(measurementId: number): Promise<ApiResponse<InBodyMeasurementDto>> {
    return apiFetch<InBodyMeasurementDto>(`/inbody/${measurementId}`);
  },

  /**
   * Get latest measurement for a user
   */
  async getLatestMeasurement(userId: number): Promise<ApiResponse<InBodyMeasurementDto>> {
    return apiFetch<InBodyMeasurementDto>(`/inbody/user/${userId}/latest`);
  },

  /**
   * Create new measurement
   */
  async createMeasurement(data: CreateInBodyMeasurementDto): Promise<ApiResponse<InBodyMeasurementDto>> {
    return apiFetch<InBodyMeasurementDto>('/inbody', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
