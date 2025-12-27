import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { profilesApi } from '@/api/profiles'
import axios from 'axios'
import type { Profile, Node, LogEntry } from '@/types'
import type { ApiResponse } from '@/types'

export function useProfilePreview() {
    const message = useMessage()

    const showNodesPreviewModal = ref(false)
    const showLogsModal = ref(false)
    const loadingNodesPreview = ref(false)
    const currentProfileForPreview = ref<Profile | null>(null)

    const nodesPreviewData = ref<{
        nodes: Partial<Node>[];
        analysis: {
            total: number;
            protocols: Record<string, number>;
            regions: Record<string, number>;
        };
        mode: 'local' | 'remote';
        logs: LogEntry[];
    } | null>(null)

    const openPreview = async (row: Profile) => {
        currentProfileForPreview.value = row
        nodesPreviewData.value = null
        loadingNodesPreview.value = true
        showNodesPreviewModal.value = true

        try {
            const response = await profilesApi.previewNodes(row.id)
            const responseData = response.data as ApiResponse<any>

            if (typeof responseData !== 'string' && responseData.success) {
                if (responseData.data) {
                    nodesPreviewData.value = responseData.data
                }
            } else {
                const msg = typeof responseData === 'string' ? responseData : responseData.message
                message.error(msg || '加载预览失败')
                showNodesPreviewModal.value = false
            }
        } catch (err: any) {
            if (!axios.isCancel(err)) {
                message.error(err.message || '请求预览失败')
                showNodesPreviewModal.value = false
            }
        } finally {
            loadingNodesPreview.value = false
        }
    }

    const openLogs = () => {
        showLogsModal.value = true
    }

    return {
        showNodesPreviewModal,
        showLogsModal,
        loadingNodesPreview,
        currentProfileForPreview,
        nodesPreviewData,
        openPreview,
        openLogs
    }
}
