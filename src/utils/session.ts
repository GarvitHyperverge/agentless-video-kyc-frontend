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
 * Validate token exists with error handling
 * @returns token
 * @throws Error with descriptive message if token not found
 */
export const validateSession = (): string => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Session not found. Please start the verification process again.');
  }
  return token;
};
