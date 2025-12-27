<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { NIcon, NDropdown } from 'naive-ui';
import { EllipsisVertical as MoreIcon, AddOutline as AddIcon, CopyOutline as CopyIcon, EyeOutline as PreviewIcon, DocumentTextOutline as LogIcon, Pencil as EditIcon, TrashBinOutline as DeleteIcon } from '@vicons/ionicons5';
import { useIsMobile } from '@/composables/useMediaQuery';
import type { Profile } from '@/types';
import SubscriptionLogModal from '@/components/SubscriptionLogModal.vue';
import ProfileTable from '@/components/profiles/ProfileTable.vue';
import ProfileNodesPreviewModal from '@/components/profiles/modals/ProfileNodesPreviewModal.vue';
import ProfileDebugLogModal from '@/components/profiles/modals/ProfileDebugLogModal.vue';
import { useProfiles } from '@/composables/profiles/useProfiles';
import { useProfilePreview } from '@/composables/profiles/useProfilePreview';
import Button from '@/components/ui/Button.vue';
import Card from '@/components/ui/Card.vue';

const router = useRouter();

const isMobile = useIsMobile();
const {
    profiles,
    loading,
    fetchProfiles,
    deleteProfile,
    copyProfileLink,
    editProfile,
    createProfile
} = useProfiles();

const {
    showNodesPreviewModal,
    showLogsModal,
    loadingNodesPreview,
    currentProfileForPreview,
    nodesPreviewData,
    openPreview,
    openLogs: openDebugLogs
} = useProfilePreview();

// For Subscription Logs Modal (Access Logs)
const showSubLogsModal = ref(false);
const currentProfileForLogs = ref<Profile | null>(null);

const onLogs = (row: Profile) => {
  currentProfileForLogs.value = row;
  showSubLogsModal.value = true;
};

const getDropdownOptions = (profile: Profile) => [
  { label: '复制链接', key: 'copy', icon: () => h(NIcon, null, { default: () => h(CopyIcon) }) },
  { label: '预览', key: 'preview', icon: () => h(NIcon, null, { default: () => h(PreviewIcon) }) },
  { label: '日志', key: 'logs', icon: () => h(NIcon, null, { default: () => h(LogIcon) }) },
  { label: '编辑', key: 'edit', icon: () => h(NIcon, null, { default: () => h(EditIcon) }) },
  { label: '删除', key: 'delete', icon: () => h(NIcon, { color: 'red' }, { default: () => h(DeleteIcon) }) },
];

const handleDropdownSelect = (key: string, profile: Profile) => {
  if (key === 'copy') copyProfileLink(profile);
  if (key === 'preview') openPreview(profile);
  if (key === 'logs') onLogs(profile);
  if (key === 'edit') editProfile(profile);
  if (key === 'delete') deleteProfile(profile);
};

onMounted(() => {
  fetchProfiles();
});

</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">组合订阅</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">管理您的订阅转换配置和规则。</p>
      </div>
      <Button variant="primary" @click="createProfile" class="flex items-center whitespace-nowrap !w-10 !h-10 !p-0 !rounded-full md:!w-auto md:!h-10 md:!px-5 md:!rounded-xl">
        <n-icon :component="AddIcon" class="md:mr-2" />
        <span class="hidden md:inline">新建档案</span>
      </Button>
    </div>

    <ProfileTable
      v-if="!isMobile"
      :profiles="profiles"
      :loading="loading"
      @copy="copyProfileLink"
      @preview="openPreview"
      @logs="onLogs"
      @edit="editProfile"
      @delete="deleteProfile"
    />

    <div v-else class="space-y-4">
      <Card v-for="profile in profiles" :key="profile.id" padding="sm" class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
           <div class="font-medium text-slate-900 dark:text-white">{{ profile.name }}</div>
           <n-dropdown
            trigger="click"
            :options="getDropdownOptions(profile)"
            @select="(key) => handleDropdownSelect(key, profile)"
          >
            <Button variant="ghost" size="sm" icon>
              <n-icon :component="MoreIcon" size="20" />
            </Button>
          </n-dropdown>
        </div>
        <div v-if="profile.alias" class="text-xs text-slate-500 truncate bg-gray-50 dark:bg-dark-bg p-2 rounded">
             {{ profile.alias }}
        </div>
      </Card>
    </div>

    <!-- Nodes Preview Modal -->
    <ProfileNodesPreviewModal
        v-model:show="showNodesPreviewModal"
        :loading="loadingNodesPreview"
        :profile-name="currentProfileForPreview?.name"
        :data="nodesPreviewData"
        @view-logs="openDebugLogs"
    />

    <!-- Debug Logs Modal -->
    <ProfileDebugLogModal
        v-model:show="showLogsModal"
        :logs="nodesPreviewData?.logs || []"
    />
    <subscription-log-modal
        v-model:show="showSubLogsModal"
        :profile-id="currentProfileForLogs?.id || null"
        :profile-name="currentProfileForLogs?.name || null"
    />
  </div>
</template>