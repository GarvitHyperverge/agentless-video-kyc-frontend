import { BACKEND_URL } from './config';

interface OtpVideoUploadPayload {
  sessionId: string;
  otp: string;
  video: string;
}

interface OtpVideoUploadResponse {
  success: boolean;
  data: {
    videoPath: string;
  };
  message?: string;
}

export const uploadOtpVideo = async (payload: OtpVideoUploadPayload): Promise<OtpVideoUploadResponse> => {
  const response = await fetch(`${BACKEND_URL}/otp-video/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: payload.sessionId,
      otp: payload.otp,
      video: payload.video,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to upload OTP video');
  }

  return response.json();
};
