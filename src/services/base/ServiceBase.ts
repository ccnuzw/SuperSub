/**
 * 服务基类
 * 提供标准的CRUD操作和通用功能
 */

import type {
  IServiceBase,
  IPaginatedResponse,
  IPaginationParams,
  IFilterParams,
  IBatchOperation,
  IApiResponse
} from '../../types/api';
import { ErrorType } from '../../types/api';
import type { ApiResponse } from '../../types/api';
import httpClient, { ApiError } from '../http/HttpClient';

/**
 * 抽象服务基类
 */
export abstract class ServiceBase<TEntity, TCreateDto, TUpdateDto>
  implements IServiceBase<TEntity, TCreateDto, TUpdateDto> {

  protected resourceName: string;
  protected http = httpClient;

  constructor(resourceName: string) {
    this.resourceName = resourceName;
  }

  /**
   * 获取资源基础URL
   */
  protected getBaseUrl(): string {
    return `/${this.resourceName}`;
  }

  /**
   * 构建查询字符串
   */
  protected buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * 处理API响应
   */
  protected handleResponse<T>(response: IApiResponse<T>): T {
    if (response.success && response.data) {
      return response.data;
    }
    throw new ApiError(
      ErrorType.BUSINESS,
      response.message || 'Request failed',
      response.code
    );
  }

  /**
   * 获取所有资源（分页）
   */
  async getAll(
    params?: IFilterParams & IPaginationParams
  ): Promise<IPaginatedResponse<TEntity>> {
    try {
      const queryString = params ? this.buildQueryString(params) : '';
      const response = await this.http.get<IPaginatedResponse<TEntity>>(
        `${this.getBaseUrl()}${queryString}`
      );

      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 根据ID获取资源
   */
  async getById(id: string): Promise<TEntity | null> {
    try {
      const response = await this.http.get<TEntity>(`${this.getBaseUrl()}/${id}`);
      return this.handleResponse(response);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw this.handleError(error);
    }
  }

  /**
   * 创建资源
   */
  async create(data: TCreateDto): Promise<TEntity> {
    try {
      const response = await this.http.post<TEntity>(this.getBaseUrl(), data);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 更新资源
   */
  async update(id: string, data: TUpdateDto): Promise<TEntity> {
    try {
      const response = await this.http.put<TEntity>(`${this.getBaseUrl()}/${id}`, data);
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 删除资源
   */
  async delete(id: string): Promise<void> {
    try {
      await this.http.delete(`${this.getBaseUrl()}/${id}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 批量创建资源
   */
  async bulkCreate(items: TCreateDto[]): Promise<TEntity[]> {
    try {
      const response = await this.http.post<TEntity[]>(`${this.getBaseUrl()}/bulk`, { items });
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 批量更新资源
   */
  async bulkUpdate(updates: { id: string; data: TUpdateDto }[]): Promise<TEntity[]> {
    try {
      const response = await this.http.put<TEntity[]>(`${this.getBaseUrl()}/bulk`, { updates });
      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 批量删除资源
   */
  async bulkDelete(ids: string[]): Promise<void> {
    try {
      await this.http.delete(`${this.getBaseUrl()}/bulk`, { data: { ids } });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 执行自定义操作
   */
  protected async executeOperation<T>(
    endpoint: string,
    data?: any,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST'
  ): Promise<T> {
    try {
      const url = `${this.getBaseUrl()}/${endpoint}`;
      let response: ApiResponse<T>;

      switch (method) {
        case 'GET':
          response = await this.http.get<T>(url, { params: data });
          break;
        case 'POST':
          response = await this.http.post<T>(url, data);
          break;
        case 'PUT':
          response = await this.http.put<T>(url, data);
          break;
        case 'PATCH':
          response = await this.http.patch<T>(url, data);
          break;
        case 'DELETE':
          response = await this.http.delete<T>(url, { params: data });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      return this.handleResponse(response);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * 错误处理
   */
  protected handleError(error: any): never {
    if (error instanceof ApiError) {
      // 记录错误日志
      console.error(`API Error [${this.resourceName}]:`, {
        type: error.type,
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    // 未知错误
    console.error(`Unknown Error [${this.resourceName}]:`, error);
    throw new ApiError(
      ErrorType.SYSTEM,
      error.message || 'An unexpected error occurred',
      'UNKNOWN_ERROR',
      500,
      error
    );
  }

  /**
   * 验证ID
   */
  protected validateId(id: string): void {
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new ApiError(
        ErrorType.VALIDATION,
        'Valid ID is required',
        'INVALID_ID',
        400
      );
    }
  }

  /**
   * 验证数据
   */
  protected validateData<T>(data: T, rules?: { [K in keyof T]?: (value: T[K]) => boolean | string }): void {
    if (!data || typeof data !== 'object') {
      throw new ApiError(
        ErrorType.VALIDATION,
        'Valid data is required',
        'INVALID_DATA',
        400
      );
    }

    if (rules) {
      Object.entries(rules).forEach(([key, rule]) => {
        const value = data[key as keyof T];
        if (rule && typeof rule === 'function') {
          const result = rule(value);
          if (result !== true) {
            const message = typeof result === 'string' ? result : `Invalid ${key}`;
            throw new ApiError(
              ErrorType.VALIDATION,
              message,
              `INVALID_${key.toUpperCase()}`,
              400
            );
          }
        }
      });
    }
  }
}

/**
 * 缓存服务基类
 */
export abstract class CachedServiceBase<TEntity, TCreateDto, TUpdateDto>
  extends ServiceBase<TEntity, TCreateDto, TUpdateDto> {

  private cache = new Map<string, { data: TEntity; timestamp: number }>();
  private cacheTTL = 5 * 60 * 1000; // 5分钟

  /**
   * 获取缓存数据
   */
  protected getCached(id: string): TEntity | null {
    const cached = this.cache.get(id);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  /**
   * 设置缓存数据
   */
  protected setCached(id: string, data: TEntity): void {
    this.cache.set(id, { data, timestamp: Date.now() });
  }

  /**
   * 清除缓存数据
   */
  protected clearCached(id: string): void {
    this.cache.delete(id);
  }

  /**
   * 清除所有缓存
   */
  protected clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * 重写getById，添加缓存支持
   */
  async getById(id: string): Promise<TEntity | null> {
    this.validateId(id);

    // 先检查缓存
    const cached = this.getCached(id);
    if (cached) {
      return cached;
    }

    // 从服务器获取
    const entity = await super.getById(id);

    // 缓存结果
    if (entity) {
      this.setCached(id, entity);
    }

    return entity;
  }

  /**
   * 重写update，清除缓存
   */
  async update(id: string, data: TUpdateDto): Promise<TEntity> {
    const result = await super.update(id, data);
    this.clearCached(id);
    return result;
  }

  /**
   * 重写delete，清除缓存
   */
  async delete(id: string): Promise<void> {
    await super.delete(id);
    this.clearCached(id);
  }
}

/**
 * 事件服务基类
 */
export abstract class EventServiceBase<TEntity, TCreateDto, TUpdateDto>
  extends ServiceBase<TEntity, TCreateDto, TUpdateDto> {

  private eventListeners = new Map<string, ((data: any) => void)[]>();

  /**
   * 添加事件监听器
   */
  protected addEventListener(event: string, listener: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * 移除事件监听器
   */
  protected removeEventListener(event: string, listener: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  protected emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * 重写create，触发创建事件
   */
  async create(data: TCreateDto): Promise<TEntity> {
    const result = await super.create(data);
    this.emit('created', result);
    return result;
  }

  /**
   * 重写update，触发更新事件
   */
  async update(id: string, data: TUpdateDto): Promise<TEntity> {
    const result = await super.update(id, data);
    this.emit('updated', result);
    return result;
  }

  /**
   * 重写delete，触发删除事件
   */
  async delete(id: string): Promise<void> {
    const entity = await this.getById(id);
    await super.delete(id);
    this.emit('deleted', { id, entity });
  }
}

export default ServiceBase;