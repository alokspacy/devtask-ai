import { db } from '../db';
import { Task } from '../types';

export interface ITaskRepository {
  create(projectId: string, data: { title: string; description?: string; status?: 'pending' | 'in_progress' | 'completed'; priority?: 'low' | 'medium' | 'high' | 'critical' }): Promise<Task>;
  findById(id: string, userId?: string): Promise<Task | null>;
  findAllByProjectId(projectId: string, userId?: string): Promise<Task[]>;
  update(id: string, userId: string, data: { title?: string; description?: string; status?: 'pending' | 'in_progress' | 'completed'; priority?: 'low' | 'medium' | 'high' | 'critical' }): Promise<Task | null>;
  delete(id: string, userId: string): Promise<boolean>;
}

export class TaskRepository implements ITaskRepository {
  async create(
    projectId: string,
    data: {
      title: string;
      description?: string;
      status?: 'pending' | 'in_progress' | 'completed';
      priority?: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<Task> {
    const query = `
      INSERT INTO tasks (project_id, title, description, status, priority)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await db.query<Task>(query, [
      projectId,
      data.title,
      data.description || null,
      data.status || 'pending',
      data.priority || 'medium',
    ]);
    return result.rows[0];
  }

  async findById(id: string, userId?: string): Promise<Task | null> {
    let query = `
      SELECT t.* 
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1
    `;
    const params: any[] = [id];

    if (userId) {
      query += ` AND p.user_id = $2`;
      params.push(userId);
    }

    const result = await db.query<Task>(query, params);
    return result.rows[0] || null;
  }

  async findAllByProjectId(projectId: string, userId?: string): Promise<Task[]> {
    let query = `
      SELECT t.* 
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.project_id = $1
    `;
    const params: any[] = [projectId];

    if (userId) {
      query += ` AND p.user_id = $2`;
      params.push(userId);
    }

    query += ` ORDER BY t.created_at ASC;`;

    const result = await db.query<Task>(query, params);
    return result.rows;
  }

  async update(
    id: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      status?: 'pending' | 'in_progress' | 'completed';
      priority?: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<Task | null> {
    const fields: string[] = [];
    const params: any[] = [id, userId];
    let paramIndex = 3;

    if (data.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      params.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }
    if (data.priority !== undefined) {
      fields.push(`priority = $${paramIndex++}`);
      params.push(data.priority);
    }

    if (fields.length === 0) {
      return await this.findById(id, userId);
    }

    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE tasks t
      SET ${fields.join(', ')}
      FROM projects p
      WHERE t.id = $1 AND t.project_id = p.id AND p.user_id = $2
      RETURNING t.*;
    `;
    const result = await db.query<Task>(query, params);
    return result.rows[0] || null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM tasks t
      USING projects p
      WHERE t.id = $1 AND t.project_id = p.id AND p.user_id = $2
      RETURNING t.id;
    `;
    const result = await db.query(query, [id, userId]);
    return (result.rowCount ?? 0) > 0;
  }
}

export const taskRepository = new TaskRepository();
