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

  // Convert canvas to Blob 
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

/**
 * Capture cropped photo from video element based on overlay guide area
 * @param video - Video element to capture from
 * @param overlayElement - The overlay guide element to calculate crop area from
 * @returns Promise that resolves to a Blob representing the cropped image
 */
export const captureCroppedPhotoFromVideo = (
  video: HTMLVideoElement,
  overlayElement: HTMLElement
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  const videoRect = video.getBoundingClientRect();
  const overlayRect = overlayElement.getBoundingClientRect();

  // Calculate the crop area relative to the video element
  const scaleX = video.videoWidth / videoRect.width;
  const scaleY = video.videoHeight / videoRect.height;

  // Calculate overlay position relative to video
  const cropX = (overlayRect.left - videoRect.left) * scaleX;
  const cropY = (overlayRect.top - videoRect.top) * scaleY;
  const cropWidth = overlayRect.width * scaleX;
  const cropHeight = overlayRect.height * scaleY;

  // Set canvas to crop dimensions
  canvas.width = cropWidth;
  canvas.height = cropHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Draw only the cropped area from the video
  ctx.drawImage(
    video,
    cropX, cropY, cropWidth, cropHeight, // Source rectangle
    0, 0, cropWidth, cropHeight // Destination rectangle
  );

  // Convert canvas to Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to capture cropped image'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
};
