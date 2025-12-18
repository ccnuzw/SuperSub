/**
 * 右侧内容区域顶部组件
 * 简化版：只包含页面标题
 */

<template>
  <div class="content-header">
    <!-- 左侧：页面标题 -->
    <div class="content-header__left">
      <div class="page-info">
        <h1 class="page-title">{{ pageTitle }}</h1>
      </div>
    </div>

    <!-- 中间：留空（移除搜索功能） -->
    <div class="content-header__center">
      <!-- 全局搜索功能已移除 -->
    </div>

    <!-- 右侧：留空（功能已移到左侧栏） -->
    <div class="content-header__right">
      <!-- 预留空间，功能已移到左侧栏 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

interface IProps {
  title?: string;
}

const props = defineProps<IProps>();

const route = useRoute();

// 计算属性
const pageTitle = computed(() => {
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
</script>

<style scoped>
.content-header {
  @apply bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between;
  min-height: 80px;
}

.content-header__left {
  @apply flex items-center flex-shrink-0 min-w-0;
}

.page-info {
  @apply min-w-0;
}

.page-title {
  @apply text-2xl font-bold text-gray-900 truncate;
}

.content-header__center {
  @apply flex-1;
}

.content-header__right {
  @apply flex items-center space-x-3 flex-shrink-0;
}

.notification-area {
  @apply relative;
}

.notification-bell {
  @apply relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200;
}

.notification-bell--has-unread {
  @apply text-primary-600 hover:text-primary-700;
}

.notification-badge {
  @apply absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center;
}

.theme-toggle {
  @apply hidden sm:block;
}

.user-menu {
  @apply relative;
}

.user-avatar-container {
  @apply flex items-center space-x-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200;
}

.user-avatar {
  @apply flex-shrink-0;
}

.avatar-text {
  @apply w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold text-sm;
}

.user-info {
  @apply min-w-0;
}

.user-name {
  @apply font-medium text-gray-900 truncate text-sm;
}

.user-role {
  @apply text-xs text-gray-500 truncate;
}

/* 响应式设计 - 保持单行布局 */
@media (max-width: 1024px) {
  .content-header {
    @apply px-4 py-3;
  }

  .page-title {
    @apply text-xl;
  }
}

@media (max-width: 768px) {
  .content-header {
    @apply px-3 py-2;
    min-height: 64px;
  }

  .content-header__left {
    @apply flex-1;
  }

  .content-header__right {
    @apply space-x-2;
  }

  .page-title {
    @apply text-lg;
  }
}

/* 深色模式支持 */
.dark .content-header {
  @apply bg-gray-800 border-gray-700;
}

.dark .page-title {
  @apply text-gray-100;
}

.dark .notification-bell {
  @apply text-gray-400 hover:text-gray-200 hover:bg-gray-700;
}

.dark .user-avatar-container {
  @apply hover:bg-gray-700;
}

.dark .user-name {
  @apply text-gray-100;
}

.dark .user-role {
  @apply text-gray-400;
}

/* 动画效果 */
.notification-bell,
.theme-toggle button,
.user-avatar-container {
  transition: all 0.2s ease;
}

.notification-bell:hover,
.theme-toggle button:hover,
.user-avatar-container:hover {
  transform: translateY(-1px);
}

/* 聚焦状态 */
.notification-bell:focus-visible,
.theme-toggle button:focus-visible,
.user-avatar-container:focus-visible {
  @apply ring-2 ring-primary-500 ring-offset-2 outline-none;
}

.dark .theme-toggle button:focus-visible,
.dark .user-avatar-container:focus-visible {
  @apply ring-offset-gray-800;
}

/* 打印时隐藏不必要的元素 */
@media print {
  .content-header__right {
    display: none;
  }

  .content-header {
    @apply border-0 px-0;
  }
}
</style>