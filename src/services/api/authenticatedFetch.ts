import { refreshAccessToken } from './auth';

/**
 * Redirect to login page
 */
const redirectToLogin = () => {
  window.location.href = '/audit/login';
};

/**
 * Authenticated fetch wrapper with automatic token refresh
 * 
 * Automatically handles 401 errors by:
 * 1. Calling /api/audit/refresh to get a new access token
 * 2. Retrying the original request
 * 3. Redirecting to login if refresh fails
 * 
 * @param url - Request URL
 * @param options - Fetch options (will have credentials: 'include' added)
 * @returns Promise<Response>
 */
export const authenticatedFetch = async (
  url: string | URL,
  options: RequestInit = {}
): Promise<Response> => {
  // Ensure credentials are included for cookie handling
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Make the initial request
  let response = await fetch(url, fetchOptions);

  // If not 401, return the response as-is
  if (response.status !== 401) {
    return response;
  }

  // Handle 401: Token expired or invalid
  // Try to refresh the access token
  try {
    const refreshResponse = await refreshAccessToken();

    if (!refreshResponse.success) {
      // Refresh failed - redirect to login
      redirectToLogin();
      throw new Error('Token refresh failed');
    }

    // Refresh successful - retry the original request with new token
    response = await fetch(url, fetchOptions);

    // If still 401 after refresh, something is wrong - redirect to login
    if (response.status === 401) {
      redirectToLogin();
      throw new Error('Authentication failed after token refresh');
    }

    return response;
  } catch (error) {
    // Network error or refresh failed - redirect to login
    redirectToLogin();
    throw error;
  }
};
