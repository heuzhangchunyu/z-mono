export type AuthMode = 'login' | 'register';

export interface AuthFormValues {
  username: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthCopy {
  title: string;
  subtitle: string;
  submit: string;
  success: string;
}

export interface AuthSuccessPayload {
  mode: AuthMode;
  username: string;
}
