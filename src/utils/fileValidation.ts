/**
 * Validates file size
 * @param file - File or Blob to validate
 * @param maxSizeBytes - Maximum file size in bytes
 * @param fileType - Type of file for error message (e.g., 'Image', 'Video')
 * @throws Error if file is too large or empty
 */
export const validateFileSize = (
  file: File | Blob,
  maxSizeBytes: number,
  fileType: string = 'File'
): void => {
  if (file.size === 0) {
    throw new Error(`${fileType} file is empty`);
  }

  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / 1024 / 1024).toFixed(2);
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    throw new Error(
      `${fileType} file too large: ${fileSizeMB}MB. Maximum size is ${maxSizeMB}MB.`
    );
  }
};
