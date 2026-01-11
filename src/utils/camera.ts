/**
 * Capture full photo from video element and convert to Blob
 * @param video - Video element to capture from
 * @returns Promise that resolves to a Blob representing the captured image
 */
export const capturePhotoFromVideo = (video: HTMLVideoElement): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Draw the entire video frame
  ctx.drawImage(video, 0, 0);

  // Convert canvas to Blob instead of base64
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to capture image'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
};
