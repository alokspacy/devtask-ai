import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { z } from 'zod';
import { config } from '../config';
import { aiPlanRepository, IAiPlanRepository } from '../repositories/aiPlan.repository';
import { AiPlan } from '../types';
import { AppError } from '../middleware/errorHandler';

export const aiPlanResponseSchema = z.object({
  goal: z.string().min(1, 'Goal is required'),
  prerequisites: z.array(z.string()).default([]),
  steps: z.array(z.string()).min(1, 'At least one step is required'),
  files_or_areas_to_modify: z.array(z.string()).default([]),
  testing_checklist: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
});

export type AiPlanStructuredOutput = z.infer<typeof aiPlanResponseSchema>;

export class AiPlannerService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private repo: IAiPlanRepository = aiPlanRepository) {
    if (config.geminiApiKey && config.geminiApiKey.trim() !== '') {
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    }
  }

  async generatePlan(
    taskInput: string,
    userId: string,
    projectId?: string | null
  ): Promise<{ plan: AiPlan; rawOutput: AiPlanStructuredOutput }> {
    if (!taskInput || taskInput.trim() === '') {
      throw new AppError('Task description cannot be empty', 400);
    }

    let structuredPlan: AiPlanStructuredOutput;
    let modelName = 'gemini-1.5-flash';
    let promptTokens: number | undefined;
    let outputTokens: number | undefined;
    let totalTokens: number | undefined;

    if (this.genAI && config.geminiApiKey && !config.geminiApiKey.includes('placeholder')) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const prompt = `You are an expert backend AI software architect. 
Given the following developer task description, produce a detailed, actionable, and verified implementation plan.

TASK:
"${taskInput}"

You MUST respond strictly with a valid JSON object adhering to this schema:
{
  "goal": "Clear one-sentence summary of the task objective",
  "prerequisites": ["List of libraries, environment variables, or schema prerequisites"],
  "steps": ["Granular step-by-step implementation instructions"],
  "files_or_areas_to_modify": ["Exact file paths or architectural modules to create or modify"],
  "testing_checklist": ["Specific unit, integration, and manual test cases to verify"],
  "risks": ["Potential edge cases, security pitfalls, or technical risks to mitigate"]
}
`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Parse and validate with Zod
        let parsedJson: any;
        try {
          parsedJson = JSON.parse(text);
        } catch (jsonErr) {
          throw new AppError('Gemini returned non-JSON output', 502, text);
        }

        const validated = aiPlanResponseSchema.safeParse(parsedJson);
        if (!validated.success) {
          throw new AppError('LLM response does not match the required plan schema', 502, validated.error.errors);
        }

        structuredPlan = validated.data;

        // Record token usage if available
        if (response.usageMetadata) {
          promptTokens = response.usageMetadata.promptTokenCount;
          outputTokens = response.usageMetadata.candidatesTokenCount;
          totalTokens = response.usageMetadata.totalTokenCount;
        }
      } catch (err: any) {
        if (err instanceof AppError) throw err;
        console.error('Gemini API execution error:', err.message);
        throw new AppError(`Gemini API Error: ${err.message}`, 502);
      }
    } else {
      // Local deterministic mock planner for test/development environments without live external API keys
      modelName = 'local-mock-planner';
      structuredPlan = this.generateLocalMockPlan(taskInput);
      promptTokens = 25;
      outputTokens = 120;
      totalTokens = 145;
    }

    // Persist to PostgreSQL database
    const savedPlan = await this.repo.create({
      projectId,
      userId,
      taskInput,
      goal: structuredPlan.goal,
      prerequisites: structuredPlan.prerequisites,
      steps: structuredPlan.steps,
      filesOrAreasToModify: structuredPlan.files_or_areas_to_modify,
      testingChecklist: structuredPlan.testing_checklist,
      risks: structuredPlan.risks,
      modelName,
      promptTokens,
      outputTokens,
      totalTokens,
    });

    return {
      plan: savedPlan,
      rawOutput: structuredPlan,
    };
  }

  private generateLocalMockPlan(taskInput: string): AiPlanStructuredOutput {
    return {
      goal: `Execute and implement development task: ${taskInput.slice(0, 100)}`,
      prerequisites: [
        'Node.js v20+ and TypeScript installed',
        'PostgreSQL database running and initialized',
        'Environment variables configured in .env',
      ],
      steps: [
        `Analyze architectural requirements for "${taskInput.slice(0, 60)}"`,
        'Define TypeScript domain models and repository query interfaces',
        'Implement service business logic and validation schemas with Zod',
        'Expose Express HTTP router endpoints with appropriate status codes',
        'Add integration tests to verify successful and edge-case execution',
      ],
      files_or_areas_to_modify: [
        'src/types/index.ts',
        'src/services/',
        'src/routes/',
        'tests/',
      ],
      testing_checklist: [
        'Verify valid inputs return 200/201 response status',
        'Verify invalid inputs trigger 400 Bad Request with Zod validation errors',
        'Verify unauthenticated requests return 401 Unauthorized',
        'Verify PostgreSQL persistence after server restart',
      ],
      risks: [
        'Uncaught async database exceptions',
        'Token expiration or missing credentials in environment',
        'Missing request input sanitization',
      ],
    };
  }

  async getPlansByProjectId(projectId: string, userId: string): Promise<AiPlan[]> {
    return await this.repo.findByProjectId(projectId, userId);
  }

  async getPlanById(id: string, userId: string): Promise<AiPlan | null> {
    return await this.repo.findById(id, userId);
  }
}

export const aiPlannerService = new AiPlannerService();
