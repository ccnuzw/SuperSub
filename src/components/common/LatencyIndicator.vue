<template>
  <div class="latency-indicator" :class="statusClass">
    <n-icon :component="iconComponent" :size="iconSize" v-if="showIcon" />
    <span class="latency-value">{{ formattedValue }}</span>
    <span v-if="showUnit" class="latency-unit">{{ unit }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NIcon } from 'naive-ui'
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  LoadingOutlined
} from '@vicons/antd'

interface Props {
  latency: number | null | undefined
  unit?: 'ms' | 's'
  showUnit?: boolean
  showIcon?: boolean
  size?: 'small' | 'medium' | 'large'
  precision?: number
  thresholds?: {
    good: number
    medium: number
    poor: number
  }
  colorScheme?: 'default' | 'network' | 'performance'
  loadingLabel?: string
  unknownLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  unit: 'ms',
  showUnit: true,
  showIcon: true,
  size: 'medium',
  precision: 0,
  thresholds: () => ({ good: 100, medium: 300, poor: 500 }),
  colorScheme: 'default',
  loadingLabel: '---',
  unknownLabel: '?'
})

const defaultThresholds = {
  good: props.thresholds.good,
  medium: props.thresholds.medium,
  poor: props.thresholds.poor
}

const networkColorScheme = {
  good: '#10b981',      // green
  medium: '#f59e0b',    // amber
  poor: '#ef4444',      // red
  unknown: '#9ca3af'    // gray
}

const performanceColorScheme = {
  good: '#059669',      // emerald
  medium: '#d97706',    // orange
  poor: '#dc2626',      // red
  unknown: '#6b7280'    // gray
}

const defaultColorScheme = {
  good: '#52c41a',      // green
  medium: '#faad14',    // gold
  poor: '#ff4d4f',      // red
  unknown: '#d9d9d9'    // light gray
}

const latencyStatus = computed(() => {
  if (props.latency === null || props.latency === undefined) return 'unknown'
  if (props.latency < 0) return 'loading'

  const value = props.latency
  if (value <= defaultThresholds.good) return 'good'
  if (value <= defaultThresholds.medium) return 'medium'
  return 'poor'
})

const iconComponent = computed(() => {
  switch (latencyStatus.value) {
    case 'good':
      return ThunderboltOutlined
    case 'medium':
      return ClockCircleOutlined
    case 'poor':
      return WarningOutlined
    case 'loading':
      return LoadingOutlined
    default:
      return CloseCircleOutlined
  }
})

const colorScheme = computed(() => {
  switch (props.colorScheme) {
    case 'network':
      return networkColorScheme
    case 'performance':
      return performanceColorScheme
    default:
      return defaultColorScheme
  }
})

const currentColor = computed(() => {
  const scheme = colorScheme.value
  const status = latencyStatus.value
  return scheme[status as keyof typeof scheme] || scheme.unknown
})

const statusClass = computed(() => [
  `latency-indicator--${latencyStatus.value}`,
  `latency-indicator--${props.size}`,
  `latency-indicator--${props.colorScheme}`
])

const formattedValue = computed(() => {
  if (props.latency === null || props.latency === undefined) {
    return props.unknownLabel
  }
  if (props.latency < 0) {
    return props.loadingLabel
  }

  // Convert to seconds if needed
  let value = props.latency
  if (props.unit === 's') {
    value = value / 1000
  }

  return value.toFixed(props.precision)
})

const iconSize = computed(() => {
  const sizeMap = {
    small: 12,
    medium: 14,
    large: 16
  }
  return sizeMap[props.size]
})
</script>

<style scoped>
.latency-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  transition: all 0.2s ease;
  border-radius: 4px;
  padding: 2px 6px;
}

.latency-indicator--small {
  font-size: 12px;
  line-height: 1.2;
}

.latency-indicator--medium {
  font-size: 14px;
  line-height: 1.4;
}

.latency-indicator--large {
  font-size: 16px;
  line-height: 1.5;
  padding: 4px 8px;
}

.latency-indicator--good {
  color: v-bind('currentColor');
  background-color: v-bind('currentColor + "15"');
}

.latency-indicator--medium {
  color: v-bind('currentColor');
  background-color: v-bind('currentColor + "15"');
}

.latency-indicator--poor {
  color: v-bind('currentColor');
  background-color: v-bind('currentColor + "15"');
}

.latency-indicator--unknown {
  color: v-bind('currentColor');
  background-color: v-bind('currentColor + "10"');
}

.latency-indicator--loading {
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.1);
}

.latency-value {
  font-variant-numeric: tabular-nums;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
}

.latency-unit {
  font-size: 0.75em;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.latency-indicator:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.latency-indicator:active {
  transform: translateY(0);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.latency-indicator--loading .n-icon {
  animation: pulse 1.5s ease-in-out infinite;
}
</style>