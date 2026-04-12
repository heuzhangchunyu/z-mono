export const EPISODE_SUBJECT_STATUSES = ['waiting', 'processing', 'success', 'failed'] as const;
export const EPISODE_SUBJECT_TYPES = ['character', 'scene', 'prop'] as const;

export type EpisodeSubjectStatus = typeof EPISODE_SUBJECT_STATUSES[number];
export type EpisodeSubjectType = typeof EPISODE_SUBJECT_TYPES[number];

export interface EpisodeSubjectItemRecord {
  id: number;
  scriptId: number;
  subjectType: EpisodeSubjectType;
  subjectName: string;
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeSubjectRecord {
  scriptId: number;
  status: EpisodeSubjectStatus;
  items: EpisodeSubjectItemRecord[];
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
