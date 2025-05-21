import { useState } from 'react';
import Form from './Form';
const ChunkedUploadForm = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSubmit = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    let sessionId = '';
    let chunkSize = 0;
    console.log('chunked submit', file);

    try {
      // Start upload session
      const response = await fetch(
        'http://localhost:3000/api/upload/start-upload',
        {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({ filename: file.name, filesize: file.size }),
        }
      );

      const data = await response.json();
      console.log(data);
      sessionId = data.sessionId;
      chunkSize = data.chunkSize;
      let chunkIndex = 0;
      // Here, implement chunk upload logic using sessionId and chunkSize
      // This is just a placeholder to demonstrate using the variables
      if (sessionId && chunkSize) {
        for (let start = 0; start < file.size; start += chunkSize) {
          await uploadChunk(file, sessionId, start, chunkSize, chunkIndex);
          chunkIndex++;
        }

        // Update progress for demo purposes
        setUploadProgress(100);
      }

      setUploading(false);
    } catch (error) {
      console.error('Error during chunked upload:', error);
      setUploading(false);
    }
  };

  const uploadChunk = async (
    file: File,
    sessionId: string,
    start: number,
    chunkSize: number,
    chunkIndex: number
  ): Promise<void> => {
    console.log(
      `Uploading chunk from ${start} to ${
        start + chunkSize
      } for session ${sessionId}`
    );

    const end = Math.min(start + chunkSize, file.size);
    const chunkToUpload = file.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunkToUpload);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('sessionId', sessionId);

    try {
      const res = await fetch('http://localhost:3000/api/upload/upload-chunk', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log('Chunk upload response:', data);
      return data;
    } catch (error) {
      console.error('Chunk upload failed:', error);
      throw error; // Optional: Let the caller handle retries or errors
    }
  };

  return (
    <Form
      uploading={uploading}
      uploadProgress={uploadProgress}
      maxFileSize={10000000000} // 10GB
      maxFileFormat={10000000000} // 10GB
      onUpload={handleSubmit}
    />
  );
};

export default ChunkedUploadForm;
