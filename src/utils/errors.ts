export class LogoutInProgressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LogoutInProgressError';
  }
}

/**
 * 从未知错误对象中提取错误消息
 * 用于替代 catch(error: any) 中的 error.message 访问
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '未知错误';
}

/**
 * 从 API 响应错误中提取消息
 * 用于替代 error.response?.data?.message 访问
 */
export function getApiErrorMessage(error: unknown, fallback: string = '请求失败'): string {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (err.response && typeof err.response === 'object') {
      const response = err.response as Record<string, unknown>;
      if (response.data && typeof response.data === 'object') {
        const data = response.data as Record<string, unknown>;
        if (typeof data.message === 'string') {
          return data.message;
        }
      }
    }
  }
  return fallback;
}