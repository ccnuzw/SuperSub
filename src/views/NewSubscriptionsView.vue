<template>
  <div class="subscriptions-view">
    <!-- 页面头部 -->
    <n-page-header title="订阅管理" @back="router.back()">
      <template #extra>
        <n-space>
          <n-button @click="handleAddSubscription" type="primary">
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            添加订阅
          </n-button>
          <n-button @click="handleBatchImport">
            <template #icon>
              <n-icon><AddOutline /></n-icon>
            </template>
            批量导入
          </n-button>
          <n-button @click="handleRefresh" :loading="loading">
            <template #icon>
              <n-icon><SyncOutline /></n-icon>
            </template>
            刷新
          </n-button>
        </n-space>
      </template>
    </n-page-header>

    <!-- 统计信息 -->
    <div class="stats-grid mb-6">
      <n-card>
        <n-statistic label="总订阅数" :value="statistics.total" />
      </n-card>
      <n-card>
        <n-statistic label="已启用" :value="statistics.enabled" />
      </n-card>
      <n-card>
        <n-statistic label="已禁用" :value="statistics.disabled" />
      </n-card>
      <n-card>
        <n-statistic label="更新中" :value="statistics.updating" />
      </n-card>
    </div>

    <!-- 分组管理 -->
    <div class="mb-6">
      <GroupManagement
        :subscriptions="subscriptions"
        :groups="groups"
        @group-changed="handleGroupChanged"
        @refresh="handleRefresh"
      />
    </div>

    <!-- 搜索和筛选 -->
    <div class="mb-4 flex items-center gap-4">
      <n-input
        v-model:value="searchQuery"
        placeholder="搜索订阅..."
        clearable
        style="max-width: 300px"
        @input="handleSearch"
      >
        <template #prefix>
          <n-icon><SearchOutline /></n-icon>
        </template>
      </n-input>

      <n-select
        v-model:value="pageSize"
        :options="pageSizeOptions"
        style="width: 120px"
        @update:value="handlePageSizeChange"
      />
    </div>

    <!-- 批量操作 -->
    <BatchActions
      :selected-items="selectedSubscriptions"
      @clear-selection="clearSelection"
      @batch-update="handleBatchUpdate"
      @batch-toggle="handleBatchToggle"
      @batch-delete="handleBatchDelete"
      @batch-import="handleBatchImport"
      @move-to-group="handleMoveToGroup"
      @batch-replace="handleBatchReplace"
    />

    <!-- 订阅列表 -->
    <div class="mb-6">
      <SubscriptionList
        :subscriptions="paginatedSubscriptions"
        :loading="loading"
        :updating-ids="updatingIds"
        @refresh="handleRefresh"
        @edit="handleEdit"
        @delete="handleDelete"
        @preview="handlePreview"
        @sync="handleSync"
        @selection-change="handleSelectionChange"
        @bulk-action="handleBulkAction"
      />
    </div>

    <!-- 分页 -->
    <div v-if="totalPages > 1" class="flex justify-center">
      <n-pagination
        v-model:page="currentPage"
        :page-size="pageSize"
        :item-count="filteredSubscriptions.length"
        show-size-picker
        :page-sizes="[10, 20, 50, 100]"
        @update:page="handlePageChange"
      />
    </div>

    <!-- 订阅表单模态框 -->
    <SubscriptionForm
      v-model:visible="showModal"
      :editing-data="editingSubscription"
      :loading="saveLoading"
      @update:visible="handleModalVisibleChange"
      @submit="handleFormSubmit"
      @cancel="handleFormCancel"
    />

    <!-- 预览模态框 -->
    <n-modal
      v-model:show="showPreviewModal"
      preset="dialog"
      style="width: 800px; max-width: 90vw"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <n-icon><EyeOutline /></n-icon>
          <span>订阅预览 - {{ previewSubscription?.name }}</span>
        </div>
      </template>

      <div v-if="previewSubscription" class="space-y-4">
        <div class="p-4 bg-gray-50 rounded">
          <n-form :model="previewSubscription" label-placement="left" label-width="100px">
            <n-form-item label="订阅名称">
              {{ previewSubscription.name }}
            </n-form-item>
            <n-form-item label="订阅链接">
              <n-ellipsis style="max-width: 500px">
                {{ previewSubscription.url }}
              </n-ellipsis>
            </n-form-item>
            <n-form-item label="节点数量">
              {{ previewSubscription.node_count || '未知' }}
            </n-form-item>
            <n-form-item label="最后更新">
              {{ previewSubscription.last_updated ? formatDate(previewSubscription.last_updated) : '从未更新' }}
            </n-form-item>
          </n-form>
        </div>

        <!-- 节点预览组件 -->
        <SubscriptionNodesPreview
          v-if="previewSubscription.id"
          :subscription-url="previewSubscription.url"
          :loading="previewLoading"
        />
      </div>

      <template #action>
        <n-button @click="showPreviewModal = false">关闭</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  NPageHeader, NSpace, NButton, NIcon, NCard, NStatistic,
  NInput, NSelect, NPagination, NModal, NForm, NFormItem,
  NEllipsis
} from 'naive-ui';
import {
  AddOutline, SyncOutline, SearchOutline, EyeOutline
} from '@vicons/ionicons5';

// 导入新的子组件
import SubscriptionList from '@/components/subscription/SubscriptionList.vue';
import SubscriptionForm from '@/components/subscription/SubscriptionForm.vue';
import BatchActions from '@/components/subscription/BatchActions.vue';
import GroupManagement from '@/components/subscription/GroupManagement.vue';

// 导入组合式函数和工具
import { useSubscriptions } from '@/composables/subscription/useSubscriptions';
import { useSubscriptionGroupStore } from '@/stores/newSubscriptionGroups';
import { format } from 'date-fns';
import SubscriptionNodesPreview from '@/components/SubscriptionNodesPreview.vue';
import { simpleApiClient } from '@/utils/api/SimpleApiClient';

// Router
const router = useRouter();

// 使用组合式函数
const {
  subscriptions,
  loading,
  showModal,
  saveLoading,
  editingSubscription,
  updatingIds,
  selectedIds,
  activeTab,
  searchQuery,
  currentPage,
  pageSize,
  filteredSubscriptions,
  paginatedSubscriptions,
  totalPages,
  selectedSubscriptions,
  statistics,
  fetchSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  syncSubscription,
  batchUpdateSubscriptions,
  toggleSubscription,
  handleEdit,
  handleDelete,
  handleSync,
  clearSelection,
  search,
  setActiveTab,
  openAddModal,
  closeModal
} = useSubscriptions();

// 使用分组Store
const subscriptionGroupStore = useSubscriptionGroupStore();
const groups = computed(() => subscriptionGroupStore.groups);

// 预览相关状态
const showPreviewModal = ref(false);
const previewSubscription = ref(null);
const previewLoading = ref(false);

// 分页选项
const pageSizeOptions = [
  { label: '10条/页', value: 10 },
  { label: '20条/页', value: 20 },
  { label: '50条/页', value: 50 },
  { label: '100条/页', value: 100 }
];

// 方法
const formatDate = (dateString: string) => {
  return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
};

const handleAddSubscription = () => {
  openAddModal();
};

const handleBatchImport = () => {
  // 批量导入逻辑
  console.log('批量导入');
};

const handleRefresh = async () => {
  await fetchSubscriptions();
  await subscriptionGroupStore.fetchGroups();
};

const handleModalVisibleChange = (visible: boolean) => {
  if (!visible) {
    closeModal();
  }
};

const handleFormSubmit = async (formData: any) => {
  try {
    if (editingSubscription.value) {
      await updateSubscription(editingSubscription.value.id, formData);
    } else {
      await createSubscription(formData);
    }
    closeModal();
  } catch (error) {
    console.error('保存订阅失败:', error);
  }
};

const handleFormCancel = () => {
  closeModal();
};

const handlePreview = (subscription: any) => {
  previewSubscription.value = subscription;
  showPreviewModal.value = true;
};

const handleSelectionChange = (selectedKeys: string[], selectedItems: any[]) => {
  // 处理选择变化
  console.log('选择变化:', selectedKeys, selectedItems);
};

const handleBulkAction = (action: string, items: any[]) => {
  // 处理批量操作
  console.log('批量操作:', action, items);
};

const handleBatchUpdate = () => {
  const selectedIds = Array.from(selectedIds.value);
  batchUpdateSubscriptions(selectedIds);
};

const handleBatchToggle = ({ enabled, items }: any) => {
  items.forEach((item: any) => {
    toggleSubscription(item.id);
  });
};

const handleBatchDelete = () => {
  const selectedIds = Array.from(selectedIds.value);
  // 批量删除逻辑
  console.log('批量删除:', selectedIds);
};

const handleMoveToGroup = ({ groupId, items }: any) => {
  // 移动到分组逻辑
  console.log('移动到分组:', groupId, items);
};

const handleBatchReplace = ({ find, replace, items }: any) => {
  // 批量替换逻辑
  console.log('批量替换:', find, replace, items);
};

const handleGroupChanged = () => {
  fetchSubscriptions();
};

const handleSearch = () => {
  search(searchQuery.value);
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
};

const handlePageSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

// 生命周期
onMounted(async () => {
  await fetchSubscriptions();
  await subscriptionGroupStore.fetchGroups();
});
</script>

<style scoped>
.subscriptions-view {
  @apply p-6 min-h-screen bg-gray-50;
}

.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4;
}

:deep(.n-page-header) {
  @apply mb-6;
}

:deep(.n-statistic .n-statistic-value) {
  @apply text-2xl;
}

:deep(.n-statistic .n-statistic-label) {
  @apply text-gray-600;
}
</style>