import { useState } from 'react';
import Form from './Form';

const SmallFileUploadForm = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Maximum file size - 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const MAX_FILE_SIZE_FORMATTED = '10MB';

  // Handle the file upload
  const handleUpload = async (file: File): Promise<void> => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://localhost:3000/api/upload');

      // Track progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Return a promise that resolves when the upload completes
      await new Promise<void>((resolve, reject) => {
        // Handle response
        xhr.onload = () => {
          setUploading(false);

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const response = JSON.parse(xhr.responseText);
              reject(new Error(response.error || 'Upload failed'));
            } catch {
              reject(new Error('Upload failed'));
            }
          }
        };

        // Handle network errors
        xhr.onerror = () => {
          setUploading(false);
          reject(new Error('Network error'));
        };

        xhr.send(formData);
      });
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
    }
  };

  return (
    <Form
      uploading={uploading}
      uploadProgress={uploadProgress}
      maxFileSize={MAX_FILE_SIZE}
      maxFileFormat={MAX_FILE_SIZE_FORMATTED as unknown as number}
      onUpload={handleUpload}
    />
  );
};

export default SmallFileUploadForm;
