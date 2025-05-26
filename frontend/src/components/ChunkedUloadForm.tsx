import { useRef, useState } from 'react';
import Form from './Form';
import * as api from '../services/api';
import type { UploadStatus } from '../types';
import UploadingControls from './UploadingControls';

const ChunkedUploadForm = () => {
  // Internal state for the component
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const uploadStoppedRef = useRef(false);
  const [lastUploadedChunkIndex, setLastUploadedChunkIndex] = useState(-1);
  const [sessionInfo, setSessionInfo] = useState<{
    sessionId: string;
    chunkSize: number;
  } | null>(null);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const handleSubmit = async (): Promise<void> => {
    if (!file) return;

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
        const response = await api.startUpload(file);
        sessionId = response.sessionId;
        chunkSize = response.chunkSize;
        setSessionInfo({ sessionId, chunkSize });
      }

      let currentChunkIndex = lastUploadedChunkIndex + 1;
      const totalChunks = Math.ceil(file.size / chunkSize);

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

          // Log progress
          console.log(
            `Uploading chunk ${currentChunkIndex + 1}/${totalChunks}`
          );

          await uploadChunk(start, currentChunkIndex, sessionId, chunkSize);

          // Update progress
          const currentProgress = Math.round((start * 100) / file.size);
          setUploadProgress(currentProgress);

          setLastUploadedChunkIndex(currentChunkIndex);
          currentChunkIndex++;
        }

        // Upload complete
        setUploadProgress(100);
      }

      // Complete the upload
      await api.completeUpload(sessionId, file.name);
      setUploadStatus('success');

      // Reset state
      setTimeout(() => {
        setFile(null);
        setLastUploadedChunkIndex(-1);
        setSessionInfo(null);
        setUploadProgress(0);
      }, 1500);
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
    const newAbortController = new AbortController();
    setAbortController(newAbortController);
    const end = Math.min(start + chunkSize, file.size);
    const chunkToUpload = file.slice(start, end);

    // Update progress for this chunk start
    const startProgress = Math.round((start * 100) / file.size);
    setUploadProgress(startProgress);

    try {
      await api.uploadChunk(
        chunkToUpload,
        chunkIndex,
        sessionId,
        chunkSize,
        newAbortController.signal
      );

      // Update progress after chunk completes
      const endProgress = Math.round((end * 100) / file.size);
      setUploadProgress(endProgress);
    } catch (error) {
      console.error('Chunk upload failed:', error);
      throw error;
    }
  };

  const stopUpload = () => {
    uploadStoppedRef.current = true;
    setUploadStatus('paused');
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  const resumeUpload = () => {
    uploadStoppedRef.current = false;
    setUploadStatus('active');
    handleSubmit();
  };

  // Determine what UI to show based on status
  const showUploadControls =
    uploadStatus === 'active' || uploadStatus === 'paused';

  // Create an upload object for UploadingControls
  const uploadData = {
    id: 1,
    fileName: file?.name || '',
    fileSize: file?.size || 0,
    sessionId: sessionInfo?.sessionId || '',
    lastChunkIndex: lastUploadedChunkIndex,
    chunkSize: sessionInfo?.chunkSize || 0,
    lastModified: Date.now(),
    uploadProgress,
    status: uploadStatus,
  };
  console.log(file);

  return (
    <>
      {showUploadControls ? (
        <UploadingControls
          selectedUpload={uploadData}
          stopUpload={stopUpload}
          resumeUpload={resumeUpload}
        />
      ) : (
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
      )}
    </>
  );
};

export default ChunkedUploadForm;
