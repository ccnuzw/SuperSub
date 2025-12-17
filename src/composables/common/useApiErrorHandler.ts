/**
 * @fileoverview Composable for standardized API error handling and retry logic
 * Provides centralized error handling with automatic retry, user feedback, and logging
 */

import { ref, Ref } from 'vue';
import { useNotifications } from './useNotifications';

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Error types
 */
export type ErrorType =
  | 'network'
  | 'timeout'
  | 'auth'
  | 'permission'
  | 'validation'
  | 'not_found'
  | 'server_error'
  | 'rate_limit'
  | 'unknown';

/**
 * API error structure
 */
export interface ApiError {
  /** Error type classification */
  type: ErrorType;
  /** HTTP status code */
  status?: number;
  /** Error message */
  message: string;
  /** Error code from server */
  code?: string;
  /** Field-specific validation errors */
  fieldErrors?: Record<string, string[]>;
  /** Raw error object */
  raw?: unknown;
  /** Timestamp of error */
  timestamp: Date;
  /** Request URL that failed */
  url?: string;
  /** HTTP method */
  method?: string;
  /** Request payload */
  payload?: unknown;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Base delay between retries (ms) */
  baseDelay: number;
  /** Exponential backoff multiplier */
  backoffMultiplier: number;
  /** Maximum delay between retries (ms) */
  maxDelay: number;
  /** Retry condition function */
  shouldRetry?: (error: ApiError) => boolean;
  /** On retry callback */
  onRetry?: (attempt: number, error: ApiError) => void;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  shouldRetry: (error) => {
    // Retry on network errors, timeouts, 5xx errors, and rate limiting
    return error.type === 'network' ||
           error.type === 'timeout' ||
           error.type === 'server_error' ||
           error.type === 'rate_limit';
  },
};

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  /** Retry configuration */
  retry?: Partial<RetryConfig>;
  /** Whether to show notifications automatically */
  showNotifications?: boolean;
  /** Whether to log errors to console */
  logErrors?: boolean;
  /** Custom error message mapping */
  messages?: Partial<Record<ErrorType, string>>;
  /** Global error callback */
  onError?: (error: ApiError) => void;
  /** Custom success messages */
  successMessages?: Record<string, string>;
}

/**
 * Error message templates
 */
export const ERROR_MESSAGES: Record<ErrorType, string> = {
  network: '网络连接失败，请检查网络设置',
  timeout: '请求超时，请稍后重试',
  auth: '身份验证失败，请重新登录',
  permission: '权限不足，无法执行此操作',
  validation: '输入数据无效，请检查后重试',
  not_found: '请求的资源不存在',
  server_error: '服务器错误，请稍后重试',
  rate_limit: '请求过于频繁，请稍后重试',
  unknown: '操作失败，请重试',
};

/**
 * Success message templates
 */
export const SUCCESS_MESSAGES = {
  create: '创建成功',
  update: '更新成功',
  delete: '删除成功',
  get: '获取成功',
  upload: '上传成功',
  export: '导出成功',
  import: '导入成功',
};

/**
 * Composable for standardized API error handling
 *
 * Provides comprehensive error handling including:
 * - Error classification and type detection
 * - Automatic retry with exponential backoff
 * - User-friendly error messages
 * - Validation error handling
 * - Rate limiting detection
 * - Authentication error handling
 * - Error logging and monitoring
 *
 * @example
 * ```typescript
 * const { handleError, executeWithRetry, wrapApiCall } = useApiErrorHandler();
 *
 * // Handle error manually
 * try {
 *   await apiCall();
 * } catch (error) {
 *   await handleError(error, { context: 'User creation' });
 * }
 *
 * // Auto-retry with error handling
 * const result = await executeWithRetry(() => apiCall(), {
 *   maxAttempts: 5,
 *   successMessage: 'Data loaded successfully'
 * });
 *
 * // Wrap API call with automatic handling
 * const wrappedCall = wrapApiCall(api.fetchUsers, {
 *   errorMessage: 'Failed to load users',
 *   showLoading: true
 * });
 * const users = await wrappedCall();
 * ```
 */
export function useApiErrorHandler(config: ErrorHandlerConfig = {}) {
  const notifications = useNotifications();

  const {
    retry: retryConfig = {},
    showNotifications = true,
    logErrors = true,
    messages = {},
    onError,
    successMessages = {},
  } = config;

  // Reactive state
  const isLoading = ref(false);
  const lastError = ref<ApiError | null>(null);
  const errorHistory = ref<ApiError[]>([]);

  /**
   * Classify error type from HTTP status and error object
   */
  const classifyError = (error: unknown): ApiError => {
    const apiError: ApiError = {
      type: 'unknown',
      message: ERROR_MESSAGES.unknown,
      timestamp: new Date(),
    };

    if (error && typeof error === 'object') {
      const errorObj = error as any;

      // Handle HTTP response errors
      if ('response' in errorObj) {
        const response = errorObj.response || {};
        apiError.status = response.status;
        apiError.url = response.config?.url;
        apiError.method = response.config?.method?.toUpperCase();
        apiError.payload = response.config?.data;

        // Extract message from response
        if (response.data) {
          if (typeof response.data.message === 'string') {
            apiError.message = response.data.message;
          } else if (typeof response.data.error === 'string') {
            apiError.message = response.data.error;
          }

          // Extract validation errors
          if (response.data.errors && typeof response.data.errors === 'object') {
            apiError.fieldErrors = response.data.errors;
          }

          // Extract error code
          if (response.data.code) {
            apiError.code = response.data.code;
          }
        }

        // Classify by status code
        if (response.status) {
          switch (response.status) {
            case HTTP_STATUS.UNAUTHORIZED:
              apiError.type = 'auth';
              apiError.message = response.data?.message || ERROR_MESSAGES.auth;
              break;
            case HTTP_STATUS.FORBIDDEN:
              apiError.type = 'permission';
              apiError.message = response.data?.message || ERROR_MESSAGES.permission;
              break;
            case HTTP_STATUS.NOT_FOUND:
              apiError.type = 'not_found';
              apiError.message = response.data?.message || ERROR_MESSAGES.not_found;
              break;
            case HTTP_STATUS.UNPROCESSABLE_ENTITY:
              apiError.type = 'validation';
              apiError.message = response.data?.message || ERROR_MESSAGES.validation;
              break;
            case HTTP_STATUS.TOO_MANY_REQUESTS:
              apiError.type = 'rate_limit';
              apiError.message = response.data?.message || ERROR_MESSAGES.rate_limit;
              break;
            case HTTP_STATUS.INTERNAL_SERVER_ERROR:
            case HTTP_STATUS.BAD_GATEWAY:
            case HTTP_STATUS.SERVICE_UNAVAILABLE:
            case HTTP_STATUS.GATEWAY_TIMEOUT:
              apiError.type = 'server_error';
              apiError.message = response.data?.message || ERROR_MESSAGES.server_error;
              break;
            case HTTP_STATUS.BAD_REQUEST:
              apiError.type = 'validation';
              apiError.message = response.data?.message || ERROR_MESSAGES.validation;
              break;
            default:
              apiError.type = 'unknown';
              break;
          }
        }
      }
      // Handle network errors
      else if ('code' in errorObj) {
        switch (errorObj.code) {
          case 'NETWORK_ERROR':
          case 'ERR_NETWORK':
            apiError.type = 'network';
            apiError.message = ERROR_MESSAGES.network;
            break;
          case 'TIMEOUT':
          case 'ECONNABORTED':
            apiError.type = 'timeout';
            apiError.message = ERROR_MESSAGES.timeout;
            break;
          default:
            if (errorObj.message) {
              apiError.message = errorObj.message;
            }
            break;
        }
      }
      // Handle Error objects
      else if (error instanceof Error) {
        apiError.message = error.message;
        apiError.type = 'unknown';

        // Detect network errors by message content
        if (error.message.includes('network') || error.message.includes('fetch')) {
          apiError.type = 'network';
        } else if (error.message.includes('timeout')) {
          apiError.type = 'timeout';
        }
      }
    } else if (typeof error === 'string') {
      apiError.message = error;
      apiError.type = 'unknown';
    }

    // Apply custom messages
    if (messages[apiError.type]) {
      apiError.message = messages[apiError.type]!;
    }

    apiError.raw = error;

    return apiError;
  };

  /**
   * Handle API error with user feedback and logging
   */
  const handleError = async (
    error: unknown,
    options: {
      context?: string;
      customMessage?: string;
      showNotification?: boolean;
      logError?: boolean;
      silent?: boolean;
    } = {}
  ): Promise<ApiError> => {
    const {
      context,
      customMessage,
      showNotification = showNotifications,
      logError = logErrors,
      silent = false,
    } = options;

    const apiError = classifyError(error);

    // Add context to message
    if (context && !silent) {
      apiError.message = `${context}: ${apiError.message}`;
    }

    // Apply custom message
    if (customMessage) {
      apiError.message = customMessage;
    }

    // Update state
    lastError.value = apiError;
    errorHistory.value.unshift(apiError);

    // Limit history size
    if (errorHistory.value.length > 50) {
      errorHistory.value = errorHistory.value.slice(0, 50);
    }

    // Log error
    if (logError && !silent) {
      console.error('API Error:', {
        type: apiError.type,
        message: apiError.message,
        status: apiError.status,
        url: apiError.url,
        method: apiError.method,
        timestamp: apiError.timestamp,
        raw: apiError.raw,
      });
    }

    // Show notification
    if (showNotification && !silent) {
      switch (apiError.type) {
        case 'validation':
          if (apiError.fieldErrors) {
            notifications.showValidationErrors(apiError.fieldErrors);
          } else {
            notifications.error(apiError.message);
          }
          break;
        case 'auth':
          notifications.error(apiError.message);
          // Trigger login redirect or token refresh here
          break;
        case 'rate_limit':
          notifications.warning(apiError.message);
          break;
        case 'network':
        case 'timeout':
          notifications.error(apiError.message);
          break;
        default:
          notifications.error(apiError.message);
          break;
      }
    }

    // Call global error handler
    try {
      onError?.(apiError);
    } catch (handlerError) {
      console.error('Error in global error handler:', handlerError);
    }

    return apiError;
  };

  /**
   * Execute function with automatic retry on failure
   */
  const executeWithRetry = async <T>(
    fn: () => Promise<T>,
    options: {
      retry?: Partial<RetryConfig>;
      context?: string;
      successMessage?: string;
      errorMessage?: string;
      showLoading?: boolean;
      onSuccess?: (result: T) => void;
    } = {}
  ): Promise<T> => {
    const {
      retry: customRetry = {},
      context,
      successMessage,
      errorMessage,
      showLoading = false,
      onSuccess,
    } = options;

    const retryOptions = { ...DEFAULT_RETRY_CONFIG, ...retryConfig, ...customRetry };
    let lastApiError: ApiError | null = null;

    if (showLoading) {
      isLoading.value = true;
    }

    try {
      for (let attempt = 1; attempt <= retryOptions.maxAttempts; attempt++) {
        try {
          const result = await fn();

          // Success - reset error state
          lastError.value = null;

          // Show success message
          if (successMessage && showNotifications) {
            notifications.success(successMessage);
          }

          // Call success callback
          onSuccess?.(result);

          return result;

        } catch (error) {
          lastApiError = classifyError(error);

          // Check if we should retry
          if (attempt === retryOptions.maxAttempts || !retryOptions.shouldRetry?.(lastApiError)) {
            throw lastApiError;
          }

          // Calculate delay with exponential backoff
          const delay = Math.min(
            retryOptions.baseDelay * Math.pow(retryOptions.backoffMultiplier, attempt - 1),
            retryOptions.maxDelay
          );

          // Call retry callback
          retryOptions.onRetry?.(attempt, lastApiError);

          // Show retry notification
          if (showNotifications && attempt < retryOptions.maxAttempts) {
            notifications.warning(`操作失败，${delay / 1000}秒后重试 (${attempt}/${retryOptions.maxAttempts})`);
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastApiError;

    } catch (error) {
      // Handle final error
      const apiError = await handleError(error, {
        context: context || errorMessage,
        showNotification: !errorMessage,
      });

      if (errorMessage && showNotifications) {
        notifications.error(errorMessage);
      }

      throw apiError;

    } finally {
      if (showLoading) {
        isLoading.value = false;
      }
    }
  };

  /**
   * Wrap API call with automatic error handling
   */
  const wrapApiCall = <T extends any[], R>(
    apiFn: (...args: T) => Promise<R>,
    options: {
      context?: string;
      successMessage?: string;
      errorMessage?: string;
      retry?: Partial<RetryConfig>;
      showLoading?: boolean;
      silent?: boolean;
    } = {}
  ) => {
    return async (...args: T): Promise<R> => {
      return executeWithRetry(() => apiFn(...args), options);
    };
  };

  /**
   * Check if error is authentication related
   */
  const isAuthError = (error: unknown): boolean => {
    const apiError = error instanceof Object && 'type' in error
      ? error as ApiError
      : classifyError(error);
    return apiError.type === 'auth';
  };

  /**
   * Check if error is network related
   */
  const isNetworkError = (error: unknown): boolean => {
    const apiError = error instanceof Object && 'type' in error
      ? error as ApiError
      : classifyError(error);
    return apiError.type === 'network' || apiError.type === 'timeout';
  };

  /**
   * Check if error is validation related
   */
  const isValidationError = (error: unknown): boolean => {
    const apiError = error instanceof Object && 'type' in error
      ? error as ApiError
      : classifyError(error);
    return apiError.type === 'validation';
  };

  /**
   * Get retry count for specific URL
   */
  const getRetryCount = (url: string): number => {
    return errorHistory.value.filter(
      error => error.url === url && error.type !== 'unknown'
    ).length;
  };

  /**
   * Clear error history
   */
  const clearErrors = (): void => {
    lastError.value = null;
    errorHistory.value = [];
  };

  /**
   * Get error statistics
   */
  const getErrorStats = () => {
    const stats = {
      total: errorHistory.value.length,
      byType: {} as Record<ErrorType, number>,
      byStatus: {} as Record<number, number>,
      recent: errorHistory.value.slice(0, 10),
    };

    errorHistory.value.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      if (error.status) {
        stats.byStatus[error.status] = (stats.byStatus[error.status] || 0) + 1;
      }
    });

    return stats;
  };

  /**
   * Handle authentication token refresh
   */
  const handleAuthRefresh = async (refreshFn: () => Promise<string>): Promise<boolean> => {
    try {
      const newToken = await refreshFn();
      // Store new token (implementation depends on auth system)
      localStorage.setItem('auth_token', newToken);
      return true;
    } catch (error) {
      await handleError(error, {
        context: 'Token refresh',
        silent: true,
      });
      return false;
    }
  };

  return {
    // State
    isLoading: isLoading as Readonly<Ref<boolean>>,
    lastError: lastError as Readonly<Ref<ApiError | null>>,
    errorHistory: errorHistory as Readonly<Ref<ApiError[]>>,

    // Core error handling
    handleError,
    classifyError,

    // Retry functionality
    executeWithRetry,
    wrapApiCall,

    // Utility functions
    isAuthError,
    isNetworkError,
    isValidationError,
    getRetryCount,

    // Management
    clearErrors,
    getErrorStats,
    handleAuthRefresh,

    // Constants
    HTTP_STATUS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
  };
}

/**
 * Default export
 */
export default useApiErrorHandler;