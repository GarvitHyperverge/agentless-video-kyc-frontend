import fixWebmDuration from 'webm-duration-fix';

/**
 * Fixes WebM video duration metadata using webm-duration-fix
 * 
 * PROBLEM: MediaRecorder sometimes doesn't write duration correctly, causing:
 * - Duration showing as Infinity or NaN
 * - Playback issues (can't seek, progress bar broken)
 * - Video appears to have no end
 * 
 * SOLUTION: This function:
 * - Reads the WebM file structure (EBML format)
 * - Calculates actual duration from frame timestamps
 * - Rebuilds metadata with correct duration and cue points
 * - Preserves all video/audio data (only metadata changes)
 * 
 * Uses webm-duration-fix library which is designed for modern bundlers
 * and avoids the bundling issues that ts-ebml has with Vite/Webpack.
 * 
 * @param blob - WebM video blob with potentially incorrect duration metadata
 * @returns Promise that resolves to a new blob with corrected duration metadata
 */
export const fixWebMDuration = async (blob: Blob): Promise<Blob> => {
  // Validate blob
  if (!blob || blob.size === 0) {
    throw new Error('Invalid blob: blob is empty or null');
  }
  
  if (blob.type !== 'video/webm' && !blob.type.includes('webm')) {
    console.warn('Blob type is not video/webm:', blob.type);
    // Continue anyway as type might not be set correctly
  }
  
  // webm-duration-fix handles all the EBML processing internally
  // It calculates duration from frames and adds correct metadata + cue points
  // This returns a new Blob with correct duration metadata
  try {
    const fixedBlob = await fixWebmDuration(blob);
    return fixedBlob;
  } catch (error) {
    throw new Error(`Failed to fix WebM duration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
