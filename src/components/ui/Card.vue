<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'elevated' | 'glass' | 'flat'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  bordered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
  hover: false,
  bordered: true
})

const classes = computed(() => {
  const base = 'rounded-2xl transition-all duration-300 relative overflow-hidden' // Updated rounded-2xl
  
  const borders = props.bordered && props.variant !== 'glass' 
    ? 'border border-slate-200 dark:border-dark-border' 
    : 'border border-transparent'

  const variants = {
    default: 'bg-white dark:bg-dark-surface shadow-sm',
    elevated: 'bg-white dark:bg-dark-surface shadow-xl shadow-slate-200/50 dark:shadow-none',
    glass: 'bg-white/70 dark:bg-dark-surface/70 backdrop-blur-md border border-white/20 dark:border-white/5',
    flat: 'bg-slate-50 dark:bg-white/5'
  }

  const paddings = {
    none: 'p-0',
    sm: 'p-4', // Increased padding for breathability
    md: 'p-6',
    lg: 'p-8'
  }

  const hoverEffect = props.hover ? 'hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-500/10 dark:hover:shadow-black/50 hover:border-primary-200/50 dark:hover:border-primary-500/30' : ''

  return `${base} ${variants[props.variant]} ${borders} ${paddings[props.padding]} ${hoverEffect}`
})
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
