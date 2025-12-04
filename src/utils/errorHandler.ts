/**
 * 统一错误处理工具
 */

export enum ErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ApiError {
  code: ErrorCode
  message: string
  details?: any
  timestamp: number
}

export class SubscriptionError extends Error {
  public readonly code: ErrorCode
  public readonly details?: any
  public readonly timestamp: number

  constructor(code: ErrorCode, message: string, details?: any) {
    super(message)
    this.name = 'SubscriptionError'
    this.code = code
    this.details = details
    this.timestamp = Date.now()
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    }
  }
}

/**
 * 错误处理工具类
 */
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorListeners: ((error: ApiError) => void)[] = []

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * 添加错误监听器
   */
  addErrorListener(listener: (error: ApiError) => void): void {
    this.errorListeners.push(listener)
  }

  /**
   * 移除错误监听器
   */
  removeErrorListener(listener: (error: ApiError) => void): void {
    const index = this.errorListeners.indexOf(listener)
    if (index > -1) {
      this.errorListeners.splice(index, 1)
    }
  }

  /**
   * 通知错误监听器
   */
  private notifyError(error: ApiError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error)
      } catch (e) {
        console.error('Error in error listener:', e)
      }
    })
  }

  /**
   * 处理API错误
   */
  handleApiError(error: any): SubscriptionError {
    let code = ErrorCode.UNKNOWN_ERROR
    let message = '未知错误'
    let details = error

    if (error?.name === 'AbortError') {
      code = ErrorCode.TIMEOUT_ERROR
      message = '请求超时，请稍后重试'
    } else if (error?.response) {
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 400:
          code = ErrorCode.VALIDATION_ERROR
          message = data?.message || '请求参数错误'
          break
        case 401:
        case 403:
          code = ErrorCode.AUTH_ERROR
          message = '认证失败，请重新登录'
          break
        case 404:
          code = ErrorCode.NOT_FOUND
          message = '请求的资源不存在'
          break
        case 500:
        case 502:
        case 503:
        case 504:
          code = ErrorCode.SERVER_ERROR
          message = '服务器错误，请稍后重试'
          break
        default:
          code = ErrorCode.NETWORK_ERROR
          message = data?.message || `网络错误 (${status})`
      }

      details = {
        status,
        data,
        url: error.config?.url
      }
    } else if (error?.code === 'ECONNRESET' || error?.message?.includes('Network connection lost')) {
      code = ErrorCode.NETWORK_ERROR
      message = '网络连接失败，请检查网络连接'
    } else if (error?.code === 'ECONNABORTED') {
      code = ErrorCode.TIMEOUT_ERROR
      message = '请求超时，请稍后重试'
    }

    const subscriptionError = new SubscriptionError(code, message, details)
    this.notifyError(subscriptionError.toJSON())
    return subscriptionError
  }

  /**
   * 创建用户友好的错误消息
   */
  createUserFriendlyMessage(error: ApiError): string {
    switch (error.code) {
      case ErrorCode.NETWORK_ERROR:
        return '网络连接出现问题，请检查网络后重试'
      case ErrorCode.TIMEOUT_ERROR:
        return '请求超时，请稍后重试'
      case ErrorCode.VALIDATION_ERROR:
        return error.message || '输入信息有误，请检查后重试'
      case ErrorCode.AUTH_ERROR:
        return '登录状态已过期，请重新登录'
      case ErrorCode.NOT_FOUND:
        return '请求的内容不存在'
      case ErrorCode.SERVER_ERROR:
        return '服务器暂时不可用，请稍后重试'
      default:
        return error.message || '操作失败，请重试'
    }
  }

  /**
   * 记录错误日志
   */
  logError(error: ApiError, context?: string): void {
    const logEntry = {
      ...error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    console.error('Subscription Error:', logEntry)

    // 这里可以添加错误上报逻辑，比如发送到监控服务
    // this.reportError(logEntry)
  }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance()

/**
 * 便捷的错误处理函数
 */
export function handleApiError(error: any): SubscriptionError {
  return errorHandler.handleApiError(error)
}

export function createUserFriendlyErrorMessage(error: any): string {
  const apiError = error instanceof SubscriptionError ? error.toJSON() : errorHandler.handleApiError(error).toJSON()
  return errorHandler.createUserFriendlyMessage(apiError)
}

import { ref, computed, readonly } from 'vue'

/**
 * Vue 组合式 API：错误处理
 */
export function useErrorHandler() {
  const errors = ref<ApiError[]>([])

  const handleError = (error: any, context?: string): SubscriptionError => {
    const subscriptionError = handleApiError(error)
    const apiError = subscriptionError.toJSON()

    errorHandler.logError(apiError, context)
    errors.value.push(apiError)

    // 限制错误记录数量
    if (errors.value.length > 50) {
      errors.value = errors.value.slice(-50)
    }

    return subscriptionError
  }

  const clearErrors = (): void => {
    errors.value = []
  }

  const hasErrors = computed(() => errors.value.length > 0)

  return {
    errors: readonly(errors),
    handleError,
    clearErrors,
    hasErrors
  }
}