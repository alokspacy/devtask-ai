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
    const result = await db.query<Task>(`SELECT * FROM tasks WHERE id = $1`, [id]);
    const task = result.rows[0];
    if (!task) return null;

    if (userId) {
      const proj = await db.query(`SELECT id FROM projects WHERE id = $1 AND user_id = $2`, [task.project_id, userId]);
      if (proj.rows.length === 0) return null;
    }

    return task;
  }

  async findAllByProjectId(projectId: string, _userId?: string): Promise<Task[]> {
    const query = `
      SELECT * FROM tasks
      WHERE project_id = $1
      ORDER BY created_at ASC;
    `;
    const result = await db.query<Task>(query, [projectId]);
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
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    const fields: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;

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
      return existing;
    }

    fields.push(`updated_at = NOW()`);

    const query = `
      UPDATE tasks
      SET ${fields.join(', ')}
      WHERE id = $1
      RETURNING *;
    `;
    const result = await db.query<Task>(query, params);
    return result.rows[0] || null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const existing = await this.findById(id, userId);
    if (!existing) return false;

    const query = `
      DELETE FROM tasks
      WHERE id = $1
      RETURNING id;
    `;
    const result = await db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export const taskRepository = new TaskRepository();
