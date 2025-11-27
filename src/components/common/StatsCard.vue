<template>
  <n-card
    :title="title"
    :size="size"
    :bordered="bordered"
    :hoverable="hoverable"
    class="stats-card"
  >
    <div class="stats-content">
      <!-- 主要统计值 -->
      <div class="stats-primary">
        <div class="stats-value" :class="valueClass">
          {{ formattedValue }}
        </div>
        <div v-if="unit" class="stats-unit">{{ unit }}</div>
      </div>

      <!-- 副标题 -->
      <div v-if="subtitle" class="stats-subtitle">{{ subtitle }}</div>

      <!-- 图标 -->
      <div v-if="icon" class="stats-icon">
        <n-icon :size="iconSize" :color="iconColor">
          <component :is="icon" />
        </n-icon>
      </div>

      <!-- 趋势指示器 -->
      <div v-if="trend" class="stats-trend" :class="trendClass">
        <n-icon size="14">
          <TrendingUp v-if="trend === 'up'" />
          <TrendingDown v-else-if="trend === 'down'" />
          <RemoveOutline v-else />
        </n-icon>
        <span v-if="trendValue">{{ trendValue }}</span>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NCard, NIcon } from 'naive-ui';
import { TrendingUp, TrendingDown, RemoveOutline } from '@vicons/ionicons5';

interface Props {
  title: string;
  value: number | string;
  unit?: string;
  subtitle?: string;
  icon?: any;
  iconColor?: string;
  iconSize?: number;
  size?: 'small' | 'medium' | 'large';
  color?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  formatter?: (value: number | string) => string;
  bordered?: boolean;
  hoverable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  subtitle: '',
  iconColor: '#18a058',
  iconSize: 24,
  size: 'medium',
  color: 'default',
  bordered: true,
  hoverable: true
});

const formattedValue = computed(() => {
  if (props.formatter) {
    return props.formatter(props.value);
  }

  if (typeof props.value === 'number') {
    return props.value.toLocaleString();
  }

  return props.value;
});

const valueClass = computed(() => {
  return `value-${props.color}`;
});

const trendClass = computed(() => {
  return `trend-${props.trend}`;
});
</script>

<style scoped>
.stats-card {
  height: 100%;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stats-primary {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stats-value {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1;
}

.stats-unit {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 400;
}

.stats-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
}

.stats-icon {
  align-self: flex-start;
}

.stats-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* 颜色变体 */
.value-primary {
  color: #18a058;
}

.value-success {
  color: #28a745;
}

.value-warning {
  color: #f59e0b;
}

.value-error {
  color: #dc3545;
}

.value-info {
  color: #17a2b8;
}

.value-default {
  color: #2c3e50;
}

/* 趋势颜色 */
.trend-up {
  color: #28a745;
}

.trend-down {
  color: #dc3545;
}

.trend-neutral {
  color: #6b7280;
}

/* 尺寸变体 */
.stats-card.n-card--small .stats-value {
  font-size: 1.5rem;
}

.stats-card.n-card--large .stats-value {
  font-size: 2.5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-content {
    gap: 6px;
  }

  .stats-value {
    font-size: 1.75rem;
  }

  .stats-subtitle {
    font-size: 0.8rem;
  }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .stats-unit,
  .stats-subtitle {
    color: #9ca3af;
  }

  .value-default {
    color: #e5e7eb;
  }
}
</style>