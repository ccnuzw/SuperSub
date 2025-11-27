/**
 * 懒加载和代码分割优化工具 - 阶段五：性能优化
 * 提供组件懒加载、路由懒加载、图片懒加载等功能
 */

import { defineAsyncComponent, type Component } from 'vue';

// 预加载组件缓存
const preloadCache = new Map<string, Promise<Component>>();

// 骨架屏组件
const SkeletonComponent = defineAsyncComponent(() => import('@/components/common/SkeletonLoader.vue'));

// 错误边界组件
const ErrorComponent = defineAsyncComponent(() => import('@/components/common/ErrorBoundary.vue'));

// 加载状态组件
const LoadingComponent = defineAsyncComponent(() => import('@/components/common/LoadingSpinner.vue'));

/**
 * 智能异步组件加载器
 * 支持预加载、错误重试、骨架屏等功能
 */
export function createSmartAsyncComponent(
  loader: () => Promise<Component>,
  options: {
    preload?: boolean;
    retryCount?: number;
    retryDelay?: number;
    loadingComponent?: Component;
    errorComponent?: Component;
    delay?: number;
    timeout?: number;
    skeletonComponent?: Component;
  } = {}
) {
  const {
    preload = false,
    retryCount = 3,
    retryDelay = 1000,
    loadingComponent = LoadingComponent,
    errorComponent = ErrorComponent,
    delay = 200,
    timeout = 10000,
    skeletonComponent = SkeletonComponent
  } = options;

  // 如果启用预加载，立即开始加载
  if (preload) {
    const cacheKey = loader.toString();
    if (!preloadCache.has(cacheKey)) {
      preloadCache.set(cacheKey, loader());
    }
  }

  return defineAsyncComponent({
    // 加载器函数
    loader: async () => {
      const cacheKey = loader.toString();

      // 尝试从缓存获取
      if (preloadCache.has(cacheKey)) {
        try {
          return await preloadCache.get(cacheKey)!;
        } catch (error) {
          preloadCache.delete(cacheKey);
        }
      }

      // 重试机制
      let lastError: Error;
      for (let i = 0; i <= retryCount; i++) {
        try {
          const component = await Promise.race([
            loader(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Component load timeout')), timeout)
            )
          ]);

          // 加载成功，缓存结果
          if (preload) {
            preloadCache.set(cacheKey, Promise.resolve(component));
          }

          return component;
        } catch (error) {
          lastError = error as Error;
          if (i < retryCount) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, i)));
          }
        }
      }

      throw lastError!;
    },

    // 加载状态组件
    loadingComponent: skeletonComponent || loadingComponent,

    // 错误组件
    errorComponent,

    // 延迟显示加载状态
    delay,

    // 超时时间
    timeout
  });
}

/**
 * 批量预加载组件
 */
export function preloadComponents(components: Array<{ name: string; loader: () => Promise<Component> }>) {
  const promises = components.map(({ name, loader }) => {
    if (!preloadCache.has(name)) {
      preloadCache.set(name, loader());
    }
    return preloadCache.get(name)!;
  });

  return Promise.allSettled(promises);
}

/**
 * 图片懒加载指令
 */
export const lazyImageDirective = {
  mounted(el: HTMLImageElement, binding: any) {
    const { src, placeholder, threshold = 100 } = binding.value || {};

    // 设置占位图
    if (placeholder) {
      el.src = placeholder;
    }

    // 创建观察器
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;

            // 开始加载图片
            const newImg = new Image();
            newImg.onload = () => {
              img.src = newImg.src;
              img.classList.add('loaded');
            };
            newImg.onerror = () => {
              img.classList.add('error');
            };
            newImg.src = src;

            // 停止观察
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: `${threshold}px`
      }
    );

    // 开始观察
    observer.observe(el);

    // 存储观察器以便后续清理
    (el as any)._lazyImageObserver = observer;
  },

  unmounted(el: HTMLImageElement) {
    const observer = (el as any)._lazyImageObserver;
    if (observer) {
      observer.disconnect();
    }
  }
};

/**
 * 虚拟滚动组件
 */
export function createVirtualList<T>(
  items: T[],
  renderItem: (item: T, index: number) => any,
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
  } = { itemHeight: 50, containerHeight: 400, overscan: 5 }
) {
  const { itemHeight, containerHeight, overscan = 5 } = options;

  // 计算可见范围
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const bufferSize = overscan * 2;
  const totalItems = items.length;

  return {
    // 总高度
    totalHeight: totalItems * itemHeight,

    // 获取可见项
    getVisibleItems(scrollTop: number) {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const endIndex = Math.min(totalItems, startIndex + visibleCount + bufferSize);

      const visibleItems = [];
      for (let i = startIndex; i < endIndex; i++) {
        visibleItems.push({
          item: items[i],
          index: i,
          top: i * itemHeight,
          height: itemHeight
        });
      }

      return {
        items: visibleItems,
        startIndex,
        endIndex
      };
    }
  };
}

/**
 * 无限滚动加载
 */
export function createInfiniteScroll(
  loadMore: () => Promise<any>,
  options: {
    threshold?: number;
    disabled?: () => boolean;
    onLoading?: () => void;
    onLoaded?: () => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const {
    threshold = 100,
    disabled = () => false,
    onLoading,
    onLoaded,
    onError
  } = options;

  let loading = false;
  let hasMore = true;

  const loadMoreItems = async () => {
    if (loading || !hasMore || disabled()) return;

    loading = true;
    onLoading?.();

    try {
      await loadMore();
      onLoaded?.();
    } catch (error) {
      onError?.(error as Error);
      hasMore = false;
    } finally {
      loading = false;
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMoreItems();
        }
      });
    },
    {
      rootMargin: `${threshold}px`
    }
  );

  const observe = (element: Element) => {
    if (element) {
      observer.observe(element);
    }
  };

  const unobserve = (element: Element) => {
    if (element) {
      observer.unobserve(element);
    }
  };

  const destroy = () => {
    observer.disconnect();
  };

  const setHasMore = (value: boolean) => {
    hasMore = value;
  };

  return {
    observe,
    unobserve,
    destroy,
    setHasMore,
    loadMoreItems,
    isLoading: () => loading,
    canLoadMore: () => hasMore && !loading && !disabled()
  };
}

/**
 * 路由预加载
 */
export function preloadRoutes(routes: string[]) {
  const promises = routes.map(route => {
    return import(/* @vite-ignore */ `@/views/${route}.vue`);
  });

  return Promise.allSettled(promises);
}

/**
 * 资源预加载
 */
export function preloadResources(resources: Array<{ url: string; as?: string; type?: string }>) {
  const promises = resources.map(({ url, as, type }) => {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;

      if (as) link.as = as;
      if (type) link.type = type;

      link.onload = resolve;
      link.onerror = reject;

      document.head.appendChild(link);
    });
  });

  return Promise.allSettled(promises);
}

/**
 * Web Worker 池管理
 */
export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: Array<{
    task: any;
    resolve: (result: any) => void;
    reject: (error: any) => void;
  }> = [];
  private busyWorkers = new Set<Worker>();

  constructor(
    private workerScript: string,
    private poolSize: number = navigator.hardwareConcurrency || 4
  ) {
    this.initWorkers();
  }

  private initWorkers() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerScript);
      worker.onmessage = this.handleWorkerMessage.bind(this);
      worker.onerror = this.handleWorkerError.bind(this);
      this.workers.push(worker);
    }
  }

  private handleWorkerMessage(event: MessageEvent) {
    const worker = event.target as Worker;
    const task = this.busyWorkers.get(worker);

    if (task) {
      this.busyWorkers.delete(worker);
      task.resolve(event.data);
      this.processNextTask();
    }
  }

  private handleWorkerError(error: ErrorEvent) {
    const worker = error.target as Worker;
    const task = this.busyWorkers.get(worker);

    if (task) {
      this.busyWorkers.delete(worker);
      task.reject(error.error);
      this.processNextTask();
    }
  }

  private processNextTask() {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.workers.find(w => !this.busyWorkers.has(w));
    if (!availableWorker) return;

    const task = this.taskQueue.shift()!;
    this.busyWorkers.set(availableWorker, task);

    availableWorker.postMessage(task.task);
  }

  public execute<T>(task: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ task, resolve, reject });
      this.processNextTask();
    });
  }

  public destroy() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.busyWorkers.clear();
  }
}

/**
 * 缓存优化策略
 */
export class OptimizedCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number; ttl: number }>();
  private accessOrder: K[] = [];

  constructor(
    private maxSize: number = 100,
    private defaultTTL: number = 300000 // 5分钟
  ) {}

  public set(key: K, value: V, ttl: number = this.defaultTTL) {
    // 如果缓存已满，移除最少使用的项
    if (this.cache.size >= this.maxSize) {
      const lruKey = this.accessOrder[0];
      this.cache.delete(lruKey);
      this.accessOrder = this.accessOrder.filter(k => k !== lruKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    // 更新访问顺序
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
  }

  public get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      return undefined;
    }

    // 更新访问顺序
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);

    return entry.value;
  }

  public has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  public delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }
    return deleted;
  }

  public clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  public size(): number {
    return this.cache.size;
  }

  public keys(): K[] {
    return Array.from(this.cache.keys());
  }

  // 清理过期项
  public cleanup(): number {
    const now = Date.now();
    const expiredKeys: K[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.delete(key));
    return expiredKeys.length;
  }
}

export default {
  createSmartAsyncComponent,
  preloadComponents,
  lazyImageDirective,
  createVirtualList,
  createInfiniteScroll,
  preloadRoutes,
  preloadResources,
  WorkerPool,
  OptimizedCache
};