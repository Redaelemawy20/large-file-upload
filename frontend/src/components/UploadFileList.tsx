import { useEffect, useState } from 'react';
import ChunkedUploadForm from './ChunkedUloadForm';

interface IncompleteUpload {
  id: number;
  fileName: string;
  fileSize: number;
  sessionId: string;
  lastChunkIndex: number;
  chunkSize: number;
  lastModified: number;
  uploadProgress: number;
}

const UploadFileList = () => {
  const [incompleteUploads, setIncompleteUploads] = useState<
    IncompleteUpload[]
  >([]);
  // we need to convert it index
  const [selectedUploadIndex, setSelectedUploadIndex] = useState<number>(0);

  // Load incomplete uploads from localStorage on component mount
  useEffect(() => {
    const storedUploads = localStorage.getItem('incompleteUploads');
    if (storedUploads) {
      setIncompleteUploads(JSON.parse(storedUploads));
    }
  }, []);

  // Add a new incomplete upload to localStorage
  const addIncompleteUpload = (upload: Omit<IncompleteUpload, 'id'>) => {
    const newItem = { id: incompleteUploads.length + 1, ...upload };
    const updatedUploads = [...incompleteUploads, newItem];
    setIncompleteUploads(updatedUploads);
    localStorage.setItem('incompleteUploads', JSON.stringify(updatedUploads));
    setSelectedUploadIndex(updatedUploads.length - 1);
  };

  // Update an existing incomplete upload in localStorage
  const updateIncompleteUpload = (upload: IncompleteUpload) => {
    console.log(upload);
    const incompletedUploads = [...incompleteUploads];
    const index = incompletedUploads.findIndex((item) => item.id === upload.id);
    if (index !== -1) {
      incompletedUploads[index] = upload;
    }
    setIncompleteUploads(incompletedUploads);
    localStorage.setItem(
      'incompleteUploads',
      JSON.stringify(incompletedUploads)
    );
  };

  // Remove a completed upload from localStorage
  const removeIncompleteUpload = (uploadId: string) => {
    const updatedUploads = incompleteUploads.filter(
      (upload) => upload.sessionId !== uploadId
    );
    setIncompleteUploads(updatedUploads);
    localStorage.setItem('incompleteUploads', JSON.stringify(updatedUploads));

    // If the removed upload was selected, clear selection
    if (incompleteUploads[selectedUploadIndex]?.sessionId === uploadId) {
      setSelectedUploadIndex(0);
    }
  };

  // Handle upload status changes
  const handleUploadStatusChange = (
    status: 'idle' | 'active' | 'success' | 'error' | 'paused',
    fileInfo?: {
      fileName: string;
      fileSize: number;
      sessionId: string;
      lastChunkIndex: number;
      chunkSize: number;
      uploadProgress: number;
    }
  ) => {
    if (status === 'active' && fileInfo) {
      // If starting a new upload or resuming
      const upload = {
        fileName: fileInfo.fileName,
        fileSize: fileInfo.fileSize,
        sessionId: fileInfo.sessionId,
        lastChunkIndex: fileInfo.lastChunkIndex,
        chunkSize: fileInfo.chunkSize,
        lastModified: Date.now(),
        uploadProgress: fileInfo.uploadProgress,
      };
      console.log(upload);
      if (upload.uploadProgress > 0) {
        updateIncompleteUpload({
          ...upload,
          id: incompleteUploads[selectedUploadIndex]?.id || 0,
        });
      } else {
        addIncompleteUpload(upload);
      }
    } else if (status === 'paused' && fileInfo) {
      // Update progress when paused

      const updatedUpload = {
        ...incompleteUploads[selectedUploadIndex],
        lastChunkIndex: fileInfo.lastChunkIndex,
        uploadProgress: fileInfo.uploadProgress,
        lastModified: Date.now(),
      };
      updateIncompleteUpload(updatedUpload as IncompleteUpload);
    } else if (status === 'success' && incompleteUploads[selectedUploadIndex]) {
      // Remove from incomplete uploads when completed
      removeIncompleteUpload(incompleteUploads[selectedUploadIndex].sessionId);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + ' MB';
    else return (bytes / 1073741824).toFixed(2) + ' GB';
  };

  // Format date for display
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  console.log(incompleteUploads, incompleteUploads[selectedUploadIndex]);
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">File Upload Manager</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Incomplete Uploads</h2>

            {incompleteUploads.length === 0 ? (
              <p className="text-gray-500">No incomplete uploads</p>
            ) : (
              <ul className="space-y-2">
                {incompleteUploads.map((upload, index) => (
                  <li
                    key={upload.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      incompleteUploads[selectedUploadIndex]?.id === upload.id
                        ? 'bg-blue-100 border border-blue-300'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedUploadIndex(index)}
                  >
                    <div className="font-medium truncate">
                      {upload.fileName}
                    </div>
                    <div className="text-sm text-gray-500 flex justify-between">
                      <span>{formatFileSize(upload.fileSize)}</span>
                      <span>{upload.uploadProgress}%</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Last modified: {formatDate(upload.lastModified)}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${upload.uploadProgress}%` }}
                      ></div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={() => setSelectedUploadIndex(0)}
              className="w-full mt-4 py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Upload New File
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              {incompleteUploads[selectedUploadIndex]
                ? `Resume Upload: ${incompleteUploads[selectedUploadIndex].fileName}`
                : 'Upload New File'}
            </h2>

            <ChunkedUploadForm
              selectedUpload={incompleteUploads[selectedUploadIndex]}
              onUploadStatusChange={handleUploadStatusChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadFileList;
