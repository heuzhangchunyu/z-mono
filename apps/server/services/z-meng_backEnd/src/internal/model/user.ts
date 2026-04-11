export interface UserRecord {
  id: number;
  username: string;
  passwordHash: string;
  displayName: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  username: string;
  passwordHash: string;
  displayName?: string | null;
}
