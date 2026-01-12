import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, validateSession } from '../session';

/**
 * Hook that validates session on mount and redirects if missing
 * Also provides access to session utility functions
 */
export const useSessionValidation = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      alert('Session not found. Please start the verification process again.');
      navigate('/audit/sessions');
    }
  }, [navigate]);

  return { getToken, validateSession };
};
