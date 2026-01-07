import { BACKEND_URL } from './config';

interface SelfieUploadPayload {
  sessionId: string;
  image: string;
}

interface SelfieUploadResponse {
  success: boolean;
  data: {
    imagePath: string;
  };
  message?: string;
}

export const uploadSelfie = async (payload: SelfieUploadPayload): Promise<SelfieUploadResponse> => {
  const response = await fetch(`${BACKEND_URL}/selfie/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: payload.sessionId,
      image: payload.image,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to upload selfie');
  }

  return response.json();
};
