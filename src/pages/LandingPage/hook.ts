import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { storeLocation } from '../../utils/location';

export const useLanding = () => {
  const navigate = useNavigate();
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { startRecording } = useSessionRecording();

  const handleStartVerification = () => {
    // Cookie is already set when user visits /verify
    // Verification session already exists - we just need to update it with metadata
    setShowPermissionsModal(true);
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
