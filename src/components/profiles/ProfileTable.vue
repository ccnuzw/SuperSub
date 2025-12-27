<script setup lang="ts">
import { h, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NSpace, NIcon, NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { Pencil as EditIcon, TrashBinOutline as DeleteIcon, CopyOutline as CopyIcon, EyeOutline as PreviewIcon, DocumentTextOutline as LogIcon } from '@vicons/ionicons5'
import type { Profile } from '@/types'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{
    profiles: Profile[]
    loading: boolean
}>()

const emit = defineEmits<{
    (e: 'copy', row: Profile): void
    (e: 'preview', row: Profile): void
    (e: 'logs', row: Profile): void
    (e: 'edit', row: Profile): void
    (e: 'delete', row: Profile): void
}>()

const router = useRouter()
const authStore = useAuthStore()
const subToken = computed(() => authStore.user?.sub_token || '')

const createColumns = ({ onCopy, onPreview, onLogs, onEdit, onDelete }: {
    onCopy: (row: Profile) => void,
    onPreview: (row: Profile) => void,
    onLogs: (row: Profile) => void,
    onEdit: (row: Profile) => void,
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

const columns = createColumns({
    onCopy: (row) => emit('copy', row),
    onPreview: (row) => emit('preview', row),
    onLogs: (row) => emit('logs', row),
    onEdit: (row) => emit('edit', row),
    onDelete: (row) => emit('delete', row)
});
</script>

<template>
    <n-data-table
        :columns="columns"
        :data="profiles"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        :bordered="false"
    />
</template>
