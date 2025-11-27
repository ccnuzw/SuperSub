<template>
  <div class="group-management">
    <!-- 分组标签页 -->
    <n-tabs
      v-model:value="activeTab"
      type="segment"
      class="mb-6"
    >
      <n-tab-pane name="all" tab="全部订阅">
        <div class="text-sm text-gray-600 mb-4">
          共 {{ subscriptions.length }} 个订阅
        </div>
      </n-tab-pane>

      <n-tab-pane name="ungrouped" tab="未分组">
        <div class="text-sm text-gray-600 mb-4">
          {{ ungroupedSubscriptions.length }} 个未分组订阅
        </div>
      </n-tab-pane>

      <n-tab-pane
        v-for="group in groups"
        :key="group.id"
        :name="group.id"
        :tab="group.name"
        :closable="false"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="text-sm text-gray-600">
            {{ group.description || group.name }} - {{ getGroupSubscriptionCount(group.id) }} 个订阅
          </div>
          <div class="flex items-center gap-2">
            <n-button size="tiny" @click="handleEditGroup(group)">
              编辑
            </n-button>
            <n-dropdown
              :options="getGroupActionOptions(group)"
              trigger="click"
              @select="(key) => handleGroupAction(key, group)"
            >
              <n-button quaternary circle size="tiny">
                <template #icon>
                  <n-icon><MoreIcon /></n-icon>
                </template>
              </n-button>
            </n-dropdown>
          </div>
        </div>
      </n-tab-pane>

      <!-- 添加分组按钮 -->
      <template #suffix>
        <n-button size="small" @click="showAddGroupModal = true">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          添加分组
        </n-button>
      </template>
    </n-tabs>

    <!-- 分组添加/编辑模态框 -->
    <n-modal
      v-model:show="showAddGroupModal"
      :title="editingGroup ? '编辑分组' : '添加分组'"
      preset="dialog"
      style="width: 500px"
    >
      <n-form
        ref="groupFormRef"
        :model="groupForm"
        :rules="groupFormRules"
        label-placement="left"
        label-width="100px"
      >
        <n-form-item label="分组名称" path="name">
          <n-input
            v-model:value="groupForm.name"
            placeholder="请输入分组名称"
          />
        </n-form-item>

        <n-form-item label="分组描述" path="description">
          <n-input
            v-model:value="groupForm.description"
            type="textarea"
            placeholder="请输入分组描述（可选）"
            :rows="3"
          />
        </n-form-item>
      </n-form>

      <template #action>
        <div class="flex justify-end gap-2">
          <n-button @click="handleCancelGroupForm">取消</n-button>
          <n-button
            type="primary"
            :loading="groupFormLoading"
            @click="handleSaveGroup"
          >
            {{ editingGroup ? '更新' : '创建' }}
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- 分组排序模态框 -->
    <n-modal
      v-model:show="showSortModal"
      title="分组排序"
      preset="dialog"
      style="width: 500px"
    >
      <div class="space-y-4">
        <p class="text-sm text-gray-600">
          拖拽分组来调整显示顺序：
        </p>

        <draggable
          v-model="sortableGroups"
          handle=".drag-handle"
          item-key="id"
          class="space-y-2"
        >
          <template #item="{ element }">
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded cursor-move">
              <n-icon class="drag-handle cursor-move">
                <ReorderFourOutline />
              </n-icon>
              <span class="flex-1 font-medium">{{ element.name }}</span>
              <n-tag :type="element.is_enabled ? 'success' : 'default'" size="small">
                {{ element.is_enabled ? '启用' : '禁用' }}
              </n-tag>
            </div>
          </template>
        </draggable>
      </div>

      <template #action>
        <div class="flex justify-end gap-2">
          <n-button @click="showSortModal = false">取消</n-button>
          <n-button
            type="primary"
            :loading="sortLoading"
            @click="handleSaveGroupOrder"
          >
            保存顺序
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- 分组导出模态框 -->
    <n-modal
      v-model:show="showExportModal"
      title="导出分组订阅"
      preset="dialog"
      style="width: 600px"
    >
      <div class="space-y-4">
        <div class="p-4 bg-blue-50 rounded">
          <div class="text-sm font-medium text-blue-900 mb-2">
            {{ exportData.groupName }}
          </div>
          <div class="text-sm text-blue-700">
            包含 {{ exportData.count }} 个订阅链接
          </div>
        </div>

        <n-form-item label="导出格式">
          <n-radio-group v-model:value="exportFormat">
            <n-radio value="text">纯文本</n-radio>
            <n-radio value="line">每行一个</n-radio>
            <n-radio value="json">JSON格式</n-radio>
          </n-radio-group>
        </n-form-item>

        <n-form-item label="订阅链接">
          <n-input
            :value="exportData.urls"
            type="textarea"
            :rows="8"
            readonly
            class="font-mono text-sm"
          />
        </n-form-item>
      </div>

      <template #action>
        <div class="flex justify-end gap-2">
          <n-button @click="handleCopyExportLinks">复制链接</n-button>
          <n-button @click="showExportModal = false">关闭</n-button>
        </div>
      </template>
    </n-modal>

    <!-- 分组操作进度模态框 -->
    <n-modal
      v-model:show="showGroupProgressModal"
      :mask-closable="false"
      preset="dialog"
      style="width: 500px"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <n-icon><SyncOutline /></n-icon>
          <span>{{ groupProgressTitle }}</span>
        </div>
      </template>

      <div class="space-y-4">
        <n-progress
          type="line"
          :percentage="groupProgressPercentage"
          :status="groupProgressStatus"
        />

        <div class="text-sm">
          <span class="text-gray-600">处理进度: </span>
          <span class="font-medium">{{ groupProgress.completed }}/{{ groupProgress.total }}</span>
        </div>

        <div v-if="groupProgress.message" class="text-sm text-gray-600">
          {{ groupProgress.message }}
        </div>
      </div>

      <template #action>
        <div class="flex justify-end">
          <n-button
            :disabled="!groupProgress.completed"
            @click="showGroupProgressModal = false"
          >
            完成
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue';
import {
  NTabs, NTabPane, NButton, NIcon, NDropdown, NModal,
  NForm, NFormItem, NInput, NTag, NProgress, NRadioGroup, NRadio
} from 'naive-ui';
import {
  EllipsisVertical as MoreIcon, AddOutline, ReorderFourOutline, SyncOutline,
  SettingsOutline, TrashOutline, DownloadOutline, DuplicateOutline
} from '@vicons/ionicons5';
import draggable from 'vuedraggable';
import type { Subscription } from '@/types/entities';
import type { SubscriptionGroup } from '@/types/entities';
import type { FormInst, FormRules } from 'naive-ui';
import { useSubscriptionGroupStore } from '@/stores/newSubscriptionGroups';
import { useMessage } from 'naive-ui';

// Props
const props = defineProps({
  subscriptions: {
    type: Array as PropType<Subscription[]>,
    default: () => []
  },
  groups: {
    type: Array as PropType<SubscriptionGroup[]>,
    default: () => []
  }
});

// Emits
const emit = defineEmits([
  'group-changed',
  'refresh'
]);

// Stores & Composables
const subscriptionGroupStore = useSubscriptionGroupStore();
const message = useMessage();

// 响应式状态
const activeTab = ref('all');
const showAddGroupModal = ref(false);
const showSortModal = ref(false);
const showExportModal = ref(false);
const showGroupProgressModal = ref(false);

const editingGroup = ref<SubscriptionGroup | null>(null);
const groupFormLoading = ref(false);
const sortLoading = ref(false);
const exportFormat = ref('line');

const groupFormRef = ref<FormInst | null>(null);
const groupForm = ref({
  name: '',
  description: ''
});

const sortableGroups = ref<SubscriptionGroup[]>([]);
const exportData = ref({
  urls: '',
  count: 0,
  groupName: ''
});

const groupProgress = ref({
  total: 0,
  completed: 0,
  message: ''
});

const groupProgressTitle = ref('');
const groupProgressStatus = ref<'default' | 'success' | 'error' | 'warning'>('default');

// 计算属性
const ungroupedSubscriptions = computed(() => {
  return props.subscriptions.filter(sub => !sub.group_id);
});

const groupProgressPercentage = computed(() => {
  if (groupProgress.value.total === 0) return 0;
  return Math.round((groupProgress.value.completed / groupProgress.value.total) * 100);
});

// 表单验证规则
const groupFormRules: FormRules = {
  name: [
    {
      required: true,
      message: '请输入分组名称',
      trigger: ['input', 'blur']
    },
    {
      min: 1,
      max: 50,
      message: '分组名称长度应在1-50个字符之间',
      trigger: ['input', 'blur']
    }
  ]
};

// 方法
const getGroupSubscriptionCount = (groupId: string) => {
  return props.subscriptions.filter(sub => sub.group_id === groupId).length;
};

const getGroupActionOptions = (group: SubscriptionGroup) => [
  {
    label: '编辑分组',
    key: 'edit'
  },
  {
    label: group.is_enabled ? '禁用分组' : '启用分组',
    key: 'toggle'
  },
  {
    label: '导出订阅',
    key: 'export'
  },
  {
    label: '排序分组',
    key: 'sort'
  },
  {
    type: 'divider'
  },
  {
    label: '删除分组',
    key: 'delete'
  }
];

const handleEditGroup = (group: SubscriptionGroup) => {
  editingGroup.value = group;
  groupForm.value = {
    name: group.name,
    description: group.description || ''
  };
  showAddGroupModal.value = true;
};

const handleGroupAction = async (key: string, group: SubscriptionGroup) => {
  switch (key) {
    case 'edit':
      handleEditGroup(group);
      break;
    case 'toggle':
      await subscriptionGroupStore.toggleGroup(group.id);
      emit('group-changed');
      break;
    case 'export':
      await handleExportGroup(group);
      break;
    case 'sort':
      handleSortGroups();
      break;
    case 'delete':
      await handleDeleteGroup(group);
      break;
  }
};

const handleSaveGroup = async () => {
  if (!groupFormRef.value) return;

  try {
    await groupFormRef.value.validate();
    groupFormLoading.value = true;

    if (editingGroup.value) {
      await subscriptionGroupStore.updateGroup(
        editingGroup.value.id,
        groupForm.value.name,
        groupForm.value.description
      );
    } else {
      await subscriptionGroupStore.addGroup(
        groupForm.value.name,
        groupForm.value.description
      );
    }

    showAddGroupModal.value = false;
    editingGroup.value = null;
    emit('group-changed');
    message.success(editingGroup.value ? '分组更新成功' : '分组创建成功');
  } catch (error) {
    console.error('保存分组失败:', error);
  } finally {
    groupFormLoading.value = false;
  }
};

const handleCancelGroupForm = () => {
  showAddGroupModal.value = false;
  editingGroup.value = null;
  groupForm.value = { name: '', description: '' };
};

const handleSortGroups = () => {
  sortableGroups.value = [...props.groups];
  showSortModal.value = true;
};

const handleSaveGroupOrder = async () => {
  sortLoading.value = true;
  try {
    const groupIds = sortableGroups.value.map(group => group.id);
    await subscriptionGroupStore.updateGroupOrder(groupIds);
    showSortModal.value = false;
    emit('group-changed');
    message.success('分组顺序更新成功');
  } catch (error) {
    console.error('更新分组顺序失败:', error);
  } finally {
    sortLoading.value = false;
  }
};

const handleExportGroup = async (group: SubscriptionGroup) => {
  const groupSubscriptions = props.subscriptions.filter(sub => sub.group_id === group.id);
  const urls = groupSubscriptions.map(sub => sub.url).join('\n');

  exportData.value = {
    urls: urls,
    count: groupSubscriptions.length,
    groupName: group.name
  };
  showExportModal.value = true;
};

const handleCopyExportLinks = () => {
  navigator.clipboard.writeText(exportData.value.urls);
  message.success('订阅链接已复制到剪贴板');
};

const handleDeleteGroup = async (group: SubscriptionGroup) => {
  const groupSubscriptions = getGroupSubscriptionCount(group.id);
  if (groupSubscriptions > 0) {
    message.warning(`该分组下还有 ${groupSubscriptions} 个订阅，请先移动或删除这些订阅`);
    return;
  }

  if (confirm(`确定要删除分组"${group.name}"吗？`)) {
    try {
      await subscriptionGroupStore.deleteGroup(group.id);
      emit('group-changed');
      message.success('分组删除成功');
    } catch (error) {
      console.error('删除分组失败:', error);
    }
  }
};

// 暴露给父组件的方法
defineExpose({
  showGroupProgress: (title: string, total: number, message?: string) => {
    groupProgressTitle.value = title;
    groupProgress.value.total = total;
    groupProgress.value.completed = 0;
    groupProgress.value.message = message || '';
    groupProgressStatus.value = 'default';
    showGroupProgressModal.value = true;
  },
  updateGroupProgress: (completed: number, message?: string) => {
    groupProgress.value.completed = completed;
    if (message) {
      groupProgress.value.message = message;
    }
  },
  completeGroupProgress: (message?: string) => {
    groupProgressStatus.value = 'success';
    if (message) {
      groupProgress.value.message = message;
    }
  }
});
</script>

<style scoped>
.group-management {
  @apply w-full;
}

.drag-handle {
  @apply cursor-move;
}

:deep(.n-tabs .n-tabs-nav) {
  @apply mb-0;
}

:deep(.n-tabs .n-tabs-tab-wrapper) {
  @apply mr-2;
}
</style>