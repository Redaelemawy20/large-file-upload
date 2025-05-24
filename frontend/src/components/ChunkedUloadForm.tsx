import { useRef, useState } from 'react';
import Form from './Form';

const ChunkedUploadForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    'idle' | 'active' | 'success' | 'error' | 'paused'
  >('idle');
  const uploadStoppedRef = useRef(false);
  const [lastUploadedChunkIndex, setLastUploadedChunkIndex] = useState(-1);
  const [sessionInfo, setSessionInfo] = useState<{
    sessionId: string;
    chunkSize: number;
  } | null>(null);
  // abort controller state
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const handleSubmit = async (): Promise<void> => {
    if (!file) return;
    setFile(file);
    uploadStoppedRef.current = false;
    setUploadStatus('active');

    // If resuming, use the saved progress
    if (lastUploadedChunkIndex >= 0) {
      setUploadProgress(
        Math.round(
          (lastUploadedChunkIndex * 100) / Math.ceil(file.size / 1048576)
        )
      );
    } else {
      setUploadProgress(0);
    }

    try {
      // Start upload session or use existing one
      let sessionId = sessionInfo?.sessionId || '';
      let chunkSize = sessionInfo?.chunkSize || 0;

      if (lastUploadedChunkIndex < 0 || !sessionInfo) {
        const response = await fetch(
          'http://localhost:3000/api/upload/start-upload',
          {
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({
              filename: file.name,
              filesize: file.size,
            }),
          }
        );

        const data = await response.json();
        sessionId = data.sessionId;
        chunkSize = data.chunkSize;
        setSessionInfo({ sessionId, chunkSize });
      }

      let currentChunkIndex = lastUploadedChunkIndex + 1;

      if (sessionId && chunkSize) {
        for (
          let start = currentChunkIndex * chunkSize;
          start < file.size;
          start += chunkSize
        ) {
          if (uploadStoppedRef.current) {
            setUploadStatus('paused');
            return;
          }

          await uploadChunk(start, currentChunkIndex, sessionId, chunkSize);

          setLastUploadedChunkIndex(currentChunkIndex);
          currentChunkIndex++;
          setUploadProgress(Math.round((start * 100) / file.size));
        }
        setUploadProgress(100);
      }
      await completeUpload(sessionId);
      setUploadStatus('success');
      setLastUploadedChunkIndex(-1); // Reset after successful upload
      setSessionInfo(null); // Clear session info
    } catch (error) {
      // Handle upload errors
      console.error('Upload error:', error);
      if (!uploadStoppedRef.current) {
        setUploadStatus('error');
      } else {
        setUploadStatus('paused');
      }
    }
  };

  const uploadChunk = async (
    start: number,
    chunkIndex: number,
    sessionId: string,
    chunkSize: number
  ): Promise<void> => {
    if (!file) return;
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
      return data;
    } catch (error) {
      console.error('Chunk upload failed:', error);
      throw error;
    }
  };

  const completeUpload = async (sessionId: string) => {
    const response = await fetch(
      'http://localhost:3000/api/upload/complete-upload',
      {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          filename: file?.name || '',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    const data = await response.json();
    return data;
  };

  const stopUpload = () => {
    uploadStoppedRef.current = true;
    setUploadStatus('paused');
    if (abortController) {
      abortController.abort();
    }
  };

  const resumeUpload = () => {
    handleSubmit();
  };

  const isUploading = uploadStatus === 'active';
  const isPaused = uploadStatus === 'paused';

  return (
    <>
      <Form
        uploadProgress={uploadProgress}
        maxFileSize={10000000000} // 10GB
        maxFileFormat={10000000000} // 10GB
        onUpload={handleSubmit}
        uploadStatus={uploadStatus}
        setUploadStatus={setUploadStatus}
        file={file}
        setFile={setFile}
      />
      {isUploading && (
        <button
          className="bg-accent text-white p-2 mt-4 rounded-md"
          onClick={stopUpload}
        >
          Stop Upload
        </button>
      )}
      {isPaused && (
        <button
          className="bg-green-500 text-white p-2 mt-4 rounded-md"
          onClick={resumeUpload}
        >
          Resume Upload
        </button>
      )}
    </>
  );
};

export default ChunkedUploadForm;
