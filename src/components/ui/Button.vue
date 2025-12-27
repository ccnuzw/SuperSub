<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass' | 'glow'
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  loading?: boolean
  disabled?: boolean
  icon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  block: false,
  loading: false,
  disabled: false,
  icon: false
})

const classes = computed(() => {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
  const rounded = props.icon ? 'rounded-full' : 'rounded-xl' // Updated to xl
  const blockClass = props.block ? 'w-full' : ''
  const cursor = props.loading ? 'cursor-wait' : ''

  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20 focus:ring-primary-500 border border-transparent',
    secondary: 'bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-white/5 focus:ring-slate-200',
    ghost: 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 focus:ring-slate-200 border border-transparent',
    danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 focus:ring-red-500 border border-transparent',
    glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 focus:ring-white/50', // Glass variant
    glow: 'bg-primary-500 hover:bg-primary-400 text-white shadow-glow hover:shadow-glow-sm border border-primary-400/50' // Glow variant
  }

  const sizes = {
    sm: props.icon ? 'w-8 h-8 p-0' : 'px-3 h-8 text-sm', // Fixed height
    md: props.icon ? 'w-10 h-10 p-0' : 'px-5 h-10 text-sm', // Fixed height, slightly wider padding
    lg: props.icon ? 'w-12 h-12 p-0' : 'px-6 h-12 text-base'
  }

  return `${base} ${rounded} ${variants[props.variant]} ${sizes[props.size]} ${blockClass} ${cursor}`
})
</script>

<template>
  <button :class="classes" :disabled="disabled || loading">
    <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <slot />
  </button>
</template>
