import { apiFetch, setAuthToken, removeAuthToken, type ApiResponse } from './client';

export interface LoginRequest {
  email: string;
  password: string;
  role: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: number;
  role: number;
}

export interface UserDto {
  userId: number;
  email: string;
  name: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: number;
  role: number;
  profileImageUrl?: string;
  address?: string;
  tokenBalance: number;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserDto;
  token: string;
  expiresAt: string;
}

// Backend response wrapper
interface BackendAuthResponse {
  success: boolean;
  message?: string;
  data: AuthResponse;
  errors?: string[];
}

export const authApi = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Store token if login successful
    if (response.success && response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Store token if registration successful
    if (response.success && response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<ApiResponse<boolean>> {
    return apiFetch<boolean>(`/auth/email-exists?email=${encodeURIComponent(email)}`);
  },

  /**
   * Logout user (clear token)
   */
  logout() {
    removeAuthToken();
  },
};
