/**
 * 侧边栏导航组件
 * 使用新的设计系统和基础组件重构
 */

<template>
  <div class="sidebar" :class="{ 'sidebar--collapsed': collapsed }">
    <!-- Logo区域 -->
    <div class="sidebar__logo">
      <div class="logo">
        <img
          src="/vite.svg"
          alt="SuperSub"
          class="logo__icon"
          onerror="this.style.display='none'"
        />
        <h1 class="logo__text">SuperSub</h1>
      </div>
    </div>

    <!-- 导航菜单 -->
    <nav class="sidebar__nav">
      <div class="nav-section">
        <div class="nav-section__title">主要功能</div>
        <div class="nav-items">
          <RouterLink
            v-for="item in mainMenuItems"
            :key="item.key"
            :to="item.to"
            class="nav-item"
            :class="{ 'nav-item--active': isActiveRoute(item.to) }"
            :title="collapsed ? item.label : undefined"
          >
            <component :is="item.icon" class="nav-item__icon" />
            <span class="nav-item__text">{{ item.label }}</span>
            <SsBadge
              v-if="item.badge && !collapsed"
              :variant="item.badge.variant"
              size="sm"
              class="nav-item__badge"
            >
              {{ item.badge.text }}
            </SsBadge>
          </RouterLink>
        </div>
      </div>

      <!-- 管理员菜单 -->
      <div v-if="authStore.isAdmin" class="nav-section">
        <div class="nav-section__title">系统管理</div>
        <div class="nav-items">
          <RouterLink
            v-for="item in adminMenuItems"
            :key="item.key"
            :to="item.to"
            class="nav-item"
            :class="{ 'nav-item--active': isActiveRoute(item.to) }"
            :title="collapsed ? item.label : undefined"
          >
            <component :is="item.icon" class="nav-item__icon" />
            <span class="nav-item__text">{{ item.label }}</span>
          </RouterLink>
        </div>
      </div>

      <!-- 设置菜单 -->
      <div class="nav-section">
        <div class="nav-section__title">设置</div>
        <div class="nav-items">
          <RouterLink
            v-for="item in settingMenuItems"
            :key="item.key"
            :to="item.to"
            class="nav-item"
            :class="{ 'nav-item--active': isActiveRoute(item.to) }"
            :title="collapsed ? item.label : undefined"
          >
            <component :is="item.icon" class="nav-item__icon" />
            <span class="nav-item__text">{{ item.label }}</span>
          </RouterLink>

          <!-- 登出按钮 -->
          <button
            class="nav-item nav-item--logout"
            @click="handleLogout"
            title="登出"
          >
            <LogoutIcon class="nav-item__icon" />
            <span class="nav-item__text">登出</span>
          </button>
        </div>
      </div>
    </nav>

    <!-- 功能区域 (原顶部栏功能) -->
    <div class="sidebar__functions">
      <!-- 通知区域 -->
      <div class="function-item" :title="collapsed ? '通知' : undefined">
        <button
          class="function-button notification-bell"
          :class="{ 'notification-bell--has-unread': hasUnreadNotifications }"
          @click="handleNotifications"
        >
          <component :is="NotificationsIcon" class="function-icon" />
          <span class="function-text">通知</span>
          <SsBadge
            v-if="hasUnreadNotifications && !collapsed"
            variant="error"
            size="sm"
            class="notification-badge"
          >
            3
          </SsBadge>
        </button>
      </div>

      <!-- 主题切换 -->
      <div class="function-item" :title="collapsed ? '切换主题' : undefined">
        <button
          class="function-button theme-toggle"
          @click="toggleTheme"
        >
          <component :is="themeIcon" class="function-icon" />
          <span class="function-text">主题</span>
        </button>
      </div>

      <!-- 用户菜单 -->
      <div class="function-item" :title="collapsed ? '用户菜单' : undefined">
        <div class="user-menu">
          <button
            class="function-button user-avatar-container"
            @click="toggleUserMenu"
          >
            <div class="user-avatar avatar-text">
              {{ userInitial }}
            </div>
            <span v-if="!collapsed" class="function-text user-name">{{ authStore.user?.username || 'Unknown User' }}</span>
            <span v-if="!collapsed" class="function-text user-role">{{ userRoleText }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 右侧中部折叠按钮 -->
    <button
      class="sidebar-collapse-btn"
      @click="handleToggle"
      :title="collapsed ? '展开侧边栏' : '折叠侧边栏'"
    >
      <component :is="collapsed ? MenuExpandIcon : MenuCollapseIcon" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useThemeStore } from '@/stores/theme';
import { useMessage } from 'naive-ui';
import { SsBadge } from '@/components/base';
import {
  HomeOutline as HomeIcon,
  CloudDownloadOutline as SubscriptionIcon,
  HardwareChipOutline as NodeIcon,
  PersonCircleOutline as ProfileIcon,
  PeopleOutline as PeopleIcon,
  SettingsOutline as SettingsIcon,
  LogOutOutline as LogoutIcon,
  ChevronForwardOutline as MenuExpandIcon,
  ChevronBackOutline as MenuCollapseIcon,
  NotificationsOutline as NotificationsIcon,
  SunnyOutline as LightIcon,
  MoonOutline as DarkIcon,
  ConstructOutline as SystemIcon
} from '@vicons/ionicons5';

interface IMenuItem {
  key: string;
  label: string;
  to: { name: string };
  icon: any;
  badge?: {
    text: string;
    variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  };
}

interface Props {
  collapsed?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false
});

const emit = defineEmits<{
  toggle: [];
}>();

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const message = useMessage();

// 功能相关状态
const hasUnreadNotifications = ref(true);
const showUserMenu = ref(false);

// 计算属性
const userInitial = computed(() => {
  const username = authStore.user?.username || '';
  return username.charAt(0).toUpperCase();
});

const userRoleText = computed(() => {
  return authStore.isAdmin ? '管理员' : '普通用户';
});

const themeIcon = computed(() => {
  return themeStore.theme === 'dark' ? LightIcon : DarkIcon;
});

// 菜单项定义
const mainMenuItems: IMenuItem[] = [
  {
    key: 'dashboard',
    label: '仪表板',
    to: { name: 'home' },
    icon: HomeIcon,
  },
  {
    key: 'subscriptions',
    label: '订阅管理',
    to: { name: 'subscriptions' },
    icon: SubscriptionIcon,
    badge: {
      text: '3',
      variant: 'primary'
    }
  },
  {
    key: 'nodes',
    label: '节点管理',
    to: { name: 'nodes' },
    icon: NodeIcon,
  },
  {
    key: 'profiles',
    label: '配置文件',
    to: { name: 'profiles' },
    icon: ProfileIcon,
  },
];

const adminMenuItems: IMenuItem[] = [
  {
    key: 'user-management',
    label: '用户管理',
    to: { name: 'user-management' },
    icon: PeopleIcon,
  },
];

const settingMenuItems: IMenuItem[] = [
  {
    key: 'settings',
    label: '系统设置',
    to: { name: 'settings' },
    icon: SettingsIcon,
  },
];

// 方法
const isActiveRoute = (to: { name: string }): boolean => {
  return route.name === to.name;
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push({ name: 'login' });
  } catch (error) {
    console.error('Logout failed:', error);
  }
};

const handleToggle = () => {
  emit('toggle');
};

// 新功能方法
const handleNotifications = () => {
  message.info('通知功能开发中...');
  hasUnreadNotifications.value = false;
};

const toggleTheme = () => {
  themeStore.toggleTheme();
  message.success(`已切换到${themeStore.theme === 'dark' ? '深色' : '浅色'}主题`);
};

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
  if (showUserMenu.value) {
    message.info('用户菜单功能开发中...');
  }
};
</script>

<style scoped>
.sidebar {
  @apply flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out;
  width: 280px;
}

.sidebar--collapsed {
  width: 64px;
}

.sidebar__logo {
  @apply p-6 border-b border-gray-200 transition-all duration-300 ease-in-out;
}

.sidebar--collapsed .sidebar__logo {
  @apply p-4;
}

.logo {
  @apply flex items-center space-x-3;
}

.sidebar--collapsed .logo {
  @apply justify-center;
}

.logo__icon {
  @apply w-8 h-8 flex-shrink-0;
}

.logo__text {
  @apply text-xl font-bold text-gray-900 transition-opacity duration-300;
}

.sidebar--collapsed .logo__text {
  @apply opacity-0 sr-only;
}

/* 功能区域 (原顶部栏功能) */
.sidebar__functions {
  @apply px-3 py-4 border-t border-gray-200 space-y-2 transition-all duration-300;
}

.sidebar--collapsed .sidebar__functions {
  @apply px-2 py-3;
}

.function-item {
  @apply relative;
}

.function-button {
  @apply w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200 relative;
}

.sidebar--collapsed .function-button {
  @apply justify-center px-2;
}

.function-icon {
  @apply w-5 h-5 flex-shrink-0;
}

.function-text {
  @apply flex-1 font-medium text-left transition-all duration-300;
}

.sidebar--collapsed .function-text {
  @apply opacity-0 sr-only;
}

/* 通知相关样式 */
.notification-bell {
  @apply relative;
}

.notification-bell--has-unread {
  @apply text-primary-600 hover:text-primary-700;
}

.notification-badge {
  @apply absolute top-2 right-3;
}

.sidebar--collapsed .notification-badge {
  @apply top-1 right-1;
}

/* 用户菜单相关样式 */
.user-menu {
  @apply relative;
}

.user-avatar-container {
  @apply space-x-3;
}

.user-avatar {
  @apply w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0;
}

.user-name {
  @apply font-medium text-gray-900 truncate;
}

.user-role {
  @apply text-xs text-gray-500 truncate;
}

/* 右侧中部折叠按钮 */
.sidebar-collapse-btn {
  @apply absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border border-gray-300 rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-200 z-20 text-gray-600 hover:text-gray-900;
}

.sidebar-collapse-btn svg {
  @apply w-4 h-4;
}

.sidebar__nav {
  @apply flex-1 overflow-y-auto p-4 space-y-6 transition-all duration-300;
}

.sidebar--collapsed .sidebar__nav {
  @apply p-2;
}

.nav-section {
  @apply space-y-3;
}

.nav-section__title {
  @apply px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider transition-opacity duration-300;
}

.sidebar--collapsed .nav-section__title {
  @apply opacity-0 sr-only;
}

.nav-items {
  @apply space-y-1;
}

.nav-item {
  @apply flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200 relative;
}

.sidebar--collapsed .nav-item {
  @apply justify-center px-2;
}

.nav-item--active {
  @apply bg-primary-50 text-primary-700 hover:bg-primary-50;
}

.nav-item--logout {
  @apply w-full text-left text-red-600 hover:bg-red-50 hover:text-red-700;
}

.nav-item__icon {
  @apply w-5 h-5 flex-shrink-0;
}

.nav-item__text {
  @apply flex-1 font-medium transition-opacity duration-300;
}

.sidebar--collapsed .nav-item__text {
  @apply opacity-0 sr-only;
}

.nav-item__badge {
  @apply ml-auto transition-opacity duration-300;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sidebar {
    @apply fixed left-0 top-0 z-50 transform -translate-x-full transition-transform duration-300;
    width: 280px;
    height: 100vh;
    border-right: none;
  }

  .sidebar--open {
    @apply translate-x-0;
  }

  /* 移动端隐藏右侧折叠按钮 */
  .sidebar-collapse-btn {
    @apply hidden;
  }
}

/* 动画效果 */
.nav-item {
  position: relative;
  overflow: hidden;
}

.nav-item::before {
  content: '';
  @apply absolute left-0 top-0 h-full w-1 bg-primary-500 transform scale-y-0 transition-transform duration-200;
}

.nav-item--active::before {
  @apply scale-y-100;
}

/* 滚动条样式 */
.sidebar__nav::-webkit-scrollbar {
  @apply w-2;
}

.sidebar__nav::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

.sidebar__nav::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded-full;
}

.sidebar__nav::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400;
}

/* 折叠状态下的提示框 */
.nav-item {
  position: relative;
}

.sidebar--collapsed .nav-item:hover::after {
  content: attr(title);
  @apply absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded whitespace-nowrap z-50;
  animation: fadeIn 0.2s ease-in-out;
}

/* 深色模式支持 */
.dark .sidebar {
  @apply bg-gray-800 border-gray-700;
}

.dark .sidebar__logo,
.dark .sidebar__functions {
  @apply border-gray-700;
}

.dark .nav-section__title {
  @apply text-gray-400;
}

.dark .nav-item {
  @apply text-gray-300 hover:bg-gray-700;
}

.dark .nav-item--active {
  @apply bg-primary-900 text-primary-300 hover:bg-primary-900;
}

.dark .function-button {
  @apply text-gray-400 hover:bg-gray-700 hover:text-gray-200;
}

.dark .notification-bell--has-unread {
  @apply text-primary-400 hover:text-primary-300;
}

.dark .user-name {
  @apply text-gray-100;
}

.dark .user-role {
  @apply text-gray-400;
}

.dark .sidebar-collapse-btn {
  @apply bg-gray-700 border-gray-600 text-gray-400 hover:bg-gray-600 hover:text-gray-200;
}

/* 移动端样式更新 */

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-5px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>