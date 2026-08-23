import { projectRepository, IProjectRepository } from '../repositories/project.repository';
import { Project, ProjectSummary } from '../types';
import { AppError } from '../middleware/errorHandler';

export class ProjectService {
  constructor(private repo: IProjectRepository = projectRepository) {}

  async createProject(userId: string, data: { name: string; description?: string }): Promise<Project> {
    if (!data.name || data.name.trim() === '') {
      throw new AppError('Project name is required', 400);
    }
    return await this.repo.create(userId, data);
  }

  async getProjectById(id: string, userId?: string): Promise<ProjectSummary> {
    const project = await this.repo.findById(id, userId);
    if (!project) {
      throw new AppError(`Project with id '${id}' not found`, 404);
    }
    return project;
  }

  async listProjects(userId: string): Promise<ProjectSummary[]> {
    return await this.repo.findAllByUserId(userId);
  }

  async updateProject(
    id: string,
    userId: string,
    data: { name?: string; description?: string; status?: 'active' | 'archived' | 'completed' }
  ): Promise<Project> {
    const project = await this.repo.update(id, userId, data);
    if (!project) {
      throw new AppError(`Project with id '${id}' not found`, 404);
    }
    return project;
  }

  async deleteProject(id: string, userId: string): Promise<void> {
    const deleted = await this.repo.delete(id, userId);
    if (!deleted) {
      throw new AppError(`Project with id '${id}' not found`, 404);
    }
  }
}

export const projectService = new ProjectService();
