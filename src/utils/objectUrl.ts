/**
 * Creates an object URL from a Blob or File
 * @param blob - Blob or File to create URL from
 * @returns Object URL string
 */
export const createObjectUrl = (blob: Blob | File): string => {
  return URL.createObjectURL(blob);
};

/**
 * Revokes an object URL to free memory
 * @param url - Object URL to revoke
 */
export const revokeObjectUrl = (url: string | null): void => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};
