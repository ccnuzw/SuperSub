<script setup lang="ts">
import { computed } from 'vue'
import { NModal, NForm, NFormItem, NInputNumber, NProgress, NCollapse, NCollapseItem, NTag, NText, NSpace, NButton } from 'naive-ui'
import type { Subscription } from '@/types'

const props = defineProps<{
    show: boolean
    stage: 'config' | 'progress'
    progress: { current: number, total: number }
    log: {
        success: { name: string }[]
        failed: Subscription[]
        expiring: Subscription[]
    }
    loading: boolean
    settings: {
        concurrency: number
        retries: number
        delay: number
        batchDelay: number
        expiringDaysThreshold: number
        expiringTrafficThresholdGB: number
    }
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
    (e: 'start'): void
    (e: 'cancel'): void
    (e: 'retry'): void
    (e: 'clear-expiring'): void
    (e: 'clear-failed'): void
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

const percentage = computed(() => {
    return props.progress.total > 0 ? Math.floor((props.progress.current / props.progress.total) * 100) : 0
})

const modalTitle = computed(() => `批量更新 (共 ${props.progress.total} 个订阅)`)

</script>

<template>
    <n-modal
      :show="show"
      @update:show="(val) => emit('update:show', val)"
      preset="card"
      :title="modalTitle"
      style="width: 600px;"
      :mask-closable="false"
    >
      <!-- Config Stage -->
      <div v-if="stage === 'config'">
        <n-form label-placement="left" label-width="120">
          <n-form-item label="并发数量">
            <n-input-number v-model:value="settings.concurrency" :min="1" :max="10" />
          </n-form-item>
          <n-form-item label="失败重试次数">
            <n-input-number v-model:value="settings.retries" :min="0" :max="5" />
          </n-form-item>
          <n-form-item label="请求间隔 (ms)">
            <n-input-number v-model:value="settings.delay" :min="0" :step="100" />
             <template #feedback>每个请求之间的延迟，防止触发频率限制。</template>
          </n-form-item>
           <n-form-item label="批次间隔 (ms)">
            <n-input-number v-model:value="settings.batchDelay" :min="0" :step="100" />
            <template #feedback>每完成一个并发批次后，等待一段时间再开始下一个批次。</template>
          </n-form-item>
          <n-form-item label="到期天数阈值">
           <n-input-number v-model:value="settings.expiringDaysThreshold" :min="0" :step="1" />
           <template #feedback>当剩余天数小于此值时，将归类为“即将到期”。</template>
         </n-form-item>
         <n-form-item label="到期流量阈值 (GB)">
           <n-input-number v-model:value="settings.expiringTrafficThresholdGB" :min="0" :step="1" />
           <template #feedback>当剩余流量小于此值 (GB) 时，将归类为“即将到期”。</template>
         </n-form-item>
        </n-form>
      </div>

      <!-- Progress Stage -->
      <div v-else>
        <div class="text-center mb-4">
          <n-progress
            type="line"
            :percentage="percentage"
            :indicator-placement="'inside'"
            processing
          />
          <p class="mt-2">
            <span v-if="loading">正在更新: {{ progress.current }} / {{ progress.total }}</span>
            <span v-else>更新完成: {{ progress.current }} / {{ progress.total }}</span>
          </p>
        </div>
        <n-collapse>
           <n-collapse-item :title="`更新成功 (${log.success.length})`" name="success">
            <div style="max-height: 200px; overflow-y: auto;">
              <n-tag v-for="sub in log.success" :key="sub.name" type="success" class="m-1">
                {{ sub.name }}
              </n-tag>
              <n-text v-if="log.success.length === 0">没有订阅成功更新。</n-text>
            </div>
          </n-collapse-item>
          <n-collapse-item :title="`即将到期 (${log.expiring.length})`" name="expiring">
            <div style="max-height: 200px; overflow-y: auto;">
              <div v-if="log.expiring.length > 0">
                <div v-for="sub in log.expiring" :key="sub.id" class="mb-2 p-2 border rounded border-yellow-500">
                  <div class="flex justify-between items-center">
                    <n-tag type="warning">{{ sub.name }}</n-tag>
                    <n-space :size="4">
                      <n-tag v-if="sub.remaining_traffic !== null && sub.remaining_traffic !== undefined" size="small" type="warning">
                        流量: {{ formatBytes(sub.remaining_traffic) }}
                      </n-tag>
                      <n-tag v-if="sub.remaining_days !== null && sub.remaining_days !== undefined" size="small" type="warning">
                        天数: {{ sub.remaining_days }} 天
                      </n-tag>
                    </n-space>
                  </div>
                </div>
              </div>
              <n-text v-else>没有即将到期的订阅。</n-text>
            </div>
          </n-collapse-item>
          <n-collapse-item :title="`更新失败 (${log.failed.length})`" name="failed">
             <div style="max-height: 200px; overflow-y: auto;">
              <div v-if="log.failed.length > 0">
                <div v-for="sub in log.failed" :key="sub.id" class="mb-2 p-2 border rounded">
                   <div class="flex justify-between items-center">
                     <n-tag type="error">{{ sub.name }}</n-tag>
                     <n-space :size="4">
                       <n-tag v-if="sub.remaining_traffic !== null && sub.remaining_traffic !== undefined" size="small" :type="sub.remaining_traffic === 0 ? 'error' : 'default'">
                         流量: {{ formatBytes(sub.remaining_traffic) }}
                       </n-tag>
                        <n-tag v-if="sub.remaining_days !== null && sub.remaining_days !== undefined" size="small" :type="sub.remaining_days <= 0 ? 'error' : 'default'">
                         天数: {{ sub.remaining_days }} 天
                       </n-tag>
                     </n-space>
                   </div>
                   <n-text class="text-xs text-gray-500 mt-1 block">{{ sub.error }}</n-text>
                </div>
              </div>
              <n-text v-else>没有订阅更新失败。</n-text>
            </div>
          </n-collapse-item>
        </n-collapse>
      </div>

      <template #footer>
        <n-space justify="end">
          <div v-if="stage === 'config'">
            <n-button @click="emit('update:show', false)">取消</n-button>
            <n-button type="primary" @click="emit('start')">开始更新</n-button>
          </div>
          <div v-else>
            <n-button @click="emit('cancel')">{{ loading ? '中止' : '关闭' }}</n-button>
            <n-button
              type="primary"
              ghost
              @click="emit('retry')"
              :disabled="log.failed.filter(s => s.error !== '已中止').length === 0 || loading"
            >
              重试失败项
            </n-button>
             <n-button
              type="warning"
              ghost
              @click="emit('clear-expiring')"
              :disabled="log.expiring.length === 0 || loading"
            >
              清除即将到期
            </n-button>
             <n-button
              type="error"
              ghost
              @click="emit('clear-failed')"
              :disabled="log.failed.filter(s => s.error !== '已中止').length === 0 || loading"
            >
              清除失败项
            </n-button>
          </div>
        </n-space>
      </template>
    </n-modal>
</template>
