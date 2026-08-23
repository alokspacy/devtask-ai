import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  const dbHealthy = await db.checkHealth();
  const statusCode = dbHealthy ? 200 : 503;
  res.status(statusCode).json({
    status: dbHealthy ? 'ok' : 'degraded',
    service: 'DevTask AI',
    timestamp: new Date().toISOString(),
    database: dbHealthy ? 'connected' : 'disconnected',
  });
});

export default router;
