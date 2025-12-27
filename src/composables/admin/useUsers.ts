import { ref } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { adminApi } from '@/api/admin'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

export function useUsers() {
    const message = useMessage()
    const dialog = useDialog()
    const authStore = useAuthStore()

    const loading = ref(true)
    const users = ref<User[]>([])
    const settingsLoading = ref(true)
    const allowRegistration = ref(false)

    const fetchUsers = async () => {
        if (!authStore.isAuthenticated) return
        loading.value = true
        try {
            const response = await adminApi.fetchUsers()
            if (response.data.success) {
                users.value = response.data.data || []
            } else {
                message.error(response.data.message || '获取用户列表失败')
            }
        } catch (error: any) {
            message.error(`请求失败: ${error.message}`)
        } finally {
            loading.value = false
        }
    }

    const fetchSettings = async () => {
        if (!authStore.isAuthenticated) return
        settingsLoading.value = true
        try {
            const response = await adminApi.fetchSystemSettings()
            if (response.data.success && response.data.data) {
                allowRegistration.value = response.data.data.allow_registration === 'true'
            } else {
                message.error('获取系统设置失败')
            }
        } catch (error: any) {
            message.error(`请求失败: ${error.message}`)
        } finally {
            settingsLoading.value = false
        }
    }

    const handleSettingsChange = async (value: boolean) => {
        settingsLoading.value = true
        try {
            const response = await adminApi.updateSystemSettings({
                allow_registration: String(value),
            })
            if (response.data.success) {
                message.success('设置更新成功')
                allowRegistration.value = value
            } else {
                message.error(response.data.message || '更新设置失败')
                // Revert the switch on failure
                allowRegistration.value = !value
            }
        } catch (error: any) {
            message.error(`请求失败: ${error.message}`)
            allowRegistration.value = !value
        } finally {
            settingsLoading.value = false
        }
    }

    const handleUpdateRole = (user: User) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin'
        dialog.warning({
            title: '确认更改角色',
            content: `确定要将用户 "${user.username}" 的角色更改为 "${newRole}" 吗？`,
            positiveText: '确定',
            negativeText: '取消',
            onPositiveClick: async () => {
                try {
                    const response = await adminApi.updateUserRole(user.id, newRole)
                    if (response.data.success) {
                        message.success('用户角色更新成功')
                        await fetchUsers()
                    } else {
                        message.error(response.data.message || '更新失败')
                    }
                } catch (error: any) {
                    message.error(`请求失败: ${error.message}`)
                }
            }
        })
    }

    const handleDeleteUser = (user: User) => {
        dialog.error({
            title: '确认删除用户',
            content: `确定要永久删除用户 "${user.username}" 吗？此操作不可撤销。`,
            positiveText: '确定删除',
            negativeText: '取消',
            onPositiveClick: async () => {
                try {
                    const response = await adminApi.deleteUser(user.id)
                    if (response.data.success) {
                        message.success('用户删除成功')
                        await fetchUsers()
                    } else {
                        message.error(response.data.message || '删除失败')
                    }
                } catch (error: any) {
                    message.error(`请求失败: ${error.message}`)
                }
            }
        })
    }

    return {
        users,
        loading,
        settingsLoading,
        allowRegistration,
        fetchUsers,
        fetchSettings,
        handleSettingsChange,
        handleUpdateRole,
        handleDeleteUser
    }
}
