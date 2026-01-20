import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SessionMetadata } from './type';
import {
  getDeviceType,
  getIPAddress,
  requestCameraPermission,
  requestMicrophonePermission,
  requestLocationPermission,
} from './utils';
import { saveSessionMetadata } from '../../services/api/sessionMetadata';
import { activateVerificationSession } from '../../services/api/verificationSessions';
import { useSessionRecording } from '../../services/sessionRecording/context';
import { storeLocation } from '../../utils/location';

export const useLanding = () => {
  const navigate = useNavigate();
  const params = useParams<{ temp_token?: string }>();
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const[showReadyModal, setShowReadyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const { startRecording } = useSessionRecording();

  // Extract temp_token from URL path parameter (e.g., /verify/abc123xyz)
  useEffect(() => {
    if (params.temp_token) {
      setTempToken(params.temp_token);
    }
  }, [params.temp_token]);

  const handleStartVerification = async () => {
    setShowPermissionsModal(true);
  };

  const handleCloseModal = () => {
    setShowPermissionsModal(false);
  };

  const handleConfirmPermissions = async () => {
    setShowPermissionsModal(false);
    setShowReadyModal(true);       
    setTimeout(() => {
      setShowReadyModal(false);
      navigate('/testing/session-recording');
    }, 2500);
  };

  return {
    handleStartVerification,
    showPermissionsModal,
    showReadyModal,
    handleCloseModal,
    handleConfirmPermissions,
    isLoading,
    activationError,
  };
};
