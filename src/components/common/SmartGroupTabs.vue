<template>
  <div class="smart-group-tabs" @contextmenu="handleGlobalContextMenu">
    <n-tabs
      :model-value="activeTab"
      @update:value="$emit('update:activeTab', $event)"
      :type="tabType"
      :size="size"
      @tab-click="handleTabClick"
      class="group-tabs"
    >
      <!-- 全部标签 -->
      <n-tab-pane name="all" :tab="`全部 (${groupCounts.all || 0})`" />

      <!-- 未分组标签 -->
      <n-tab-pane name="ungrouped" :tab="`未分组 (${groupCounts.ungrouped || 0})`" />

      <!-- 动态分组标签 -->
      <n-tab-pane
        v-for="group in enabledGroups"
        :key="group.id"
        :name="group.id"
      >
        <template #tab>
          <div
            class="group-tab-wrapper"
            @click.prevent="handleGroupTabClick(group, $event)"
            @contextmenu.prevent.stop="handleGroupContextMenu(group, $event)"
          >
            <span
              :style="{
                color: getGroupTextColor(group),
                marginRight: '8px'
              }"
            >
              {{ group.name }} ({{ groupCounts[group.id] || 0 }})
            </span>

            <!-- 内联操作按钮 -->
            <n-dropdown
              :options="getGroupActionOptions(group)"
              placement="bottom-end"
              @select="(key: string) => handleGroupAction(key, group)"
              trigger="click"
            >
              <n-button
                text
                size="small"
                class="group-actions-button"
              >
                <template #icon>
                  <n-icon :component="moreIcon" />
                </template>
              </n-button>
            </n-dropdown>
          </div>
        </template>
      </n-tab-pane>

      <!-- 新增分组标签 -->
      <n-tab-pane name="add-group" v-if="showAddButton">
        <template #tab>
          <div
            class="add-group-tab-wrapper"
            @click="handleAddGroupClick"
          >
            <n-icon
              :component="addIcon"
              size="16"
              style="margin-right: 6px; color: #1890ff;"
            />
            <span style="color: #1890ff; font-weight: 500;">新增分组</span>
          </div>
        </template>
      </n-tab-pane>
    </n-tabs>

    <!-- 右键上下文菜单 -->
    <n-dropdown
      :show="showContextMenu"
      :x="contextMenuX"
      :y="contextMenuY"
      :options="getContextMenuOptions(contextMenuGroup)"
      placement="bottom-start"
      @clickoutside="closeContextMenu"
      @select="handleContextMenuAction"
    />

    <!-- 新增分组弹窗 -->
    <n-modal v-model:show="showAddGroupModal" preset="dialog" title="新增分组">
      <template #header>
        <div class="modal-header">
          <n-icon :component="addIcon" size="20" />
          <span>新增分组</span>
        </div>
      </template>

      <div class="modal-content">
        <n-form ref="formRef" :model="newGroupForm" :rules="formRules">
          <n-form-item label="分组名称" path="name">
            <n-input
              v-model:value="newGroupForm.name"
              placeholder="请输入分组名称"
              maxlength="50"
              show-count
              @keydown.enter.prevent="handleConfirmAddGroup"
            />
          </n-form-item>
          <n-form-item label="分组描述" path="description">
            <n-input
              v-model:value="newGroupForm.description"
              type="textarea"
              placeholder="请输入分组描述（可选）"
              :rows="3"
              maxlength="200"
              show-count
            />
          </n-form-item>
        </n-form>
      </div>

      <template #action>
        <div class="modal-actions">
          <n-button @click="showAddGroupModal = false">取消</n-button>
          <n-button type="primary" @click="handleConfirmAddGroup" :loading="isSubmitting">
            确定
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Component } from 'vue';
import { EllipsisVertical as DefaultMoreIcon, Add as DefaultAddIcon } from '@vicons/ionicons5';
import type { FormInst, FormRules } from 'naive-ui';

// 类型定义
export interface GroupItem {
  id: string;
  name: string;
  description?: string;
  is_enabled?: boolean;
  disabled?: boolean;
  [key: string]: any;
}

export interface GroupCount {
  all: number;
  ungrouped: number;
  [groupId: string]: number;
}

export interface ActionOption {
  label: string;
  key: string;
  type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';
  icon?: Component;
  description?: string;
  danger?: boolean;
  disabled?: boolean;
}

// Props 接口
interface Props {
  // 基础数据
  groups: GroupItem[];
  groupCounts: GroupCount;
  activeTab: string;

  // 配置选项
  tabType?: 'line' | 'card' | 'segment' | 'bar';
  size?: 'small' | 'medium' | 'large';
  showAddButton?: boolean;
  showItemCount?: boolean;

  // 图标配置
  moreIcon?: Component;
  addIcon?: Component;

  // 功能开关
  enableContextMenu?: boolean;
  enableInlineActions?: boolean;

  // 样式配置
  disabledColor?: string;
  layout?: 'horizontal' | 'vertical';

  // 自定义配置
  customContextMenuOptions?: ((group: GroupItem) => ActionOption[]) | null;
  customInlineActionOptions?: ((group: GroupItem) => ActionOption[]) | null;
  customAddButtonOptions?: ActionOption[] | null;
}

const props = withDefaults(defineProps<Props>(), {
  tabType: 'segment',
  size: 'medium',
  showAddButton: false,
  showItemCount: true,
  moreIcon: DefaultMoreIcon,
  addIcon: DefaultAddIcon,
  enableContextMenu: true,
  enableInlineActions: true,
  disabledColor: '#999',
  layout: 'horizontal',
  customContextMenuOptions: null,
  customInlineActionOptions: null,
  customAddButtonOptions: null
});

// Emits
const emit = defineEmits<{
  'update:activeTab': [value: string];
  'tab-click': [tabId: string];
  'group-tab-click': [group: GroupItem, event: MouseEvent];
  'group-context-menu': [group: GroupItem, event: MouseEvent];
  'group-action': [key: string, group: GroupItem];
  'add-action': [key: string, data?: { name: string; description: string }];
}>();

// 响应式状态
const showContextMenu = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuGroup = ref<GroupItem | null>(null);

// 新增分组相关状态
const showAddGroupModal = ref(false);
const formRef = ref<FormInst | null>(null);
const isSubmitting = ref(false);
const newGroupForm = ref({
  name: '',
  description: ''
});

// 表单验证规则
const formRules: FormRules = {
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
  ],
  description: [
    {
      max: 200,
      message: '描述长度不能超过200个字符',
      trigger: ['input', 'blur']
    }
  ]
};

// 计算属性
const enabledGroups = computed(() => {
  return props.groups.filter(group =>
    !group.disabled && (group.is_enabled !== false)
  );
});

const addButtonOptions = computed((): ActionOption[] => {
  // 如果有自定义添加按钮选项，使用自定义的
  if (props.customAddButtonOptions) {
    return props.customAddButtonOptions;
  }

  // 默认选项
  return [
    {
      label: '新增分组',
      key: 'add-group',
      type: 'primary',
      icon: props.addIcon
    }
  ];
});

// 获取分组文本颜色
const getGroupTextColor = (group: GroupItem) => {
  if (group.disabled || group.is_enabled === false) {
    return props.disabledColor;
  }
  return '';
};

// 获取分组操作选项（支持自定义）
const getGroupActionOptions = (group: GroupItem): ActionOption[] => {
  // 优先使用内联操作自定义选项
  if (props.customInlineActionOptions) {
    return props.customInlineActionOptions(group);
  }

  // 如果没有内联自定义，但有上下文菜单自定义选项，且当前是内联菜单，也使用自定义的
  if (!props.enableInlineActions && props.customContextMenuOptions) {
    return props.customContextMenuOptions(group);
  }

  // 默认操作
  const options: ActionOption[] = [];

  // 基础操作
  if (group.is_enabled !== undefined) {
    options.push({
      label: group.is_enabled ? '禁用' : '启用',
      key: 'toggle',
      type: group.is_enabled ? 'warning' : 'success'
    });
  }

  // 编辑操作
  options.push(
    { label: '重命名', key: 'rename', type: 'default' },
    { label: '删除', key: 'delete', type: 'error', danger: true }
  );

  return options;
};

// 获取右键菜单选项（支持自定义）
const getContextMenuOptions = (group: GroupItem | null): ActionOption[] => {
  // 如果右键点击在空白区域，显示新增分组选项
  if (!group) {
    if (props.enableContextMenu) {
      return [
        {
          label: '新增分组',
          key: 'add-group',
          type: 'primary',
          icon: props.addIcon
        }
      ];
    }
    return [];
  }

  // 优先使用自定义上下文菜单选项
  if (props.customContextMenuOptions) {
    const customOptions = props.customContextMenuOptions(group);
    // 在自定义选项中添加新增分组选项
    if (props.enableContextMenu && props.showAddButton) {
      return [
        ...customOptions,
        { type: 'divider' as const, key: `divider-${Date.now()}` },
        {
          label: '新增分组',
          key: 'add-group',
          type: 'primary',
          icon: props.addIcon
        }
      ];
    }
    return customOptions;
  }

  // 如果有内联操作自定义选项，但没有上下文菜单自定义选项，使用内联的
  if (props.customInlineActionOptions) {
    const inlineOptions = props.customInlineActionOptions(group);
    // 在内联选项中添加新增分组选项
    if (props.enableContextMenu && props.showAddButton) {
      return [
        ...inlineOptions,
        { type: 'divider' as const, key: `divider-${Date.now()}` },
        {
          label: '新增分组',
          key: 'add-group',
          type: 'primary',
          icon: props.addIcon
        }
      ];
    }
    return inlineOptions;
  }

  // 使用默认操作（与内联操作相同）
  const defaultOptions = getGroupActionOptions(group);

  // 在默认选项中添加新增分组选项
  if (props.enableContextMenu && props.showAddButton) {
    return [
      ...defaultOptions,
      { type: 'divider' as const, key: `divider-${Date.now()}` },
      {
        label: '新增分组',
        key: 'add-group',
        type: 'primary',
        icon: props.addIcon
      }
    ];
  }

  return defaultOptions;
};

// 事件处理方法
const handleTabClick = (tabId: string) => {
  emit('update:activeTab', tabId);
  emit('tab-click', tabId);
};

const handleGroupTabClick = (group: GroupItem, event: MouseEvent) => {
  emit('group-tab-click', group, event);
};

const handleGroupContextMenu = (group: GroupItem, event: MouseEvent) => {
  if (!props.enableContextMenu) return;

  event.preventDefault();
  event.stopPropagation();

  contextMenuGroup.value = group;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  showContextMenu.value = true;

  emit('group-context-menu', group, event);
};

const handleGlobalContextMenu = (event: MouseEvent) => {
  if (!props.enableContextMenu || !props.showAddButton) return;

  event.preventDefault();
  event.stopPropagation();

  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;

  // 检查是否点击在空白区域（不在任何标签上）
  const target = event.target as HTMLElement;
  const tabWrapper = target.closest('.group-tab-wrapper');
  const tabElement = target.closest('.n-tabs-tab');

  // 如果点击在空白区域，显示新增分组选项
  if (!tabWrapper && !tabElement) {
    contextMenuGroup.value = null;
    showContextMenu.value = true;
    emit('group-context-menu', null, event);
  } else if (tabWrapper) {
    // 如果点击在标签上，使用原有逻辑
    const group = props.groups.find(g => g.id === props.activeTab);
    if (group) {
      contextMenuGroup.value = group;
      showContextMenu.value = true;
      emit('group-context-menu', group, event);
    }
  }
};

const handleGroupAction = (key: string, group: GroupItem) => {
  emit('group-action', key, group);
};

const handleAddAction = (key: string) => {
  emit('add-action', key);
};

// 新增分组相关事件处理
const handleAddGroupClick = () => {
  resetForm();
  showAddGroupModal.value = true;
};

const handleConfirmAddGroup = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    isSubmitting.value = true;

    // 模拟提交延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    // 发出新增分组事件，包含表单数据
    emit('add-action', 'add-group', {
      name: newGroupForm.value.name.trim(),
      description: newGroupForm.value.description.trim()
    });

    // 重置表单并关闭弹窗
    resetForm();
    showAddGroupModal.value = false;
  } catch (error) {
    // 表单验证失败，不关闭弹窗
    console.log('表单验证失败:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const resetForm = () => {
  newGroupForm.value = {
    name: '',
    description: ''
  };
  formRef.value?.restoreValidation();
};

const handleContextMenuAction = (key: string) => {
  // 如果是新增分组操作，打开弹窗
  if (key === 'add-group') {
    handleAddGroupClick();
    closeContextMenu();
    return;
  }

  // 其他操作传递给对应的分组
  if (contextMenuGroup.value) {
    emit('group-action', key, contextMenuGroup.value);
  }
  closeContextMenu();
};

const closeContextMenu = () => {
  showContextMenu.value = false;
  contextMenuGroup.value = null;
};
</script>

<style scoped>
.smart-group-tabs {
  width: 100%;
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  box-sizing: border-box;
}

.group-tabs {
  width: 100%;
}

.group-tabs :deep(.n-tabs) {
  width: 100%;
}

.group-tabs :deep(.n-tabs-nav) {
  margin-bottom: 0;
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  gap: 4px;
  align-items: center;
}

.group-tabs :deep(.n-tabs-tab-wrapper) {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.group-tabs :deep(.n-tabs-tab) {
  flex: 0 1 auto;
  min-width: 120px;
  max-width: 200px;
  padding: 8px 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.group-tabs :deep(.n-tabs-tab:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.group-tabs :deep(.n-tabs-tab--active) {
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(32, 128, 240, 0.2);
}

/* 分组标签内部元素样式 */
.group-tab-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
  font-size: 14px;
}

/* 新增分组标签样式 */
.add-group-tab-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  border: 1px dashed #d0d0d0;
  background-color: #fafafa;
  color: #1890ff;
}

.add-group-tab-wrapper:hover {
  border-color: #1890ff;
  background-color: #f0f9ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.15);
}

/* 后缀操作按钮样式 */
.add-group-icon-button {
  opacity: 0.8;
  transition: all 0.2s;
  background-color: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  min-width: 24px;
  height: 24px;
  flex-shrink: 0;
  color: #1890ff;
}

.add-group-icon-button:hover {
  background-color: #f0f9ff !important;
  border-color: #91d5ff;
  color: #1890ff;
  opacity: 1;
  transform: scale(1.1);
}

.add-group-icon-button .n-icon {
  flex-shrink: 0;
}

.group-actions-button {
  opacity: 0.8;
  transition: all 0.2s;
  background-color: transparent;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 2px;
  min-width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.group-actions-button:hover {
  background-color: #f5f5f5 !important;
  border-color: #d0d0d0;
  opacity: 1;
}

.group-tab-wrapper:hover .group-actions-button {
  opacity: 1;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .group-tabs :deep(.n-tabs-tab) {
    flex: 0 1 auto;
    min-width: 90px;
    max-width: 160px;
    font-size: 11px;
    padding: 6px 8px;
  }

  .add-group-tab-wrapper {
    font-size: 11px;
    padding: 3px 6px;
    gap: 4px;
  }

  .add-group-tab-wrapper .n-icon {
    font-size: 14px !important;
  }

  .add-group-icon-button {
    min-width: 20px;
    height: 20px;
  }
}

@media (max-width: 768px) {
  .smart-group-tabs {
    padding: 12px;
  }

  .group-tabs :deep(.n-tabs-nav) {
    gap: 2px;
  }

  .group-tabs :deep(.n-tabs-tab-wrapper) {
    gap: 2px;
  }

  .group-tabs :deep(.n-tabs-tab) {
    flex: 0 1 calc(33.33% - 2px); /* 3个标签时每行占33% */
    min-width: 80px;
    max-width: 140px;
    font-size: 10px;
    padding: 4px 6px;
  }

  .group-tab-wrapper {
    font-size: 12px;
    gap: 6px;
  }

  .add-group-tab-wrapper {
    font-size: 12px;
    padding: 2px 4px;
    gap: 3px;
  }

  .add-group-tab-wrapper .n-icon {
    font-size: 12px !important;
  }

  .group-actions-button {
    min-width: 20px;
    height: 20px;
  }

  .add-group-icon-button {
    min-width: 18px;
    height: 18px;
  }
}

@media (max-width: 480px) {
  .group-tabs :deep(.n-tabs-nav) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .group-tabs :deep(.n-tabs-tab-wrapper) {
    width: 100%;
    flex-wrap: wrap;
  }

  .group-tabs :deep(.n-tabs-tab) {
    flex: 1 1 calc(50% - 2px); /* 2个标签时每行占50% */
    min-width: 70px;
    max-width: none;
    font-size: 9px;
    padding: 3px 4px;
  }

  .group-tab-wrapper {
    font-size: 11px;
    gap: 4px;
  }

  .add-group-tab-wrapper {
    font-size: 11px;
    padding: 2px 3px;
    gap: 2px;
  }

  .add-group-tab-wrapper .n-icon {
    font-size: 10px !important;
  }

  .group-actions-button {
    min-width: 18px;
    height: 18px;
  }

  .add-group-icon-button {
    min-width: 16px;
    height: 16px;
  }
}

/* 不同类型的标签样式 */
.smart-group-tabs[data-tab-type="card"] .group-tabs :deep(.n-tabs-tab) {
  background: #f8f9fa;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin: 2px;
}

.smart-group-tabs[data-tab-type="card"] .group-tabs :deep(.n-tabs-tab--active) {
  background: #1890ff;
  color: white;
  border-color: #1890ff;
}

.smart-group-tabs[data-tab-type="card"] .add-group-tab-wrapper {
  border-style: dashed;
  border-color: #1890ff;
  background: #f0f9ff;
  color: #1890ff;
}

.smart-group-tabs[data-tab-type="card"] .add-group-tab-wrapper:hover {
  background: #e6f7ff;
  border-color: #40a9ff;
}

/* 垂直布局 */
.smart-group-tabs[data-layout="vertical"] {
  display: flex;
  flex-direction: column;
}

.smart-group-tabs[data-layout="vertical"] .group-tabs :deep(.n-tabs-tab-wrapper) {
  flex-direction: column;
  width: auto;
}

.smart-group-tabs[data-layout="vertical"] .group-tabs :deep(.n-tabs-tab) {
  flex: none;
  width: 100%;
  min-width: auto;
  justify-content: flex-start;
}

/* 弹窗样式 */
.modal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.modal-content {
  padding: 0 8px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>