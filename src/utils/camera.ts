/**
 * Utility functions for camera operations
 */

/**
 * Stop all tracks in a media stream and release resources
 * @param stream - MediaStream to stop
 */
export const stopMediaStream = (stream: MediaStream | null) => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
};

/**
 * Capture photo from video element with cropping
 * @param video - Video element to capture from
 * @param cropOptions - Optional cropping coordinates and output size
 * @returns Base64 encoded image string
 */
export interface CropOptions {
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  outputWidth?: number;
  outputHeight?: number;
  quality?: number; // JPEG quality 0-1
}

export const capturePhotoFromVideo = (
  video: HTMLVideoElement,
  cropOptions?: CropOptions
): string => {
  const videoNaturalWidth = video.videoWidth;
  const videoNaturalHeight = video.videoHeight;
  const displayWidth = video.clientWidth;
  const displayHeight = video.clientHeight;

  // Calculate object-cover scaling
  const videoAspect = videoNaturalWidth / videoNaturalHeight;
  const displayAspect = displayWidth / displayHeight;

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  if (videoAspect > displayAspect) {
    // Video is wider - height fits, width is cropped
    scale = videoNaturalHeight / displayHeight;
    offsetX = (videoNaturalWidth - displayWidth * scale) / 2;
  } else {
    // Video is taller - width fits, height is cropped
    scale = videoNaturalWidth / displayWidth;
    offsetY = (videoNaturalHeight - displayHeight * scale) / 2;
  }

  // Use provided crop options or use full video
  const cropX = cropOptions?.cropX ?? offsetX;
  const cropY = cropOptions?.cropY ?? offsetY;
  const cropWidth = cropOptions?.cropWidth ?? videoNaturalWidth - offsetX * 2;
  const cropHeight = cropOptions?.cropHeight ?? videoNaturalHeight - offsetY * 2;

  // Output dimensions
  const outputWidth = cropOptions?.outputWidth ?? Math.min(cropWidth, 1200);
  const outputHeight = cropOptions?.outputHeight ?? (outputWidth * (cropHeight / cropWidth));

  // Create canvas and draw
  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.drawImage(
    video,
    cropX, cropY, cropWidth, cropHeight,
    0, 0, outputWidth, outputHeight
  );

  const quality = cropOptions?.quality ?? 0.9;
  return canvas.toDataURL('image/jpeg', quality);
};
