import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginAsAuditor } from '../../services/api/auth';
import { setAuditorLoggedIn } from '../../utils/auth';

export const useLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for session_expired error in query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const errorParam = urlParams.get('error');
    if (errorParam === 'session_expired') {
      setError('Your session has expired. Please login again.');
      // Clear the error parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location.search]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await loginAsAuditor(formData);

      if (response.success && response.data?.success) {
        // HTTP-only cookie (auditToken) is automatically set by the server
        // Store username from response and set client-side flag for routing/UI state
        const username = response.data.username || formData.username;
        setAuditorLoggedIn(username);
        navigate('/audit/sessions');
      } else {
        // Handle error from response.error or response.message
        setError(response.error || response.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    error,
    handleInputChange,
    handleSubmit,
  };
};
