/**
 * Get session ID from localStorage
 * @returns session ID or null if not found
 */
export const getSessionId = (): string | null => {
  return localStorage.getItem('session_id');
};

/**
 * Set session ID in localStorage
 * @param sessionId - Session ID to store
 */
export const setSessionId = (sessionId: string): void => {
  localStorage.setItem('session_id', sessionId);
};

/**
 * Validate session exists with error handling
 * @returns session ID
 * @throws Error with descriptive message if session not found
 */
export const validateSession = (): string => {
  const sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    throw new Error('Session not found. Please start the verification process again.');
  }
  return sessionId;
};
