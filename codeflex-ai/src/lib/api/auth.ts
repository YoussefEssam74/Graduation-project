import { apiFetch, setAuthToken, removeAuthToken, type ApiResponse } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: number; // 0 = Male, 1 = Female
  role: string; // Member, Coach, Receptionist, Admin
  invitationCode?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserDto {
  userId: number;
  email: string;
  name: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: number;
  role: string;
  profileImageUrl?: string;
  address?: string;
  tokenBalance: number;
  hasActiveSubscription?: boolean;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  mustChangePassword?: boolean;
  isFirstLogin?: boolean;
}

export interface AuthResponse {
  user: UserDto;
  token: string;
  expiresAt: string;
}


export const authApi = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true,
    });

    // Store token if login successful
    if (response.success && response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  /**
   * Register new user (public - always creates Member)
   */
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    });

    // Store token if registration successful
    if (response.success && response.data?.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },

  /**
   * Admin-only: Create user with specific role (Coach, Receptionist, Admin)
   */
  async createUserWithRole(data: RegisterRequest, role: string): Promise<ApiResponse<AuthResponse>> {
    const response = await apiFetch<AuthResponse>(`/auth/create-with-role?role=${encodeURIComponent(role)}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response;
  },

  /**
   * Change password (for authenticated users)
   */
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Complete first login setup (marks isFirstLogin=false, mustChangePassword=false)
   */
  async completeSetup(): Promise<ApiResponse<UserDto>> {
    return apiFetch<UserDto>('/auth/complete-setup', {
      method: 'POST',
    });
  },

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<ApiResponse<boolean>> {
    return apiFetch<boolean>(`/auth/email-exists?email=${encodeURIComponent(email)}`, { skipAuth: true });
  },

  /**
   * Logout user (clear token)
   */
  logout() {
    removeAuthToken();
  },

  /**
   * Send OTP to email for password change verification
   */
  async sendChangePasswordOtp(): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>('/auth/send-change-password-otp', {
      method: 'POST',
    });
  },

  /**
   * Verify OTP for password change
   */
  async verifyChangePasswordOtp(otp: string): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>('/auth/verify-change-password-otp', {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
  },

  /**
   * Forgot password step 1 — send OTP to this email address
   */
  async sendForgotPasswordOtp(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>('/auth/forgot-password/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
    });
  },

  /**
   * Forgot password step 2 — verify OTP and set new password
   */
  async confirmForgotPassword(
    email: string,
    otp: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiFetch<{ message: string }>('/auth/forgot-password/confirm', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword, confirmPassword }),
      skipAuth: true,
    });
  },

  /**
   * Sign in (or sign up) with a Google ID token issued by the frontend.
   */
  async googleLogin(idToken: string): Promise<ApiResponse<AuthResponse>> {
    const response = await apiFetch<AuthResponse>('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
      skipAuth: true,
    });
    if (response.success && response.data?.token) {
      setAuthToken(response.data.token);
    }
    return response;
  },
};
