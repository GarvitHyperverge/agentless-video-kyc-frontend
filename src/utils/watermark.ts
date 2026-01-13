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
 * Watermark a video by extracting frames and adding watermark
 * Note: This processes the video frame by frame. For long videos, consider server-side processing
 * @param videoBlob - Video blob to watermark
 * @param timestamp - Unix timestamp in seconds
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Watermarked video blob
 */
export const watermarkVideo = async (
  videoBlob: Blob,
  timestamp: number,
  latitude: number,
  longitude: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(videoBlob);

    let mediaRecorder: MediaRecorder | null = null;
    const chunks: Blob[] = [];
    let animationFrameId: number | null = null;

    const cleanup = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      URL.revokeObjectURL(url);
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try {
          mediaRecorder.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };

    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        cleanup();
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Prepare watermark text
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

      // Set watermark style
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.lineWidth = 3;

      const padding = 15;
      const x = canvas.width - padding;
      const y = canvas.height - padding;

      // Create MediaRecorder to capture watermarked frames
      try {
        // Use lower FPS for watermarking to reduce processing time (15 FPS is usually sufficient)
        const stream = canvas.captureStream(15); // 15 FPS for faster processing
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9,opus',
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          cleanup();
          const watermarkedBlob = new Blob(chunks, { type: 'video/webm' });
          resolve(watermarkedBlob);
        };

        mediaRecorder.onerror = () => {
          cleanup();
          reject(new Error('Failed to watermark video'));
        };

        // Start recording with larger timeslice for better performance
        mediaRecorder.start(200); // Collect data every 200ms for better performance
      } catch (err) {
        cleanup();
        reject(new Error('Failed to initialize video watermarking'));
        return;
      }

      // Draw frames with watermark
      const drawFrame = () => {
        if (video.ended || video.paused || !mediaRecorder || mediaRecorder.state === 'inactive') {
          if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
          return;
        }

        // Draw video frame
        ctx.drawImage(video, 0, 0);

        // Draw watermark
        ctx.strokeText(watermarkText, x, y);
        ctx.fillText(watermarkText, x, y);

        animationFrameId = requestAnimationFrame(drawFrame);
      };

      video.onplay = () => {
        drawFrame();
      };

      video.onended = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      };

      video.play().catch(() => {
        cleanup();
        reject(new Error('Failed to play video for watermarking'));
      });
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Failed to load video for watermarking'));
    };

    video.src = url;
    video.load();
  });
};
