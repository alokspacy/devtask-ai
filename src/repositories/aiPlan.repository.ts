import { db } from '../db';
import { AiPlan } from '../types';

export interface IAiPlanRepository {
  create(data: {
    projectId?: string | null;
    userId: string;
    taskInput: string;
    goal: string;
    prerequisites: string[];
    steps: string[];
    filesOrAreasToModify: string[];
    testingChecklist: string[];
    risks: string[];
    modelName?: string;
    promptTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  }): Promise<AiPlan>;
  findById(id: string, userId?: string): Promise<AiPlan | null>;
  findByProjectId(projectId: string, userId?: string): Promise<AiPlan[]>;
}

export class AiPlanRepository implements IAiPlanRepository {
  async create(data: {
    projectId?: string | null;
    userId: string;
    taskInput: string;
    goal: string;
    prerequisites: string[];
    steps: string[];
    filesOrAreasToModify: string[];
    testingChecklist: string[];
    risks: string[];
    modelName?: string;
    promptTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  }): Promise<AiPlan> {
    const query = `
      INSERT INTO ai_plans (
        project_id, user_id, task_input, goal, prerequisites, 
        steps, files_or_areas_to_modify, testing_checklist, risks,
        model_name, prompt_tokens, output_tokens, total_tokens
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    const result = await db.query<AiPlan>(query, [
      data.projectId || null,
      data.userId,
      data.taskInput,
      data.goal,
      JSON.stringify(data.prerequisites),
      JSON.stringify(data.steps),
      JSON.stringify(data.filesOrAreasToModify),
      JSON.stringify(data.testingChecklist),
      JSON.stringify(data.risks),
      data.modelName || 'gemini-1.5-flash',
      data.promptTokens || null,
      data.outputTokens || null,
      data.totalTokens || null,
    ]);
    return result.rows[0];
  }

  async findById(id: string, userId?: string): Promise<AiPlan | null> {
    let query = `SELECT * FROM ai_plans WHERE id = $1`;
    const params: any[] = [id];

    if (userId) {
      query += ` AND user_id = $2`;
      params.push(userId);
    }

    const result = await db.query<AiPlan>(query, params);
    return result.rows[0] || null;
  }

  async findByProjectId(projectId: string, userId?: string): Promise<AiPlan[]> {
    let query = `SELECT * FROM ai_plans WHERE project_id = $1`;
    const params: any[] = [projectId];

    if (userId) {
      query += ` AND user_id = $2`;
      params.push(userId);
    }

    query += ` ORDER BY created_at DESC;`;

    const result = await db.query<AiPlan>(query, params);
    return result.rows;
  }
}

export const aiPlanRepository = new AiPlanRepository();
