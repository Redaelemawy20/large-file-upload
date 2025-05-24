import { useRef, useState } from 'react';
import Form from './Form';

const ChunkedUploadForm = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'active' | 'success' | 'error' | 'paused'
  >('idle');
  const uploadStoppedRef = useRef(false);
  // abort controller state
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const handleSubmit = async (file: File) => {
    if (!file) return;
    uploadStoppedRef.current = false;
    setUploadStatus('active');
    setUploadProgress(0);

    let sessionId = '';
    let chunkSize = 0;
    // console.log('chunked submit', file);

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
      // console.log(data);
      sessionId = data.sessionId;
      chunkSize = data.chunkSize;
      let currentChunkIndex = 0;
      if (sessionId && chunkSize) {
        for (let start = 0; start < file.size; start += chunkSize) {
          if (uploadStoppedRef.current) {
            // console.log('uploadStopped', uploadStoppedRef.current);
            setUploadStatus('paused');
            return;
          }
          // console.log('start', start);

          await uploadChunk(
            file,
            sessionId,
            start,
            chunkSize,
            currentChunkIndex
          );
          currentChunkIndex++;
          setUploadProgress(Math.round((start * 100) / file.size));
        }
        setUploadProgress(100);
      }
      await completeUpload(sessionId, file.name);
      setUploadStatus('success');
    } catch (_error) {
      // Handle upload errors
      if (!uploadStoppedRef.current) {
        setUploadStatus('error');
      } else {
        setUploadStatus('paused');
      }
    }
  };

  const uploadChunk = async (
    file: File,
    sessionId: string,
    start: number,
    chunkSize: number,
    chunkIndex: number
  ): Promise<void> => {
    // console.log(
    //   `Uploading chunk from ${start} to ${
    //     start + chunkSize
    //   } for session ${sessionId}`
    // );
    const abortController = new AbortController();
    setAbortController(abortController);
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
        signal: abortController.signal,
      });

      const data = await res.json();
      // console.log('Chunk upload response:', data);
      return data;
    } catch (error) {
      console.error('Chunk upload failed:', error);
      throw error; // Optional: Let the caller handle retries or errors
    }
  };
  const completeUpload = async (sessionId: string, filename: string) => {
    const response = await fetch(
      'http://localhost:3000/api/upload/complete-upload',
      {
        method: 'POST',
        body: JSON.stringify({ sessionId, filename }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await response.json();
    // console.log('Upload complete:', data);
    return data;
  };
  const stopUpload = () => {
    uploadStoppedRef.current = true;
    setUploadStatus('paused');
    if (abortController) {
      abortController.abort();
    }
  };

  const isUploading = uploadStatus === 'active';

  return (
    <>
      {uploadStoppedRef.current && <div>Upload stopped</div>}
      <Form
        uploadProgress={uploadProgress}
        maxFileSize={10000000000} // 10GB
        maxFileFormat={10000000000} // 10GB
        onUpload={handleSubmit}
        uploadStatus={uploadStatus}
        setUploadStatus={setUploadStatus}
      />
      {isUploading && (
        <button
          className="bg-accent text-white p-2 mt-4 rounded-md"
          onClick={stopUpload}
        >
          Stop Upload
        </button>
      )}
    </>
  );
};

export default ChunkedUploadForm;
