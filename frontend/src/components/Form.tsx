import { useEffect, useState } from 'react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import type { UploadStatus } from '../types';
import { formatFileSize } from '../utils';
const Form = ({
  uploadProgress,
  maxFileSize,
  maxFileFormat,
  onUpload,
  uploadStatus,
  setUploadStatus,
  file,
  setFile,
}: {
  uploadProgress: number;
  maxFileSize: number;
  maxFileFormat: number;
  onUpload: () => Promise<void>;
  uploadStatus: UploadStatus;
  setUploadStatus: (status: UploadStatus) => void;
  file: File | null;
  setFile: (file: File | null) => void;
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadStatus('idle');
    setErrorMessage(null);
    setDetailedError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFileSize(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadStatus('idle');
    setErrorMessage(null);
    setDetailedError(null);

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFileSize(selectedFile)) {
        setFile(selectedFile);
      } else {
        e.target.value = ''; // Reset input if file is too large
      }
    }
  };

  const validateFileSize = (file: File): boolean => {
    if (file.size > maxFileSize) {
      setUploadStatus('error');
      setErrorMessage('File too large');
      setDetailedError(
        `The selected file exceeds the maximum size of ${maxFileFormat}`
      );
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (uploadStatus === 'success') {
      setFile(null);
      const fileInput = document.getElementById(
        'fileInput'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  }, [uploadStatus]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (file) {
      try {
        await onUpload();
      } catch (error: unknown) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('Upload failed');
        }
        console.error('Upload error:', error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          dragActive
            ? 'border-primary bg-primary/10'
            : uploadStatus === 'error'
            ? 'border-accent bg-accent/10'
            : uploadStatus === 'success'
            ? 'border-secondary bg-secondary/10'
            : uploadStatus === 'paused'
            ? 'border-secondary bg-secondary/10'
            : 'border-neutral/30'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="fileInput"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploadStatus === 'active'}
        />

        <label
          htmlFor="fileInput"
          className={`cursor-pointer flex flex-col items-center justify-center space-y-2 ${
            uploadStatus === 'active' ? 'opacity-50 pointer-events-none' : ''
          }`}
        >
          {uploadStatus === 'success' ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : uploadStatus === 'error' ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : uploadStatus === 'paused' ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : uploadStatus === 'active' ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-primary animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          )}

          {uploadStatus === 'success' ? (
            <span className="text-secondary font-medium">
              Upload successful!
            </span>
          ) : uploadStatus === 'error' ? (
            <div className="space-y-1">
              <span className="text-accent font-medium">
                {errorMessage || 'Upload failed'}
              </span>
              {detailedError && (
                <p className="text-sm text-neutral">{detailedError}</p>
              )}
            </div>
          ) : uploadStatus === 'paused' ? (
            <span className="text-secondary font-medium">Upload paused</span>
          ) : uploadStatus === 'active' ? (
            <span className="text-primary font-medium">Uploading...</span>
          ) : (
            <span className="text-neutral font-medium">
              {file
                ? file.name
                : 'Drag & drop your file here or click to browse'}
            </span>
          )}

          {file && uploadStatus === 'idle' && (
            <span className="text-sm text-secondary">
              {formatFileSize(file.size)}
            </span>
          )}
        </label>
      </div>

      {uploadStatus === 'active' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-neutral">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-neutral/20 rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={
          !file ||
          uploadStatus === 'active' ||
          uploadStatus === 'success' ||
          uploadStatus === 'paused'
        }
        className={`w-full py-3 px-4 rounded-md text-white font-medium transition-all ${
          !file ||
          uploadStatus === 'active' ||
          uploadStatus === 'success' ||
          uploadStatus === 'paused'
            ? 'bg-neutral/70 cursor-not-allowed'
            : 'bg-primary hover:bg-primary/90'
        }`}
      >
        {uploadStatus === 'active' ? 'Uploading...' : 'Upload File'}
      </button>
    </form>
  );
};

export default Form;
