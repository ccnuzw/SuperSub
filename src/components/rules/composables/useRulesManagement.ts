/**
 * 规则管理 Composable
 * 提供订阅和分组的规则管理功能
 */

import { ref } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type { ISubscriptionRule, IRuleContext } from '@/types'
import httpClient from '@/services/http/HttpClient'

/**
 * 规则管理 Composable
 */
export function useRulesManagement(contextType: 'subscription' | 'subscription-group') {
  const message = useMessage()
  const dialog = useDialog()

  // 状态
  const showRulesModal = ref(false)
  const loading = ref(false)
  const context = ref<IRuleContext | null>(null)
  const rules = ref<ISubscriptionRule[]>([])

  /**
   * 获取API基础路径
   */
  const getBaseUrl = (entity: any): string => {
    return contextType === 'subscription' ? '/subscriptions' : '/subscription-groups'
  }

  /**
   * 打开规则管理模态框
   */
  const openRulesModal = (entity: any) => {
    context.value = {
      type: contextType,
      entity
    }
    showRulesModal.value = true
    fetchRules()
  }

  /**
   * 获取规则列表
   */
  const fetchRules = async () => {
    if (!context.value) return

    loading.value = true
    const { entity } = context.value
    const baseUrl = getBaseUrl(entity)

    try {
      const response = await httpClient.get<{ success: boolean; data: ISubscriptionRule[]; message: string }>(
        `${baseUrl}/${entity.id}/rules`
      )
      if (response.success && response.data) {
        rules.value = response.data as unknown as ISubscriptionRule[]
      } else {
        message.error(response.message || '获取规则列表失败')
      }
    } catch (error: any) {
      message.error('请求规则列表失败')
      console.error('Failed to fetch rules:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存规则
   */
  const saveRule = async (rule: ISubscriptionRule | Omit<ISubscriptionRule, 'id'>) => {
    if (!context.value) return false

    const { entity } = context.value
    const baseUrl = getBaseUrl(entity)

    try {
      let response
      if ('id' in rule && rule.id) {
        // 更新现有规则
        response = await httpClient.put(`${baseUrl}/${entity.id}/rules/${rule.id}`, rule)
      } else {
        // 创建新规则
        response = await httpClient.post(`${baseUrl}/${entity.id}/rules`, rule)
      }

      if (response.success) {
        message.success(('id' in rule && rule.id) ? '规则更新成功' : '规则创建成功')
        await fetchRules()
        return true
      } else {
        message.error(response.message || '保存失败')
        return false
      }
    } catch (error: any) {
      message.error('请求失败')
      console.error('Failed to save rule:', error)
      return false
    }
  }

  /**
   * 删除规则
   */
  const deleteRule = async (rule: ISubscriptionRule) => {
    return new Promise<boolean>((resolve) => {
      dialog.warning({
        title: '确认删除规则',
        content: `确定要删除规则 "${rule.name}" 吗？`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
          if (!context.value) {
            resolve(false)
            return
          }

          const { entity } = context.value
          const baseUrl = getBaseUrl(entity)

          try {
            const response = await httpClient.delete(`${baseUrl}/${entity.id}/rules/${rule.id}`)
            if (response.success) {
              message.success('规则删除成功')
              await fetchRules()
              resolve(true)
            } else {
              message.error(response.message || '删除失败')
              resolve(false)
            }
          } catch (error: any) {
            message.error('请求失败')
            console.error('Failed to delete rule:', error)
            resolve(false)
          }
        },
        onNegativeClick: () => resolve(false)
      })
    })
  }

  /**
   * 更新规则状态
   */
  const updateRule = async (rule: ISubscriptionRule) => {
    if (!context.value) return false

    const { entity } = context.value
    const baseUrl = getBaseUrl(entity)

    try {
      const response = await httpClient.put(`${baseUrl}/${entity.id}/rules/${rule.id}`, {
        enabled: rule.enabled
      })
      if (response.success) {
        message.success('状态更新成功')
        await fetchRules()
        return true
      } else {
        message.error(response.message || '状态更新失败')
        return false
      }
    } catch (error: any) {
      message.error('请求失败')
      console.error('Failed to update rule:', error)
      return false
    }
  }

  return {
    // 状态
    showRulesModal,
    loading,
    context,
    rules,

    // 方法
    openRulesModal,
    fetchRules,
    saveRule,
    deleteRule,
    updateRule
  }
}
