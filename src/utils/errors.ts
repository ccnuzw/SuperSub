/**
 * @deprecated 使用 src/utils/errorHandler.ts 替代
 * 此文件将在重构完成后移除
 */

import { AppError, AppErrorType, ErrorSeverity } from './errorHandler';

/**
 * 登录进行中错误
 * @deprecated 使用 AppErrorType.USER_CANCEL 替代
 */
export class LogoutInProgressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LogoutInProgressError';
  }
}

/**
 * 网络错误
 * @deprecated 使用 createNetworkError() 替代
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * 验证错误
 * @deprecated 使用 createValidationError() 替代
 */
export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 认证错误
 * @deprecated 使用 createAuthError() 替代
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * 业务错误
 * @deprecated 使用 createBusinessError() 替代
 */
export class BusinessError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'BusinessError';
  }
}

// 为了向后兼容，创建迁移函数
export function migrateToAppError(oldError: Error): AppError {
  if (oldError instanceof AppError) {
    return oldError;
  }

  if (oldError instanceof LogoutInProgressError) {
    return new AppError(
      AppErrorType.USER_CANCEL,
      oldError.message,
      ErrorSeverity.LOW,
      'LOGOUT_IN_PROGRESS',
      undefined,
      { originalError: oldError },
      oldError
    );
  }

  if (oldError instanceof NetworkError) {
    return new AppError(
      AppErrorType.NETWORK,
      oldError.message,
      ErrorSeverity.MEDIUM,
      'NETWORK_ERROR',
      undefined,
      { originalError: oldError },
      oldError
    );
  }

  if (oldError instanceof ValidationError) {
    return new AppError(
      AppErrorType.VALIDATION,
      oldError.message,
      ErrorSeverity.MEDIUM,
      'VALIDATION_ERROR',
      oldError.details,
      { originalError: oldError },
      oldError
    );
  }

  if (oldError instanceof AuthError) {
    return new AppError(
      AppErrorType.AUTHENTICATION,
      oldError.message,
      ErrorSeverity.HIGH,
      'AUTH_ERROR',
      undefined,
      { originalError: oldError },
      oldError
    );
  }

  if (oldError instanceof BusinessError) {
    return new AppError(
      AppErrorType.BUSINESS,
      oldError.message,
      ErrorSeverity.MEDIUM,
      'BUSINESS_ERROR',
      oldError.details,
      { originalError: oldError },
      oldError
    );
  }

  // 默认转换为系统错误
  return new AppError(
    AppErrorType.SYSTEM,
    oldError.message,
    ErrorSeverity.MEDIUM,
    'LEGACY_ERROR',
    { originalError: oldError },
    { originalError: oldError },
    oldError
  );
}

// 添加废弃警告
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '⚠️  src/utils/errors.ts is deprecated. ' +
    'Please use src/utils/errorHandler.ts and AppError instead. ' +
    'This file will be removed in the next version.'
  );
}