import { BACKEND_URL } from './config';

interface CompleteVerificationSessionPayload {
  sessionId: string;
}

interface CompleteVerificationSessionResponse {
  success: boolean;
  message?: string;
}

export const completeVerificationSession = async (
  payload: CompleteVerificationSessionPayload
): Promise<CompleteVerificationSessionResponse> => {
  const response = await fetch(`${BACKEND_URL}/verification-sessions/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: payload.sessionId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to complete verification session');
  }

  return response.json();
};
