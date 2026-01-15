import { BACKEND_URL } from './config';
import { validateFileSize } from '../../utils/fileValidation';
import { createUploadFormData } from '../../utils/formData';

interface PanCardUploadPayload {
  frontImageFile: File;
  backImageFile: File;
}

interface PanCardUploadResponse {
  success: boolean;
  data: {
    frontImagePath: string;
    backImagePath: string;
  };
  message?: string;
}

/**
 * Upload PAN card images to backend using FormData
 * @param payload - Upload payload with session ID and image files
 * @returns Upload response with image paths
 */
export const uploadPanCardImages = async (payload: PanCardUploadPayload): Promise<PanCardUploadResponse> => {
  // Check file sizes (max 10MB per image)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  validateFileSize(payload.frontImageFile, MAX_FILE_SIZE, 'Image');
  validateFileSize(payload.backImageFile, MAX_FILE_SIZE, 'Image');

  // Create FormData for multipart upload
  const formData = createUploadFormData({
    front_image: payload.frontImageFile,
    back_image: payload.backImageFile,
  });

  const response = await fetch(`${BACKEND_URL}/pan-card`, {
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
    throw new Error(errorData.message || 'Failed to upload PAN card images');
  }

  return response.json();
};
