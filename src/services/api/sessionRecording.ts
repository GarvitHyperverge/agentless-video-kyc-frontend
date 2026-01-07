import { BACKEND_URL } from './config';

interface SessionRecordingUploadPayload {
  sessionId: string;
  video: string; // Base64 encoded video
}

interface SessionRecordingUploadResponse {
  success: boolean;
  data: {
    videoPath: string;
  };
  message?: string;
}

export const uploadSessionRecording = async (
  payload: SessionRecordingUploadPayload
): Promise<SessionRecordingUploadResponse> => {
  const response = await fetch(`${BACKEND_URL}/session-recording/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: payload.sessionId,
      video: payload.video,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to upload session recording');
  }

  return response.json();
};
