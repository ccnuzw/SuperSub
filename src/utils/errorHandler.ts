/**
 * 统一错误处理系统
 * 提供全局错误处理、分类、报告和用户友好的错误提示
 */

import type { ApiError } from '@/services/http/HttpClient';

/**
 * 应用错误类型枚举
 */
export enum AppErrorType {
  // 网络相关错误
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  OFFLINE = 'OFFLINE',

  // 认证相关错误
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // 验证相关错误
  VALIDATION = 'VALIDATION',
  FORM_VALIDATION = 'FORM_VALIDATION',
  REQUIRED_FIELD = 'REQUIRED_FIELD',

  // 业务逻辑错误
  BUSINESS = 'BUSINESS',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE = 'DUPLICATE',
  CONFLICT = 'CONFLICT',
  LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',

  // 系统错误
  SYSTEM = 'SYSTEM',
  INTERNAL = 'INTERNAL',
  MAINTENANCE = 'MAINTENANCE',
  CONFIGURATION = 'CONFIGURATION',

  // 用户操作错误
  USER_CANCEL = 'USER_CANCEL',
  USER_INPUT = 'USER_INPUT',
  INVALID_OPERATION = 'INVALID_OPERATION',

  // 未知错误
  UNKNOWN = 'UNKNOWN'
}

/**
 * 错误严重级别
 */
export enum ErrorSeverity {
  LOW = 'low',      // 低：不影响核心功能
  MEDIUM = 'medium', // 中：影响部分功能
  HIGH = 'high',    // 高：影响核心功能
  CRITICAL = 'critical' // 严重：系统崩溃或数据丢失
}

/**
 * 应用错误基类
 */
export class AppError extends Error {
  constructor(
    public type: AppErrorType,
    message: string,
    public severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public code?: string,
    public details?: any,
    public context?: {
      component?: string;
      action?: string;
      userId?: string;
      [key: string]: any;
    },
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';

    // 确保错误堆栈正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * 转换为JSON对象
   */
  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      severity: this.severity,
      code: this.code,
      details: this.details,
      context: this.context,
      stack: this.stack,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 获取用户友好的错误消息
   */
  getUserMessage(): string {
    const userMessages = {
      [AppErrorType.NETWORK]: '网络连接失败，请检查网络设置',
      [AppErrorType.TIMEOUT]: '请求超时，请稍后重试',
      [AppErrorType.OFFLINE]: '您当前处于离线状态',
      [AppErrorType.AUTHENTICATION]: '登录已过期，请重新登录',
      [AppErrorType.AUTHORIZATION]: '权限不足，无法执行此操作',
      [AppErrorType.SESSION_EXPIRED]: '会话已过期，请重新登录',
      [AppErrorType.VALIDATION]: '输入数据格式不正确',
      [AppErrorType.FORM_VALIDATION]: '请检查表单中的错误信息',
      [AppErrorType.REQUIRED_FIELD]: '请填写必填字段',
      [AppErrorType.BUSINESS]: this.message,
      [AppErrorType.NOT_FOUND]: '请求的资源不存在',
      [AppErrorType.DUPLICATE]: '数据已存在，请勿重复创建',
      [AppErrorType.CONFLICT]: '数据冲突，请刷新后重试',
      [AppErrorType.LIMIT_EXCEEDED]: '操作数量超出限制',
      [AppErrorType.SYSTEM]: '系统错误，请稍后重试',
      [AppErrorType.INTERNAL]: '内部错误，请联系管理员',
      [AppErrorType.MAINTENANCE]: '系统正在维护中，请稍后再试',
      [AppErrorType.CONFIGURATION]: '配置错误，请联系管理员',
      [AppErrorType.USER_CANCEL]: '操作已取消',
      [AppErrorType.USER_INPUT]: '输入数���有误，请检查',
      [AppErrorType.INVALID_OPERATION]: '无效的操作',
      [AppErrorType.UNKNOWN]: '未知错误，请稍后重试'
    };

    return userMessages[this.type] || this.message;
  }

  /**
   * 是否应该显示给用户
   */
  shouldShowToUser(): boolean {
    const hiddenTypes = [
      AppErrorType.INTERNAL,
      AppErrorType.CONFIGURATION,
      AppErrorType.SYSTEM
    ];
    return !hiddenTypes.includes(this.type);
  }

  /**
   * 是否应该记录到错误监控服务
   */
  shouldLogToService(): boolean {
    const loggedTypes = [
      AppErrorType.NETWORK,
      AppErrorType.SYSTEM,
      AppErrorType.INTERNAL,
      AppErrorType.CONFIGURATION,
      AppErrorType.AUTHENTICATION,
      AppErrorType.AUTHORIZATION
    ];
    return loggedTypes.includes(this.type);
  }
}

/**
 * 错误上下文管理器
 */
export class ErrorContext {
  private context: Record<string, any> = {};

  /**
   * 设置上下文信息
   */
  set(key: string, value: any): void {
    this.context[key] = value;
  }

  /**
   * 获取上下文信息
   */
  get(key: string): any {
    return this.context[key];
  }

  /**
   * 移除上下文信息
   */
  remove(key: string): void {
    delete this.context[key];
  }

  /**
   * 清除所有上下文
   */
  clear(): void {
    this.context = {};
  }

  /**
   * 获取所有上下文
   */
  getAll(): Record<string, any> {
    return { ...this.context };
  }

  /**
   * 应用上下文到错误
   */
  applyToError(error: Error): Error {
    if (error instanceof AppError) {
      error.context = { ...error.context, ...this.context };
    }
    return error;
  }
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  private static errorContext = new ErrorContext();
  private static errorListeners: Array<(error: AppError) => void> = [];
  private static monitoringEnabled = true;

  /**
   * 设置错误上下文
   */
  static setContext(key: string, value: any): void {
    this.errorContext.set(key, value);
  }

  /**
   * 添加错误监听器
   */
  static addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener);
  }

  /**
   * 移除错误监听器
   */
  static removeErrorListener(listener: (error: AppError) => void): void {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * 启用/禁用错误监控
   */
  static setMonitoring(enabled: boolean): void {
    this.monitoringEnabled = enabled;
  }

  /**
   * 处理错误
   */
  static handle(
    error: any,
    context?: Partial<AppError['context']>
  ): AppError {
    // 规范化错误
    const appError = this.normalizeError(error, context);

    // 记录错误日志
    this.logError(appError);

    // 显示用户友好的错误提示
    this.showUserError(appError);

    // 发送到错误监控服务
    if (appError.shouldLogToService() && this.monitoringEnabled) {
      this.reportToService(appError);
    }

    // 通知错误监听器
    this.notifyListeners(appError);

    return appError;
  }

  /**
   * 规范化错误
   */
  private static normalizeError(
    error: any,
    context?: Partial<AppError['context']>
  ): AppError {
    // 如果已经是AppError，直接返回
    if (error instanceof AppError) {
      return error;
    }

    // 如果是API错误
    if (error.type && error.message) {
      return new AppError(
        this.mapApiErrorType(error.type),
        error.message,
        this.mapSeverity(error.status),
        error.code,
        error.details,
        { ...this.errorContext.getAll(), ...context },
        error
      );
    }

    // 根据错误类型创建AppError
    if (error?.response) {
      // HTTP响应错误
      const status = error.response.status;
      const data = error.response.data || {};

      return new AppError(
        this.mapHttpStatusError(status),
        data.message || `HTTP ${status} Error`,
        this.mapSeverity(status),
        data.code,
        data.errors || data.details,
        {
          status,
          url: error.config?.url,
          method: error.config?.method,
          ...this.errorContext.getAll(),
          ...context
        },
        error
      );
    }

    if (error?.request) {
      // 网络请求错误
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return new AppError(
          AppErrorType.TIMEOUT,
          '请求超时，请检查网络连接',
          ErrorSeverity.MEDIUM,
          'TIMEOUT_ERROR',
          { timeout: error.timeout, ...this.errorContext.getAll(), ...context },
          error
        );
      }

      return new AppError(
        AppErrorType.NETWORK,
        '网络连接失败，请检查网络设置',
        ErrorSeverity.MEDIUM,
        'NETWORK_ERROR',
        { ...this.errorContext.getAll(), ...context },
        error
      );
    }

    if (error instanceof Error) {
      // JavaScript原生错误
      return new AppError(
        AppErrorType.SYSTEM,
        error.message,
        ErrorSeverity.HIGH,
        'JS_ERROR',
        { stack: error.stack, ...this.errorContext.getAll(), ...context },
        error
      );
    }

    // 未知错误
    return new AppError(
      AppErrorType.UNKNOWN,
      error?.message || '未知错误',
      ErrorSeverity.MEDIUM,
      'UNKNOWN_ERROR',
      { originalError: error, ...this.errorContext.getAll(), ...context },
      error
    );
  }

  /**
   * 映射API错误类型
   */
  private static mapApiErrorType(apiType: string): AppErrorType {
    const mapping: Record<string, AppErrorType> = {
      'NETWORK': AppErrorType.NETWORK,
      'AUTHENTICATION': AppErrorType.AUTHENTICATION,
      'AUTHORIZATION': AppErrorType.AUTHORIZATION,
      'VALIDATION': AppErrorType.VALIDATION,
      'BUSINESS': AppErrorType.BUSINESS,
      'SYSTEM': AppErrorType.SYSTEM,
      'TIMEOUT': AppErrorType.TIMEOUT
    };

    return mapping[apiType] || AppErrorType.UNKNOWN;
  }

  /**
   * 映射HTTP状态码到错误类型
   */
  private static mapHttpStatusError(status: number): AppErrorType {
    if (status === 401) return AppErrorType.AUTHENTICATION;
    if (status === 403) return AppErrorType.AUTHORIZATION;
    if (status === 404) return AppErrorType.NOT_FOUND;
    if (status === 408) return AppErrorType.TIMEOUT;
    if (status === 409) return AppErrorType.CONFLICT;
    if (status === 422) return AppErrorType.VALIDATION;
    if (status === 429) return AppErrorType.LIMIT_EXCEEDED;
    if (status >= 500) return AppErrorType.SYSTEM;

    return AppErrorType.BUSINESS;
  }

  /**
   * 映射错误严重级别
   */
  private static mapSeverity(status?: number): ErrorSeverity {
    if (!status) return ErrorSeverity.MEDIUM;

    if (status >= 500) return ErrorSeverity.CRITICAL;
    if (status >= 400) return ErrorSeverity.HIGH;
    if (status >= 300) return ErrorSeverity.LOW;

    return ErrorSeverity.MEDIUM;
  }

  /**
   * 记录错误日志
   */
  private static logError(error: AppError): void {
    const logData = {
      type: error.type,
      message: error.message,
      severity: error.severity,
      code: error.code,
      details: error.details,
      context: error.context,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    // 根据严重级别选择日志级别
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error('🚨 [ERROR]', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('⚠️  [WARN]', logData);
        break;
      case ErrorSeverity.LOW:
        console.info('ℹ️  [INFO]', logData);
        break;
      default:
        console.log('📝 [LOG]', logData);
    }
  }

  /**
   * 显示用户友好的错误提示
   */
  private static showUserError(error: AppError): void {
    if (!error.shouldShowToUser()) {
      return;
    }

    const message = error.getUserMessage();

    // 检查是否有Naive UI的消息组件
    if (typeof window !== 'undefined' && (window as any).$message) {
      const messageApi = (window as any).$message;

      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
        case ErrorSeverity.HIGH:
          messageApi.error(message);
          break;
        case ErrorSeverity.MEDIUM:
          messageApi.warning(message);
          break;
        case ErrorSeverity.LOW:
        default:
          messageApi.info(message);
          break;
      }
    } else {
      // 备用方案：使用alert
      console.error('User Message:', message);
    }
  }

  /**
   * 发送到错误监控服务
   */
  private static reportToService(error: AppError): void {
    // 检查是否集成了Sentry等错误监控服务
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;

      Sentry.captureException(error.originalError || error, {
        tags: {
          errorType: error.type,
          severity: error.severity,
          component: error.context?.component,
          action: error.context?.action
        },
        extra: {
          errorCode: error.code,
          details: error.details,
          context: error.context
        }
      });
    }

    // 也可以发送到自定义错误收集API
    this.sendToCustomService(error);
  }

  /**
   * 发送到自定义错误收集服务
   */
  private static sendToCustomService(error: AppError): void {
    // 这里可以实现发送到自定义错误收集API的逻辑
    // 例如：发送到日志服务、数据库等

    try {
      const errorData = error.toJSON();

      // 这里可以添加发送逻辑
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorData)
      // }).catch(err => {
      //   console.warn('Failed to report error:', err);
      // });
    } catch (err) {
      console.warn('Failed to report error:', err);
    }
  }

  /**
   * 通知错误监听器
   */
  private static notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  /**
   * 全局错误处理函数
   */
  static setupGlobalHandlers(): void {
    // 处理未捕获的Promise错误
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        const error = this.handle(
          event.reason,
          { type: 'unhandledrejection', source: 'window' }
        );

        // 防止错误在控制台显示
        event.preventDefault();
      });

      // 处理JavaScript错误
      window.addEventListener('error', (event) => {
        this.handle(
          event.error || new Error(event.message),
          {
            type: 'javascript',
            source: 'window',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        );
      });
    }

    // 处理Vue错误
    const appElement = document.querySelector('#app') as any;
    const app = appElement?.__vue_app__;
    if (app?.config?.errorHandler) {
      const originalHandler = app.config.errorHandler;
      app.config.errorHandler = (err: any, instance: any, info: any) => {
        this.handle(err, { type: 'vue', info, component: instance?.$options.__name });

        if (originalHandler) {
          originalHandler(err, instance, info);
        }
      };
    }
  }

  /**
   * 创建特定类型的错误
   */
  static create(
    type: AppErrorType,
    message: string,
    options?: {
      severity?: ErrorSeverity;
      code?: string;
      details?: any;
      context?: Partial<AppError['context']>;
    }
  ): AppError {
    return new AppError(
      type,
      message,
      options?.severity,
      options?.code,
      options?.details,
      options?.context
    );
  }
}

// Convenience functions for backward compatibility
export function createAuthError(message: string, code?: string) {
  return ErrorHandler.create(AppErrorType.AUTHENTICATION, message, { code });
}

export function createNetworkError(message: string, code?: string) {
  return ErrorHandler.create(AppErrorType.NETWORK, message, { code });
}

export function createApiError(message: string, code?: string) {
  return ErrorHandler.create(AppErrorType.BUSINESS, message, { code });
}

// Export composable function
export function useErrorHandler() {
  return {
    handleError: ErrorHandler.handle.bind(ErrorHandler),
    createError: ErrorHandler.create.bind(ErrorHandler),
    createAuthError,
    createNetworkError,
    createApiError
  };
}

// 全局错误处理实例
export default ErrorHandler;

// 类型声明
declare global {
  interface Window {
    $message?: {
      error: (message: string) => void;
      warning: (message: string) => void;
      info: (message: string) => void;
      success: (message: string) => void;
    };
    Sentry?: any;
  }
}