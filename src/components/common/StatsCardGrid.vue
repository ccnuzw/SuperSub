<template>
  <div class="stats-card-grid" :class="gridClasses">
    <div
      v-for="(stat, index) in stats"
      :key="stat.key"
      class="stat-card"
      :class="[
        `stat-card--${stat.type || 'default'}`,
        `stat-card--${size}`,
        {
          'stat-card--clickable': clickable && stat.clickable !== false,
          'stat-card--loading': stat.loading,
          'stat-card--trend-up': stat.trend === 'up',
          'stat-card--trend-down': stat.trend === 'down',
          'stat-card--trend-neutral': stat.trend === 'neutral'
        }
      ]"
      :style="{ '--delay': `${index * 50}ms` }"
      @click="handleCardClick(stat, index)"
    >
      <!-- 卡片内容 -->
      <div class="stat-card__content">
        <!-- 图标区域 -->
        <div v-if="showIcons && stat.icon" class="stat-card__icon" :class="`stat-card__icon--${stat.type || 'default'}`">
          <n-icon :component="getIconComponent(stat.icon)" :size="iconSize" />
        </div>

        <!-- 数据区域 -->
        <div class="stat-card__data">
          <div class="stat-card__value">
            <n-number-animation
              :from="0"
              :to="stat.value"
              :active="animated && !stat.loading"
              :duration="1000"
              :precision="stat.precision"
            />
            <span v-if="stat.unit" class="stat-card__unit">{{ stat.unit }}</span>
          </div>

          <div class="stat-card__label">
            {{ stat.label }}
          </div>
        </div>

        <!-- 趋势指示器 -->
        <div v-if="showTrend && stat.trend" class="stat-card__trend">
          <n-icon
            :component="trendIcon"
            :size="16"
            :color="trendColor"
          />
          <span class="trend-value" :style="{ color: trendColor }">
            {{ trendValue }}
          </span>
        </div>
      </div>

      <!-- 进度条 -->
      <div v-if="showProgress && stat.progress !== undefined" class="stat-card__progress">
        <n-progress
          :percentage="stat.progress"
          :color="progressColor"
          :height="progressHeight"
          :indicator-placement="undefined"
          :processing="!!stat.loading"
        />
      </div>

      <!-- 额外信息 -->
      <div v-if="stat.extra" class="stat-card__extra">
        {{ stat.extra }}
      </div>

      <!-- 悬浮提示 -->
      <n-tooltip v-if="stat.tooltip" :placement="tooltipPlacement">
        <template #trigger>
          <div class="stat-card__tooltip-trigger"></div>
        </template>
        {{ stat.tooltip }}
      </n-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NIcon, NNumberAnimation, NProgress, NTooltip } from 'naive-ui'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
  DatabaseOutlined,
  WifiOutlined,
  DisconnectOutlined,
  HeartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined
} from '@vicons/antd'

interface StatCard {
  key: string
  label: string
  value: number
  icon?: any
  type?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'default'
  unit?: string
  precision?: number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: number
  progress?: number
  loading?: boolean
  clickable?: boolean
  tooltip?: string
  extra?: string
  onClick?: (stat: StatCard, index: number) => void
}

interface Props {
  stats: StatCard[]
  columns?: number
  gap?: number
  size?: 'small' | 'medium' | 'large'
  clickable?: boolean
  animated?: boolean
  showIcons?: boolean
  showTrend?: boolean
  showProgress?: boolean
  progressHeight?: number
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  columns: 4,
  gap: 16,
  size: 'medium',
  clickable: true,
  animated: true,
  showIcons: true,
  showTrend: true,
  showProgress: false,
  progressHeight: 4,
  tooltipPlacement: 'top'
})

const emit = defineEmits<{
  cardClick: [stat: StatCard, index: number]
}>()

const gridClasses = computed(() => [
  'stats-card-grid',
  `stats-card-grid--${props.columns}col`,
  `stats-card-grid--${props.size}`,
  {
    'stats-card-grid--clickable': props.clickable,
    'stats-card-grid--animated': props.animated
  }
])

const iconSize = computed(() => {
  const sizeMap = {
    small: 20,
    medium: 24,
    large: 32
  }
  return sizeMap[props.size]
})

const trendIcon = computed(() => {
  switch (props.stats.find(s => s.trend)?.trend) {
    case 'up':
      return ArrowUpOutlined
    case 'down':
      return ArrowDownOutlined
    default:
      return MinusOutlined
  }
})

const trendColor = computed(() => {
  const stat = props.stats.find(s => s.trend)
  if (!stat) return '#999'

  switch (stat.trend) {
    case 'up':
      return '#52c41a'
    case 'down':
      return '#ff4d4f'
    default:
      return '#999'
  }
})

const trendValue = computed(() => {
  const stat = props.stats.find(s => s.trend)
  return stat?.trendValue ? `${stat.trendValue}%` : ''
})

const progressColor = computed(() => {
  const stat = props.stats.find(s => s.progress !== undefined)
  if (!stat) return '#1890ff'

  switch (stat.type) {
    case 'success':
      return '#52c41a'
    case 'warning':
      return '#faad14'
    case 'error':
      return '#ff4d4f'
    case 'primary':
      return '#1890ff'
    default:
      return '#1890ff'
  }
})

const handleCardClick = (stat: StatCard, index: number) => {
  if (props.clickable && stat.clickable !== false) {
    if (stat.onClick) {
      stat.onClick(stat, index)
    }
    emit('cardClick', stat, index)
  }
}

// 图标映射函数
const getIconComponent = (icon: any) => {
  // 如果已经是组件，直接返回
  if (typeof icon === 'object' && icon.render) {
    return icon
  }

  // 字符串到组件的映射
  const iconMap = {
    database: DatabaseOutlined,
    wifi: WifiOutlined,
    disconnect: DisconnectOutlined,
    heart: HeartOutlined,
    clock: ClockCircleOutlined,
    check: CheckCircleOutlined,
    thunderbolt: ThunderboltOutlined,
    line: LineChartOutlined,
    arrowup: ArrowUpOutlined,
    arrowdown: ArrowDownOutlined
  }

  return iconMap[icon as keyof typeof iconMap] || DatabaseOutlined
}
</script>

<style scoped>
.stats-card-grid {
  display: grid;
  gap: var(--gap, 16px);
  padding: 0;
}

/* 列数配置 */
.stats-card-grid--1col {
  grid-template-columns: 1fr;
}

.stats-card-grid--2col {
  grid-template-columns: repeat(2, 1fr);
}

.stats-card-grid--3col {
  grid-template-columns: repeat(3, 1fr);
}

.stats-card-grid--4col {
  grid-template-columns: repeat(4, 1fr);
}

.stats-card-grid--5col {
  grid-template-columns: repeat(5, 1fr);
}

.stats-card-grid--6col {
  grid-template-columns: repeat(6, 1fr);
}

/* 卡片样式 */
.stat-card {
  position: relative;
  background-color: var(--n-color);
  border: 1px solid var(--n-border-color);
  border-radius: 12px;
  padding: 20px;
  cursor: default;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.stat-card--small {
  padding: 16px;
  border-radius: 8px;
}

.stat-card--large {
  padding: 24px;
  border-radius: 16px;
}

.stat-card--clickable {
  cursor: pointer;
}

.stat-card--clickable:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--n-color-primary);
}

.stat-card--clickable:active {
  transform: translateY(-2px);
  transition-duration: 0.1s;
}

/* 卡片类型样式 */
.stat-card--primary {
  border-left: 4px solid #1890ff;
}

.stat-card--success {
  border-left: 4px solid #52c41a;
}

.stat-card--warning {
  border-left: 4px solid #faad14;
}

.stat-card--error {
  border-left: 4px solid #ff4d4f;
}

.stat-card--info {
  border-left: 4px solid #722ed1;
}

/* 加载状态 */
.stat-card--loading {
  opacity: 0.7;
  pointer-events: none;
}

.stat-card--loading::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* 卡片内容布局 */
.stat-card__content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-card--small .stat-card__content {
  gap: 12px;
}

.stat-card__icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 20px;
  color: white;
}

.stat-card--small .stat-card__icon {
  width: 40px;
  height: 40px;
  font-size: 16px;
  border-radius: 8px;
}

.stat-card--large .stat-card__icon {
  width: 56px;
  height: 56px;
  font-size: 24px;
  border-radius: 16px;
}

/* 图标类型颜色 */
.stat-card__icon--primary {
  background-color: #1890ff;
}

.stat-card__icon--success {
  background-color: #52c41a;
}

.stat-card__icon--warning {
  background-color: #faad14;
}

.stat-card__icon--error {
  background-color: #ff4d4f;
}

.stat-card__icon--info {
  background-color: #722ed1;
}

.stat-card__icon--default {
  background-color: #8c8c8c;
}

.stat-card__data {
  flex: 1;
  min-width: 0;
}

.stat-card__value {
  font-size: 24px;
  font-weight: 700;
  color: var(--n-text-color);
  line-height: 1.2;
  margin-bottom: 4px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-card--small .stat-card__value {
  font-size: 20px;
}

.stat-card--large .stat-card__value {
  font-size: 32px;
}

.stat-card__unit {
  font-size: 14px;
  font-weight: 400;
  color: var(--n-text-color-3);
}

.stat-card__label {
  font-size: 14px;
  color: var(--n-text-color-3);
  font-weight: 500;
}

.stat-card--small .stat-card__label {
  font-size: 12px;
}

.stat-card--large .stat-card__label {
  font-size: 16px;
}

/* 趋势指示器 */
.stat-card__trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
}

.trend-value {
  font-variant-numeric: tabular-nums;
}

/* 进度条 */
.stat-card__progress {
  margin-top: 12px;
}

.stat-card--small .stat-card__progress {
  margin-top: 8px;
}

.stat-card--large .stat-card__progress {
  margin-top: 16px;
}

/* 额外信息 */
.stat-card__extra {
  margin-top: 8px;
  font-size: 12px;
  color: var(--n-text-color-3);
  font-style: italic;
}

/* 提示触发器 */
.stat-card__tooltip-trigger {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* 动画效果 */
.stats-card-grid--animated .stat-card {
  animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
  animation-delay: var(--delay);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .stats-card-grid--4col {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-card-grid--5col,
  .stats-card-grid--6col {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-card-grid--3col,
  .stats-card-grid--4col,
  .stats-card-grid--5col,
  .stats-card-grid--6col {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-card {
    padding: 16px;
  }

  .stat-card__value {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .stats-card-grid--2col,
  .stats-card-grid--3col,
  .stats-card-grid--4col,
  .stats-card-grid--5col,
  .stats-card-grid--6col {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 12px;
  }

  .stat-card__content {
    gap: 8px;
  }

  .stat-card__icon {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }

  .stat-card__value {
    font-size: 18px;
  }
}

/* 深色主题适配 */
.dark .stat-card {
  background-color: var(--n-color);
  border-color: var(--n-border-color);
}

.dark .stat-card--clickable:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

/* 悬浮效果增强 */
.stat-card:hover {
  border-color: var(--n-color-primary);
}

.stat-card--trend-up:hover {
  border-color: #52c41a;
}

.stat-card--trend-down:hover {
  border-color: #ff4d4f;
}

/* 数字格式化优化 */
.stat-card__value {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
</style>