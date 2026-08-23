import express, { Express } from 'express';
import cors from 'cors';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import aiRoutes from './routes/ai.routes';
import reportRoutes from './routes/report.routes';
import docsRoutes from './routes/docs.routes';
import { errorHandler } from './middleware/errorHandler';

export const createApp = (): Express => {
  const app = express();

  // Global Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use(healthRoutes);
  app.use('/docs', docsRoutes);
  app.use('/auth', authRoutes);
  app.use('/projects', projectRoutes);
  app.use('/tasks', taskRoutes);
  app.use('/ai', aiRoutes);
  app.use('/reports', reportRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
};
