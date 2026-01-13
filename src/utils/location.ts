/**
 * Store location data in sessionStorage for watermarking
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 */
export const storeLocation = (latitude: number, longitude: number): void => {
  sessionStorage.setItem('watermark_latitude', latitude.toString());
  sessionStorage.setItem('watermark_longitude', longitude.toString());
};

/**
 * Get stored location data from sessionStorage
 * @returns Location coordinates or null if not found
 */
export const getStoredLocation = (): { latitude: number; longitude: number } | null => {
  const lat = sessionStorage.getItem('watermark_latitude');
  const lng = sessionStorage.getItem('watermark_longitude');

  if (lat && lng) {
    return {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
    };
  }

  return null;
};
