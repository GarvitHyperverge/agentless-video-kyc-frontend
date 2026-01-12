import { BACKEND_URL } from './config';
import { validateFileSize } from '../../utils/fileValidation';
import { createUploadFormData } from '../../utils/formData';

interface SessionRecordingUploadResponse {
  success: boolean;
  data: {
    videoPath: string;
  };
  message?: string;
}

/**
 * Upload session recording video to backend using FormData
 * @param token - Token from localStorage
 * @param videoBlob - Video blob from MediaRecorder
 * @returns Upload response with video path
 */
export const uploadSessionRecording = async (
  token: string,
  videoBlob: Blob
): Promise<SessionRecordingUploadResponse> => {
  // Check file size (10 min recording ≈ 10-50MB, max 100MB for safety)
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  validateFileSize(videoBlob, MAX_FILE_SIZE, 'Video');

  // Create FormData for multipart upload
  // Ensure blob has correct MIME type for backend validation
  const videoFile = new File([videoBlob], 'session_recording.webm', { type: 'video/webm' });
  
  const formData = createUploadFormData(token, {
    video: videoFile,
  });

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
