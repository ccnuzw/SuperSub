/**
 * 批量导入订阅的业务逻辑层
 * 遵循分层架构：视图层 → 组件层 → 业务逻辑层 → 服务层 → 基础设施层
 */

import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import type { ISubscription, ISubscriptionGroup } from '@/types'
import { httpClient } from '@/services/http/HttpClient'

/**
 * 批量导入订阅的数据结构
 */
export interface IBatchImportSubscription {
  name: string
  url: string
  group_id?: string | null
}

/**
 * 批量导入的配置选项
 */
export interface IBatchImportOptions {
  groupId?: string | null
  validateUrls?: boolean
  skipDuplicates?: boolean
}

/**
 * 批量导入的结果
 */
export interface IBatchImportResult {
  total: number
  success: number
  failed: number
  duplicates: number
  errors: Array<{
    subscription: IBatchImportSubscription
    error: string
  }>
}

/**
 * 订阅批量导入 Composable
 * 负责批量导入的业务逻辑，包括数据验证、错误处理、进度跟踪等
 */
export function useSubscriptionBatchImport() {
  const message = useMessage()

  // 状态管理
  const loading = ref(false)
  const importing = ref(false)
  const progress = ref(0)
  const subscriptions = ref<IBatchImportSubscription[]>([])
  const selectedGroupId = ref<string | null>(null)

  // 配置选项
  const options = ref<IBatchImportOptions>({
    validateUrls: true,
    skipDuplicates: true
  })

  // 计算属性
  const hasSubscriptions = computed(() => subscriptions.value.length > 0)
  const isValid = computed(() => {
    return subscriptions.value.every(sub =>
      sub.name.trim() &&
      sub.url.trim() &&
      isValidUrl(sub.url.trim())
    )
  })

  const progressPercentage = computed(() => {
    return hasSubscriptions.value ? (progress.value / subscriptions.value.length) * 100 : 0
  })

  // URL验证函数
  const isValidUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  // 从文本解析订阅
  const parseSubscriptionsFromText = (text: string): IBatchImportSubscription[] => {
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    const parsed: IBatchImportSubscription[] = []

    for (const line of lines) {
      // 尝试解析不同的格式
      // 格式1: name|url
      if (line.includes('|')) {
        const [name, ...urlParts] = line.split('|')
        const url = urlParts.join('|').trim()
        if (name.trim() && url && isValidUrl(url)) {
          parsed.push({
            name: name.trim(),
            url,
            group_id: selectedGroupId.value
          })
        }
      }
      // 格式2: 纯URL，自动生成名称
      else if (isValidUrl(line)) {
        const url = line.trim()
        const name = generateNameFromUrl(url)
        parsed.push({
          name,
          url,
          group_id: selectedGroupId.value
        })
      }
      // 格式3: name url (用空格分隔)
      else {
        const parts = line.split(/\s+/)
        if (parts.length >= 2) {
          const url = parts[parts.length - 1]
          if (isValidUrl(url)) {
            const name = parts.slice(0, -1).join(' ')
            parsed.push({
              name: name.trim(),
              url,
              group_id: selectedGroupId.value
            })
          }
        }
      }
    }

    return parsed
  }

  // 从URL生成名称
  const generateNameFromUrl = (url: string): string => {
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname.replace(/^www\./, '')

      // 尝试从路径生成名称
      if (urlObj.pathname && urlObj.pathname !== '/') {
        const pathParts = urlObj.pathname.split('/').filter(part => part)
        if (pathParts.length > 0) {
          return `${domain} - ${pathParts[pathParts.length - 1]}`
        }
      }

      return domain
    } catch {
      return 'Imported Subscription'
    }
  }

  // 验证订阅数据
  const validateSubscriptions = (subs: IBatchImportSubscription[]): {
    valid: IBatchImportSubscription[]
    invalid: Array<{ sub: IBatchImportSubscription; error: string }>
  } => {
    const valid: IBatchImportSubscription[] = []
    const invalid: Array<{ sub: IBatchImportSubscription; error: string }> = []

    for (const sub of subs) {
      if (!sub.name.trim()) {
        invalid.push({ sub, error: '订阅名称不能为空' })
      } else if (!sub.url.trim()) {
        invalid.push({ sub, error: '订阅链接不能为空' })
      } else if (!isValidUrl(sub.url.trim())) {
        invalid.push({ sub, error: '订阅链接格式无效' })
      } else {
        valid.push({
          ...sub,
          name: sub.name.trim(),
          url: sub.url.trim()
        })
      }
    }

    return { valid, invalid }
  }

  // 添加订阅
  const addSubscription = (subscription: IBatchImportSubscription) => {
    subscriptions.value.push({
      ...subscription,
      group_id: subscription.group_id || selectedGroupId.value
    })
  }

  // 移除订阅
  const removeSubscription = (index: number) => {
    subscriptions.value.splice(index, 1)
  }

  // 更新订阅
  const updateSubscription = (index: number, subscription: Partial<IBatchImportSubscription>) => {
    if (index >= 0 && index < subscriptions.value.length) {
      subscriptions.value[index] = { ...subscriptions.value[index], ...subscription }
    }
  }

  // 清空订阅列表
  const clearSubscriptions = () => {
    subscriptions.value = []
    progress.value = 0
  }

  // 从文本导入
  const importFromText = (text: string) => {
    const parsed = parseSubscriptionsFromText(text)
    const { valid, invalid } = validateSubscriptions(parsed)

    if (valid.length > 0) {
      subscriptions.value = [...subscriptions.value, ...valid]
      message.success(`成功解析 ${valid.length} 个订阅`)
    }

    if (invalid.length > 0) {
      message.warning(`${invalid.length} 个订阅解析失败，请检查格式`)
    }
  }

  // 执行批量导入
  const executeBatchImport = async (): Promise<IBatchImportResult> => {
    if (!isValid.value || !hasSubscriptions.value) {
      throw new Error('请先添加有效的订阅数据')
    }

    importing.value = true
    progress.value = 0

    const result: IBatchImportResult = {
      total: subscriptions.value.length,
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: []
    }

    try {
      // 分批处理，避免一次性发送过多请求
      const batchSize = 10
      const batches = []

      for (let i = 0; i < subscriptions.value.length; i += batchSize) {
        batches.push(subscriptions.value.slice(i, i + batchSize))
      }

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]

        try {
          const response = await httpClient.post('/subscriptions/batch-import', {
            subscriptions: batch.map(sub => ({
              name: sub.name,
              url: sub.url,
              group_id: sub.group_id || selectedGroupId.value
            })),
            groupId: selectedGroupId.value
          })

          if (response.success) {
            result.success += batch.length
          } else {
            result.failed += batch.length
            batch.forEach(sub => {
              result.errors.push({
                subscription: sub,
                error: response.message || '导入失败'
              })
            })
          }
        } catch (error: any) {
          result.failed += batch.length
          batch.forEach(sub => {
            result.errors.push({
              subscription: sub,
              error: error.response?.data?.message || error.message || '导入失败'
            })
          })
        }

        progress.value += batch.length

        // 添加延迟，避免请求过于频繁
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      // 显示结果消息
      if (result.success > 0) {
        message.success(`成功导入 ${result.success} 个订阅`)
      }

      if (result.failed > 0) {
        message.warning(`${result.failed} 个订阅导入失败`)
      }

      return result

    } finally {
      importing.value = false
    }
  }

  // 重置状态
  const reset = () => {
    loading.value = false
    importing.value = false
    progress.value = 0
    subscriptions.value = []
    selectedGroupId.value = null
    options.value = {
      validateUrls: true,
      skipDuplicates: true
    }
  }

  return {
    // 状态
    loading: loading as any,
    importing,
    progress,
    progressPercentage,
    hasSubscriptions,
    isValid,

    // 数据
    subscriptions,
    selectedGroupId,
    options,

    // 方法
    parseSubscriptionsFromText,
    generateNameFromUrl,
    validateSubscriptions,
    addSubscription,
    removeSubscription,
    updateSubscription,
    clearSubscriptions,
    importFromText,
    executeBatchImport,
    reset,
    isValidUrl
  }
}