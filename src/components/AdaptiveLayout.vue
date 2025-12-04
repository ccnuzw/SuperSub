<script setup lang="ts">
import { computed } from 'vue'
import { useLayoutStore } from '@/stores/layout'
import VerticalLayout from './VerticalLayout.vue'
import HorizontalLayout from './HorizontalLayout.vue'

const layoutStore = useLayoutStore()

const currentLayout = computed(() => {
  return layoutStore.layoutMode === 'vertical' ? VerticalLayout : HorizontalLayout
})
</script>

<template>
  <component :is="currentLayout" />
</template>