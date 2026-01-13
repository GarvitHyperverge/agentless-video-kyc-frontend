/**
 * Get token from localStorage
 * @returns token or null if not found
 */
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Set token in localStorage
 * @param token - Token to store
 */
export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

/**
 * Validate token exists
 * @returns true if token exists, false otherwise
 */
export const validateSession = (): boolean => {
  const token = getToken();
  return token !== null;
};
