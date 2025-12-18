/**
 * 动态顶部栏组件
 * 根据当前页面动态显示不同的统计信息和功能菜单
 */

<template>
  <div class="dynamic-header">
    <!-- 左侧：页面标题 -->
    <div class="dynamic-header__left">
      <div class="page-info">
        <h1 class="page-title">{{ pageTitle }}</h1>
        <p v-if="pageDescription" class="page-description">{{ pageDescription }}</p>
      </div>
    </div>

    <!-- 右侧：功能菜单区域 -->
    <div class="dynamic-header__right">
      <div class="function-menu">
        <!-- 统计信息 -->
        <component
          :is="statsComponent"
          v-if="statsComponent && statsProps && Object.keys(statsProps).length > 0"
          v-bind="statsProps || {}"
          class="stats-component-inline"
        />

        <!-- 主要功能按钮 -->
        <n-button
          v-if="primaryAction"
          type="primary"
          size="small"
          @click="handlePrimaryAction"
          class="primary-action-btn"
        >
          <template #icon>
            <n-icon size="16"><component :is="primaryAction.icon" /></n-icon>
          </template>
          {{ primaryAction.text }}
        </n-button>

        <!-- 折叠菜单 -->
        <n-dropdown
          :options="menuOptions"
          placement="bottom-end"
          @select="handleMenuAction"
          v-if="menuOptions.length > 0"
        >
          <n-button circle size="small" class="more-menu-btn" quaternary>
            <template #icon>
              <n-icon size="16"><EllipsisVerticalOutline /></n-icon>
            </template>
          </n-button>
        </n-dropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NIcon, NDropdown } from 'naive-ui'
import {
  EllipsisVerticalOutline,
  AddOutline,
  DownloadOutline,
  RefreshOutline,
  SettingsOutline,
  TrashOutline,
  SyncOutline,
  CheckmarkCircleOutline
} from '@vicons/ionicons5'
import type { DropdownOption } from 'naive-ui'

// 导入页面特定的统计组件
import SubscriptionStats from '@/components/subscriptions/SubscriptionStats.vue'

interface IProps {
  // 统计组件的属性
  statsProps?: Record<string, any>
}

const props = defineProps<IProps>()

const route = useRoute()
const router = useRouter()

// 页面标题配置
const pageConfig = computed(() => {
  const configMap: Record<string, {
    title: string
    description: string
    statsComponent: any
    primaryAction?: {
      text: string
      icon: any
      action: string
    }
    menuItems: {
      label: string
      key: string
      icon?: any
      show?: boolean
      type?: 'divider'
    }[]
  }> = {
    subscriptions: {
      title: '订阅管理',
      description: '管理和配置代理订阅源',
      statsComponent: SubscriptionStats,
      primaryAction: {
        text: '添加订阅',
        icon: AddOutline,
        action: 'add-subscription'
      },
      menuItems: [
        { label: '批量导入', key: 'bulk-import', icon: AddOutline },
        { label: '刷新数据', key: 'refresh', icon: RefreshOutline },
        { label: '导出订阅', key: 'export', icon: DownloadOutline },
        { label: '重试失败', key: 'retry-failed', icon: RefreshOutline, show: false },
        { label: '清除失败', key: 'clear-failed', icon: TrashOutline, show: false },
        { label: '---', key: 'divider-1', type: 'divider' as const },
        { label: '新建分组', key: 'create-group', icon: SettingsOutline },
        { label: '分组管理', key: 'group-management', icon: SettingsOutline }
      ]
    },
    nodes: {
      title: '节点管理',
      description: '管理和配置代理节点',
      statsComponent: null, // 暂时没有节点统计组件
      primaryAction: {
        text: '添加节点',
        icon: AddOutline,
        action: 'add-node'
      },
      menuItems: [
        { label: '批量导入', key: 'bulk-import', icon: AddOutline },
        { label: '刷新状态', key: 'refresh', icon: RefreshOutline },
        { label: '导出节点', key: 'export', icon: DownloadOutline },
        { label: '批量测试', key: 'batch-test', icon: SyncOutline },
        { label: '---', key: 'divider-1', type: 'divider' as const },
        { label: '清理无效节点', key: 'cleanup', icon: TrashOutline }
      ]
    },
    profiles: {
      title: '配置文件',
      description: '管理订阅配置文件',
      statsComponent: null, // 暂时没有配置文件统计组件
      menuItems: [
        { label: '创建配置', key: 'create-profile', icon: AddOutline },
        { label: '导入配置', key: 'import-profile', icon: DownloadOutline },
        { label: '批量生成', key: 'bulk-generate', icon: SettingsOutline }
      ]
    },
    settings: {
      title: '系统设置',
      description: '配置系统参数',
      statsComponent: null,
      menuItems: [
        { label: '重置设置', key: 'reset', icon: RefreshOutline },
        { label: '导出配置', key: 'export-config', icon: DownloadOutline },
        { label: '导入配置', key: 'import-config', icon: AddOutline }
      ]
    }
  }

  return configMap[route.name as string] || {
    title: 'SuperSub',
    description: '',
    statsComponent: null,
    menuItems: []
  }
})

// 计算属性
const pageTitle = computed(() => pageConfig.value.title)
const pageDescription = computed(() => pageConfig.value.description)
const statsComponent = computed(() => pageConfig.value.statsComponent)
const primaryAction = computed(() => pageConfig.value.primaryAction)

// 菜单选项
const menuOptions = computed(() => {
  const options: DropdownOption[] = []

  pageConfig.value.menuItems.forEach(item => {
    // 检查是否应该显示（对于条件性显示的项）
    if ('show' in item && item.show === false) {
      return
    }

    if ('type' in item && item.type === 'divider') {
      options.push({ type: 'divider' })
    } else if (!('type' in item)) {
      options.push({
        label: item.label,
        key: item.key,
        icon: item.icon ? () => h(NIcon, null, () => h(item.icon)) : undefined
      })
    }
  })

  return options
})

// 事件处理
const emit = defineEmits<{
  'primary-action': [action: string]
  'menu-action': [action: string]
}>()

const handlePrimaryAction = () => {
  if (primaryAction.value) {
    emit('primary-action', primaryAction.value.action)
  }
}

const handleMenuAction = (key: string) => {
  emit('menu-action', key)
}

// 暴露方法供父组件调用（用于更新动态状态，如重试失败按钮的显示）
const updateMenuState = (state: Record<string, boolean>) => {
  // 这里可以实现菜单项状态的动态更新
  // 例如根据是否有失败的订阅来显示重试失败按钮
}

defineExpose({
  updateMenuState
})
</script>

<style scoped>
.dynamic-header {
  @apply bg-white px-6 py-3 flex items-center justify-between;
  min-height: 64px;
}

.dynamic-header__left {
  @apply flex items-center flex-shrink-0 min-w-0;
}

.page-info {
  @apply min-w-0;
}

.page-title {
  @apply text-2xl font-bold text-gray-900 truncate mb-1;
}

.page-description {
  @apply text-sm text-gray-600 truncate;
}

.dynamic-header__center {
  @apply flex-1 flex items-center justify-center px-6;
  min-width: 0;
  max-width: 600px;
}

.stats-component {
  @apply w-full max-w-2xl;
}

.dynamic-header__right {
  @apply flex items-center space-x-3 flex-shrink-0;
}

.function-menu {
  @apply flex items-center space-x-2;
}

.stats-component-inline {
  @apply mr-2;
}

.primary-action-btn {
  @apply transition-all duration-200 hover:scale-[1.02] hover:shadow-md;
  font-weight: 500;
}

.more-menu-btn {
  @apply transition-all duration-200 hover:scale-[1.02] hover:shadow-md;
}

/* 响应式设计 - 更细粒度的断点控制 */
@media (max-width: 1400px) {
  .dynamic-header__center {
    max-width: 500px;
  }
}

@media (max-width: 1200px) {
  .dynamic-header {
    @apply px-5 py-3;
    min-height: 64px;
  }

  .dynamic-header__center {
    @apply px-4;
    max-width: 450px;
  }
}

@media (max-width: 1024px) {
  .dynamic-header {
    @apply px-4 py-2.5;
    min-height: 60px;
  }

  .page-title {
    @apply text-xl;
  }

  .dynamic-header__center {
    @apply px-3;
    max-width: 350px;
  }
}

@media (max-width: 900px) {
  .dynamic-header {
    @apply px-4 py-2;
    min-height: 60px;
  }

  .page-title {
    @apply text-lg;
  }

  .page-description {
    @apply hidden;
  }

  .dynamic-header__center {
    @apply px-3;
    max-width: 300px;
  }

  .function-menu {
    @apply space-x-1;
  }

  .primary-action-btn {
    @apply px-3 py-1.5 text-sm;
  }
}

@media (max-width: 800px) {
  .dynamic-header {
    @apply px-3 py-2;
    min-height: 56px;
  }

  .page-title {
    @apply text-base;
  }

  .dynamic-header__center {
    @apply px-2;
    max-width: 250px;
  }

  .function-menu {
    @apply space-x-0.5;
  }

  .primary-action-btn {
    @apply px-2 py-1 text-xs;
  }

  .more-menu-btn {
    @apply w-8 h-8;
  }
}

@media (max-width: 768px) {
  .dynamic-header {
    @apply px-3 py-2;
    min-height: 56px;
  }

  .page-title {
    @apply text-base;
  }

  .page-description {
    @apply hidden;
  }

  .dynamic-header__center {
    @apply px-2;
    max-width: 200px;
  }

  .function-menu {
    @apply space-x-0.5;
  }

  .primary-action-btn {
    @apply px-2 py-1 text-xs;
  }

  .more-menu-btn {
    @apply w-7 h-7;
  }
}

@media (max-width: 640px) {
  .dynamic-header {
    @apply px-2 py-1.5;
    min-height: 52px;
  }

  .page-title {
    @apply text-sm font-semibold;
    margin-bottom: 0;
  }

  .dynamic-header__left {
    @apply min-w-0 flex-1;
  }

  .dynamic-header__center {
    @apply px-1;
    max-width: 150px;
    flex: 0 0 auto;
  }

  .dynamic-header__right {
    @apply flex-shrink-0;
  }

  .function-menu {
    @apply space-x-0;
  }

  .primary-action-btn {
    @apply px-1.5 py-0.5 text-xs min-w-0;
  }

  .more-menu-btn {
    @apply w-6 h-6;
  }

  /* 在极小屏幕下隐藏次要元素 */
  .stats-component {
    @apply hidden;
  }
}

@media (max-width: 480px) {
  .dynamic-header {
    @apply px-1.5 py-1;
    min-height: 48px;
  }

  .page-title {
    @apply text-xs font-semibold;
  }

  .dynamic-header__center {
    @apply hidden;
  }

  .primary-action-btn {
    @apply px-1 py-0.5 text-xs;
  }

  .more-menu-btn {
    @apply w-5 h-5;
  }
}

/* 深色模式支持 */
.dark .dynamic-header {
  @apply bg-gray-800;
}

.dark .page-title {
  @apply text-gray-100;
}

.dark .page-description {
  @apply text-gray-400;
}

/* 悬停效果 */
.function-menu .n-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark .function-menu .n-button:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 动画效果 */
.dynamic-header {
  transition: all 0.3s ease;
}

.stats-component {
  animation: fadeInScale 0.4s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>