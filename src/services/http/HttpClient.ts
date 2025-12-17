/**
 * 统一HTTP客户端实现
 * 提供统一的API请求接口，支持拦截器、缓存、重试等功能
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  IHttpClient,
  IHttpRequestConfig,
  IHttpResponse,
  IRequestInterceptor,
  IResponseInterceptor,
  IApiResponse,
  IApiError,
  ICacheConfig,
  IRetryConfig
} from '../../types/api';
import { ErrorType, ApiResponse } from '../../types/api';
import { useAuthStore } from '../../stores/auth';
import { AppErrorType, ErrorHandler } from '../../utils/errorHandler';

/**
 * 错误处理类
 */
export class ApiError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public code?: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 缓存管理器
 */
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private config: ICacheConfig;

  constructor(config: ICacheConfig) {
    this.config = config;

    if (config.enabled && config.storage === 'localStorage') {
      this.loadFromStorage();
    }
  }

  set(key: string, data: any, ttl: number): void {
    if (!this.config.enabled) return;

    const item = {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000 // 转换为毫秒
    };

    this.cache.set(key, item);

    if (this.config.storage === 'localStorage') {
      try {
        localStorage.setItem(`api_cache_${key}`, JSON.stringify(item));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }

    // 清理过期缓存
    this.cleanup();
  }

  get(key: string): any | null {
    if (!this.config.enabled) return null;

    const item = this.cache.get(key);

    if (!item) {
      if (this.config.storage === 'localStorage') {
        const stored = localStorage.getItem(`api_cache_${key}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          this.cache.set(key, parsed);
          return parsed.data;
        }
      }
      return null;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);

    if (this.config.storage === 'localStorage') {
      localStorage.removeItem(`api_cache_${key}`);
    }
  }

  clear(): void {
    this.cache.clear();

    if (this.config.storage === 'localStorage') {
      Object.keys(localStorage)
        .filter(key => key.startsWith('api_cache_'))
        .forEach(key => localStorage.removeItem(key));
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private loadFromStorage(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('api_cache_'))
        .forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
            const cacheKey = key.replace('api_cache_', '');
            this.cache.set(cacheKey, JSON.parse(value));
          }
        });
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }
}

/**
 * 重试管理器
 */
class RetryManager {
  private config: IRetryConfig;

  constructor(config: IRetryConfig) {
    this.config = config;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // 检查是否应该重试
        if (attempt === this.config.maxRetries || !this.config.retryCondition(error)) {
          throw error;
        }

        // 计算延迟时间
        const delay = Math.min(
          this.config.retryDelay * Math.pow(this.config.backoffMultiplier, attempt),
          this.config.maxDelay
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * HTTP客户端实现
 */
export class HttpClient implements IHttpClient {
  private instance: AxiosInstance;
  private requestInterceptors = new Map<number, IRequestInterceptor>();
  private responseInterceptors = new Map<number, IResponseInterceptor>();
  private cacheManager: CacheManager;
  private retryManager: RetryManager;
  private defaultConfig: IHttpRequestConfig;

  constructor(config: Partial<IHttpRequestConfig> = {}) {
    this.defaultConfig = {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config
    };

    this.instance = axios.create({
      baseURL: this.defaultConfig.baseURL || '/api',
      timeout: this.defaultConfig.timeout,
      headers: this.defaultConfig.headers,
    });

    this.cacheManager = new CacheManager({
      enabled: true,
      ttl: 300, // 5分钟
      maxSize: 100,
      storage: 'memory'
    });

    this.retryManager = new RetryManager({
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      maxDelay: 10000,
      retryCondition: (error) => {
        // 网络错误、5xx错误、超时错误才重试
        return !error.response ||
               error.response.status >= 500 ||
               error.code === 'ECONNABORTED' ||
               error.message.includes('timeout');
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => this.handleRequest(config),
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => this.handleSuccess(response),
      (error) => this.handleError(error)
    );
  }

  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    // 应用请求拦截器
    for (const interceptor of Array.from(this.requestInterceptors.values())) {
      if (interceptor.onFulfilled) {
        config = interceptor.onFulfilled(config as IHttpRequestConfig) as InternalAxiosRequestConfig;
      }
    }

    // 添加认证头
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }

    // 添加请求ID
    config.headers = config.headers || {};
    config.headers['X-Request-ID'] = this.generateRequestId();

    return config;
  }

  private handleSuccess(response: AxiosResponse): AxiosResponse {
    // 应用响应拦截器
    let finalResponse = response;
    for (const interceptor of Array.from(this.responseInterceptors.values())) {
      if (interceptor.onFulfilled) {
        finalResponse = interceptor.onFulfilled(finalResponse as IHttpResponse) as AxiosResponse;
      }
    }

    // 统一响应格式
    const data = response.data;
    if (!data || typeof data !== 'object' || !('success' in data)) {
      // 包装成标准格式
      response.data = {
        success: true,
        data: data,
        timestamp: new Date().toISOString()
      };
    }

    return response;
  }

  private handleError(error: AxiosError): Promise<never> {
    // 应用响应拦截器
    for (const interceptor of Array.from(this.responseInterceptors.values())) {
      if (interceptor.onRejected) {
        try {
          const result = interceptor.onRejected(error as AxiosError);
          if (result) {
            return Promise.reject(result);
          }
        } catch (interceptorError) {
          error = interceptorError as AxiosError;
        }
      }
    }

    // 统一错误处理
    const apiError = this.createApiError(error);

    // 处理401错误
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      authStore.logout();
    }

    return Promise.reject(apiError);
  }

  private createApiError(error: AxiosError): Error {
    let appErrorType: AppErrorType;
    let message: string;

    if (error.response) {
      // 服务器响应的错误
      const { status, data } = error.response;
      message = (data as any)?.message || 'Server error';

      // 映射 HTTP 状态码到 AppErrorType
      if (status === 401) {
        appErrorType = AppErrorType.AUTHENTICATION;
      } else if (status === 403) {
        appErrorType = AppErrorType.AUTHORIZATION;
      } else if (status === 400 || status === 422) {
        appErrorType = AppErrorType.VALIDATION;
      } else if (status === 408) {
        appErrorType = AppErrorType.TIMEOUT;
      } else if (status >= 500) {
        appErrorType = AppErrorType.SYSTEM;
      } else {
        appErrorType = AppErrorType.BUSINESS;
      }

      return ErrorHandler.create(appErrorType, message, {
        code: (data as any)?.code,
        details: (data as any)?.errors
      });
    } else if (error.request) {
      // 网络错误
      appErrorType = AppErrorType.NETWORK;
      message = 'Network connection error';
      return ErrorHandler.create(appErrorType, message, { code: 'NETWORK_ERROR' });
    } else {
      // 其他错误
      appErrorType = AppErrorType.SYSTEM;
      message = error.message || 'Unknown error';
      return ErrorHandler.create(appErrorType, message, { code: 'UNKNOWN_ERROR' });
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createCacheKey(url: string, config: IHttpRequestConfig): string {
    const method = config.method || 'GET';
    const params = config.params ? JSON.stringify(config.params) : '';
    const data = config.data ? JSON.stringify(config.data) : '';
    return `${method}_${url}_${btoa(params + data)}`;
  }

  async get<T = any>(url: string, config?: IHttpRequestConfig): Promise<ApiResponse<T>> {
    const cacheKey = this.createCacheKey(url, { ...config, method: 'GET' });

    // 检查缓存
    if (!config?.data && !config?.params) {
      const cached = this.cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const response = await this.retryManager.execute(() =>
      this.instance.get(url, config)
    );

    // 缓存GET请求结果
    if (!config?.data && !config?.params) {
      this.cacheManager.set(cacheKey, response.data, 300); // 5分钟缓存
    }

    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: IHttpRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: IHttpRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: IHttpRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: IHttpRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.instance.delete(url, config);
    return response.data;
  }

  // 拦截器管理
  addRequestInterceptor(interceptor: IRequestInterceptor): number {
    const id = Date.now();
    this.requestInterceptors.set(id, interceptor);
    return id;
  }

  addResponseInterceptor(interceptor: IResponseInterceptor): number {
    const id = Date.now();
    this.responseInterceptors.set(id, interceptor);
    return id;
  }

  removeRequestInterceptor(id: number): void {
    this.requestInterceptors.delete(id);
  }

  removeResponseInterceptor(id: number): void {
    this.responseInterceptors.delete(id);
  }

  // 配置管理
  setDefaultConfig(config: Partial<IHttpRequestConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
    this.instance.defaults = { ...this.instance.defaults, ...config } as any;
  }

  getDefaultConfig(): IHttpRequestConfig {
    return { ...this.defaultConfig };
  }

  // 缓存管理
  clearCache(): void {
    this.cacheManager.clear();
  }

  // 便捷方法
  setAuthorization(token: string): void {
    this.instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthorization(): void {
    delete this.instance.defaults.headers.common['Authorization'];
  }
}

// 创建默认实例
export const httpClient = new HttpClient();

// 请求取消工具
export class RequestCanceler {
  private controller = new AbortController();

  get signal(): AbortSignal {
    return this.controller.signal;
  }

  cancel(reason?: string): void {
    this.controller.abort(reason);
  }

  reset(): void {
    this.controller = new AbortController();
  }

  isCanceled(): boolean {
    return this.controller.signal.aborted;
  }
}

// 全局HTTP客户端实例
export default httpClient;