import { BACKEND_URL } from './config';

// No payload needed - cookie is sent automatically

interface CompleteVerificationSessionResponse {
  success: boolean;
  message?: string;
}

interface UpdateAuditStatusPayload {
  session_id: string;
  audit_status: 'pass' | 'fail';
}

interface UpdateAuditStatusResponse {
  success: boolean;
  message?: string;
  data?: {
    session_id: string;
    audit_status: string;
  };
}

/**
 * Complete verification session
 * Cookie is automatically sent with credentials: 'include'
 */
export const completeVerificationSession = async (): Promise<CompleteVerificationSessionResponse> => {
  const response = await fetch(`${BACKEND_URL}/verification-sessions/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Send HTTP-only cookie automatically
  });

  if (!response.ok) {
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Authentication failed. Please refresh and try again.');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to complete verification session');
  }

  return response.json();
};

/**
 * Update audit status for a verification session
 * @param payload - Payload with session_id and audit_status (pass/fail)
 * @returns Response indicating success or failure
 */
export const updateAuditStatus = async (
  payload: UpdateAuditStatusPayload
): Promise<UpdateAuditStatusResponse> => {
  const response = await fetch(`${BACKEND_URL}/verification-sessions/audit-status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Required for cookie-based authentication
    body: JSON.stringify({
      session_id: payload.session_id,
      audit_status: payload.audit_status,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update audit status');
  }

  return response.json();
};
