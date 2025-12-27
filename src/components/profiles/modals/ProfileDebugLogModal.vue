<script setup lang="ts">
import { NModal, NScrollbar, NSteps, NStep, NCard, NCode } from 'naive-ui'
import type { LogEntry, LogLevel } from '@/types'

defineProps<{
    show: boolean
    logs: LogEntry[]
}>()

const emit = defineEmits<{
    (e: 'update:show', value: boolean): void
}>()

const getStepStatus = (level: LogLevel) => {
  switch (level) {
    case 'ERROR':
      return 'error';
    case 'WARN':
      return 'error';
    case 'SUCCESS':
      return 'finish';
    case 'INFO':
    case 'STEP':
    case 'DEBUG':
    default:
      return 'process';
  }
};
</script>

<template>
    <n-modal
        :show="show"
        @update:show="(val) => emit('update:show', val)"
        preset="card"
        title="上帝视角日志"
        style="width: 900px; max-width: 95vw; max-height: 80vh;"
        :mask-closable="true"
        :trap-focus="false"
    >
      <n-scrollbar style="max-height: 70vh; padding-right: 16px;">
        <n-steps vertical>
          <template v-for="log in logs" :key="log.timestamp">
            <n-step :title="log.message" :status="getStepStatus(log.level)">
              <p style="font-size: 12px; color: #999; margin-top: 4px; margin-bottom: 8px;">{{ new Date(log.timestamp).toLocaleString() }}</p>
              <div v-if="log.data">
                <n-card size="small" :bordered="true">
                  <n-code :code="JSON.stringify(log.data, null, 2)" language="json" word-wrap />
                </n-card>
              </div>
            </n-step>
          </template>
        </n-steps>
      </n-scrollbar>
    </n-modal>
</template>
