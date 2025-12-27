<script setup lang="ts">
import { h } from 'vue'
import { NIcon, NSpin } from 'naive-ui'
import { FlashOutline as FlashIcon } from '@vicons/ionicons5'
import type { Node } from '@/types'
import { useNodeStatusStore } from '@/stores/nodeStatus'
import { getNaiveTagColor } from '@/utils/colors'
import Button from '@/components/ui/Button.vue'
import DataList from '@/components/ui/DataList.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const props = defineProps<{
  nodes: Node[]
  loading: boolean
  checkedRowKeys: string[]
}>()

const emit = defineEmits<{
  (e: 'update:checkedRowKeys', keys: string[]): void
  (e: 'test', node: Node): void
  (e: 'edit', node: Node): void
  (e: 'delete', node: Node): void
}>()

const nodeStatusStore = useNodeStatusStore()

const columns = [
  { key: 'status', label: '状态', align: 'center' as const, width: '80px' },
  { key: 'name', label: '名称' },
  { key: 'server', label: '服务器' },
  { key: 'port', label: '端口', width: '100px' },
  { key: 'protocol', label: '类型', width: '120px' },
  { key: 'latency', label: '延迟', width: '100px' },
  { key: 'actions', label: '操作', align: 'right' as const }
]

const getStatus = (id: string) => {
    return nodeStatusStore.getStatusByNodeId(id)
}

const getLatencyStatus = (latency?: number | null) => {
    if (latency === undefined || latency === null) return 'inactive'
    if (latency < 200) return 'success'
    if (latency < 500) return 'warning'
    return 'error'
}
</script>

<template>
  <DataList
    :columns="columns"
    :data="nodes"
    :loading="loading"
    row-key="id"
  >
    <!-- Status -->
    <template #status="{ row }">
        <div class="flex justify-center">
             <n-spin v-if="getStatus(row.id)?.status === 'testing'" size="small" />
             <div v-else class="w-2.5 h-2.5 rounded-full" :class="{
                 'bg-green-500': getStatus(row.id)?.status === 'healthy',
                 'bg-red-500': getStatus(row.id)?.status === 'unhealthy',
                 'bg-slate-300 dark:bg-slate-600': !getStatus(row.id)?.status
             }"></div>
        </div>
    </template>

    <!-- Name -->
    <template #name="{ row }">
        <span class="font-medium text-slate-900 dark:text-white">{{ row.name }}</span>
    </template>

    <!-- Protocol -->
    <template #protocol="{ row }">
         <span class="px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 uppercase">
             {{ row.protocol || row.type || 'N/A' }}
         </span>
    </template>

    <!-- Latency -->
    <template #latency="{ row }">
        <StatusBadge 
            :status="getLatencyStatus(getStatus(row.id)?.latency)" 
            :text="getStatus(row.id)?.latency ? `${getStatus(row.id)?.latency}ms` : 'N/A'"
            :dot="false"
        />
    </template>

    <!-- Actions -->
    <template #actions="{ row }">
        <div class="flex items-center justify-end gap-2">
            <Button 
                variant="ghost" 
                size="sm" 
                icon 
                :loading="getStatus(row.id)?.status === 'testing'"
                @click="emit('test', row)"
            >
                <n-icon :component="FlashIcon" size="18" />
            </Button>
            <Button variant="secondary" size="sm" @click="emit('edit', row)">编辑</Button>
            <Button variant="danger" size="sm" @click="emit('delete', row)">删除</Button>
        </div>
    </template>

    <!-- Empty State -->
    <template #empty>
        <div class="flex flex-col items-center">
             <div class="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                 <div class="w-8 h-8 rounded bg-slate-200 dark:bg-white/10"></div>
             </div>
             <h3 class="text-sm font-medium text-slate-900 dark:text-white">未找到节点</h3>
             <p class="text-sm text-slate-500 mt-1">添加节点以开始使用</p>
        </div>
    </template>
  </DataList>
</template>
