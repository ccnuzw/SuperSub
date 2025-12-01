<template>
  <div class="node-group-tabs">
    <n-tabs
      :model-value="activeTab"
      @update:value="$emit('update:activeTab', $event)"
      type="line"
      :tab-style="{ minWidth: '120px' }"
      @tab-click="handleTabClick"
    >
      <n-tab-pane name="all" :tab="`全部 (${groupCounts.all})`" />
      <n-tab-pane name="ungrouped" :tab="`未分组 (${groupCounts.ungrouped})`" />

      <n-tab-pane
        v-for="group in enabledGroups"
        :key="group.id"
        :name="group.id"
      >
        <template #tab>
          <div
            class="group-tab-wrapper"
            @click.prevent="handleGroupTabClick(group, $event)"
            @contextmenu.prevent="handleGroupContextMenu(group, $event)"
          >
            <span :style="{ color: group.disabled ? '#999' : '', marginRight: '8px' }">
              {{ group.name }} ({{ groupCounts[group.id] || 0 }})
            </span>
            <n-button
              v-if="activeTab === group.id"
              text
              size="small"
              class="group-actions-button"
              @click.stop="handleGroupMenuClick"
            >
              <template #icon>
                <n-icon>
                  <EllipsisVertical as MoreIcon />
                </n-icon>
              </template>
            </n-button>
          </div>
        </template>
      </n-tab-pane>

      <template #suffix>
        <n-dropdown
          :options="dropdownOptions"
          placement="bottom-end"
          @select="handleDropdownSelect"
        >
          <n-button text>
            <template #icon>
              <n-icon>
                <AddOutline />
              </n-icon>
            </template>
          </n-button>
        </n-dropdown>
      </template>
    </n-tabs>

    <!-- 分组右键菜单 -->
    <n-dropdown
      :show="showContextMenu"
      :x="contextMenuX"
      :y="contextMenuY"
      :options="groupDropdownOptions"
      placement="bottom-start"
      @clickoutside="closeContextMenu"
      @select="handleGroupAction"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { EllipsisVertical as MoreIcon, AddOutline } from '@vicons/ionicons5';
import type { NodeGroup } from '@/stores/groups';
import type { TabConfig } from '@/composables/useNodeGroups';

// Props
interface Props {
  tabs: TabConfig[];
  activeTab: string;
  activeDropdownGroup: NodeGroup | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:activeTab': [value: string];
  'tabClick': [tabId: string];
  'groupTabClick': [group: NodeGroup, event: MouseEvent];
  'groupContextMenu': [group: NodeGroup, event: MouseEvent];
  'groupAction': [key: string, group: NodeGroup];
  'addGroup': [];
}>();

// 响应式状态
const showContextMenu = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuGroup = ref<NodeGroup | null>(null);

// 计算属性
const groupCounts = computed(() => {
  const counts: Record<string, number> = { all: 0, ungrouped: 0 };
  props.tabs.forEach(tab => {
    counts[tab.id] = tab.count;
  });
  return counts;
});

const enabledGroups = computed(() => {
  return props.tabs.filter(tab => tab.id !== 'all' && tab.id !== 'ungrouped' && !tab.disabled);
});

const dropdownOptions = [
  { label: '新增分组', key: 'add-group' },
];

const groupDropdownOptions = computed(() => {
  if (!contextMenuGroup.value) return [];

  return [
    { label: contextMenuGroup.value.is_enabled ? '禁用' : '启用', key: 'toggle' },
    { label: '重命名', key: 'rename' },
    { label: '删除', key: 'delete' },
  ];
});

// 方法
const handleTabClick = (tabId: string) => {
  emit('update:activeTab', tabId);
  emit('tabClick', tabId);
};

const handleGroupTabClick = (group: any, event: MouseEvent) => {
  emit('groupTabClick', group, event);
};

const handleGroupContextMenu = (group: any, event: MouseEvent) => {
  contextMenuGroup.value = group;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  showContextMenu.value = true;
  emit('groupContextMenu', group, event);
};

const handleGroupMenuClick = () => {
  // 显示下拉菜单的逻辑
};

const handleDropdownSelect = (key: string) => {
  if (key === 'add-group') {
    emit('addGroup');
  }
};

const handleGroupAction = (key: string) => {
  if (contextMenuGroup.value) {
    emit('groupAction', key, contextMenuGroup.value);
  }
  closeContextMenu();
};

const closeContextMenu = () => {
  showContextMenu.value = false;
  contextMenuGroup.value = null;
};
</script>

<style scoped>
.node-group-tabs {
  margin-bottom: 16px;
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.group-tab-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  min-width: 140px;
}

.group-tab-wrapper:hover {
  background-color: #f5f7fa;
  border-radius: 4px;
}

.group-actions-button {
  opacity: 0;
  transition: opacity 0.2s;
}

.group-tab-wrapper:hover .group-actions-button {
  opacity: 1;
}

@media (max-width: 768px) {
  .node-group-tabs {
    padding: 12px;
  }

  .group-tab-wrapper {
    min-width: 100px;
    font-size: 14px;
  }
}
</style>