import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import env from './config/env.js';

const app = express();

const allowedOrigins = env.NODE_ENV === 'production'
  ? [env.CLIENT_URL]
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Global error handler ok
app.use(errorHandler);

export default app;
