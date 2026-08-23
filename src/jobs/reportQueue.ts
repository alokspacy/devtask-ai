import { reportRepository } from '../repositories/report.repository';
import { projectRepository } from '../repositories/project.repository';
import { taskRepository } from '../repositories/task.repository';
import { aiPlanRepository } from '../repositories/aiPlan.repository';
import { pdfService } from '../services/pdf.service';

export interface ReportJobPayload {
  reportId: string;
  projectId: string;
  userId: string;
}

export class ReportJobQueue {
  private queue: ReportJobPayload[] = [];
  private isProcessing = false;

  enqueue(payload: ReportJobPayload): void {
    this.queue.push(payload);
    // Trigger worker asynchronously
    setImmediate(() => this.processNext());
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const job = this.queue.shift();

    if (!job) {
      this.isProcessing = false;
      return;
    }

    try {
      console.log(`[JobQueue] Processing report job ${job.reportId} for project ${job.projectId}`);

      // 1. Update status to 'processing'
      await reportRepository.updateStatus(job.reportId, 'processing');

      // 2. Fetch all project report data
      const project = await projectRepository.findById(job.projectId, job.userId);
      if (!project) {
        throw new Error(`Project ${job.projectId} not found for report generation`);
      }

      const tasks = await taskRepository.findAllByProjectId(job.projectId, job.userId);
      const aiPlans = await aiPlanRepository.findByProjectId(job.projectId, job.userId);

      // 3. Generate PDF
      const { filePath, fileName } = await pdfService.generateProjectPdfReport(job.reportId, {
        project,
        tasks,
        aiPlans,
        generatedAt: new Date(),
      });

      // 4. Update status to 'completed'
      await reportRepository.updateStatus(job.reportId, 'completed', {
        filePath,
        fileName,
      });

      console.log(`[JobQueue] Successfully completed report job ${job.reportId} -> ${fileName}`);
    } catch (error: any) {
      console.error(`[JobQueue] Failed processing report job ${job.reportId}:`, error.message);
      await reportRepository.updateStatus(job.reportId, 'failed', {
        errorMessage: error.message,
      });
    } finally {
      this.isProcessing = false;
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext());
      }
    }
  }

  // Method to wait for queue to drain in test suites
  async drain(): Promise<void> {
    while (this.queue.length > 0 || this.isProcessing) {
      await new Promise((res) => setTimeout(res, 50));
    }
  }
}

export const reportJobQueue = new ReportJobQueue();
