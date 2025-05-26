import { useState } from 'react';
import ChunkedUploadForm from './ChunkedUloadForm';
import SmallFileUploadForm from './SmallFileUploadForm';

type UploadType = 'regular' | 'chunked';

const UploadFileList = () => {
  const [uploadType, setUploadType] = useState<UploadType>('regular');

  // Toggle between upload types
  const toggleUploadType = () => {
    setUploadType((prev) => (prev === 'regular' ? 'chunked' : 'regular'));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">File Upload Manager</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">Upload Options</h2>
            <div className="flex items-center mb-4">
              <label className="flex items-center cursor-pointer">
                <div className="mr-3 text-gray-700 font-medium">
                  Upload Type:
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={uploadType === 'chunked'}
                    onChange={toggleUploadType}
                  />
                  <div className="block bg-gray-300 w-14 h-8 rounded-full"></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${
                      uploadType === 'chunked' ? 'transform translate-x-6' : ''
                    }`}
                  ></div>
                </div>
                <div className="ml-3 text-gray-700 font-medium">
                  {uploadType === 'regular'
                    ? 'Regular Upload'
                    : 'Chunked Upload'}
                </div>
              </label>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {uploadType === 'regular'
                ? 'Regular upload is suitable for small files (up to 10MB).'
                : 'Chunked upload is suitable for large files and supports resuming.'}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">
              {uploadType === 'regular'
                ? 'Upload Small File'
                : 'Upload Large File (Resumable)'}
            </h2>

            {uploadType === 'regular' ? (
              <SmallFileUploadForm />
            ) : (
              <ChunkedUploadForm />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadFileList;
