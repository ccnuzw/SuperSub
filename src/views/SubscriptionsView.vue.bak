<script setup lang="ts">
import { ref, onMounted, reactive, h, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog, NButton, NSpace, NTag, NDataTable, NPageHeader, NModal, NForm, NFormItem, NInput, NTooltip, NGrid, NGi, NStatistic, NCard, NSwitch, NSelect, NDynamicTags, NRadioGroup, NRadioButton, NInputGroup, NIcon, NTabs, NTabPane, NDropdown, NProgress, NCollapse, NCollapseItem, NInputNumber, NList, NListItem, NThing, NPagination } from 'naive-ui'
import draggable from 'vuedraggable'
import { CreateOutline, CheckmarkCircleOutline, WarningOutline, StatsChartOutline, EyeOutline, FilterOutline, SyncOutline, TrashOutline, EllipsisVertical as MoreIcon, SettingsOutline, ReorderFourOutline, AddOutline, EllipsisHorizontal } from '@vicons/ionicons5'
import type { DataTableColumns, FormInst, DropdownOption } from 'naive-ui'
import { useIsMobile } from '@/composables/useMediaQuery'
import { Subscription, Node, ApiResponse } from '@/types'
import { api } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import { useSubscriptionGroupStore } from '@/stores/subscriptionGroups'
import { useGroupStore as useNodeGroupStore } from '@/stores/groups'
import SubscriptionNodesPreview from '@/components/SubscriptionNodesPreview.vue'
import SubscriptionImport from '@/components/subscription/SubscriptionImport.vue'
import StatsCard from '@/components/common/StatsCard.vue'
import GroupManagement from '@/components/subscription/GroupManagement.vue'
import BatchActions from '@/components/subscription/BatchActions.vue'
import UpdateLogModal from '@/components/subscription/UpdateLogModal.vue'
import SubscriptionRules from '@/components/subscription/SubscriptionRules.vue'
import { format } from 'date-fns'
import { performanceMonitor } from '@/utils/performance'
import { formatBytes } from '@/utils/format'

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const isMobile = useIsMobile()
const subscriptionGroupStore = useSubscriptionGroupStore()
const nodeGroupStore = useNodeGroupStore()

const subscriptions = ref<Subscription[]>([])
const loading = ref(true)
const showModal = ref(false)
const saveLoading = ref(false)
const updatingId = ref<string | null>(null)
const editingSubscription = ref<Subscription | null>(null)
const updatingIds = ref(new Set<string>()) // For individual and batch updates
const activeTab = ref('all')

// 批量导入组件状态
const showImportModal = ref(false)

// For batch actions
const checkedRowKeys = ref<string[]>([])

// For mobile pagination
interface MobilePagination {
  page: number;
  pageSize: number;
  itemCount: number;
  pageCount: number;
}

const mobilePagination: MobilePagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  pageCount: computed(() => Math.ceil(mobilePagination.itemCount / mobilePagination.pageSize)),
});

// For moving subscriptions to a group
const showMoveToGroupModal = ref(false)
const moveToGroupId = ref<string | null>(null)
const moveToGroupLoading = ref(false)

// For adding a new subscription group
const showAddGroupModal = ref(false)
const newGroupName = ref('')
const newGroupDescription = ref('')
const addGroupLoading = ref(false)

// For Group Management
const showEditGroupModal = ref(false)
const editingGroup = ref<import('@/stores/subscriptionGroups').SubscriptionGroup | null>(null)
const editingGroupName = ref('')
const editingGroupDescription = ref('')
const editGroupLoading = ref(false)
const showDropdown = ref(false)
const dropdownX = ref(0)
const dropdownY = ref(0)
const activeDropdownGroup = ref<import('@/stores/subscriptionGroups').SubscriptionGroup | null>(null)

// For Sorting Groups
const showSortModal = ref(false)
const sortableGroups = ref<import('@/stores/subscriptionGroups').SubscriptionGroup[]>([])
const sortLoading = ref(false)

// For Export Group Modal
const showExportModal = ref(false)
const exportData = reactive({
  urls: '',
  count: 0,
  groupName: ''
})

// For Batch Replace Modal
const showBatchReplaceModal = ref(false)
const batchReplaceData = reactive({
  find: '',
  replace: '',
  groupId: '',
  count: 0,
  loading: false,
})

// For Node Preview in Modal
const showNodePreviewModal = ref(false)
const currentSubscriptionForPreview = ref<Subscription | null>(null)
const nodePreviewRef = ref<{ fetchPreview: () => void } | null>(null)

// For Update All Log
const showUpdateLogModal = ref(false)
const updateLog = ref<{
  success: { name: string }[]
  failed: Subscription[]
  expiring: Subscription[]
}>({ success: [], failed: [], expiring: [] })
const updateLogLoading = ref(false)
const updateProgress = ref({ current: 0, total: 0 })
let updateAbortController: AbortController | null = null
const subsToUpdate = ref<Subscription[]>([])
const updateStage = ref<'config' | 'progress'>('config')

// Update settings
const updateSettings = reactive({
  concurrency: 5,
  retries: 2,
  delay: 500, // ms delay between requests in the same batch
  batchDelay: 1000, // ms delay between batches
  expiringDaysThreshold: 2,
  expiringTrafficThresholdGB: 1,
})

// For Subscription & Group Rules (Unified)
const showRulesModal = ref(false)
const rulesLoading = ref(false)
const currentRuleContext = ref<{ type: 'subscription' | 'group', entity: Subscription | import('@/stores/subscriptionGroups').SubscriptionGroup } | null>(null)
const rules = ref<import('@/types').SubscriptionRule[]>([])
const showRuleFormModal = ref(false)
const ruleFormRef = ref<FormInst | null>(null)
const editingRule = ref<import('@/types').SubscriptionRule | null>(null)
const ruleSaveLoading = ref(false)

const ruleFormState = reactive({
  id: 0,
  name: '',
  type: 'filter_by_name_keyword' as import('@/types').SubscriptionRule['type'] | 'exclude_by_name_keyword',
  value: '',
  enabled: 1,
  keywords: [] as string[],
  renameRegex: '',
  renameFormat: '',
  regex: '',
})

const ruleModalTitle = computed(() => {
  if (!currentRuleContext.value) return '规则管理'
  const contextName = currentRuleContext.value.type === 'subscription' ? '订阅' : '分组'
  const entityName = currentRuleContext.value.entity.name
  return `${contextName}规则 - ${entityName}`
})
const ruleFormTitle = computed(() => (editingRule.value ? '编辑规则' : '新增规则'))

const ruleTypeOptions = [
  { label: '按名称关键词过滤 (保留)', value: 'filter_by_name_keyword' },
  { label: '按名称关键词排除', value: 'exclude_by_name_keyword' },
  { label: '按名称正则过滤', value: 'filter_by_name_regex' },
  { label: '按正则重命名', value: 'rename_by_regex' },
]

const commonKeywords = [
  '香港', 'HK', '🇭🇰',
  '台湾', 'TW', '🇹🇼',
  '日本', 'JP', '🇯🇵',
  '美国', 'US', '🇺🇸',
  '新加坡', 'SG', '🇸🇬',
  '韩国', 'KR', '🇰🇷',
  '英国', 'UK', '🇬🇧',
  'IEPL', 'IPLC', '专线', 'BGP',
]

const addKeyword = (keyword: string) => {
  if (!ruleFormState.keywords.includes(keyword)) {
    ruleFormState.keywords.push(keyword)
  }
}

const formState = reactive({
  id: '',
  name: '',
  url: '',
})

const modalTitle = computed(() => (editingSubscription.value ? '编辑订阅' : '新增订阅'))

const filteredSubscriptions = computed(() => {
  return subscriptions.value.filter(sub => {
    if (activeTab.value === 'all') return true
    if (activeTab.value === 'ungrouped') return !sub.group_id
    return sub.group_id === activeTab.value
  })
})

const paginatedSubscriptions = computed(() => {
  const start = (mobilePagination.page - 1) * mobilePagination.pageSize;
  const end = start + mobilePagination.pageSize;
  return filteredSubscriptions.value.slice(start, end);
});

watch(filteredSubscriptions, (value) => {
  mobilePagination.itemCount = value.length;
});


const groupCounts = computed(() => {
  const counts: { all: number; ungrouped: number; [key: string]: number } = {
    all: subscriptions.value.length,
    ungrouped: 0,
  }
  subscriptions.value.forEach(sub => {
    if (sub.group_id) {
      counts[sub.group_id] = (counts[sub.group_id] || 0) + 1
    } else {
      counts.ungrouped++
    }
  })
  return counts
})



const createColumns = ({ onEdit, onUpdate, onDelete, onPreviewNodes, onManageRules }: {
    onEdit: (row: Subscription) => void,
    onUpdate: (row: Subscription) => void,
    onDelete: (row: Subscription) => void,
    onPreviewNodes: (row: Subscription) => void,
    onManageRules: (row: Subscription) => void,
}): DataTableColumns<Subscription> => {
  return [
    { type: 'selection' },
    { title: '名称', key: 'name', sorter: 'default', width: 150, ellipsis: { tooltip: true } },
    { title: '订阅链接', key: 'url', ellipsis: { tooltip: true }, width: 150 },
    {
      title: '状态',
      key: 'status',
      align: 'center',
      width: 100,
      sorter: (a, b) => {
        const getStatusValue = (row: Subscription) => {
          if (row.error) return 2; // 失败
          if (row.last_updated) return 1; // 成功
          return 0; // 待更新
        };
        return getStatusValue(a) - getStatusValue(b);
      },
      render(row) {
        if (row.error) {
          return h(NTooltip, null, {
            trigger: () => h(NTag, { type: 'error' }, { default: () => '失败' }),
            default: () => row.error
          })
        }
        if (row.last_updated) {
          return h(NTag, { type: 'success' }, { default: () => '成功' })
        }
        return h(NTag, { type: 'default' }, { default: () => '待更新' })
      }
    },
    {
      title: '节点数',
      key: 'node_count',
      align: 'center',
      width: 100,
      sorter: 'default',
      render(row) {
        const count = row.node_count ?? 0
        return h(NTag, { type: count > 0 ? 'info' : 'default', round: true }, { default: () => count })
      }
    },
    {
      title: '剩余流量',
      key: 'subscription_info',
      width: 120,
      sorter: (a, b) => {
        const valA = a.remaining_traffic;
        const valB = b.remaining_traffic;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        return valA - valB;
      },
      render(row) {
        const remaining = row.remaining_traffic;
        if (remaining === null || remaining === undefined || remaining < 0) {
          return h(NTag, { size: 'small', round: true }, { default: () => 'N/A' });
        }
        
        // Since we don't have total/used, we can't show a percentage-based color.
        // We can, however, create a simple color scheme based on remaining data.
        let tagType: 'success' | 'warning' | 'error' = 'success';
        const GB = 1024 * 1024 * 1024;
        if (remaining < 1 * GB) tagType = 'error';
        else if (remaining < 5 * GB) tagType = 'warning';

        return h(NTag, { type: tagType, size: 'small', round: true }, { default: () => formatBytes(remaining) });
      }
    },
    {
      title: '剩余天数',
      key: 'remaining_days',
      width: 120,
      sorter: (a, b) => {
        const valA = a.remaining_days;
        const valB = b.remaining_days;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        return valA - valB;
      },
      render(row) {
        const diffDays = row.remaining_days;
        if (diffDays === null || diffDays === undefined) {
            return h(NTag, { size: 'small', round: true }, { default: () => 'N/A' });
        }
        if (diffDays < 0) {
            return h(NTag, { type: 'error', size: 'small', round: true }, { default: () => '已过期' });
        }
        
        let tagType: 'success' | 'warning' | 'error' = 'success';
        if (diffDays <= 3) tagType = 'error';
        else if (diffDays <= 7) tagType = 'warning';
        
        const tooltipContent = row.expires_at ? `到期时间: ${format(new Date(row.expires_at), 'yyyy-MM-dd HH:mm')}` : '无到期时间信息';

        return h(NTooltip, null, {
          trigger: () => h(NTag, { type: tagType, size: 'small', round: true }, { default: () => `${diffDays} 天` }),
          default: () => tooltipContent,
        });
      }
    },
    {
      title: '上次更新',
      key: 'last_updated',
      width: 180,
      sorter: (a, b) => new Date(a.last_updated || 0).getTime() - new Date(b.last_updated || 0).getTime(),
      render(row) {
        return row.last_updated ? format(new Date(row.last_updated), 'yyyy-MM-dd HH:mm:ss') : 'N/A'
      }
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render(row) {
        const createTooltipButton = (tooltip: string, icon: any, onClick: () => void, props: any = {}) => {
          return h(NTooltip, null, {
            trigger: () => h(NButton, { circle: true, tertiary: true, size: 'small', onClick, ...props }, { icon: () => h(NIcon, { component: icon }) }),
            default: () => tooltip,
          });
        };
        return h(NSpace, null, {
          default: () => [
            createTooltipButton('预览节点', EyeOutline, () => onPreviewNodes(row)),
            createTooltipButton('规则', FilterOutline, () => handleManageRules(row, 'subscription'), { type: 'info' }),
            createTooltipButton('编辑', CreateOutline, () => onEdit(row)),
            createTooltipButton('更新', SyncOutline, () => onUpdate(row), { type: 'primary', loading: updatingId.value === row.id || updatingIds.value.has(row.id) }),
            createTooltipButton('删除', TrashOutline, () => onDelete(row), { type: 'error' }),
          ]
        })
      }
    }
  ]
}

const onPreviewNodes = (row: Subscription) => {
    currentSubscriptionForPreview.value = row
    showNodePreviewModal.value = true
    nextTick(() => {
        nodePreviewRef.value?.fetchPreview()
    })
}

const openModal = (sub: Subscription | null = null) => {
  if (sub) {
    editingSubscription.value = { ...sub }
    formState.id = sub.id
    formState.name = sub.name
    formState.url = sub.url
  } else {
    editingSubscription.value = null
    formState.id = ''
    formState.name = ''
    formState.url = ''
  }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const fetchSubscriptions = async () => {
  performanceMonitor.start('fetchSubscriptions')
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) return
  loading.value = true
  try {
    const subsResponse = await api.get<ApiResponse<Subscription[]>>('/subscriptions')
    if (subsResponse.data.success && subsResponse.data.data) {
      subscriptions.value = subsResponse.data.data
    } else {
      message.error(subsResponse.data.message || '获取订阅列表失败')
    }
  } catch (err) {
    message.error('请求失败，请稍后重试')
  } finally {
    loading.value = false
    performanceMonitor.end('fetchSubscriptions')
  }
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const payload = { name: formState.name, url: formState.url }
    const response = editingSubscription.value
      ? await api.put<ApiResponse>(`/subscriptions/${editingSubscription.value.id}`, payload)
      : await api.post<ApiResponse>('/subscriptions', payload)
    if (response.data.success) {
      message.success(editingSubscription.value ? '订阅更新成功' : '订阅新增成功')
      closeModal()
      fetchSubscriptions()
    } else {
      message.error(response.data.message || '保存失败')
    }
  } catch (err) {
    message.error('请求失败，请稍后重试')
  } finally {
    saveLoading.value = false
  }
}

const handleDelete = (row: Subscription) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除订阅 "${row.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await api.delete<ApiResponse>(`/subscriptions/${row.id}`)
        if (response.data.success) {
          message.success('订阅删除成功')
          fetchSubscriptions()
        } else {
          message.error(response.data.message || '删除失败')
        }
      } catch (err) {
        message.error('请求失败，请稍后重试')
      }
    },
  })
}

const handleUpdate = async (row: Subscription, silent = false, signal?: AbortSignal): Promise<{ success: boolean; data: Subscription; error?: string }> => {
  const metricName = `updateSubscription-${row.id}`
  performanceMonitor.start(metricName)

  updatingId.value = row.id
  updatingIds.value.add(row.id)
  if (!silent) {
    message.info(`正在更新订阅 [${row.name}]...`)
  }
  try {
    const response = await api.post<ApiResponse<Subscription>>(`/subscriptions/${row.id}/update`, {}, { signal })
    const updatedSub = response.data.data

    const index = subscriptions.value.findIndex(s => s.id === row.id)
    if (index !== -1 && updatedSub) {
      subscriptions.value[index] = updatedSub
    }

    if (response.data.success && updatedSub) {
      if (!silent) message.success(`订阅 [${row.name}] 更新成功`)
      performanceMonitor.end(metricName)
      return { success: true, data: updatedSub }
    } else {
      const errorMsg = response.data.message || `订阅 [${row.name}] 更新失败`
      if (!silent) message.error(errorMsg)
      // Even on failure, the backend returns the subscription state, so we use it.
      performanceMonitor.end(metricName)
      return { success: false, data: updatedSub || row, error: errorMsg }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      performanceMonitor.end(metricName)
      return { success: false, data: row, error: '已中止' }
    }
    const errorMsg = err.message || '请求失败，请稍后重试'
    if (!silent) message.error(errorMsg)
    performanceMonitor.end(metricName)
    return { success: false, data: row, error: errorMsg }
  } finally {
    updatingId.value = null
    updatingIds.value.delete(row.id)
  }
}

// 处理头部操作按钮点击
const handleHeaderAction = (key: string) => {
  switch (key) {
    case 'add':
      openModal(null)
      break
    case 'add-group':
      showAddGroupModal.value = true
      break
    case 'update-all':
      handleUpdateAll()
      break
    case 'import':
      openImportModal()
      break
    case 'sort':
      openSortModal()
      break
    case 'move-to-group':
      if (checkedRowKeys.value.length > 0) {
        showMoveToGroupModal.value = true
      }
      break
    case 'batch-delete':
      handleBatchDelete()
      break
    case 'clear-failed':
      handleClearAllFailed()
      break
    case 'clear-all':
      handleClearCurrentGroup()
      break
  }
}

// 成功率计算
const successRate = computed(() => {
  const activeCount = subscriptions.value.filter(s => s.enabled && (s.node_count ?? 0) > 0).length
  const totalCount = subscriptions.value.length
  return totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0
})

const openImportModal = () => {
  showImportModal.value = true
}

const onImportSuccess = () => {
  fetchSubscriptions()
}

// A generic function to execute updates in a concurrent pool with progress
const executeSubscriptionUpdates = async () => {
  if (subsToUpdate.value.length === 0) {
    message.info('没有需要更新的订阅')
    return
  }

  updateStage.value = 'progress'
  updateLogLoading.value = true
  message.info(`开始更新 ${subsToUpdate.value.length} 个订阅...`)

  updateAbortController = new AbortController()
  const signal = updateAbortController.signal

  const { concurrency, retries, delay } = updateSettings

  const tasks = subsToUpdate.value.map(sub => async () => {
    for (let i = 0; i <= retries; i++) {
      if (signal.aborted) return { success: false, data: sub, error: '已中止' }
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * i)) // Exponential backoff
      }
      const result = await handleUpdate(sub, true, signal)
      if (result.success) {
        return result
      }
      // If it's the last retry and it still fails, return the failed result
      if (i === retries) {
        return result
      }
    }
    return { success: false, data: sub, error: '未知重试错误' } // Should not be reached
  })
  
  const results = []
  const executing = new Set<Promise<void>>()

  try {
    const updatePromises = tasks.map(task => async () => {
      const result = await task()
      updateProgress.value.current++
      if (result.success) {
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
      results.push(result)
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
  }
}

const prepareAndShowUpdateModal = (subs: Subscription[]) => {
  if (subs.length === 0) {
    message.info('没有需要更新的订阅')
    return
  }
  subsToUpdate.value = subs
  updateLog.value = { success: [], failed: [], expiring: [] }
  updateProgress.value = { current: 0, total: subs.length }
  updateStage.value = 'config'
  showUpdateLogModal.value = true
}

const handleUpdateAll = () => {
  const subs = checkedRowKeys.value.length > 0
    ? subscriptions.value.filter(s => checkedRowKeys.value.includes(s.id))
    : subscriptions.value.filter(s => s.enabled)
  prepareAndShowUpdateModal(subs)
}

const handleRetryFailed = () => {
  const failedSubsInfo = [...updateLog.value.failed].filter(s => s.error !== '已中止')
  prepareAndShowUpdateModal(failedSubsInfo)
}

const handleCancelUpdate = () => {
  if (updateLogLoading.value && updateAbortController) {
    updateAbortController.abort()
    updateLogLoading.value = false // Force stop loading on abort
  }
  showUpdateLogModal.value = false
}

const handleClearFailed = () => {
  const subsToClear = updateLog.value.failed.filter(sub => sub.error !== '已中止');

  if (subsToClear.length === 0) {
    message.info('没有更新失败的订阅可以清除');
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
        const response = await api.post('/subscriptions/batch-delete', { ids: idsToClear });
        if (response.data.success) {
          message.success(`成功清除了 ${idsToClear.length} 个失败订阅`);
          updateLog.value.failed = updateLog.value.failed.filter(sub => !idsToClear.includes(sub.id));
          fetchSubscriptions();
        } else {
          message.error(response.data.message || '清除失败');
        }
      } catch (err) {
        message.error('请求失败，请稍后重试');
      }
    }
  });
};

const handleClearExpiring = () => {
  const subsToClear = updateLog.value.expiring;

  if (subsToClear.length === 0) {
    message.info('没有即将到期的订阅可以清除');
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
        const response = await api.post('/subscriptions/batch-delete', { ids: idsToClear });
        if (response.data.success) {
          message.success(`成功清除了 ${idsToClear.length} 个即将到期的订阅`);
          updateLog.value.expiring = updateLog.value.expiring.filter(sub => !idsToClear.includes(sub.id));
          fetchSubscriptions();
        } else {
          message.error(response.data.message || '清除失败');
        }
      } catch (err) {
        message.error('请求失败，请稍后重试');
      }
    }
  });
};

const handleBatchDelete = () => {
  if (checkedRowKeys.value.length === 0) {
    message.warning('请至少选择一个订阅');
    return;
  }
  dialog.warning({
    title: '确认批量删除',
    content: `确定要删除选中的 ${checkedRowKeys.value.length} 个订阅吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await api.post('/subscriptions/batch-delete', { ids: checkedRowKeys.value });
        if (response.data.success) {
          message.success('批量删除成功');
          fetchSubscriptions();
          checkedRowKeys.value = [];
        } else {
          message.error(response.data.message || '批量删除失败');
        }
      } catch (err) {
        message.error('请求失败，请稍后重试');
      }
    }
  });
};

const handleClearCurrentGroup = () => {
  const tab = activeTab.value;
  let groupName = '';
  let subCount = 0;

  if (tab === 'all') {
    groupName = '全部';
    subCount = subscriptions.value.length;
  } else if (tab === 'ungrouped') {
    groupName = '未分组';
    subCount = groupCounts.value.ungrouped;
  } else {
    const group = subscriptionGroupStore.groups.find(g => g.id === tab);
    if (group) {
      groupName = group.name;
      subCount = groupCounts.value[tab] || 0;
    }
  }

  if (subCount === 0) {
    message.info(`“${groupName}”内没有可清除的订阅。`);
    return;
  }

  dialog.warning({
    title: '确认清除',
    content: `确定要删除“${groupName}”分组下的全部 ${subCount} 个订阅吗？此操作不可恢复。`,
    positiveText: '确定清除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        let response;
        if (tab === 'all') {
          response = await api.post('/subscriptions/clear-all');
        } else {
          const groupId = tab === 'ungrouped' ? null : tab;
          response = await api.post('/subscriptions/clear-by-group', { groupId });
        }

        if (response.data.success) {
          message.success(response.data.message || '清除成功');
          fetchSubscriptions();
          checkedRowKeys.value = [];
        } else {
          message.error(response.data.message || '清除失败');
        }
      } catch (err) {
        message.error('请求失败，请稍后重试');
      }
    }
  });
};

const handleClearAllFailed = () => {
  const tab = activeTab.value;
  const failedSubs = filteredSubscriptions.value.filter(sub => sub.error);

  let groupName = '';
  if (tab === 'all') {
    groupName = '全部';
  } else if (tab === 'ungrouped') {
    groupName = '未分组';
  } else {
    const group = subscriptionGroupStore.groups.find(g => g.id === tab);
    if (group) {
      groupName = group.name;
    }
  }

  if (failedSubs.length === 0) {
    message.info(`“${groupName}”分组内没有失败的订阅可清除。`);
    return;
  }

  dialog.warning({
    title: `确认清除“${groupName}”分组内的失败订阅`,
    content: `检测到 ${failedSubs.length} 个失败的订阅。确定要全部删除吗？此操作不可恢复。`,
    positiveText: '确定清除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const groupId = tab === 'all' ? 'all' : (tab === 'ungrouped' ? null : tab);
        const response = await api.post('/subscriptions/clear-failed', { groupId });
        if (response.data.success) {
          message.success(response.data.message || `成功清除了 ${failedSubs.length} 个失败订阅`);
          fetchSubscriptions();
        } else {
          message.error(response.data.message || '清除失败');
        }
      } catch (err) {
        message.error('请求失败，请稍后重试');
      }
    }
  });
};

const handleMoveToGroup = async () => {
  if (checkedRowKeys.value.length === 0) {
    message.warning('请至少选择一个订阅');
    return;
  }
  moveToGroupLoading.value = true;
  try {
    const response = await api.post('/subscriptions/batch-update-group', {
      subscriptionIds: checkedRowKeys.value,
      groupId: moveToGroupId.value,
    });
    if (response.data.success) {
      message.success('订阅分组更新成功');
      showMoveToGroupModal.value = false;
      checkedRowKeys.value = [];
      fetchSubscriptions();
    } else {
      message.error(response.data.message || '移动失败');
    }
  } catch (error: any) {
    message.error(error.message || '请求失败');
  } finally {
    moveToGroupLoading.value = false;
  }
};

const handleSaveGroup = async () => {
  if (!newGroupName.value.trim()) {
    message.warning('分组名称不能为空');
    return;
  }
  addGroupLoading.value = true;
  try {
    const response = await subscriptionGroupStore.addGroup(newGroupName.value, newGroupDescription.value);
    if (response.success) {
      message.success('分组创建成功');
      showAddGroupModal.value = false;
      newGroupName.value = '';
      newGroupDescription.value = '';
    } else {
      message.error(response.message || '创建失败');
    }
  } catch (error: any) {
    message.error(error.message || '创建失败');
  } finally {
    addGroupLoading.value = false;
  }
};

const handleUpdateGroup = async () => {
  if (!editingGroup.value || !editingGroupName.value.trim()) {
    message.warning('分组名称不能为空')
    return
  }
  editGroupLoading.value = true
  try {
    const response = await subscriptionGroupStore.updateGroup(editingGroup.value.id, editingGroupName.value, editingGroupDescription.value)
    if (response.success) {
      message.success('分组更新成功')
      showEditGroupModal.value = false
    } else {
      message.error(response.message || '更新失败')
    }
  } catch (error: any) {
    message.error(error.message || '更新失败')
  } finally {
    editGroupLoading.value = false
  }
}

const getDropdownOptions = (group: import('@/stores/subscriptionGroups').SubscriptionGroup): DropdownOption[] => {
  return [
    { label: '更新本组', key: 'update-group' },
    { label: '一键去重', key: 'deduplicate-group' },
    { label: '导出订阅', key: 'export-group' },
    { label: '分组规则', key: 'group-rules' },
    { type: 'divider', key: 'd1' },
    { label: '批量替换', key: 'batch-replace-group' },
    { label: '标签编辑', key: 'rename' },
    { label: group.is_enabled ? '禁用' : '启用', key: 'toggle' },
    { type: 'divider', key: 'd2' },
    { label: '删除', key: 'delete', props: { style: 'color: red;' } }
  ]
}

const handleGroupActionForKey = (key: string, group: import('@/stores/subscriptionGroups').SubscriptionGroup) => {
  console.log('handleGroupActionForKey called with key:', key, 'for group:', group.name)

  switch (key) {
    case 'update-group':
      handleUpdateGroupSubscriptions(group.id)
      break
    case 'deduplicate-group':
      handleDeduplicateGroup(group.id)
      break
    case 'export-group':
      handleExportGroup(group.id)
      break
    case 'batch-replace-group':
      openBatchReplaceModal(group.id)
      break
    case 'group-rules':
      handleManageRules(group, 'group')
      break
    case 'rename':
      editingGroup.value = group
      editingGroupName.value = group.name
      editingGroupDescription.value = group.description || ''
      showEditGroupModal.value = true
      break
    case 'toggle':
      subscriptionGroupStore.toggleGroup(group.id).catch((err: any) => message.error(err.message || '操作失败'))
      break
    case 'delete':
      dialog.warning({
        title: '确认删除',
        content: `确定要删除分组 "${group.name}" 吗��分组下的订阅将变为"未分组"。`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            const response = await subscriptionGroupStore.deleteGroup(group.id)
            if (response.success) {
              message.success('分组删除成功')
              if (activeTab.value === group.id) {
                activeTab.value = 'all'
              }
            } else {
              message.error(response.message || '删除失败')
            }
          } catch (error: any) {
            message.error(error.message || '删除失败')
          }
        }
      })
      break
  }
}

const handleGroupAction = (key: string) => {
  console.log('handleGroupAction called with key:', key)
  console.log('activeDropdownGroup:', activeDropdownGroup.value?.name)
  showDropdown.value = false
  const group = activeDropdownGroup.value
  if (!group) {
    console.error('No active dropdown group found!')
    return
  }

  console.log('Processing action for group:', group.name, 'key:', key)
  switch (key) {
    case 'update-group':
      handleUpdateGroupSubscriptions(group.id)
      break
    case 'deduplicate-group':
      handleDeduplicateGroup(group.id)
      break
    case 'export-group':
      handleExportGroup(group.id)
      break
    case 'batch-replace-group':
      openBatchReplaceModal(group.id)
      break
    case 'group-rules':
      handleManageRules(group, 'group')
      break
    case 'rename':
      editingGroup.value = group
      editingGroupName.value = group.name
      editingGroupDescription.value = group.description || ''
      showEditGroupModal.value = true
      break
    case 'toggle':
      subscriptionGroupStore.toggleGroup(group.id).catch((err: any) => message.error(err.message || '操作失败'))
      break
    case 'delete':
      dialog.warning({
        title: '确认删除',
        content: `确定要删除分组 "${group.name}" 吗？分组下的订阅将变为“未分组”。`,
        positiveText: '确定',
        negativeText: '取消',
        onPositiveClick: async () => {
          try {
            const response = await subscriptionGroupStore.deleteGroup(group.id)
            if (response.success) {
              message.success('分组删除成功')
              if (activeTab.value === group.id) {
                activeTab.value = 'all'
              }
              fetchSubscriptions() // Refresh subscriptions to update their group status
            } else {
              message.error(response.message || '删除失败')
            }
          } catch (error: any) {
            message.error(error.message || '删除失败')
          }
        }
      })
      break
  }
}

const handleGroupMenuClick = (group: import('@/stores/subscriptionGroups').SubscriptionGroup, event: MouseEvent) => {
  console.log('handleGroupMenuClick called for group:', group.name)
  showDropdown.value = true
  dropdownX.value = event.clientX
  dropdownY.value = event.clientY
  activeDropdownGroup.value = group
}

const handleTabClick = (group: import('@/stores/subscriptionGroups').SubscriptionGroup, event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.closest('.group-actions-button')) {
    // 如果点击的是菜单按钮，不执行标签切换逻辑
    return
  } else {
    activeTab.value = group.id
  }
}

const handleContextMenu = (group: import('@/stores/subscriptionGroups').SubscriptionGroup, event: MouseEvent) => {
  event.preventDefault()
  showDropdown.value = false
  setTimeout(() => {
    showDropdown.value = true
    dropdownX.value = event.clientX
    dropdownY.value = event.clientY
    activeDropdownGroup.value = group
  }, 50)
}

const handleUpdateGroupSubscriptions = (groupId: string) => {
  const subs = subscriptions.value.filter(s => s.group_id === groupId && s.enabled)
  prepareAndShowUpdateModal(subs)
}

const handleDeduplicateGroup = (groupId: string) => {
  const subsInGroup = subscriptions.value.filter(s => s.group_id === groupId)
  const urlMap = new Map<string, Subscription[]>()

  subsInGroup.forEach(sub => {
    const existing = urlMap.get(sub.url)
    if (existing) {
      existing.push(sub)
    } else {
      urlMap.set(sub.url, [sub])
    }
  })

  const idsToDelete: string[] = []
  urlMap.forEach(subs => {
    if (subs.length > 1) {
      // Keep the first one, delete the rest
      subs.slice(1).forEach(sub => idsToDelete.push(sub.id))
    }
  })

  if (idsToDelete.length === 0) {
    message.info('该分组内没有发现重复的订阅链接。')
    return
  }

  const totalCount = subsInGroup.length
  const duplicatesCount = idsToDelete.length
  const remainingCount = totalCount - duplicatesCount

  dialog.warning({
    title: '确认去重',
    content: () => h('div', null, [
      h('p', null, `分组内共有 ${totalCount} 条订阅。`),
      h('p', null, `检测到 ${duplicatesCount} 条重复订阅。`),
      h('p', null, `去重后将剩余 ${remainingCount} 条。`),
    ]),
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      const chunkSize = 50;
      const chunks = [];
      for (let i = 0; i < idsToDelete.length; i += chunkSize) {
        chunks.push(idsToDelete.slice(i, i + chunkSize));
      }

      try {
        let successCount = 0;
        let hasError = false;

        for (const chunk of chunks) {
          const response = await api.post('/subscriptions/batch-delete', { ids: chunk });
          if (response.data.success) {
            // Assuming the backend doesn't return the count for each chunk,
            // we just proceed. The final message will use the total count.
          } else {
            hasError = true;
            message.error(response.data.message || `一批订阅删除失败`);
            // Stop on first error
            break;
          }
        }

        if (!hasError) {
          message.success(`成功删除了 ${duplicatesCount} 个重复订阅。`);
        } else {
          message.warning('部分重复订阅删除失败，请刷新后重试。');
        }
        
        fetchSubscriptions();

      } catch (err) {
        message.error('请求失败，请稍后重试');
      }
    }
  })
}

const handleExportGroup = (groupId: string) => {
  const group = subscriptionGroupStore.groups.find(g => g.id === groupId)
  const subsInGroup = subscriptions.value.filter(s => s.group_id === groupId)
  if (subsInGroup.length === 0) {
    message.warning('该分组下没有订阅可导出。')
    return
  }

  exportData.urls = subsInGroup.map(s => s.url).join('\n')
  exportData.count = subsInGroup.length
  exportData.groupName = group?.name || '该分组'
  showExportModal.value = true
}

const handleCopyExportUrls = () => {
  if (!exportData.urls) {
    message.warning('没有内容可复制。')
    return
  }
  navigator.clipboard.writeText(exportData.urls).then(() => {
    message.success('已成功复制到剪贴板！')
  }).catch(err => {
    message.error('复制失败，您的浏览器可能不支持或未授权。')
    console.error('Clipboard write failed:', err)
  })
}


const openBatchReplaceModal = (groupId: string) => {
  const subsInGroup = subscriptions.value.filter(s => s.group_id === groupId)
  if (subsInGroup.length === 0) {
    message.warning('该分组下没有订阅可进行批量替换。')
    return
  }
  batchReplaceData.find = ''
  batchReplaceData.replace = ''
  batchReplaceData.groupId = groupId
  batchReplaceData.count = subsInGroup.length
  batchReplaceData.loading = false
  showBatchReplaceModal.value = true
}

const handleBatchReplace = async () => {
  if (!batchReplaceData.find) {
    message.warning('“查找”内容不能为空。')
    return
  }
  if (batchReplaceData.groupId === '') {
    message.error('未指定分组，操作中止。')
    return
  }

  batchReplaceData.loading = true
  const subsToUpdate = subscriptions.value.filter(s => s.group_id === batchReplaceData.groupId)
  
  const updates = subsToUpdate.map(sub => ({
    id: sub.id,
    url: sub.url.replaceAll(batchReplaceData.find, batchReplaceData.replace)
  })).filter(update => {
    const originalSub = subsToUpdate.find(s => s.id === update.id)
    return originalSub && originalSub.url !== update.url
  })

  if (updates.length === 0) {
    message.info('没有找到任何需要更新的订阅链接。')
    batchReplaceData.loading = false
    showBatchReplaceModal.value = false
    return
  }

  try {
    const response = await api.post('/subscriptions/batch-update-urls', { updates })
    if (response.data.success) {
      message.success(`成功更新了 ${updates.length} 个订阅链接。`)
      fetchSubscriptions()
      showBatchReplaceModal.value = false
    } else {
      message.error(response.data.message || '批量替换失败')
    }
  } catch (err) {
    message.error('请求失败，请稍后重试')
  } finally {
    batchReplaceData.loading = false
  }
}


// --- Unified Rules Logic ---
const fetchRules = async () => {
  if (!currentRuleContext.value) return
  rulesLoading.value = true
  const { type, entity } = currentRuleContext.value
  const baseUrl = type === 'subscription' ? '/subscriptions' : '/subscription-groups'
  
  try {
    const response = await api.get<ApiResponse<import('@/types').SubscriptionRule[]>>(`${baseUrl}/${entity.id}/rules`)
    if (response.data.success) {
      rules.value = response.data.data || []
    } else {
      message.error(response.data.message || '获取规则列表失败')
    }
  } catch (e) {
    message.error('请求规则列表失败')
  } finally {
    rulesLoading.value = false
  }
}

const handleManageRules = (entity: Subscription | import('@/stores/subscriptionGroups').SubscriptionGroup, type: 'subscription' | 'group') => {
  currentRuleContext.value = { type, entity }
  showRulesModal.value = true
  fetchRules()
}

const handleDeleteRule = (rule: import('@/types').SubscriptionRule) => {
  if (!currentRuleContext.value) return
  const { type, entity } = currentRuleContext.value
  const baseUrl = type === 'subscription' ? '/subscriptions' : '/subscription-groups'

  dialog.warning({
    title: '确认删除规则',
    content: `确定要删除规则 "${rule.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await api.delete<ApiResponse>(`${baseUrl}/${entity.id}/rules/${rule.id}`)
        if (response.data.success) {
          message.success('规则删除成功')
          fetchRules()
        } else {
          message.error(response.data.message || '删除失败')
        }
      } catch (err) {
        message.error('请求失败，请稍后重试')
      }
    },
  })
}

const openRuleFormModal = (rule: import('@/types').SubscriptionRule | null) => {
  ruleFormState.id = 0
  ruleFormState.name = ''
  ruleFormState.type = 'filter_by_name_keyword'
  ruleFormState.value = ''
  ruleFormState.enabled = 1
  ruleFormState.keywords = []
  ruleFormState.renameRegex = ''
  ruleFormState.renameFormat = ''
  ruleFormState.regex = ''
  editingRule.value = null
  if (rule) {
    editingRule.value = rule
    ruleFormState.id = rule.id
    ruleFormState.name = rule.name
    ruleFormState.type = rule.type
    ruleFormState.value = rule.value
    ruleFormState.enabled = rule.enabled
    try {
      const parsedValue = JSON.parse(rule.value)
      if ((rule.type === 'filter_by_name_keyword' || rule.type === 'exclude_by_name_keyword') && parsedValue.keywords) {
        ruleFormState.keywords = parsedValue.keywords
      } else if (rule.type === 'rename_by_regex' && parsedValue.regex && parsedValue.format) {
        ruleFormState.renameRegex = parsedValue.regex
        ruleFormState.renameFormat = parsedValue.format
      } else if (rule.type === 'filter_by_name_regex' && parsedValue.regex) {
        ruleFormState.regex = parsedValue.regex
      }
    } catch (e) {
      console.error("Failed to parse rule value JSON:", e)
    }
  }
  showRuleFormModal.value = true
}

const handleSaveRule = async () => {
  if (!currentRuleContext.value) return
  const { type, entity } = currentRuleContext.value
  const baseUrl = type === 'subscription' ? '/subscriptions' : '/subscription-groups'
  
  ruleSaveLoading.value = true
  try {
    let jsonValue = {}
    if (ruleFormState.type === 'filter_by_name_keyword' || ruleFormState.type === 'exclude_by_name_keyword') {
      jsonValue = { keywords: ruleFormState.keywords }
    } else if (ruleFormState.type === 'rename_by_regex') {
      jsonValue = { regex: ruleFormState.renameRegex, format: ruleFormState.renameFormat }
    } else if (ruleFormState.type === 'filter_by_name_regex') {
      jsonValue = { regex: ruleFormState.regex }
    } else {
      try {
        jsonValue = JSON.parse(ruleFormState.value)
      } catch (e) {
        message.error('规则值的JSON格式无效')
        ruleSaveLoading.value = false
        return
      }
    }
    const payload = {
      name: ruleFormState.name,
      type: ruleFormState.type,
      value: JSON.stringify(jsonValue),
      enabled: ruleFormState.enabled === 1,
    }
    let response;
    if (editingRule.value) {
      response = await api.put<ApiResponse>(`${baseUrl}/${entity.id}/rules/${editingRule.value.id}`, payload)
    } else {
      response = await api.post<ApiResponse>(`${baseUrl}/${entity.id}/rules`, payload)
    }
    if (response.data.success) {
      message.success(editingRule.value ? '规则更新成功' : '规则创建成功')
      showRuleFormModal.value = false
      fetchRules()
    } else {
      message.error(response.data.message || '保存失败')
    }
  } catch (err) {
    message.error('请求失败')
  } finally {
    ruleSaveLoading.value = false
  }
}

const createRuleColumns = ({ onEdit, onDelete }: {
    onEdit: (row: import('@/types').SubscriptionRule) => void,
    onDelete: (row: import('@/types').SubscriptionRule) => void,
}): DataTableColumns<import('@/types').SubscriptionRule> => {
  return [
    { title: '名称', key: 'name', width: 150 },
    {
      title: '类型',
      key: 'type',
      width: 180,
      render(row) {
        const option = ruleTypeOptions.find(o => o.value === row.type)
        return option ? option.label : row.type
      }
    },
    { title: '规则值', key: 'value', ellipsis: { tooltip: true } },
    {
      title: '启用',
      key: 'enabled',
      width: 80,
      align: 'center',
      render(row) {
        return h(NSwitch, {
          value: row.enabled === 1,
          onUpdateValue: async (value) => {
            if (!currentRuleContext.value) return
            const { type, entity } = currentRuleContext.value
            const baseUrl = type === 'subscription' ? '/subscriptions' : '/subscription-groups'
            
            row.enabled = value ? 1 : 0
            try {
              await api.put<ApiResponse>(`${baseUrl}/${entity.id}/rules/${row.id}`, { enabled: value })
              message.success('状态更新成功')
            } catch (e) {
              message.error('状态更新失败')
              row.enabled = !value ? 1 : 0
            }
          }
        })
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render(row) {
        return h(NSpace, null, {
          default: () => [
            h(NButton, { size: 'small', onClick: () => onEdit(row) }, { default: () => '编辑' }),
            h(NButton, { size: 'small', type: 'error', ghost: true, onClick: () => onDelete(row) }, { default: () => '删除' }),
          ]
        })
      }
    }
  ]
}

const ruleColumns = createRuleColumns({
  onEdit: openRuleFormModal,
  onDelete: handleDeleteRule,
})

const columns = createColumns({
    onEdit: openModal,
    onUpdate: handleUpdate,
    onDelete: handleDelete,
    onPreviewNodes: onPreviewNodes,
    onManageRules: (sub) => handleManageRules(sub, 'subscription'),
})

onMounted(() => {
  fetchSubscriptions()
  subscriptionGroupStore.fetchGroups()
  nodeGroupStore.fetchGroups()

  // Load update settings from localStorage
  const savedSettings = localStorage.getItem('subscriptionUpdateSettings')
  if (savedSettings) {
    Object.assign(updateSettings, JSON.parse(savedSettings))
  }

  // Watch for changes and save to localStorage
  watch(updateSettings, (newSettings: typeof updateSettings) => {
    localStorage.setItem('subscriptionUpdateSettings', JSON.stringify(newSettings))
  })

  // Watch for the progress to complete
  watch(updateProgress, (progress) => {
    if (progress.total > 0 && progress.current === progress.total) {
      // Use nextTick to ensure the final progress number is rendered before showing the message
      nextTick(() => {
        if (updateLogLoading.value) { // Check if it's still considered loading
          message.success('订阅更新任务完成！')
          if (checkedRowKeys.value.length > 0) {
            checkedRowKeys.value = []
          }
          fetchSubscriptions()
          updateLogLoading.value = false
        }
      })
    }
  }, { deep: true })

  // Development performance monitoring
  if (import.meta.env.DEV) {
    // Log performance stats every 30 seconds
    setInterval(() => {
      const report = performanceMonitor.generateReport()
      console.log('🚀 Performance Stats:', report.metrics)

      // Log individual stats for key operations
      const fetchStats = performanceMonitor.getStats('fetchSubscriptions')
      if (fetchStats) {
        console.log(`📊 fetchSubscriptions: avg=${fetchStats.avg.toFixed(2)}ms, count=${fetchStats.count}`)
      }
    }, 30000)

    // Cleanup performance metrics on page unload
    window.addEventListener('beforeunload', () => {
      performanceMonitor.clearAll()
    })
  }
})

const openSortModal = () => {
  // 确保分组数据是最新的
  subscriptionGroupStore.fetchGroups().then(() => {
    // 复制分组数据到可排序数组
    sortableGroups.value = [...subscriptionGroupStore.groups]
    showSortModal.value = true
  }).catch((error) => {
    message.error('获取分组数据失败')
    console.error('Failed to fetch groups for sorting:', error)
  })
}

const handleSortSave = async () => {
  sortLoading.value = true
  try {
    const groupIds = sortableGroups.value.map(g => g.id)
    await subscriptionGroupStore.updateGroupOrder(groupIds)
    message.success('分组顺序已更新')
    showSortModal.value = false
  } catch (error: any) {
    message.error(error.message || '更新分组顺序失败')
  } finally {
    sortLoading.value = false
  }
}
</script>

<template>
  <div>
    <n-page-header>
      <template #title>
        订阅管理
      </template>
      <template #extra>
        <n-space>
          <n-button type="primary" @click="handleHeaderAction('add')">
            <template #icon>
              <n-icon :component="AddOutline" />
            </template>
            新增订阅
          </n-button>
          <n-button @click="handleHeaderAction('add-group')">
            <template #icon>
              <n-icon :component="AddOutline" />
            </template>
            新增分组
          </n-button>
          <n-dropdown
            trigger="click"
            :options="[
              { label: '更新全部', key: 'update-all' },
              { label: '批量导入', key: 'import' },
              { label: '调整顺序', key: 'sort' },
              { label: '移动到分组', key: 'move-to-group', disabled: checkedRowKeys.length === 0 },
              { label: '批量删除', key: 'batch-delete', disabled: checkedRowKeys.length === 0 },
              { label: '清除失败项', key: 'clear-failed' },
              { label: '一键清除', key: 'clear-all' },
            ]"
            @select="handleHeaderAction"
          >
            <n-button>
              <template #icon>
                <n-icon :component="MoreIcon" />
              </template>
            </n-button>
          </n-dropdown>
        </n-space>
      </template>
    </n-page-header>

    <!-- 统计卡片 -->
    <div class="stats-cards mb-4">
      <n-grid :cols="4" :x-gap="12" :y-gap="12">
        <n-gi>
          <StatsCard
            title="总订阅数"
            :value="subscriptions.length"
            icon="CreateOutline"
            color="primary"
            size="small"
          />
        </n-gi>
        <n-gi>
          <StatsCard
            title="活跃订阅"
            :value="subscriptions.filter(s => s.enabled).length"
            icon="CheckmarkCircleOutline"
            color="success"
            size="small"
          />
        </n-gi>
        <n-gi>
          <StatsCard
            title="失败订阅"
            :value="subscriptions.filter(s => s.node_count === 0).length"
            icon="WarningOutline"
            color="warning"
            size="small"
          />
        </n-gi>
        <n-gi>
          <StatsCard
            title="成功率"
            :value="successRate"
            unit="%"
            icon="StatsChartOutline"
            :color="successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'error'"
            size="small"
          />
        </n-gi>
      </n-grid>
    </div>

    <n-tabs type="card" class="mt-4" v-model:value="activeTab" @update:value="showDropdown = false">
      <n-tab-pane name="all" :tab="`全部 (${groupCounts.all})`" />
      <n-tab-pane name="ungrouped" :tab="`未分组 (${groupCounts.ungrouped})`" />
      <n-tab-pane
        v-for="group in subscriptionGroupStore.groups"
        :key="group.id"
        :name="group.id"
      >
        <template #tab>
          <div
            class="group-tab-wrapper"
            @click.prevent="handleTabClick(group, $event)"
            @contextmenu.prevent="handleContextMenu(group, $event)"
          >
            <span :style="{ color: group.is_enabled ? '' : '#999', marginRight: '8px' }">
              {{ group.name }} ({{ groupCounts[group.id] || 0 }})
            </span>
            <n-dropdown
              trigger="click"
              placement="bottom-start"
              :options="getDropdownOptions(group)"
              @select="handleGroupActionForKey($event, group)"
            >
              <n-button
                text
                class="group-actions-button"
                @click.stop
              >
                <n-icon :component="MoreIcon" />
              </n-button>
            </n-dropdown>
          </div>
        </template>
      </n-tab-pane>
    </n-tabs>

    <n-data-table
      v-if="!isMobile"
      :columns="columns"
      :data="filteredSubscriptions"
      :loading="loading"
      :pagination="{ pageSize: 10 }"
      :bordered="false"
      class="mt-4"
      v-model:checked-row-keys="checkedRowKeys"
      :row-key="(row: Subscription) => row.id"
      :scroll-x="1800"
    />

    <n-list v-else bordered class="mt-4">
      <n-list-item v-for="sub in paginatedSubscriptions" :key="sub.id">
        <n-thing>
          <template #header>
            <n-space justify="space-between">
              <n-text strong>{{ sub.name }}</n-text>
              <n-tag v-if="sub.error" type="error" size="small">失败</n-tag>
              <n-tag v-else-if="sub.last_updated" type="success" size="small">成功</n-tag>
              <n-tag v-else type="default" size="small">待更新</n-tag>
            </n-space>
          </template>
          <template #description>
            <n-space :size="4" class="mt-2">
              <n-tag type="info" round size="small">节点: {{ sub.node_count || 0 }}</n-tag>
              <n-tag v-if="sub.remaining_traffic !== null && sub.remaining_traffic !== undefined" :type="sub.remaining_traffic < 1024*1024*1024 ? 'error' : 'warning'" round size="small">
                流量: {{ formatBytes(sub.remaining_traffic) }}
              </n-tag>
              <n-tag v-if="sub.remaining_days !== null && sub.remaining_days !== undefined" :type="sub.remaining_days < 3 ? 'error' : 'warning'" round size="small">
                天数: {{ sub.remaining_days }} 天
              </n-tag>
            </n-space>
          </template>
        </n-thing>
        <template #suffix>
          <n-dropdown
            trigger="click"
            :options="[
              { label: '预览节点', key: 'preview' },
              { label: '规则', key: 'rules' },
              { label: '编辑', key: 'edit' },
              { label: '更新', key: 'update' },
              { label: '删除', key: 'delete' },
            ]"
            @select="key => {
              if (key === 'preview') onPreviewNodes(sub);
              if (key === 'rules') handleManageRules(sub, 'subscription');
              if (key === 'edit') openModal(sub);
              if (key === 'update') handleUpdate(sub);
              if (key === 'delete') handleDelete(sub);
            }"
          >
            <n-button text>
              <n-icon :component="MoreIcon" size="24" />
            </n-button>
          </n-dropdown>
        </template>
      </n-list-item>
    </n-list>

    <n-pagination
      v-if="isMobile && mobilePagination.pageCount > 1"
      v-model:page="mobilePagination.page"
      :page-count="mobilePagination.pageCount"
      class="mt-4"
      style="justify-content: center;"
    />

    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="dialog"
      :title="modalTitle"
      :positive-button-props="{ loading: saveLoading }"
      positive-text="保存"
      negative-text="取消"
      @positive-click="handleSave"
      @negative-click="closeModal"
    >
      <n-form>
        <n-form-item label="名称" required>
          <n-input v-model:value="formState.name" placeholder="为订阅起个名字" />
        </n-form-item>
        <n-form-item label="URL" required>
          <n-input v-model:value="formState.url" placeholder="输入订阅链接" />
        </n-form-item>
      </n-form>
    </n-modal>

    <!-- 批量导入组件 -->
    <SubscriptionImport
      v-model:show="showImportModal"
      :groups="subscriptionGroupStore.groups.map(g => ({ ...g, description: g.description || undefined }))"
      @success="onImportSuccess"
    />


    <n-modal
      v-model:show="showNodePreviewModal"
      preset="card"
      :title="`节点预览 - ${currentSubscriptionForPreview?.name}`"
      style="width: 800px;"
      :mask-closable="true"
    >
      <SubscriptionNodesPreview
        ref="nodePreviewRef"
        v-if="currentSubscriptionForPreview"
        :subscription-id="currentSubscriptionForPreview.id"
        :subscription-url="currentSubscriptionForPreview.url"
        :profile-id="currentSubscriptionForPreview.profile_id || undefined"
        :show="showNodePreviewModal"
      />
    </n-modal>

    <!-- 规则管理组件 -->
    <SubscriptionRules
      v-model:show-rules-modal="showRulesModal"
      v-model:show-rule-form-modal="showRuleFormModal"
      v-model:rule-save-loading="ruleSaveLoading"
      v-model:rules-loading="rulesLoading"
      v-model:current-rule-context="currentRuleContext"
      v-model:rules="rules"
      :rule-modal-title="ruleModalTitle"
      :rule-form-title="ruleFormTitle"
      :rule-form-ref="ruleFormRef"
      :rule-form-state="ruleFormState"
      :editing-rule="editingRule"
      @open-rule-form-modal="openRuleFormModal"
      @save-rule="handleSaveRule"
      @delete-rule="handleDeleteRule"
      @update:rule-form-state="Object.assign(ruleFormState, $event)"
    />

    <!-- 批量操作组件 -->
    <BatchActions
      v-model:show-move-to-group-modal="showMoveToGroupModal"
      v-model:show-batch-replace-modal="showBatchReplaceModal"
      v-model:show-export-modal="showExportModal"
      v-model:move-to-group-id="moveToGroupId"
      v-model:move-to-group-loading="moveToGroupLoading"
      v-model:batch-replace-find="batchReplaceData.find"
      v-model:batch-replace-replace="batchReplaceData.replace"
      v-model:batch-replace-count="batchReplaceData.count"
      v-model:batch-replace-loading="batchReplaceData.loading"
      v-model:export-urls="exportData.urls"
      :export-group-name="exportData.groupName"
      :export-count="exportData.count"
      :groups="subscriptionGroupStore.groups"
      @move-to-group="handleMoveToGroup"
      @batch-replace="handleBatchReplace"
      @copy-export-urls="handleCopyExportUrls"
    />

    <!-- 分组管理组件 -->
    <GroupManagement
      v-model:show-sort-modal="showSortModal"
      v-model:show-add-group-modal="showAddGroupModal"
      v-model:show-edit-group-modal="showEditGroupModal"
      v-model:show-dropdown="showDropdown"
      v-model:dropdown-x="dropdownX"
      v-model:dropdown-y="dropdownY"
      v-model:active-dropdown-group="activeDropdownGroup"
      v-model:sortable-groups="sortableGroups"
      v-model:new-group-name="newGroupName"
      v-model:new-group-description="newGroupDescription"
      v-model:editing-group-name="editingGroupName"
      v-model:editing-group-description="editingGroupDescription"
      v-model:sort-loading="sortLoading"
      v-model:add-group-loading="addGroupLoading"
      v-model:edit-group-loading="editGroupLoading"
      :is-mobile="isMobile"
      @save-group="handleSaveGroup"
      @update-group="handleUpdateGroup"
      @sort-save="handleSortSave"
      @group-action="handleGroupAction"
    />

    <!-- 订阅更新日志组件 -->
    <UpdateLogModal
      v-model:show="showUpdateLogModal"
      v-model:update-stage="updateStage"
      v-model:update-log="updateLog"
      v-model:update-progress="updateProgress"
      v-model:subs-to-update="subsToUpdate"
          :update-settings="updateSettings"
      @update:update-settings="Object.assign(updateSettings, $event)"
      v-model:update-log-loading="updateLogLoading"
      :rule-modal-title="ruleModalTitle"
      :rule-form-title="ruleFormTitle"
      @execute-updates="executeSubscriptionUpdates"
      @retry-failed="handleRetryFailed"
      @clear-expiring="handleClearExpiring"
      @clear-failed="handleClearFailed"
      @cancel-update="handleCancelUpdate"
    />
  </div>
</template>

<style scoped>
.group-tab-wrapper {
  display: flex;
  align-items: center;
  padding: 0 4px;
}

.group-actions-button {
  transition: opacity 0.2s;
}
</style>