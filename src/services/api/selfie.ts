import { BACKEND_URL } from './config';
import { validateFileSize } from '../../utils/fileValidation';
import { createUploadFormData } from '../../utils/formData';

interface SelfieUploadPayload {
  imageFile: File;
}

interface SelfieUploadResponse {
  success: boolean;
  data: {
    imagePath: string;
  };
  message?: string;
}

/**
 * Upload selfie image to backend using FormData
 * @param payload - Upload payload with session ID and image file
 * @returns Upload response with image path
 */
export const uploadSelfie = async (payload: SelfieUploadPayload): Promise<SelfieUploadResponse> => {
  // Check file size (max 10MB for images)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  validateFileSize(payload.imageFile, MAX_FILE_SIZE, 'Image');

  // Create FormData for multipart upload
  const formData = createUploadFormData({
    image: payload.imageFile,
  });

  const response = await fetch(`${BACKEND_URL}/selfie/upload`, {
    method: 'POST',
    credentials: 'include', // Send HTTP-only cookie automatically
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Authentication failed. Please refresh and try again.');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to upload selfie');
  }

  return response.json();
};
