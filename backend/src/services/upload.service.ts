import path from 'path';
import { FILE_SIZE_LIMIT_DESCRIPTION } from '../config/upload.config';

/**
 * Formats file information for the response
 */
export const formatFileInfo = (file: Express.Multer.File) => {
  return {
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
  };
};

/**
 * Logs file upload information
 */
export const logFileUpload = (file: Express.Multer.File) => {
  console.log(
    `File uploaded: ${file.originalname} (${file.size} bytes, ${file.mimetype})`
  );
};

/**
 * Gets upload system status and settings
 */
export const getUploadSystemStatus = () => {
  return {
    status: 'active',
    maxFileSize: FILE_SIZE_LIMIT_DESCRIPTION,
    allowedFilesPerUpload: 1,
    service: 'File Upload API',
  };
};

export const sortChunkFiles = (files: string[]) => {
  console.log(files);
  return files
    .filter((f) => f.endsWith('.part'))
    .sort((a, b) => {
      const aIndex = parseInt(path.basename(a).split('.')[0], 10);
      const bIndex = parseInt(path.basename(b).split('.')[0], 10);
      return aIndex - bIndex;
    });
};
