export interface UserRecord {
  id: number;
  username: string;
  passwordHash: string;
  nickname: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentUserResponse {
  id: number;
  username: string;
  nickname: string;
  role: string;
  created_at: string;
}
