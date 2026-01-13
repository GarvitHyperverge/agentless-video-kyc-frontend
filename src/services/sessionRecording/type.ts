export interface SessionRecordingContextType {
    isSessionRecording: boolean;
    recordingStream: MediaStream | null;
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<Blob | null>;
    uploadRecording: () => Promise<boolean>;
    getSharedStream: () => MediaStream | null;
  }
  