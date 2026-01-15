import { BACKEND_URL } from './config';

interface SessionMetadataPayload {
  latitude: number;
  longitude: number;
  cameraPermission: boolean;
  microphonePermission: boolean;
  locationPermission: boolean;
  ipAddress: string;
  deviceType: string;
}

interface SessionMetadataData {
  id: string;
  session_uid: string;
  latitude: string;
  longitude: string;
  camera_permission: boolean;
  microphone_permission: boolean;
  location_permission: boolean;
  ip_address: string;
  device_type: string;
  created_at: string;
  updated_at: string;
}

interface SessionMetadataResponse {
  success: boolean;
  data: SessionMetadataData;
}

export const saveSessionMetadata = async (payload: SessionMetadataPayload): Promise<SessionMetadataResponse> => {
  const response = await fetch(`${BACKEND_URL}/session-metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Send HTTP-only cookie automatically
    body: JSON.stringify({
      latitude: payload.latitude,
      longitude: payload.longitude,
      camera_permission: payload.cameraPermission,
      microphone_permission: payload.microphonePermission,
      location_permission: payload.locationPermission,
      ip_address: payload.ipAddress,
      device_type: payload.deviceType,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Authentication failed. Please refresh and try again.');
    }
    throw new Error('Failed to save session metadata');
  }

  return response.json();
};
