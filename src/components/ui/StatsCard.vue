<script setup lang="ts">
import Card from './Card.vue'
import { type Component } from 'vue'
import { NIcon } from 'naive-ui'

interface Props {
  title: string
  value: string | number
  icon?: Component
  trend?: string
  trendType?: 'up' | 'down' | 'neutral'
  loading?: boolean
}

defineProps<Props>()
</script>

<template>
  <Card class="relative overflow-hidden group" hover variant="elevated">
    <div class="flex items-start justify-between relative z-10">
      <div>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{{ title }}</p>
        <div v-if="loading" class="h-8 w-24 bg-slate-200 dark:bg-white/10 animate-pulse rounded mt-2"></div>
        <h3 v-else class="text-3xl font-bold text-slate-900 dark:text-white mt-1 tracking-tight">{{ value }}</h3>
      </div>
      <div v-if="icon" class="p-3 bg-primary-50 dark:bg-primary-500/10 text-primary-500 dark:text-primary-400 rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm border border-primary-100 dark:border-primary-500/20">
        <n-icon :component="icon" size="24" />
      </div>
    </div>
    
    <!-- Decorative background element -->
    <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors duration-500"></div>
    <div class="absolute -bottom-6 -left-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors duration-500 delay-100"></div>
  </Card>
</template>
