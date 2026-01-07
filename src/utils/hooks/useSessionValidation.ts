import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Validates session ID exists in localStorage
 * Redirects to home page if session is missing
 */
export const useSessionValidation = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      alert('Session not found. Please start the verification process again.');
      navigate('/');
    }
  }, [navigate]);

  /**
   * Get current session ID
   * @returns session ID or null if not found
   */
  const getSessionId = (): string | null => {
    return localStorage.getItem('session_id');
  };

  /**
   * Validate session exists, throw error if not
   * @throws Error if session not found
   */
  const validateSession = (): string => {
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      throw new Error('Session not found. Please start the verification process again.');
    }
    return sessionId;
  };

  return { getSessionId, validateSession };
};
