import request from '../../lib/request/request';

export interface CreateEpisodePayload {
  episodeName: string;
  script: string;
  style: '动漫' | '真人';
  aspectRatio: '16:9' | '9:16' | '1:1';
}

export interface EpisodeItem {
  scriptId: number;
  userId: number | null;
  username: string | null;
  episodeName: string;
  scriptContent: string;
  style: '动漫' | '真人';
  aspectRatio: '16:9' | '9:16' | '1:1';
  createdAt: string;
  updatedAt: string;
}

interface CreateEpisodeResponse {
  message: string;
  data: EpisodeItem;
}

interface ListEpisodesResponse {
  data: EpisodeItem[];
}

export async function createEpisode(payload: CreateEpisodePayload) {
  const response = await request.post<CreateEpisodeResponse>('/episodes', payload);
  return response.data;
}

export async function listEpisodes() {
  const response = await request.get<ListEpisodesResponse>('/episodes');
  return response.data;
}
