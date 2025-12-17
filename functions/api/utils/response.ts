/**
 * API响应格式化工具
 * 统一API响应格式
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
}

/**
 * 成功响应
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * 错误响应
 */
export function createErrorResponse(
  message: string,
  code?: string,
  details?: any
): ApiError {
  return {
    success: false,
    message,
    code,
    details,
    timestamp: new Date().toISOString()
  };
}

/**
 * 验证错误响应
 */
export function createValidationError(errors: string[]): ApiError {
  return createErrorResponse('Validation failed', 'VALIDATION_ERROR', errors);
}

/**
 * 认证错误响应
 */
export function createAuthError(message: string = 'Authentication failed'): ApiError {
  return createErrorResponse(message, 'AUTH_ERROR');
}

/**
 * 权限错误响应
 */
export function createForbiddenError(message: string = 'Access denied'): ApiError {
  return createErrorResponse(message, 'FORBIDDEN');
}

/**
 * 资源未找到错误响应
 */
export function createNotFoundError(message: string = 'Resource not found'): ApiError {
  return createErrorResponse(message, 'NOT_FOUND');
}

/**
 * 服务器错误响应
 */
export function createServerError(message: string = 'Internal server error'): ApiError {
  return createErrorResponse(message, 'SERVER_ERROR');
}