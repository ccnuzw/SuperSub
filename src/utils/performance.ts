// 简单的性能监控工具

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  totalDuration: number;
  timestamp: number;
}

class SimplePerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private currentMetrics: Map<string, number> = new Map();

  // 开始计时
  start(name: string): void {
    this.currentMetrics.set(name, performance.now());
  }

  // 结束计时并记录
  end(name: string): number {
    const startTime = this.currentMetrics.get(name);
    if (startTime === undefined) {
      console.warn(`Performance metric "${name}" was not started`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.recordMetric(name, duration, 'ms');
    this.currentMetrics.delete(name);

    return duration;
  }

  // 记录自定义指标
  record(name: string, value: number, unit: string = 'ms'): void {
    this.recordMetric(name, value, unit);
  }

  private recordMetric(name: string, value: number, unit: string): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now()
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricList = this.metrics.get(name)!;
    metricList.push(metric);

    // 保留最近100条记录
    if (metricList.length > 100) {
      metricList.shift();
    }
  }

  // 获取指标统计
  getStats(name: string): { avg: number; min: number; max: number; count: number } | null {
    const metricList = this.metrics.get(name);
    if (!metricList || metricList.length === 0) {
      return null;
    }

    const values = metricList.map(m => m.value);
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  // 获取所有指标名称
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  // 清除特定指标
  clear(name: string): void {
    this.metrics.delete(name);
    this.currentMetrics.delete(name);
  }

  // 清除所有指标
  clearAll(): void {
    this.metrics.clear();
    this.currentMetrics.clear();
  }

  // 生成报告
  generateReport(): PerformanceReport {
    const allMetrics: PerformanceMetric[] = [];
    const startTime = performance.now();

    for (const [name, metricList] of this.metrics.entries()) {
      if (metricList.length > 0) {
        // 使用最新的指标
        const latestMetric = metricList[metricList.length - 1];
        allMetrics.push(latestMetric);
      }
    }

    const endTime = performance.now();

    return {
      metrics: allMetrics,
      totalDuration: endTime - startTime,
      timestamp: Date.now()
    };
  }

  // 导出数据
  export(): string {
    const data = {
      metrics: Object.fromEntries(this.metrics.entries()),
      timestamp: Date.now()
    };
    return JSON.stringify(data, null, 2);
  }

  // 打印到控制台
  print(name?: string): void {
    if (name) {
      const stats = this.getStats(name);
      if (stats) {
        console.log(`Performance Stats for "${name}":`, stats);
      }
    } else {
      const report = this.generateReport();
      console.log('Performance Report:', report);
    }
  }
}

// 创建全局实例
export const performanceMonitor = new SimplePerformanceMonitor();

// 辅助函数：测量异步函数执行时间
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  performanceMonitor.start(name);
  try {
    const result = await fn();
    return result;
  } finally {
    performanceMonitor.end(name);
  }
}

// 辅助函数：测量同步函数执行时间
export function measureSync<T>(name: string, fn: () => T): T {
  performanceMonitor.start(name);
  try {
    return fn();
  } finally {
    performanceMonitor.end(name);
  }
}

// Vue组合式API Hook
export function usePerformance() {
  return {
    start: performanceMonitor.start.bind(performanceMonitor),
    end: performanceMonitor.end.bind(performanceMonitor),
    record: performanceMonitor.record.bind(performanceMonitor),
    getStats: performanceMonitor.getStats.bind(performanceMonitor),
    getMetricNames: performanceMonitor.getMetricNames.bind(performanceMonitor),
    clear: performanceMonitor.clear.bind(performanceMonitor),
    clearAll: performanceMonitor.clearAll.bind(performanceMonitor),
    generateReport: performanceMonitor.generateReport.bind(performanceMonitor),
    export: performanceMonitor.export.bind(performanceMonitor),
    print: performanceMonitor.print.bind(performanceMonitor),
    measureAsync,
    measureSync
  };
}