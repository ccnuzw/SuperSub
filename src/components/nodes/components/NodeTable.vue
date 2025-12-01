<template>
  <div class="node-table">
    <!-- 排序模式工具栏 -->
    <div v-if="isSorting" class="sorting-toolbar">
      <n-space justify="space-between">
        <n-text>
          <n-icon><ReorderFourOutline as DragHandleIcon /></n-icon>
          拖动节点调整顺序
        </n-text>
        <n-space>
          <n-button
            v-if="orderChanged"
            type="primary"
            :loading="saveOrderLoading"
            @click="$emit('saveOrder')"
          >
            保存排序
          </n-button>
          <n-button @click="$emit('cancelSorting')">
            取消
          </n-button>
        </n-space>
      </n-space>
    </div>

    <!-- 数据表格 -->
    <n-data-table
      :columns="columns"
      :data="tableData"
      :loading="loading"
      :pagination="paginationConfig"
      :row-key="(row: any) => row.id"
      :checked-row-keys="checkedRowKeys"
      :scroll-x="1200"
      flex-height
      style="height: 600px"
      @update:checked-row-keys="handleCheck"
      @update:sorter="handleSorterChange"
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
    />

    <!-- 表格底部操作栏 -->
    <div v-if="checkedRowKeys.length > 0" class="table-footer">
      <n-space justify="space-between">
        <n-text>
          已选择 {{ checkedRowKeys.length }} 个节点
        </n-text>
        <n-space>
          <n-button @click="$emit('batchTestSelected')">
            批量测试
          </n-button>
          <n-button @click="$emit('batchDeleteSelected')">
            批量删除
          </n-button>
          <n-button @click="$emit('batchMoveToGroup')">
            移动到分组
          </n-button>
        </n-space>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { NTag, NButton, NIcon, NDropdown, NSpace } from 'naive-ui';
import {
  FlashOutline as FlashIcon,
  EllipsisVertical as MoreIcon,
  ReorderFourOutline as DragHandleIcon,
} from '@vicons/ionicons5';
import { useNodeHealth } from '@/composables/useNodeHealth';
import type { DataTableColumns } from 'naive-ui';
import type { Node } from '@/types/entities';
import type { FilterConfig } from '@/composables/useNodeFilters';

// Props
interface Props {
  nodes: Node[];
  loading: boolean;
  checkedRowKeys: string[];
  isSorting: boolean;
  orderChanged: boolean;
  saveOrderLoading: boolean;
  filterConfig: FilterConfig;
  pageCount?: number;
  pageSize?: number;
  currentPage?: number;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:checkedRowKeys': [keys: string[]];
  'editNode': [node: Node];
  'deleteNode': [node: Node];
  'testNode': [node: Node];
  'batchTestSelected': [];
  'batchDeleteSelected': [];
  'batchMoveToGroup': [];
  'toggleSorting': [];
  'saveOrder': [];
  'cancelSorting': [];
  'sortChange': [sortKey: string];
  'pageChange': [page: number];
  'pageSizeChange': [pageSize: number];
}>();

// Composables
const { getNodeHealthStatus, getLatencyText, getStatusIcon, getStatusTagType } = useNodeHealth();

// 表格数据（分页处理）
const tableData = computed(() => {
  const allData = props.nodes.map((node, index) => ({
    ...node,
    index: index + 1,
    health: getNodeHealthStatus(node),
  }));

  const page = props.currentPage || 1;
  const pageSize = props.pageSize || 20;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return allData.slice(startIndex, endIndex);
});

// 分页配置
const paginationConfig = computed(() => ({
  page: props.currentPage || 1,
  pageSize: props.pageSize || 20,
  pageCount: Math.ceil((props.pageCount || tableData.value.length) / (props.pageSize || 20)),
  itemCount: props.pageCount || tableData.value.length,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  showQuickJumper: true,
  prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount} 条`,
}));

// 表格列定义
const columns = computed<DataTableColumns>(() => [
  {
    type: 'selection',
    fixed: 'left',
  },
  {
    title: '#',
    key: 'index',
    width: 60,
    fixed: 'left',
  },
  {
    title: '节点名称',
    key: 'name',
    width: 200,
    fixed: 'left',
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: '协议',
    key: 'protocol',
    width: 100,
    render: (row: any) => {
      const protocolMap: Record<string, { label: string; color: string }> = {
        vmess: { label: 'VMess', color: '#1890ff' },
        vless: { label: 'VLESS', color: '#52c41a' },
        trojan: { label: 'Trojan', color: '#faad14' },
        ss: { label: 'SS', color: '#722ed1' },
        ssr: { label: 'SSR', color: '#eb2f96' },
        hysteria2: { label: 'Hysteria2', color: '#13c2c2' },
        tuic: { label: 'TUIC', color: '#fa8c16' },
        anytls: { label: 'AnyTLS', color: '#f5222d' },
      };

      const config = protocolMap[row.protocol] || { label: row.protocol, color: '#d9d9d9' };
      return h(NTag, { color: { color: config.color } }, () => config.label);
    },
  },
  {
    title: '服务器',
    key: 'server',
    width: 150,
    ellipsis: {
      tooltip: true,
    },
  },
  {
    title: '端口',
    key: 'port',
    width: 80,
  },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render: (row: any) => {
      const health = row.health;
      return h(NTag, {
        type: getStatusTagType(health.status),
      }, () => getStatusIcon(health.status) + ' ' + getStatusText(health.status));
    },
  },
  {
    title: '延迟',
    key: 'latency',
    width: 100,
    render: (row: any) => {
      const health = row.health;
      const latency = getLatencyText(health.latency);
      const color = health.latency === 0 ? '#ff4d4f' :
                   health.latency && health.latency < 100 ? '#52c41a' :
                   health.latency && health.latency < 300 ? '#1890ff' : '#faad14';

      return h('span', { style: { color } }, latency);
    },
    sorter: true,
  },
  {
    title: '创建时间',
    key: 'created_at',
    width: 150,
    render: (row: any) => {
      return new Date(row.created_at).toLocaleDateString();
    },
    sorter: true,
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    fixed: 'right',
    render: (row: any) => {
      return h(NSpace, null, {
        default: () => [
          h(NButton, {
            size: 'small',
            onClick: () => emit('testNode', row),
          }, { default: () => '测试' }),
          h(NButton, {
            size: 'small',
            type: 'primary',
            onClick: () => emit('editNode', row),
          }, { default: () => '编辑' }),
          h(NDropdown, {
            options: [
              { label: '删除', key: 'delete' },
              { label: '复制链接', key: 'copy' },
            ],
            onSelect: (key: string) => handleRowAction(key, row),
          }, {
            default: () => h(NButton, {
              size: 'small',
            }, {
              default: () => [
                h(NIcon, null, { default: () => h(MoreIcon) }),
              ],
            }),
          }),
        ],
      });
    },
  },
]);

// 方法
const handleCheck = (keys: string[]) => {
  emit('update:checkedRowKeys', keys);
};

const handleSorterChange = (sorter: any) => {
  if (sorter) {
    emit('sortChange', sorter.columnKey);
  }
};

const handleRowAction = (key: string, row: any) => {
  switch (key) {
    case 'delete':
      emit('deleteNode', row);
      break;
    case 'copy':
      if (row.link) {
        navigator.clipboard.writeText(row.link);
      }
      break;
  }
};

const handlePageChange = (page: number) => {
  emit('pageChange', page);
};

const handlePageSizeChange = (pageSize: number) => {
  emit('pageSizeChange', pageSize);
};

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    online: '在线',
    offline: '离线',
    error: '错误',
    testing: '测试中',
    pending: '未测试',
  };
  return statusMap[status] || '未知';
};
</script>

<style scoped>
.node-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.sorting-toolbar {
  padding: 12px 16px;
  background-color: #e6f7ff;
  border-bottom: 1px solid #91d5ff;
}

.table-footer {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  background-color: #fafafa;
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .sorting-toolbar {
    background-color: #111d2c;
    border-bottom-color: #153450;
  }

  .table-footer {
    background-color: #101014;
    border-top-color: #303030;
  }
}
</style>