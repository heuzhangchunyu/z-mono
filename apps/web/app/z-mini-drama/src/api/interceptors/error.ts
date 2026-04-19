import type { AxiosError } from 'axios';

interface ErrorPayload {
  message?: string;
  error?: string;
}

export function createErrorMessage(error: AxiosError<unknown>) {
  const responseData = error.response?.data as ErrorPayload | undefined;

  if (responseData?.error) {
    return responseData.error;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (error.code === 'ECONNABORTED') {
    return '请求超时，请稍后重试';
  }

  return error.message || '请求失败，请稍后重试';
}
