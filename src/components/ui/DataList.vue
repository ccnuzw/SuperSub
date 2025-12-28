<script setup lang="ts">
import { computed } from 'vue'
import { NCheckbox } from 'naive-ui'
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
  checkable?: boolean
  checkedRowKeys?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  rowKey: 'id',
  checkable: false,
  checkedRowKeys: () => []
})

const emit = defineEmits<{
  (e: 'update:checkedRowKeys', keys: string[]): void
}>()

const isMobile = useIsMobile()

const thClass = (col: Column) => {
  const align = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
  return `px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${align}`
}

const tdClass = (col: Column) => {
  const align = col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
  return `px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 ${align}`
}

const allChecked = computed(() => {
  return props.data.length > 0 && props.data.every(row => props.checkedRowKeys.includes(row[props.rowKey]))
})

const indeterminate = computed(() => {
  const count = props.data.filter(row => props.checkedRowKeys.includes(row[props.rowKey])).length
  return count > 0 && count < props.data.length
})

const handleCheckAll = (checked: boolean) => {
  const keys = checked ? props.data.map(row => row[props.rowKey]) : []
  emit('update:checkedRowKeys', keys)
}

const handleCheckRow = (key: string, checked: boolean) => {
  const newKeys = checked 
    ? [...props.checkedRowKeys, key]
    : props.checkedRowKeys.filter(k => k !== key)
  emit('update:checkedRowKeys', newKeys)
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
            <th v-if="checkable" scope="col" class="px-6 py-4 w-12">
              <n-checkbox
                :checked="allChecked"
                :indeterminate="indeterminate"
                @update:checked="handleCheckAll"
              />
            </th>
            <th v-for="col in columns" :key="col.key" scope="col" :class="thClass(col)">
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-dark-surface divide-y divide-slate-200 dark:divide-dark-border">
          <tr v-for="row in data" :key="row[rowKey]" class="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors duration-150">
            <td v-if="checkable" class="px-6 py-4 w-12">
              <n-checkbox
                :checked="checkedRowKeys.includes(row[rowKey])"
                @update:checked="(v) => handleCheckRow(row[rowKey], v)"
              />
            </td>
            <td v-for="col in columns" :key="col.key" :class="tdClass(col)">
              <slot :name="col.key" :row="row">
                 {{ row[col.key] }}
              </slot>
            </td>
          </tr>
          
          <tr v-if="data.length === 0">
              <td :colspan="checkable ? columns.length + 1 : columns.length" class="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
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
          <div v-if="checkable && data.length > 0" class="flex items-center justify-between px-4 py-2 bg-white dark:bg-dark-surface rounded-xl border border-slate-200 dark:border-dark-border mb-4">
             <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Select All</span>
             <n-checkbox
                :checked="allChecked"
                :indeterminate="indeterminate"
                @update:checked="handleCheckAll"
              />
          </div>

          <Card v-for="row in data" :key="row[rowKey]" padding="md" variant="default" class="flex flex-col gap-4 relative">
              <div v-if="checkable" class="absolute top-4 right-4 z-10">
                  <n-checkbox
                    :checked="checkedRowKeys.includes(row[rowKey])"
                    @update:checked="(v) => handleCheckRow(row[rowKey], v)"
                  />
              </div>
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
