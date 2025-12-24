/**
 * 订阅分组标签组件
 */

<template>
  <div class="subscription-group-tabs">
    <n-dropdown
      placement="bottom-start"
      trigger="manual"
      :x="dropdownX"
      :y="dropdownY"
      :options="(dropdownOptions as any)"
      :show="showDropdown"
      @select="handleSelectOnDropdown"
      @clickoutside="handleClickOutsideOnDropdown"
    />

    <n-tabs
      :value="activeTab"
      type="line"
      :bar-width="40"
      @update:value="$emit('update:active-tab', $event)"
    >
      <n-tab-pane name="all" tab="全部订阅">
        <template #tab>
          <n-space align="center">
            <span>全部订阅</span>
            <n-tag size="small" type="info" :bordered="false">
              {{ totalCount }}
            </n-tag>
          </n-space>
        </template>
      </n-tab-pane>

      <n-tab-pane
        v-for="group in groups"
        :key="group.id"
        :name="group.id"
      >
        <template #tab>
          <div
            :data-group-id="group.id"
            class="group-tab"
            @click="handleClickOnGroupTab"
          >
            <n-space align="center">
              <n-icon v-if="group.icon" :color="group.color">
                <component :is="group.icon" />
              </n-icon>
              <span :class="{ 'text-gray-400': !group.is_enabled }">
                {{ group.name }}
              </span>
              <n-tag
                size="small"
                :type="group.subscription_count === 0 ? 'default' : 'primary'"
                :bordered="false"
              >
                {{ group.subscription_count }}
              </n-tag>
              <n-button
                v-if="activeTab === group.id"
                text
                size="small"
                class="group-actions-button"
                @click.stop="handleClickOnGroupActions($event, group)"
              >
                <template #icon>
                  <n-icon size="18"><EllipsisVerticalOutline /></n-icon>
                </template>
              </n-button>
            </n-space>
          </div>
        </template>
      </n-tab-pane>

      <template #suffix>
        <n-button
          text
          size="small"
          @click="$emit('add-group')"
          :loading="loading"
        >
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          新建分组
        </n-button>
      </template>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NTabs, NTabPane, NSpace, NTag, NButton, NIcon, NDropdown } from 'naive-ui'
import { AddOutline, EllipsisVerticalOutline } from '@vicons/ionicons5'
import type { IDropdownOption } from '@/types'

/**
 * 订阅分组标签接口
 */
interface ISubscriptionGroupTab {
  id: string
  name: string
  subscription_count: number
  is_enabled?: boolean
  icon?: any
  color?: string
}

interface IProps {
  activeTab: string
  groups: ISubscriptionGroupTab[]
  loading?: boolean
  totalCount?: number
}

const props = withDefaults(defineProps<IProps>(), {
  groups: () => [],
  loading: false,
  totalCount: 0
})

interface IEmits {
  'update:active-tab': [tab: string]
  'group-click': [group: ISubscriptionGroupTab, event: MouseEvent]
  'group-context-menu': [group: ISubscriptionGroupTab, event: MouseEvent]
  'add-group': []
  'group-action': [action: string, group: ISubscriptionGroupTab]
}

const emit = defineEmits<IEmits>()

// 下拉菜单状态
const showDropdown = ref(false)
const dropdownX = ref(0)
const dropdownY = ref(0)
const activeDropdownGroup = ref<ISubscriptionGroupTab | null>(null)

/**
 * 下拉菜单选项
 */
const dropdownOptions = computed<IDropdownOption[]>(() => {
  if (!activeDropdownGroup.value) return []
  const group = activeDropdownGroup.value

  return [
    { label: '更新本组', key: 'update-group' },
    { label: '一键去重', key: 'deduplicate-group' },
    { label: '导出订阅', key: 'export-group' },
    { label: '分组规则', key: 'group-rules' },
    { type: 'divider', key: 'd1' },
    { label: '批量替换', key: 'batch-replace-group' },
    { label: '标签编辑', key: 'rename' },
    { label: group.is_enabled ? '禁用' : '启用', key: 'toggle' },
    { type: 'divider', key: 'd2' },
    { label: '删除', key: 'delete', props: { style: { color: '#ef4444' } } }
  ]
})

/**
 * 处理分组标签点击
 */
const handleClickOnGroupTab = (event: MouseEvent) => {
  // 如果点击的是操作按钮，不处理
  const target = event.target as HTMLElement
  if (target.closest('.group-actions-button') ||
      target.closest('button') ||
      target.closest('.n-icon')) {
    return
  }

  // 找到对应的分组 - 从当前事件目标向上查找
  const groupDiv = (event.currentTarget as HTMLElement)
  if (!groupDiv) return

  // 通过数据属性找到分组ID
  const groupId = groupDiv.getAttribute('data-group-id')
  if (!groupId) return

  const group = props.groups.find(g => g.id === groupId)
  if (group) {
    emit('group-click', group, event)
  }
}

/**
 * 处理分组操作按钮点击
 */
const handleClickOnGroupActions = (event: MouseEvent, group: ISubscriptionGroupTab) => {
  event.stopPropagation()
  event.preventDefault()

  // 先获取按钮元素的位置
  const button = event.currentTarget as HTMLElement
  const rect = button.getBoundingClientRect()

  showDropdown.value = false
  setTimeout(() => {
    dropdownX.value = rect.left
    dropdownY.value = rect.bottom + 4
    activeDropdownGroup.value = group
    showDropdown.value = true
  }, 50)
}

/**
 * 处理分组右键菜单
 */
const handleContextMenuOnGroup = (event: MouseEvent, group: ISubscriptionGroupTab) => {
  event.preventDefault()
  event.stopPropagation()

  showDropdown.value = false
  setTimeout(() => {
    dropdownX.value = event.clientX
    dropdownY.value = event.clientY
    activeDropdownGroup.value = group
    showDropdown.value = true
  }, 50)
}

/**
 * 处理下拉菜单选项选择
 */
const handleSelectOnDropdown = (key: string) => {
  showDropdown.value = false
  if (activeDropdownGroup.value) {
    emit('group-action', key, activeDropdownGroup.value)
  }
}

/**
 * 处理下拉菜单外部点击
 */
const handleClickOutsideOnDropdown = () => {
  showDropdown.value = false
}
</script>

<style scoped>
.subscription-group-tabs {
  @apply w-full bg-white rounded-lg shadow-sm;
  border: 1px solid rgba(0, 0, 0, 0.06);
  /* 减少内部padding，让内容更紧凑 */
  padding: 8px;
}

.group-tab {
  @apply cursor-pointer px-3 py-2 rounded-lg transition-all duration-200;
  position: relative;
  display: flex;
  align-items: center;
}

.group-tab:hover {
  @apply bg-gray-100/50;
}

.group-actions-button {
  position: relative;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s;
  /* 确保按钮有足够的点击区域 */
  min-width: 32px !important;
  min-height: 32px !important;
}

/* 确保按钮有足够的点击区域 */
.group-actions-button :deep(.n-button__icon) {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 悬停时显示按钮 */
.group-tab:hover .group-actions-button {
  @apply opacity-100;
}

/* 在活动标签上始终显示按钮 */
:deep(.n-tabs-tab--active) .group-actions-button {
  @apply opacity-100 !important;
}

/* 标签页样式优化 */
:deep(.n-tabs) {
  @apply w-full;
}

:deep(.n-tabs .n-tabs-nav) {
  /* 减少导航栏的padding */
  padding: 4px 8px;
}

:deep(.n-tabs .n-tabs-tab) {
  @apply px-2.5 py-1 rounded-lg font-medium transition-all duration-200;
  min-height: 28px;
}

:deep(.n-tabs .n-tabs-tab:hover) {
  @apply bg-gray-100/50;
}

:deep(.n-tabs .n-tabs-tab--active) {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  @apply text-primary-600 font-semibold;
}

:deep(.n-tabs .n-tabs-bar) {
  @apply rounded-full;
}

/* 后缀按钮样式 */
:deep(.n-tabs-suffix) {
  @apply ml-4;
}

/* 桌面端响应式设计 */
@media (min-width: 1200px) {
  .subscription-group-tabs {
    @apply w-full;
    /* 移除 sticky 和 max-height，让组件自然流动 */
    /* @apply sticky top-4 z-10; */
    /* max-height: calc(100vh - 8rem); */
    /* overflow-y: auto; */
  }

  .subscription-group-tabs::-webkit-scrollbar {
    width: 4px;
  }

  .subscription-group-tabs::-webkit-scrollbar-track {
    @apply bg-gray-100 rounded-full;
  }

  .subscription-group-tabs::-webkit-scrollbar-thumb {
    @apply bg-gray-300 rounded-full hover:bg-gray-400;
  }

  /* 响应式标签页 */
  :deep(.n-tabs .n-tabs-tab) {
    @apply px-2.5 py-1;
    /* 移除最小宽度限制，让标签完全自适应 */
    /* min-width: 70px; */
  }

  :deep(.n-tabs .n-tabs-nav) {
    @apply px-2 py-1;
  }

  /* 标签内容响应式 */
  :deep(.n-tabs .n-tabs-tab__label) {
    @apply text-center;
    line-height: 1.3;
    word-wrap: break-word; /* 长单词换行 */
  }
}

/* 更大屏幕优化 */
@media (min-width: 1600px) {
  :deep(.n-tabs .n-tabs-tab) {
    @apply px-3 py-1.5;
    /* 移除最小宽度限制 */
    /* min-width: 90px; */
  }

  :deep(.n-tabs .n-tabs-nav) {
    @apply px-2 py-1;
  }
}

/* 超大屏幕优化 */
@media (min-width: 1920px) {
  :deep(.n-tabs .n-tabs-tab) {
    @apply px-4 py-2;
    /* 移除最小宽度限制 */
    /* min-width: 110px; */
  }
}

/* 响应式设计 */
@media (max-width: 640px) {
  :deep(.n-tabs .n-tabs-tab) {
    @apply px-3 py-1.5 text-sm;
    min-height: 36px;
  }

  :deep(.n-tabs .n-tabs-nav) {
    @apply px-1 py-0.5;
  }

  .group-tab {
    @apply px-2 py-1;
  }
}

/* 滚动优化 */
:deep(.n-tabs .n-tabs-nav-scroll-wrapper) {
  @apply scroll-smooth;
}

/* 深色模式适配 */
.dark .subscription-group-tabs {
  @apply bg-gray-800/90;
  border-color: rgba(75, 85, 99, 0.3);
}

.dark .group-tab:hover,
.dark :deep(.n-tabs .n-tabs-tab:hover) {
  @apply bg-gray-700/50;
}

.dark :deep(.n-tabs .n-tabs-tab--active) {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
}

/* 标签计数动画 */
:deep(.n-tag) {
  transition: all 0.2s ease;
}

:deep(.n-tabs-tab:hover .n-tag) {
  transform: scale(1.05);
}
</style>