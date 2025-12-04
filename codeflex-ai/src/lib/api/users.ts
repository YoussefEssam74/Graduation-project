import { apiFetch, type ApiResponse } from './client';
import { UserDto } from './auth';

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: number;
  address?: string;
  profileImageUrl?: string;
}

export const usersApi = {
  /**
   * Get user by ID
   */
  async getUser(id: number): Promise<ApiResponse<UserDto>> {
    return apiFetch<UserDto>(`/users/${id}`);
  },

  /**
   * Update user profile
   */
  async updateProfile(id: number, data: UpdateProfileDto): Promise<ApiResponse<UserDto>> {
    return apiFetch<UserDto>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get user token balance
   */
  async getTokenBalance(id: number): Promise<ApiResponse<number>> {
    return apiFetch<number>(`/users/${id}/tokens`);
  },

  /**
   * Deactivate user account
   */
  async deactivateUser(id: number): Promise<ApiResponse<boolean>> {
    return apiFetch<boolean>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get all coaches
   */
  async getCoaches(): Promise<ApiResponse<UserDto[]>> {
    return apiFetch<UserDto[]>('/users/coaches');
  },
};
