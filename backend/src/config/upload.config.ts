import path from 'path';

// Upload directory path
export const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// File size limits
export const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB in bytes
export const FILE_SIZE_LIMIT_DESCRIPTION = '10MB';

// Allowed file types
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
];
