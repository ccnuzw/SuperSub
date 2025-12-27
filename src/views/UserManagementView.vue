<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">用户管理</h1>

    <SystemSettingsCard
      :allow-registration="allowRegistration"
      :loading="settingsLoading"
      @update:allowRegistration="handleSettingsChange"
    />

    <UserTable
      v-if="!isMobile"
      :users="users"
      :loading="loading"
      @update-role="handleUpdateRole"
      @delete="handleDeleteUser"
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
              if (key === 'update-role') handleUpdateRole(user);
              if (key === 'delete') handleDeleteUser(user);
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
import { onMounted } from 'vue';
import { NList, NListItem, NThing, NDropdown, NButton, NIcon } from 'naive-ui';
import { useIsMobile } from '@/composables/useMediaQuery';
import { EllipsisVertical as MoreIcon } from '@vicons/ionicons5';
import UserTable from '@/components/admin/UserTable.vue';
import SystemSettingsCard from '@/components/admin/SystemSettingsCard.vue';
import { useUsers } from '@/composables/admin/useUsers';

const isMobile = useIsMobile();
const {
    users,
    loading,
    settingsLoading,
    allowRegistration,
    fetchUsers,
    fetchSettings,
    handleSettingsChange,
    handleUpdateRole,
    handleDeleteUser
} = useUsers();

onMounted(() => {
  fetchUsers();
  fetchSettings();
});
</script>