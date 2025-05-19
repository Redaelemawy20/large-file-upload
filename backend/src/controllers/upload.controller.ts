import { Request, Response } from 'express';
import {
  formatFileInfo,
  logFileUpload,
  getUploadSystemStatus,
} from '../services/upload.service';

/**
 * Handle file upload
 * @route POST /api/upload
 * @access Public
 */
export const uploadFile = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Log the upload
    logFileUpload(req.file);

    // Format and return file info
    res.status(200).json({
      message: 'File uploaded successfully',
      file: formatFileInfo(req.file),
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
};

/**
 * Get upload status
 * @route GET /api/upload/status
 * @access Public
 */
export const getUploadStatus = (_req: Request, res: Response) => {
  res.status(200).json(getUploadSystemStatus());
};
