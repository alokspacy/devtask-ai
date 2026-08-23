import { db } from '../db';
import { Project, ProjectSummary } from '../types';

export interface IProjectRepository {
  create(userId: string, data: { name: string; description?: string }): Promise<Project>;
  findById(id: string, userId?: string): Promise<ProjectSummary | null>;
  findAllByUserId(userId: string): Promise<ProjectSummary[]>;
  update(id: string, userId: string, data: { name?: string; description?: string; status?: 'active' | 'archived' | 'completed' }): Promise<Project | null>;
  delete(id: string, userId: string): Promise<boolean>;
}

export class ProjectRepository implements IProjectRepository {
  async create(userId: string, data: { name: string; description?: string }): Promise<Project> {
    const query = `
      INSERT INTO projects (user_id, name, description, status)
      VALUES ($1, $2, $3, 'active')
      RETURNING *;
    `;
    const result = await db.query<Project>(query, [userId, data.name, data.description || null]);
    return result.rows[0];
  }

  async findById(id: string, userId?: string): Promise<ProjectSummary | null> {
    let query = `SELECT * FROM projects WHERE id = $1`;
    const params: any[] = [id];

    if (userId) {
      query += ` AND user_id = $2`;
      params.push(userId);
    }

    const result = await db.query<Project>(query, params);
    const project = result.rows[0];
    if (!project) return null;

    const taskMetrics = await this.getTaskMetricsForProject(project.id);
    return {
      ...project,
      ...taskMetrics,
    };
  }

  async findAllByUserId(userId: string): Promise<ProjectSummary[]> {
    const query = `
      SELECT * FROM projects
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await db.query<Project>(query, [userId]);
    const projects = result.rows;

    const summaries: ProjectSummary[] = [];
    for (const project of projects) {
      const metrics = await this.getTaskMetricsForProject(project.id);
      summaries.push({
        ...project,
        ...metrics,
      });
    }

    return summaries;
  }

  private async getTaskMetricsForProject(projectId: string): Promise<{ task_count: number; completed_task_count: number; pending_task_count: number }> {
    try {
      const result = await db.query(
        `SELECT status FROM tasks WHERE project_id = $1`,
        [projectId]
      );
      const tasks = result.rows;
      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === 'completed').length;
      return {
        task_count: total,
        completed_task_count: completed,
        pending_task_count: total - completed,
      };
    } catch {
      return {
        task_count: 0,
        completed_task_count: 0,
        pending_task_count: 0,
      };
    }
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; description?: string; status?: 'active' | 'archived' | 'completed' }
  ): Promise<Project | null> {
    const fields: string[] = [];
    const params: any[] = [id, userId];
    let paramIndex = 3;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }

    if (fields.length === 0) {
      return await this.findById(id, userId);
    }

    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE projects
      SET ${fields.join(', ')}
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;
    const result = await db.query<Project>(query, params);
    return result.rows[0] || null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM projects
      WHERE id = $1 AND user_id = $2
      RETURNING id;
    `;
    const result = await db.query(query, [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }
}

export const projectRepository = new ProjectRepository();
