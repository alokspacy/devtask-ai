import { taskRepository, ITaskRepository } from '../repositories/task.repository';
import { projectRepository, IProjectRepository } from '../repositories/project.repository';
import { Task } from '../types';
import { AppError } from '../middleware/errorHandler';

export class TaskService {
  constructor(
    private taskRepo: ITaskRepository = taskRepository,
    private projectRepo: IProjectRepository = projectRepository
  ) {}

  async createTask(
    projectId: string,
    userId: string,
    data: {
      title: string;
      description?: string;
      status?: 'pending' | 'in_progress' | 'completed';
      priority?: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<Task> {
    if (!data.title || data.title.trim() === '') {
      throw new AppError('Task title is required', 400);
    }

    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) {
      throw new AppError(`Project with id '${projectId}' not found`, 404);
    }

    return await this.taskRepo.create(projectId, data);
  }

  async getTasksByProject(projectId: string, userId: string): Promise<Task[]> {
    const project = await this.projectRepo.findById(projectId, userId);
    if (!project) {
      throw new AppError(`Project with id '${projectId}' not found`, 404);
    }

    return await this.taskRepo.findAllByProjectId(projectId, userId);
  }

  async getTaskById(id: string, userId: string): Promise<Task> {
    const task = await this.taskRepo.findById(id, userId);
    if (!task) {
      throw new AppError(`Task with id '${id}' not found`, 404);
    }
    return task;
  }

  async updateTask(
    id: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      status?: 'pending' | 'in_progress' | 'completed';
      priority?: 'low' | 'medium' | 'high' | 'critical';
    }
  ): Promise<Task> {
    const task = await this.taskRepo.update(id, userId, data);
    if (!task) {
      throw new AppError(`Task with id '${id}' not found`, 404);
    }
    return task;
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    const deleted = await this.taskRepo.delete(id, userId);
    if (!deleted) {
      throw new AppError(`Task with id '${id}' not found`, 404);
    }
  }
}

export const taskService = new TaskService();
