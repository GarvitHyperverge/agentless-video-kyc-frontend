import { BACKEND_URL } from './config';

interface PanCardUploadPayload {
  sessionId: string;
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
  if (payload.frontImageFile.size > MAX_FILE_SIZE || payload.backImageFile.size > MAX_FILE_SIZE) {
    throw new Error('Image file too large. Maximum size is 10MB per image.');
  }

  if (payload.frontImageFile.size === 0 || payload.backImageFile.size === 0) {
    throw new Error('Image file is empty');
  }

  // Create FormData for multipart upload
  const formData = new FormData();
  formData.append('session_id', payload.sessionId);
  formData.append('front_image', payload.frontImageFile);
  formData.append('back_image', payload.backImageFile);

  const response = await fetch(`${BACKEND_URL}/pan-card`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to upload PAN card images');
  }

  return response.json();
};
