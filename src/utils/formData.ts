/**
 * Creates FormData for file upload with token
 * @param token - Token to include
 * @param fields - Additional fields to append (key-value pairs)
 * @returns FormData instance
 */
export const createUploadFormData = (
  token: string,
  fields: Record<string, string | File | Blob>
): FormData => {
  const formData = new FormData();
  formData.append('token', token);
  
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  return formData;
};
