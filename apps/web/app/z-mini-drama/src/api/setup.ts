import axios, { type AxiosError, type AxiosResponse } from 'axios';
import { createErrorMessage } from './interceptors/error';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4101/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

request.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => Promise.reject(new Error(createErrorMessage(error)))
);

export default request;
