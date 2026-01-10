/**
 * Set auditor as logged in
 */
export const setAuditorLoggedIn = (username: string): void => {
  localStorage.setItem('is_auditor_logged_in', 'true');
  localStorage.setItem('auditor_username', username);
};

/**
 * Set auditor as logged out
 */
export const setAuditorLoggedOut = (): void => {
  localStorage.removeItem('is_auditor_logged_in');
  localStorage.removeItem('auditor_username');
};

/**
 * Check if user is authenticated as auditor
 */
export const isAuditorAuthenticated = (): boolean => {
  return localStorage.getItem('is_auditor_logged_in') === 'true';
};

/**
 * Get auditor username
 */
export const getAuditorUsername = (): string | null => {
  return localStorage.getItem('auditor_username');
};
