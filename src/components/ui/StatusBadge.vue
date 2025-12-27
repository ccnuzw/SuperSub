<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  status: 'active' | 'inactive' | 'pending' | 'error' | 'success' | 'warning'
  text?: string
  dot?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  text: '',
  dot: true
})

const styles = computed(() => {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border'
  
  const variants = {
    active: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    success: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    inactive: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
    pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    error: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
  }

  return `${base} ${variants[props.status]}`
})

const dotClass = computed(() => {
  const base = 'w-1.5 h-1.5 rounded-full mr-1.5'
  const colors = {
    active: 'bg-green-500',
    success: 'bg-green-500',
    inactive: 'bg-slate-400',
    pending: 'bg-amber-500',
    warning: 'bg-amber-500',
    error: 'bg-red-500'
  }
  return `${base} ${colors[props.status]}`
})

const displayStatus = computed(() => {
  if (props.text) return props.text
  const translations: Record<string, string> = {
    active: '正常',
    inactive: '未激活',
    pending: '待更新',
    error: '失败',
    success: '成功',
    warning: '警告'
  }
  return translations[props.status] || props.status
})
</script>

<template>
  <span :class="styles">
    <span v-if="dot" :class="dotClass"></span>
    {{ displayStatus }}
  </span>
</template>
