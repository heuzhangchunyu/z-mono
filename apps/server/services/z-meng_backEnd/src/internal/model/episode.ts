export const EPISODE_STAGES = ['script', 'subject', 'keyframes', 'video-production'] as const;
export const EPISODE_STYLES = ['动漫', '真人'] as const;
export const EPISODE_ASPECT_RATIOS = ['16:9', '9:16', '1:1'] as const;

export type EpisodeStage = typeof EPISODE_STAGES[number];
export type EpisodeStyle = typeof EPISODE_STYLES[number];
export type EpisodeAspectRatio = typeof EPISODE_ASPECT_RATIOS[number];

export interface EpisodeRecord {
  scriptId: number;
  userId: number | null;
  username: string | null;
  episodeName: string;
  scriptContent: string;
  currentStage: EpisodeStage;
  style: EpisodeStyle;
  aspectRatio: EpisodeAspectRatio;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEpisodeInput {
  userId: number;
  episodeName: string;
  style: EpisodeStyle;
  aspectRatio: EpisodeAspectRatio;
}

export interface CreateEpisodePayload {
  episodeName?: string;
  style?: EpisodeStyle;
  aspectRatio?: EpisodeAspectRatio;
}

export interface UpdateEpisodeScriptPayload {
  scriptContent?: string;
}

export interface UpdateEpisodeStagePayload {
  currentStage?: EpisodeStage;
}
