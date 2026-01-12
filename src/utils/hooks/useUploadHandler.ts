import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateSession } from '../session';

interface UseUploadHandlerOptions<T> {
  /**
   * Upload function that takes token and returns a response
   */
  uploadFn: (token: string, ...args: any[]) => Promise<T>;
  /**
   * Callback to clean up resources before navigation (e.g., revoke object URLs)
   */
  onBeforeNavigate?: () => void;
  /**
   * Navigation path after successful upload
   */
  navigateTo: string;
  /**
   * Error message prefix for upload failures
   */
  errorMessagePrefix?: string;
}

interface UseUploadHandlerReturn {
  isProcessing: boolean;
  uploadError: string | null;
  setUploadError: (error: string | null) => void;
  handleUpload: (...args: any[]) => Promise<void>;
}

/**
 * Reusable hook for handling file uploads with consistent error handling and navigation
 */
export const useUploadHandler = <T extends { success: boolean; message?: string }>(
  options: UseUploadHandlerOptions<T>
): UseUploadHandlerReturn => {
  const { uploadFn, onBeforeNavigate, navigateTo, errorMessagePrefix = 'Failed to upload' } = options;
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = useCallback(
    async (...args: any[]) => {
      let token: string;
      try {
        token = validateSession();
      } catch (err) {
        setUploadError('Session not found. Please start the verification process again.');
        return;
      }

      setIsProcessing(true);
      setUploadError(null);

      try {
        const response = await uploadFn(token, ...args);

        if (response.success) {
          // Clean up resources before navigating
          if (onBeforeNavigate) {
            onBeforeNavigate();
          }
          navigate(navigateTo);
        } else {
          setUploadError(response.message || `${errorMessagePrefix}. Please try again.`);
        }
      } catch (err) {
        console.error('Upload error:', err);
        setUploadError(err instanceof Error ? err.message : `${errorMessagePrefix}. Please try again.`);
      } finally {
        setIsProcessing(false);
      }
    },
    [uploadFn, onBeforeNavigate, navigateTo, errorMessagePrefix, navigate]
  );

  return {
    isProcessing,
    uploadError,
    setUploadError,
    handleUpload,
  };
};
