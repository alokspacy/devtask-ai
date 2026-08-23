import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { ProjectSummary, Task, AiPlan } from '../types';

export interface ProjectReportData {
  project: ProjectSummary;
  tasks: Task[];
  aiPlans: AiPlan[];
  generatedAt: Date;
}

export class PdfService {
  private outputDir: string;

  constructor() {
    this.outputDir = config.reportOutputDir;
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateProjectPdfReport(reportId: string, data: ProjectReportData): Promise<{ filePath: string; fileName: string }> {
    const fileName = `project-report-${data.project.id}-${Date.now()}.pdf`;
    const filePath = path.join(this.outputDir, fileName);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 45,
        info: {
          Title: `DevTask AI Report - ${data.project.name}`,
          Author: 'DevTask AI',
          Subject: 'Project Summary & Technical Planning Report',
        },
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Header Banner
      doc
        .rect(0, 0, doc.page.width, 80)
        .fill('#1e293b');

      doc
        .fillColor('#ffffff')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('DevTask AI — Project & Technical Plan Report', 45, 25);

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#94a3b8')
        .text(`Report ID: ${reportId}  |  Generated: ${data.generatedAt.toUTCString()}`, 45, 52);

      doc.moveDown(3);
      doc.fillColor('#0f172a');

      // Project Overview Section
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#0284c7')
        .text('1. Project Overview', 45, 105);

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(`Project Name: `, { continued: true })
        .font('Helvetica')
        .text(data.project.name);

      doc
        .font('Helvetica-Bold')
        .text(`Status: `, { continued: true })
        .font('Helvetica')
        .text(data.project.status.toUpperCase());

      doc
        .font('Helvetica-Bold')
        .text(`Created At: `, { continued: true })
        .font('Helvetica')
        .text(new Date(data.project.created_at).toUTCString());

      doc
        .font('Helvetica-Bold')
        .text(`Description: `, { continued: true })
        .font('Helvetica')
        .text(data.project.description || 'No description provided.');

      doc.moveDown(1);

      // Task Metrics Summary Box
      const totalTasks = data.tasks.length;
      const completedTasks = data.tasks.filter((t) => t.status === 'completed');
      const inProgressTasks = data.tasks.filter((t) => t.status === 'in_progress');
      const pendingTasks = data.tasks.filter((t) => t.status === 'pending');

      const yPos = doc.y;
      doc
        .rect(45, yPos, doc.page.width - 90, 45)
        .fillAndStroke('#f1f5f9', '#cbd5e1');

      doc
        .fillColor('#334155')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`Total Tasks: ${totalTasks}  |  Completed: ${completedTasks.length}  |  In Progress: ${inProgressTasks.length}  |  Pending: ${pendingTasks.length}`, 60, yPos + 16);

      doc.moveDown(3);

      // Task Breakdown Section
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#0284c7')
        .text('2. Task Breakdown', 45, doc.y + 10);

      doc.moveDown(0.5);

      if (data.tasks.length === 0) {
        doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b').text('No tasks recorded for this project yet.');
      } else {
        // Completed Tasks Sub-section
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#059669').text(`Completed Tasks (${completedTasks.length})`);
        doc.moveDown(0.3);
        if (completedTasks.length === 0) {
          doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b').text('None');
        } else {
          completedTasks.forEach((task, idx) => {
            doc
              .fontSize(10)
              .font('Helvetica-Bold')
              .fillColor('#1e293b')
              .text(`[✓] ${idx + 1}. ${task.title} (Priority: ${task.priority.toUpperCase()})`)
              .font('Helvetica')
              .fillColor('#475569')
              .text(`    ${task.description || 'No description'}`);
          });
        }

        doc.moveDown(0.8);

        // Pending & In Progress Tasks Sub-section
        const pendingAndProgress = [...inProgressTasks, ...pendingTasks];
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#d97706').text(`Pending & In-Progress Tasks (${pendingAndProgress.length})`);
        doc.moveDown(0.3);
        if (pendingAndProgress.length === 0) {
          doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b').text('None');
        } else {
          pendingAndProgress.forEach((task, idx) => {
            const icon = task.status === 'in_progress' ? '[~]' : '[ ]';
            doc
              .fontSize(10)
              .font('Helvetica-Bold')
              .fillColor('#1e293b')
              .text(`${icon} ${idx + 1}. ${task.title} [Status: ${task.status.toUpperCase()} | Priority: ${task.priority.toUpperCase()}]`)
              .font('Helvetica')
              .fillColor('#475569')
              .text(`    ${task.description || 'No description'}`);
          });
        }
      }

      doc.moveDown(1.5);

      // AI Development Plans Section
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#0284c7')
        .text('3. AI Development Plans', 45, doc.y);

      doc.moveDown(0.5);

      if (data.aiPlans.length === 0) {
        doc.fontSize(10).font('Helvetica-Oblique').fillColor('#64748b').text('No AI development plans generated for this project yet.');
      } else {
        data.aiPlans.forEach((plan, pIdx) => {
          doc
            .fontSize(12)
            .font('Helvetica-Bold')
            .fillColor('#4338ca')
            .text(`AI Plan #${pIdx + 1}: ${plan.task_input}`);

          doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#334155')
            .text(`Goal: ${plan.goal}`);

          doc.moveDown(0.3);

          if (Array.isArray(plan.steps) && plan.steps.length > 0) {
            doc.font('Helvetica-Bold').text('Implementation Steps:');
            plan.steps.forEach((step, sIdx) => {
              doc.font('Helvetica').fillColor('#475569').text(`  ${sIdx + 1}. ${step}`);
            });
          }

          if (Array.isArray(plan.files_or_areas_to_modify) && plan.files_or_areas_to_modify.length > 0) {
            doc.moveDown(0.2);
            doc.font('Helvetica-Bold').fillColor('#334155').text('Files / Modules to Modify:');
            plan.files_or_areas_to_modify.forEach((file) => {
              doc.font('Helvetica').fillColor('#475569').text(`  • ${file}`);
            });
          }

          if (Array.isArray(plan.testing_checklist) && plan.testing_checklist.length > 0) {
            doc.moveDown(0.2);
            doc.font('Helvetica-Bold').fillColor('#334155').text('Testing Checklist:');
            plan.testing_checklist.forEach((check) => {
              doc.font('Helvetica').fillColor('#475569').text(`  [ ] ${check}`);
            });
          }

          doc.moveDown(0.8);
        });
      }

      // Footer
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(8)
          .fillColor('#94a3b8')
          .text(
            `DevTask AI — Autonomous Developer Task & Project Assistant | Page ${i + 1} of ${pages.count}`,
            45,
            doc.page.height - 35,
            { align: 'center', width: doc.page.width - 90 }
          );
      }

      doc.end();

      writeStream.on('finish', () => {
        resolve({ filePath, fileName });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    });
  }
}

export const pdfService = new PdfService();
