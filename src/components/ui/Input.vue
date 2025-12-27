<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string | number
  type?: 'text' | 'password' | 'email' | 'number'
  placeholder?: string
  disabled?: boolean
  error?: boolean
  errorMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  error: false,
  errorMessage: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const inputClasses = computed(() => {
  const base = 'w-full px-4 h-10 rounded-xl outline-none font-medium transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500'
  const variants = props.error
    ? 'bg-red-50 text-red-900 border border-red-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:bg-red-900/10 dark:text-red-200 dark:border-red-500/30'
    : 'bg-slate-100 text-slate-900 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-dark-surface dark:text-white dark:border-dark-border dark:focus:bg-white/5 dark:focus:border-primary-500/50'
  
  const state = props.disabled ? 'opacity-50 cursor-not-allowed' : ''

  return `${base} ${variants} ${state}`
})
</script>

<template>
  <div class="w-full">
    <div class="relative">
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="inputClasses"
        @input="handleInput"
      />
    </div>
    <span v-if="error && errorMessage" class="text-xs text-red-500 mt-1 block pl-1">
      {{ errorMessage }}
    </span>
  </div>
</template>
