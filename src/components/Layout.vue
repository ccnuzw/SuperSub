<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { AppLayout } from './layout'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

// 响应式数据
const sidebarCollapsed = ref(false)

// 计算属性
const shouldShowLayout = computed(() => {
  const noLayoutRoutes = ['login', 'register', '404', '500']
  return !noLayoutRoutes.includes(route.name as string)
})

const showSidebar = computed(() => {
  return shouldShowLayout.value && !!authStore.isAuthenticated
})

// 生命周期 - 从本地存储恢复折叠状态
onMounted(() => {
  const savedCollapsed = localStorage.getItem('sidebar-collapsed')
  if (savedCollapsed) {
    try {
      sidebarCollapsed.value = JSON.parse(savedCollapsed)
    } catch (error) {
      console.error('Failed to parse sidebar collapsed state:', error)
    }
  }
})
</script>

<template>
  <!-- 使用重构后的AppLayout组件 -->
  <AppLayout
    v-if="shouldShowLayout"
    v-model:sidebar-collapsed="sidebarCollapsed"
    :show-sidebar="showSidebar"
  />

  <!-- 简单页面布局（登录、注册等） -->
  <div v-else class="simple-layout">
    <RouterView />
  </div>
</template>

<style scoped>
.simple-layout {
  @apply min-h-screen bg-gray-50 flex items-center justify-center;
}
</style>