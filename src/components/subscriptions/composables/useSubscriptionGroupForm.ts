/**
 * 分组表单业务逻辑层
 * 遵循分层架构：视图层 → 组件层 → 业务逻辑层 → 服务层 → 基础设施层
 */

import { ref, computed, watch } from 'vue'
import { useMessage } from 'naive-ui'
import type { ISubscriptionGroup } from '@/types'
import { useSubscriptionGroupManagement, type IGroupOperationResult } from './useSubscriptionGroupManagement'

/**
 * 分组表单状态
 */
export interface IGroupFormState {
  group: ISubscriptionGroup | null
  loading: boolean
  showModal: boolean
}

/**
 * 分组表单操作结果
 */
export interface IGroupFormResult {
  success: boolean
  group?: ISubscriptionGroup
  error?: string
}

/**
 * 分组表单业务逻辑 Composable
 * 负责分组表单的完整业务逻辑，包括验证、提交、错误处理等
 */
export function useSubscriptionGroupForm() {
  const message = useMessage()

  // 使用分组管理业务逻辑
  const {
    createGroup,
    updateGroup,
    loading: groupManagementLoading
  } = useSubscriptionGroupManagement()

  // 表单状态
  const loading = ref(false)
  const showModal = ref(false)
  const editingGroup = ref<ISubscriptionGroup | null>(null)

  // 计算属性
  const isEditing = computed(() => !!editingGroup.value)
  const modalTitle = computed(() => isEditing.value ? '编辑分组' : '新建分组')

  // 打开创建分组表单
  const openCreateForm = () => {
    editingGroup.value = null
    showModal.value = true
  }

  // 打开编辑分组表单
  const openEditForm = (group: ISubscriptionGroup) => {
    editingGroup.value = group
    showModal.value = true
  }

  // 关闭表单
  const closeForm = () => {
    if (!loading.value) {
      showModal.value = false
      editingGroup.value = null
    }
  }

  // ���证表单数据
  const validateFormData = (formData: Partial<ISubscriptionGroup>): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    // 名称验证
    if (!formData.name || formData.name.trim().length === 0) {
      errors.push('分组名称不能为空')
    } else if (formData.name.trim().length < 1) {
      errors.push('分组名称至少需要1个字符')
    } else if (formData.name.trim().length > 50) {
      errors.push('分组名称不能超过50个字符')
    }

    // 描述验证
    if (formData.description && formData.description.length > 200) {
      errors.push('分组描述不能超过200个字符')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // 准备提交数据
  const prepareSubmitData = (formData: Partial<ISubscriptionGroup>): Partial<ISubscriptionGroup> => {
    return {
      name: formData.name?.trim() || '',
      description: formData.description?.trim() || null,
      color: formData.color || '#2080f0',
      icon: formData.icon || null
    }
  }

  // 处理表单提交
  const handleFormSubmit = async (formData: Partial<ISubscriptionGroup>): Promise<IGroupFormResult> => {
    if (loading.value) {
      return {
        success: false,
        error: '操作进行中，请稍候'
      }
    }

    // 验证表单数据
    const validation = validateFormData(formData)
    if (!validation.valid) {
      const error = validation.errors[0]
      message.error(error)
      return {
        success: false,
        error
      }
    }

    // 准备提交数据
    const submitData = prepareSubmitData(formData)

    try {
      loading.value = true

      let result: IGroupOperationResult

      if (isEditing.value && editingGroup.value) {
        // 编辑模式
        result = await updateGroup(editingGroup.value.id, submitData)
      } else {
        // 创建模式
        result = await createGroup(submitData)
      }

      if (result.success) {
        // 操作成功
        message.success(isEditing.value ? '分组更新成功' : '分组创建成功')

        // 延迟关闭表单，让用户看到成功消息
        setTimeout(() => {
          closeForm()
        }, 1000)

        return {
          success: true,
          group: result.data
        }
      } else {
        // 操作失败，错误已在Composable中处理
        return {
          success: false,
          error: result.error
        }
      }

    } catch (error: any) {
      // 意外错误
      const errorMessage = error.message || '操作失败'
      message.error(errorMessage)

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      loading.value = false
    }
  }

  // 重置表单状态
  const resetForm = () => {
    loading.value = false
    editingGroup.value = null
  }

  // 监听模态框关闭，重置状态
  watch(showModal, (show) => {
    if (!show) {
      resetForm()
    }
  })

  return {
    // 状态
    loading,
    showModal,
    editingGroup,
    isEditing,
    modalTitle,
    groupManagementLoading,

    // 方法
    openCreateForm,
    openEditForm,
    closeForm,
    handleFormSubmit,
    validateFormData,
    prepareSubmitData,
    resetForm
  }
}