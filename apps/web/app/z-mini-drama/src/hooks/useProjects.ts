import { useEffect, useState } from 'react';
import { createProject, listProjects } from '@/services/project/project';
import type { CreateProjectPayload, Project } from '@/types/project';

interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  submitting: boolean;
  total: number;
  error: string | null;
  reload: () => Promise<void>;
  submitProject: (payload: CreateProjectPayload) => Promise<Project>;
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await listProjects();
      setProjects(response.data);
      setTotal(response.total);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '项目列表加载失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const submitProject = async (payload: CreateProjectPayload) => {
    setSubmitting(true);

    try {
      const response = await createProject(payload);
      await loadProjects();
      return response.data;
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  return {
    projects,
    loading,
    submitting,
    total,
    error,
    reload: loadProjects,
    submitProject
  };
}
