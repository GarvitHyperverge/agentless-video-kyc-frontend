import { BACKEND_URL } from '../services/api/config';

/**
 * Check authentication status
 * Calls GET /auth/check which validates JWT + JTI + Redis
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

/**
 * Check audit authentication status
 * Calls GET /api/auth/audit/check which validates audit JWT + JTI + Redis
 * 
 * Backend validates:
 * - JWT signature + expiry
 * - JTI exists in Redis (session:<jti>)
 * 
 * Response format:
 * Success (200): { success: true, data: { authenticated: true, username: "auditor_username" } }
 * Failure (401): Token invalid/expired, session revoked, or user not found
 * 
 * @returns true if authenticated (200 OK with authenticated: true), false if not (401 Unauthorized)
 */
export async function checkAuditAuthentication(): Promise<boolean> {
  try {
    const url = `${BACKEND_URL}/auth/audit/check`;
    console.log('[checkAuditAuthentication] Making request to:', url);
    console.log('[checkAuditAuthentication] Cookies available:', document.cookie || 'NO COOKIES');
    console.log('[checkAuditAuthentication] Credentials: include');
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', 
    });
    
    console.log('[checkAuditAuthentication] Response status:', response.status);
    console.log('[checkAuditAuthentication] Response headers:', {
      'Set-Cookie': response.headers.get('Set-Cookie'),
      'Content-Type': response.headers.get('Content-Type'),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('[checkAuditAuthentication] Response data:', data);
      // Check if authenticated in response data
      return data.success && data.data?.authenticated === true;
    }
    console.log('[checkAuditAuthentication] Auth check failed with status:', response.status);
    return false;
  } catch (error) {
    console.error('Audit auth check failed:', error);
    return false;
  }
}
