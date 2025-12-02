<template>
  <div class="nodes-table-section">
    <!-- 数据表格 - 无内置分页 -->
    <n-data-table
      :key="paginationKey"
      :columns="tableColumns"
      :data="nodesData"
      :loading="loading"
      :pagination="false"
      :row-key="(row: any) => row.id"
      :checked-row-keys="selectedRowKeys"
      :scroll-x="1400"
      flex-height
      style="height: 550px"
      @update:checked-row-keys="$emit('selection-change', $event)"
    />

    <!-- 自定义分页 - 在表格下方 -->
    <div class="custom-pagination" v-if="paginationInfo">
      <n-pagination
        :page="currentPage"
        :page-size="pageSize"
        :item-count="paginationInfo.itemCount"
        :page-sizes="paginationInfo.pageSizes"
        show-size-picker
        show-quick-jumper
        @update:page="$emit('page-change', $event)"
        @update:page-size="$emit('page-size-change', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';
import LatencyIndicator from '../../common/LatencyIndicator.vue';
import ProtocolTag from '../../common/ProtocolTag.vue';
import StatusBadge from '../../common/StatusBadge.vue';
import type { Node } from '@/types/entities';
import type { NodeHealthStatus } from '@/types/entities';

interface HealthStatus {
  status: 'online' | 'offline' | 'testing' | 'error' | 'pending';
  latency?: number;
  lastChecked?: string;
}

interface PaginationInfo {
  itemCount: number;
  pageSize: number;
  pageSizes: number[];
}

interface Props {
  nodesData: Node[];
  loading: boolean;
  selectedRowKeys: string[];
  currentPage: number;
  pageSize: number;
  paginationInfo: PaginationInfo | null;
  groups: Array<{ id: string; name: string }>;
  getNodeHealthStatus: (node: Node) => HealthStatus;
  getStatusText: (status: string) => string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'selection-change': [keys: string[]];
  'page-change': [page: number];
  'page-size-change': [pageSize: number];
  'edit-node': [node: Node];
}>();

// 强制响应式更新
const paginationKey = computed(() => {
  return `${props.nodesData?.length || 0}-${props.currentPage}-${props.pageSize}`;
});

// 表格列配置
const tableColumns = computed(() => [
  { type: 'selection', fixed: 'left' as const },
  {
    title: '节点名称',
    key: 'name',
    width: 200,
    fixed: 'left' as const,
    ellipsis: { tooltip: true },
    render: (row: Node) => {
      return h('span', {
        style: `
          color: #1890ff;
          cursor: pointer;
          font-weight: 500;
          transition: color 0.2s ease;
        `,
        onClick: () => emit('edit-node', row),
        onMouseenter: (e: MouseEvent) => {
          const target = e.currentTarget as HTMLElement;
          target.style.color = '#40a9ff';
          target.style.textDecoration = 'underline';
        },
        onMouseleave: (e: MouseEvent) => {
          const target = e.currentTarget as HTMLElement;
          target.style.color = '#1890ff';
          target.style.textDecoration = 'none';
        }
      }, row.name);
    }
  },
  {
    title: '协议',
    key: 'protocol',
    width: 100,
    render: (row: Node) => {
      const protocol = row.protocol?.toLowerCase() || 'unknown';

      if (protocol === 'unknown') {
        return h('span', { style: 'color: #999; font-size: 12px;' }, '未知');
      }

      return h(ProtocolTag, {
        protocol: protocol,
        size: 'small',
        variant: 'colorful',
        showIcon: true,
        round: true,
        colorScheme: 'default',
        uppercase: true
      });
    }
  },
  { title: '服务器', key: 'server', width: 150, ellipsis: { tooltip: true }, render: (row: Node) => row.server || '-' },
  { title: '端口', key: 'port', width: 80, render: (row: Node) => row.port || '-' },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: Node) => {
      const healthStatus = props.getNodeHealthStatus(row);

      // 映射健康状态到StatusBadge的状态
      let badgeStatus: 'online' | 'offline' | 'testing' | 'error' | 'warning' | 'unknown' = 'unknown';

      switch (healthStatus.status) {
        case 'online':
          badgeStatus = 'online';
          break;
        case 'offline':
          badgeStatus = 'offline';
          break;
        case 'testing':
          badgeStatus = 'testing';
          break;
        case 'error':
          badgeStatus = 'error';
          break;
        case 'pending':
          badgeStatus = 'unknown';
          break;
        default:
          badgeStatus = 'unknown';
      }

      return h(StatusBadge, {
        status: badgeStatus,
        size: 'small',
        variant: 'default',
        showIcon: true,
        showIndicator: false,
        bordered: true,
        round: false,
        colorScheme: 'default',
        pulse: healthStatus.status === 'testing',
        glow: false,
        tooltip: `节点状态: ${props.getStatusText(healthStatus.status)}`,
        tooltipDescription: `最后检查: ${healthStatus.lastChecked ? new Date(healthStatus.lastChecked).toLocaleString() : '从未检查'}`,
        tooltipPlacement: 'top'
      });
    }
  },
  {
    title: '延迟',
    key: 'latency',
    width: 100,
    render: (row: Node) => {
      const healthStatus = props.getNodeHealthStatus(row);

      let latency: number | null = null;

      if (healthStatus.status === 'testing') {
        latency = -1; // 使用负数表示测试中
      } else if (healthStatus.status === 'pending' || !healthStatus.latency) {
        latency = null; // 使用null表示未测试
      } else if (healthStatus.latency === 0 || healthStatus.latency === -1) {
        latency = -2; // 使用特殊负数表示超时
      } else {
        latency = healthStatus.latency;
      }

      return h(LatencyIndicator, {
        latency: latency,
        size: 'small',
        showIcon: true,
        showUnit: true,
        colorScheme: 'network',
        thresholds: { good: 100, medium: 300, poor: 500 },
        loadingLabel: '测试中',
        unknownLabel: '未测试'
      });
    }
  },
  {
    title: '分组',
    key: 'group',
    width: 120,
    render: (row: Node) => {
      if (!row.group_id) {
        return h('span', {
          style: 'color: #999; font-size: 12px; padding: 2px 6px; background: #f5f5f5; border-radius: 4px;'
        }, '未分组');
      }

      const group = props.groups.find(g => g.id === row.group_id);
      const groupName = group?.name || '未知分组';

      return h('span', {
        style: `
          color: #1890ff;
          font-size: 12px;
          padding: 2px 6px;
          background: #f0f9ff;
          border: 1px solid #91d5ff;
          border-radius: 4px;
          font-weight: 500;
        `
      }, groupName);
    }
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 150,
    render: (row: Node) => {
      return new Date(row.created_at).toLocaleDateString();
    }
  }
]);
</script>

<style scoped>
/* 表格区域 */
.nodes-table-section {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 自定义分页 */
.custom-pagination {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  display: flex;
  justify-content: center;
}
</style>