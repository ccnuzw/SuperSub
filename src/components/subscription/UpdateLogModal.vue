<template>
  <n-modal
    v-model:show="showModel"
    preset="card"
    title="订阅更新"
    style="width: 600px;"
    :mask-closable="false"
  >
    <!-- 配置阶段 -->
    <div v-if="updateStage === 'config'">
      <n-form label-placement="left" label-width="auto">
        <n-form-item label="待更新订阅数">
          <n-statistic :value="subsToUpdate.length" />
        </n-form-item>
        <n-form-item label="并发数">
          <n-input-number v-model:value="updateSettingsModel.concurrency" :min="1" :max="20" />
          <template #feedback>同时执行的网络请求数量。较高的值可以加快速度，但可能导致请求失败。</template>
        </n-form-item>
        <n-form-item label="失败重试次数">
          <n-input-number v-model:value="updateSettingsModel.retries" :min="0" :max="5" />
          <template #feedback>每个订阅在更新失败后自动重试的次数。</template>
        </n-form-item>
        <n-form-item label="请求间隔 (ms)">
          <n-input-number v-model:value="updateSettingsModel.delay" :min="0" :step="100" />
          <template #feedback>同一批次内，每个并发请求之间的间隔。有助于错开请求峰值。</template>
        </n-form-item>
        <n-form-item label="批次间隔 (ms)">
          <n-input-number v-model:value="updateSettingsModel.batchDelay" :min="0" :step="100" />
          <template #feedback>每完成一个并发批次后，等待一段时间再开始下一个批次。</template>
        </n-form-item>
        <n-form-item label="到期天数阈值">
         <n-input-number v-model:value="updateSettingsModel.expiringDaysThreshold" :min="0" :step="1" />
         <template #feedback>当剩余天数小于此值时，将归类为"即将到期"。</template>
        </n-form-item>
        <n-form-item label="到期流量阈值 (GB)">
         <n-input-number v-model:value="updateSettingsModel.expiringTrafficThresholdGB" :min="0" :step="1" />
         <template #feedback>当���余流量小于此值 (GB) 时，将归类为"即将到期"。</template>
        </n-form-item>
      </n-form>
    </div>

    <!-- 进度阶段 -->
    <div v-else>
      <div class="text-center mb-4">
        <n-progress
          type="line"
          :percentage="updateProgress.total > 0 ? Math.floor((updateProgress.current / updateProgress.total) * 100) : 0"
          :indicator-placement="'inside'"
          processing
        />
        <p class="mt-2">
          <span v-if="updateLogLoading">正在更新: {{ updateProgress.current }} / {{ updateProgress.total }}</span>
          <span v-else>更新完成: {{ updateProgress.current }} / {{ updateProgress.total }}</span>
        </p>
      </div>
      <n-collapse>
        <n-collapse-item :title="`更新成功 (${updateLog.success.length})`" name="success">
          <div style="max-height: 200px; overflow-y: auto;">
            <n-tag v-for="sub in updateLog.success" :key="sub.name" type="success" class="m-1">
              {{ sub.name }}
            </n-tag>
            <n-text v-if="updateLog.success.length === 0">没有订阅成功更新。</n-text>
          </div>
        </n-collapse-item>
        <n-collapse-item :title="`即将到期 (${updateLog.expiring.length})`" name="expiring">
          <div style="max-height: 200px; overflow-y: auto;">
            <div v-if="updateLog.expiring.length > 0">
              <div v-for="sub in updateLog.expiring" :key="sub.id" class="mb-2 p-2 border rounded border-yellow-500">
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
        <n-collapse-item :title="`更新失败 (${updateLog.failed.length})`" name="failed">
          <div style="max-height: 200px; overflow-y: auto;">
            <div v-if="updateLog.failed.length > 0">
              <div v-for="sub in updateLog.failed" :key="sub.id" class="mb-2 p-2 border rounded">
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
        <div v-if="updateStage === 'config'">
          <n-button @click="handleShow(false)">取消</n-button>
          <n-button type="primary" @click="$emit('executeUpdates')">开始更新</n-button>
        </div>
        <div v-else>
          <n-button @click="$emit('cancelUpdate')">{{ updateLogLoading ? '中止' : '关闭' }}</n-button>
          <n-button
            type="primary"
            ghost
            @click="$emit('retryFailed')"
            :disabled="updateLog.failed.filter(s => s.error !== '已中止').length === 0 || updateLogLoading"
          >
            重试失败项
          </n-button>
          <n-button
            type="warning"
            ghost
            @click="$emit('clearExpiring')"
            :disabled="updateLog.expiring.length === 0 || updateLogLoading"
          >
            清除即将到期
          </n-button>
          <n-button
            type="error"
            ghost
            @click="$emit('clearFailed')"
            :disabled="updateLog.failed.filter(s => s.error !== '已中止').length === 0 || updateLogLoading"
          >
            清除失败项
          </n-button>
        </div>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  NModal, NForm, NFormItem, NInputNumber, NStatistic, NProgress,
  NCollapse, NCollapseItem, NTag, NText, NSpace, NButton
} from 'naive-ui'
import { Subscription } from '@/types'
import { formatBytes } from '@/utils/format'

interface UpdateLog {
  success: { name: string }[]
  failed: (Subscription & { error?: string | null })[]
  expiring: Subscription[]
}

interface UpdateProgress {
  current: number
  total: number
}

interface UpdateSettings {
  concurrency: number
  retries: number
  delay: number
  batchDelay: number
  expiringDaysThreshold: number
  expiringTrafficThresholdGB: number
}

interface Props {
  show: boolean
  updateStage: 'config' | 'progress'
  updateLog: UpdateLog
  updateProgress: UpdateProgress
  subsToUpdate: Subscription[]
  updateSettings: UpdateSettings
  updateLogLoading: boolean
  ruleModalTitle?: string
  ruleFormTitle?: string
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'update:updateStage', value: 'config' | 'progress'): void
  (e: 'update:updateLog', value: UpdateLog): void
  (e: 'update:updateProgress', value: UpdateProgress): void
  (e: 'update:subsToUpdate', value: Subscription[]): void
  (e: 'update:updateSettings', value: UpdateSettings): void
  (e: 'update:updateLogLoading', value: boolean): void
  (e: 'executeUpdates'): void
  (e: 'retryFailed'): void
  (e: 'clearExpiring'): void
  (e: 'clearFailed'): void
  (e: 'cancelUpdate'): void
}

const props = withDefaults(defineProps<Props>(), {
  ruleModalTitle: '',
  ruleFormTitle: ''
})

const emit = defineEmits<Emits>()

// 使用计算属性双向绑定
const showModel = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const updateSettingsModel = computed({
  get: () => props.updateSettings,
  set: (value) => emit('update:updateSettings', value)
})

// 处理操作
const handleShow = (value: boolean) => emit('update:show', value)
</script>