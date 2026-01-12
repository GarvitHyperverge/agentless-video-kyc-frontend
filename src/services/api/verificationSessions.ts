import { BACKEND_URL } from './config';

interface CompleteVerificationSessionPayload {
  token: string;
}

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

export const completeVerificationSession = async (
  payload: CompleteVerificationSessionPayload
): Promise<CompleteVerificationSessionResponse> => {
  const response = await fetch(`${BACKEND_URL}/verification-sessions/complete`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${payload.token}`,
    },
  });

  if (!response.ok) {
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
