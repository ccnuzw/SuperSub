<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useMessage, useDialog, NButton, NSpace, NDataTable, NSpin, NIcon, NTag, NStatistic, NGrid, NGi, NScrollbar, NLog, NSteps, NStep, NCode, NList, NListItem, NThing, NDropdown, NEmpty } from 'naive-ui';
import type { DataTableColumns, DropdownOption } from 'naive-ui';
import { Pencil as EditIcon, TrashBinOutline as DeleteIcon, CopyOutline as CopyIcon, EyeOutline as PreviewIcon, DocumentTextOutline as LogIcon, ListOutline as ListIcon, EllipsisVertical as MoreIcon, Add as PlusIcon } from '@vicons/ionicons5';
import { useIsMobile } from '@/composables/useMediaQuery';
import { api } from '@/utils/api';
import { useAuthStore } from '@/stores/auth';
import { LogoutInProgressError } from '@/utils/errors';
import type { ApiResponse, Profile, Subscription, Node, LogEntry, LogLevel } from '@/types';
import { regenerateLink, type ParsedNode } from '@/utils/nodeParser';
import { getNaiveTagColor } from '@/utils/colors';
import SubscriptionLogModal from '@/components/SubscriptionLogModal.vue';
import ModernPageLayout from '@/components/layout/ModernPageLayout.vue';
import ModernContentCard from '@/components/layout/ModernContentCard.vue';

const router = useRouter();
const message = useMessage();
const dialog = useDialog();
const isMobile = useIsMobile();

const profiles = ref<Profile[]>([]);
const loading = ref(true);
const authStore = useAuthStore();
const subToken = computed(() => authStore.user?.sub_token || '');

// For Nodes Preview Modal
const showNodesPreviewModal = ref(false);
const showLogsModal = ref(false);
const loadingNodesPreview = ref(false);
const currentProfileForPreview = ref<Profile | null>(null);
const nodesPreviewData = ref<{
  nodes: Partial<Node>[];
  analysis: {
    total: number;
    protocols: Record<string, number>;
    regions: Record<string, number>;
  };
  mode: 'local' | 'remote';
  logs: LogEntry[];
} | null>(null);

// For Subscription Logs Modal
const showSubLogsModal = ref(false);
const currentProfileForLogs = ref<Profile | null>(null);

const getStepStatus = (level: LogLevel) => {
  switch (level) {
    case 'ERROR':
      return 'error';
    case 'WARN':
      return 'error'; // Naive UI doesn't have 'warning', map to 'error' to highlight
    case 'SUCCESS':
      return 'finish';
    case 'INFO':
    case 'STEP':
    case 'DEBUG':
    default:
      return 'process';
  }
};

const nodes = computed(() => nodesPreviewData.value?.nodes || []);

const previewNodeColumns: DataTableColumns<Partial<Node>> = [
  { title: '节点名称', key: 'name', width: 300, ellipsis: { tooltip: true } },
  {
    title: '类型',
    key: 'type',
    width: 100,
    align: 'center',
    render(row) {
        const protocol = row.protocol || row.type || 'N/A';
        return h(NTag, {
            size: 'small',
            round: true,
            color: getNaiveTagColor(protocol.toString(), 'protocol') || { color: '#7f8c8d', textColor: '#ffffff', borderColor: 'transparent' }
        }, { default: () => protocol.toString().toUpperCase() });
    }
  },
  { title: '服务器', key: 'server', width: 200, ellipsis: { tooltip: true } },
  { title: '端口', key: 'port', width: 80, align: 'center' },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    align: 'center',
    render(row) {
      return h(NButton, {
        size: 'tiny',
        ghost: true,
        type: 'primary',
        onClick: () => {
          // The row object from preview is a ParsedNode.
          const link = regenerateLink(row as ParsedNode);
          if (link) {
            navigator.clipboard.writeText(link);
            message.success('已复制完整链接');
          } else {
            message.error('无法生成链接');
          }
        }
      }, { default: () => '复制链接' });
    }
  }
];


const createColumns = ({ onCopy, onPreview, onLogs, onEdit, onDelete }: {
    onCopy: (row: Profile) => void,
    onPreview: (row: Profile) => void,
    onLogs: (row: Profile) => void,
    onEdit: (row
: Profile) => void,
    onDelete: (row: Profile) => void,
}): DataTableColumns<Profile> => {
  return [
    { title: '名称', key: 'name', sorter: 'default', width: 200 },
    {
      title: '订阅链接',
      key: 'alias',
      render(row) {
        if (!subToken.value || !row.alias) {
          return h('span', '请设置链接别名');
        }
        const url = `${window.location.origin}/api/public/${subToken.value}/${row.alias}`;
        return h(NButton, { text: true, tag: 'a', href: url, target: '_blank', type: 'primary' }, { default: () => url });
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      render(row) {
        return h(NSpace, null, {
          default: () => [
            h(NButton, { size: 'small', circle: true, title: '复制链接', onClick: () => onCopy(row) }, { icon: () => h(NIcon, null, { default: () => h(CopyIcon) }) }),
            h(NButton, { size: 'small', circle: true, title: '预览', onClick: () => onPreview(row) }, { icon: () => h(NIcon, null, { default: () => h(PreviewIcon) }) }),
            h(NButton, { size: 'small', circle: true, title: '日志', onClick: () => onLogs(row) }, { icon: () => h(NIcon, null, { default: () => h(LogIcon) }) }),
            h(NButton, { size: 'small', circle: true, type: 'primary', title: '编辑', onClick: () => onEdit(row) }, { icon: () => h(NIcon, null, { default: () => h(EditIcon) }) }),
            h(NButton, { size: 'small', circle: true, type: 'error', title: '删除', onClick: () => onDelete(row) }, { icon: () => h(NIcon, null, { default: () => h(DeleteIcon) }) }),
          ]
        });
      }
    }
  ];
};


const fetchProfiles = async () => {
  const authStore = useAuthStore();
  if (!authStore.isAuthenticated) return;
  loading.value = true;
  try {
    const response = await api.get<ApiResponse<Profile[]>>('/profiles');
    if (response.data.success) {
      profiles.value = response.data.data || [];
    } else {
      message.error(response.data.message || '获取配置列表失败');
    }
  } catch (err: any) {
    if (!axios.isCancel(err)) message.error(err.message || '请求失败');
  } finally {
    loading.value = false;
  }
};



const handleDelete = (row: Profile) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除配置 "${row.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await api.delete<ApiResponse>(`/profiles/${row.id}`);
        if (response.data.success) {
          message.success('配置删除成功');
          fetchProfiles();
        } else {
          message.error(response.data.message || '删除失败');
        }
      } catch (err: any) {
        if (!axios.isCancel(err)) message.error(err.message || '请求失败');
      }
    },
  });
};

const handleCopyLink = (row: Profile) => {
  if (!subToken.value || !row.alias) {
    message.error('无法复制链接：缺少订阅令牌或链接别名。');
    return;
  }
  const url = `${window.location.origin}/api/public/${subToken.value}/${row.alias}`;
  navigator.clipboard.writeText(url).then(() => message.success('链接已复制'), () => message.error('复制失败'));
};

const onPreview = async (row: Profile) => {
  currentProfileForPreview.value = row;
  nodesPreviewData.value = null;
  loadingNodesPreview.value = true;
  showNodesPreviewModal.value = true;
  try {
    const response = await api.get<ApiResponse<typeof nodesPreviewData.value>>(`/profiles/${row.id}/preview-nodes`);
    if (response.data.success) {
      if (response.data.data) {
        nodesPreviewData.value = response.data.data;
      }
    } else {
      message.error(response.data.message || '加载预览失败');
      showNodesPreviewModal.value = false;
    }
  } catch (err: any) {
    if (!axios.isCancel(err)) {
      message.error(err.message || '请求预览失败');
      showNodesPreviewModal.value = false;
    }
  } finally {
    loadingNodesPreview.value = false;
  }
};

const onLogs = (row: Profile) => {
  currentProfileForLogs.value = row;
  showSubLogsModal.value = true;
};

const columns = createColumns({
  onCopy: handleCopyLink,
  onPreview,
  onLogs,
  onEdit: (row) => router.push({ name: 'edit-profile', params: { id: row.id } }),
  onDelete: handleDelete
});

// 头部操作按钮
const headerActions = computed(() => [
  {
    key: 'new-profile',
    label: '新增配置',
    icon: 'Plus',
    type: 'primary' as const,
    onClick: () => router.push({ name: 'new-profile' })
  }
]);

// 移动端下拉菜单选项
const mobileDropdownOptions = [
  { label: '复制链接', key: 'copy', icon: () => h(NIcon, null, { default: () => h(CopyIcon) }) },
  { label: '预览', key: 'preview', icon: () => h(NIcon, null, { default: () => h(PreviewIcon) }) },
  { label: '日志', key: 'logs', icon: () => h(NIcon, null, { default: () => h(LogIcon) }) },
  { label: '编辑', key: 'edit', icon: () => h(NIcon, null, { default: () => h(EditIcon) }) },
  { label: '删除', key: 'delete', icon: () => h(NIcon, null, { default: () => h(DeleteIcon) }), type: 'error' as const }
];

// 处理移动端操作
const handleMobileAction = (key: string, profile: Profile) => {
  switch (key) {
    case 'copy':
      handleCopyLink(profile);
      break;
    case 'preview':
      onPreview(profile);
      break;
    case 'logs':
      onLogs(profile);
      break;
    case 'edit':
      router.push({ name: 'edit-profile', params: { id: profile.id } });
      break;
    case 'delete':
      handleDelete(profile);
      break;
  }
};

onMounted(() => {
  fetchProfiles();
});

</script>

<style scoped>
/* ===== 配置管理页面全屏宽度优化 ===== */

/* 全屏宽度覆盖 */
:deep(.modern-page-content) {
  max-width: 100% !important;
  width: 100% !important;
  padding: var(--spacing-lg) !important;
}

:deep(.modern-page-main) {
  max-width: 100% !important;
  width: 100% !important;
}

/* ModernContentCard 全屏宽度 */
:deep(.modern-content-card) {
  max-width: none;
  width: 100%;
}

/* ===== 配置管理页面专用样式 ===== */

/* 数据表格样式 */
.modern-data-table {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

:deep(.modern-data-table .n-data-table) {
  border: none;
}

:deep(.modern-data-table .n-data-table-th) {
  background: var(--bg-secondary);
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 2px solid var(--border-primary);
}

:deep(.modern-data-table .n-data-table-td) {
  border-bottom: 1px solid var(--border-secondary);
}

:deep(.modern-data-table .n-data-table-tr:hover .n-data-table-td) {
  background: rgba(102, 126, 234, 0.05);
}

/* 移动端列表样式 */
.modern-mobile-list {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
  background: var(--bg-primary);
}

.modern-list-item {
  border-bottom: 1px solid var(--border-secondary);
  transition: all var(--transition-normal) var(--ease-out-cubic);
  padding: var(--spacing-lg);
}

.modern-list-item:hover {
  background: rgba(102, 126, 234, 0.02);
}

.modern-list-item:last-child {
  border-bottom: none;
}

.modern-thing {
  width: 100%;
}

:deep(.modern-thing .n-thing-title) {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1.125rem;
}

:deep(.modern-thing .n-thing-description) {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
}

.mobile-action-button {
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast) var(--ease-out-cubic);
}

.mobile-action-button:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

/* 模态框样式 */
.modern-modal {
  border-radius: var(--radius-xl);
}

:deep(.modern-modal .n-card) {
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-primary);
  box-shadow: var(--shadow-xl);
}

:deep(.modern-modal .n-card-header) {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-secondary);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
}

/* 预览内容样式 */
.preview-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* 紧凑型统计信息 */
.compact-stats {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) 0;
  flex-wrap: wrap;
}

.compact-stats .stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 0;
  background: none;
  border: none;
}

.compact-stats .stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary-600);
  margin: 0;
}

.compact-stats .stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
  margin: 0;
}

.stat-separator {
  color: var(--border-primary);
  font-weight: 300;
  font-size: 1.2rem;
  margin: 0 var(--spacing-xs);
}

.inline-tags {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-wrap: wrap;
}

.inline-tag {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.more-tag {
  background: var(--bg-secondary) !important;
  color: var(--text-tertiary) !important;
  border: 1px solid var(--border-primary);
}

/* 响应式优化 */
@media (max-width: 768px) {
  .compact-stats {
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) 0;
  }

  .compact-stats .stat-value {
    font-size: 1.125rem;
  }

  .compact-stats .stat-label {
    font-size: 0.8125rem;
  }

  .stat-separator {
    font-size: 1rem;
    margin: 0 var(--spacing-xs);
  }

  .inline-tag {
    font-size: 0.7rem;
    padding: 1px 6px;
  }

  .inline-tags {
    gap: 2px;
  }
}

/* 日志步骤样式 */
.log-steps {
  padding: var(--spacing-md);
}

.log-step {
  margin-bottom: var(--spacing-lg);
}

:deep(.log-step .n-step) {
  padding: var(--spacing-md);
}

:deep(.log-step .n-step-content__title) {
  font-weight: 600;
  color: var(--text-primary);
}

.log-time {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  margin-top: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.log-data {
  margin-top: var(--spacing-md);
}

:deep(.log-data .n-code) {
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3xl);
  text-align: center;
}

:deep(.empty-state .n-empty) {
  color: var(--text-secondary);
}

:deep(.empty-state .n-empty-description) {
  font-size: 1rem;
  margin-top: var(--spacing-md);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modern-list-item {
    padding: var(--spacing-md);
  }

  :deep(.modern-thing .n-thing-title) {
    font-size: 1rem;
  }

  .stat-item {
    padding: var(--spacing-md);
  }

  .stat-item.stat-primary {
    padding: var(--spacing-lg);
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-item.stat-primary .stat-value {
    font-size: 1.75rem;
  }

  .stat-label {
    font-size: 0.8125rem;
  }

  .log-step {
    margin-bottom: var(--spacing-md);
  }

  .stat-tags {
    max-height: 60px;
  }
}

@media (max-width: 480px) {
  .modern-list-item {
    padding: var(--spacing-sm);
  }

  .stat-item {
    padding: var(--spacing-sm);
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }
}

/* 深色主题 */
.dark .modern-mobile-list {
  background: var(--bg-primary);
  border-color: var(--border-primary);
}

.dark .modern-list-item {
  border-color: var(--border-secondary);
}

.dark .modern-list-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.dark .stat-item {
  background: rgba(24, 24, 28, 0.6);
  border-color: var(--border-primary);
}

.dark .stat-item:hover {
  background: rgba(24, 24, 28, 0.8);
}

.dark .mobile-action-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 加载状态 */
:deep(.n-spin) {
  color: var(--primary-500);
}

:deep(.n-spin-description) {
  color: var(--text-secondary);
}

/* 标签样式增强 */
:deep(.n-tag) {
  border-radius: var(--radius-full);
  font-weight: 500;
  transition: all var(--transition-fast) var(--ease-out-cubic);
}

:deep(.n-tag:hover) {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

/* 按钮样式统一 */
:deep(.n-button) {
  transition: all var(--transition-normal) var(--ease-out-cubic);
}

:deep(.n-button:hover) {
  transform: translateY(-1px);
}

:deep(.n-button--primary-type) {
  background: var(--gradient-primary);
  border: none;
}

:deep(.n-button--primary-type:hover) {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

:deep(.n-button--error-type) {
  background: var(--gradient-error);
  border: none;
}

:deep(.n-button--error-type:hover) {
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}
</style>

<template>
  <ModernPageLayout
    title="配置管理"
    subtitle="管理和监控您的代理配置文件"
    :breadcrumb="[
      { label: 'SuperSub', href: '#' },
      { label: '配置管理', active: true }
    ]"
    :actions="headerActions"
    max-width="100%"
    padding="0"
  >
    <!-- 主内容区域 -->
    <ModernContentCard
      title="配置文件列表"
      subtitle="管理所有代理配置文件和订阅链接"
      variant="elevated"
      padding="lg"
      :show-top-line="true"
    >
      <!-- 桌面端数据表格 -->
      <n-data-table
        v-if="!isMobile"
        :columns="columns"
        :data="profiles"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        :bordered="false"
        class="modern-data-table"
      />

      <!-- 移动端列表 -->
      <n-list v-else bordered class="modern-mobile-list">
        <n-list-item
          v-for="profile in profiles"
          :key="profile.id"
          class="modern-list-item"
        >
          <n-thing
            :title="profile.name"
            :description="profile.alias ? `别名: ${profile.alias}` : '未设置链接别名'"
            class="modern-thing"
          >
            <template #footer>
              <n-space size="small">
                <n-tag
                  v-if="profile.alias"
                  type="info"
                  size="small"
                  round
                >
                  有订阅链接
                </n-tag>
                <n-tag
                  v-else
                  type="warning"
                  size="small"
                  round
                >
                  无订阅链接
                </n-tag>
              </n-space>
            </template>
          </n-thing>

          <template #suffix>
            <n-dropdown
              trigger="click"
              :options="mobileDropdownOptions"
              @select="(key) => handleMobileAction(key, profile)"
            >
              <n-button text class="mobile-action-button">
                <n-icon :component="MoreIcon" size="20" />
              </n-button>
            </n-dropdown>
          </template>
        </n-list-item>
      </n-list>
    </ModernContentCard>

    <!-- 节点预览模态框 -->
    <n-modal
      v-model:show="showNodesPreviewModal"
      preset="card"
      :title="`节点预览 - ${currentProfileForPreview?.name}`"
      :style="{ width: isMobile ? '95vw' : '1200px' }"
      :mask-closable="true"
      :trap-focus="false"
      class="modern-modal"
    >
      <n-spin :show="loadingNodesPreview">
        <div v-if="nodesPreviewData" class="preview-content">
          <!-- 订阅分析统计 -->
          <ModernContentCard
            title="订阅分析"
            subtitle="节点分布和统计信息"
            variant="outlined"
            padding="lg"
            class="mb-6"
            :header-actions="[
              {
                key: 'god-view',
                icon: LogIcon,
                type: 'primary',
                onClick: () => {
                  currentProfileForLogs = currentProfileForPreview;
                  showSubLogsModal = true;
                }
              },
              {
                key: 'process-logs',
                icon: ListIcon,
                type: 'info',
                onClick: () => showLogsModal = true,
                label: nodesPreviewData?.logs && nodesPreviewData.logs.length > 0
                  ? `处理日志 (${nodesPreviewData.logs.length})`
                  : '处理日志'
              }
            ]"
          >

          <!-- 紧凑型统计信息 -->
          <div class="compact-stats">
            <div class="stat-item">
              <span class="stat-value">{{ nodesPreviewData.analysis.total }}</span>
              <span class="stat-label">节点</span>
            </div>
            <div class="stat-separator">|</div>
            <div class="stat-item">
              <span class="stat-label">协议:</span>
              <div class="inline-tags">
                <span
                  v-for="(count, protocol) in nodesPreviewData.analysis.protocols"
                  :key="protocol || 'unknown'"
                  class="inline-tag"
                  :style="{ backgroundColor: (getNaiveTagColor(protocol, 'protocol')?.color || '#7f8c8d') + '20', color: getNaiveTagColor(protocol, 'protocol')?.color || '#7f8c8d' }"
                >
                  {{ (protocol || 'Unknown').toUpperCase() }} {{ count }}
                </span>
              </div>
            </div>
            <div class="stat-separator">|</div>
            <div class="stat-item">
              <span class="stat-label">地区:</span>
              <div class="inline-tags">
                <span
                  v-for="([regionName, count], index) in Object.entries(nodesPreviewData.analysis.regions).slice(0, 5)"
                  :key="regionName || 'unknown'"
                  class="inline-tag"
                  :style="{ backgroundColor: (getNaiveTagColor(regionName, 'region')?.color || '#7f8c8d') + '20', color: getNaiveTagColor(regionName, 'region')?.color || '#7f8c8d' }"
                >
                  {{ (regionName || 'Unknown') }} {{ count }}
                </span>
                <span
                  v-if="Object.keys(nodesPreviewData.analysis.regions).length > 5"
                  class="inline-tag more-tag"
                >
                  +{{ Object.keys(nodesPreviewData.analysis.regions).length - 5 }}
                </span>
              </div>
            </div>
          </div>
          </ModernContentCard>

          <!-- 节点数据表格 -->
          <ModernContentCard
            title="节点列表"
            subtitle="详细的节点信息"
            variant="elevated"
            padding="lg"
          >
            <n-data-table
              :columns="previewNodeColumns"
              :data="nodes"
              :pagination="{ pageSize: 10 }"
              :max-height="400"
              class="modern-data-table"
            />
          </ModernContentCard>
        </div>
        <div v-else-if="!loadingNodesPreview" class="empty-state">
          <n-empty description="没有获取到节点数据" />
        </div>
      </n-spin>
    </n-modal>

    <!-- 日志模态框 -->
    <n-modal
      v-model:show="showLogsModal"
      preset="card"
      title="处理日志"
      :style="{ width: isMobile ? '95vw' : '900px', maxHeight: '80vh' }"
      :mask-closable="true"
      :trap-focus="false"
      class="modern-modal"
    >
      <n-scrollbar style="max-height: 70vh; padding-right: 16px;">
        <!-- 调试信息 -->
        <div style="padding: var(--spacing-md); background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: var(--spacing-md); font-size: 0.875rem;">
          <div><strong>调试信息:</strong></div>
          <div>nodesPreviewData 存在: {{ !!nodesPreviewData }}</div>
          <div>logs 存在: {{ !!(nodesPreviewData?.logs) }}</div>
          <div>logs 长度: {{ nodesPreviewData?.logs?.length || 0 }}</div>
          <div v-if="nodesPreviewData?.logs && nodesPreviewData.logs.length > 0">
            <div>第一条日志: {{ JSON.stringify(nodesPreviewData.logs[0]) }}</div>
          </div>
        </div>

        <template v-if="nodesPreviewData?.logs && nodesPreviewData.logs.length > 0">
          <n-steps vertical class="log-steps">
            <template v-for="log in nodesPreviewData.logs" :key="log.timestamp">
              <n-step
                :title="log.message"
                :status="getStepStatus(log.level)"
                class="log-step"
              >
                <p class="log-time">{{ new Date(log.timestamp).toLocaleString() }}</p>
                <div v-if="log.data" class="log-data">
                  <n-card size="small" :bordered="true">
                    <n-code
                      :code="JSON.stringify(log.data, null, 2)"
                      language="json"
                      word-wrap
                    />
                  </n-card>
                </div>
              </n-step>
            </template>
          </n-steps>
        </template>
        <div v-else class="empty-state">
          <n-empty description="暂无处理日志" />
        </div>
      </n-scrollbar>
    </n-modal>

    <!-- 订阅日志模态框 -->
    <SubscriptionLogModal
      v-model:show="showSubLogsModal"
      :profile-id="currentProfileForLogs?.id || null"
      :profile-name="currentProfileForLogs?.name || null"
    />
  </ModernPageLayout>
</template>