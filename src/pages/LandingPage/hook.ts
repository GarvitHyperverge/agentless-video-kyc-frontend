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
import { storeLocation } from '../../utils/location';

export const useLanding = () => {
  const navigate = useNavigate();
  const params = useParams<{ temp_token?: string }>();
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showReadyModal, setShowReadyModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);

  // Extract temp_token from URL path parameter (e.g., /verify/abc123xyz)
  useEffect(() => {
    if (params.temp_token) {
      setTempToken(params.temp_token);
    }
  }, [params.temp_token]);

  const handleStartVerification = async () => {
    // If temp_token exists, activate the session first
    if (tempToken) {
      setIsLoading(true);
      setActivationError(null);

      try {
        // Call the activation endpoint with temp_token
        const response = await activateVerificationSession({
          temp_token: tempToken,
        });

        if (response.success) {
          // Cookie is now set - proceed with permissions modal
          setTempToken(null); // Clear temp_token after successful activation
          setShowPermissionsModal(true);
        } else {
          setActivationError('Failed to activate verification session. Please try again.');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to activate verification session. Please try again.';
        setActivationError(errorMessage);
        console.error('Activation error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // No temp_token - assume cookie is already set (legacy /verify route)
      setShowPermissionsModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowPermissionsModal(false);
  };

  const handleConfirmPermissions = async () => {
    setIsLoading(true);

    try {
      let locationResult: { latitude: number; longitude: number };
      let ipAddress: string;

      try {
        locationResult = await requestLocationPermission();
      } catch (error) {
        alert('Location access is required to proceed with verification. Please enable location access and try again.');
        setIsLoading(false);
        return;
      }

      try {
        ipAddress = await getIPAddress();
      } catch (error) {
        alert('Unable to retrieve IP address. Please check your internet connection and try again.');
        setIsLoading(false);
        return;
      }

      // Request camera and microphone permissions
      const cameraPermission = await requestCameraPermission();
      const microphonePermission = await requestMicrophonePermission();

      const metadata: SessionMetadata = {
        latitude: locationResult.latitude,
        longitude: locationResult.longitude,
        cameraPermission,
        microphonePermission,
        locationPermission: true,
        ipAddress,
        deviceType: getDeviceType(),
      };

      // Store location for watermarking
      storeLocation(locationResult.latitude, locationResult.longitude);

      // Update existing verification session with metadata
      // Cookie is already set and automatically sent with credentials: 'include'
      const response = await saveSessionMetadata(metadata);

      if (response.success) {
        setShowPermissionsModal(false);
        setShowReadyModal(true);       
        setTimeout(() => {
          setShowReadyModal(false);
          navigate('/verify/session-recording');
        }, 2500);
      } else {
        console.log(response);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
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
