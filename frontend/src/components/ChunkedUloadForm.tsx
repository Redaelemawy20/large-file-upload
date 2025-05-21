import { useState } from 'react';
import Form from './Form';

const ChunkedUploadForm = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSubmit = async (file: File) => {
    console.log('chunked submit', file);
    fetch('http://localhost:3000/api/upload/start-upload', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ filename: file.name, filesize: file.size }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
      });
  };

  return (
    <Form
      uploading={uploading}
      uploadProgress={uploadProgress}
      maxFileSize={10000000}
      maxFileFormat={10000000}
      onUpload={handleSubmit}
    />
  );
};

export default ChunkedUploadForm;
