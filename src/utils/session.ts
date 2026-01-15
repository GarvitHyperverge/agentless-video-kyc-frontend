/**
 * DEPRECATED: Token functions are no longer used
 * 
 * We no longer store tokens in localStorage. Instead:
 * - API authentication uses HTTP-only cookies (set by backend)
 * - Watermarking uses Date.now() for timestamps (no JWT needed)
 * 
 * These functions are kept for backwards compatibility but are not used in the codebase.
 */

/**
 * @deprecated No longer used - tokens are not stored in localStorage
 */
export const getToken = (): string | null => {
  return null;
};

/**
 * @deprecated No longer used - tokens are not stored in localStorage
 */
export const setToken = (token: string): void => {
  // No-op: tokens are not stored anymore
};

/**
 * @deprecated No longer used - session validation is done via cookie
 */
export const validateSession = (): boolean => {
  // Always returns false - use cookie-based validation instead
  return false;
};
