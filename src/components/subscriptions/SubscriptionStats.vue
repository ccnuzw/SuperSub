/**
 * 订阅统计信息组件
 */

<template>
  <div class="subscription-stats">
    <n-grid :cols="5" :x-gap="16">
      <n-gi>
        <n-statistic label="总订阅数" :value="total">
          <template #prefix>
            <n-icon color="#18a058">
              <BookOutline />
            </n-icon>
          </template>
        </n-statistic>
      </n-gi>

      <n-gi>
        <n-statistic label="正常" :value="healthy" value-style="color: #18a058">
          <template #prefix>
            <n-icon color="#18a058">
              <CheckmarkCircleOutline />
            </n-icon>
          </template>
        </n-statistic>
      </n-gi>

      <n-gi>
        <n-statistic label="更新中" :value="updating" value-style="color: #2080f0">
          <template #prefix>
            <n-icon color="#2080f0">
              <SyncOutline />
            </n-icon>
          </template>
        </n-statistic>
      </n-gi>

      <n-gi>
        <n-statistic label="失败" :value="failed" value-style="color: #d03050">
          <template #prefix>
            <n-icon color="#d03050">
              <WarningOutline />
            </n-icon>
          </template>
        </n-statistic>
      </n-gi>

      <n-gi>
        <n-statistic label="已选择" :value="selected" value-style="color: #2080f0">
          <template #prefix>
            <n-icon color="#2080f0">
              <CheckboxOutline />
            </n-icon>
          </template>
        </n-statistic>
      </n-gi>
    </n-grid>

    <!-- 健康率进度条 -->
    <div v-if="total > 0" class="health-progress">
      <div class="progress-label">
        <span>健康率</span>
        <span class="health-percentage">{{ healthPercentage }}%</span>
      </div>
      <n-progress
        type="line"
        :percentage="healthPercentage"
        :color="progressColor"
        :height="8"
        :border-radius="4"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NGrid, NGi, NStatistic, NIcon, NProgress } from 'naive-ui'
import {
  BookOutline,
  CheckmarkCircleOutline,
  SyncOutline,
  WarningOutline,
  CheckboxOutline
} from '@vicons/ionicons5'

interface IProps {
  total: number
  healthy: number
  updating: number
  failed: number
  selected: number
}

const props = defineProps<IProps>()

// 计算健康率
const healthPercentage = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.healthy / props.total) * 100)
})

// 进度条颜色
const progressColor = computed(() => {
  const percentage = healthPercentage.value
  if (percentage >= 80) return '#18a058' // 绿色
  if (percentage >= 60) return '#f0a020' // 橙色
  return '#d03050' // 红色
})
</script>

<style scoped>
.subscription-stats {
  @apply bg-white rounded-lg shadow-sm p-6;
}

.health-progress {
  @apply mt-4 pt-4 border-t border-gray-200;
}

.progress-label {
  @apply flex justify-between items-center mb-2 text-sm text-gray-600;
}

.health-percentage {
  @apply font-medium text-gray-900;
}

/* 深色模式 */
.dark .subscription-stats {
  @apply bg-gray-800;
}

.dark .health-progress {
  @apply border-gray-700;
}

.dark .progress-label {
  @apply text-gray-400;
}

.dark .health-percentage {
  @apply text-gray-100;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .subscription-stats {
    @apply p-4;
  }

  :deep(.n-grid) {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 1rem !important;
  }

  :deep(.n-statistic) {
    text-align: center;
  }
}
</style>