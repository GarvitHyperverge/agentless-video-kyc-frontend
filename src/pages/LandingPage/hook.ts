import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

export const useLanding = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('session_id', sessionId);
      console.log('Session ID stored:', sessionId);
    } else {
      alert('No session found. Please use a valid verification link.');
    }
  }, [sessionId]);

  const handleStartVerification = () => {
    if (!sessionId) {
      alert('No session ID found. Please use a valid verification link.');
      return;
    }
    // TODO: Navigate to verification flow
    console.log('Starting verification for session:', sessionId);
  };

  return {
    handleStartVerification,
  };
};
