export type ProjectStatus = 'draft' | 'in_progress' | 'completed';

export interface ProjectRecord {
  id: number;
  name: string;
  description: string;
  status: ProjectStatus;
  aspectRatio: string | null;
  globalArtStyle: string | null;
  visualAssetDescription: unknown[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateProjectInput {
  name: string;
  description: string;
  aspectRatio: string | null;
  globalArtStyle: string | null;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  aspect_ratio?: string;
  global_art_style?: string;
}

export interface ProjectResponse {
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

export interface CreateProjectResponse {
  message: string;
  data: ProjectResponse;
}

export interface ListProjectsResponse {
  data: ProjectResponse[];
  total: number;
  page: number;
  page_size: number;
}
