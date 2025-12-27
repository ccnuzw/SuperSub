import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import { profilesApi } from '@/api/profiles'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import type { Profile } from '@/types'

export function useProfiles() {
    const profiles = ref<Profile[]>([])
    const loading = ref(true)
    const router = useRouter()
    const message = useMessage()
    const dialog = useDialog()
    const authStore = useAuthStore()

    const fetchProfiles = async () => {
        if (!authStore.isAuthenticated) return
        loading.value = true
        try {
            const response = await profilesApi.fetchProfiles()
            if (response.data.success) {
                profiles.value = response.data.data || []
            } else {
                message.error(response.data.message || '获取配置列表失败')
            }
        } catch (err: any) {
            if (!axios.isCancel(err)) message.error(err.message || '请求失败')
        } finally {
            loading.value = false
        }
    }

    const deleteProfile = (row: Profile) => {
        dialog.warning({
            title: '确认删除',
            content: `确定要删除配置 "${row.name}" 吗？`,
            positiveText: '确定',
            negativeText: '取消',
            onPositiveClick: async () => {
                try {
                    const response = await profilesApi.deleteProfile(row.id)
                    if (response.data.success) {
                        message.success('配置删除成功')
                        fetchProfiles()
                    } else {
                        message.error(response.data.message || '删除失败')
                    }
                } catch (err: any) {
                    if (!axios.isCancel(err)) message.error(err.message || '请求失败')
                }
            },
        })
    }

    const copyProfileLink = (row: Profile) => {
        const token = authStore.user?.sub_token
        if (!token || !row.alias) {
            message.error('无法复制链接：缺少订阅令牌或链接别名。')
            return
        }
        const url = `${window.location.origin}/api/public/${token}/${row.alias}`
        navigator.clipboard.writeText(url).then(
            () => message.success('链接已复制'),
            () => message.error('复制失败')
        )
    }

    const editProfile = (row: Profile) => {
        router.push({ name: 'edit-profile', params: { id: row.id } })
    }

    const createProfile = () => {
        router.push({ name: 'new-profile' })
    }

    return {
        profiles,
        loading,
        fetchProfiles,
        deleteProfile,
        copyProfileLink,
        editProfile,
        createProfile
    }
}
