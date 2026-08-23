import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import openApiSpec from '../docs/openapi.json';

const router = Router();

// Expose OpenAPI spec JSON
router.get('/openapi.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openApiSpec);
});

// Expose Swagger UI
router.use('/', swaggerUi.serve, swaggerUi.setup(openApiSpec));

export default router;
