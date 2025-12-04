// API Base URL from environment variable
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5025/api';

// Helper function to get auth token from localStorage
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

// Helper function to set auth token
export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
};

// Helper function to remove auth token
export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
};

// Generic API response type
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

// Generic fetch wrapper with auth token
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Log full request details for debugging
    console.log(`API Request: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);
    console.log('Response status:', response.status, response.statusText);

    // Try to parse JSON, but handle cases where response isn't JSON or is empty
    let data: any;
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    // Check if response has content to parse
    if (contentLength === '0' || !contentType?.includes('application/json')) {
      // No content or not JSON - treat as success for 2xx responses
      if (response.ok) {
        return {
          success: true,
          data: undefined,
        };
      }
      return {
        success: false,
        message: `Server error: ${response.statusText}`,
        errors: [`HTTP ${response.status}: ${response.statusText}`],
      };
    }
    
    try {
      const text = await response.text();
      // Handle empty response body
      if (!text || text.trim() === '') {
        if (response.ok) {
          return { success: true, data: undefined };
        }
        return {
          success: false,
          message: `Server error: ${response.statusText}`,
          errors: [`HTTP ${response.status}: ${response.statusText}`],
        };
      }
      data = JSON.parse(text);
      console.log('Response data:', data);
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      // If JSON parsing fails but response was OK, treat as success
      if (response.ok) {
        return { success: true, data: undefined };
      }
      return {
        success: false,
        message: `Server error: ${response.statusText}`,
        errors: [`HTTP ${response.status}: ${response.statusText}`],
      };
    }

    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
      });
      return {
        success: false,
        message: data?.error || data?.message || data?.title || 'An error occurred',
        errors: data?.errors || [data?.error || response.statusText],
      };
    }

    // Backend returns data directly, wrap it in ApiResponse format
    // If backend already has success field, use as-is, otherwise wrap it
    if (typeof data === 'object' && data !== null && 'success' in data) {
      return data;
    }
    
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Network/Fetch Error:', error);
    console.error('Failed URL:', `${API_BASE_URL}${endpoint}`);
    return {
      success: false,
      message: 'Network error - Cannot connect to server',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
