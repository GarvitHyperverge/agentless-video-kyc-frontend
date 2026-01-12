import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SessionMetadata } from './type';
import {
  getDeviceType,
  getIPAddress,
  requestCameraPermission,
  requestMicrophonePermission,
  requestLocationPermission,
} from './utils';
import { saveSessionMetadata } from '../../services/api/sessionMetadata';
import { useSessionRecording } from '../../services/sessionRecording/context';
import { setToken, validateSession } from '../../utils/session';

export const useLanding = () => {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { startRecording } = useSessionRecording();

  useEffect(() => {
    if (token) {
      setToken(token);
    } else {
      alert('No token found. Please use a valid verification link.');
    }
  }, [token]);

  const handleStartVerification = () => {
    try {
      validateSession();
      setShowPermissionsModal(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No session ID found. Please use a valid verification link.');
    }
  };

  const handleCloseModal = () => {
    setShowPermissionsModal(false);
  };

  const handleConfirmPermissions = async () => {
    setIsLoading(true);

    try {
      // Request mandatory permissions first (location and IP)
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
      const [cameraPermission, microphonePermission] = await Promise.all([
        requestCameraPermission(),
        requestMicrophonePermission(),
      ]);

      const metadata: SessionMetadata = {
        latitude: locationResult.latitude,
        longitude: locationResult.longitude,
        cameraPermission,
        microphonePermission,
        locationPermission: true,
        ipAddress,
        deviceType: getDeviceType(),
      };

      // Call API to save session metadata
      const response = await saveSessionMetadata({
        token: token!,
        ...metadata,
      });

      if (response.success) {
        // Start the shared stream after permissions are granted
        try {
          await startRecording();
          console.log('Shared stream started from LandingPage');
        } catch (err) {
          console.warn('Could not start shared stream:', err);
          // Continue anyway, stream will be started on PanPage
        }
        
        setShowPermissionsModal(false);
        navigate('/verify/pan');
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
    handleCloseModal,
    handleConfirmPermissions,
    isLoading,
  };
};
