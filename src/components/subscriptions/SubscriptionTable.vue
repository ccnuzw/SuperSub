<script setup lang="ts">
import { h } from 'vue'
import { NTooltip, NIcon } from 'naive-ui'
import {
  EyeOutline,
  FilterOutline,
  CreateOutline,
  SyncOutline,
  TrashOutline as TrashIcon,
} from '@vicons/ionicons5'
import type { Subscription } from '@/types'
import { format } from 'date-fns'
import Button from '@/components/ui/Button.vue'
import DataList from '@/components/ui/DataList.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'

const props = defineProps<{
  subscriptions: Subscription[]
  loading: boolean
  updatingIds: Set<string>
  updatingId: string | null
  checkedRowKeys?: string[]
}>()

const emit = defineEmits<{
  (e: 'edit', sub: Subscription): void
  (e: 'update', sub: Subscription): void
  (e: 'delete', sub: Subscription): void
  (e: 'preview', sub: Subscription): void
  (e: 'manage-rules', sub: Subscription): void
  (e: 'update:checkedRowKeys', keys: string[]): void
}>()

const formatBytes = (bytes: number, decimals = 2) => {
  if (!bytes) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const columns = [
  { key: 'name', label: '名称' },
  { key: 'url', label: 'URL', width: '200px' },
  { key: 'status', label: '状态', align: 'center' as const, width: '100px' },
  { key: 'node_count', label: '节点', align: 'center' as const, width: '80px' },
  { key: 'traffic', label: '流量', width: '120px' },
  { key: 'expires', label: '到期', width: '120px' },
  { key: 'last_updated', label: '最后更新', width: '150px' },
  { key: 'actions', label: '操作', align: 'right' as const }
]

const getTrafficStatus = (remaining?: number) => {
    if (remaining === null || remaining === undefined || remaining < 0) return 'inactive'
    const GB = 1024 * 1024 * 1024;
    if (remaining < 1 * GB) return 'error';
    if (remaining < 5 * GB) return 'warning';
    return 'success';
}

const getExpiryStatus = (row: Subscription) => {
    const diffDays = row.remaining_days;
    if (diffDays === null || diffDays === undefined) return 'inactive';
    if (diffDays < 0) return 'error';
    if (diffDays <= 3) return 'error';
    if (diffDays <= 7) return 'warning';
    return 'success';
}
</script>

<template>
  <DataList
    :columns="columns"
    :data="subscriptions"
    :loading="loading"
    row-key="id"
    checkable
    :checked-row-keys="checkedRowKeys"
    @update:checked-row-keys="keys => emit('update:checkedRowKeys', keys)"
  >
    <!-- Name -->
    <template #name="{ row }">
        <div class="font-medium text-slate-900 dark:text-white truncate max-w-[150px]" :title="row.name">
            {{ row.name }}
        </div>
    </template>

    <!-- URL -->
    <template #url="{ row }">
        <div class="text-slate-500 truncate max-w-[200px]" :title="row.url">
            {{ row.url }}
        </div>
    </template>

    <!-- Status -->
    <template #status="{ row }">
        <n-tooltip v-if="row.error" trigger="hover">
            <template #trigger>
                <StatusBadge status="error" text="失败" :dot="true" class="cursor-help" />
            </template>
            {{ row.error }}
        </n-tooltip>
        <StatusBadge v-else-if="row.last_updated" status="active" text="正常" />
        <StatusBadge v-else status="pending" text="待更新" />
    </template>

    <!-- Node Count -->
    <template #node_count="{ row }">
        <span class="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
            {{ row.node_count || 0 }}
        </span>
    </template>

    <!-- Traffic -->
    <template #traffic="{ row }">
         <StatusBadge 
            :status="getTrafficStatus(row.remaining_traffic)" 
            :text="row.remaining_traffic ? formatBytes(row.remaining_traffic) : 'N/A'"
            :dot="false"
        />
    </template>

    <!-- Expires -->
    <template #expires="{ row }">
         <n-tooltip trigger="hover">
            <template #trigger>
                 <StatusBadge 
                    :status="getExpiryStatus(row)" 
                    :text="row.remaining_days !== null ? `${row.remaining_days} 天` : 'N/A'"
                    :dot="false"
                    class="cursor-help"
                />
            </template>
             <div v-if="row.expires_at">过期时间: {{ format(new Date(row.expires_at), 'yyyy-MM-dd HH:mm') }}</div>
             <div v-else>无过期信息</div>
         </n-tooltip>
    </template>

    <!-- Last Updated -->
    <template #last_updated="{ row }">
        <span class="text-xs text-slate-500">
            {{ row.last_updated ? format(new Date(row.last_updated), 'yyyy-MM-dd HH:mm') : 'N/A' }}
        </span>
    </template>

    <!-- Actions -->
    <template #actions="{ row }">
        <div class="flex items-center justify-end gap-1">
             <n-tooltip trigger="hover">
                <template #trigger>
                    <Button variant="ghost" size="sm" icon @click="emit('preview', row)">
                        <n-icon :component="EyeOutline" size="18" />
                    </Button>
                </template>
                预览节点
             </n-tooltip>

             <n-tooltip trigger="hover">
                <template #trigger>
                    <Button variant="ghost" size="sm" icon @click="emit('manage-rules', row)">
                        <n-icon :component="FilterOutline" size="18" />
                    </Button>
                </template>
                管理规则
             </n-tooltip>

             <n-tooltip trigger="hover">
                <template #trigger>
                    <Button variant="ghost" size="sm" icon @click="emit('edit', row)">
                        <n-icon :component="CreateOutline" size="18" />
                    </Button>
                </template>
                编辑
             </n-tooltip>

             <n-tooltip trigger="hover">
                <template #trigger>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        icon 
                        @click="emit('update', row)"
                        :loading="updatingId === row.id || updatingIds.has(row.id)"
                        class="text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                        <n-icon :component="SyncOutline" size="18" />
                    </Button>
                </template>
                更新订阅
             </n-tooltip>

             <n-tooltip trigger="hover">
                 <template #trigger>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        icon 
                        @click="emit('delete', row)"
                        class="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <n-icon :component="TrashIcon" size="18" />
                    </Button>
                 </template>
                 删除
             </n-tooltip>
        </div>
    </template>

    <!-- Mobile Card Customization -->
    <template #mobile-card="{ row }">
        <div class="flex justify-between items-start">
            <div>
                 <div class="font-medium text-lg text-slate-900 dark:text-white">{{ row.name }}</div>
                 <div class="text-sm text-slate-500 truncate max-w-[200px] mt-0.5">{{ row.url }}</div>
            </div>
            <StatusBadge v-if="row.last_updated" status="active" text="正常" />
            <StatusBadge v-else status="pending" text="待更新" />
        </div>

        <div class="grid grid-cols-2 gap-4 py-2">
             <div class="bg-slate-50 dark:bg-white/5 p-3 rounded-xl">
                 <div class="text-xs text-slate-500 uppercase font-semibold">节点</div>
                 <div class="text-lg font-medium">{{ row.node_count || 0 }}</div>
             </div>
             <div class="bg-slate-50 dark:bg-white/5 p-3 rounded-xl">
                 <div class="text-xs text-slate-500 uppercase font-semibold">流量</div>
                 <div class="text-lg font-medium">{{ row.remaining_traffic ? formatBytes(row.remaining_traffic) : 'N/A' }}</div>
             </div>
             <div class="bg-slate-50 dark:bg-white/5 p-3 rounded-xl">
                 <div class="text-xs text-slate-500 uppercase font-semibold">到期</div>
                 <div class="text-lg font-medium">
                      <span v-if="row.remaining_days !== null" :class="{'text-red-500': row.remaining_days < 3, 'text-amber-500': row.remaining_days < 7}">
                          {{ row.remaining_days }} 天
                      </span>
                      <span v-else>N/A</span>
                 </div>
             </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <Button variant="ghost" size="sm" icon @click="emit('preview', row)"><n-icon :component="EyeOutline" size="20" /></Button>
            <Button variant="ghost" size="sm" icon @click="emit('manage-rules', row)"><n-icon :component="FilterOutline" size="20" /></Button>
            <Button variant="ghost" size="sm" icon @click="emit('update', row)" :loading="updatingId === row.id || updatingIds.has(row.id)"><n-icon :component="SyncOutline" size="20" /></Button>
            <Button variant="secondary" size="sm" @click="emit('edit', row)">编辑</Button>
            <Button variant="danger" size="sm" icon @click="emit('delete', row)"><n-icon :component="TrashIcon" size="20" /></Button>
        </div>
    </template>

    <template #empty>
         <div class="flex flex-col items-center py-8">
             <div class="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-400">
                 <n-icon :component="EyeOutline" size="32" class="opacity-50" />
             </div>
             <h3 class="text-sm font-medium text-slate-900 dark:text-white">暂无订阅</h3>
             <p class="text-sm text-slate-500 mt-1">添加订阅链接以开始使用</p>
        </div>
    </template>
  </DataList>
</template>
