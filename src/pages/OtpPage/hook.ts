import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecordingStatus } from './type';
import { generateOtp, blobToBase64 } from './utils';
import { uploadOtpVideo } from '../../services/api/otpVideo';

export const useOtpPage = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState<string>('');
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate OTP and check session on mount
  useEffect(() => {
    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      alert('Session not found. Please start the verification process again.');
      navigate('/');
      return;
    }
    setOtp(generateOtp());
  }, [navigate]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
      setError(null);
    } catch (err) {
      setError('Unable to access camera and microphone. Please ensure permissions are granted.');
      console.error('Camera error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      setError('Camera not available. Please refresh and try again.');
      return;
    }

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoBlob(blob);
      setVideoUrl(url);
      setRecordingStatus('recorded');
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(100); // Collect data every 100ms
    setRecordingStatus('recording');
    setRecordingTime(0);

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingStatus === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [recordingStatus]);

  const retakeVideo = useCallback(async () => {
    // Clean up old video URL
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoBlob(null);
    setVideoUrl(null);
    setRecordingTime(0);
    setError(null);

    // Always restart camera to ensure fresh connection
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    
    setIsCameraReady(false);
    setRecordingStatus('idle');
    
    // Start fresh camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      
      // Wait for next frame to ensure video element is in DOM
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            setIsCameraReady(true);
          };
          videoRef.current.play().catch(console.error);
        }
      });
    } catch (err) {
      setError('Unable to restart camera. Please refresh and try again.');
      console.error('Camera restart error:', err);
    }
  }, [videoUrl]);

  const regenerateOtp = useCallback(async () => {
    setOtp(generateOtp());
    await retakeVideo();
  }, [retakeVideo]);

  const handleContinue = async () => {
    if (!videoBlob) {
      setError('Please record a video reading the OTP');
      return;
    }

    const sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      setError('Session not found. Please start the verification process again.');
      return;
    }

    setIsProcessing(true);
    setRecordingStatus('uploading');
    setError(null);

    try {
      // Convert video blob to base64
      const videoBase64 = await blobToBase64(videoBlob);

      // Upload to backend
      const response = await uploadOtpVideo({
        sessionId,
        otp,
        video: videoBase64,
      });

      if (response.success) {
        // Store video path in session storage
        sessionStorage.setItem('otp_video', JSON.stringify({
          sessionId,
          otp,
          videoPath: response.data.videoPath,
        }));

        // Stop camera before navigating
        stopCamera();
        navigate('/verification');
      } else {
        setError(response.message || 'Failed to upload video');
        setRecordingStatus('recorded');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload video. Please try again.');
      setRecordingStatus('recorded');
    } finally {
      setIsProcessing(false);
    }
  };

  const canContinue = recordingStatus === 'recorded' && videoBlob !== null;

  return {
    otp,
    recordingStatus,
    videoUrl,
    recordingTime,
    isProcessing,
    error,
    isCameraReady,
    videoRef,
    previewVideoRef,
    startRecording,
    stopRecording,
    retakeVideo,
    regenerateOtp,
    handleContinue,
    canContinue,
  };
};
