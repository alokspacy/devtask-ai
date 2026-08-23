import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { aiPlannerService } from '../services/ai.service';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';

const router = Router();

const generatePlanSchema = z.object({
  task: z.string().min(3, 'Task description must be at least 3 characters long'),
  project_id: z.string().uuid('project_id must be a valid UUID').optional().nullable(),
});

router.use(requireAuth);

router.post(
  '/plan',
  validate(generatePlanSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { task, project_id } = req.body;

      const result = await aiPlannerService.generatePlan(task, userId, project_id);

      res.status(201).json({
        message: 'AI Implementation Plan generated successfully',
        data: result.plan,
        structured_plan: result.rawOutput,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/plans/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const plan = await aiPlannerService.getPlanById(req.params.id, userId);
      if (!plan) {
        res.status(404).json({ error: `AI Plan with id '${req.params.id}' not found` });
        return;
      }
      res.status(200).json({ data: plan });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
