/**
 * 性能监控工具 - 阶段五：性能优化
 * 提供页面性能监控、资源加载时间、用户交互延迟等性能指标
 */

// 性能指标接口
export interface PerformanceMetrics {
  // 页面加载性能
  pageLoad: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
  };

  // 资源加载性能
  resources: {
    totalSize: number;
    totalCount: number;
    compressedSize: number;
    loadingTime: number;
  };

  // API请求性能
  api: {
    averageResponseTime: number;
    requestCount: number;
    errorRate: number;
    slowRequests: number;
  };

  // 用户交互性能
  interactions: {
    averageClickDelay: number;
    averageScrollDelay: number;
    frameRate: number;
  };

  // 内存使用
  memory: {
    used: number;
    total: number;
    limit: number;
  };
}

// 性能监控器类
export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private observers: PerformanceObserver[] = [];
  private apiRequests: Array<{ url: string; startTime: number; endTime: number; status: number }> = [];
  private interactionDelays: number[] = [];

  constructor() {
    this.metrics = this.initializeMetrics();
    this.init();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      pageLoad: {
        domContentLoaded: 0,
        loadComplete: 0,
        firstPaint: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        firstInputDelay: 0,
        cumulativeLayoutShift: 0
      },
      resources: {
        totalSize: 0,
        totalCount: 0,
        compressedSize: 0,
        loadingTime: 0
      },
      api: {
        averageResponseTime: 0,
        requestCount: 0,
        errorRate: 0,
        slowRequests: 0
      },
      interactions: {
        averageClickDelay: 0,
        averageScrollDelay: 0,
        frameRate: 60
      },
      memory: {
        used: 0,
        total: 0,
        limit: 0
      }
    };
  }

  private init() {
    // 监听页面加载性能
    this.observePageLoad();

    // 监听资源加载
    this.observeResources();

    // 监听Core Web Vitals
    this.observeCoreWebVitals();

    // 监听内存使用
    this.observeMemory();

    // 监听用户交互
    this.observeInteractions();
  }

  private observePageLoad() {
    // 监听导航加载时间
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];

      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0];
        this.metrics.pageLoad.domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.navigationStart;
        this.metrics.pageLoad.loadComplete = navEntry.loadEventEnd - navEntry.navigationStart;
      }

      // 监听Paint时间
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach((entry) => {
        if (entry.name === 'first-paint') {
          this.metrics.pageLoad.firstPaint = entry.startTime;
        }
        if (entry.name === 'first-contentful-paint') {
          this.metrics.pageLoad.firstContentfulPaint = entry.startTime;
        }
      });
    }
  }

  private observeResources() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            this.metrics.resources.totalCount++;

            // 计算资源大小
            if (resource.transferSize) {
              this.metrics.resources.totalSize += resource.transferSize;
            }

            // 计算加载时间
            const loadTime = resource.responseEnd - resource.requestStart;
            this.metrics.resources.loadingTime += loadTime;
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Resource timing observation not supported:', error);
    }
  }

  private observeCoreWebVitals() {
    // 监听LCP (Largest Contentful Paint)
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.pageLoad.largestContentfulPaint = lastEntry.startTime;
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('LCP observation not supported:', error);
    }

    // 监听FID (First Input Delay)
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'first-input') {
            this.metrics.pageLoad.firstInputDelay = (entry as any).processingStart - entry.startTime;
          }
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('FID observation not supported:', error);
    }

    // 监听CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        this.metrics.pageLoad.cumulativeLayoutShift = clsValue;
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('CLS observation not supported:', error);
    }
  }

  private observeMemory() {
    // 定期收集内存使用情况
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memory.used = memory.usedJSHeapSize;
        this.metrics.memory.total = memory.totalJSHeapSize;
        this.metrics.memory.limit = memory.jsHeapSizeLimit;
      }
    }, 5000); // 每5秒收集一次
  }

  private observeInteractions() {
    // 监听点击延迟
    document.addEventListener('click', (event) => {
      const startTime = performance.now();

      requestAnimationFrame(() => {
        const delay = performance.now() - startTime;
        this.interactionDelays.push(delay);

        // 保持最近50次交互的延迟数据
        if (this.interactionDelays.length > 50) {
          this.interactionDelays.shift();
        }

        // 计算平均延迟
        const avgDelay = this.interactionDelays.reduce((sum, d) => sum + d, 0) / this.interactionDelays.length;
        this.metrics.interactions.averageClickDelay = avgDelay;
      });
    });

    // 监听帧率
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrame = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        this.metrics.interactions.frameRate = frameCount;
        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(countFrame);
    };

    requestAnimationFrame(countFrame);
  }

  // API请求监控
  public recordApiRequest(url: string, startTime: number, endTime: number, status: number) {
    const responseTime = endTime - startTime;

    this.apiRequests.push({
      url,
      startTime,
      endTime,
      status
    });

    // 更新API性能指标
    this.metrics.api.requestCount++;

    // 计算平均响应时间
    const totalTime = this.apiRequests.reduce((sum, req) => sum + (req.endTime - req.startTime), 0);
    this.metrics.api.averageResponseTime = totalTime / this.apiRequests.length;

    // 计算错误率
    const errorCount = this.apiRequests.filter(req => req.status >= 400).length;
    this.metrics.api.errorRate = (errorCount / this.apiRequests.length) * 100;

    // 计算慢请求数 (>2秒)
    const slowRequests = this.apiRequests.filter(req => (req.endTime - req.startTime) > 2000);
    this.metrics.api.slowRequests = slowRequests.length;

    // 保持最近100个请求的记录
    if (this.apiRequests.length > 100) {
      this.apiRequests = this.apiRequests.slice(-100);
    }
  }

  // 获取当前性能指标
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // 生成性能报告
  public generateReport(): string {
    const metrics = this.metrics;

    return `
📊 性能监控报告
================

🚀 页面加载性能
   DOM内容加载: ${(metrics.pageLoad.domContentLoaded / 1000).toFixed(2)}s
   页面完全加载: ${(metrics.pageLoad.loadComplete / 1000).toFixed(2)}s
   首次绘制: ${(metrics.pageLoad.firstPaint / 1000).toFixed(2)}s
   首次内容绘制: ${(metrics.pageLoad.firstContentfulPaint / 1000).toFixed(2)}s
   最大内容绘制: ${(metrics.pageLoad.largestContentfulPaint / 1000).toFixed(2)}s
   首次输入延迟: ${metrics.pageLoad.firstInputDelay.toFixed(2)}ms
   累积布局偏移: metrics.pageLoad.cumulativeLayoutShift.toFixed(3)}

📦 资源加载
   总资源数量: ${metrics.resources.totalCount}
   总资源大小: ${(metrics.resources.totalSize / 1024 / 1024).toFixed(2)}MB
   平均加载时间: ${metrics.resources.loadingTime.toFixed(2)}ms

🌐 API请求
   请求总数: ${metrics.api.requestCount}
   平均响应时间: ${metrics.api.averageResponseTime.toFixed(2)}ms
   错误率: ${metrics.api.errorRate.toFixed(2)}%
   慢请求数: ${metrics.api.slowRequests}

🖱️ 用户交互
   平均点击延迟: ${metrics.interactions.averageClickDelay.toFixed(2)}ms
   平均帧率: ${metrics.interactions.frameRate.toFixed(0)}fps

💾 内存使用
   已使用: ${(metrics.memory.used / 1024 / 1024).toFixed(2)}MB
   总分配: ${(metrics.memory.total / 1024 / 1024).toFixed(2)}MB
   限制: ${(metrics.memory.limit / 1024 / 1024).toFixed(2)}MB
    `;
  }

  // 清理监控器
  public dispose() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// 性能评分计算
export function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  let score = 100;

  // 页面加载性能评分 (权重: 30%)
  if (metrics.pageLoad.firstContentfulPaint > 3000) score -= 10;
  if (metrics.pageLoad.largestContentfulPaint > 4000) score -= 10;
  if (metrics.pageLoad.cumulativeLayoutShift > 0.25) score -= 10;

  // API性能评分 (权重: 25%)
  if (metrics.api.averageResponseTime > 1000) score -= 10;
  if (metrics.api.errorRate > 5) score -= 10;
  if (metrics.api.errorRate > 10) score -= 5;

  // 用户交互评分 (权重: 25%)
  if (metrics.interactions.averageClickDelay > 100) score -= 10;
  if (metrics.interactions.frameRate < 30) score -= 15;

  // 内存使用评分 (权重: 20%)
  const memoryUsageRatio = metrics.memory.used / metrics.memory.limit;
  if (memoryUsageRatio > 0.8) score -= 15;
  if (memoryUsageRatio > 0.6) score -= 5;

  return Math.max(0, score);
}

// 性能等级
export function getPerformanceGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export default performanceMonitor;