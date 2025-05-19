import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', routes);

// Root route
app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to the File Upload API' });
});

// Handle 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
