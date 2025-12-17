/**
 * 订阅分组管理业务逻辑层
 * 遵循分层架构：视图层 → 组件层 → 业务逻辑层 → 服务层 → 基础设施层
 */

import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import type { ISubscriptionGroup } from '@/types'
import { httpClient } from '@/services/http/HttpClient'

/**
 * 分组管理配置选项
 */
export interface IGroupManagementOptions {
  validateName?: boolean
  checkDuplicates?: boolean
}

/**
 * 分组操作结果
 */
export interface IGroupOperationResult {
  success: boolean
  data?: ISubscriptionGroup
  error?: string
}

/**
 * 订阅分组管理 Composable
 * 负责分组的CRUD操作业务逻辑，包括验证、错误处理、状态管理
 */
export function useSubscriptionGroupManagement() {
  const message = useMessage()

  // 状态管理
  const loading = ref(false)
  const groups = ref<ISubscriptionGroup[]>([])
  const error = ref<string | null>(null)

  // 配置选项
  const options = ref<IGroupManagementOptions>({
    validateName: true,
    checkDuplicates: true
  })

  // 计算属性
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const errorMessage = computed(() => error.value)
  const groupCount = computed(() => groups.value.length)

  const groupOptions = computed(() => [
    { label: '未分组', value: null },
    ...groups.value.map(group => ({
      label: group.name,
      value: group.id
    }))
  ])

  // 验证方法
  const validateGroupName = (name: string, excludeId?: string): { valid: boolean; error?: string } => {
    if (!options.value.validateName) return { valid: true }

    const trimmedName = name.trim()

    if (!trimmedName) {
      return { valid: false, error: '分组名称不能为空' }
    }

    if (trimmedName.length < 1) {
      return { valid: false, error: '分组名称至少需要1个字符' }
    }

    if (trimmedName.length > 50) {
      return { valid: false, error: '分组名称不能超过50个字符' }
    }

    if (options.value.checkDuplicates) {
      const duplicate = groups.value.find(group =>
        group.name === trimmedName && group.id !== excludeId
      )

      if (duplicate) {
        return { valid: false, error: '分组名称已存在' }
      }
    }

    return { valid: true }
  }

  const validateGroupData = (groupData: Partial<ISubscriptionGroup>, excludeId?: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (groupData.name !== undefined) {
      const nameValidation = validateGroupName(groupData.name, excludeId)
      if (!nameValidation.valid && nameValidation.error) {
        errors.push(nameValidation.error)
      }
    }

    if (groupData.description !== undefined && groupData.description && groupData.description.length > 200) {
      errors.push('分组描述不能超过200个字符')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // 清除错误状态
  const clearError = () => {
    error.value = null
  }

  // 设置错误状态
  const setError = (errorMessage: string) => {
    error.value = errorMessage
  }

  // 获取分组列表
  const fetchGroups = async (): Promise<void> => {
    loading.value = true
    clearError()

    try {
      const response = await httpClient.get('/subscription-groups')

      if (response.success && response.data) {
        groups.value = Array.isArray(response.data) ? response.data : []
      } else {
        throw new Error(response.message || '获取分组列表失败')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '获取分组列表失败'
      setError(errorMessage)
      message.error(errorMessage)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 创建分组
  const createGroup = async (groupData: Partial<ISubscriptionGroup>): Promise<IGroupOperationResult> => {
    loading.value = true
    clearError()

    try {
      // 验证数据
      const validation = validateGroupData(groupData)
      if (!validation.valid) {
        setError(validation.errors[0])
        message.error(validation.errors[0])
        return {
          success: false,
          error: validation.errors[0]
        }
      }

      // 准备创建数据
      const createData = {
        name: groupData.name!.trim(),
        description: groupData.description?.trim() || null,
        color: groupData.color || '#2080f0',
        icon: groupData.icon || null
      }

      // 调用API
      const response = await httpClient.post('/subscription-groups', createData)

      if (response.success && response.data) {
        const newGroup = response.data as ISubscriptionGroup

        // 更新本地状态
        groups.value.push(newGroup)

        message.success('分组创建成功')
        return {
          success: true,
          data: newGroup
        }
      } else {
        throw new Error(response.message || '创建分组失败')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '创建分组失败'
      setError(errorMessage)

      // 特殊处理重复名称错误
      if (errorMessage.includes('UNIQUE constraint failed') || errorMessage.includes('已存在')) {
        message.error('该分组名称已存在')
      } else {
        message.error(errorMessage)
      }

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      loading.value = false
    }
  }

  // 更新分组
  const updateGroup = async (groupId: string, groupData: Partial<ISubscriptionGroup>): Promise<IGroupOperationResult> => {
    loading.value = true
    clearError()

    try {
      // 验证数据
      const validation = validateGroupData(groupData, groupId)
      if (!validation.valid) {
        setError(validation.errors[0])
        message.error(validation.errors[0])
        return {
          success: false,
          error: validation.errors[0]
        }
      }

      // 准备更新数据
      const updateData: Partial<ISubscriptionGroup> = {}

      if (groupData.name !== undefined) {
        updateData.name = groupData.name.trim()
      }
      if (groupData.description !== undefined) {
        updateData.description = groupData.description?.trim() || null
      }
      if (groupData.color !== undefined) {
        updateData.color = groupData.color
      }
      if (groupData.icon !== undefined) {
        updateData.icon = groupData.icon
      }

      // 调用API
      const response = await httpClient.put(`/subscription-groups/${groupId}`, updateData)

      if (response.success) {
        // 更新本地状态
        const groupIndex = groups.value.findIndex(g => g.id === groupId)
        if (groupIndex !== -1) {
          groups.value[groupIndex] = { ...groups.value[groupIndex], ...updateData }
        }

        message.success('分组更新成功')
        return {
          success: true,
          data: groups.value.find(g => g.id === groupId)
        }
      } else {
        throw new Error(response.message || '更新分组失败')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '更新分组失败'
      setError(errorMessage)

      // 特殊处理重复名称错误
      if (errorMessage.includes('UNIQUE constraint failed') || errorMessage.includes('已存在')) {
        message.error('该分组名称已存在')
      } else {
        message.error(errorMessage)
      }

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      loading.value = false
    }
  }

  // 删除分组
  const deleteGroup = async (groupId: string): Promise<IGroupOperationResult> => {
    loading.value = true
    clearError()

    try {
      // 检查分组是否存在
      const group = groups.value.find(g => g.id === groupId)
      if (!group) {
        const error = '分组不存在'
        setError(error)
        message.error(error)
        return {
          success: false,
          error
        }
      }

      // 调用API
      const response = await httpClient.delete(`/subscription-groups/${groupId}`)

      if (response.success) {
        // 更新本地状态
        groups.value = groups.value.filter(g => g.id !== groupId)

        message.success(`分组"${group.name}"删除成功`)
        return {
          success: true
        }
      } else {
        throw new Error(response.message || '删除分组失败')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '删除分组失败'
      setError(errorMessage)
      message.error(errorMessage)
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      loading.value = false
    }
  }

  // 根据ID查找分组
  const findGroupById = (groupId: string): ISubscriptionGroup | undefined => {
    return groups.value.find(g => g.id === groupId)
  }

  // 根据名称查找分组
  const findGroupByName = (name: string): ISubscriptionGroup | undefined => {
    return groups.value.find(g => g.name === name)
  }

  // 重置状态
  const reset = () => {
    loading.value = false
    groups.value = []
    error.value = null
  }

  return {
    // 状态
    loading: isLoading,
    error: errorMessage,
    hasError,
    groups,
    groupCount,
    groupOptions,

    // 配置
    options,

    // 方法
    clearError,
    setError,
    validateGroupName,
    validateGroupData,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    findGroupById,
    findGroupByName,
    reset
  }
}