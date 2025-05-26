import { useState } from 'react';
import Form from './Form';
import type { UploadStatus } from '../types';

const SmallFileUploadForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Maximum file size - 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024;

  // Handle the file upload
  const handleUpload = async (): Promise<void> => {
    if (!file) return;

    setUploadStatus('active');
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
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadStatus('success');
            setUploadProgress(100);
            setTimeout(() => {
              setFile(null);
              setUploadProgress(0);
              setUploadStatus('idle');
            }, 1500);
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
          setUploadStatus('error');
          reject(new Error('Network error'));
        };

        xhr.send(formData);
      });
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-4 text-sm text-gray-600">
        <p>Use this form to upload files smaller than 10MB.</p>
      </div>

      <Form
        uploadProgress={uploadProgress}
        maxFileSize={MAX_FILE_SIZE}
        maxFileFormat={MAX_FILE_SIZE}
        onUpload={handleUpload}
        uploadStatus={uploadStatus}
        setUploadStatus={setUploadStatus}
        file={file}
        setFile={setFile}
      />
    </div>
  );
};

export default SmallFileUploadForm;
