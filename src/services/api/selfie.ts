import { BACKEND_URL } from './config';

interface SelfieUploadPayload {
  sessionId: string;
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
  if (payload.imageFile.size > MAX_FILE_SIZE) {
    throw new Error(
      `Image file too large: ${(payload.imageFile.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`
    );
  }

  if (payload.imageFile.size === 0) {
    throw new Error('Image file is empty');
  }

  // Create FormData for multipart upload
  const formData = new FormData();
  formData.append('session_id', payload.sessionId);
  formData.append('image', payload.imageFile);

  const response = await fetch(`${BACKEND_URL}/selfie/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to upload selfie');
  }

  return response.json();
};
