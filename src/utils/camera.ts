/**
 * Simple utility to capture full photo from video element
 * @param video - Video element to capture from
 * @returns Base64 encoded image string
 */
export const capturePhotoFromVideo = (video: HTMLVideoElement): string => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Draw the entire video frame
  ctx.drawImage(video, 0, 0);

  return canvas.toDataURL('image/jpeg', 0.9);
};
