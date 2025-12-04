/**
 * 高级订阅服务 - 修复版本
 */

import type {
  Subscription,
  SubscriptionFormData,
  BatchImportData,
  BatchOperationResult,
  SubscriptionUpdateLog,
  SubscriptionPreviewData,
  BatchUpdateConfig
} from '@/types/subscription'

import { apiRequest } from '@/utils/apiResponse'
import {
  validateSubscriptionUrl,
  validateSubscriptionName
} from '@/utils/subscriptionUtils'

/**
 * 简化版错误处理器
 */
class SimpleErrorHandler {
  static handleApiError(error: any): Error {
    if (error instanceof Error) {
      return error
    }

    if (typeof error === 'string') {
      return new Error(error)
    }

    if (error?.response?.data?.message) {
      return new Error(error.response.data.message)
    }

    if (error?.message) {
      return new Error(error.message)
    }

    return new Error('未知错误')
  }
}

/**
 * 缓存管理器
 */
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set<T>(key: string, data: T, ttl = 300000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  deletePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

/**
 * 请求队列管理器
 */
class RequestQueueManager {
  private activeRequests = new Map<string, Promise<any>>()

  async queue<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key) as Promise<T>
    }

    const promise = requestFn().finally(() => {
      this.activeRequests.delete(key)
    })

    this.activeRequests.set(key, promise)
    return promise
  }

  cancel(key: string): boolean {
    return this.activeRequests.delete(key)
  }

  clear(): void {
    this.activeRequests.clear()
  }

  size(): number {
    return this.activeRequests.size
  }
}

/**
 * 高级订阅服务
 */
export class AdvancedSubscriptionService {
  private cacheManager: CacheManager
  private requestQueue: RequestQueueManager
  private readonly defaultTTL = 300000 // 5分钟
  private readonly baseURL = '/api/subscriptions'

  constructor() {
    this.cacheManager = new CacheManager()
    this.requestQueue = new RequestQueueManager()

    // 定期清理过期缓存
    setInterval(() => {
      this.cacheManager.cleanup()
    }, 60000) // 每分钟清理一次
  }

  /**
   * 获取所有订阅
   */
  async getSubscriptions(options: {
    useCache?: boolean
    forceRefresh?: boolean
  } = {}): Promise<Subscription[]> {
    const { useCache = true, forceRefresh = false } = options
    const cacheKey = 'subscriptions'

    if (forceRefresh) {
      this.cacheManager.delete(cacheKey)
    }

    if (useCache) {
      const cached = this.cacheManager.get<Subscription[]>(cacheKey)
      if (cached) {
        return cached
      }
    }

    try {
      const response = await apiRequest.get<Subscription[]>(this.baseURL)

      if (!response.success) {
        throw new Error(typeof response.error === 'string' ? response.error : '获取订阅列表失败')
      }

      const data = response.data || []
      if (useCache) {
        this.cacheManager.set(cacheKey, data)
      }

      return data
    } catch (error) {
      throw SimpleErrorHandler.handleApiError(error)
    }
  }

  /**
   * 创建订阅
   */
  async createSubscription(data: SubscriptionFormData): Promise<Subscription> {
    const nameValidation = validateSubscriptionName(data.name)
    if (!nameValidation.valid) {
      throw new Error(nameValidation.error || '订阅名称无效')
    }

    const urlValidation = validateSubscriptionUrl(data.url)
    if (!urlValidation.valid) {
      throw new Error(urlValidation.error || '订阅链接无效')
    }

    try {
      const response = await apiRequest.post<Subscription>(this.baseURL, data)

      if (!response.success) {
        throw new Error(typeof response.error === 'string' ? response.error : '创建订阅失败')
      }

      // 清除相关缓存
      this.cacheManager.delete('subscriptions')
      this.cacheManager.delete('subscription-stats')

      return response.data!
    } catch (error) {
      throw SimpleErrorHandler.handleApiError(error)
    }
  }

  /**
   * 更新订阅
   */
  async updateSubscription(id: string, data: Partial<SubscriptionFormData>): Promise<Subscription> {
    if (data.name) {
      const nameValidation = validateSubscriptionName(data.name)
      if (!nameValidation.valid) {
        throw new Error(nameValidation.error || '订阅名称无效')
      }
    }

    if (data.url) {
      const urlValidation = validateSubscriptionUrl(data.url)
      if (!urlValidation.valid) {
        throw new Error(urlValidation.error || '订阅链接无效')
      }
    }

    try {
      const response = await apiRequest.put<Subscription>(`${this.baseURL}/${id}`, data)

      if (!response.success) {
        throw new Error(typeof response.error === "string" ? response.error : '更新订阅失败')
      }

      // 清除相关缓存
      this.cacheManager.delete('subscriptions')
      this.cacheManager.delete(`subscription-${id}`)
      this.cacheManager.delete('subscription-stats')

      return response.data!
    } catch (error) {
      throw SimpleErrorHandler.handleApiError(error)
    }
  }

  /**
   * 删除订阅
   */
  async deleteSubscription(id: string): Promise<void> {
    try {
      const response = await apiRequest.delete(`${this.baseURL}/${id}`)

      if (!response.success) {
        throw new Error(typeof response.error === "string" ? response.error : '删除订阅失败')
      }

      // 清除相关缓存
      this.cacheManager.delete('subscriptions')
      this.cacheManager.delete(`subscription-${id}`)
      this.cacheManager.delete('subscription-stats')
    } catch (error) {
      throw SimpleErrorHandler.handleApiError(error)
    }
  }

  /**
   * 批量删除订阅
   */
  async batchDeleteSubscriptions(ids: string[]): Promise<BatchOperationResult> {
    try {
      const response = await apiRequest.post<BatchOperationResult>(
        `${this.baseURL}/batch-delete`,
        { subscriptionIds: ids }
      )

      if (!response.success) {
        throw new Error(typeof response.error === "string" ? response.error : '批量删除失败')
      }

      // 清除相关缓存
      this.cacheManager.deletePattern('subscription-.*')
      this.cacheManager.delete('subscriptions')
      this.cacheManager.delete('subscription-stats')

      return response.data!
    } catch (error) {
      throw SimpleErrorHandler.handleApiError(error)
    }
  }

  /**
   * 更新订阅内容
   */
  async updateSubscriptionContent(id: string, options: {
    timeout?: number
  } = {}): Promise<Subscription> {
    const { timeout = 60000 } = options
    const cacheKey = `subscription-update-${id}`

    return this.requestQueue.queue(cacheKey, async () => {
      try {
        const response = await apiRequest.post<Subscription>(
          `${this.baseURL}/${id}/update`,
          undefined,
          { timeout }
        )

        if (!response.success) {
          throw new Error(typeof response.error === "string" ? response.error : '更新订阅失败')
        }

        // 清除相关缓存
        this.cacheManager.delete('subscriptions')
        this.cacheManager.delete(`subscription-${id}`)
        this.cacheManager.delete('subscription-stats')

        return response.data!
      } catch (error) {
        throw SimpleErrorHandler.handleApiError(error)
      }
    })
  }

  /**
   * 批量更新订阅
   */
  async batchUpdateSubscriptions(
    ids: string[],
    config: BatchUpdateConfig
  ): Promise<SubscriptionUpdateLog[]> {
    try {
      const response = await apiRequest.post<SubscriptionUpdateLog[]>(
        `${this.baseURL}/batch-update`,
        { subscriptionIds: ids, config }
      )

      if (!response.success) {
        throw new Error(typeof response.error === "string" ? response.error : '批量更新失败')
      }

      // 清除相关缓存
      this.cacheManager.deletePattern('subscription-.*')
      this.cacheManager.delete('subscriptions')
      this.cacheManager.delete('subscription-stats')

      return response.data!
    } catch (error) {
      throw SimpleErrorHandler.handleApiError(error)
    }
  }

  /**
   * 预览订阅
   */
  async previewSubscription(
    id: string,
    options: {
      applyRules?: boolean
      timeout?: number
    } = {}
  ): Promise<SubscriptionPreviewData> {
    const { applyRules = true, timeout = 30000 } = options

    try {
      const response = await apiRequest.post<SubscriptionPreviewData>(
        `${this.baseURL}/${id}/preview`,
        { apply_rules: applyRules },
        { timeout }
      )

      if (!response.success) {
        throw new Error(typeof response.error === "string" ? response.error : '预览订阅失败')
      }

      return response.data!
    } catch (error) {
      throw SimpleErrorHandler.handleApiError(error)
    }
  }

  /**
   * 预览订阅URL
   */
  async previewSubscriptionUrl(
    url: string,
    options: {
      applyRules?: boolean
      timeout?: number
    } = {}
  ): Promise<SubscriptionPreviewData> {
    const { applyRules = true, timeout = 30000 } = options

    try {
      const response = await apiRequest.post<SubscriptionPreviewData>(
        `${this.baseURL}/preview-url`,
        { url, apply_rules: applyRules },
        { timeout }
      )

      if (!response.success) {
        throw new Error(typeof response.error === "string" ? response.error : '预览链接失败')
      }

      return response.data!
    } catch (error) {
      throw SimpleErrorHandler.handleApiError(error)
    }
  }

  /**
   * 批量导入订阅
   */
  async batchImportSubscriptions(data: BatchImportData): Promise<{
    created: number
    updated: number
    skipped: number
    errors: string[]
  }> {
    try {
      const response = await apiRequest.post<{
        created: number
        updated: number
        skipped: number
        errors: string[]
      }>(`${this.baseURL}/batch-import`, data)

      if (!response.success) {
        throw new Error(typeof response.error === "string" ? response.error : '批量导入失败')
      }

      // 清除相关缓存
      this.cacheManager.delete('subscriptions')
      this.cacheManager.delete('subscription-stats')

      return response.data!
    } catch (error) {
      throw SimpleErrorHandler.handleApiError(error)
    }
  }

  /**
   * 批量移动订阅到分组
   */
  async batchMoveSubscriptions(ids: string[], groupId: string | null): Promise<void> {
    try {
      const response = await apiRequest.post(
        `${this.baseURL}/batch-move-group`,
        { subscriptionIds: ids, groupId }
      )

      if (!response.success) {
        throw new Error(typeof response.error === "string" ? response.error : '批量移动分组失败')
      }

      // 清除相关缓存
      this.cacheManager.delete('subscriptions')
      this.cacheManager.delete('subscription-stats')
    } catch (error) {
      throw SimpleErrorHandler.handleApiError(error)
    }
  }

  /**
   * 测试订阅连接
   */
  async testSubscriptionConnection(id: string, options: {
    timeout?: number
  } = {}): Promise<{
    success: boolean
    nodeCount?: number
    error?: string
    latency?: number
  }> {
    const { timeout = 30000 } = options

    try {
      const response = await apiRequest.post<{
        success: boolean
        nodeCount?: number
        error?: string
        latency?: number
      }>(`${this.baseURL}/${id}/test`, undefined, { timeout })

      if (!response.success) {
        throw new Error(typeof response.error === "string" ? response.error : '测试连接失败')
      }

      return response.data!
    } catch (error) {
      throw SimpleErrorHandler.handleApiError(error)
    }
  }

  /**
   * 获取订阅统计信息
   */
  async getSubscriptionStats(): Promise<{
    total: number
    active: number
    failed: number
    disabled: number
    successRate: number
    totalNodes: number
    healthScore: number
  }> {
    const cacheKey = 'subscription-stats'

    // 尝试从缓存获取
    const cached = this.cacheManager.get<any>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await apiRequest.get<any>(`${this.baseURL}/stats`)

      if (!response.success) {
        throw new Error(typeof response.error === "string" ? response.error : '获取统计信息失败')
      }

      // 缓存1分钟
      this.cacheManager.set(cacheKey, response.data, 60000)
      return response.data
    } catch (error) {
      throw SimpleErrorHandler.handleApiError(error)
    }
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.cacheManager.clear()
    this.requestQueue.clear()
  }

  /**
   * 获取缓存信息
   */
  getCacheInfo(): {
    size: number
    activeRequests: number
  } {
    return {
      size: this.cacheManager.size(),
      activeRequests: this.requestQueue.size()
    }
  }
}

// 创建单例实例
export const advancedSubscriptionService = new AdvancedSubscriptionService()

/**
 * 便捷的订阅服务导出
 */
export const subscriptionService = {
  // 基础CRUD
  getAll: (options?: any) => advancedSubscriptionService.getSubscriptions(options),
  getById: (id: string) => advancedSubscriptionService.getSubscriptions().then(subs => subs.find(s => s.id === id) || null),
  create: (data: SubscriptionFormData) => advancedSubscriptionService.createSubscription(data),
  update: (id: string, data: Partial<SubscriptionFormData>) => advancedSubscriptionService.updateSubscription(id, data),
  delete: (id: string) => advancedSubscriptionService.deleteSubscription(id),

  // 批量操作
  batchDelete: (ids: string[]) => advancedSubscriptionService.batchDeleteSubscriptions(ids),
  batchUpdate: (ids: string[], config: BatchUpdateConfig) => advancedSubscriptionService.batchUpdateSubscriptions(ids, config),
  batchImport: (data: BatchImportData) => advancedSubscriptionService.batchImportSubscriptions(data),
  batchMove: (ids: string[], groupId: string | null) => advancedSubscriptionService.batchMoveSubscriptions(ids, groupId),

  // 高级功能
  updateContent: (id: string, options?: any) => advancedSubscriptionService.updateSubscriptionContent(id, options),
  preview: (id: string, options?: any) => advancedSubscriptionService.previewSubscription(id, options),
  previewUrl: (url: string, options?: any) => advancedSubscriptionService.previewSubscriptionUrl(url, options),
  testConnection: (id: string, options?: any) => advancedSubscriptionService.testSubscriptionConnection(id, options),

  // 工具功能
  getStats: () => advancedSubscriptionService.getSubscriptionStats(),

  // 缓存管理
  clearCache: () => advancedSubscriptionService.clearCache(),
  getCacheInfo: () => advancedSubscriptionService.getCacheInfo()
}