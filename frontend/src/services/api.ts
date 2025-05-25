export const startUpload = async (file: File) => {
  const response = await fetch(
    'http://localhost:3000/api/upload/start-upload',
    {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        filesize: file.size,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  const data = await response.json();
  return data;
};
export const uploadChunk = async (
  chunk: Blob,
  chunkIndex: number,
  sessionId: string,
  chunkSize: number,
  signal: AbortSignal
) => {
  const formData = new FormData();
  formData.append('chunk', chunk);
  formData.append('chunkIndex', chunkIndex.toString());
  formData.append('sessionId', sessionId);
  formData.append('chunkSize', chunkSize.toString());
  const response = await fetch(
    'http://localhost:3000/api/upload/upload-chunk',
    {
      method: 'POST',
      body: formData,
      signal,
    }
  );
  const data = await response.json();
  return data;
};
export const completeUpload = async (sessionId: string, filename: string) => {
  const response = await fetch(
    'http://localhost:3000/api/upload/complete-upload',
    {
      method: 'POST',
      body: JSON.stringify({ sessionId, filename }),
    }
  );
  const data = await response.json();
  return data;
};
