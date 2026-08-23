import fs from 'fs';
import { reportRepository, IReportRepository } from '../repositories/report.repository';
import { projectRepository, IProjectRepository } from '../repositories/project.repository';
import { reportJobQueue } from '../jobs/reportQueue';
import { ReportJob } from '../types';
import { AppError } from '../middleware/errorHandler';

export class ReportService {
  constructor(
    private reportRepo: IReportRepository = reportRepository,
    private projectRepo: IProjectRepository = projectRepository
  ) {}

  async requestProjectReport(projectId: string, userId: string): Promise<ReportJob> {
    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) {
      throw new AppError(`Project with id '${projectId}' not found`, 404);
    }

    // Create queued report job record
    const reportJob = await this.reportRepo.create(projectId, userId);

    // Enqueue background processing asynchronously
    reportJobQueue.enqueue({
      reportId: reportJob.id,
      projectId,
      userId,
    });

    return reportJob;
  }

  async getReportById(id: string, userId: string): Promise<ReportJob> {
    const report = await this.reportRepo.findById(id, userId);
    if (!report) {
      throw new AppError(`Report job with id '${id}' not found`, 404);
    }
    return report;
  }

  async getReportsByProjectId(projectId: string, userId: string): Promise<ReportJob[]> {
    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) {
      throw new AppError(`Project with id '${projectId}' not found`, 404);
    }
    return await this.reportRepo.findByProjectId(projectId, userId);
  }

  async getReportDownloadPath(id: string, userId: string): Promise<{ filePath: string; fileName: string }> {
    const report = await this.getReportById(id, userId);

    if (report.status !== 'completed' || !report.file_path) {
      throw new AppError(`Report is not ready for download. Current status: ${report.status}`, 400);
    }

    if (!fs.existsSync(report.file_path)) {
      throw new AppError('Generated PDF report file not found on disk', 404);
    }

    return {
      filePath: report.file_path,
      fileName: report.file_name || `project-report-${report.project_id}.pdf`,
    };
  }
}

export const reportService = new ReportService();
