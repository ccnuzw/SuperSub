/**
 * Store基类
 * 提供统一的状态管理模式、错误处理、加载状态等功能
 */

import { ref, computed, watch, type Ref } from 'vue';
import type { AppError, ErrorSeverity } from '@/utils/errorHandler';

/**
 * Store状态接口
 */
export interface IStoreState {
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

/**
 * Store配置接口
 */
export interface IStoreConfig {
  // 是否启用持久化
  persist?: boolean;

  // 持久化键名
  persistKey?: string;

  // 是否启用错误处理
  enableErrorHandler?: boolean;

  // 默认错误消息
  defaultErrorMessage?: string;

  // 是否启用自动重试
  enableAutoRetry?: boolean;

  // 最大重试次数
  maxRetries?: number;

  // 重试延迟（毫秒）
  retryDelay?: number;

  // 是否启用缓存
  enableCache?: boolean;

  // 缓存过期时间（毫秒）
  cacheTTL?: number;
}

/**
 * Store基类
 */
export abstract class StoreBase<TState extends IStoreState = IStoreState> {
  // 状态
  protected state: Ref<TState>;

  // 配置
  protected config: Required<IStoreConfig>;

  // 错误处理器
  protected errorHandler?: (error: AppError) => void;

  constructor(initialState: TState, config: IStoreConfig = {}) {
    this.config = {
      persist: false,
      persistKey: '',
      enableErrorHandler: true,
      defaultErrorMessage: '操作失败，请稍后重试',
      enableAutoRetry: false,
      maxRetries: 3,
      retryDelay: 1000,
      enableCache: false,
      cacheTTL: 5 * 60 * 1000, // 5分钟
      ...config
    };

    // 初始化状态
    this.state = ref(initialState) as Ref<TState>;

    // 设置持久化
    if (this.config.persist && this.config.persistKey) {
      this.setupPersistence();
    }

    // 设置自动错误处理
    if (this.config.enableErrorHandler) {
      this.setupErrorHandler();
    }
  }

  /**
   * 获取状态（只读）
   */
  get readonlyState() {
    return computed(() => this.state.value);
  }

  /**
   * 获取加载状态
   */
  get isLoading() {
    return computed(() => this.state.value.loading);
  }

  /**
   * 获取错误信息
   */
  get error() {
    return computed(() => this.state.value.error);
  }

  /**
   * 获取最后更新时间
   */
  get lastUpdated() {
    return computed(() => this.state.value.lastUpdated);
  }

  /**
   * 检查是否有错误
   */
  get hasError() {
    return computed(() => !!this.state.value.error);
  }

  /**
   * 设置加载状态
   */
  protected setLoading(loading: boolean): void {
    this.state.value.loading = loading;
  }

  /**
   * 设置错误状态
   */
  protected setError(error: string | null, originalError?: any): void {
    this.state.value.error = error;

    if (error && this.config.enableErrorHandler && this.errorHandler) {
      const appError = this.createAppError(error, originalError);
      this.errorHandler(appError);
    }
  }

  /**
   * 清除错误
   */
  protected clearError(): void {
    this.state.value.error = null;
  }

  /**
   * 更新最后更新时间
   */
  protected updateLastUpdated(): void {
    this.state.value.lastUpdated = new Date().toISOString();
  }

  /**
   * 更新状态
   */
  protected updateState(updates: Partial<TState>): void {
    Object.assign(this.state.value, updates);
    this.updateLastUpdated();
  }

  /**
   * 公共状态设置方法
   */
  public setState(updates: Partial<TState>): void {
    this.updateState(updates);
  }

  /**
   * 获取持久化数据
   */
  public getPersistedData(): TState | null {
    if (!this.config.persist || !this.config.persistKey) {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.config.persistKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to get persisted data:', error);
      return null;
    }
  }

  /**
   * 清除持久化数据
   */
  public clearPersistedData(): void {
    if (!this.config.persist || !this.config.persistKey) {
      return;
    }

    try {
      localStorage.removeItem(this.config.persistKey);
    } catch (error) {
      console.warn('Failed to clear persisted data:', error);
    }
  }

  /**
   * 创建应用错误
   */
  protected createAppError(message: string, originalError?: any): AppError {
    // 这里需要导入AppError，暂时使用简单的Error对象
    return new Error(message) as AppError;
  }

  /**
   * 安全执行异步操作
   */
  protected async executeAsync<T>(
    operation: () => Promise<T>,
    options?: {
      loading?: boolean;
      loadingMessage?: string;
      errorMessage?: string;
      successMessage?: string;
      silent?: boolean;
      onSuccess?: (result: T) => void;
      onError?: (error: any) => void;
    }
  ): Promise<T | null> {
    const {
      loading = true,
      loadingMessage,
      errorMessage,
      successMessage,
      silent = false,
      onSuccess,
      onError
    } = options || {};

    try {
      // 设置加载状态
      if (loading) {
        this.setLoading(true);
      }
      this.clearError();

      // 执行操作
      const result = await operation();

      // 显示成功消息
      if (successMessage && !silent) {
        console.log('Success:', successMessage);
      }

      // 成功回调
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error) {
      // 错误处理
      const errorMsg = errorMessage || this.config.defaultErrorMessage;
      if (!silent) {
        this.setError(errorMsg, error);
      }

      // 错误回调
      if (onError) {
        onError(error);
      }

      return null;
    } finally {
      // 清除加载状态
      if (loading) {
        this.setLoading(false);
      }
    }
  }

  /**
   * 重试机制
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    options?: {
      maxRetries?: number;
      delay?: number;
      onRetry?: (attempt: number, error: any) => void;
    }
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? this.config.maxRetries;
    const delay = options?.delay ?? this.config.retryDelay;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          // 重试回调
          if (options?.onRetry) {
            options.onRetry(attempt + 1, error);
          }

          // 等待延迟
          await this.sleep(delay * Math.pow(2, attempt));
        }
      }
    }

    throw lastError;
  }

  /**
   * 延迟函数
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 设置持久化
   */
  private setupPersistence(): void {
    if (!this.config.persistKey) return;

    try {
      // 从本地存储恢复状态
      const stored = localStorage.getItem(this.config.persistKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.assign(this.state.value, parsed);
      }
    } catch (error) {
      console.warn('Failed to restore state from localStorage:', error);
    }

    // 监听状态变化并保存到本地存储
    watch(
      () => this.state.value,
      (newState) => {
        try {
          localStorage.setItem(this.config.persistKey!, JSON.stringify(newState));
        } catch (error) {
          console.warn('Failed to save state to localStorage:', error);
        }
      },
      { deep: true }
    );
  }

  /**
   * 设置错误处理
   */
  private setupErrorHandler(): void {
    // 设置错误处理器
    this.errorHandler = (error: AppError) => {
      console.error(`[${this.constructor.name}] Error:`, error);

      // 这里可以添加错误上报逻辑
      this.reportError(error);
    };
  }

  /**
   * 错误上报
   */
  protected reportError(error: AppError): void {
    // 默认只打印到控制台
    // 子类可以重写此方法实现错误上报
    if (process.env.NODE_ENV === 'development') {
      console.error('Error reported:', error);
    }
  }

  /**
   * 验证状态
   */
  protected validateState(): boolean {
    // 子类可以重写此方法实现状态验证
    return true;
  }

  /**
   * 重置状态
   */
  reset(): void {
    const initialState = this.state.value as any;
    Object.keys(initialState).forEach(key => {
      if (key === 'loading') {
        initialState[key] = false;
      } else if (key === 'error') {
        initialState[key] = null;
      } else if (key === 'lastUpdated') {
        initialState[key] = null;
      }
    });

    this.updateLastUpdated();
  }

  /**
   * 销毁Store
   */
  destroy(): void {
    // 清理持久化数据
    if (this.config.persist && this.config.persistKey) {
      try {
        localStorage.removeItem(this.config.persistKey);
      } catch (error) {
        console.warn('Failed to remove state from localStorage:', error);
      }
    }

    // 清理引用
    this.errorHandler = undefined;
  }

  /**
   * 获取Store信息
   */
  getInfo() {
    return {
      name: this.constructor.name,
      config: this.config,
      state: this.state.value,
      hasError: this.hasError.value,
      isLoading: this.isLoading.value,
      lastUpdated: this.lastUpdated.value
    };
  }
}

/**
 * 异步Store基类
 */
export abstract class AsyncStoreBase<TState extends IStoreState = IStoreState>
  extends StoreBase<TState> {

  // 缓存
  private cache = new Map<string, { data: any; timestamp: number }>();

  /**
   * 带缓存的数据获取
   */
  protected async getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.config.cacheTTL
  ): Promise<T> {
    if (!this.config.enableCache) {
      return fetcher();
    }

    // 检查缓存
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }

    // 获取新数据
    const data = await fetcher();

    // 更新缓存
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  /**
   * 清除缓存
   */
  protected clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 批量操作
   */
  protected async batchExecute<T>(
    operations: Array<() => Promise<T>>,
    options?: {
      concurrent?: boolean;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<T[]> {
    const { concurrent = false, onProgress } = options || {};

    if (concurrent) {
      // 并发执行
      return Promise.all(operations.map(async (op, index) => {
        const result = await op();
        onProgress?.(index + 1, operations.length);
        return result;
      }));
    } else {
      // 串行执行
      const results: T[] = [];
      for (let i = 0; i < operations.length; i++) {
        const result = await operations[i]();
        results.push(result);
        onProgress?.(i + 1, operations.length);
      }
      return results;
    }
  }

  /**
   * 节流操作
   */
  protected throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): T {
    let lastCall = 0;
    return ((...args: any[]) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn(...args);
      }
    }) as T;
  }

  /**
   * 防抖操作
   */
  protected debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T;
  }

  /**
   * 状态变化监听器
   */
  public onStateChange<S>(callback: (newState: S, changedKeys: (keyof S)[]) => void): void {
    // Implementation would depend on the specific requirements
    // This is a placeholder for the state change mechanism
    console.warn('onStateChange method needs implementation');
  }
}

export default StoreBase;