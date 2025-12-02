<template>
  <div class="status-badge" :class="badgeClasses" @click="handleClick">
    <!-- 状态指示灯 -->
    <div v-if="showIndicator" class="status-indicator" :class="`status-indicator--${status}`">
      <div v-if="hasPulseEffect" class="status-indicator__pulse"></div>
      <div class="status-indicator__core"></div>
    </div>

    <!-- 图标 -->
    <div v-if="showIcon" class="status-icon">
      <n-icon :component="iconComponent" :size="iconSize" />
    </div>

    <!-- 文字内容 -->
    <div v-if="displayText" class="status-text">
      {{ displayText }}
    </div>

    <!-- 进度条（可选） -->
    <div v-if="progress && progressValue !== undefined" class="status-progress">
      <div
        class="status-progress__bar"
        :style="{
          width: `${Math.min(100, Math.max(0, progressValue))}%`,
          backgroundColor: statusColor
        }"
      ></div>
    </div>

    <!-- 工具提示 -->
    <n-tooltip v-if="tooltip" :placement="tooltipPlacement" trigger="hover">
      <template #trigger>
        <div class="status-badge__tooltip-trigger"></div>
      </template>
      <div class="status-tooltip">
        <div class="status-tooltip__title">{{ tooltipTitle }}</div>
        <div v-if="tooltipDescription" class="status-tooltip__description">
          {{ tooltipDescription }}
        </div>
      </div>
    </n-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NIcon, NTooltip } from 'naive-ui'
import {
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
  WarningFilled,
  ClockCircleFilled,
  SyncOutlined,
  CheckOutlined,
  CloseOutlined,
  WifiOutlined,
  DisconnectOutlined,
  ThunderboltOutlined,
  ApiOutlined
} from '@vicons/antd'

interface Props {
  status: 'online' | 'offline' | 'testing' | 'error' | 'warning' | 'unknown' | 'loading' | 'connecting' | 'disconnecting'
  text?: string
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'minimal' | 'pills' | 'glass' | 'neon' | 'gradient'
  showIcon?: boolean
  showIndicator?: boolean
  bordered?: boolean
  round?: boolean
  colorScheme?: 'default' | 'health' | 'connection' | 'modern'
  pulse?: boolean
  glow?: boolean
  progress?: number
  tooltip?: string
  tooltipDescription?: string
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  variant: 'default',
  showIcon: true,
  showIndicator: false,
  bordered: true,
  round: false,
  colorScheme: 'default',
  pulse: false,
  glow: false,
  progress: undefined,
  tooltipPlacement: 'top'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const statusConfig = {
  online: {
    icon: CheckCircleFilled,
    color: '#52c41a',
    bgColor: '#f6ffed',
    borderColor: '#b7eb8f',
    textColor: '#389e0d',
    gradient: "linear-gradient(135deg, #52c41a 0%, #73d13d 100%)",
    neon: '#00ff41',
    defaultText: '在线'
  },
  offline: {
    icon: CloseCircleFilled,
    color: '#ff4d4f',
    bgColor: '#fff2f0',
    borderColor: '#ffccc7',
    textColor: '#cf1322',
    gradient: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
    neon: '#ff0040',
    defaultText: '离线'
  },
  testing: {
    icon: LoadingOutlined,
    color: '#1890ff',
    bgColor: '#f0f9ff',
    borderColor: '#91d5ff',
    textColor: '#0958d9',
    gradient: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
    neon: '#0080ff',
    defaultText: '测试中'
  },
  error: {
    icon: WarningFilled,
    color: '#ff4d4f',
    bgColor: '#fff2f0',
    borderColor: '#ffccc7',
    textColor: '#cf1322',
    gradient: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
    neon: '#ff0040',
    defaultText: '错误'
  },
  warning: {
    icon: WarningFilled,
    color: '#faad14',
    bgColor: '#fffbe6',
    borderColor: '#ffe58f',
    textColor: '#d48806',
    gradient: "linear-gradient(135deg, #faad14 0%, #ffc53d 100%)",
    neon: "#ffcc00",
    defaultText: '警告'
  },
  unknown: {
    icon: ClockCircleFilled,
    color: '#8c8c8c',
    bgColor: '#fafafa',
    borderColor: '#d9d9d9',
    textColor: '#595959',
    gradient: 'linear-gradient(135deg, #8c8c8c 0%, #bfbfbf 100%)',
    neon: '#888888',
    defaultText: '未知'
  },
  loading: {
    icon: LoadingOutlined,
    color: '#1890ff',
    bgColor: '#f0f9ff',
    borderColor: '#91d5ff',
    textColor: '#0958d9',
    gradient: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
    neon: '#0080ff',
    defaultText: '加载中'
  },
  connecting: {
    icon: WifiOutlined,
    color: '#1890ff',
    bgColor: '#f0f9ff',
    borderColor: '#91d5ff',
    textColor: '#0958d9',
    gradient: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
    neon: '#0080ff',
    defaultText: '连接中'
  },
  disconnecting: {
    icon: DisconnectOutlined,
    color: '#faad14',
    bgColor: '#fffbe6',
    borderColor: '#ffe58f',
    textColor: '#d48806',
    gradient: "linear-gradient(135deg, #faad14 0%, #ffc53d 100%)",
    neon: "#ffcc00",
    defaultText: '断开中'
  }
}

const healthColorScheme = {
  online: '#10b981',
  offline: '#ef4444',
  testing: '#3b82f6',
  error: '#ef4444',
  warning: '#f59e0b',
  unknown: '#9ca3af',
  loading: '#3b82f6',
  connecting: '#3b82f6',
  disconnecting: '#f59e0b'
}

const connectionColorScheme = {
  online: '#059669',
  offline: '#dc2626',
  testing: '#2563eb',
  error: '#dc2626',
  warning: '#d97706',
  unknown: '#6b7280',
  loading: '#2563eb',
  connecting: '#2563eb',
  disconnecting: '#d97706'
}

const modernColorScheme = {
  online: '#22c55e',
  offline: '#ef4444',
  testing: '#3b82f6',
  error: '#ef4444',
  warning: '#f59e0b',
  unknown: '#64748b',
  loading: '#3b82f6',
  connecting: '#3b82f6',
  disconnecting: '#f59e0b'
}

const iconComponent = computed(() => {
  return statusConfig[props.status].icon
})

const statusColor = computed(() => {
  if (props.colorScheme === 'health') {
    return healthColorScheme[props.status]
  }
  if (props.colorScheme === 'connection') {
    return connectionColorScheme[props.status]
  }
  if (props.colorScheme === 'modern') {
    return modernColorScheme[props.status]
  }
  return statusConfig[props.status].color
})

const bgColor = computed(() => {
  return statusConfig[props.status].bgColor
})

const borderColor = computed(() => {
  return statusConfig[props.status].borderColor
})

const textColor = computed(() => {
  return statusConfig[props.status].textColor
})

const gradientColor = computed(() => {
  return statusConfig[props.status].gradient
})

const neonColor = computed(() => {
  return statusConfig[props.status].neon
})

const displayText = computed(() => {
  return props.text || statusConfig[props.status].defaultText
})

const iconSize = computed(() => {
  const sizeMap = {
    small: 14,
    medium: 16,
    large: 20
  }
  return sizeMap[props.size]
})

const progressValue = computed(() => {
  return props.progress
})

const hasPulseEffect = computed(() => {
  return props.pulse && (props.status === 'online' || props.status === 'testing')
})

const tooltipTitle = computed(() => {
  return props.tooltip || displayText.value
})

const badgeClasses = computed(() => [
  'status-badge',
  `status-badge--${props.size}`,
  `status-badge--${props.variant}`,
  `status-badge--${props.status}`,
  `status-badge--${props.colorScheme}`,
  {
    'status-badge--round': props.round,
    'status-badge--bordered': props.bordered,
    'status-badge--glow': props.glow,
    'status-badge--pulse': props.pulse,
    'status-badge--clickable': !!props.tooltip
  }
])

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-weight: 500;
  font-size: 14px;
  border-radius: 6px;
  cursor: default;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.status-badge--small {
  padding: 4px 8px;
  font-size: 12px;
  gap: 4px;
}

.status-badge--large {
  padding: 8px 16px;
  font-size: 16px;
  gap: 8px;
}

/* 默认变体 */
.status-badge--default {
  background-color: v-bind('bgColor');
  border: 1px solid v-bind('borderColor');
  color: v-bind('textColor');
}

.status-badge--default:hover {
  border-color: v-bind('statusColor');
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 极简变体 */
.status-badge--minimal {
  background-color: transparent;
  color: v-bind('statusColor');
  border: 1px solid v-bind('statusColor');
}

.status-badge--minimal:hover {
  background-color: v-bind('statusColor');
  color: white;
}

/* 胶丸变体 */
.status-badge--pills {
  background-color: v-bind('bgColor');
  border: none;
  color: v-bind('textColor');
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-badge--pills:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 玻璃变体 */
.status-badge--glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: v-bind('statusColor');
  border-radius: 12px;
}

.status-badge--glass:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: v-bind('statusColor');
}

/* 霓虹变体 */
.status-badge--neon {
  background: rgba(0, 0, 0, 0.8);
  border: 2px solid v-bind('neonColor');
  color: v-bind('neonColor');
  text-shadow: 0 0 10px v-bind('neonColor');
  box-shadow: 0 0 20px v-bind('neonColor');
  border-radius: 8px;
}

.status-badge--neon:hover {
  box-shadow: 0 0 30px v-bind('neonColor'), 0 0 50px v-bind('neonColor');
  transform: scale(1.05);
}

/* 渐变变体 */
.status-badge--gradient {
  background: v-bind('gradientColor');
  border: none;
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.status-badge--gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

/* 圆角样式 */
.status-badge--round {
  border-radius: 20px;
}

/* 发光效果 */
.status-badge--glow:hover {
  box-shadow: 0 0 15px v-bind('statusColor');
}

/* 脉冲效果 */
.status-badge--pulse .status-icon {
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* 状态指示灯 */
.status-indicator {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-badge--large .status-indicator {
  width: 10px;
  height: 10px;
}

.status-indicator__core {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: v-bind('statusColor');
  position: relative;
  z-index: 2;
}

.status-indicator__pulse {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: v-bind('statusColor');
  opacity: 0.6;
  animation: pulseAnimation 2s ease-in-out infinite;
}

@keyframes pulseAnimation {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 0.6;
  }
}

/* 状态图标 */
.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 状态文字 */
.status-text {
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* 进度条 */
.status-progress {
  width: 40px;
  height: 3px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-left: 6px;
}

.status-badge--large .status-progress {
  width: 50px;
  height: 4px;
}

.status-progress__bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 工具提示触发器 */
.status-badge__tooltip-trigger {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  cursor: pointer;
}

/* 工具提示样式 */
.status-tooltip {
  text-align: center;
}

.status-tooltip__title {
  font-weight: 600;
  margin-bottom: 4px;
}

.status-tooltip__description {
  font-size: 12px;
  opacity: 0.8;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .status-badge {
    font-size: 12px;
    padding: 4px 8px;
    gap: 4px;
  }

  .status-badge--large {
    font-size: 14px;
    padding: 6px 12px;
    gap: 6px;
  }

  .status-progress {
    display: none;
  }
}

/* 深色主题适配 */
.dark .status-badge--glass {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dark .status-badge--glass:hover {
  background: rgba(0, 0, 0, 0.5);
}

/* 交互状态 */
.status-badge--clickable {
  cursor: pointer;
}

.status-badge--clickable:hover {
  transform: translateY(-1px);
  transition: all 0.2s ease;
}

.status-badge--clickable:active {
  transform: translateY(0);
  transition-duration: 0.1s;
}
</style>