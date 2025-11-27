import type { ApiResponse } from '@/types/common';
import type { RequestOptions } from '@/types/api';

export class ApiClient {
  private baseURL: string;
  private defaultTimeout: number = 30000;
  private defaultRetries: number = 3;

  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
  }

  /**
   * 发送HTTP请求
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers,
      body,
      params,
      timeout = this.defaultTimeout,
      retries = this.defaultRetries
    } = options;

    let url = `${this.baseURL}${endpoint}`;

    // 处理查询参数
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += `?${searchParams.toString()}`;
    }

    const requestInit: RequestInit = {
      method,
      headers: this.getHeaders(headers),
      body: body ? this.getBody(body) : undefined,
    };

    let lastError: Error | null = null;

    // 重试机制
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...requestInit,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error as Error;

        // 如果是认证错误，直接抛出，不重试
        if (error instanceof Error && error.message.includes('401')) {
          break;
        }

        // 如果是最后一次尝试，直接抛出错误
        if (attempt === retries) {
          break;
        }

        // 指数退避延迟
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return this.handleError(lastError);
  }

  /**
   * GET请求
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>, options?: Omit<RequestOptions, 'params' | 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET', params });
  }

  /**
   * POST请求
   */
  async post<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT请求
   */
  async put<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'body' | 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  /**
   * 获取请求头
   */
  private getHeaders(customHeaders?: HeadersInit): HeadersInit {
    const headers = new Headers(customHeaders);

    // 设置默认Content-Type
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // 添加认证Token
    const token = this.getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  /**
   * 处理请求体
   */
  private getBody(body: any): BodyInit | undefined {
    if (body === null || body === undefined) {
      return undefined;
    }

    if (body instanceof FormData) {
      return body;
    }

    if (typeof body === 'string') {
      return body;
    }

    return JSON.stringify(body);
  }

  /**
   * 获取认证Token
   */
  private getAuthToken(): string | null {
    try {
      // 动态导入auth store以避免循环依赖
      const authStore = require('@/stores/auth').useAuthStore?.();
      return authStore?.token || null;
    } catch {
      return null;
    }
  }

  /**
   * 处理响应
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: any;

    try {
      if (isJson) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch {
      data = null;
    }

    // 处理认证错误
    if (response.status === 401) {
      try {
        const authStore = require('@/stores/auth').useAuthStore?.();
        if (authStore) {
          authStore.logout();
        }
      } catch {
        // 静默处理错误
      }
      return {
        success: false,
        error: '认证过期，请重新登录',
        message: '认证过期，请重新登录'
      };
    }

    // 处理其他HTTP错误
    if (!response.ok) {
      const errorMessage = typeof data === 'object' && data?.message
        ? data.message
        : `HTTP ${response.status}: ${response.statusText}`;

      return {
        success: false,
        error: errorMessage,
        message: errorMessage
      };
    }

    // 处理成功响应
    if (data && typeof data === 'object') {
      // 如果响应已经包含了 success 字段，直接返回
      if ('success' in data) {
        return data;
      }

      // 否则包装为成功响应
      return {
        success: true,
        data: data
      };
    }

    return {
      success: true,
      data: data
    };
  }

  /**
   * 处理错误
   */
  private handleError(error: Error | null): ApiResponse<never> {
    if (!error) {
      return {
        success: false,
        error: '未知错误',
        message: '未知错误'
      };
    }

    if (error.name === 'AbortError') {
      return {
        success: false,
        error: '请求超时',
        message: '��求超时'
      };
    }

    if (error.message.includes('Failed to fetch')) {
      return {
        success: false,
        error: '网络连接失败',
        message: '网络连接失败'
      };
    }

    return {
      success: false,
      error: error.message,
      message: error.message
    };
  }
}

// 创建单例实例
export const apiClient = new ApiClient();

// 便捷的API方法导出
export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, any>, options?: Omit<RequestOptions, 'params' | 'method'>) =>
    apiClient.get<T>(endpoint, params, options),
  post: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    apiClient.post<T>(endpoint, body, options),
  put: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    apiClient.put<T>(endpoint, body, options),
  delete: <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>) =>
    apiClient.delete<T>(endpoint, options),
  patch: <T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'body' | 'method'>) =>
    apiClient.patch<T>(endpoint, body, options),
};