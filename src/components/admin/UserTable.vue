<script setup lang="ts">
import { h } from 'vue'
import { NDataTable } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { User } from '@/types'
import Button from '@/components/ui/Button.vue'

defineProps<{
    users: User[]
    loading: boolean
}>()

const emit = defineEmits<{
    (e: 'update-role', user: User): void
    (e: 'delete', user: User): void
}>()

const createColumns = ({ onUpdateRole, onDeleteUser }: { onUpdateRole: (user: User) => void, onDeleteUser: (user: User) => void }): DataTableColumns<User> => {
  return [
    { title: 'ID', key: 'id', ellipsis: { tooltip: true }, width: 100 },
    { title: '用户名', key: 'username', className: 'font-medium' },
    { title: '角色', key: 'role' },
    { 
      title: '创建时间', 
      key: 'created_at',
      render: (row) => new Date(row.created_at).toLocaleString()
    },
    { 
      title: '更新时间', 
      key: 'updated_at',
      render: (row) => new Date(row.updated_at).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      render(row) {
        return h('div', { class: 'flex gap-2' }, [
          h(
            Button,
            {
              size: 'sm',
              variant: row.role === 'admin' ? 'secondary' : 'primary',
              onClick: () => onUpdateRole(row)
            },
            { default: () => row.role === 'admin' ? '降级' : '设为管理员' }
          ),
          h(
            Button,
            {
              size: 'sm',
              variant: 'danger',
              onClick: () => onDeleteUser(row)
            },
            { default: () => '删除' }
          )
        ]);
      }
    }
  ];
};

const columns = createColumns({
    onUpdateRole: (user) => emit('update-role', user),
    onDeleteUser: (user) => emit('delete', user)
});
</script>

<template>
  <div class="rounded-xl border border-gray-100 dark:border-dark-border overflow-hidden bg-white dark:bg-dark-surface">
    <n-data-table
        :columns="columns"
        :data="users"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        :bordered="false"
    />
  </div>
</template>
