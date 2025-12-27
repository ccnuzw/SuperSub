<script setup lang="ts">
import { h, computed } from 'vue'
import { NDataTable, NButton, NIcon, NTag, NSpin, NSpace } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { FlashOutline as FlashIcon } from '@vicons/ionicons5'
import { Node } from '@/types'
import { useNodeStatusStore } from '@/stores/nodeStatus'
import { getNaiveTagColor } from '@/utils/colors'

const props = defineProps<{
  nodes: Node[]
  loading: boolean
  checkedRowKeys: string[]
}>()

const emit = defineEmits<{
  (e: 'update:checkedRowKeys', keys: string[]): void
  (e: 'test', node: Node): void
  (e: 'edit', node: Node): void
  (e: 'delete', node: Node): void
}>()

const nodeStatusStore = useNodeStatusStore()

const createColumns = (): DataTableColumns<Node> => {
  return [
    {
      type: 'selection',
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      align: 'center',
      render(row) {
        const status = nodeStatusStore.getStatusByNodeId(row.id);
        switch (status?.status) {
          case 'healthy':
            return h(NIcon, { color: '#63e2b7', size: 20 }, { default: () => '●' });
          case 'unhealthy':
            return h(NIcon, { color: '#e88080', size: 20 }, { default: () => '●' });
          case 'testing':
            return h(NSpin, { size: 'small' });
          default:
            return h(NIcon, { color: '#cccccc', size: 20 }, { default: () => '●' });
        }
      }
    },
    { title: '名称', key: 'name', sorter: 'default', ellipsis: { tooltip: true } },
    { title: '服务器', key: 'server', sorter: 'default', ellipsis: { tooltip: true } },
    { title: '端口', key: 'port', sorter: 'default', width: 100 },
    {
      title: '类型',
      key: 'protocol',
      sorter: 'default',
      width: 120,
      render(row) {
        const protocol = row.protocol || row.type || 'N/A';
        return h(NTag, {
            size: 'small',
            round: true,
            color: getNaiveTagColor(protocol, 'protocol')
        }, { default: () => protocol.toUpperCase() });
      }
    },
    {
      title: '延迟',
      key: 'latency',
      width: 100,
      sorter: (a, b) => (a.latency ?? Infinity) - (b.latency ?? Infinity),
      render(row) {
        const status = nodeStatusStore.getStatusByNodeId(row.id);
        const latency = status?.latency;
        if (latency === undefined || latency === null) {
          return h(NTag, { type: 'default', size: 'small', round: true }, { default: () => 'N/A' });
        }
        const type = latency < 200 ? 'success' : latency < 500 ? 'warning' : 'error';
        return h(NTag, { type, size: 'small', round: true }, { default: () => `${latency}ms` });
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render(row) {
        return h(NSpace, null, {
          default: () => [
            h(NButton, { size: 'small', circle: true, tertiary: true, onClick: () => emit('test', row), loading: nodeStatusStore.getStatusByNodeId(row.id)?.status === 'testing' }, { icon: () => h(NIcon, null, { default: () => h(FlashIcon) }) }),
            h(NButton, { size: 'small', onClick: () => emit('edit', row) }, { default: () => '编辑' }),
            h(NButton, { size: 'small', type: 'error', ghost: true, onClick: () => emit('delete', row) }, { default: () => '删除' }),
          ]
        });
      }
    }
  ];
};

const columns = createColumns();

const rowKey = (row: Node) => row.id;

const handleCheck = (keys: Array<string | number>) => {
  emit('update:checkedRowKeys', keys as string[])
}
</script>

<template>
  <n-data-table
    :columns="columns"
    :data="nodes"
    :loading="loading"
    :row-key="rowKey"
    :checked-row-keys="checkedRowKeys"
    @update:checked-row-keys="handleCheck"
    pagination-behavior-on-filter="first"
  />
</template>
