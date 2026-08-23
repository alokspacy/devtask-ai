export interface UserMetadata {
  id: string;
  supabase_user_id: string;
  email?: string;
  created_at: Date;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'archived' | 'completed';
  created_at: Date;
  updated_at: Date;
}

export interface ProjectSummary extends Project {
  task_count?: number;
  completed_task_count?: number;
  pending_task_count?: number;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at: Date;
  updated_at: Date;
}

export interface AiPlan {
  id: string;
  project_id: string | null;
  user_id: string;
  task_input: string;
  goal: string;
  prerequisites: string[];
  steps: string[];
  files_or_areas_to_modify: string[];
  testing_checklist: string[];
  risks: string[];
  model_name?: string;
  prompt_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
  created_at: Date;
}

export interface ReportJob {
  id: string;
  project_id: string;
  user_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  file_path: string | null;
  file_name: string | null;
  error_message: string | null;
  created_at: Date;
  completed_at: Date | null;
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
