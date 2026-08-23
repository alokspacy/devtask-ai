import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { taskService } from '../services/task.service';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';

const router = Router();

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

router.use(requireAuth);

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const task = await taskService.getTaskById(req.params.id, userId);
    res.status(200).json({
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

router.put(
  '/:id',
  validate(updateTaskSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const task = await taskService.updateTask(req.params.id, userId, req.body);
      res.status(200).json({
        message: 'Task updated successfully',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await taskService.deleteTask(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
