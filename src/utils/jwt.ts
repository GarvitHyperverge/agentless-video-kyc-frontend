import { jwtDecode } from 'jwt-decode';

/**
 * Extract timestamp (iat or exp) from JWT token
 * @param token - JWT token string
 * @returns Timestamp in seconds (Unix timestamp)
 */
export const getJWTTimestamp = (token: string): number => {
  try {
    const payload = jwtDecode(token);
    // use .iat, fallback to current time
    return payload.iat || Date.now() / 1000;
  } catch (error) {
    throw new Error('Failed to decode JWT token');
  }
};
