import { useState } from 'react';
import ChunkedUploadForm from './ChunkedUloadForm';
import SmallFileUploadForm from './SmallFileUploadForm';
import type { FileInfo } from '../types';

type UploadType = 'regular' | 'chunked';

const UploadFileList = () => {
  const [uploadType, setUploadType] = useState<UploadType>('regular');
  const [uploadActive, setUploadActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [chunkedUploadInfo, setChunkedUploadInfo] = useState<FileInfo | null>(
    null
  );

  // Toggle between upload types
  const toggleUploadType = () => {
    if (!uploadActive) {
      setUploadType((prev) => (prev === 'regular' ? 'chunked' : 'regular'));
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-primary">
        File Upload Manager
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4 text-secondary">
              Upload Options
            </h2>
            <div className="flex items-center mb-4">
              <label
                className={`flex items-center ${
                  uploadActive
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer'
                }`}
              >
                <div className="mr-3 text-neutral font-medium">
                  Upload Type:
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={uploadType === 'chunked'}
                    onChange={toggleUploadType}
                    disabled={uploadActive}
                  />
                  <div
                    className={`block ${
                      uploadActive ? 'bg-neutral/20' : 'bg-neutral/30'
                    } w-14 h-8 rounded-full`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${
                      uploadType === 'chunked' ? 'transform translate-x-6' : ''
                    }`}
                  ></div>
                </div>
                <div className="ml-3 text-neutral font-medium">
                  {uploadType === 'regular'
                    ? 'Regular Upload'
                    : 'Chunked Upload'}
                </div>
              </label>
            </div>
            <div className="text-sm text-neutral/80 mt-2">
              {uploadType === 'regular'
                ? 'Regular upload is suitable for small files (up to 10MB).'
                : 'Chunked upload is suitable for large files and supports resuming.'}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-primary">
              {uploadType === 'regular'
                ? 'Upload Small File'
                : 'Upload Large File (Resumable)'}
            </h2>

            {uploadType === 'regular' ? (
              <SmallFileUploadForm setUploadActive={setUploadActive} />
            ) : (
              <ChunkedUploadForm
                setUploadActive={setUploadActive}
                savedFile={file}
                setSavedFile={setFile}
                savedUploadInfo={chunkedUploadInfo}
                setSavedUploadInfo={setChunkedUploadInfo}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadFileList;
