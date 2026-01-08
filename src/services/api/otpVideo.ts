import { BACKEND_URL } from './config';

interface OtpVideoUploadResponse {
  success: boolean;
  data: {
    videoPath: string;
  };
  message?: string;
}

/**
 * Upload OTP video to backend using FormData
 * @param sessionId - Session ID
 * @param otp - OTP code
 * @param videoBlob - Video blob from MediaRecorder
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @returns Upload response with video path
 */
export const uploadOtpVideo = async (
  sessionId: string,
  otp: string,
  videoBlob: Blob,
  latitude: number,
  longitude: number
): Promise<OtpVideoUploadResponse> => {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  if (videoBlob.size > MAX_FILE_SIZE) {
    throw new Error(
      `Video file too large: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 50MB.`
    );
  }

  if (videoBlob.size === 0) {
    throw new Error('Video blob is empty');
  }

  // Create FormData for multipart upload
  // Ensure blob has correct MIME type for backend validation
  const videoFile = new File([videoBlob], 'otp_video.webm', { type: 'video/webm' });
  
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('otp', otp);
  formData.append('latitude', latitude.toString());
  formData.append('longitude', longitude.toString());
  formData.append('video', videoFile);

  const response = await fetch(`${BACKEND_URL}/otp-video/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to upload OTP video');
  }

  return response.json();
};
