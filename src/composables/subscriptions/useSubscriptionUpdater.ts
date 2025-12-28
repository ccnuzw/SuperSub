import { ref, reactive } from 'vue'
import { useDialog } from 'naive-ui'
import { useNotification } from '@/composables/useNotification'
import { subscriptionsApi } from '@/api/subscriptions'
import type { Subscription } from '@/types'

export function useSubscriptionUpdater(
    onUpdateRefreshed: (updatedSub: Subscription) => void,
    onDeleted?: () => void
) {
    const notify = useNotification()
    const dialog = useDialog()

    // State
    const showUpdateLogModal = ref(false)
    const updateLogLoading = ref(false)
    const updateStage = ref<'config' | 'progress'>('config')
    const updateProgress = ref({ current: 0, total: 0 })
    const updateLog = ref<{
        success: { name: string }[]
        failed: Subscription[]
        expiring: Subscription[]
    }>({ success: [], failed: [], expiring: [] })

    const subsToUpdate = ref<Subscription[]>([])
    let updateAbortController: AbortController | null = null

    const updateSettings = reactive({
        concurrency: 5,
        retries: 2,
        delay: 500,
        batchDelay: 1000,
        expiringDaysThreshold: 2,
        expiringTrafficThresholdGB: 1,
    })

    const prepareAndShowUpdateModal = (subs: Subscription[]) => {
        if (subs.length === 0) {
            notify.preset.noData('没有需要更新的订阅')
            return
        }
        subsToUpdate.value = subs
        updateLog.value = { success: [], failed: [], expiring: [] }
        updateProgress.value = { current: 0, total: subs.length }
        updateStage.value = 'config'
        showUpdateLogModal.value = true
    }

    const handleUpdateSingle = async (sub: Subscription, silent = false, signal?: AbortSignal) => {
        try {
            const response = await subscriptionsApi.updateFromUrl(sub.id, signal)
            if (response.data.success) {
                if (!silent) notify.preset.subscriptionUpdateSuccess(sub.name, response.data.data?.node_count)
                if (response.data.data) {
                    onUpdateRefreshed(response.data.data)
                }
                return { success: true, data: response.data.data! }
            } else {
                if (!silent) notify.preset.subscriptionUpdateFailed(sub.name, response.data.message)
                return { success: false, data: sub, error: response.data.message }
            }
        } catch (error: any) {
            if (error.name === 'AbortError') return { success: false, data: sub, error: '已中止' }
            if (!silent) notify.actionError.network(error.message)
            return { success: false, data: sub, error: error.message }
        }
    }

    const executeSubscriptionUpdates = async () => {
        if (subsToUpdate.value.length === 0) {
            notify.preset.noData('没有需要更新的订阅')
            return
        }

        updateStage.value = 'progress'
        updateLogLoading.value = true
        notify.info(`开始更新 ${subsToUpdate.value.length} 个订阅...`)

        updateAbortController = new AbortController()
        const signal = updateAbortController.signal

        const { concurrency, retries, delay } = updateSettings

        const tasks = subsToUpdate.value.map(sub => async () => {
            for (let i = 0; i <= retries; i++) {
                if (signal.aborted) return { success: false, data: sub, error: '已中止' }
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * i)) // Exponential backoff
                }

                const result = await handleUpdateSingle(sub, true, signal)
                if (result && result.success) {
                    return result
                }
                if (i === retries) {
                    return result
                }
            }
            return { success: false, data: sub, error: '未知重试错误' }
        })

        const executing = new Set<Promise<void>>()

        try {
            const updatePromises = tasks.map(task => async () => {
                const result = await task()
                updateProgress.value.current++
                if (result.success && result.data) {
                    const sub = result.data;
                    const trafficThreshold = updateSettings.expiringTrafficThresholdGB * 1024 * 1024 * 1024;
                    const isExpiring = (sub.remaining_days !== null && sub.remaining_days !== undefined && sub.remaining_days < updateSettings.expiringDaysThreshold) ||
                        (sub.remaining_traffic !== null && sub.remaining_traffic !== undefined && sub.remaining_traffic < trafficThreshold);

                    if (isExpiring) {
                        updateLog.value.expiring.push(sub);
                    } else {
                        updateLog.value.success.push({ name: sub.name });
                    }
                } else {
                    const failedSub = { ...result.data, error: result.error || '未知错误' };
                    updateLog.value.failed.push(failedSub);
                }
            })

            for (const promiseFn of updatePromises) {
                if (signal.aborted) break

                const p = promiseFn()
                executing.add(p)

                if (delay > 0) {
                    await new Promise(resolve => setTimeout(resolve, delay))
                }

                if (executing.size >= concurrency) {
                    await Promise.race(executing)
                }

                p.finally(() => executing.delete(p))
            }

            await Promise.allSettled(executing)

        } catch (error) {
            console.error('An unexpected error occurred during update execution:', error)
        } finally {
            updateAbortController = null
            updateLogLoading.value = false
        }
    }

    const handleCancelUpdate = () => {
        if (updateLogLoading.value && updateAbortController) {
            updateAbortController.abort()
            updateLogLoading.value = false
        }
        showUpdateLogModal.value = false
    }

    const handleRetryFailed = () => {
        const failedSubsInfo = [...updateLog.value.failed].filter(s => s.error !== '已中止')
        prepareAndShowUpdateModal(failedSubsInfo)
    }

    const handleClearFailed = () => {
        const subsToClear = updateLog.value.failed.filter(sub => sub.error !== '已中止');
        if (subsToClear.length === 0) {
            notify.preset.noData('没有更新失败的订阅可以清除');
            return;
        }

        dialog.warning({
            title: '确认清除失败订阅',
            content: `即将删除 ${subsToClear.length} 个更新失败的订阅，此操作不可恢复。确定要继续吗？`,
            positiveText: '确定清除',
            negativeText: '取消',
            onPositiveClick: async () => {
                const idsToClear = subsToClear.map(sub => sub.id);
                try {
                    const response = await subscriptionsApi.batchDelete(idsToClear);
                    if (response.data.success) {
                        notify.actionSuccess.delete('订阅', idsToClear.length);
                        updateLog.value.failed = updateLog.value.failed.filter(sub => !idsToClear.includes(sub.id));
                    } else {
                        notify.actionError.delete('订阅', response.data.message);
                    }
                } catch (err) {
                    notify.actionError.network();
                }
            }
        });
    };

    // Similarly for handleClearExpiring...
    const handleClearExpiring = () => {
        const subsToClear = updateLog.value.expiring;

        if (subsToClear.length === 0) {
            notify.preset.noData('没有即将到期的订阅可以清除');
            return;
        }

        dialog.warning({
            title: '确认清除即将到期的订阅',
            content: `即将删除 ${subsToClear.length} 个即将到期的订阅，此操作不可恢复。确定要继续吗？`,
            positiveText: '确定清除',
            negativeText: '取消',
            onPositiveClick: async () => {
                const idsToClear = subsToClear.map(sub => sub.id);
                try {
                    const response = await subscriptionsApi.batchDelete(idsToClear);
                    if (response.data.success) {
                        notify.actionSuccess.delete('订阅', idsToClear.length);
                        updateLog.value.expiring = updateLog.value.expiring.filter(sub => !idsToClear.includes(sub.id));
                    } else {
                        notify.actionError.delete('订阅', response.data.message);
                    }
                } catch (err) {
                    notify.actionError.network();
                }
            }
        });
    };


    return {
        showUpdateLogModal,
        updateLogLoading,
        updateStage,
        updateProgress,
        updateLog,
        updateSettings,
        prepareAndShowUpdateModal,
        executeSubscriptionUpdates,
        handleCancelUpdate,
        handleRetryFailed,
        handleClearFailed,
        handleClearExpiring,
        handleUpdateSingle // Expose if needed for single button click
    }
}
