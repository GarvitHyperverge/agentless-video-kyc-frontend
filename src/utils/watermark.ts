/**
 * Watermark an image with timestamp and location data
 * @param imageBlob - Image blob to watermark
 * @param timestamp - Unix timestamp in seconds
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Watermarked image blob
 */
export const watermarkImage = async (
  imageBlob: Blob,
  timestamp: number,
  latitude: number,
  longitude: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Step 1: Create image element and object URL to load the blob
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);

    // Step 2: Wait for image to load, then process
    img.onload = () => {
      try {
        // Step 3: Clean up object URL (no longer needed after image loads)
        URL.revokeObjectURL(url);

        // Step 4: Create canvas matching image dimensions
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        // Step 5: Get 2D drawing context
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Step 6: Draw original image onto canvas (base layer)
        ctx.drawImage(img, 0, 0);

        // Step 7: Format timestamp, location, date, and time into watermark text
        const date = new Date(timestamp * 1000);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        
        const locationStr = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
        const dateStr = `${day}-${month}-${year}`;
        const timeStr = `${hours}:${minutes}:${seconds}`;
        const watermarkText = `${locationStr} | ${dateStr} | ${timeStr}`;

        console.log('Applying watermark:', watermarkText);

        // Step 8: Configure text style (white fill, black stroke for visibility)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        // Scale font size based on image dimensions for better visibility
        const fontSize = Math.max(16, Math.min(img.width, img.height) / 30);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.lineWidth = Math.max(2, fontSize / 8);

        // Step 9: Calculate position (bottom right with padding)
        const padding = Math.max(10, fontSize / 2);
        const x = canvas.width - padding;
        const y = canvas.height - padding;

        // Step 10: Draw watermark text (stroke first, then fill for contrast)
        ctx.strokeText(watermarkText, x, y);
        ctx.fillText(watermarkText, x, y);

        console.log('Watermark drawn at:', { x, y, fontSize, text: watermarkText });

        // Step 11: Convert canvas (image + watermark) to JPEG blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log('Watermarked image created:', { size: blob.size, width: canvas.width, height: canvas.height });
              resolve(blob);
            } else {
              reject(new Error('Failed to create watermarked image'));
            }
          },
          'image/jpeg',
          0.9
        );
      } catch (error) {
        console.error('Error in watermarkImage onload:', error);
        reject(error instanceof Error ? error : new Error('Failed to watermark image'));
      }
    };

    // Handle image loading errors
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      console.error('Failed to load image for watermarking:', error);
      reject(new Error('Failed to load image for watermarking'));
    };

    // Step 2: Start loading image from object URL
    img.src = url;
  });
};

/**
 * Watermark a live video stream in real-time
 * Takes a MediaStream, adds watermark to each frame, preserves audio, returns watermarked stream
 * 
 * @param stream - Original video stream (with video and optionally audio tracks)
 * @param timestamp - Unix timestamp in seconds
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Watermarked MediaStream with original audio preserved
 */
export const watermarkStream = (
  stream: MediaStream,
  timestamp: number,
  latitude: number,
  longitude: number
): MediaStream => {
  // Get video track from original stream
  const videoTrack = stream.getVideoTracks()[0];
  if (!videoTrack) {
    throw new Error('No video track found in stream');
  }

  // Get audio tracks from original stream (preserve all audio tracks)
  const audioTracks = stream.getAudioTracks();

  // Create video element to display the stream
  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  video.playsInline = true;
  video.muted = true; // Mute to prevent audio feedback loop

  // Create canvas to draw watermarked frames
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Create watermark text
  const date = new Date(timestamp * 1000);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  
  const locationStr = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  const dateStr = `${day}-${month}-${year}`;
  const timeStr = `${hours}:${minutes}:${seconds}`;
  const watermarkText = `${locationStr} | ${dateStr} | ${timeStr}`;

  // Setup watermark style
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.lineWidth = 3;

  // Initialize canvas dimensions (will be updated when metadata loads)
  let isDrawing = false;

  // Draw function that runs continuously
  const drawFrame = () => {
    if (video.readyState >= 2 && canvas.width > 0 && canvas.height > 0) {
      // Draw current video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Calculate watermark position
      const x = canvas.width - 15;
      const y = canvas.height - 15;
      
      // Draw watermark
      ctx.strokeText(watermarkText, x, y);
      ctx.fillText(watermarkText, x, y);
    }
    
    // Continue drawing frames
    if (isDrawing) {
      requestAnimationFrame(drawFrame);
    }
  };

  // Start drawing frames once video metadata is loaded and playing
  video.onloadedmetadata = async () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Ensure video plays (required for frames to be available)
    try {
      await video.play();
    } catch (err) {
      console.warn('Video autoplay failed, trying to play:', err);
      // If autoplay fails, try playing on user interaction
      // For now, we'll continue - the stream should still work
    }
    
    if (!isDrawing) {
      isDrawing = true;
      drawFrame();
    }
  };

  // Capture canvas as video stream (watermarked video)
  const canvasStream = canvas.captureStream(30); // 30 FPS for smooth video
  const watermarkedVideoTrack = canvasStream.getVideoTracks()[0];

  // Combine watermarked video track with original audio tracks
  const combinedStream = new MediaStream([
    watermarkedVideoTrack,
    ...audioTracks,
  ]);

  // Cleanup function to stop video when stream ends
  const originalStop = watermarkedVideoTrack.stop.bind(watermarkedVideoTrack);
  watermarkedVideoTrack.stop = () => {
    video.srcObject = null;
    originalStop();
  };

  return combinedStream;
};