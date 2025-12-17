/**
 * API类型定义
 * 统一API请求和响应的类型定义
 */

// 基础API响应接口
export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  code?: string;
  timestamp: string;
}

// 成功响应
export interface ISuccessApiResponse<T> extends IApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

// 错误响应
export interface IErrorApiResponse extends IApiResponse {
  success: false;
  message: string;
  errors?: string[];
  code?: string;
  timestamp: string;
}

// 联合类型
export type ApiResponse<T = any> = ISuccessApiResponse<T> | IErrorApiResponse;

// HTTP方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// 请求配置接口
export interface IHttpRequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  retry?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

// 响应配置接口
export interface IHttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: IHttpRequestConfig;
}

// 错误类型枚举
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  BUSINESS = 'BUSINESS',
  SYSTEM = 'SYSTEM',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN'
}

// API错误接口
export interface IApiError {
  type: ErrorType;
  message: string;
  code?: string;
  status?: number;
  details?: any;
  timestamp: string;
}

// 分页参数接口
export interface IPaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分页响应接口
export interface IPaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 过滤参数接口
export interface IFilterParams {
  search?: string;
  status?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any;
}

// 批量操作接口
export interface IBatchOperation<T> {
  ids: string[];
  operation: 'create' | 'update' | 'delete';
  data?: Partial<T>[];
}

// 文件上传接口
export interface IFileUpload {
  file: File;
  name?: string;
  description?: string;
  category?: string;
}

// 导出配置接口
export interface IExportConfig {
  format: 'json' | 'csv' | 'xlsx' | 'pdf';
  filters?: IFilterParams;
  fields?: string[];
  filename?: string;
}

// 请求拦截器接口
export interface IRequestInterceptor {
  onFulfilled?: (config: IHttpRequestConfig) => IHttpRequestConfig | Promise<IHttpRequestConfig>;
  onRejected?: (error: any) => any;
}

// 响应拦截器接口
export interface IResponseInterceptor {
  onFulfilled?: (response: IHttpResponse) => IHttpResponse | Promise<IHttpResponse>;
  onRejected?: (error: any) => any;
}

// HTTP客户端接口
export interface IHttpClient {
  get<T = any>(url: string, config?: IHttpRequestConfig): Promise<ApiResponse<T>>;
  post<T = any>(url: string, data?: any, config?: IHttpRequestConfig): Promise<ApiResponse<T>>;
  put<T = any>(url: string, data?: any, config?: IHttpRequestConfig): Promise<ApiResponse<T>>;
  patch<T = any>(url: string, data?: any, config?: IHttpRequestConfig): Promise<ApiResponse<T>>;
  delete<T = any>(url: string, config?: IHttpRequestConfig): Promise<ApiResponse<T>>;

  // 拦截器管理
  addRequestInterceptor(interceptor: IRequestInterceptor): number;
  addResponseInterceptor(interceptor: IResponseInterceptor): number;
  removeRequestInterceptor(id: number): void;
  removeResponseInterceptor(id: number): void;

  // 配置管理
  setDefaultConfig(config: Partial<IHttpRequestConfig>): void;
  getDefaultConfig(): IHttpRequestConfig;
}

// 缓存配置接口
export interface ICacheConfig {
  enabled: boolean;
  ttl: number; // 生存时间（秒）
  maxSize: number; // 最大缓存条目数
  storage: 'memory' | 'localStorage' | 'sessionStorage';
}

// 重试配置接口
export interface IRetryConfig {
  maxRetries: number;
  retryDelay: number; // 基础延迟时间（毫秒）
  backoffMultiplier: number; // 退避倍数
  maxDelay: number; // 最大延迟时间（毫秒）
  retryCondition: (error: any) => boolean;
}

// API服务基类接口
export interface IServiceBase<TEntity, TCreateDto, TUpdateDto> {
  getAll(params?: IFilterParams & IPaginationParams): Promise<IPaginatedResponse<TEntity>>;
  getById(id: string): Promise<TEntity | null>;
  create(data: TCreateDto): Promise<TEntity>;
  update(id: string, data: TUpdateDto): Promise<TEntity>;
  delete(id: string): Promise<void>;

  // 批量操作
  bulkCreate(items: TCreateDto[]): Promise<TEntity[]>;
  bulkUpdate(updates: { id: string; data: TUpdateDto }[]): Promise<TEntity[]>;
  bulkDelete(ids: string[]): Promise<void>;
}

// Webhook配置接口
export interface IWebhookConfig {
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
}

// 环境配置接口
export interface IApiEnvironment {
  baseURL: string;
  timeout: number;
  retry: IRetryConfig;
  cache: ICacheConfig;
  webhooks: IWebhookConfig[];
}

// 健康检查接口
export interface IHealthCheck {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    database: 'ok' | 'error';
    cache: 'ok' | 'error';
    external: 'ok' | 'error';
  };
  version?: string;
  uptime?: number;
}