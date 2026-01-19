import { BACKEND_URL } from './config';

// No payload needed - cookie is sent automatically

interface ActivateVerificationSessionPayload {
  temp_token: string;
}

interface ActivateVerificationSessionResponse {
  success: boolean;
  message?: string;
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

/**
 * Activate verification session with temp_token
 * This sets the session cookie (HTTP-only) in the browser
 * @param payload - Payload with temp_token from CRED redirect
 * @returns Response indicating success or failure
 */
export const activateVerificationSession = async (
  payload: ActivateVerificationSessionPayload
): Promise<ActivateVerificationSessionResponse> => {
  const response = await fetch(`${BACKEND_URL}/verification-sessions/activate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', 
    body: JSON.stringify({
      temp_token: payload.temp_token,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to activate verification session');
  }

  return response.json();
};

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
