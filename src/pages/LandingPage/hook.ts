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

export const useLanding = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('session_id', sessionId);
    } else {
      alert('No session found. Please use a valid verification link.');
    }
  }, [sessionId]);

  const handleStartVerification = () => {
    if (!sessionId) {
      alert('No session ID found. Please use a valid verification link.');
      return;
    }
    setShowPermissionsModal(true);
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
        // Store location in localStorage for reuse in other pages
        localStorage.setItem('user_latitude', locationResult.latitude.toString());
        localStorage.setItem('user_longitude', locationResult.longitude.toString());
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
        sessionUid: sessionId!,
        ...metadata,
      });

      if (response.success) {
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
