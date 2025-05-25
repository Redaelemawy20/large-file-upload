export interface IncompleteUpload {
  id: number;
  fileName: string;
  fileSize: number;
  sessionId: string;
  lastChunkIndex: number;
  chunkSize: number;
  lastModified: number;
  uploadProgress: number;
}
export type FileInfo = Omit<IncompleteUpload, 'id' | 'lastModified'>;

export type UploadStatus = 'idle' | 'active' | 'success' | 'error' | 'paused';
