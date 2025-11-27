/**
 * 统一API客户端 - 阶段四：统一API层
 * 整合所有API调用功能，提供类型安全、错误处理、缓存等功能
 */

import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { ApiResponse, PaginatedResponse, CrudResult } from '@/types/common';

// API请求配置
export interface ApiRequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
}

// API错误类型
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 网络错误类型
export class NetworkError extends ApiError {
  constructor(message: string) {
    super(message, 0, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

// 认证错误类型
export class AuthError extends ApiError {
  constructor(message: string = '认证失败') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthError';
  }
}

// 缓存条目
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * 统一API客户端类
 */
class UnifiedApiClient {
  private baseURL = '/api';
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();

  // 全局状态
  private _loading = ref(false);
  private _error = ref<ApiError | null>(null);
  private _lastRequestTime = ref<number>(0);

  // 计算属性
  public loading = computed(() => this._loading.value);
  public error = computed(() => this._error.value);
  public lastRequestTime = computed(() => this._lastRequestTime.value);

  /**
   * 获取认证token
   */
  private getToken(): string | null {
    try {
      return localStorage.getItem('token');
    } catch {
      return null;
    }
  }

  /**
   * 清除认证token
   */
  private clearToken(): void {
    try {
      localStorage.removeItem('token');
    } catch {
      // 静默处理
    }
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(endpoint: string, options?: ApiRequestConfig): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  /**
   * 检查缓存
   */
  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 设置缓存
   */
  private setCachedData<T>(key: string, data: T, ttl: number = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 清除缓存
   */
  public clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * 核心请求方法
   */
  async request<T = any>(
    endpoint: string,
    options: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = 30000,
      retries = 0,
      cache: enableCache = false,
      cacheTTL = 300000,
      ...fetchOptions
    } = options;

    // 生成缓存键
    const cacheKey = this.getCacheKey(endpoint, options);

    // 检查缓存（仅对GET请求启用缓存）
    if (enableCache && (!options.method || options.method.toUpperCase() === 'GET')) {
      const cachedData = this.getCachedData<ApiResponse<T>>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    // 防止重复请求
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    const requestPromise = this.executeRequest<T>(endpoint, {
      ...fetchOptions,
      timeout,
      retries
    });

    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;

      // 缓存成功的GET请求结果
      if (enableCache && result.success && (!options.method || options.method.toUpperCase() === 'GET')) {
        this.setCachedData(cacheKey, result, cacheTTL);
      }

      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * 执行HTTP请求
   */
  private async executeRequest<T>(
    endpoint: string,
    options: ApiRequestConfig
  ): Promise<ApiResponse<T>> {
    const authStore = useAuthStore();
    this._lastRequestTime.value = Date.now();

    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    // 构建请求头
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    // 设置AbortController
    const controller = new AbortController();
    const signal = controller.signal;

    // 超时处理
    let timeoutId: number | undefined;
    if (options.timeout) {
      timeoutId = window.setTimeout(() => controller.abort(), options.timeout);
    }

    try {
      this._loading.value = true;
      this._error.value = null;

      const response = await fetch(url, {
        ...options,
        headers,
        signal,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // 处理认证失败
      if (response.status === 401) {
        this.clearToken();
        authStore.logout();
        throw new AuthError('认证已过期，请重新登录');
      }

      // 处理其他HTTP错误
      if (!response.ok) {
        let errorMessage = `请求失败 (${response.status})`;
        let errorData: any;

        try {
          const errorResponse = await response.json();
          errorMessage = errorResponse.message || errorMessage;
          errorData = errorResponse.data;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }

        throw new ApiError(errorMessage, response.status, undefined, errorData);
      }

      // 处理204 No Content
      if (response.status === 204) {
        return { success: true, data: {} as T };
      }

      // 处理JSON响应
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const responseData: ApiResponse<T> = await response.json();

        // 检查业务逻辑错误
        if (responseData.success === false) {
          throw new ApiError(
            responseData.message || '请求失败',
            response.status,
            'BUSINESS_ERROR',
            responseData.data
          );
        }

        return responseData;
      }

      // 处理非JSON响应
      const textData = await response.text();
      return { success: true, data: textData as any };

    } catch (error: any) {
      console.error(`API请求失败 [${endpoint}]:`, error);

      // 处理网络错误
      if (error.name === 'AbortError') {
        throw new ApiError('请求超时', 408, 'TIMEOUT');
      }

      if (error instanceof NetworkError || error.message.includes('fetch')) {
        throw new NetworkError('网络连接失败');
      }

      // 处理已知错误类型
      if (error instanceof ApiError) {
        this._error.value = error;
        throw error;
      }

      // 未知错误
      const apiError = new ApiError(error.message || '未知错误');
      this._error.value = apiError;
      throw apiError;

    } finally {
      this._loading.value = false;
    }
  }

  /**
   * GET请求
   */
  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    options: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      url += (url.includes('?') ? '&' : '?') + searchParams.toString();
    }

    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST请求
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    options: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data
    });
  }

  /**
   * PUT请求
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    options: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data
    });
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    options: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data
    });
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(
    endpoint: string,
    options: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE'
    });
  }

  /**
   * 上传文件
   */
  async upload<T = any>(
    endpoint: string,
    file: File,
    options: ApiRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: formData,
      headers: {} // 让浏览器自动设置Content-Type
    });
  }

  /**
   * 批量请求
   */
  async batch<T = any>(
    requests: Array<{ endpoint: string; options?: ApiRequestConfig }>
  ): Promise<ApiResponse<T>[]> {
    const promises = requests.map(({ endpoint, options }) =>
      this.request<T>(endpoint, options)
    );

    return Promise.allSettled(promises).then(results => {
      return results.map(result => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return { success: false, message: result.reason.message } as ApiResponse<T>;
        }
      });
    });
  }

  /**
   * 获取基础URL
   */
  public getBaseUrl(): string {
    return this.baseURL;
  }

  /**
   * 设置基础URL
   */
  public setBaseUrl(url: string): void {
    this.baseURL = url;
  }
}

// 创建单例实例
export const apiClient = new UnifiedApiClient();

// 导出类型和工具
export { ApiError, NetworkError, AuthError };
export type { ApiRequestConfig };