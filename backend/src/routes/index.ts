import express from 'express';
import uploadRoutes from './upload.routes';

const router = express.Router();

// Health check route
router.get('/', (_req, res) => {
  res.json({ message: 'API is running' });
});

// Register routes
router.use('/upload', uploadRoutes);

export default router;
