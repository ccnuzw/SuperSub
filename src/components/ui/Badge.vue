<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md'
  rounded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'sm',
  rounded: true
})

const classes = computed(() => {
  const base = 'inline-flex items-center font-medium px-2.5 py-0.5'
  const roundness = props.rounded ? 'rounded-full' : 'rounded'
  
  const variants = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  }

  const sizes = {
    sm: 'text-xs',
    md: 'text-sm'
  }

  return `${base} ${roundness} ${variants[props.variant]} ${sizes[props.size]}`
})
</script>

<template>
  <span :class="classes">
    <slot />
  </span>
</template>
