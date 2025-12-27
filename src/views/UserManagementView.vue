<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">用户管理</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">管理系统用户及设置。</p>
      </div>
    </div>

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

    <div v-else class="space-y-4">
      <Card v-for="user in users" :key="user.id" padding="sm" class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
           <div class="font-medium text-slate-900 dark:text-white">{{ user.username }}</div>
           <n-tag :type="user.role === 'admin' ? 'warning' : 'primary'" size="small" round>{{ user.role }}</n-tag>
        </div>
        <div class="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-dark-border">
             <Button 
                size="sm" 
                :variant="user.role === 'admin' ? 'secondary' : 'primary'"
                @click="handleUpdateRole(user)"
             >
                {{ user.role === 'admin' ? '降级' : '提升' }}
             </Button>
            <Button size="sm" variant="danger" icon @click="handleDeleteUser(user)">
              <n-icon :component="TrashIcon" />
            </Button>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { NTag, NIcon } from 'naive-ui';
import { useIsMobile } from '@/composables/useMediaQuery';
import { TrashOutline as TrashIcon } from '@vicons/ionicons5';
import UserTable from '@/components/admin/UserTable.vue';
import SystemSettingsCard from '@/components/admin/SystemSettingsCard.vue';
import { useUsers } from '@/composables/admin/useUsers';
import Card from '@/components/ui/Card.vue';
import Button from '@/components/ui/Button.vue';

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