import fixWebmDuration from 'webm-duration-fix';

/**
 * Fixes WebM video duration metadata using webm-duration-fix 
 * @param blob - WebM video blob with potentially incorrect duration metadata
 * @returns Promise that resolves to a new blob with corrected duration metadata
 */
export const fixWebMDuration = async (blob: Blob): Promise<Blob> => {
  // Validate blob
  if (!blob || blob.size === 0) {
    throw new Error('Invalid blob: blob is empty or null');
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
