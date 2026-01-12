/**
 * Attaches a MediaStream to a video element and sets up ready callback
 * @param videoElement - HTML video element to attach stream to
 * @param stream - MediaStream to attach
 * @param onReady - Callback when stream metadata is loaded
 */
export const attachStreamToVideo = (
  videoElement: HTMLVideoElement | null,
  stream: MediaStream | null,
  onReady?: () => void
): void => {
  if (!videoElement || !stream) return;

  videoElement.srcObject = stream;
  if (onReady) {
    videoElement.onloadedmetadata = () => {
      onReady();
    };
  }
};
