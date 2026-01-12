/**
 * Creates FormData for file upload with session ID
 * @param sessionId - Session ID to include
 * @param fields - Additional fields to append (key-value pairs)
 * @returns FormData instance
 */
export const createUploadFormData = (
  sessionId: string,
  fields: Record<string, string | File | Blob>
): FormData => {
  const formData = new FormData();
  formData.append('session_id', sessionId);
  
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  return formData;
};
