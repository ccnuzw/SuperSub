<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { NIcon, NDrawer } from 'naive-ui'
import {
  HomeOutline as HomeIcon,
  CloudDownloadOutline as SubscriptionIcon,
  HardwareChipOutline as NodeIcon,
  PersonCircleOutline as ProfileIcon,
  SettingsOutline as SettingsIcon,
  LogOutOutline as LogoutIcon,
  PeopleOutline as PeopleIcon,
  MenuOutline as MenuIcon,
  MoonOutline as MoonIcon,
  SunnyOutline as SunnyIcon
} from '@vicons/ionicons5'
import { useIsMobile } from '@/composables/useMediaQuery'

const isMobile = useIsMobile()
const showDrawer = ref(false)
const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()
const route = useRoute()

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: 'login' });
}

const menuItems = computed(() => {
  const base = [
    { label: '仪表盘', name: 'home', icon: HomeIcon },
    { label: '订阅管理', name: 'subscriptions', icon: SubscriptionIcon },
    { label: '节点列表', name: 'nodes', icon: NodeIcon },
    { label: '个人资料', name: 'profiles', icon: ProfileIcon },
  ]

  const admin = [
    { label: '用户管理', name: 'user-management', icon: PeopleIcon },
  ]

  const common = [
    { label: '系统设置', name: 'settings', icon: SettingsIcon },
  ]

  let items = [...base]
  if (authStore.isAdmin) {
    items = [...items, ...admin]
  }
  return [...items, ...common]
})

const isActive = (name: string) => route.name === name
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-dark-bg transition-colors duration-300">
    <!-- Desktop Sidebar - Glass Effect -->
    <aside v-if="!isMobile" class="fixed inset-y-0 left-0 w-64 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl border-r border-slate-200 dark:border-dark-border z-30 transition-colors duration-300">
      <div class="flex flex-col h-full">
        <!-- Logo -->
        <div class="h-20 flex items-center px-6">
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-glow">
                S
             </div>
             <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">SuperSub</span>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <RouterLink
            v-for="item in menuItems"
            :key="item.name"
            :to="{ name: item.name }"
            class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group relative overflow-hidden"
            :class="isActive(item.name) 
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' 
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200'"
          >
            <n-icon :component="item.icon" size="22" class="mr-3 transition-colors duration-300" :class="isActive(item.name) ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'"/>
            {{ item.label }}
          </RouterLink>
        </nav>

        <!-- Footer Actions -->
        <div class="p-4 border-t border-slate-200/50 dark:border-white/5 space-y-2">
            <!-- Theme Toggle Mini -->
           <button 
            @click="themeStore.toggleTheme"
            class="flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            <n-icon :component="themeStore.theme === 'dark' ? MoonIcon : SunnyIcon" size="20" class="mr-3"/>
            {{ themeStore.theme === 'dark' ? '深色模式' : '浅色模式' }}
          </button>

          <button 
            @click="handleLogout"
            class="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
          >
            <n-icon :component="LogoutIcon" size="20" class="mr-3"/>
            退出登录
          </button>
        </div>
      </div>
    </aside>

    <!-- Mobile Header - Glass -->
    <header v-if="isMobile" class="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl border-b border-slate-200 dark:border-dark-border z-20 px-4 flex items-center justify-between">
      <button @click="showDrawer = true" class="p-2 -ml-2 text-slate-600 dark:text-slate-200 active:scale-95 transition-transform">
        <n-icon :component="MenuIcon" size="24"/>
      </button>
      <span class="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">SuperSub</span>
      <button  @click="themeStore.toggleTheme" class="p-2 text-slate-500 hover:text-primary-600 dark:text-slate-400">
          <n-icon :component="themeStore.theme === 'dark' ? MoonIcon : SunnyIcon" size="22" />
      </button>
    </header>

    <!-- Mobile Drawer -->
    <n-drawer v-model:show="showDrawer" :width="280" placement="left">
      <div class="h-full bg-slate-50 dark:bg-dark-surface flex flex-col">
        <div class="h-20 flex items-center px-6">
           <div class="flex items-center gap-3">
             <div class="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-lg">S</div>
             <span class="text-xl font-bold text-slate-800 dark:text-white">SuperSub</span>
          </div>
        </div>
        <nav class="flex-1 px-4 py-4 space-y-1">
          <RouterLink
            v-for="item in menuItems"
            :key="item.name"
            :to="{ name: item.name }"
            @click="showDrawer = false"
            class="flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200"
            :class="isActive(item.name) 
              ? 'bg-white dark:bg-white/5 text-primary-600 dark:text-primary-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400'"
          >
            <n-icon :component="item.icon" size="20" class="mr-3"/>
            {{ item.label }}
          </RouterLink>
        </nav>
        <div class="p-4 border-t border-slate-200 dark:border-white/5">
             <button 
            @click="handleLogout"
            class="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
          >
            <n-icon :component="LogoutIcon" size="20" class="mr-3"/>
            退出登录
          </button>
        </div>
      </div>
    </n-drawer>

    <!-- Main Content -->
    <main class="transition-all duration-300" :class="isMobile ? 'pt-20 px-4 pb-8' : 'pl-64 pr-8 py-8'">
      <!-- Page Content -->
      <div class="max-w-7xl mx-auto animate-fade-in">
        <slot />
      </div>
    </main>
  </div>
</template>
