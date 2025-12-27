<script setup lang="ts">
import { h, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NIcon, NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { Pencil as EditIcon, TrashBinOutline as DeleteIcon, CopyOutline as CopyIcon, EyeOutline as PreviewIcon, DocumentTextOutline as LogIcon } from '@vicons/ionicons5'
import type { Profile } from '@/types'
import { useAuthStore } from '@/stores/auth'
import Button from '@/components/ui/Button.vue'

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
    { title: '名称', key: 'name', sorter: 'default', width: 200, className: 'font-medium' },
    {
      title: '订阅链接',
      key: 'alias',
      render(row) {
        if (!subToken.value || !row.alias) {
          return h('span', { class: 'text-slate-400 italic' }, '未设置别名');
        }
        const url = `${window.location.origin}/api/public/${subToken.value}/${row.alias}`;
        return h('a', { 
            href: url, 
            target: '_blank',
            class: 'text-primary-600 hover:text-primary-700 hover:underline'
        }, url);
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      render(row) {
        return h('div', { class: 'flex gap-1' }, [
            h(Button, { size: 'sm', variant: 'secondary', icon: true, onClick: () => onCopy(row), title: '复制链接' }, { default: () => h(NIcon, { component: CopyIcon }) }),
            h(Button, { size: 'sm', variant: 'secondary', icon: true, onClick: () => onPreview(row), title: '预览' }, { default: () => h(NIcon, { component: PreviewIcon }) }),
            h(Button, { size: 'sm', variant: 'secondary', icon: true, onClick: () => onLogs(row), title: '访问日志' }, { default: () => h(NIcon, { component: LogIcon }) }),
            h(Button, { size: 'sm', variant: 'primary', icon: true, onClick: () => onEdit(row), title: '编辑' }, { default: () => h(NIcon, { component: EditIcon }) }),
            h(Button, { size: 'sm', variant: 'danger', icon: true, onClick: () => onDelete(row), title: '删除' }, { default: () => h(NIcon, { component: DeleteIcon }) }),
        ]);
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
  <div class="rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden bg-white dark:bg-dark-surface">
    <n-data-table
        :columns="columns"
        :data="profiles"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        :bordered="false"
    />
  </div>
</template>
