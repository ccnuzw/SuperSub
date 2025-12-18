/**
 * 节点分组标签组件
 * 与订阅管理分组标签保持一致的样式
 */

<template>
  <div class="node-group-tabs">
    <n-tabs
      :value="activeTab"
      type="line"
      :bar-width="40"
      @update:value="$emit('update:active-tab', $event)"
    >
      <n-tab-pane name="all" tab="全部节点">
        <template #tab>
          <n-space align="center">
            <span>全部节点</span>
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
            class="group-tab"
            @click="$emit('group-click', group, $event)"
            @contextmenu="$emit('group-context-menu', group, $event)"
          >
            <n-space align="center">
              <n-icon v-if="group.icon" :color="group.color">
                <component :is="group.icon" />
              </n-icon>
              <span>{{ group.name }}</span>
              <n-tag
                size="small"
                :type="group.node_count === 0 ? 'default' : 'primary'"
                :bordered="false"
              >
                {{ group.node_count }}
              </n-tag>
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
import { computed } from 'vue'
import { NTabs, NTabPane, NSpace, NTag, NButton, NIcon } from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'

interface IGroup {
  id: string
  name: string
  node_count: number
  icon?: any
  color?: string
}

interface IProps {
  activeTab: string
  groups: IGroup[]
  loading?: boolean
  totalCount?: number
}

const props = withDefaults(defineProps<IProps>(), {
  groups: () => [],
  loading: false,
  totalCount: 0
})

defineEmits<{
  'update:active-tab': [tab: string]
  'group-click': [group: IGroup, event: MouseEvent]
  'group-context-menu': [group: IGroup, event: MouseEvent]
  'add-group': []
}>()
</script>

<style scoped>
.node-group-tabs {
  @apply w-full bg-white rounded-lg shadow-sm;
  border: 1px solid rgba(0, 0, 0, 0.06);
  /* 减少内部padding，让内容更紧凑 */
  padding: 8px;
}

.group-tab {
  @apply cursor-pointer px-3 py-2 rounded-lg transition-all duration-200;
}

.group-tab:hover {
  @apply bg-gray-100/50;
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
  .node-group-tabs {
    @apply w-full;
  }

  /* 响应式标签页 */
  :deep(.n-tabs .n-tabs-tab) {
    @apply px-2.5 py-1;
    min-width: 70px; /* 最小宽度，但会根据内容自适应 */
  }

  :deep(.n-tabs .n-tabs-nav) {
    @apply px-2 py-1;
  }
}

/* 更大屏幕优化 */
@media (min-width: 1600px) {
  :deep(.n-tabs .n-tabs-tab) {
    @apply px-3 py-1.5;
    min-width: 90px;
  }

  :deep(.n-tabs .n-tabs-nav) {
    @apply px-2 py-1;
  }
}

/* 超大屏幕优化 */
@media (min-width: 1920px) {
  :deep(.n-tabs .n-tabs-tab) {
    @apply px-4 py-2;
    min-width: 110px;
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
.dark .node-group-tabs {
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