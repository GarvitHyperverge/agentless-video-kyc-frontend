import { BACKEND_URL } from '../services/api/config';

/**
 * Check authentication status
 * Calls GET /auth/check which validates JWT + JTI 
 * 
 * @returns true if authenticated (200 OK), false if not (401 Unauthorized)
 */
export async function checkAuthentication(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/check`, {
      method: 'GET',
      credentials: 'include', 
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
}

/**
 * Check audit authentication status
 * Calls GET /api/auth/audit/check which validates audit JWT + JTI 
 * 
 * @returns true if authenticated (200 OK with authenticated: true), false if not (401 Unauthorized)
 */
export async function checkAuditAuthentication(): Promise<boolean> {
  try {
    const url = `${BACKEND_URL}/auth/audit/check`;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', 
    });
    
    
    if (response.ok) {
      const data = await response.json();
      return data.success && data.data?.authenticated === true;
    }
    return false;
  } catch (error) {
    console.error('Audit auth check failed:', error);
    return false;
  }
}
