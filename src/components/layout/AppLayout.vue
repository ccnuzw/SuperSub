/**
 * 重构后的应用主布局组件
 * 真正的左右布局：左侧栏从上到下，右侧区域包含顶部搜索和功能页面
 */

<template>
  <div class="app-layout" :class="{ 'app-layout--mobile': isMobile }">
    <div class="app-layout__container">
      <!-- 左侧栏 -->
      <aside
        v-if="showSidebar"
        class="app-layout__sidebar"
        :class="{
          'app-layout__sidebar--collapsed': sidebarCollapsed,
          'app-layout__sidebar--mobile-open': mobileSidebarOpen
        }"
      >
        <Sidebar :collapsed="sidebarCollapsed" @toggle="handleSidebarToggle" />
      </aside>

      <!-- 移动端遮罩 -->
      <div
        v-if="isMobile && mobileSidebarOpen"
        class="app-layout__overlay"
        @click="closeMobileSidebar"
      />

      <!-- 右侧内容区域 -->
      <main
        class="app-layout__main"
        :class="{
          'app-layout__main--full': !showSidebar,
          'app-layout__main--sidebar-collapsed': sidebarCollapsed
        }"
      >
        <!-- 内容区域顶部：动态顶部栏 -->
        <DynamicHeader
          :title="title"
          :description="description"
          :stats-props="headerStatsProps"
          @primary-action="handleHeaderPrimaryAction"
          @menu-action="handleHeaderMenuAction"
        />

        <!-- 页面内容 -->
        <div class="app-layout__content">
          <RouterView v-slot="{ Component, route }">
            <Transition name="page" mode="out-in">
              <component :is="Component" :key="route.path" />
            </Transition>
          </RouterView>
        </div>
      </main>
    </div>

    <!-- 移动端菜单按钮 -->
    <div
      v-if="isMobile && showSidebar"
      class="mobile-menu-button"
      @click="handleMobileMenuToggle"
    >
      <MenuIcon class="w-6 h-6" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, provide } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Sidebar, DynamicHeader } from './index';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { useIsMobile } from '@/composables/useMediaQuery';
import { LAYOUT_CONSTANTS } from './index';
import type { IStandardProps } from '@/utils/componentApiStandards';
import { MenuOutline as MenuIcon } from '@vicons/ionicons5';

interface Props extends IStandardProps {
  // 是否显示侧边栏
  showSidebar?: boolean;
  // 侧边栏是否折叠
  sidebarCollapsed?: boolean;
  // 头部标题
  title?: string;
  // 头部描述
  description?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showSidebar: true,
  sidebarCollapsed: false
});

const emit = defineEmits<{
  'update:sidebarCollapsed': [collapsed: boolean];
  'sidebar-toggle': [collapsed: boolean];
}>();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const isMobile = useIsMobile();

// 响应式数据
const mobileSidebarOpen = ref(false);

// 计算属性 - 简化因为ContentHeader会处理标题逻辑
// 不再需要headerTitle和headerDescription计算属性

// 监听窗口大小变化，处理移动端侧边栏
const handleResize = () => {
  if (!isMobile.value) {
    mobileSidebarOpen.value = false;
  }
};

// 方法
const handleMobileMenuToggle = () => {
  mobileSidebarOpen.value = !mobileSidebarOpen.value;
};

const closeMobileSidebar = () => {
  mobileSidebarOpen.value = false;
};

// 顶部栏统计信息属性
const headerStatsProps = ref<Record<string, any>>({});

// 提供更新统计信息的方法
const updateHeaderStats = (stats: Record<string, any>) => {
  headerStatsProps.value = stats;
};

provide('updateHeaderStats', updateHeaderStats);

// 顶部栏事件处理
const handleHeaderPrimaryAction = (action: string) => {
  // 向当前路由组件发送事件
  const currentComponent = router.currentRoute.value.matched[0]?.components?.default;

  // 这里可以通过事件总线或者其他方式通知当前页面组件
  console.log('Primary action:', action);

  // 暂时通过路由参数传递简单动作
  switch (action) {
    case 'add-subscription':
      // 触发订阅管理的添加订阅功能
      window.dispatchEvent(new CustomEvent('header-action', { detail: { type: 'primary', action } }));
      break;
  }
};

const handleHeaderMenuAction = (action: string) => {
  // 向当前路由组件发送菜单动作
  console.log('Menu action:', action);

  switch (action) {
    case 'bulk-import':
      window.dispatchEvent(new CustomEvent('header-action', { detail: { type: 'menu', action } }));
      break;
    case 'refresh':
      window.dispatchEvent(new CustomEvent('header-action', { detail: { type: 'menu', action } }));
      break;
    case 'export':
      window.dispatchEvent(new CustomEvent('header-action', { detail: { type: 'menu', action } }));
      break;
    default:
      window.dispatchEvent(new CustomEvent('header-action', { detail: { type: 'menu', action } }));
  }
};

const handleSidebarToggle = () => {
  const newCollapsed = !props.sidebarCollapsed;
  emit('update:sidebarCollapsed', newCollapsed);
  emit('sidebar-toggle', newCollapsed);

  // 保存折叠状态到本地存储
  localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed));
};

// 键盘快捷键
const handleKeydown = (event: KeyboardEvent) => {
  // ESC 关闭移动端侧边栏
  if (event.key === 'Escape' && mobileSidebarOpen.value) {
    closeMobileSidebar();
  }
};

// 监听器
watch(() => route.name, () => {
  // 路由变化时关闭移动端侧边栏
  mobileSidebarOpen.value = false;
});

watch(isMobile, (mobile) => {
  if (!mobile) {
    mobileSidebarOpen.value = false;
  }
});

// 生命周期
onMounted(() => {
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeydown);

  // 从本地存储恢复折叠状态
  const savedCollapsed = localStorage.getItem('sidebar-collapsed');
  if (savedCollapsed) {
    try {
      const collapsed = JSON.parse(savedCollapsed);
      emit('update:sidebarCollapsed', collapsed);
    } catch (error) {
      console.error('Failed to parse sidebar collapsed state:', error);
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('keydown', handleKeydown);
});

// 暴露方法给父组件
defineExpose({
  toggleSidebar: (collapsed?: boolean) => {
    if (typeof collapsed === 'boolean') {
      emit('update:sidebarCollapsed', collapsed);
      emit('sidebar-toggle', collapsed);
    } else {
      const newCollapsed = !props.sidebarCollapsed;
      emit('update:sidebarCollapsed', newCollapsed);
      emit('sidebar-toggle', newCollapsed);
    }
  },
  closeMobileSidebar,
  openGlobalSearch: (query?: string) => {
    // 全局搜索功能待实现
    console.log('Global search with query:', query);
  }
});
</script>

<style scoped>
.app-layout {
  @apply h-screen bg-white relative;
}

.app-layout--mobile {
  @apply overflow-hidden;
}

.app-layout__container {
  @apply h-full flex relative;
}

/* 侧边栏样式 */
.app-layout__sidebar {
  @apply h-full bg-white transition-all duration-300 ease-in-out z-30;
  width: 280px;
  flex-shrink: 0;
}

.app-layout__sidebar--collapsed {
  width: 64px;
}

/* 移动端侧边栏 */
.app-layout__sidebar:not(.app-layout__sidebar--mobile-open) {
  @apply fixed left-0 top-0 transform -translate-x-full lg:translate-x-0 lg:relative;
}

.app-layout__sidebar--mobile-open {
  @apply translate-x-0;
}

/* 遮罩层 */
.app-layout__overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden;
}

/* 主内容区域 */
.app-layout__main {
  @apply flex-1 flex flex-col min-h-0 relative;
}

.app-layout__main--full {
  @apply w-full;
}

.app-layout__main--sidebar-collapsed {
  @apply lg:ml-0; /* 不再需要margin，因为是flex布局 */
}

/* 内容区域 */
.app-layout__content {
  @apply flex-1 overflow-y-auto;
  /* 移除内边距，让页面自己控制 */
}

/* 移动端菜单按钮 */
.mobile-menu-button {
  @apply fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-lg border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 lg:hidden;
}

/* 页面切换动画 */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* 响应式优化 */
@media (max-width: 640px) {
  .app-layout__content {
    /* 移除了移动端的内边距 */
  }

  .mobile-menu-button {
    @apply top-3 left-3;
  }
}

/* 深色模式支持 */
.dark .app-layout {
  @apply bg-gray-800;
}

.dark .app-layout__sidebar {
  @apply bg-gray-800;
  /* 移除边框样式 */
}

.dark .app-layout__content {
  /* 移除了深色模式的背景色 */
}

.dark .mobile-menu-button {
  @apply bg-gray-800 border-gray-600 text-gray-400 hover:text-gray-200 hover:bg-gray-700;
}

.dark .app-layout__overlay {
  @apply bg-black bg-opacity-70;
}

/* 减少动画效果（尊重用户偏好） */
@media (prefers-reduced-motion: reduce) {
  .app-layout__sidebar,
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .app-layout__sidebar {
    @apply border-2 border-current;
  }

  .app-layout__overlay {
    @apply bg-opacity-80;
  }
}

/* 打印样式 */
@media print {
  .app-layout__sidebar,
  .app-layout__overlay,
  .mobile-menu-button {
    display: none;
  }

  .app-layout__main {
    @apply w-full;
  }

  .app-layout__content {
    @apply p-0;
  }
}
</style>