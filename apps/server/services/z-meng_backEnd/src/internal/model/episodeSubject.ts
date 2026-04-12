export const EPISODE_SUBJECT_STATUSES = ['waiting', 'processing', 'success', 'failed'] as const;

export type EpisodeSubjectStatus = typeof EPISODE_SUBJECT_STATUSES[number];

export interface EpisodeSubjectRecord {
  scriptId: number;
  status: EpisodeSubjectStatus;
  characters: string[];
  scenes: string[];
  props: string[];
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeSubjectExtractionResult {
  characters: string[];
  scenes: string[];
  props: string[];
}
