import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessionId, validateSession } from '../session';

/**
 * Hook that validates session on mount and redirects if missing
 * Also provides access to session utility functions
 */
export const useSessionValidation = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const sessionId = getSessionId();
    if (!sessionId) {
      alert('Session not found. Please start the verification process again.');
      navigate('/');
    }
  }, [navigate]);

  return { getSessionId, validateSession };
};
