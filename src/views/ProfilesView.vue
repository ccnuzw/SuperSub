<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NSpace, NPageHeader, NIcon, NList, NListItem, NThing, NDropdown } from 'naive-ui';
import { EllipsisVertical as MoreIcon } from '@vicons/ionicons5';
import { useIsMobile } from '@/composables/useMediaQuery';
import type { Profile } from '@/types';
import SubscriptionLogModal from '@/components/SubscriptionLogModal.vue';
import ProfileTable from '@/components/profiles/ProfileTable.vue';
import ProfileNodesPreviewModal from '@/components/profiles/modals/ProfileNodesPreviewModal.vue';
import ProfileDebugLogModal from '@/components/profiles/modals/ProfileDebugLogModal.vue';
import { useProfiles } from '@/composables/profiles/useProfiles';
import { useProfilePreview } from '@/composables/profiles/useProfilePreview';

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

onMounted(() => {
  fetchProfiles();
});

</script>

<template>
  <div>
    <n-page-header>
      <template #title>配置管理</template>
      <template #extra>
        <n-space>
          <n-button type="primary" @click="createProfile">新增配置</n-button>
        </n-space>
      </template>
    </n-page-header>

    <ProfileTable
      v-if="!isMobile"
      :profiles="profiles"
      :loading="loading"
      @copy="copyProfileLink"
      @preview="openPreview"
      @logs="onLogs"
      @edit="editProfile"
      @delete="deleteProfile"
      class="mt-4"
    />

    <n-list v-else bordered class="mt-4">
      <n-list-item v-for="profile in profiles" :key="profile.id">
        <n-thing :title="profile.name" />
        <template #suffix>
            <n-dropdown
            trigger="click"
            :options="[
              { label: '复制链接', key: 'copy' },
              { label: '预览', key: 'preview' },
              { label: '日志', key: 'logs' },
              { label: '编辑', key: 'edit' },
              { label: '删除', key: 'delete' },
            ]"
            @select="key => {
              if (key === 'copy') copyProfileLink(profile);
              if (key === 'preview') openPreview(profile);
              if (key === 'logs') onLogs(profile);
              if (key === 'edit') editProfile(profile);
              if (key === 'delete') deleteProfile(profile);
            }"
          >
            <n-button text>
              <n-icon :component="MoreIcon" size="24" />
            </n-button>
          </n-dropdown>
        </template>
      </n-list-item>
    </n-list>

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