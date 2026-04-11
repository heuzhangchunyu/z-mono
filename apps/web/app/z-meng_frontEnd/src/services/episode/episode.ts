import request from '../../lib/request/request';

export interface CreateEpisodePayload {
  episodeName: string;
  style: '动漫' | '真人';
  aspectRatio: '16:9' | '9:16' | '1:1';
}

export interface EpisodeItem {
  scriptId: number;
  userId: number | null;
  username: string | null;
  episodeName: string;
  scriptContent: string;
  currentStage: 'script' | 'subject' | 'keyframes' | 'video-production';
  style: '动漫' | '真人';
  aspectRatio: '16:9' | '9:16' | '1:1';
  createdAt: string;
  updatedAt: string;
}

interface CreateEpisodeResponse {
  message: string;
  data: EpisodeItem;
}

interface UpdateEpisodeScriptResponse {
  message: string;
  data: EpisodeItem;
}

interface UpdateEpisodeStageResponse {
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

export async function updateEpisodeScript(scriptId: number, scriptContent: string) {
  const response = await request.patch<UpdateEpisodeScriptResponse>(`/episodes/${scriptId}/script`, {
    scriptContent
  });
  return response.data;
}

export async function updateEpisodeStage(
  scriptId: number,
  currentStage: EpisodeItem['currentStage']
) {
  const response = await request.patch<UpdateEpisodeStageResponse>(`/episodes/${scriptId}/stage`, {
    currentStage
  });
  return response.data;
}
