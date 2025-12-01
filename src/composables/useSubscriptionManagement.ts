import { ref, computed, nextTick, watch, h } from 'vue'
import { useMessage, useDialog, NButton, NSpace, NDropdown, NIcon } from 'naive-ui'
import type { Subscription } from '@/types'
import { SubscriptionService } from '@/services/subscriptionService'
import { api } from '@/utils/api'
import { format } from 'date-fns'
import { EyeOutline, SettingsOutline, SyncOutline, TrashOutline, EllipsisVertical as MoreIcon } from '@vicons/ionicons5'

export function useSubscriptionManagement() {
  const subscriptions = ref<Subscription[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const message = useMessage()
  const dialog = useDialog()
  const subscriptionService = new SubscriptionService()

  // UI状态
  const showModal = ref(false)
  const saveLoading = ref(false)
  const editingSubscription = ref<Subscription | null>(null)
  const updatingId = ref<string | null>(null)
  const updatingIds = ref(new Set<string>())
  const checkedRowKeys = ref<string[]>([])

  // 表单状态
  const formState = ref({
    id: '',
    name: '',
    url: '',
  })

  // 计算属性
  const modalTitle = computed(() => (editingSubscription.value ? '编辑订阅' : '新增订阅'))

  const successRate = computed(() => {
    const activeCount = subscriptions.value.filter(s => s.enabled && (s.node_count ?? 0) > 0).length
    const totalCount = subscriptions.value.length
    return totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0
  })

  // CRUD操作
  const fetchSubscriptions = async () => {
    loading.value = true
    error.value = null

    try {
      const data = await subscriptionService.getSubscriptions()
      subscriptions.value = data
    } catch (err: any) {
      error.value = err.message
      message.error('获取订阅列表失败')
    } finally {
      loading.value = false
    }
  }

  const openModal = (sub: Subscription | null = null) => {
    if (sub) {
      editingSubscription.value = { ...sub }
      formState.value.id = sub.id
      formState.value.name = sub.name
      formState.value.url = sub.url
    } else {
      editingSubscription.value = null
      formState.value.id = ''
      formState.value.name = ''
      formState.value.url = ''
    }
    showModal.value = true
  }

  const closeModal = () => {
    showModal.value = false
  }

  const handleSave = async () => {
    saveLoading.value = true
    try {
      const payload = { name: formState.value.name, url: formState.value.url }

      if (editingSubscription.value) {
        await subscriptionService.updateSubscription(editingSubscription.value.id, payload)
        message.success('订阅更新成功')
      } else {
        await subscriptionService.createSubscription(payload)
        message.success('订阅新增成功')
      }

      closeModal()
      fetchSubscriptions()
    } catch (err: any) {
      message.error(err.message || '保存失败')
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
          await subscriptionService.deleteSubscription(row.id)
          message.success('订阅删除成功')
          fetchSubscriptions()
        } catch (err: any) {
          message.error(err.message || '删除失败')
        }
      },
    })
  }

  const handleUpdate = async (row: Subscription, silent = false) => {
    updatingId.value = row.id
    updatingIds.value.add(row.id)

    if (!silent) {
      message.info(`正在更新订阅 [${row.name}]...`)
    }

    try {
      const response = await api.post(`/subscriptions/${row.id}/update`)

      // 更新本地数据
      if (response.data.success && response.data.data) {
        const index = subscriptions.value.findIndex(s => s.id === row.id)
        if (index !== -1) {
          subscriptions.value[index] = response.data.data
        }
      }

      if (!silent) {
        if (response.data.success) {
          message.success(`订阅 [${row.name}] 更新成功`)
        } else {
          message.error(response.data.message || '更新失败')
        }
      }

      return {
        success: response.data.success,
        data: response.data.data || row,
        error: response.data.success ? undefined : response.data.message
      }
    } catch (err: any) {
      const errorMsg = err.message || '更新失败'
      if (!silent) {
        message.error(errorMsg)
      }
      return {
        success: false,
        data: row,
        error: errorMsg
      }
    } finally {
      updatingId.value = null
      updatingIds.value.delete(row.id)
    }
  }

  // 批量操作
  const handleBatchDelete = () => {
    if (checkedRowKeys.value.length === 0) {
      message.warning('请至少选择一个订阅')
      return
    }

    dialog.warning({
      title: '确认批量删除',
      content: `确定要删除选中的 ${checkedRowKeys.value.length} 个订阅吗？此操作不可恢复！`,
      positiveText: '确定删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          console.log('Executing batch delete for subscriptions:', checkedRowKeys.value) // 调试信息

          // 使用API直接调用，保持与原组件一致
          const response = await api.delete('/subscriptions/batch', {
            data: {
              subscriptionIds: checkedRowKeys.value
            }
          })

          if (response.data.success) {
            message.success(`成功删除 ${checkedRowKeys.value.length} 个订阅`)
            fetchSubscriptions()
            checkedRowKeys.value = []
            console.log('Batch delete completed successfully') // 调试信息
          } else {
            message.error(response.data.message || '批量删除失败')
          }
        } catch (err: any) {
          console.error('Failed to batch delete subscriptions:', err) // 调试信息
          message.error(`批量删除失败: ${err.message}`)
        }
      },
    })
  }

  // 数据表格列定义
  const createColumns = ({ onEdit, onUpdate, onDelete, onPreviewNodes, onManageRules }: {
    onEdit: (row: Subscription) => void,
    onUpdate: (row: Subscription) => void,
    onDelete: (row: Subscription) => void,
    onPreviewNodes: (row: Subscription) => void,
    onManageRules: (row: Subscription) => void,
  }) => {
    return [
      { type: 'selection' as const },
      { title: '名称', key: 'name', sorter: 'default' as const, width: 150, ellipsis: { tooltip: true } },
      { title: '订阅链接', key: 'url', ellipsis: { tooltip: true }, width: 150 },
      {
        title: '状态',
        key: 'status',
        align: 'center' as const,
        width: 100,
        sorter: (a: Subscription, b: Subscription) => {
          const getStatusValue = (row: Subscription) => {
            if (row.error) return 2
            if (row.last_updated) return 1
            return 0
          }
          return getStatusValue(a) - getStatusValue(b)
        },
        render(row: Subscription) {
          if (row.error) {
            return '失败'
          }
          if (row.last_updated) {
            return '成功'
          }
          return '待更新'
        }
      },
      {
        title: '节点数',
        key: 'node_count',
        align: 'center' as const,
        width: 100,
        sorter: 'default' as const,
        render(row: Subscription) {
          const count = row.node_count ?? 0
          return count
        }
      },
      {
        title: '剩余流量',
        key: 'remaining_traffic',
        width: 120,
        sorter: (a: Subscription, b: Subscription) => {
          const valA = a.remaining_traffic
          const valB = b.remaining_traffic
          if (valA === null || valA === undefined) return 1
          if (valB === null || valB === undefined) return -1
          return valA - valB
        },
        render(row: Subscription) {
          const remaining = row.remaining_traffic
          if (remaining === null || remaining === undefined || remaining < 0) {
            return 'N/A'
          }

          // 简化的字节格式化
          const GB = 1024 * 1024 * 1024
          if (remaining >= GB) {
            return `${(remaining / GB).toFixed(1)} GB`
          } else if (remaining >= 1024 * 1024) {
            return `${(remaining / (1024 * 1024)).toFixed(1)} MB`
          } else {
            return `${remaining} B`
          }
        }
      },
      {
        title: '剩余天数',
        key: 'remaining_days',
        width: 120,
        sorter: (a: Subscription, b: Subscription) => {
          const valA = a.remaining_days
          const valB = b.remaining_days
          if (valA === null || valA === undefined) return 1
          if (valB === null || valB === undefined) return -1
          return valA - valB
        },
        render(row: Subscription) {
          const diffDays = row.remaining_days
          if (diffDays === null || diffDays === undefined) {
            return 'N/A'
          }
          if (diffDays < 0) {
            return '已过期'
          }
          return `${diffDays} 天`
        }
      },
      {
        title: '上次更新',
        key: 'last_updated',
        width: 180,
        sorter: (a: Subscription, b: Subscription) => {
          const timeA = new Date(a.last_updated || 0).getTime()
          const timeB = new Date(b.last_updated || 0).getTime()
          return timeA - timeB
        },
        render(row: Subscription) {
          return row.last_updated ? format(new Date(row.last_updated), 'yyyy-MM-dd HH:mm:ss') : 'N/A'
        }
      },
      {
        title: '操作',
        key: 'actions',
        fixed: 'right' as const,
        width: 200,
        render(row: Subscription) {
          return h(NSpace, { size: 'small' }, {
            default: () => [
              h(NButton, {
                size: 'small',
                onClick: () => onPreviewNodes(row)
              }, { default: () => '预览' }),
              h(NButton, {
                size: 'small',
                type: 'primary',
                onClick: () => onEdit(row)
              }, { default: () => '编辑' }),
              h(NDropdown, {
                trigger: 'click',
                options: [
                  { label: '更新', key: 'update', icon: () => h(NIcon, { component: SyncOutline }) },
                  { label: '规则', key: 'rules', icon: () => h(NIcon, { component: SettingsOutline }) },
                  { label: '删除', key: 'delete', icon: () => h(NIcon, { component: TrashOutline }) }
                ],
                onSelect: (key: string) => {
                  switch (key) {
                    case 'update':
                      onUpdate(row)
                      break
                    case 'rules':
                      onManageRules(row)
                      break
                    case 'delete':
                      onDelete(row)
                      break
                  }
                }
              }, {
                default: () => h(NButton, {
                  size: 'small',
                  type: 'error',
                  style: { marginLeft: '4px' }
                }, { default: () => h(NIcon, { component: MoreIcon }) })
              })
            ]
          })
        }
      }
    ]
  }

  return {
    // 数据
    subscriptions,
    loading,
    error,
    showModal,
    saveLoading,
    editingSubscription,
    updatingId,
    updatingIds,
    checkedRowKeys,
    formState,

    // 计算属性
    modalTitle,
    successRate,

    // 方法
    fetchSubscriptions,
    openModal,
    closeModal,
    handleSave,
    handleDelete,
    handleUpdate,
    handleBatchDelete,
    createColumns,

    // 工具方法
    resetSelection: () => { checkedRowKeys.value = [] },
    isSelected: (id: string) => checkedRowKeys.value.includes(id),
    toggleSelection: (id: string) => {
      const index = checkedRowKeys.value.indexOf(id)
      if (index > -1) {
        checkedRowKeys.value.splice(index, 1)
      } else {
        checkedRowKeys.value.push(id)
      }
    }
  }
}