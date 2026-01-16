import { BACKEND_URL } from './config';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    success: boolean;
    message?: string;
    username?: string;
  };
  error?: string;
  message?: string;
}

/**
 * Login as auditor
 * On success, sets HTTP-only cookie (auditToken) automatically
 * Cookie is automatically sent to /api/audit/* endpoints
 */
export const loginAsAuditor = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${BACKEND_URL}/audit/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Required to receive HTTP-only cookie
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle error responses (400, 401, 500)
      return {
        success: false,
        error: data.error || data.message || 'Login failed. Please check your credentials.',
        message: data.error || data.message || 'Login failed. Please check your credentials.',
      };
    }

    // Success response: { success: true, data: { success: true, message: "Login successful" } }
    return {
      success: true,
      data: data.data || { success: true, message: data.message || 'Login successful' },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error. Please try again later.',
      message: 'Network error. Please try again later.',
    };
  }
};
