import { useEffect, useRef, useState } from 'react';
import Form from './Form';
import * as api from '../services/api';
import type { FileInfo, IncompleteUpload, UploadStatus } from '../types';
import UploadingControls from './UploadingControls';

export interface ChunkedUploadFormProps {
  selectedUpload: IncompleteUpload | null;
  onUploadStatusChange: (status: UploadStatus, fileInfo?: FileInfo) => void;
}

const ChunkedUploadForm = ({
  selectedUpload,
  onUploadStatusChange,
}: ChunkedUploadFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const uploadStoppedRef = useRef(false);
  const [lastUploadedChunkIndex, setLastUploadedChunkIndex] = useState(-1);
  const [sessionInfo, setSessionInfo] = useState<{
    sessionId: string;
    chunkSize: number;
  } | null>(null);
  // abort controller state
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // Initialize state from selectedUpload if provided
  useEffect(() => {
    console.log('selectedUpload', selectedUpload);

    if (selectedUpload) {
      setLastUploadedChunkIndex(selectedUpload.lastChunkIndex);
      setSessionInfo({
        sessionId: selectedUpload.sessionId,
        chunkSize: selectedUpload.chunkSize,
      });
      setUploadProgress(selectedUpload.uploadProgress);
    } else {
      // Reset state if no upload is selected
      setLastUploadedChunkIndex(-1);
      setSessionInfo(null);
      setUploadProgress(0);
      setUploadStatus('idle');
    }
  }, [selectedUpload]);

  // Update parent component with status changes
  useEffect(() => {
    console.log('uploadStatus', uploadStatus, 'uploadProgress', uploadProgress);

    if (file && (uploadStatus === 'active' || uploadStatus === 'paused')) {
      onUploadStatusChange(uploadStatus, {
        fileName: file.name,
        fileSize: file.size,
        sessionId: sessionInfo?.sessionId || '',
        lastChunkIndex: lastUploadedChunkIndex,
        chunkSize: sessionInfo?.chunkSize || 0,
        uploadProgress,
      });
    } else if (uploadStatus === 'success') {
      onUploadStatusChange(uploadStatus);
    }
  }, [uploadStatus, uploadProgress]);

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
      await api.completeUpload(sessionId, file.name);
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
      await api.uploadChunk(
        chunkToUpload,
        chunkIndex,
        sessionId,
        chunkSize,
        abortController.signal
      );
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
    }
  };

  const resumeUpload = () => {
    handleSubmit();
  };

  return (
    <>
      {selectedUpload ? (
        <UploadingControls
          uploadStatus={uploadStatus}
          uploadProgress={uploadProgress}
          selectedUpload={selectedUpload}
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
