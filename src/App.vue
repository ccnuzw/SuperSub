<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import Layout from './components/AdaptiveLayout.vue'
import { NConfigProvider, NMessageProvider, NDialogProvider, NLoadingBarProvider, darkTheme } from 'naive-ui'
import hljs from 'highlight.js/lib/core'
import yaml from 'highlight.js/lib/languages/yaml'

hljs.registerLanguage('yaml', yaml)

const route = useRoute()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAuthRoute = computed(() => route.name === 'login' || route.name === 'register')
const naiveTheme = computed(() => themeStore.theme === 'dark' ? darkTheme : null)

onMounted(() => {
  authStore.fetchUser()
})
</script>

<template>
  <n-config-provider :theme="naiveTheme" :hljs="hljs">
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-message-provider>
          <Layout v-if="isAuthenticated && !isAuthRoute" />
          <RouterView v-else />
        </n-message-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<style>
/* Resetting default browser styles */
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
  height: 100%;
  width: 100%;
}

#app {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}
</style>