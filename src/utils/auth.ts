/**
 * Set auditor as logged in
 * Note: Actual authentication is handled by HTTP-only cookie (auditToken)
 * This only stores the username for display purposes
 * @param username - The auditor's username from the login response
 */
export const setAuditorLoggedIn = (username: string): void => {
  localStorage.setItem('auditor_username', username);
};

/**
 * Set auditor as logged out
 * Note: This only clears the username from localStorage
 * The HTTP-only cookie will expire or be cleared by the server
 */
export const setAuditorLoggedOut = (): void => {
  localStorage.removeItem('auditor_username');
};

/**
 * Get auditor username from localStorage
 * @returns The auditor's username or null if not set
 */
export const getAuditorUsername = (): string | null => {
  return localStorage.getItem('auditor_username');
};
