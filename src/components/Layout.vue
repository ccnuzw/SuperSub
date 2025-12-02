<script setup lang="ts">
import { h, computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import type { Component } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { NIcon, NLayout, NLayoutSider, NLayoutHeader, NLayoutContent, NMenu, NSwitch, NSpace, NDrawer, NButton } from 'naive-ui'
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
} from '@vicons/ionicons5'
import { useIsMobile } from '@/composables/useMediaQuery'

const isMobile = useIsMobile()
const showDrawer = ref(false)

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: 'login' });
}

const menuOptions = computed(() => {
  const baseMenu = [
    {
      label: () => h(RouterLink, { to: { name: 'home' } }, { default: () => 'Dashboard' }),
      key: 'home',
      icon: renderIcon(HomeIcon)
    },
    {
      label: () => h(RouterLink, { to: { name: 'component-showcase' } }, { default: () => '组件展示' }),
      key: 'component-showcase',
      icon: renderIcon(ComponentIcon)
    },
    {
      label: () => h(RouterLink, { to: { name: 'subscriptions' } }, { default: () => 'Subscriptions' }),
      key: 'subscriptions',
      icon: renderIcon(SubscriptionIcon)
    },
    {
      label: () => h(RouterLink, { to: { name: 'nodes' } }, { default: () => 'Nodes' }),
      key: 'nodes',
      icon: renderIcon(NodeIcon)
    },
    {
      label: () => h(RouterLink, { to: { name: 'profiles' } }, { default: () => 'Profiles' }),
      key: 'profiles',
      icon: renderIcon(ProfileIcon)
    },
  ];

  const adminMenu = [
    {
      key: 'divider-admin',
      type: 'divider'
    },
    {
      label: () => h(RouterLink, { to: { name: 'user-management' } }, { default: () => 'User Management' }),
      key: 'user-management',
      icon: renderIcon(PeopleIcon)
    }
  ];

  const finalMenu = [
    {
      key: 'divider-settings',
      type: 'divider'
    },
    {
      label: () => h(RouterLink, { to: { name: 'settings' } }, { default: () => 'Settings' }),
      key: 'settings',
      icon: renderIcon(SettingsIcon)
    },
    {
      key: 'divider-1',
      type: 'divider'
    },
    {
      label: 'Logout',
      key: 'logout',
      icon: renderIcon(LogoutIcon),
      onClick: handleLogout
    }
  ];

  if (authStore.isAdmin) {
    return [...baseMenu, ...adminMenu, ...finalMenu];
  }
  return [...baseMenu, ...finalMenu];
});
</script>

<template>
  <n-layout style="height: 100vh">
    <n-layout-header style="height: 64px; padding: 0 24px; display: flex; align-items: center; justify-content: space-between;" bordered>
      <n-space align="center">
        <n-button v-if="isMobile" text @click="showDrawer = true">
          <n-icon :component="MenuIcon" size="24" />
        </n-button>
        <div style="font-size: 20px; font-weight: bold;">SuperSub</div>
      </n-space>
      <n-space align="center">
        <n-switch :value="themeStore.theme === 'dark'" @update:value="themeStore.toggleTheme" />
      </n-space>
    </n-layout-header>
    <n-layout has-sider>
      <n-layout-sider
        v-if="!isMobile"
        bordered
        collapse-mode="width"
        :collapsed-width="64"
        :width="240"
        show-trigger
        style="height: calc(100vh - 64px);"
      >
        <n-menu
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
        />
      </n-layout-sider>
      <n-drawer v-model:show="showDrawer" :width="240" placement="left">
        <n-menu
          :options="menuOptions"
          @update:value="showDrawer = false"
        />
      </n-drawer>
      <n-layout-content :content-style="isMobile ? 'padding: 12px;' : 'padding: 24px;'">
        <RouterView />
      </n-layout-content>
    </n-layout>
  </n-layout>
</template>