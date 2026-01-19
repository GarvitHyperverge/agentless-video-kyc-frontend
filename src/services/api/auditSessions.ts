import { BACKEND_URL } from './config';
import {
  SessionsListResponse,
  SessionDetailsResponse,
  UpdateStatusPayload,
  UpdateStatusResponse,
} from '../../pages/AuditSessions/types';
import { authenticatedFetch } from './authenticatedFetch';

const AUDIT_BASE_URL = `${BACKEND_URL}/audit`;

/**
 * Get list of verification sessions with optional filter
 */
export const getSessionsList = async (
  filter: 'pending' | 'completed' | 'all' = 'pending'
): Promise<SessionsListResponse> => {
  const url = new URL(`${AUDIT_BASE_URL}/pending-sessions`);
  url.searchParams.append('filter', filter);

  const response = await authenticatedFetch(url.toString(), {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to fetch sessions list');
  }

  return response.json();
};

/**
 * Get detailed information for a specific session
 */
export const getSessionDetails = async (
  sessionUid: string
): Promise<SessionDetailsResponse> => {
  const response = await authenticatedFetch(`${AUDIT_BASE_URL}/sessions/${sessionUid}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'Failed to fetch session details');
  }

  return response.json();
};

/**
 * Update session status (approve, reject, or flag)
 */
export const updateSessionStatus = async (
  sessionUid: string,
  payload: UpdateStatusPayload
): Promise<UpdateStatusResponse> => {
  const response = await authenticatedFetch(
    `${AUDIT_BASE_URL}/sessions/${sessionUid}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update session status');
  }

  return response.json();
};

/**
 * Logout from audit session
 * Clears the server-side authentication cookie
 */
export interface LogoutResponse {
  success: boolean;
  data?: {
    success: boolean;
    message: string;
  };
  error?: string;
}

export const logoutAuditSession = async (): Promise<LogoutResponse> => {
  const response = await authenticatedFetch(`${AUDIT_BASE_URL}/logout`, {
    method: 'POST',
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error || 'Logout failed',
    };
  }

  return {
    success: true,
    data: data.data || { success: true, message: 'Logout successful' },
  };
};
