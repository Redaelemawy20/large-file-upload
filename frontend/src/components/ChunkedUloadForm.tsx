import { useEffect, useRef, useState } from 'react';
import Form from './Form';
import * as api from '../services/api';
import type { FileInfo, IncompleteUpload, UploadStatus } from '../types';
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

  const isUploading = uploadStatus === 'active';
  console.log('selectedUpload', selectedUpload);

  return (
    <>
      {selectedUpload ? (
        <div className="mb-6">
          <div className="p-4 border rounded-lg bg-blue-50 mb-4">
            <h3 className="font-medium mb-2">
              {uploadStatus === 'active' ? 'Uploading: ' : 'Resume Upload: '}
              {selectedUpload.fileName}
            </h3>
            <div className="flex justify-between text-sm mb-1">
              <span>
                {uploadStatus === 'active'
                  ? `Progress: ${uploadProgress}%`
                  : `Paused at: ${selectedUpload.uploadProgress}%`}
              </span>
              <span>
                Size: {Math.round(selectedUpload.fileSize / 1024 / 1024)} MB
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className={`h-2.5 rounded-full ${
                  uploadStatus === 'active'
                    ? 'bg-primary animate-pulse'
                    : 'bg-blue-500'
                }`}
                style={{
                  width: `${
                    uploadStatus === 'active'
                      ? uploadProgress
                      : selectedUpload.uploadProgress
                  }%`,
                }}
              ></div>
            </div>

            {uploadStatus === 'active' ? (
              <button
                onClick={stopUpload}
                className="w-full py-2 px-4 bg-accent text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Pause Upload
              </button>
            ) : (
              <button
                onClick={resumeUpload}
                className="w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                Resume Upload
              </button>
            )}
          </div>
        </div>
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

      {isUploading && !selectedUpload && (
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
