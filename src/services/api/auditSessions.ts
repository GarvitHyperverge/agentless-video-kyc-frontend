import { BACKEND_URL } from './config';
import {
  SessionsListResponse,
  SessionDetailsResponse,
  UpdateStatusPayload,
  UpdateStatusResponse,
} from '../../pages/AuditSessions/types';

const AUDIT_BASE_URL = `${BACKEND_URL}/audit`;

/**
 * Get list of verification sessions with optional filter
 */
export const getSessionsList = async (
  filter: 'pending' | 'completed' | 'all' = 'pending'
): Promise<SessionsListResponse> => {
  const url = new URL(`${AUDIT_BASE_URL}/pending-sessions`);
  url.searchParams.append('filter', filter);

  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
    },
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
  const response = await fetch(`${AUDIT_BASE_URL}/sessions/${sessionUid}`, {
    headers: {
      'Content-Type': 'application/json',
    },
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
  const response = await fetch(
    `${AUDIT_BASE_URL}/sessions/${sessionUid}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update session status');
  }

  return response.json();
};
