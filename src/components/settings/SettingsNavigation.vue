/**
 * 设置导航组件
 * 与节点管理分组标签保持一致的设计风格
 * 遵循单一职责原则，专注于设置导航功能
 */

<template>
  <div class="settings-navigation">
    <n-tabs
      :value="activeTab"
      type="line"
      :bar-width="40"
      tab-style="min-width: 120px;"
      @update:value="handleTabChange"
      class="navigation-tabs"
    >
      <n-tab-pane
        v-for="tab in navigationTabs"
        :key="tab.key"
        :name="tab.key"
      >
        <template #tab>
          <div class="navigation-tab">
            <n-space align="center">
              <n-icon v-if="tab.icon" :color="tab.color">
                <component :is="tab.icon" />
              </n-icon>
              <span>{{ tab.label }}</span>
              <n-tag
                v-if="tab.badge"
                size="small"
                :type="tab.badge.type"
                :bordered="false"
              >
                {{ tab.badge.text }}
              </n-tag>
            </n-space>
          </div>
        </template>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NTabs, NTabPane, NSpace, NTag, NIcon } from 'naive-ui'
import {
  NotificationsOutline as NotificationIcon,
  KeyOutline as TokenIcon,
  ShieldCheckmarkOutline as PasswordIcon,
  SettingsOutline as ConversionIcon
} from '@vicons/ionicons5'

/**
 * 设置导航标签接口定义
 */
interface ISettingsTab {
  key: string
  label: string
  icon?: any
  color?: string
  badge?: {
    text: string
    type: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  }
}

/**
 * 组件属性接口
 */
interface IProps {
  activeTab: string
}

const props = withDefaults(defineProps<IProps>(), {
  activeTab: 'notifications'
})

const emit = defineEmits<{
  'update:active-tab': [tab: string]
  'tab-change': [tab: string]
}>()

/**
 * 设置导航标签配置
 * 遵循功能域组织原则
 */
const navigationTabs: ISettingsTab[] = [
  {
    key: 'notifications',
    label: '通知设置',
    icon: NotificationIcon,
    color: '#22c55e',
  },
  {
    key: 'token',
    label: '令牌设置',
    icon: TokenIcon,
    color: '#f59e0b',
  },
  {
    key: 'password',
    label: '密码修改',
    icon: PasswordIcon,
    color: '#3b82f6',
  },
  {
    key: 'conversion',
    label: '转换设置',
    icon: ConversionIcon,
    color: '#8b5cf6',
  }
]

/**
 * 处理标签切换事件
 * 遵循事件命名规范：handle + 动作 + On + 目标
 */
const handleTabChange = (tab: string) => {
  emit('update:active-tab', tab)
  emit('tab-change', tab)
}
</script>

<style scoped>
/* 导航容器样式 */
.settings-navigation {
  @apply w-full bg-white rounded-lg shadow-sm p-1.5;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* 导航标签样式 */
.navigation-tab {
  @apply cursor-pointer px-3 py-2 rounded-lg transition-all duration-200;
}

.navigation-tab:hover {
  @apply bg-gray-100/50;
}

/* 标签页样式优化 - 与节点管理保持一致 */
:deep(.navigation-tabs) {
  @apply w-full;
}

:deep(.navigation-tabs .n-tabs-nav) {
  @apply px-2 py-0.5;
}

:deep(.navigation-tabs .n-tabs-tab) {
  @apply px-2.5 py-1 rounded-lg font-medium transition-all duration-200;
  min-height: 28px;
}

:deep(.navigation-tabs .n-tabs-tab:hover) {
  @apply bg-gray-100/50;
}

:deep(.navigation-tabs .n-tabs-tab--active) {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%);
  @apply text-primary-600 font-semibold;
}

:deep(.navigation-tabs .n-tabs-bar) {
  @apply rounded-full;
}

/* 响应式设计 */
@media (min-width: 1200px) {
  :deep(.navigation-tabs .n-tabs-tab) {
    @apply px-3 py-1.5;
    min-width: 120px;
  }
}

@media (min-width: 1600px) {
  :deep(.navigation-tabs .n-tabs-tab) {
    @apply px-4 py-2;
    min-width: 140px;
  }
}

/* 移动端适配 */
@media (max-width: 640px) {
  :deep(.navigation-tabs .n-tabs-tab) {
    @apply px-2 py-1.5 text-sm;
    min-height: 36px;
    min-width: 100px;
  }

  .navigation-tab {
    @apply px-2 py-1;
  }
}

/* 滚动优化 */
:deep(.navigation-tabs .n-tabs-nav-scroll-wrapper) {
  @apply scroll-smooth;
}

/* 深色模式适配 */
.dark .settings-navigation {
  @apply bg-gray-800/90;
  border-color: rgba(75, 85, 99, 0.3);
}

.dark .navigation-tab:hover,
.dark :deep(.navigation-tabs .n-tabs-tab:hover) {
  @apply bg-gray-700/50;
}

.dark :deep(.navigation-tabs .n-tabs-tab--active) {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
}

/* 标签动画 */
:deep(.n-tag) {
  transition: all 0.2s ease;
}

:deep(.n-tabs-tab:hover .n-tag) {
  transform: scale(1.05);
}
</style>