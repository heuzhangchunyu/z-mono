import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { createErrorMessage } from '@/api/interceptors/error';
import { clearAuthSession, getAccessToken } from '@/services/auth/auth';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = getAccessToken();

  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

request.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<unknown>) => {
    if (error.response?.status === 401) {
      clearAuthSession();

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(new Error(createErrorMessage(error)));
  }
);

export default request;
