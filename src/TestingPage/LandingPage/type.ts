export interface SessionMetadata {
  latitude: number;
  longitude: number;
  cameraPermission: boolean;
  microphonePermission: boolean;
  locationPermission: boolean;
  ipAddress: string;
  deviceType: string;
}

export interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}
