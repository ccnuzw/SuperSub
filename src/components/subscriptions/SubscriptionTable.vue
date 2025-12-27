<script setup lang="ts">
import { h } from 'vue'
import { NDataTable, NButton, NTag, NTooltip, NSpace, NIcon } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { Subscription } from '@/types'
import {
  EyeOutline,
  FilterOutline,
  CreateOutline,
  SyncOutline,
  TrashOutline as TrashIcon,
} from '@vicons/ionicons5'
import { format } from 'date-fns'

const props = defineProps<{
  subscriptions: Subscription[]
  loading: boolean
  updatingIds: Set<string>
  updatingId: string | null
}>()

const emit = defineEmits<{
  (e: 'edit', sub: Subscription): void
  (e: 'update', sub: Subscription): void
  (e: 'delete', sub: Subscription): void
  (e: 'preview', sub: Subscription): void
  (e: 'manage-rules', sub: Subscription): void
  (e: 'update:checked-row-keys', keys: string[]): void
}>()

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const createColumns = (): DataTableColumns<Subscription> => {
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
          if (row.error) return 2;
          if (row.last_updated) return 1;
          return 0;
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
            createTooltipButton('预览节点', EyeOutline, () => emit('preview', row)),
            createTooltipButton('规则', FilterOutline, () => emit('manage-rules', row), { type: 'info' }),
            createTooltipButton('编辑', CreateOutline, () => emit('edit', row)),
            createTooltipButton('更新', SyncOutline, () => emit('update', row), { type: 'primary', loading: props.updatingId === row.id || props.updatingIds.has(row.id) }),
            createTooltipButton('删除', TrashIcon, () => emit('delete', row), { type: 'error' }),
          ]
        })
      }
    }
  ]
}

const columns = createColumns()

</script>

<template>
  <n-data-table
    :columns="columns"
    :data="subscriptions"
    :loading="loading"
    :row-key="row => row.id"
    @update:checked-row-keys="(keys) => emit('update:checked-row-keys', keys as string[])"
    :scroll-x="1200"
    :max-height="600"
    virtual-scroll
  />
</template>
