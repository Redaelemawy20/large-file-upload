import React from 'react';
import type { UploadStatus } from '../types';
import type { IncompleteUpload } from '../types';

interface UploadingControlsProps {
  uploadStatus: UploadStatus;
  uploadProgress: number;
  selectedUpload: IncompleteUpload;
  stopUpload: () => void;
  resumeUpload: () => void;
}

const UploadingControls: React.FC<UploadingControlsProps> = ({
  uploadStatus,
  uploadProgress,
  selectedUpload,
  stopUpload,
  resumeUpload,
}) => {
  return (
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
  );
};

export default UploadingControls;
