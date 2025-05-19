import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadFile, getUploadStatus } from '../controllers/upload.controller';
import { validateFileType } from '../middleware/validation.middleware';
import { UPLOAD_DIR, FILE_SIZE_LIMIT } from '../config/upload.config';

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

// Upload routes
router.post('/', upload.single('file'), validateFileType, uploadFile);
router.get('/status', getUploadStatus);

export default router;
