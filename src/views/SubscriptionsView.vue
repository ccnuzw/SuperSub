<script setup lang="ts">
import { ref, onMounted, reactive, h, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage, useDialog, NButton, NSpace, NTag, NDataTable, NPageHeader, NModal, NForm, NFormItem, NInput, NTooltip, NGrid, NGi, NStatistic, NCard, NSwitch, NSelect, NDynamicTags, NRadioGroup, NRadioButton, NInputGroup, NIcon, NTabs, NTabPane, NDropdown, NProgress, NCollapse, NCollapseItem, NInputNumber, NList, NListItem, NThing, NPagination } from 'naive-ui'
import draggable from 'vuedraggable'
import { EyeOutline, FilterOutline, CreateOutline, SyncOutline, TrashOutline, EllipsisVertical as MoreIcon, SettingsOutline, ReorderFourOutline, AddOutline, EllipsisHorizontal } from '@vicons/ionicons5'
import type { DataTableColumns, FormInst, DropdownOption } from 'naive-ui'
import { useIsMobile } from '@/composables/useMediaQuery'
import { Subscription, Node, ApiResponse } from '@/types'
import { subscriptionsApi } from '@/api/subscriptions';

import { useAuthStore } from '@/stores/auth'
import { useSubscriptionGroupStore } from '@/stores/subscriptionGroups'
import { useGroupStore as useNodeGroupStore } from '@/stores/groups'
import SubscriptionNodesPreview from '@/components/SubscriptionNodesPreview.vue'
import { format } from 'date-fns'

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
const updatingIds = ref(new Set<string>())
const activeTab = ref('all')

// For bulk import
const showImportModal = ref(false)
const importUrls = ref('')
const importLoading = ref(false)
const importGroupId = ref<string | undefined>(undefined)

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

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes) return '0 Bytes'; // Handle null/undefined/0 safely
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


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
            // createTooltipButton('规则', FilterOutline, () => onManageRules(row), { type: 'info' }), // Rules functionality to be implemented in new component/API
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

// Placeholder for onManageRules until implemented
const onManageRules = (row: Subscription) => {
    message.info('规则管理待重构')
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
  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) return
  loading.value = true
  try {
    const subsResponse = await subscriptionsApi.fetchSubscriptions()
    if (subsResponse.data.success && subsResponse.data.data) {
      subscriptions.value = subsResponse.data.data
    } else {
      message.error(subsResponse.data.message || '获取订阅列表失败')
    }
  } catch (err) {
    message.error('请求失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  saveLoading.value = true
  try {
    const payload = { name: formState.name, url: formState.url }
    const response = editingSubscription.value
      ? await subscriptionsApi.updateSubscription(editingSubscription.value.id, payload)
      : await subscriptionsApi.addSubscription(payload)
      
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
        const response = await subscriptionsApi.deleteSubscription(row.id)
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
  updatingId.value = row.id
  updatingIds.value.add(row.id)
  if (!silent) {
    message.info(`正在更新订阅 [${row.name}]...`)
  }
  try {
    const response = await subscriptionsApi.updateFromUrl(row.id, signal)
    const updatedSub = response.data.data // Assuming backend returns updated sub in data? Check API definition. 
    // subscriptionsApi.updateFromUrl currently returns { success: boolean, message: string, data: Subscription } or similar.
    // My definition: { success: boolean; message: string; data: Subscription }
    
    // Refresh list or simple update
    if (response.data.success && response.data.data) {
        const index = subscriptions.value.findIndex(s => s.id === row.id)
        if (index !== -1) {
            subscriptions.value[index] = response.data.data as unknown as Subscription
        }
    } else {
        fetchSubscriptions(); // Fallback
    }

    if (response.data.success) {
      if (!silent) message.success(`订阅 [${row.name}] 更新成功`)
      return { success: true, data: response.data.data as unknown as Subscription }
    } else {
      const errorMsg = response.data.message || `订阅 [${row.name}] 更新失败`
      if (!silent) message.error(errorMsg)
      return { success: false, data: row, error: errorMsg }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, data: row, error: '已中止' }
    }
    const errorMsg = err.message || '请求失败，请稍后重试'
    if (!silent) message.error(errorMsg)
    return { success: false, data: row, error: errorMsg }
  } finally {
    updatingId.value = null
    updatingIds.value.delete(row.id)
  }
}


const openImportModal = () => {
  importUrls.value = ''
  importGroupId.value = undefined
  showImportModal.value = true
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
    : subscriptions.value.filter(s => s.is_enabled) // Use is_enabled instead of enabled
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
        const response = await subscriptionsApi.batchDelete(idsToClear);
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
        const response = await subscriptionsApi.batchDelete(idsToClear);
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

const handleBulkImport = async () => {
  if (!importUrls.value.trim()) {
    message.warning('请输入订阅链接')
    return
  }
  importLoading.value = true
  const lines = importUrls.value.split('\n').map(line => line.trim()).filter(Boolean)
  const subscriptionsToCreate: { name: string; url: string }[] = []
  for (const line of lines) {
    const parts = line.split(',').map(part => part.trim())
    if (parts.length === 2 && parts[1].startsWith('http')) {
      subscriptionsToCreate.push({ name: parts[0], url: parts[1] })
    } else if (parts.length === 1 && parts[0].startsWith('http')) {
      try {
        const urlObj = new URL(parts[0])
        const name = urlObj.hostname
        subscriptionsToCreate.push({ name: name, url: parts[0] })
      } catch (e) { /* Ignore invalid URL */ }
    }
  }
  if (subscriptionsToCreate.length === 0) {
    message.warning('没有找到有效的订阅链接。格式应为 "名称,链接" 或直接是链接。')
    importLoading.value = false
    return
  }
  try {
    const response = await subscriptionsApi.batchImport(subscriptionsToCreate, importGroupId.value)
    if (response.data.success) {
      message.success(response.data.data?.message || `成功导入 ${response.data.data?.created || 0} 个订阅`)
      showImportModal.value = false
      fetchSubscriptions()
    } else {
      message.error(response.data.message || '导入失败')
    }
  } catch (error) {
    message.error('请求失败，请稍后重试')
  } finally {
    importLoading.value = false
  }
}

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
        const response = await subscriptionsApi.batchDelete(checkedRowKeys.value);
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
          response = await subscriptionsApi.clearAll();
        } else {
          const groupId = tab === 'ungrouped' ? null : tab;
          response = await subscriptionsApi.clearByGroup(groupId);
        }

        if (response.data.success) {
          message.success(response.data.message || '清除成功');
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

onMounted(() => {
  fetchSubscriptions();
  subscriptionGroupStore.fetchGroups();
});
</script>

<template>
  <div class="subscriptions-view">
    <n-page-header>
        <template #title>订阅管理</template>
        <template #extra>
            <n-space>
                <n-button type="primary" @click="openModal(null)">
                    <template #icon><n-icon :component="AddOutline" /></template>
                    新增订阅
                </n-button>
                <n-button type="primary" secondary @click="openImportModal">
                   <template #icon><n-icon :component="AddOutline" /></template>
                   批量导入
                </n-button>
                <n-dropdown
                    trigger="click"
                    :options="[
                      { label: '更新全部', key: 'update-all' },
                      { label: '批量删除', key: 'batch-delete', disabled: checkedRowKeys.length === 0 },
                      { label: '清空当前分组', key: 'clear-current' },
                    ]"
                    @select="key => {
                        if (key === 'update-all') handleUpdateAll();
                        if (key === 'batch-delete') handleBatchDelete();
                        if (key === 'clear-current') handleClearCurrentGroup();
                    }"
                >
                    <n-button>
                         <template #icon><n-icon :component="MoreIcon" /></template>
                         批量操作
                    </n-button>
                </n-dropdown>
            </n-space>
        </template>
    </n-page-header>

    <n-tabs type="card" class="mt-4" v-model:value="activeTab">
        <n-tab-pane name="all" :tab="`全部 (${groupCounts.all})`" />
        <n-tab-pane name="ungrouped" :tab="`未分组 (${groupCounts.ungrouped})`" />
        <n-tab-pane
            v-for="group in subscriptionGroupStore.groups"
            :key="group.id"
            :name="group.id"
            :tab="`${group.name} (${groupCounts[group.id] || 0})`"
        />
    </n-tabs>

    <n-data-table
        v-if="!isMobile"
        :columns="createColumns({ onEdit: openModal, onUpdate: handleUpdate, onDelete: handleDelete, onPreviewNodes, onManageRules })"
        :data="filteredSubscriptions"
        :row-key="(row: Subscription) => row.id"
        v-model:checked-row-keys="checkedRowKeys"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        class="mt-4"
    />
     <n-list v-else bordered class="mt-4">
      <n-list-item v-for="sub in paginatedSubscriptions" :key="sub.id">
        <n-thing>
          <template #header>
            {{ sub.name }}
          </template>
          <template #description>
             <n-space size="small">
                <n-tag v-if="sub.last_updated" type="success" size="small" round>已更新</n-tag>
                <n-tag v-else type="default" size="small" round>待更新</n-tag>
                <n-tag v-if="sub.node_count" type="info" size="small" round>{{ sub.node_count }} 节点</n-tag>
             </n-space>
             <div class="text-xs text-gray-500 mt-1 truncate">{{ sub.url }}</div>
          </template>
        </n-thing>
        <template #suffix>
          <n-dropdown
            trigger="click"
             :options="[
              { label: '预览节点', key: 'preview' },
              { label: '编辑', key: 'edit' },
              { label: '更新', key: 'update' },
              { label: '删除', key: 'delete' },
            ]"
            @select="key => {
              if (key === 'preview') onPreviewNodes(sub);
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


    <!-- Modals -->
    <n-modal v-model:show="showModal" preset="card" :title="modalTitle" style="width: 500px;">
        <n-form :model="formState" label-placement="left" label-width="80">
            <n-form-item label="名称" path="name">
                <n-input v-model:value="formState.name" placeholder="请输入订阅名称" />
            </n-form-item>
            <n-form-item label="链接" path="url">
                <n-input type="textarea" v-model:value="formState.url" placeholder="请输入订阅链接" />
            </n-form-item>
        </n-form>
         <template #footer>
            <n-space justify="end">
                <n-button @click="closeModal">取消</n-button>
                <n-button type="primary" @click="handleSave" :loading="saveLoading">保存</n-button>
            </n-space>
        </template>
    </n-modal>

    <n-modal v-model:show="showImportModal" preset="card" title="批量导入订阅" style="width: 600px;">
         <n-input
            v-model:value="importUrls"
            type="textarea"
            placeholder="请输入订阅链接，每行一个。格式：名称,链接 或 直接链接 (自动获取域名作为名称)"
            :autosize="{ minRows: 5, maxRows: 10 }"
        />
         <n-form-item label="导入到分组" class="mt-4">
          <n-select
            v-model:value="importGroupId"
            :options="subscriptionGroupStore.groups.map(g => ({ label: g.name, value: g.id }))"
            placeholder="选择分组 (可选)"
            clearable
          />
        </n-form-item>
        <template #footer>
            <n-space justify="end">
                <n-button @click="showImportModal = false">取消</n-button>
                <n-button type="primary" @click="handleBulkImport" :loading="importLoading">导入</n-button>
            </n-space>
        </template>
    </n-modal>

     <n-modal
      v-model:show="showNodePreviewModal"
      preset="card"
      title="节点预览"
      style="width: 800px; max-width: 95%;"
    >
        <SubscriptionNodesPreview
          v-if="currentSubscriptionForPreview"
          ref="nodePreviewRef"
          :subscription-id="currentSubscriptionForPreview.id"
          :subscription-url="currentSubscriptionForPreview.url"
          :show="showNodePreviewModal"
        />
    </n-modal>

    <n-modal
      v-model:show="showUpdateLogModal"
      preset="card"
      title="批量更新"
      style="width: 600px; max-width: 95%;"
      :mask-closable="false"
      :close-on-esc="false"
    >
      <div v-if="updateStage === 'config'">
         <n-alert title="更新配置" type="info" class="mb-4">
             配置本次更新的并发参数和过期策略。
         </n-alert>
         <n-form label-placement="left" label-width="120">
             <n-form-item label="并发数">
                 <n-input-number v-model:value="updateSettings.concurrency" :min="1" :max="10" />
             </n-form-item>
             <n-form-item label="重试次数">
                 <n-input-number v-model:value="updateSettings.retries" :min="0" :max="5" />
             </n-form-item>
              <n-form-item label="请求间隔 (ms)">
                 <n-input-number v-model:value="updateSettings.delay" :min="0" :step="100" />
             </n-form-item>
             <n-collapse>
                 <n-collapse-item title="过期策略 (自动清理)" name="1">
                     <n-form-item label="剩余天数少于">
                         <n-input-number v-model:value="updateSettings.expiringDaysThreshold" :min="0" />
                     </n-form-item>
                     <n-form-item label="剩余流量少于 (GB)">
                         <n-input-number v-model:value="updateSettings.expiringTrafficThresholdGB" :min="0" :step="0.1" />
                     </n-form-item>
                 </n-collapse-item>
             </n-collapse>
         </n-form>
      </div>

      <div v-else>
        <div class="mb-4">
          <div class="flex justify-between mb-1">
             <span>进度: {{ updateProgress.current }} / {{ updateProgress.total }}</span>
             <span v-if="updateLogLoading">正在更新...</span>
             <span v-else>更新完成</span>
          </div>
          <n-progress
            type="line"
            :percentage="Math.round((updateProgress.current / updateProgress.total) * 100) || 0"
            :status="updateLogLoading ? 'default' : 'success'"
            :processing="updateLogLoading"
          />
        </div>

        <n-collapse :default-expanded-names="['failed', 'expiring']">
           <n-collapse-item title="更新成功" name="success">
               <template #header-extra>
                   <n-tag type="success" size="small" round>{{ updateLog.success.length }}</n-tag>
               </template>
               <n-list style="max-height: 200px; overflow-y: auto;">
                   <n-list-item v-for="(item, index) in updateLog.success" :key="index">
                       {{ item.name }}
                   </n-list-item>
               </n-list>
           </n-collapse-item>

           <n-collapse-item title="更新失败" name="failed">
               <template #header-extra>
                   <n-tag type="error" size="small" round>{{ updateLog.failed.length }}</n-tag>
               </template>
               <div v-if="updateLog.failed.length > 0" class="mb-2">
                   <n-space>
                       <n-button size="small" type="warning" @click="handleRetryFailed" :disabled="updateLogLoading">重试失败项</n-button>
                       <n-button size="small" type="error" ghost @click="handleClearFailed" :disabled="updateLogLoading">清除失败项</n-button>
                   </n-space>
               </div>
               <n-list style="max-height: 200px; overflow-y: auto;">
                   <n-list-item v-for="sub in updateLog.failed" :key="sub.id">
                       <div class="flex justify-between">
                           <span>{{ sub.name }}</span>
                           <span class="text-red-500 text-xs">{{ sub.error }}</span>
                       </div>
                   </n-list-item>
               </n-list>
           </n-collapse-item>

           <n-collapse-item title="即将到期/流量不足" name="expiring">
                <template #header-extra>
                   <n-tag type="warning" size="small" round>{{ updateLog.expiring.length }}</n-tag>
               </template>
                <div v-if="updateLog.expiring.length > 0" class="mb-2">
                   <n-button size="small" type="error" ghost @click="handleClearExpiring" :disabled="updateLogLoading">清除此类订阅</n-button>
                </div>
                <n-list style="max-height: 200px; overflow-y: auto;">
                   <n-list-item v-for="sub in updateLog.expiring" :key="sub.id">
                        <div class="flex justify-between">
                           <span>{{ sub.name }}</span>
                           <span class="text-xs text-gray-500">
                               Remaining: {{ sub.remaining_days }}d / {{ formatBytes(sub.remaining_traffic ?? 0) }}
                           </span>
                       </div>
                   </n-list-item>
                </n-list>
           </n-collapse-item>
        </n-collapse>
      </div>

       <template #footer>
        <n-space justify="end">
          <n-button v-if="updateStage === 'config'" @click="showUpdateLogModal = false">取消</n-button>
          <n-button v-if="updateStage === 'config'" type="primary" @click="executeSubscriptionUpdates">开始更新</n-button>
          <n-button v-if="updateStage === 'progress'" @click="handleCancelUpdate" :disabled="!updateLogLoading && updateProgress.current === updateProgress.total">{{ updateLogLoading ? '停止' : '关闭' }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>