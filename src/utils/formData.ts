/**
 * Creates FormData for file upload
 * @param fields - Fields to append (key-value pairs)
 * @returns FormData instance
 */
export const createUploadFormData = (
  fields: Record<string, string | File | Blob>
): FormData => {
  const formData = new FormData();
  
  Object.entries(fields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  return formData;
};
