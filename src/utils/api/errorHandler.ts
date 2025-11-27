import type { ApiError } from '@/types/entities';

// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 标准化的错误信息
export const ERROR_MESSAGES = {
  [ErrorType.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
  [ErrorType.AUTH_ERROR]: '认证失败，请重新登录',
  [ErrorType.VALIDATION_ERROR]: '数据验证失败，请检查输入',
  [ErrorType.SERVER_ERROR]: '服务器错误，请稍后重试',
  [ErrorType.UNKNOWN_ERROR]: '未知错误，请联系管理员'
} as const;

/**
 * 处理API错误并返回用户友好的错误信息
 */
export const handleApiError = (error: unknown): string => {
  // 如果是自定义API错误
  if (error && typeof error === 'object' && 'message' in error) {
    const apiError = error as ApiError;
    return apiError.message;
  }

  // 如果是Error实例
  if (error instanceof Error) {
    const message = error.message;

    // 网络相关错误
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return ERROR_MESSAGES[ErrorType.NETWORK_ERROR];
    }

    // 认证相关错误
    if (message.includes('401') || message.includes('Unauthorized') || message.includes('认证')) {
      return ERROR_MESSAGES[ErrorType.AUTH_ERROR];
    }

    // 验证相关错误
    if (message.includes('400') || message.includes('Validation') || message.includes('验证')) {
      return ERROR_MESSAGES[ErrorType.VALIDATION_ERROR];
    }

    // 服务器错误
    if (message.includes('500') || message.includes('服务器')) {
      return ERROR_MESSAGES[ErrorType.SERVER_ERROR];
    }

    // 返回原始错误���息
    return message;
  }

  // 其他情况返回未知错误
  return ERROR_MESSAGES[ErrorType.UNKNOWN_ERROR];
};

/**
 * 获取错误类型
 */
export const getErrorType = (error: unknown): ErrorType => {
  if (error instanceof Error) {
    const message = error.message;

    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return ErrorType.NETWORK_ERROR;
    }

    if (message.includes('401') || message.includes('Unauthorized') || message.includes('认证')) {
      return ErrorType.AUTH_ERROR;
    }

    if (message.includes('400') || message.includes('Validation') || message.includes('验证')) {
      return ErrorType.VALIDATION_ERROR;
    }

    if (message.includes('500') || message.includes('服务器')) {
      return ErrorType.SERVER_ERROR;
    }
  }

  return ErrorType.UNKNOWN_ERROR;
};

/**
 * 判断是否为可重试的错误
 */
export const isRetryableError = (error: unknown): boolean => {
  const errorType = getErrorType(error);

  // 网络错误和服务器错误可以重试
  return errorType === ErrorType.NETWORK_ERROR || errorType === ErrorType.SERVER_ERROR;
};

/**
 * 判断是否需要重新登录
 */
export const requiresReauth = (error: unknown): boolean => {
  const errorType = getErrorType(error);
  return errorType === ErrorType.AUTH_ERROR;
};

/**
 * 标准化的错误响应
 */
export const createErrorResponse = (message: string, code?: number, details?: any) => ({
  success: false,
  error: message,
  message,
  code,
  details
});

/**
 * 日志记录
 */
export const logError = (error: unknown, context?: string) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    type: getErrorType(error),
    message: handleApiError(error),
    originalError: error
  };

  // 开发环境下输出到控制台
  if (import.meta.env.DEV) {
    console.error('Error logged:', errorInfo);
  }

  // 生产环境可以发送到错误监控服务
  // 例如：Sentry, LogRocket 等
  // sendToErrorMonitoring(errorInfo);
};