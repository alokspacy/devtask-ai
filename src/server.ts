import { createApp } from './app';
import { config } from './config';
import { db } from './db';

const app = createApp();

const startServer = async () => {
  try {
    console.log(`Starting DevTask AI in ${config.nodeEnv} mode...`);

    // Auto-init schema if DB is accessible
    await db.initSchema();

    const server = app.listen(config.port, () => {
      console.log(`DevTask AI Server running at http://localhost:${config.port}`);
      console.log(`Health Check: http://localhost:${config.port}/health`);
    });

    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await db.close();
        console.log('Server and database connections closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Fatal error during startup:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
