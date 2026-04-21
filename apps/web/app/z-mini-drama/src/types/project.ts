export type ProjectStatus = 'draft' | 'in_progress' | 'completed';

export interface Project {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  aspect_ratio: string | null;
  global_art_style: string | null;
  visual_asset_description: unknown[];
  created_at: string;
  updated_at: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  aspect_ratio?: string;
  global_art_style?: string;
}

export interface CreateProjectResult {
  message: string;
  data: Project;
}

export interface ListProjectsResult {
  data: Project[];
  total: number;
  page: number;
  page_size: number;
}
