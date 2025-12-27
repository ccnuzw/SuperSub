<script setup lang="ts">
import { computed } from 'vue'
import { useIsMobile } from '@/composables/useMediaQuery'
import Card from './Card.vue'

interface Column {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface Props {
  columns: Column[]
  data: any[]
  loading?: boolean
  rowKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  rowKey: 'id'
})

const isMobile = useIsMobile()

const thClass = (col: Column) => {
  const align = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
  return `px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${align}`
}

const tdClass = (col: Column) => {
  const align = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
  return `px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 ${align}`
}
</script>

<template>
  <div>
    <!-- Desktop Table -->
    <div v-if="!isMobile" class="overflow-hidden bg-white dark:bg-dark-surface rounded-2xl shadow-sm border border-slate-200 dark:border-dark-border">
      <div v-if="loading" class="p-8 flex justify-center">
         <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
      
      <table v-else class="min-w-full divide-y divide-slate-200 dark:divide-dark-border">
        <thead class="bg-slate-50 dark:bg-dark-bg/50">
          <tr>
            <th v-for="col in columns" :key="col.key" scope="col" :class="thClass(col)">
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-dark-surface divide-y divide-slate-200 dark:divide-dark-border">
          <tr v-for="row in data" :key="row[rowKey]" class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors duration-150">
            <td v-for="col in columns" :key="col.key" :class="tdClass(col)">
              <slot :name="col.key" :row="row">
                 {{ row[col.key] }}
              </slot>
            </td>
          </tr>
          
          <tr v-if="data.length === 0">
              <td :colspan="columns.length" class="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                  <div class="flex flex-col items-center justify-center">
                       <slot name="empty">
                           <p>No data available</p>
                       </slot>
                  </div>
              </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div v-else class="space-y-4">
       <div v-if="loading" class="py-8 flex justify-center">
         <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
      
      <template v-else>
          <Card v-for="row in data" :key="row[rowKey]" padding="md" variant="default" class="flex flex-col gap-4">
              <slot name="mobile-card" :row="row">
                  <!-- Fallback Mobile View if no slot provided -->
                  <div v-for="col in columns" :key="col.key" class="flex justify-between items-center border-b border-slate-100 dark:border-white/5 last:border-0 pb-2 last:pb-0">
                      <span class="text-xs font-semibold text-slate-500 uppercase">{{ col.label }}</span>
                      <div class="text-sm">
                          <slot :name="col.key" :row="row">
                              {{ row[col.key] }}
                          </slot>
                      </div>
                  </div>
              </slot>
          </Card>
           <div v-if="data.length === 0" class="py-12 text-center text-slate-500">
                <slot name="empty">
                     <p>No data available</p>
                </slot>
           </div>
      </template>
    </div>
  </div>
</template>
