import request from '@/lib/request/request';
import type { CreateProjectPayload, CreateProjectResult, ListProjectsResult } from '@/types/project';

export async function createProject(payload: CreateProjectPayload) {
  const response = await request.post<CreateProjectResult>('/projects', payload);
  return response.data;
}

export async function listProjects(params?: { page?: number; page_size?: number; name?: string }) {
  const searchParams = new URLSearchParams();

  if (params?.page) {
    searchParams.set('page', String(params.page));
  }

  if (params?.page_size) {
    searchParams.set('page_size', String(params.page_size));
  }

  if (params?.name?.trim()) {
    searchParams.set('name', params.name.trim());
  }

  const queryString = searchParams.toString();
  const response = await request.get<ListProjectsResult>(`/projects${queryString ? `?${queryString}` : ''}`);
  return response.data;
}
