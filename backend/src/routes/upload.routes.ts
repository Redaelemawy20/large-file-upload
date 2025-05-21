import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  uploadFile,
  getUploadStatus,
  getSessionId,
} from '../controllers/upload.controller';
import { validateFileType } from '../middleware/validation.middleware';
import {
  UPLOAD_DIR,
  FILE_SIZE_LIMIT,
  FILE_SIZE_LIMIT_DESCRIPTION,
} from '../config/upload.config';

const router = express.Router();

// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Create multer upload instance with file size limit
const upload = multer({
  storage,
  limits: { fileSize: FILE_SIZE_LIMIT },
});

// Handle multer errors, including file size limit
const handleMulterError = (
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: `The uploaded file exceeds the maximum size of ${FILE_SIZE_LIMIT_DESCRIPTION}`,
        maxSize: FILE_SIZE_LIMIT_DESCRIPTION,
      });
    }
    return res.status(400).json({
      error: 'Upload error',
      message: `File upload error: ${err.message}`,
    });
  }

  // For other errors
  if (err) {
    return res.status(500).json({
      error: 'Server error',
      message: 'An error occurred during the upload',
    });
  }

  next();
};

// Upload routes
// We wrap the upload middleware to handle its errors
router.post(
  '/',
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  validateFileType,
  uploadFile
);

router.get('/status', getUploadStatus);

router.post('/start-upload', getSessionId);

export default router;
