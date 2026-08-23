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
    let query = `
      SELECT 
        p.*,
        COUNT(t.id)::int AS task_count,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::int AS completed_task_count,
        COUNT(CASE WHEN t.status != 'completed' THEN 1 END)::int AS pending_task_count
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.id = $1
    `;
    const params: any[] = [id];

    if (userId) {
      query += ` AND p.user_id = $2`;
      params.push(userId);
    }

    query += ` GROUP BY p.id;`;

    const result = await db.query<ProjectSummary>(query, params);
    return result.rows[0] || null;
  }

  async findAllByUserId(userId: string): Promise<ProjectSummary[]> {
    const query = `
      SELECT 
        p.*,
        COUNT(t.id)::int AS task_count,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END)::int AS completed_task_count,
        COUNT(CASE WHEN t.status != 'completed' THEN 1 END)::int AS pending_task_count
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.user_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `;
    const result = await db.query<ProjectSummary>(query, [userId]);
    return result.rows;
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
      const existing = await this.findById(id, userId);
      return existing;
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
