<template>
  <div class="page-container">
    <!-- 系统设置卡片 -->
    <n-card title="系统设置" class="mb-6 system-settings-card">
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

    <!-- 用户数据表格 -->
    <div v-if="!isMobile" class="table-section">
      <n-data-table
        :columns="columns"
        :data="users"
        :loading="loading"
        :pagination="pagination"
        class="users-table"
      />
    </div>

    <!-- 移动端用户列表 -->
    <div v-else class="mobile-users-container">
      <n-list bordered class="mt-4 mobile-users-list">
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

    <!-- 添加用户模态框 -->
    <UserFormModal
      v-model:visible="showAddModal"
      @success="handleAddSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, h, computed } from 'vue';
import { NDataTable, NButton, useMessage, useDialog, NCard, NSwitch, NFlex, NList, NListItem, NThing, NDropdown, NIcon } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { useIsMobile } from '@/composables/useMediaQuery';
import { EllipsisVertical as MoreIcon } from '@vicons/ionicons5';
import httpClient from '@/services/http/HttpClient';
import type { User } from '@/types';
import { useAuthStore } from '@/stores/auth';
import UserFormModal from '@/components/users/UserFormModal.vue';

const message = useMessage();
const dialog = useDialog();
const isMobile = useIsMobile();

const loading = ref(true);
const users = ref<User[]>([]);
const settingsLoading = ref(true);
const allowRegistration = ref(false);

// 添加用户模态框状态
const showAddModal = ref(false);

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

// 分页配置 - 与其他页面保持一致
const pagination = {
  page: 1,
  pageSize: 10,
  itemCount: computed(() => users.value.length),
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100, 200],
  showQuickJumper: true
};

// 处理顶部栏事件
const handleHeaderAction = async (event: CustomEvent) => {
  const { type, action } = event.detail;

  if (type === 'primary') {
    switch (action) {
      case 'add-user':
        showAddModal.value = true;
        break;
    }
  } else if (type === 'menu') {
    switch (action) {
      case 'refresh':
        await fetchUsers();
        message.success('数据刷新完成');
        break;
      case 'export':
        handleExportUsers();
        break;
    }
  }
};

// 导出用户功能
const handleExportUsers = () => {
  const usersData = users.value.map(user => ({
    ID: user.id,
    用户名: user.username,
    角色: user.role,
    创建时间: new Date(user.created_at).toLocaleString(),
    更新时间: new Date(user.updated_at).toLocaleString()
  }));

  const csvContent = [
    Object.keys(usersData[0]).join(','),
    ...usersData.map(user => Object.values(user).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `用户列表_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  message.success('用户列表已导出');
};

// 用户添加成功处理
const handleAddSuccess = async () => {
  await fetchUsers();
};

// 生命周期
onMounted(() => {
  fetchUsers();
  fetchSettings();

  // 添加顶部栏事件监听
  window.addEventListener('header-action', handleHeaderAction as EventListener);
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('header-action', handleHeaderAction as EventListener);
});
</script>

<style scoped>
/* 页面容器 - 与节点管理保持一致 */
.page-container {
  @apply flex flex-col;
  background: #ffffff;
  width: 100%;
  max-width: none;
  margin: 0;
  /* 减少垂直间距，紧贴布局 */
  padding-top: 16px;
  padding-bottom: 16px;
  /* 与顶部栏的 px-6 保持一致 */
  padding-left: 24px;
  padding-right: 24px;
  /* 移除 min-h-screen，让容器高度自适应内容 */
  min-height: auto;
  height: auto;
  /* 移除可能导致滚动条的属性 */
  box-sizing: border-box;
}

/* 系统设置卡片 */
.system-settings-card {
  @apply bg-white;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  /* 确保宽度完全自适应 */
  width: 100%;
  box-sizing: border-box;
}

/* 表格区域 */
.table-section {
  background: #ffffff;
  border-radius: 12px;
  overflow: visible;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  /* 让容器高度自适应内容，但保持最小可见高度 */
  height: auto;
  min-height: 120px;
  /* 让容器根据内容自然展开 */
  flex: 0 1 auto;
  /* 添加底部间距 */
  margin-bottom: 12px;
  /* 确保宽度完全自适应 */
  width: 100%;
  box-sizing: border-box;
  /* 确保容器始终显示边框 */
  display: block;
}

/* 用户表格样式 */
.users-table {
  @apply bg-transparent;
}

.users-table :deep(.n-data-table) {
  background: transparent;
  overflow: visible;
}

/* 添加分页器间距 */
.users-table :deep(.n-data-table .n-data-table-pagination) {
  padding-right: 16px;
  padding-bottom: 8px;
  padding-top: 8px;
}

.users-table :deep(.n-data-table-th) {
  background: #f8fafc;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.users-table :deep(.n-data-table-td) {
  border-bottom: 1px solid #f3f4f6;
  padding: 16px;
}

.users-table :deep(.n-data-table-tr:hover .n-data-table-td) {
  background: #f9fafb;
}

/* 移动端用户列表容器 */
.mobile-users-container {
  @apply bg-white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

/* 移动端用户列表 */
.mobile-users-list {
  @apply bg-white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.mobile-users-list :deep(.n-list-item) {
  border-bottom: 1px solid #f3f4f6;
  padding: 16px;
}

.mobile-users-list :deep(.n-list-item:last-child) {
  border-bottom: none;
}

/* 操作按钮样式 - 与节点管理保持一致 */
.users-table :deep(.n-button) {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.users-table :deep(.n-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 响应式设计 - 优化不同屏幕尺寸 */
@media (max-width: 640px) {
  .page-container {
    padding-top: 12px;
    padding-bottom: 12px;
    padding-left: 16px;
    padding-right: 16px;
  }

  .system-settings-card {
    @apply mb-3;
    border-radius: 8px;
  }

  .table-section {
    border-radius: 8px;
    width: 100%;
    box-sizing: border-box;
    /* 移动端调整最小高度 */
    min-height: 100px;
    /* 移动端减少阴影强度 */
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .mobile-users-container {
    border-radius: 8px;
    width: 100%;
    box-sizing: border-box;
  }

  .mobile-users-list {
    border-radius: 8px;
    width: 100%;
    box-sizing: border-box;
  }

  /* 移动端分页器间距 */
  .users-table :deep(.n-data-table .n-data-table-pagination) {
    padding-right: 12px;
    padding-bottom: 6px;
    padding-top: 6px;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .page-container {
    padding-top: 16px;
    padding-bottom: 16px;
    padding-left: 20px;
    padding-right: 20px;
  }

  .system-settings-card {
    @apply mb-4;
  }

  .table-section {
    width: 100%;
    box-sizing: border-box;
    /* 平板端适中最小高度 */
    min-height: 110px;
    border-radius: 10px;
    /* 平板端适中的阴影 */
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.08);
  }

  /* 平板端分页器间距 */
  .users-table :deep(.n-data-table .n-data-table-pagination) {
    padding-right: 20px;
    padding-bottom: 10px;
    padding-top: 10px;
  }
}

@media (min-width: 1025px) and (max-width: 1440px) {
  .page-container {
    padding-top: 20px;
    padding-bottom: 20px;
    width: 100%;
    max-width: none;
    margin: 0;
    padding-left: 24px;
    padding-right: 24px;
  }

  .system-settings-card {
    @apply mb-5;
  }

  .table-section {
    width: 100%;
    box-sizing: border-box;
    /* 桌面端标准最小高度 */
    min-height: 120px;
    border-radius: 11px;
    /* 桌面端标准阴影 */
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.09);
  }

  /* 桌面端分页器间距 */
  .users-table :deep(.n-data-table .n-data-table-pagination) {
    padding-right: 24px;
    padding-bottom: 12px;
    padding-top: 12px;
  }
}

@media (min-width: 1441px) and (max-width: 1920px) {
  .page-container {
    padding-top: 24px;
    padding-bottom: 24px;
    width: 100%;
    max-width: none;
    margin: 0;
    padding-left: 24px;
    padding-right: 24px;
  }

  .system-settings-card {
    @apply mb-6;
  }

  .table-section {
    width: 100%;
    box-sizing: border-box;
    /* 超宽屏增加最小高度 */
    min-height: 130px;
    border-radius: 12px;
    /* 超宽屏增强阴影 */
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  }

  /* 超宽屏分页器间距 */
  .users-table :deep(.n-data-table .n-data-table-pagination) {
    padding-right: 32px;
    padding-bottom: 16px;
    padding-top: 16px;
  }
}

@media (min-width: 1921px) {
  .page-container {
    padding-top: 32px;
    padding-bottom: 32px;
    width: 100%;
    max-width: none;
    margin: 0;
    padding-left: 24px;
    padding-right: 24px;
  }

  .system-settings-card {
    @apply mb-8;
  }

  .table-section {
    width: 100%;
    box-sizing: border-box;
    /* 4K屏更大的最小高度 */
    min-height: 140px;
    border-radius: 12px;
    /* 4K屏最强阴影 */
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.12);
  }

  /* 4K屏分页器间距 */
  .users-table :deep(.n-data-table .n-data-table-pagination) {
    padding-right: 40px;
    padding-bottom: 20px;
    padding-top: 20px;
  }
}

/* 深色模式适配 */
.dark .page-container {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
}

.dark .system-settings-card {
  background: #374151;
  border: 1px solid #4b5563;
}

.dark .table-section {
  background: #374151;
  border: 1px solid #4b5563;
}

.dark .mobile-users-container {
  background: #374151;
  border: 1px solid #4b5563;
}

.dark .mobile-users-list {
  background: #374151;
  border: 1px solid #4b5563;
}

.dark .users-table :deep(.n-data-table-th) {
  background: #4b5563;
  color: #f9fafb;
  border-bottom: 1px solid #6b7280;
}

.dark .users-table :deep(.n-data-table-td) {
  border-bottom: 1px solid #6b7280;
  color: #f3f4f6;
}

.dark .users-table :deep(.n-data-table-tr:hover .n-data-table-td) {
  background: #4b5563;
}

.dark .mobile-users-list :deep(.n-list-item) {
  border-bottom: 1px solid #6b7280;
  color: #f3f4f6;
}

/* 加载动画 */
.page-container {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>