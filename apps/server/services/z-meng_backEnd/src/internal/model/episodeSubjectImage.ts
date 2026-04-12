export const EPISODE_SUBJECT_IMAGE_STATUSES = ['waiting', 'processing', 'success', 'failed'] as const;

export type EpisodeSubjectImageStatus = typeof EPISODE_SUBJECT_IMAGE_STATUSES[number];

export interface EpisodeSubjectImageRecord {
  id: number;
  subjectItemId: number;
  scriptId: number;
  subjectType: 'character' | 'scene' | 'prop';
  subjectName: string;
  prompt: string;
  imageUrl: string | null;
  status: EpisodeSubjectImageStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EpisodeSubjectImageFeed {
  subjectItemId: number;
  status: EpisodeSubjectImageStatus;
  records: EpisodeSubjectImageRecord[];
}

export interface CreateEpisodeSubjectImagePayload {
  prompt?: string;
}
