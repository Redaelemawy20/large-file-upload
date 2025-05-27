export interface IncompleteUpload {
  id: number;
  fileName: string;
  fileSize: number;
  sessionId: string;
  chunkIndex: number;
  chunkSize: number;
  lastModified: number;
  uploadProgress: number;
  status: UploadStatus;
}
export type FileInfo = Omit<
  IncompleteUpload,
  'id' | 'lastModified' | 'fileName' | 'fileSize'
>;

export type UploadStatus = 'idle' | 'active' | 'success' | 'error' | 'paused';
