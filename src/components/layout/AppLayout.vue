/**
 * 重构后的应用主布局组件
 * 使用新的设计系统和基础组件
 */

<template>
  <div class="app-layout" :class="{ 'app-layout--mobile': isMobile }">
    <!-- 应用头部 -->
    <AppHeader
      :title="headerTitle"
      :description="headerDescription"
      :show-search="showSearch"
      @menu-toggle="handleMobileMenuToggle"
      @search="handleGlobalSearch"
    />

    <div class="app-layout__body">
      <!-- 侧边栏 -->
      <aside
        v-if="showSidebar"
        class="app-layout__sidebar"
        :class="{
          'app-layout__sidebar--collapsed': sidebarCollapsed,
          'app-layout__sidebar--mobile-open': mobileSidebarOpen
        }"
      >
        <Sidebar />
      </aside>

      <!-- 移动端遮罩 -->
      <div
        v-if="isMobile && mobileSidebarOpen"
        class="app-layout__overlay"
        @click="closeMobileSidebar"
      />

      <!-- 主内容区域 -->
      <main
        class="app-layout__main"
        :class="{
          'app-layout__main--full': !showSidebar,
          'app-layout__main--sidebar-collapsed': sidebarCollapsed
        }"
      >
        <div class="app-layout__content">
          <RouterView v-slot="{ Component, route }">
            <Transition name="page" mode="out-in">
              <component :is="Component" :key="route.path" />
            </Transition>
          </RouterView>
        </div>
      </main>
    </div>

    <!-- 全局搜索结果弹窗 -->
    <NModal
      v-model:show="showGlobalSearch"
      preset="card"
      class="w-[600px] max-w-[90vw]"
      title="全局搜索"
    >
      <GlobalSearchResults
        :query="globalSearchQuery"
        @result-click="handleSearchResultClick"
        @close="showGlobalSearch = false"
      />
    </NModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { NModal } from 'naive-ui';
import { AppHeader, Sidebar } from './index';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { useIsMobile } from '@/composables/useMediaQuery';
import { LAYOUT_CONSTANTS } from './index';
import GlobalSearchResults from '@/components/common/GlobalSearchResults.vue';
import type { IStandardProps } from '@/utils/componentApiStandards';

interface Props extends IStandardProps {
  // 是否显示侧边栏
  showSidebar?: boolean;
  // 侧边栏是否折叠
  sidebarCollapsed?: boolean;
  // 是否显示搜索
  showSearch?: boolean;
  // 头部标题
  title?: string;
  // 头部描述
  description?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showSidebar: true,
  sidebarCollapsed: false,
  showSearch: true
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
const globalSearchQuery = ref('');
const showGlobalSearch = ref(false);

// 计算属性
const headerTitle = computed(() => {
  if (props.title) return props.title;

  // 根据路由自动生成页面标题
  const titleMap: Record<string, string> = {
    home: '仪表板',
    subscriptions: '订阅管理',
    nodes: '节点管理',
    profiles: '配置文件',
    'user-management': '用户管理',
    settings: '系统设置'
  };

  return titleMap[route.name as string] || 'SuperSub';
});

const headerDescription = computed(() => {
  if (props.description) return props.description;

  const descriptionMap: Record<string, string> = {
    home: '查看系统概览和快速操作',
    subscriptions: '管理和监控订阅源',
    nodes: '管理代理节点和连接状态',
    profiles: '创建和管理配置文件',
    'user-management': '管理用户账户和权限',
    settings: '配置系统参数和个人偏好'
  };

  return descriptionMap[route.name as string];
});

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

const handleGlobalSearch = (query: string) => {
  if (query.trim()) {
    globalSearchQuery.value = query;
    showGlobalSearch.value = true;
  }
};

const handleSearchResultClick = (result: any) => {
  showGlobalSearch.value = false;
  globalSearchQuery.value = '';

  if (result.route) {
    router.push(result.route);
  }
};

// 键盘快捷键
const handleKeydown = (event: KeyboardEvent) => {
  // Ctrl/Cmd + K 打开全局搜索
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    showGlobalSearch.value = !showGlobalSearch.value;
  }

  // ESC 关闭搜索
  if (event.key === 'Escape' && showGlobalSearch.value) {
    showGlobalSearch.value = false;
  }

  // ESC 关闭移动端侧边栏
  if (event.key === 'Escape' && mobileSidebarOpen.value) {
    closeMobileSidebar();
  }
};

// 监听器
watch(() => route.name, () => {
  // 路由变化时关闭移动端侧边栏和搜索
  mobileSidebarOpen.value = false;
  showGlobalSearch.value = false;
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
    if (query) {
      globalSearchQuery.value = query;
      showGlobalSearch.value = true;
    } else {
      showGlobalSearch.value = true;
    }
  }
});
</script>

<style scoped>
.app-layout {
  @apply h-screen flex flex-col bg-gray-50;
}

.app-layout--mobile {
  @apply overflow-hidden;
}

.app-layout__body {
  @apply flex flex-1 relative overflow-hidden;
}

/* 侧边栏样式 */
.app-layout__sidebar {
  @apply fixed left-0 top-16 z-40 h-[calc(100vh-64px)] transition-transform duration-300 ease-in-out lg:relative lg:top-0 lg:z-0;
  width: 280px;
}

.app-layout__sidebar--collapsed {
  @apply w-16;
}

.app-layout__sidebar--mobile-open {
  @apply translate-x-0;
}

/* 移动端侧边栏默认隐藏 */
.app-layout__sidebar:not(.app-layout__sidebar--mobile-open) {
  @apply -translate-x-full lg:translate-x-0;
}

/* 遮罩层 */
.app-layout__overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden;
}

/* 主内容区域 */
.app-layout__main {
  @apply flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out;
  margin-left: 0;
}

.app-layout__main--full {
  @apply ml-0;
}

.app-layout__main--sidebar-collapsed {
  @apply lg:ml-16;
}

.app-layout__main:not(.app-layout__main--full):not(.app-layout__main--sidebar-collapsed) {
  @apply lg:ml-72;
}

.app-layout__content {
  @apply flex-1 overflow-y-auto p-4 lg:p-6;
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
    @apply p-3;
  }
}

/* 深色模式支持 */
.dark .app-layout {
  @apply bg-gray-900;
}

.dark .app-layout__sidebar {
  @apply bg-gray-800 border-gray-700;
}

.dark .app-layout__overlay {
  @apply bg-black bg-opacity-70;
}

/* 减少动画效果（尊重用户偏好） */
@media (prefers-reduced-motion: reduce) {
  .app-layout__sidebar,
  .app-layout__main,
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
  .app-layout__overlay {
    display: none;
  }

  .app-layout__main {
    @apply ml-0;
  }
}
</style>