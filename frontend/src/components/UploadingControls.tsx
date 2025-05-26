import React from 'react';
import type { IncompleteUpload } from '../types';

interface UploadingControlsProps {
  selectedUpload: IncompleteUpload;
  stopUpload: () => void;
  resumeUpload: () => void;
}

const UploadingControls: React.FC<UploadingControlsProps> = ({
  selectedUpload,
  stopUpload,
  resumeUpload,
}) => {
  // Ensure progress is always valid
  const progress = Math.min(
    Math.max(0, selectedUpload.uploadProgress || 0),
    100
  );

  return (
    <div className="mb-6">
      <div className="p-4 border rounded-lg bg-blue-50 mb-4">
        <h3 className="font-medium mb-2">
          {selectedUpload.status === 'active'
            ? 'Uploading: '
            : 'Resume Upload: '}
          {selectedUpload.fileName || 'New Upload'}
        </h3>
        <div className="flex justify-between text-sm mb-1">
          <span>
            {selectedUpload.status === 'active'
              ? `Progress: ${progress.toFixed(1)}%`
              : `Paused at: ${progress.toFixed(1)}%`}
          </span>
          <span>
            Size: {Math.round(selectedUpload.fileSize / 1024 / 1024) || 0} MB
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div
            className={`h-2.5 rounded-full transition-all duration-200 ${
              selectedUpload.status === 'active'
                ? 'bg-blue-500 animate-pulse'
                : 'bg-blue-500'
            }`}
            style={{
              width: `${progress}%`,
            }}
          ></div>
        </div>

        {selectedUpload.status === 'active' ? (
          <button
            onClick={stopUpload}
            className="w-full py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            type="button"
          >
            Pause Upload
          </button>
        ) : (
          <button
            onClick={resumeUpload}
            className="w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            type="button"
          >
            Resume Upload
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadingControls;
