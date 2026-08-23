import { Router, Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const report = await reportService.getReportById(req.params.id, userId);
    res.status(200).json({
      data: report,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { filePath, fileName } = await reportService.getReportDownloadPath(req.params.id, userId);
    res.download(filePath, fileName);
  } catch (error) {
    next(error);
  }
});

export default router;
