import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { projectService } from '../services/project.service';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';

const router = Router();

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name cannot be empty').max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
});

// All project routes require authentication
router.use(requireAuth);

router.post(
  '/',
  validate(createProjectSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const project = await projectService.createProject(userId, req.body);
      res.status(201).json({
        message: 'Project created successfully',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const projects = await projectService.listProjects(userId);
    res.status(200).json({
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const project = await projectService.getProjectById(req.params.id, userId);
    res.status(200).json({
      data: project,
    });
  } catch (error) {
    next(error);
  }
});

router.put(
  '/:id',
  validate(updateProjectSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const project = await projectService.updateProject(req.params.id, userId, req.body);
      res.status(200).json({
        message: 'Project updated successfully',
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await projectService.deleteProject(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
