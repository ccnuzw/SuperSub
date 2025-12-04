<script setup lang="ts">
import { h, computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import type { Component } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useLayoutStore } from '@/stores/layout'
import { NIcon, NLayout, NLayoutContent, NMenu, NSwitch, NSpace, NButton, NTooltip, NDropdown } from 'naive-ui'
import {
  HomeOutline as HomeIcon,
  CloudDownloadOutline as SubscriptionIcon,
  HardwareChipOutline as NodeIcon,
  PersonCircleOutline as ProfileIcon,
  FilterOutline as FilterIcon,
  CodeSlashOutline as CodeIcon,
  SettingsOutline as SettingsIcon,
  LogOutOutline as LogoutIcon,
  PeopleOutline as PeopleIcon,
  MenuOutline as MenuIcon,
  ConstructOutline as ComponentIcon,
  ResizeOutline as LayoutIcon,
  SunnyOutline as LightIcon,
  MoonOutline as DarkIcon,
  GridOutline as VerticalIcon,
  ReorderFourOutline as HorizontalIcon,
  ChevronDownOutline as DropdownIcon,
} from '@vicons/ionicons5'
import { useIsMobile } from '@/composables/useMediaQuery'

const isMobile = useIsMobile()
const showUserDropdown = ref(false)

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const authStore = useAuthStore()
const themeStore = useThemeStore()
const layoutStore = useLayoutStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: 'login' });
}

const menuOptions = computed(() => {
  const baseMenu = [
    {
      label: () => h(RouterLink, { to: { name: 'home' } }, { default: () => '仪表盘' }),
      key: 'home',
      icon: renderIcon(HomeIcon)
    },
    {
      label: () => h(RouterLink, { to: { name: 'component-showcase' } }, { default: () => '组件展示' }),
      key: 'component-showcase',
      icon: renderIcon(ComponentIcon)
    },
    {
      label: () => h(RouterLink, { to: { name: 'subscriptions' } }, { default: () => '订阅管理' }),
      key: 'subscriptions',
      icon: renderIcon(SubscriptionIcon)
    },
    {
      label: () => h(RouterLink, { to: { name: 'nodes' } }, { default: () => '节点管理' }),
      key: 'nodes',
      icon: renderIcon(NodeIcon)
    },
    {
      label: () => h(RouterLink, { to: { name: 'profiles' } }, { default: () => '配置管理' }),
      key: 'profiles',
      icon: renderIcon(ProfileIcon)
    },
  ];

  if (authStore.isAdmin) {
    baseMenu.push({
      label: () => h(RouterLink, { to: { name: 'user-management' } }, { default: () => '用户管理' }),
      key: 'user-management',
      icon: renderIcon(PeopleIcon)
    });
  }

  // 添加系统设置和退出登录到菜单中
  baseMenu.push({
    label: () => h(RouterLink, { to: { name: 'settings' } }, { default: () => '系统设置' }),
    key: 'settings',
    icon: renderIcon(SettingsIcon)
  });

  baseMenu.push({
    label: () => h('span', {}, '退出登录'),
    key: 'logout',
    icon: renderIcon(LogoutIcon)
  });

  return baseMenu;
});

// 用户下拉菜单选项 - 现在为空，因为已移入主菜单
const userDropdownOptions = computed(() => []);

const getLabelText = (option: any) => {
  const labelMap: Record<string, string> = {
    home: '仪表盘',
    'component-showcase': '组件',
    subscriptions: '订阅',
    nodes: '节点',
    profiles: '配置',
    'user-management': '用户',
    settings: '设置',
    logout: '退出'
  };
  return labelMap[option.key] || option.key;
};
</script>

<template>
  <n-layout style="height: 100vh; position: relative;">
    <!-- 主内容区域 -->
    <n-layout-content style="position: relative; height: 100vh;">
      <!-- 移动端顶部操作栏 -->
      <div v-if="isMobile" style="height: 50px; padding: 0 12px; display: flex; align-items: center; justify-content: space-between; background: var(--n-color); position: sticky; top: 0; z-index: 10; border-bottom: 1px solid var(--n-border-color);">
        <div style="font-size: 16px; font-weight: bold;">SuperSub</div>
        <n-space :size="8">
          <!-- 布局切换 -->
          <n-tooltip trigger="hover">
            <template #trigger>
              <div class="control-button-mobile" @click="layoutStore.toggleLayoutMode" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: var(--n-button-color-2); cursor: pointer; transition: all 0.3s ease;">
                <n-icon :component="layoutStore.layoutMode === 'vertical' ? VerticalIcon : HorizontalIcon" size="18" />
              </div>
            </template>
            切换布局
          </n-tooltip>
          <!-- 主题切换 -->
          <n-tooltip trigger="hover">
            <template #trigger>
              <div class="control-button-mobile" @click="themeStore.toggleTheme" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: var(--n-button-color-2); cursor: pointer; transition: all 0.3s ease;">
                <n-icon :component="themeStore.theme === 'dark' ? LightIcon : DarkIcon" size="18" />
              </div>
            </template>
            切换主题
          </n-tooltip>
          <!-- 用户菜单 -->
          <n-dropdown
            :options="userDropdownOptions"
            placement="bottom-end"
            @select="(key) => key === 'logout' && handleLogout()"
          >
            <div class="control-button-mobile" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: var(--n-button-color-2); cursor: pointer; transition: all 0.3s ease;">
              <n-icon :component="DropdownIcon" size="18" />
            </div>
          </n-dropdown>
        </n-space>
      </div>

      <!-- 桌面端移除右上角浮动操作按钮 -->

      <!-- 页面内容 -->
      <div :style="isMobile ? 'padding: 0; height: calc(100vh - 100px); overflow-y: auto;' : 'padding: 0; height: calc(100vh - 60px); overflow-y: auto;'">
        <RouterView />
      </div>

      <!-- 底部导航栏 -->
      <div :style="isMobile
        ? 'position: fixed; bottom: 0; left: 0; right: 0; height: 50px; background: var(--n-color); border-top: 1px solid var(--n-border-color); z-index: 100;'
        : 'position: fixed; bottom: 0; left: 0; right: 0; height: 60px; background: var(--n-color); border-top: 1px solid var(--n-border-color); z-index: 100; display: flex; align-items: center; padding: 0 20px;'
      ">
        <!-- 桌面端完整菜单 -->
        <div v-if="!isMobile" style="display: flex; align-items: center; height: 100%; gap: 16px; width: 100%;">
          <!-- 网站名称 -->
          <div style="display: flex; align-items: center; font-size: 18px; font-weight: bold; color: var(--n-text-color); margin-right: 24px; white-space: nowrap;">
            SuperSub
          </div>

          <!-- 主菜单项 -->
          <div style="display: flex; align-items: center; gap: 8px; flex: 1; overflow-x: auto;">
            <div
              v-for="option in menuOptions"
              :key="option.key"
              @click="option.key === 'logout' ? handleLogout() : $router.push({ name: option.key })"
              :style="'height: 40px; padding: 0 12px; display: flex; align-items: center; gap: 6px; cursor: pointer; border-radius: 6px; transition: all 0.2s ease; white-space: nowrap; font-size: 14px;' + (option.key === 'logout' ? ' color: var(--n-error-color);' : '')"
              class="bottom-menu-item"
            >
              <n-icon :component="option.icon" :size="18" />
              <span>{{ option.key === 'logout' ? '退出登录' : (option.key === 'settings' ? '系统设置' : getLabelText(option)) }}</span>
            </div>
          </div>

          <!-- 控制按钮组 -->
          <div style="display: flex; align-items: center; gap: 8px; margin-left: 16px;">
            <!-- 布局切换 -->
            <n-tooltip trigger="hover" placement="top">
              <template #trigger>
                <div class="control-button" @click="layoutStore.toggleLayoutMode" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: var(--n-button-color-2); cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);">
                  <n-icon :component="layoutStore.layoutMode === 'vertical' ? VerticalIcon : HorizontalIcon" size="18" />
                </div>
              </template>
              切换为{{ layoutStore.layoutMode === 'vertical' ? '上下' : '左右' }}布局
            </n-tooltip>
            <!-- 主题切换 -->
            <n-tooltip trigger="hover" placement="top">
              <template #trigger>
                <div class="control-button" @click="themeStore.toggleTheme" style="display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; background: var(--n-button-color-2); cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);">
                  <n-icon :component="themeStore.theme === 'dark' ? LightIcon : DarkIcon" size="18" />
                </div>
              </template>
              切换为{{ themeStore.theme === 'dark' ? '浅色' : '深色' }}主题
            </n-tooltip>
          </div>
        </div>

        <!-- 移动端底部菜单 -->
        <div v-else style="height: 50px; display: flex; align-items: center; justify-content: space-around; padding: 0 8px;">
          <n-button
            v-for="option in menuOptions"
            :key="option.key"
            text
            size="small"
            @click="option.key === 'logout' ? handleLogout() : $router.push({ name: option.key })"
            style="flex: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 10px;"
          >
            <template #icon>
              <n-icon :component="option.icon" size="18" />
            </template>
            <span style="margin-top: 2px;">{{ getLabelText(option) }}</span>
          </n-button>
        </div>
      </div>
    </n-layout-content>
  </n-layout>
</template>

<style scoped>
.control-button:hover {
  background: var(--n-button-color-2-hover) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-button-mobile:hover {
  background: var(--n-button-color-2-hover) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-button:active {
  transform: translateY(0px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-button-mobile:active {
  transform: translateY(0px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 底部菜单项样式 */
.bottom-menu-item:hover {
  background-color: var(--n-item-color-hover);
}

.bottom-menu-item:active {
  background-color: var(--n-item-color-pressed);
}
</style>