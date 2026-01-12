import { BACKEND_URL } from './config';
import { validateFileSize } from '../../utils/fileValidation';
import { createUploadFormData } from '../../utils/formData';

interface OtpVideoUploadResponse {
  success: boolean;
  data: {
    videoPath: string;
  };
  message?: string;
}

/**
 * Upload OTP video to backend using FormData
 * @param token - Token
 * @param otp - OTP code
 * @param videoBlob - Video blob from MediaRecorder
 * @returns Upload response with video path
 */
export const uploadOtpVideo = async (
  token: string,
  otp: string,
  videoBlob: Blob
): Promise<OtpVideoUploadResponse> => {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  validateFileSize(videoBlob, MAX_FILE_SIZE, 'Video');

  // Create FormData for multipart upload
  // Ensure blob has correct MIME type for backend validation
  const videoFile = new File([videoBlob], 'otp_video.webm', { type: 'video/webm' });
  
  const formData = createUploadFormData({
    otp,
    video: videoFile,
  });

  const response = await fetch(`${BACKEND_URL}/otp-video/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to upload OTP video');
  }

  return response.json();
};
