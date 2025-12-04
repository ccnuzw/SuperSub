/**
 * 标准化API响应格式
 */

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    pagination?: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
    timestamp: string
    requestId?: string
  }
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
    timestamp: string
    requestId?: string
  }
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message: message || '操作成功',
    meta: {
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 创建分页响应
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number,
  message?: string
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    message: message || '获取数据成功',
    meta: {
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      },
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any
): ApiResponse<null> {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 验证API响应格式
 */
export function isValidApiResponse(response: any): response is ApiResponse {
  return (
    typeof response === 'object' &&
    'success' in response &&
    typeof response.success === 'boolean'
  )
}

/**
 * 从响应中提取数据
 */
export function extractData<T>(response: ApiResponse<T>): T | null {
  if (response.success && response.data !== undefined) {
    return response.data
  }
  return null
}

/**
 * 从响应中提取错误信息
 */
export function extractError(response: ApiResponse<null>): string | null {
  if (!response.success) {
    return response.error?.message || '操作失败'
  }
  return null
}

/**
 * API响应包装器 - 用于客户端请求
 */
export class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor(baseURL: string = '/api', defaultHeaders: Record<string, string> = {}) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    }
  }

  /**
   * 设置默认请求头
   */
  setDefaultHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value
  }

  /**
   * 获取请求头
   */
  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    return {
      ...this.defaultHeaders,
      ...customHeaders
    }
  }

  /**
   * 构建URL
   */
  private buildUrl(path: string): string {
    return `${this.baseURL}${path.startsWith('/') ? path : '/' + path}`
  }

  /**
   * 处理响应
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      const data = await response.json()

      if (!isValidApiResponse(data)) {
        throw new Error('Invalid API response format')
      }

      return data
    } else {
      const text = await response.text()
      throw new Error(`Unexpected response format: ${text}`)
    }
  }

  /**
   * 处理请求错误
   */
  private async handleRequestError<T>(error: any, url: string): Promise<ApiResponse<T>> {
    console.error(`API request failed for ${url}:`, error)

    if (error.name === 'AbortError') {
      return createErrorResponse('TIMEOUT', '请求超时', { url }) as ApiResponse<T>
    }

    if (error.response) {
      try {
        const response = await this.handleResponse<T>(error.response)
        return response
      } catch {
        return createErrorResponse('NETWORK_ERROR', '网络请求失败', {
          url,
          originalError: error.message
        }) as ApiResponse<T>
      }
    }

    return createErrorResponse('NETWORK_ERROR', '网络请求失败', {
      url,
      originalError: error.message
    }) as ApiResponse<T>
  }

  /**
   * 通用请求方法
   */
  private async request<T>(
    path: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<ApiResponse<T>> {
    const { timeout, ...fetchOptions } = options
    const url = this.buildUrl(path)

    const controller = new AbortController()
    const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: this.getHeaders(fetchOptions.headers as Record<string, string>),
        signal: controller.signal
      })

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      if (!response.ok) {
        throw { response, status: response.status }
      }

      return await this.handleResponse<T>(response)
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      return this.handleRequestError(error, url)
    }
  }

  /**
   * GET请求
   */
  async get<T>(
    path: string,
    options: { timeout?: number; headers?: Record<string, string> } = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'GET',
      ...options
    })
  }

  /**
   * POST请求
   */
  async post<T>(
    path: string,
    data?: any,
    options: { timeout?: number; headers?: Record<string, string> } = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    })
  }

  /**
   * PUT请求
   */
  async put<T>(
    path: string,
    data?: any,
    options: { timeout?: number; headers?: Record<string, string> } = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    })
  }

  /**
   * DELETE请求
   */
  async delete<T>(
    path: string,
    options: { timeout?: number; headers?: Record<string, string> } = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'DELETE',
      ...options
    })
  }

  /**
   * PATCH请求
   */
  async patch<T>(
    path: string,
    data?: any,
    options: { timeout?: number; headers?: Record<string, string> } = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    })
  }
}

/**
 * 创建默认的API客户端实例
 */
export const apiClient = new ApiClient()

/**
 * 便捷的API请求函数
 */
export const apiRequest = {
  get: <T>(path: string, options?: any) => apiClient.get<T>(path, options),
  post: <T>(path: string, data?: any, options?: any) => apiClient.post<T>(path, data, options),
  put: <T>(path: string, data?: any, options?: any) => apiClient.put<T>(path, data, options),
  delete: <T>(path: string, options?: any) => apiClient.delete<T>(path, options),
  patch: <T>(path: string, data?: any, options?: any) => apiClient.patch<T>(path, data, options)
}