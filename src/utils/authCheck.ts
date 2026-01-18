import { BACKEND_URL } from '../services/api/config';

/**
 * Check authentication status
 * Calls GET /api/auth/check which validates JWT + JTI + Redis
 * 
 * @returns true if authenticated (200 OK), false if not (401 Unauthorized)
 */
export async function checkAuthentication(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/check`, {
      method: 'GET',
      credentials: 'include', // CRITICAL: Include cookies (HTTP-only JWT)
    });
    
    // 200 = authenticated, 401 = not authenticated
    return response.status === 200;
  } catch (error) {
    // Network error or other issues - treat as not authenticated
    console.error('Auth check failed:', error);
    return false;
  }
}
