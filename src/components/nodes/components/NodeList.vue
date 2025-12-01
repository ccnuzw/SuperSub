<template>
  <div class="node-list">
    <!-- 节点卡片列表 -->
    <div class="node-cards">
      <div
        v-for="node in enhancedNodes"
        :key="node.id"
        class="node-card"
        @click="handleCardClick(node)"
      >
        <div class="card-header">
          <div class="node-info">
            <h3 class="node-name">{{ node.name }}</h3>
            <n-tag
              :type="getProtocolTagType(node.protocol)"
              size="small"
            >
              {{ getProtocolLabel(node.protocol) }}
            </n-tag>
          </div>
          <div class="node-status">
            <span class="status-icon">{{ getStatusIcon(node.health as any) }}</span>
            <span class="status-text">{{ getStatusText(node.health as any) }}</span>
          </div>
        </div>

        <div class="card-content">
          <div class="server-info">
            <n-text depth="3">
              {{ node.server }}:{{ node.port }}
            </n-text>
          </div>
          <div v-if="node.health?.latency" class="latency-info">
            <n-tag
              :type="getLatencyTagType(node.health.latency)"
              size="small"
            >
              {{ getLatencyText(node.health.latency) }}
            </n-tag>
          </div>
        </div>

        <div class="card-actions">
          <n-space>
            <n-button
              size="small"
              @click.stop="handleTestNode(node)"
            >
              测试
            </n-button>
            <n-button
              size="small"
              type="primary"
              @click.stop="handleEditNode(node)"
            >
              ��辑
            </n-button>
            <n-dropdown
              :options="getActionOptions()"
              placement="bottom-end"
              @select="(key) => handleAction(key, node)"
            >
              <n-button size="small" @click.stop>
                <template #icon>
                  <n-icon><EllipsisVertical as MoreIcon /></n-icon>
                </template>
              </n-button>
            </n-dropdown>
          </n-space>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <n-spin size="large" />
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && nodes.length === 0" class="empty-container">
      <n-empty description="暂无节点数据" />
    </div>

    <!-- 分页 -->
    <div v-if="totalCount > 0" class="pagination-container">
      <n-pagination
        :page="pagination.page"
        :page-size="pagination.pageSize"
        :item-count="totalCount"
        :page-sizes="[10, 20, 50]"
        show-size-picker
        show-quick-jumper
        @update:page="$emit('pageChange', $event)"
        @update:page-size="$emit('pageSizeChange', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NTag, NButton, NIcon, NDropdown, NSpace } from 'naive-ui';
import { EllipsisVertical as MoreIcon } from '@vicons/ionicons5';
import { useNodeHealth } from '@/composables/useNodeHealth';
import type { Node } from '@/types/entities';
import type { PaginationConfig } from '@/composables/useNodeFilters';

// Props
interface Props {
  nodes: Node[];
  loading: boolean;
  pagination: PaginationConfig;
  totalCount: number;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  editNode: [node: Node];
  deleteNode: [node: Node];
  testNode: [node: Node];
  pageChange: [page: number];
  pageSizeChange: [pageSize: number];
}>();

// Composables
const { getNodeHealthStatus, getLatencyText, getStatusIcon, getStatusTagType } = useNodeHealth();

// 增强节点数据
const enhancedNodes = computed(() => {
  return props.nodes.map(node => ({
    ...node,
    health: getNodeHealthStatus(node),
  }));
});

// 方法
const handleCardClick = (node: any) => {
  // 移动端卡片点击可以展开详情或执行默认操作
  handleTestNode(node);
};

const handleEditNode = (node: Node) => {
  emit('editNode', node);
};

const handleTestNode = (node: Node) => {
  emit('testNode', node);
};

const handleAction = (key: string, node: Node) => {
  switch (key) {
    case 'delete':
      emit('deleteNode', node);
      break;
    case 'copy':
      if (node.link) {
        navigator.clipboard.writeText(node.link);
      }
      break;
    case 'details':
      // 可以显示节点详情
      break;
  }
};

const getActionOptions = () => [
  { label: '删除', key: 'delete' },
  { label: '复制链接', key: 'copy' },
  { label: '查看详情', key: 'details' },
];

const getProtocolLabel = (protocol: string): string => {
  const protocolMap: Record<string, string> = {
    vmess: 'VMess',
    vless: 'VLESS',
    trojan: 'Trojan',
    ss: 'SS',
    ssr: 'SSR',
    hysteria2: 'Hysteria2',
    tuic: 'TUIC',
    anytls: 'AnyTLS',
  };
  return protocolMap[protocol] || protocol;
};

const getProtocolTagType = (protocol: string): 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default' => {
  const tagTypeMap: Record<string, any> = {
    vmess: 'primary',
    vless: 'success',
    trojan: 'warning',
    ss: 'info',
    ssr: 'error',
    hysteria2: 'success',
    tuic: 'warning',
    anytls: 'primary',
  };
  return tagTypeMap[protocol] || 'default';
};

const getStatusText = (health: any): string => {
  const statusMap: Record<string, string> = {
    online: '在线',
    offline: '离线',
    error: '错误',
    testing: '测试中',
    pending: '未测试',
  };
  return statusMap[health?.status] || '未知';
};

const getLatencyTagType = (latency: number): 'success' | 'warning' | 'error' | 'default' => {
  if (latency === 0) return 'error';
  if (latency < 100) return 'success';
  if (latency < 300) return 'default';
  return 'warning';
};
</script>

<style scoped>
.node-list {
  padding: 8px;
}

.node-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.node-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
  transition: all 0.2s ease;
  cursor: pointer;
}

.node-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-status {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.status-icon {
  font-size: 14px;
}

.status-text {
  font-size: 12px;
  font-weight: 500;
}

.card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.server-info {
  flex: 1;
  min-width: 0;
}

.latency-info {
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .node-card {
    padding: 12px;
  }

  .node-name {
    font-size: 14px;
  }

  .card-actions :deep(.n-space) {
    gap: 4px !important;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .node-card {
    background: #18181c;
    border-color: #303030;
    color: #fff;
  }

  .node-name {
    color: #fff;
  }
}

/* 触摸反馈 */
@media (hover: none) {
  .node-card:active {
    transform: scale(0.98);
    background-color: #f5f7fa;
  }
}
</style>