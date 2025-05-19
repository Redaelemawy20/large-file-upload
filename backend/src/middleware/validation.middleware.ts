import { Request, Response, NextFunction } from 'express';
import { ALLOWED_MIME_TYPES } from '../config/upload.config';

/**
 * Validates file type based on mime type
 */
export const validateFileType = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return next(); // No file uploaded, skip validation
  }

  if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
    return res.status(400).json({
      error: 'Invalid file type',
      message: 'The uploaded file type is not allowed',
      allowedTypes: ALLOWED_MIME_TYPES,
    });
  }

  next();
};
