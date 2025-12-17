import { nextTick } from 'vue'
import type { App } from 'vue'

// 性能监控指标类型
interface IMetrics {
  // 首次内容绘制 (FCP)
  firstContentfulPaint?: number
  // 最大内容绘制 (LCP)
  largestContentfulPaint?: number
  // 首次输入延迟 (FID)
  firstInputDelay?: number
  // 累计布局偏移 (CLS)
  cumulativeLayoutShift?: number
  // 内存使用
  memoryUsage?: {
    used: number
    total: number
    limit: number
  }
  // 组件渲染时间
  componentRenderTime?: Map<string, number>
}

// 性能监控类
export class PerformanceMonitor {
  private metrics: IMetrics = {
    componentRenderTime: new Map()
  }

  private observers: PerformanceObserver[] = []

  constructor() {
    this.initWebVitalsMonitoring()
    this.initMemoryMonitoring()
  }

  // 初始化 Web Vitals 监控
  private initWebVitalsMonitoring() {
    if (typeof window === 'undefined') return

    // FCP 监控
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime
          }
        })
      })
      observer.observe({ entryTypes: ['paint'] })
      this.observers.push(observer)
    }

    // LCP 监控
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.largestContentfulPaint = lastEntry?.startTime
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(observer)
    }

    // FID 监控
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'first-input') {
            this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime
          }
        })
      })
      observer.observe({ entryTypes: ['first-input'] })
      this.observers.push(observer)
    }

    // CLS 监控
    if ('PerformanceObserver' in window) {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        })
        this.metrics.cumulativeLayoutShift = clsValue
      })
      observer.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(observer)
    }
  }

  // 初始化内存监控
  private initMemoryMonitoring() {
    if (typeof window === 'undefined') return

    // 检查内存 API 支持
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        const memory = (performance as any).memory
        this.metrics.memoryUsage = {
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
        }
      }

      // 每 5 秒更新一次内存使用情况
      setInterval(updateMemoryUsage, 5000)
      updateMemoryUsage()
    }
  }

  // 监控组件渲染时间
  measureComponentRender(componentName: string, renderFn: () => void) {
    const startTime = performance.now()
    renderFn()

    nextTick(() => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      this.metrics.componentRenderTime?.set(componentName, renderTime)

      // 如果渲染时间超过 100ms，发出警告
      if (renderTime > 100) {
        console.warn(`⚠️ 组件 ${componentName} 渲染时间过长: ${renderTime.toFixed(2)}ms`)
      }
    })
  }

  // 获取性能指标
  getMetrics(): IMetrics {
    return { ...this.metrics }
  }

  // 获取性能报告
  getPerformanceReport(): string {
    const report = []

    if (this.metrics.firstContentfulPaint) {
      report.push(`📊 首次内容绘制: ${this.metrics.firstContentfulPaint.toFixed(2)}ms`)
    }

    if (this.metrics.largestContentfulPaint) {
      report.push(`📊 最大内容绘制: ${this.metrics.largestContentfulPaint.toFixed(2)}ms`)
    }

    if (this.metrics.firstInputDelay) {
      report.push(`📊 首次输入延迟: ${this.metrics.firstInputDelay.toFixed(2)}ms`)
    }

    if (this.metrics.cumulativeLayoutShift) {
      report.push(`📊 累计布局偏移: ${this.metrics.cumulativeLayoutShift.toFixed(4)}`)
    }

    if (this.metrics.memoryUsage) {
      const { used, total, limit } = this.metrics.memoryUsage
      report.push(`📊 内存使用: ${used}MB / ${total}MB (限制: ${limit}MB)`)
      report.push(`📊 内存使用率: ${((used / total) * 100).toFixed(1)}%`)
    }

    if (this.metrics.componentRenderTime && this.metrics.componentRenderTime.size > 0) {
      report.push('\n📊 组件渲染时间:')
      this.metrics.componentRenderTime.forEach((time, name) => {
        report.push(`  - ${name}: ${time.toFixed(2)}ms`)
      })
    }

    return report.join('\n')
  }

  // 清理监控
  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// 组件性能监控装饰器
export function MeasurePerformance(componentName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const name = componentName || `${target.constructor.name}.${propertyKey}`

    descriptor.value = function (...args: any[]) {
      const startTime = performance.now()
      const result = originalMethod.apply(this, args)

      if (result instanceof Promise) {
        return result.then((res) => {
          const endTime = performance.now()
          const duration = endTime - startTime
          if (duration > 100) {
            console.warn(`⚠️ 方法 ${name} 执行时间过长: ${duration.toFixed(2)}ms`)
          }
          return res
        })
      } else {
        const endTime = performance.now()
        const duration = endTime - startTime
        if (duration > 100) {
          console.warn(`⚠️ 方法 ${name} 执行时间过长: ${duration.toFixed(2)}ms`)
        }
        return result
      }
    }

    return descriptor
  }
}

// 路由切换性能监控
export function measureRoutePerformance(to: any, from: any) {
  const startTime = performance.now()

  return {
    end: () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      console.log(`🚀 路由切换 ${from.path} → ${to.path} 耗时: ${duration.toFixed(2)}ms`)

      if (duration > 500) {
        console.warn(`⚠️ 路由切换时间过长，建议优化组件加载`)
      }
    }
  }
}

// 资源加载监控
export function monitorResourceLoading() {
  if (typeof window === 'undefined') return

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries()
    entries.forEach((entry) => {
      if (entry.entryType === 'resource') {
        const resource = entry as PerformanceResourceTiming
        const loadTime = resource.responseEnd - resource.requestStart

        // 监控大资源文件
        if (loadTime > 1000) {
          console.warn(`⚠️ 资源加载过慢: ${resource.name} (${loadTime.toFixed(2)}ms)`)
        }

        // 监控 JavaScript 文件
        if (resource.name.endsWith('.js')) {
          console.log(`📦 JS 文件加载: ${resource.name.split('/').pop()} (${loadTime.toFixed(2)}ms)`)
        }
      }
    })
  })

  observer.observe({ entryTypes: ['resource'] })
  return observer
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor()

// Vue 插件安装
export function installPerformanceMonitoring(app: App) {
  // 提供性能监控实例
  app.provide('performanceMonitor', performanceMonitor)

  // 开发环境下启用资源监控
  if (process.env.NODE_ENV === 'development') {
    monitorResourceLoading()
  }

  // 在页面卸载时清理监控
  window.addEventListener('beforeunload', () => {
    performanceMonitor.destroy()
  })
}

export default {
  PerformanceMonitor,
  MeasurePerformance,
  measureRoutePerformance,
  monitorResourceLoading,
  performanceMonitor,
  installPerformanceMonitoring
}