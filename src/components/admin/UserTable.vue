<script setup lang="ts">
import { h } from 'vue'
import { NButton, NDataTable, NIcon } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { User } from '@/types'

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
    { title: 'ID', key: 'id', ellipsis: { tooltip: true } },
    { title: '用户名', key: 'username' },
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
        return h('div', { class: 'space-x-2' }, [
          h(
            NButton,
            {
              size: 'small',
              type: row.role === 'admin' ? 'warning' : 'primary',
              onClick: () => onUpdateRole(row)
            },
            { default: () => row.role === 'admin' ? '降为普通用户' : '提升为管理员' }
          ),
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
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
    <n-data-table
        :columns="columns"
        :data="users"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
    />
</template>
