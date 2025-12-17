<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">用户管理</h1>

    <n-card title="系统设置" class="mb-6">
      <n-flex align="center">
        <label for="allow-registration-switch">允许新用户注册</label>
        <n-switch
          id="allow-registration-switch"
          v-model:value="allowRegistration"
          :loading="settingsLoading"
          @update:value="handleSettingsChange"
        />
      </n-flex>
    </n-card>

    <n-data-table
      v-if="!isMobile"
      :columns="columns"
      :data="users"
      :loading="loading"
      :pagination="pagination"
    />

    <n-list v-else bordered class="mt-4">
      <n-list-item v-for="user in users" :key="user.id">
        <n-thing :title="user.username" :description="`角色: ${user.role}`" />
        <template #suffix>
          <n-dropdown
            trigger="click"
            :options="[
              { label: user.role === 'admin' ? '降为普通用户' : '提升为管理员', key: 'update-role' },
              { label: '删除', key: 'delete' },
            ]"
            @select="key => {
              if (key === 'update-role') onUpdateRole(user);
              if (key === 'delete') onDeleteUser(user);
            }"
          >
            <n-button text>
              <n-icon :component="MoreIcon" size="24" />
            </n-button>
          </n-dropdown>
        </template>
      </n-list-item>
    </n-list>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { NDataTable, NButton, useMessage, useDialog, NCard, NSwitch, NFlex, NList, NListItem, NThing, NDropdown, NIcon } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { useIsMobile } from '@/composables/useMediaQuery';
import { EllipsisVertical as MoreIcon } from '@vicons/ionicons5';
import httpClient from '@/services/http/HttpClient';
import type { User } from '@/types';
import { useAuthStore } from '@/stores/auth';

const message = useMessage();
const dialog = useDialog();
const isMobile = useIsMobile();

const loading = ref(true);
const users = ref<User[]>([]);
const settingsLoading = ref(true);
const allowRegistration = ref(false);

const fetchSettings = async () => {
  const authStore = useAuthStore();
  if (!authStore.isAuthenticated) return;
  settingsLoading.value = true;
  try {
    const response = await httpClient.get('/admin/system-settings');
    if (response.success && response.data) {
      allowRegistration.value = (response.data as { allow_registration: string }).allow_registration === 'true';
    } else {
      message.error(response.message || '获取系统设置失败');
    }
  } catch (error: any) {
    message.error(`请求失败: ${error.message}`);
  } finally {
    settingsLoading.value = false;
  }
};

const handleSettingsChange = async (value: boolean) => {
  settingsLoading.value = true;
  try {
    const response = await httpClient.post('/admin/system-settings', {
      allow_registration: String(value),
    });
    if (response.success) {
      message.success('设置更新成功');
      allowRegistration.value = value;
    } else {
      message.error(response.message || '更新设置失败');
      // Revert the switch on failure
      allowRegistration.value = !value;
    }
  } catch (error: any) {
    message.error(`请求失败: ${error.message}`);
    allowRegistration.value = !value;
  } finally {
    settingsLoading.value = false;
  }
};

const handleUpdateRole = (user: User) => {
  const newRole = user.role === 'admin' ? 'user' : 'admin';
  dialog.warning({
    title: '确认更改角色',
    content: `确定要将用户 "${user.username}" 的角色更改为 "${newRole}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await httpClient.put(`/admin/users/${user.id}`, { role: newRole });
        if (response.success) {
          message.success('用户角色更新成功');
          await fetchUsers();
        } else {
          message.error(response.message || '更新失败');
        }
      } catch (error: any) {
        message.error(`请求失败: ${error.message}`);
      }
    }
  });
};

const handleDeleteUser = (user: User) => {
  dialog.error({
    title: '确认删除用户',
    content: `确定要永久删除用户 "${user.username}" 吗？此操作不可撤销。`,
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await httpClient.delete(`/admin/users/${user.id}`);
        if (response.success) {
          message.success('用户删除成功');
          await fetchUsers();
        } else {
          message.error(response.message || '删除失败');
        }
      } catch (error: any) {
        message.error(`请求失败: ${error.message}`);
      }
    }
  });
};

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

const fetchUsers = async () => {
  const authStore = useAuthStore();
  if (!authStore.isAuthenticated) return;
  loading.value = true;
  try {
    const response = await httpClient.get('/admin/users');
    if (response.success) {
      users.value = response.data as User[];
    } else {
      message.error(response.message || '获取用户列表失败');
    }
  } catch (error: any) {
    message.error(`请求失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

const columns = createColumns({ onUpdateRole: handleUpdateRole, onDeleteUser: handleDeleteUser });
const onUpdateRole = handleUpdateRole;
const onDeleteUser = handleDeleteUser;
const pagination = { pageSize: 10 };

onMounted(() => {
  fetchUsers();
  fetchSettings();
});
</script>