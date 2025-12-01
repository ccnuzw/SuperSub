<template>
  <n-modal
    v-model:show="show"
    :mask-closable="false"
    preset="dialog"
    title="批量移动到分组"
    style="width: 500px;"
  >
    <div class="batch-move-content">
      <n-alert type="info" style="margin-bottom: 20px;">
        将选中的节点移动到指定分组中
      </n-alert>

      <n-form label-placement="left" label-width="100px">
        <n-form-item label="目标分组" required>
          <n-select
            v-model:value="targetGroupId"
            placeholder="选择目标分组"
            :options="groupOptions"
            :render-label="renderGroupLabel"
          />
        </n-form-item>

        <n-form-item label="新建分组">
          <n-input-group>
            <n-input
              v-model:value="newGroupName"
              placeholder="输入新分组名称"
              clearable
            />
            <n-button
              @click="createNewGroup"
              :loading="creatingGroup"
              :disabled="!newGroupName.trim()"
              type="primary"
            >
              创建
            </n-button>
          </n-input-group>
        </n-form-item>

        <n-form-item label="操作选项">
          <n-space vertical>
            <n-checkbox v-model:checked="removeFromCurrent">
              从原分组中移除（如果节点已有分组）
            </n-checkbox>
            <n-checkbox v-model:checked="updateOrder">
              保持当前排序顺序
            </n-checkbox>
          </n-space>
        </n-form-item>
      </n-form>

      <!-- 分组预览 -->
      <div v-if="targetGroupId !== null" class="group-preview">
        <n-divider>分组预览</n-divider>
        <div class="group-info">
          <div class="group-name">
            {{ getGroupName(targetGroupId) }}
            <n-tag size="small" type="info" style="margin-left: 8px;">
              目标分组
            </n-tag>
          </div>
          <div class="group-stats">
            当前有 {{ getGroupNodeCount(targetGroupId) }} 个节点，
            移动后将变为 {{ getGroupNodeCount(targetGroupId) + selectedCount }} 个
          </div>
        </div>
      </div>
    </div>

    <template #action>
      <n-space>
        <n-button @click="show = false">取消</n-button>
        <n-button
          type="primary"
          @click="confirmMove"
          :loading="moving"
          :disabled="targetGroupId === null || targetGroupId === undefined"
        >
          确认移动 ({{ selectedCount }} 个节点)
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { useMessage } from 'naive-ui';
import { Folder as FolderIcon, FolderOpen as FolderOpenIcon } from '@vicons/ionicons5';
import type { NodeGroup } from '@/types/entities';

interface Props {
  show: boolean;
  groups: NodeGroup[];
  selectedCount?: number;
  // 添加分组节点统计信息
  groupNodeCounts?: Record<string, number>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:show': [value: boolean];
  'move': [groupId: string, options: any];
  'createGroup': [groupName: string];
}>();

const message = useMessage();

// 基础状态
const show = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
});

const moving = ref(false);
const creatingGroup = ref(false);

// 表单状态
const targetGroupId = ref<string | null>(null);
const newGroupName = ref('');
const removeFromCurrent = ref(true);
const updateOrder = ref(true);

// 计算属性
const selectedCount = computed(() => props.selectedCount || 0);

const groupOptions = computed(() => [
  {
    label: '未分组',
    value: '',
    nodeCount: props.groupNodeCounts?.['ungrouped'] || 0
  },
  ...props.groups.map(group => ({
    label: group.name,
    value: group.id,
    nodeCount: props.groupNodeCounts?.[group.id] || 0
  }))
]);

// 方法
const renderGroupLabel = (option: any) => {
  const isUngrouped = option.value === '';
  const icon = isUngrouped ? FolderOpenIcon : FolderIcon;
  const iconColor = isUngrouped ? '#999999' : '#1890ff';

  return h('div', {
    style: `
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
    `
  }, [
    h('span', {
      style: `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 14px;
        height: 14px;
        color: ${iconColor};
        font-size: 14px;
      `
    }, [
      h(icon)
    ]),
    h('span', {
      style: 'flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'
    }, option.label),
    option.nodeCount > 0 && h('span', {
      style: 'color: #999; font-size: 12px; flex-shrink: 0;'
    }, `(${option.nodeCount})`)
  ]);
};

const getGroupName = (groupId: string | null): string => {
  if (groupId === null || groupId === '') return '未分组';
  const group = props.groups.find(g => g.id === groupId);
  return group?.name || '未知分组';
};

const getGroupNodeCount = (groupId: string | null): number => {
  if (groupId === null || groupId === '') {
    // 未分组的节点数量
    return props.groupNodeCounts?.['ungrouped'] || 0;
  }
  // 使用传入的分组节点统计
  return props.groupNodeCounts?.[groupId] || 0;
};

const createNewGroup = async () => {
  if (!newGroupName.value.trim()) {
    message.warning('请输入分组名称');
    return;
  }

  creatingGroup.value = true;
  try {
    emit('createGroup', newGroupName.value.trim());
    newGroupName.value = '';
    message.success('分组创建成功');
  } catch (error) {
    message.error('创建分组失败');
  } finally {
    creatingGroup.value = false;
  }
};

const confirmMove = async () => {
  if (targetGroupId.value === null || targetGroupId.value === undefined) {
    message.warning('请选择目标分组');
    return;
  }

  moving.value = true;
  try {
    emit('move', targetGroupId.value, {
      removeFromCurrent: removeFromCurrent.value,
      updateOrder: updateOrder.value
    });
    message.success(`已移动 ${selectedCount.value} 个节点到分组`);

    // 重置状态
    targetGroupId.value = null;
    removeFromCurrent.value = true;
    updateOrder.value = true;
    show.value = false;
  } catch (error) {
    message.error('移动节点失败');
  } finally {
    moving.value = false;
  }
};

// 监听 modal 关闭，重置状态
watch(show, (newValue) => {
  if (!newValue) {
    targetGroupId.value = null;
    newGroupName.value = '';
    removeFromCurrent.value = true;
    updateOrder.value = true;
  }
});
</script>

<script lang="ts">
import { watch } from 'vue';

export default {
  name: 'BatchMoveModal'
};
</script>

<style scoped>
.batch-move-content {
  padding: 8px 0;
}

/* 防止图标溢出 */
.batch-move-content :deep(.n-icon) {
  font-size: 16px !important;
  width: 16px !important;
  height: 16px !important;
}

/* 防止下拉选项中的图标过大 */
.batch-move-content :deep(.n-select-option .n-icon) {
  font-size: 14px !important;
  width: 14px !important;
  height: 14px !important;
  color: #1890ff;
  min-width: 14px !important;
  min-height: 14px !important;
  max-width: 14px !important;
  max-height: 14px !important;
}

/* 更具体地控制下拉选项的渲染标签 */
.batch-move-content :deep(.n-base-select-option .n-base-select-option-label) {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-move-content :deep(.n-base-select-option .n-base-select-option-label .n-icon) {
  font-size: 14px !important;
  width: 14px !important;
  height: 14px !important;
  color: #1890ff;
  flex-shrink: 0;
}

/* 专门控制渲染标签中的图标 */
.batch-move-content :deep(.n-select-menu .n-icon) {
  font-size: 14px !important;
  width: 14px !important;
  height: 14px !important;
  color: #1890ff;
}

/* 模态框内的图标大小限制 */
:deep(.n-modal .n-icon) {
  max-width: 20px;
  max-height: 20px;
}

.group-preview {
  margin-top: 20px;
  padding: 16px;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
}

.group-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-name {
  font-weight: 600;
  display: flex;
  align-items: center;
}

.group-stats {
  font-size: 14px;
  color: #666;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .batch-move-content {
    padding: 0;
  }

  .group-preview {
    margin-top: 16px;
    padding: 12px;
  }
}
</style>