/**
 * 右侧内容区域顶部组件
 * 包含全局搜索栏和页面标题 - 单行布局
 */

<template>
  <div class="content-header">
    <!-- 左侧：页面标题 -->
    <div class="content-header__left">
      <div class="page-info">
        <h1 class="page-title">{{ pageTitle }}</h1>
      </div>
    </div>

    <!-- 中间：全局搜索栏 -->
    <div v-if="showSearch" class="content-header__center">
      <div class="search-container">
        <SsInput
          v-model="searchQuery"
          placeholder="全局搜索..."
          prefix-icon="Search"
          clearable
          class="search-input"
          @input="handleSearch"
          @keydown.enter="handleSearchSubmit"
        />
        <SsButton
          variant="primary"
          size="md"
          @click="handleSearchSubmit"
          class="search-button"
        >
          搜索
        </SsButton>
      </div>
    </div>

    <!-- 右侧：操作区域 -->
    <div class="content-header__right">
      <!-- 通知铃铛 -->
      <div class="notification-area">
        <NDropdown
          :options="notificationOptions"
          placement="bottom-end"
          trigger="click"
          @select="handleNotificationAction"
        >
          <div class="notification-bell" :class="{ 'notification-bell--has-unread': hasUnreadNotifications }">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.07 2.82L3 12l7.07 9.18L20 12 10.07 2.82z" />
            </svg>
            <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
          </div>
        </NDropdown>
      </div>

      <!-- 主题切换 -->
      <div class="theme-toggle">
        <SsButton
          variant="ghost"
          size="sm"
          @click="handleThemeToggle"
          :title="isDarkMode ? '切换到浅色模式' : '切换到深色模式'"
        >
          <SunIcon v-if="isDarkMode" class="w-4 h-4" />
          <MoonIcon v-else class="w-4 h-4" />
        </SsButton>
      </div>

      <!-- 用户菜单 -->
      <div class="user-menu">
        <NDropdown
          :options="userMenuOptions"
          placement="bottom-end"
          trigger="click"
          @select="handleUserMenuAction"
        >
          <div class="user-avatar-container">
            <div class="user-avatar">
              <div class="avatar-text">
                {{ userInitial }}
              </div>
            </div>
            <div class="user-info">
              <div class="user-name">{{ authStore.user?.username || 'Unknown User' }}</div>
              <div class="user-role">{{ userRoleText }}</div>
            </div>
          </div>
        </NDropdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { NDropdown } from 'naive-ui';
import { SsButton, SsInput } from '@/components/base';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import {
  SunnyOutline as SunIcon,
  MoonOutline as MoonIcon,
} from '@vicons/ionicons5';

interface IProps {
  title?: string;
  description?: string;
  showSearch?: boolean;
}

const props = withDefaults(defineProps<IProps>(), {
  showSearch: true
});

const emit = defineEmits<{
  search: [query: string];
}>();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const themeStore = useThemeStore();

// 响应式数据
const searchQuery = ref('');

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

const pageDescription = computed(() => {
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

const userInitial = computed(() => {
  const username = authStore.user?.username || '';
  return username.charAt(0).toUpperCase();
});

const userRoleText = computed(() => {
  return authStore.isAdmin ? '管理员' : '普通用户';
});

const isDarkMode = computed(() => themeStore.theme === 'dark');

const hasUnreadNotifications = ref(true);
const unreadCount = ref(3);

// 通知选项
const notificationOptions = [
  {
    label: '查看全部通知',
    key: 'view-all'
  },
  {
    type: 'divider'
  },
  {
    label: '标记全部已读',
    key: 'mark-all-read'
  },
  {
    label: '通知设置',
    key: 'settings'
  }
];

// 用户菜单选项
const userMenuOptions = computed(() => [
  {
    label: '个人资料',
    key: 'profile'
  },
  {
    label: '账户设置',
    key: 'account-settings'
  },
  {
    type: 'divider'
  },
  {
    label: '帮助中心',
    key: 'help'
  },
  {
    label: '关于',
    key: 'about'
  },
  {
    type: 'divider'
  },
  {
    label: '登出',
    key: 'logout'
  }
]);

// 方法
const handleSearch = (value: string) => {
  // 实时搜索（可选）
};

const handleSearchSubmit = () => {
  if (searchQuery.value.trim()) {
    emit('search', searchQuery.value);
  }
};

const handleThemeToggle = () => {
  themeStore.toggleTheme();
};

const handleNotificationAction = (key: string) => {
  switch (key) {
    case 'view-all':
      router.push({ name: 'notifications' });
      break;
    case 'mark-all-read':
      hasUnreadNotifications.value = false;
      unreadCount.value = 0;
      break;
    case 'settings':
      router.push({ name: 'notification-settings' });
      break;
  }
};

const handleUserMenuAction = (key: string) => {
  switch (key) {
    case 'profile':
      router.push({ name: 'user-profile' });
      break;
    case 'account-settings':
      router.push({ name: 'account-settings' });
      break;
    case 'help':
      window.open('/help', '_blank');
      break;
    case 'about':
      // 显示关于对话框
      break;
    case 'logout':
      handleLogout();
      break;
  }
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push({ name: 'login' });
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
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

/* 移除页面描述，保持单行 */
.page-description {
  display: none;
}

.content-header__center {
  @apply flex-1 flex items-center justify-center px-8 max-w-2xl mx-auto;
}

.search-container {
  @apply flex items-center space-x-3 w-full;
}

.search-input {
  @apply flex-1 min-w-0;
}

.search-button {
  @apply flex-shrink-0;
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
@media (max-width: 1200px) {
  .content-header__center {
    @apply px-4;
  }
}

@media (max-width: 1024px) {
  .content-header {
    @apply px-4 py-3;
  }

  .content-header__center {
    @apply px-3;
  }

  .page-title {
    @apply text-xl;
  }

  .user-info {
    @apply hidden;
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

  .content-header__center {
    @apply flex-none px-2 max-w-xs;
  }

  .content-header__right {
    @apply space-x-2;
  }

  .page-title {
    @apply text-lg;
  }

  .search-button {
    @apply px-3 py-2 text-sm;
  }

  .theme-toggle {
    @apply hidden;
  }
}

@media (max-width: 640px) {
  .content-header__center {
    @apply hidden; /* 在小屏幕上隐藏搜索栏以保持单行 */
  }

  .page-title {
    @apply text-base;
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
  .content-header__right,
  .content-header__center {
    display: none;
  }

  .content-header {
    @apply border-0 px-0;
  }
}
</style>