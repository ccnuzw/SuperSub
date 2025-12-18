/**
 * 用户管理业务逻辑
 * 分离业务逻辑和视图层
 */

import { ref, computed, type Ref } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import type { User } from '@/types'
import { useAuthStore } from '@/stores/auth'
import httpClient from '@/services/http/HttpClient'

// 用户管理状态
interface IUserManagementState {
  users: Ref<User[]>
  loading: Ref<boolean>
  settingsLoading: Ref<boolean>
  allowRegistration: Ref<boolean>
  showAddModal: Ref<boolean>
}

// 用户管理方法
interface IUserManagementActions {
  fetchUsers: () => Promise<void>
  fetchSettings: () => Promise<void>
  handleUpdateRoleOnUser: (user: User) => void
  handleDeleteUserAction: (user: User) => void
  handleExportUsers: () => void
  handleAddUserSuccess: () => Promise<void>
  handleHeaderActionOn: (event: CustomEvent) => Promise<void>
}

export const useUserManagement = (): IUserManagementState & IUserManagementActions => {
  // 响应式状态
  const users = ref<User[]>([])
  const loading = ref(true)
  const settingsLoading = ref(true)
  const allowRegistration = ref(false)
  const showAddModal = ref(false)

  // 工具
  const message = useMessage()
  const dialog = useDialog()
  const authStore = useAuthStore()

  // 计算属性
  const hasUsers = computed(() => users.value.length > 0)
  const userCount = computed(() => users.value.length)

  /**
   * 获取用户列表
   */
  const fetchUsers = async (): Promise<void> => {
    if (!authStore.isAuthenticated) return

    loading.value = true
    try {
      const response = await httpClient.get('/admin/users')
      if (response.success) {
        users.value = response.data as User[]
      } else {
        message.error(response.message || '获取用户列表失败')
      }
    } catch (error: any) {
      message.error(`请求失败: ${error.message}`)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取系统设置
   */
  const fetchSettings = async (): Promise<void> => {
    if (!authStore.isAuthenticated) return

    settingsLoading.value = true
    try {
      const response = await httpClient.get('/admin/system-settings')
      if (response.success && response.data) {
        allowRegistration.value = (response.data as { allow_registration: string }).allow_registration === 'true'
      } else {
        message.error(response.message || '获取系统设置失败')
      }
    } catch (error: any) {
      message.error(`请求失败: ${error.message}`)
    } finally {
      settingsLoading.value = false
    }
  }

  /**
   * 处理系统设置变更
   */
  const handleSettingsChange = async (value: boolean): Promise<void> => {
    settingsLoading.value = true
    try {
      const response = await httpClient.post('/admin/system-settings', {
        allow_registration: String(value),
      })
      if (response.success) {
        message.success('设置更新成功')
        allowRegistration.value = value
      } else {
        message.error(response.message || '更新设置失败')
        allowRegistration.value = !value
      }
    } catch (error: any) {
      message.error(`请求失败: ${error.message}`)
      allowRegistration.value = !value
    } finally {
      settingsLoading.value = false
    }
  }

  /**
   * 处理用户角色更新
   */
  const handleUpdateRoleOnUser = (user: User): void => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    dialog.warning({
      title: '确认更改角色',
      content: `确定要将用户 "${user.username}" 的角色更改为 "${newRole}" 吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          const response = await httpClient.put(`/admin/users/${user.id}`, { role: newRole })
          if (response.success) {
            message.success('用户角色更新成功')
            await fetchUsers()
          } else {
            message.error(response.message || '更新失败')
          }
        } catch (error: any) {
          message.error(`请求失败: ${error.message}`)
        }
      }
    })
  }

  /**
   * 处理用户删除
   */
  const handleDeleteUserAction = (user: User): void => {
    dialog.error({
      title: '确认删除用户',
      content: `确定要永久删除用户 "${user.username}" 吗？此操作不可撤销。`,
      positiveText: '确定删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          const response = await httpClient.delete(`/admin/users/${user.id}`)
          if (response.success) {
            message.success('用户删除成功')
            await fetchUsers()
          } else {
            message.error(response.message || '删除失败')
          }
        } catch (error: any) {
          message.error(`请求失败: ${error.message}`)
        }
      }
    })
  }

  /**
   * 处理用户导出
   */
  const handleExportUsers = (): void => {
    const usersData = users.value.map(user => ({
      ID: user.id,
      用户名: user.username,
      角色: user.role,
      创建时间: new Date(user.created_at).toLocaleString(),
      更新时间: new Date(user.updated_at).toLocaleString()
    }))

    const csvContent = [
      Object.keys(usersData[0]).join(','),
      ...usersData.map(user => Object.values(user).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `用户列表_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success('用户列表已导出')
  }

  /**
   * 处理添加用户成功
   */
  const handleAddUserSuccess = async (): Promise<void> => {
    await fetchUsers()
  }

  /**
   * 处理顶部栏事件
   */
  const handleHeaderActionOn = async (event: CustomEvent): Promise<void> => {
    const { type, action } = event.detail

    if (type === 'primary') {
      switch (action) {
        case 'add-user':
          showAddModal.value = true
          break
      }
    } else if (type === 'menu') {
      switch (action) {
        case 'refresh':
          await fetchUsers()
          message.success('数据刷新完成')
          break
        case 'export':
          handleExportUsers()
          break
      }
    }
  }

  return {
    // 状态
    users,
    loading,
    settingsLoading,
    allowRegistration,
    showAddModal,
    hasUsers,
    userCount,

    // 方法
    fetchUsers,
    fetchSettings,
    handleSettingsChange,
    handleUpdateRoleOnUser,
    handleDeleteUserAction,
    handleExportUsers,
    handleAddUserSuccess,
    handleHeaderActionOn
  }
}