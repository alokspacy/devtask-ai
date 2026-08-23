import express, { Express } from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes';
import projectRoutes from './routes/project.routes';
import { errorHandler } from './middleware/errorHandler';

export const createApp = (): Express => {
  const app = express();

  // Global Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use(healthRoutes);
  app.use('/projects', projectRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
