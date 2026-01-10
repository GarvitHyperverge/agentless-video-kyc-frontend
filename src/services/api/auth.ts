import { BACKEND_URL } from './config';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
}

/**
 * Login as auditor
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
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Login failed. Please check your credentials.',
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: 'Network error. Please try again later.',
    };
  }
};
