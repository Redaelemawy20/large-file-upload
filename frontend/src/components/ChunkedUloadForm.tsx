import { useRef, useState, useEffect } from 'react';
import Form from './Form';
import * as api from '../services/api';
import type { FileInfo, UploadStatus } from '../types';
import UploadingControls from './UploadingControls';

interface ChunkedUploadFormProps {
  setUploadActive: (active: boolean) => void;
  savedFile: File | null;
  setSavedFile: (file: File | null) => void;
  savedUploadInfo: FileInfo | null;
  setSavedUploadInfo: (info: FileInfo | null) => void;
}

const ChunkedUploadForm = ({
  setUploadActive,
  savedFile,
  setSavedFile,
  savedUploadInfo,
  setSavedUploadInfo,
}: ChunkedUploadFormProps) => {
  // Internal state for the component
  const [file, setFile] = useState<File | null>(savedFile);
  const [uploadProgress, setUploadProgress] = useState(
    savedUploadInfo?.uploadProgress || 0
  );
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(
    (savedUploadInfo?.status as UploadStatus) || 'idle'
  );
  const uploadStoppedRef = useRef(false);
  const [lastUploadedChunkIndex, setLastUploadedChunkIndex] = useState(
    savedUploadInfo?.chunkIndex || -1
  );
  const [sessionInfo, setSessionInfo] = useState<{
    sessionId: string;
    chunkSize: number;
  } | null>(
    savedUploadInfo
      ? {
          sessionId: savedUploadInfo.sessionId,
          chunkSize: savedUploadInfo.chunkSize,
        }
      : null
  );
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // Update uploadActive based on status
  useEffect(() => {
    setUploadActive(uploadStatus === 'active');
  }, [uploadStatus, setUploadActive]);

  // Sync local state with parent state
  useEffect(() => {
    if (file !== savedFile) {
      setSavedFile(file);
    }
  }, [file, savedFile, setSavedFile]);

  useEffect(() => {
    if (sessionInfo && lastUploadedChunkIndex >= 0) {
      setSavedUploadInfo({
        sessionId: sessionInfo.sessionId,
        chunkSize: sessionInfo.chunkSize,
        chunkIndex: lastUploadedChunkIndex,
        uploadProgress,
        status: uploadStatus,
      });
    }
  }, [
    sessionInfo,
    lastUploadedChunkIndex,
    uploadProgress,
    uploadStatus,
    setSavedUploadInfo,
  ]);

  const handleSubmit = async (): Promise<void> => {
    if (!file) return;

    console.log(file); // Log file before upload starts

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
        setSavedUploadInfo(null);
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
    chunkIndex: lastUploadedChunkIndex,
    chunkSize: sessionInfo?.chunkSize || 0,
    lastModified: Date.now(),
    uploadProgress,
    status: uploadStatus,
  };

  // Custom file setter that updates both local and parent state
  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);
    setSavedFile(newFile);
  };

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
          setFile={handleFileChange}
        />
      )}
    </>
  );
};

export default ChunkedUploadForm;
