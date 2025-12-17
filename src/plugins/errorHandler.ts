/**
 * Vue 错误处理插件
 * 为Vue应用提供全局错误处理能力
 */

import { App, Plugin } from 'vue';
import ErrorHandler, { AppError, AppErrorType, ErrorSeverity } from '@/utils/errorHandler';

/**
 * 错误处理插件配置
 */
export interface ErrorHandlerPluginOptions {
  // 是否启用全局错误处理
  enableGlobalHandlers?: boolean;

  // 是否启用错误监控
  enableMonitoring?: boolean;

  // 自定义错误映射
  errorMappings?: Record<string, AppErrorType>;

  // 默认错误上下文
  defaultContext?: Record<string, any>;

  // 错误监听器
  onError?: (error: AppError) => void;
}

/**
 * 错误处理插件
 */
export const ErrorHandlerPlugin: Plugin = {
  install(app: App, options: ErrorHandlerPluginOptions = {}) {
    const {
      enableGlobalHandlers = true,
      enableMonitoring = true,
      errorMappings = {},
      defaultContext = {},
      onError
    } = options;

    // 设置错误监控
    ErrorHandler.setMonitoring(enableMonitoring);

    // 设置默认上下文
    Object.entries(defaultContext).forEach(([key, value]) => {
      ErrorHandler.setContext(key, value);
    });

    // 添加自定义错误监听器
    if (onError) {
      ErrorHandler.addErrorListener(onError);
    }

    // 设置全局错误处理器
    if (enableGlobalHandlers) {
      ErrorHandler.setupGlobalHandlers();
    }

    // Vue错误处理器
    app.config.errorHandler = (err, instance, info) => {
      const error = ErrorHandler.handle(err, {
        type: 'vue',
        info,
        component: (instance as any)?.$options.__name || (instance as any)?.$type?.name,
        props: instance?.$props
      });

      // 可选：在控制台显示Vue特定的调试信息
      if (process.env.NODE_ENV === 'development') {
        console.group('🔥 Vue Error');
        console.error('Error:', error);
        console.error('Component:', instance);
        console.error('Info:', info);
        console.groupEnd();
      }
    };

    // Vue警告处理器
    app.config.warnHandler = (msg, instance, trace) => {
      const warning = ErrorHandler.create(
        AppErrorType.SYSTEM,
        `Vue Warning: ${msg}`,
        {
          severity: ErrorSeverity.LOW,
          code: 'VUE_WARNING',
          context: {
            component: instance?.$options.__name,
            trace
          }
        }
      );

      console.warn('⚠️ Vue Warning:', {
        message: msg,
        component: instance,
        trace,
        warning
      });
    };

    // 提供全局方法
    app.config.globalProperties.$handleError = ErrorHandler.handle.bind(ErrorHandler);
    app.config.globalProperties.$createError = ErrorHandler.create.bind(ErrorHandler);
    app.config.globalProperties.$setErrorContext = ErrorHandler.setContext.bind(ErrorHandler);

    // Provide to composition API
    app.provide('errorHandler', ErrorHandler);
    app.provide('createError', ErrorHandler.create.bind(ErrorHandler));
    app.provide('setErrorContext', ErrorHandler.setContext.bind(ErrorHandler));
  }
};

/**
 * 组合式API - 错误处理Hook
 */
export function useErrorHandler() {
  const handleError = ErrorHandler.handle.bind(ErrorHandler);
  const createError = ErrorHandler.create.bind(ErrorHandler);
  const setErrorContext = ErrorHandler.setContext.bind(ErrorHandler);

  /**
   * 安全执行函数
   */
  const safeExecute = async <T>(
    fn: () => Promise<T>,
    options?: {
      errorMessage?: string;
      errorType?: AppErrorType;
      context?: Record<string, any>;
      rethrow?: boolean;
    }
  ): Promise<T | null> => {
    try {
      return await fn();
    } catch (error) {
      const appError = handleError(error, {
        ...options?.context
      });

      if (options?.rethrow) {
        throw appError;
      }

      return null;
    }
  };

  /**
   * 安全执行同步函数
   */
  const safeExecuteSync = <T>(
    fn: () => T,
    options?: {
      errorMessage?: string;
      errorType?: AppErrorType;
      context?: Record<string, any>;
      rethrow?: boolean;
    }
  ): T | null => {
    try {
      return fn();
    } catch (error) {
      const appError = handleError(error, {
        ...options?.context
      });

      if (options?.rethrow) {
        throw appError;
      }

      return null;
    }
  };

  /**
   * 创建错误边界
   */
  const createErrorBoundary = (fallback?: () => void) => {
    return (error: Error, instance: any, info: string) => {
      handleError(error, {
        type: 'vue',
        info,
        component: instance?.$options.__name
      });

      if (fallback) {
        fallback();
      }
    };
  };

  return {
    handleError,
    createError,
    setErrorContext,
    safeExecute,
    safeExecuteSync,
    createErrorBoundary
  };
}

/**
 * 验证错误类型
 */
export function isErrorType(value: string): value is AppErrorType {
  return Object.values(AppErrorType).includes(value as AppErrorType);
}

/**
 * 创建特定类型的错误
 */
export function createNetworkError(message: string = '网络连接失败'): AppError {
  return ErrorHandler.create(AppErrorType.NETWORK, message, {
    severity: ErrorSeverity.MEDIUM,
    code: 'NETWORK_ERROR'
  });
}

export function createValidationError(
  message: string,
  details?: any
): AppError {
  return ErrorHandler.create(AppErrorType.VALIDATION, message, {
    severity: ErrorSeverity.MEDIUM,
    code: 'VALIDATION_ERROR',
    details
  });
}

export function createAuthError(message: string = '认证失败'): AppError {
  return ErrorHandler.create(AppErrorType.AUTHENTICATION, message, {
    severity: ErrorSeverity.HIGH,
    code: 'AUTH_ERROR'
  });
}

export function createBusinessError(message: string, details?: any): AppError {
  return ErrorHandler.create(AppErrorType.BUSINESS, message, {
    severity: ErrorSeverity.MEDIUM,
    code: 'BUSINESS_ERROR',
    details
  });
}

export function createSystemError(
  message: string,
  details?: any
): AppError {
  return ErrorHandler.create(AppErrorType.SYSTEM, message, {
    severity: ErrorSeverity.HIGH,
    code: 'SYSTEM_ERROR',
    details
  });
}

// 导出默认插件
export default ErrorHandlerPlugin;