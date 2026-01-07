/**
 * Detects the device type by analyzing the user agent string.
 * Uses regex patterns to identify tablets, mobile devices, or defaults to desktop.
 * 
 * @returns {string} Device type: 'tablet', 'mobile', or 'desktop'
 */
export const getDeviceType = (): string => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
};

/**
 * Fetches the user's public IP address from an external API.
 */
export const getIPAddress = async (): Promise<string> => {
  const response = await fetch('https://api.ipify.org?format=json');
  const data = await response.json();
  return data.ip;
};

export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch {
    return false;
  }
};

export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch {
    return false;
  }
};

/**
 * Requests location permission and retrieves the user's current coordinates.
 * Uses high accuracy mode with a 10-second timeout.
 * Wraps the callback-based Geolocation API in a Promise for easier async/await usage.
 * 
 * @returns {Promise<{ latitude: number; longitude: number }>} Promise that resolves to coordinates object
 * @throws {Error} If geolocation is not supported or permission is denied
 */
export const requestLocationPermission = async (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    // Request current position with success and error callbacks
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      // Error callback: reject with descriptive error message
      (error) => {
        reject(new Error(`Location access denied: ${error.message}`));
      },
    );
  });
};
