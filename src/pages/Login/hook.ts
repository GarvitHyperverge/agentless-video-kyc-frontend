import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAsAuditor } from '../../services/api/auth';
import { setAuditorLoggedIn } from '../../utils/auth';

export const useLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      console.log("Logged in Succesfull");
      if (response.success && response.data?.success) {
        const username = response.data.username || formData.username;
        setAuditorLoggedIn(username);
        navigate('/audit/sessions');
      } else {
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
