import { BACKEND_URL } from './config';

interface SessionRecordingUploadResponse {
  success: boolean;
  data: {
    videoPath: string;
  };
  message?: string;
}

/**
 * Upload session recording video to backend using FormData
 * @param sessionId - Session ID from localStorage
 * @param videoBlob - Video blob from MediaRecorder
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @returns Upload response with video path
 */
export const uploadSessionRecording = async (
  sessionId: string,
  videoBlob: Blob,
  latitude: number,
  longitude: number
): Promise<SessionRecordingUploadResponse> => {
  // Check file size (10 min recording ≈ 10-50MB, max 100MB for safety)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  if (videoBlob.size > MAX_FILE_SIZE) {
    throw new Error(
      `Video file too large: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 100MB.`
    );
  }

  if (videoBlob.size === 0) {
    throw new Error('Video blob is empty');
  }

  // Create FormData for multipart upload
  // Ensure blob has correct MIME type for backend validation
  const videoFile = new File([videoBlob], 'session_recording.webm', { type: 'video/webm' });
  
  const formData = new FormData();
  formData.append('session_id', sessionId);
  formData.append('latitude', latitude.toString());
  formData.append('longitude', longitude.toString());
  formData.append('video', videoFile);

  const response = await fetch(`${BACKEND_URL}/session-recording/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to upload session recording');
  }

  return response.json();
};
