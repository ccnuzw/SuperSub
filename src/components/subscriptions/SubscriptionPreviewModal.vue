/**
 * 订阅节点预览模态框组件
 * 视图层组件：负责UI渲染和用户交互，业务逻辑委托给Composable
 */

<template>
  <n-modal
    :show="show"
    @update:show="$emit('update:show', $event)"
    preset="card"
    :title="title"
    style="width: 1000px; max-height: 90vh;"
    :mask-closable="!loading"
    :closable="!loading"
  >
    <div class="subscription-preview-modal">
      <!-- 订阅信息头部 -->
      <div v-if="subscription" class="subscription-header mb-6">
        <n-descriptions :columns="3" bordered>
          <n-descriptions-item label="订阅名称">
            {{ subscription.name }}
          </n-descriptions-item>
          <n-descriptions-item label="订阅链接">
            <n-ellipsis style="max-width: 200px">
              {{ subscription.url }}
            </n-ellipsis>
          </n-descriptions-item>
          <n-descriptions-item label="更新时间">
            {{ formatTime(subscription.updated_at) }}
          </n-descriptions-item>
        </n-descriptions>
      </div>

      <!-- 统计信息和过滤器 -->
      <div class="preview-controls mb-4">
        <div class="stats-row">
          <n-space>
            <n-statistic label="总节点数" :value="stats.total" />
            <n-statistic label="可用节点" :value="stats.enabled" />
            <n-statistic label="健康节点" :value="stats.healthy" />
            <n-statistic label="失败节点" :value="stats.failed" />
          </n-space>
        </div>

        <div class="filters-row mt-4">
          <n-space>
            <n-input
              v-model:value="filters.search"
              placeholder="搜索节点名称、服务器"
              clearable
              :disabled="loading"
              style="width: 200px;"
            >
              <template #prefix>
                <n-icon><search-outline /></n-icon>
              </template>
            </n-input>

            <n-select
              v-model:value="filters.type"
              :options="nodeTypeOptions"
              placeholder="节点类型"
              clearable
              :disabled="loading"
              style="width: 120px;"
            />

            <n-switch
              v-model:value="filters.enabled"
              :disabled="loading"
            >
              <template #checked>显示所有</template>
              <template #unchecked>仅显示可用</template>
            </n-switch>

            <n-button
              @click="handleRefresh"
              :loading="loading"
              quaternary
            >
              <template #icon>
                <refresh-outline />
              </template>
              刷新
            </n-button>

            <n-button
              @click="handleExport"
              :disabled="!hasNodes"
              quaternary
            >
              <template #icon>
                <download-outline />
              </template>
              导出
            </n-button>
          </n-space>
        </div>
      </div>

      <!-- 节点列表 -->
      <div class="nodes-container">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-container">
          <n-spin size="large" />
          <p class="mt-4">正在获取节点数据...</p>
          <p class="text-sm text-gray-500 mt-2">
            {{ loadingTip }}
          </p>
          <n-progress
            v-if="showProgress"
            :percentage="loadingProgress"
            :show-indicator="false"
            class="mt-4 w-64"
            color="#18a058"
          />
        </div>

        <!-- 错误状态 -->
        <div v-else-if="hasError" class="error-container">
          <n-result
            status="error"
            :title="error || '未知错误'"
            :description="errorDescription"
          >
            <template #footer>
              <n-button @click="handleRefresh" :loading="loading">
                重试
              </n-button>
            </template>
          </n-result>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!hasNodes" class="empty-container">
          <n-empty description="暂无节点数据" />
        </div>

        <!-- 节点表格 -->
        <div v-else class="nodes-table">
          <n-data-table
            :columns="columns"
            :data="filteredNodes"
            :loading="loading"
            :pagination="pagination"
            size="small"
            striped
          />
        </div>
      </div>
    </div>

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleClose" :disabled="loading">
          关闭
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, h, watch } from 'vue'
import {
  NModal,
  NDescriptions,
  NDescriptionsItem,
  NEllipsis,
  NSpace,
  NStatistic,
  NInput,
  NSelect,
  NSwitch,
  NButton,
  NIcon,
  NSpin,
  NResult,
  NEmpty,
  NDataTable,
  NProgress,
  type DataTableColumns
} from 'naive-ui'
import {
  SearchOutline,
  RefreshOutline,
  DownloadOutline,
  CheckmarkCircleOutline,
  WarningOutline,
  CloseCircleOutline
} from '@vicons/ionicons5'
import type { ISubscription } from '@/types'
import type { IModalComponentProps, IModalComponentEmits } from '@/utils/componentApiStandards'
import { useSubscriptionPreview, type IPreviewNode } from './composables/useSubscriptionPreview'

interface IProps extends IModalComponentProps {
  show: boolean
  subscription?: ISubscription | null
}

const props = withDefaults(defineProps<IProps>(), {
  subscription: null
})

interface IEmits extends IModalComponentEmits {
  'update:show': [value: boolean]
}

const emit = defineEmits<IEmits>()

// 使用业务逻辑层 Composable
const {
  loading,
  showModal,
  subscription: previewSubscription,
  filteredNodes,
  error,
  hasError,
  hasNodes,
  filters,
  nodeTypeOptions,
  stats,
  refreshNodes,
  copyNodeConfig,
  exportNodes,
  closePreview,
  openPreview
} = useSubscriptionPreview()

// 表格列定义
const columns: DataTableColumns<IPreviewNode> = [
  {
    title: '状态',
    key: 'status',
    width: 80,
    render: (row) => {
      if (row.status === 'healthy') {
        return h(NIcon, { color: 'var(--success-color)' }, {
          default: () => h(CheckmarkCircleOutline)
        })
      } else if (row.status === 'unhealthy') {
        return h(NIcon, { color: 'var(--error-color)' }, {
          default: () => h(CloseCircleOutline)
        })
      } else if (row.status === 'testing') {
        return h(NIcon, { color: 'var(--warning-color)' }, {
          default: () => h(WarningOutline)
        })
      } else {
        return h(NIcon, { color: 'var(--text-color-3)' }, {
          default: () => h(CheckmarkCircleOutline)
        })
      }
    }
  },
  {
    title: '节点名称',
    key: 'name',
    minWidth: 150,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '服务器',
    key: 'server',
    minWidth: 120,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '端口',
    key: 'port',
    width: 80
  },
  {
    title: '类型',
    key: 'type',
    width: 100
  },
  {
    title: '延迟',
    key: 'latency',
    width: 80,
    render: (row) => row.latency ? `${row.latency}ms` : '-'
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render: (row) => {
      return h(NButton, {
        size: 'small',
        onClick: () => handleCopyConfig(row)
      }, {
        default: () => '复制配置'
      })
    }
  }
]

// 分页配置
const pagination = ref({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

// 加载状态管理
const loadingTip = ref('正在连接订阅服务器...')
const loadingProgress = ref(0)
const showProgress = ref(false)

// 加载状态提示
const loadingTips = [
  '正在连接订阅服务器...',
  '正在获取节点数据...',
  '正在解析节点信息...',
  '即将完成...'
]

// 模拟加载进度
let loadingTimer: NodeJS.Timeout | null = null
const startLoadingProgress = () => {
  loadingProgress.value = 0
  showProgress.value = true

  let tipIndex = 0
  let progressValue = 0

  loadingTimer = setInterval(() => {
    progressValue += Math.random() * 15
    if (progressValue > 90) progressValue = 90

    loadingProgress.value = progressValue

    // 每3秒切换一次提示
    if (progressValue % 30 < 15) {
      tipIndex = (tipIndex + 1) % loadingTips.length
      loadingTip.value = loadingTips[tipIndex]
    }
  }, 500)
}

const stopLoadingProgress = () => {
  if (loadingTimer) {
    clearInterval(loadingTimer)
    loadingTimer = null
  }
  showProgress.value = false
  loadingProgress.value = 0
}

// 计算属性
const title = computed(() => {
  return previewSubscription.value
    ? `节点预览 - ${previewSubscription.value.name}`
    : '节点预览'
})

const errorDescription = computed(() => {
  return '获取节点数据失败，请检查订阅链接是否正确或稍后重试'
})

// 监听加载状态
watch(() => loading.value, (newLoading) => {
  if (newLoading) {
    startLoadingProgress()
  } else {
    stopLoadingProgress()
  }
}, { immediate: true })

// 方法
const formatTime = (timestamp: string | null) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString()
}

const handleRefresh = () => {
  refreshNodes() // 直接刷新，不需要强制参数
}

const handleExport = () => {
  exportNodes()
}

const handleCopyConfig = (node: IPreviewNode) => {
  copyNodeConfig(node)
}

const handleClose = () => {
  closePreview()
}

// 监听订阅变化，自动打开预览
watch(() => props.subscription, (newSubscription: ISubscription | null) => {
  if (newSubscription && props.show) {
    // 使用composable的openPreview方法来处理预览逻辑
    openPreview(newSubscription)
  }
})

// 监听show属性变化
watch(() => props.show, (newShow: boolean) => {
  if (newShow && props.subscription) {
    openPreview(props.subscription)
  } else if (!newShow) {
    closePreview()
  }
})
</script>

<style scoped>
.subscription-preview-modal {
  min-height: 400px;
}

.subscription-header {
  background: var(--n-card-color);
  padding: 16px;
  border-radius: 6px;
  border: 1px solid var(--n-border-color);
}

.preview-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-row {
  display: flex;
  align-items: center;
}

.filters-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.nodes-container {
  min-height: 300px;
  max-height: 500px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 16px;
}

.nodes-table {
  flex: 1;
  overflow: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .subscription-preview-modal {
    width: 95vw !important;
    max-width: none;
  }

  .stats-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters-row .n-space {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>