import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UploadOptions<T> {
  uploadFunction: (data: T) => Promise<{ success: boolean; message?: string }>;
  uploadData: T;
  onSuccess?: () => void;
  successNavigateTo?: string;
  errorMessage?: string;
}

/**
 * Unified hook for handling uploads with loading states and error handling
 */
export const useUpload = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Execute upload with standardized error handling
   */
  const executeUpload = async <T,>(options: UploadOptions<T>) => {
    const {
      uploadFunction,
      uploadData,
      onSuccess,
      successNavigateTo,
      errorMessage = 'Failed to upload. Please try again.',
    } = options;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await uploadFunction(uploadData);

      if (response.success) {
        if (onSuccess) {
          onSuccess();
        }
        if (successNavigateTo) {
          navigate(successNavigateTo);
        }
        return { success: true };
      } else {
        setError(response.message || errorMessage);
        return { success: false, error: response.message || errorMessage };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : errorMessage;
      setError(errorMsg);
      console.error('Upload error:', err);
      return { success: false, error: errorMsg };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    error,
    setError,
    executeUpload,
  };
};
