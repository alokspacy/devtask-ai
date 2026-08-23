import { db } from '../db';
import { ReportJob } from '../types';

export interface IReportRepository {
  create(projectId: string, userId: string): Promise<ReportJob>;
  findById(id: string, userId?: string): Promise<ReportJob | null>;
  findByProjectId(projectId: string, userId?: string): Promise<ReportJob[]>;
  updateStatus(
    id: string,
    status: 'queued' | 'processing' | 'completed' | 'failed',
    extra?: { filePath?: string; fileName?: string; errorMessage?: string }
  ): Promise<ReportJob | null>;
}

export class ReportRepository implements IReportRepository {
  async create(projectId: string, userId: string): Promise<ReportJob> {
    const query = `
      INSERT INTO reports (project_id, user_id, status)
      VALUES ($1, $2, 'queued')
      RETURNING *;
    `;
    const result = await db.query<ReportJob>(query, [projectId, userId]);
    return result.rows[0];
  }

  async findById(id: string, userId?: string): Promise<ReportJob | null> {
    let query = `SELECT * FROM reports WHERE id = $1`;
    const params: any[] = [id];

    if (userId) {
      query += ` AND user_id = $2`;
      params.push(userId);
    }

    const result = await db.query<ReportJob>(query, params);
    return result.rows[0] || null;
  }

  async findByProjectId(projectId: string, userId?: string): Promise<ReportJob[]> {
    let query = `SELECT * FROM reports WHERE project_id = $1`;
    const params: any[] = [projectId];

    if (userId) {
      query += ` AND user_id = $2`;
      params.push(userId);
    }

    query += ` ORDER BY created_at DESC;`;

    const result = await db.query<ReportJob>(query, params);
    return result.rows;
  }

  async updateStatus(
    id: string,
    status: 'queued' | 'processing' | 'completed' | 'failed',
    extra?: { filePath?: string; fileName?: string; errorMessage?: string }
  ): Promise<ReportJob | null> {
    const isCompleted = status === 'completed';
    const query = `
      UPDATE reports
      SET 
        status = $2,
        file_path = COALESCE($3, file_path),
        file_name = COALESCE($4, file_name),
        error_message = COALESCE($5, error_message),
        completed_at = CASE WHEN $6::boolean THEN NOW() ELSE completed_at END
      WHERE id = $1
      RETURNING *;
    `;
    const result = await db.query<ReportJob>(query, [
      id,
      status,
      extra?.filePath || null,
      extra?.fileName || null,
      extra?.errorMessage || null,
      isCompleted,
    ]);
    return result.rows[0] || null;
  }
}

export const reportRepository = new ReportRepository();
