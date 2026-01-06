import { BACKEND_URL } from './config';

interface PanCardUploadPayload {
  sessionId: string;
  frontImage: string;
  backImage: string;
}

interface PanCardUploadResponse {
  success: boolean;
  data: {
    frontImagePath: string;
    backImagePath: string;
  };
  message?: string;
}

export const uploadPanCardImages = async (payload: PanCardUploadPayload): Promise<PanCardUploadResponse> => {
  const response = await fetch(`${BACKEND_URL}/pan-card`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: payload.sessionId,
      front_image: payload.frontImage,
      back_image: payload.backImage,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to upload PAN card images');
  }

  return response.json();
};
