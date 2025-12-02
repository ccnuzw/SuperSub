<template>
  <n-tag
    :type="tagType"
    :size="size"
    :bordered="bordered"
    :round="round"
    :color="{ color: protocolColor }"
    :style="{ color: textColor }"
  >
    <template v-if="showIcon" #icon>
      <n-icon :component="iconComponent" :size="iconSize" />
    </template>
    {{ displayText }}
  </n-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NTag, NIcon } from 'naive-ui'
import {
  GlobalOutlined,
  SecurityScanOutlined,
  ShareAltOutlined,
  ThunderboltOutlined,
  WifiOutlined,
  LockOutlined,
  ApiOutlined,
  CloudOutlined,
  SafetyOutlined
} from '@vicons/antd'

interface Props {
  protocol: string
  text?: string
  size?: 'small' | 'medium' | 'large'
  type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
  variant?: 'default' | 'colorful' | 'minimal' | 'outlined'
  showIcon?: boolean
  bordered?: boolean
  round?: boolean
  colorScheme?: 'default' | 'dark' | 'pastel' | 'vibrant'
  uppercase?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  type: 'default',
  variant: 'colorful',
  showIcon: true,
  bordered: false,
  round: true,
  colorScheme: 'default',
  uppercase: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const protocolConfig: Record<string, any> = {
  // 代理协议
  vmess: {
    icon: ShareAltOutlined,
    defaultColor: '#FF6B6B',
    darkColor: '#E74C3C',
    pastelColor: '#FFB3BA',
    vibrantColor: '#FF4757',
    defaultText: 'VMess'
  },
  vless: {
    icon: SecurityScanOutlined,
    defaultColor: '#4ECDC4',
    darkColor: '#16A085',
    pastelColor: '#A8E6CF',
    vibrantColor: '#00B894',
    defaultText: 'VLESS'
  },
  trojan: {
    icon: SafetyOutlined,
    defaultColor: '#9B59B6',
    darkColor: '#8E44AD',
    pastelColor: '#DDA0DD',
    vibrantColor: '#6C5CE7',
    defaultText: 'Trojan'
  },
  ss: {
    icon: LockOutlined,
    defaultColor: '#3498DB',
    darkColor: '#2980B9',
    pastelColor: '#87CEEB',
    vibrantColor: '#0984E3',
    defaultText: 'SS'
  },
  ssr: {
    icon: ApiOutlined,
    defaultColor: '#E67E22',
    darkColor: '#D35400',
    pastelColor: '#FFB347',
    vibrantColor: '#F39C12',
    defaultText: 'SSR'
  },
  http: {
    icon: GlobalOutlined,
    defaultColor: '#27AE60',
    darkColor: '#229954',
    pastelColor: '#90EE90',
    vibrantColor: '#00B894',
    defaultText: 'HTTP'
  },
  https: {
    icon: SecurityScanOutlined,
    defaultColor: '#2ECC71',
    darkColor: '#27AE60',
    pastelColor: '#98FB98',
    vibrantColor: '#00CEC9',
    defaultText: 'HTTPS'
  },
  socks5: {
    icon: WifiOutlined,
    defaultColor: '#F39C12',
    darkColor: '#E67E22',
    pastelColor: '#FFD700',
    vibrantColor: '#FD7E14',
    defaultText: 'SOCKS5'
  },
  // 通用协议
  tcp: {
    icon: ApiOutlined,
    defaultColor: '#17A2B8',
    darkColor: '#138496',
    pastelColor: '#ADD8E6',
    vibrantColor: '#00BCD4',
    defaultText: 'TCP'
  },
  udp: {
    icon: ThunderboltOutlined,
    defaultColor: '#6C757D',
    darkColor: '#5A6268',
    pastelColor: '#D3D3D3',
    vibrantColor: '#607D8B',
    defaultText: 'UDP'
  },
  ws: {
    icon: CloudOutlined,
    defaultColor: '#20C997',
    darkColor: '#1AA179',
    pastelColor: '#98FB98',
    vibrantColor: '#26A69A',
    defaultText: 'WS'
  },
  h2: {
    icon: ThunderboltOutlined,
    defaultColor: '#6F42C1',
    darkColor: '#5A32A3',
    pastelColor: '#DDA0DD',
    vibrantColor: '#8E44AD',
    defaultText: 'H2'
  },
  grpc: {
    icon: ApiOutlined,
    defaultColor: '#FD7E14',
    darkColor: '#E85D04',
    pastelColor: '#FFB347',
    vibrantColor: '#F76D1B',
    defaultText: 'gRPC'
  }
}

const displayText = computed(() => {
  const text = props.text || protocolConfig[props.protocol.toLowerCase()]?.defaultText || props.protocol.toUpperCase()
  return props.uppercase ? text.toUpperCase() : text
})

const iconComponent = computed(() => {
  return protocolConfig[props.protocol.toLowerCase()]?.icon || ApiOutlined
})

const protocolColor = computed(() => {
  const config = protocolConfig[props.protocol.toLowerCase()]
  if (!config) return '#95A5A6'

  switch (props.colorScheme) {
    case 'dark':
      return config.darkColor
    case 'pastel':
      return config.pastelColor
    case 'vibrant':
      return config.vibrantColor
    default:
      return config.defaultColor
  }
})

const textColor = computed(() => {
  if (props.variant === 'minimal' || props.variant === 'outlined') {
    return protocolColor.value
  }

  // 对于彩色标签，使用白色文字
  if (props.variant === 'colorful') {
    return '#FFFFFF'
  }

  return 'inherit'
})

const tagType = computed(() => {
  if (props.type !== 'default') return props.type
  return 'default'
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
.n-tag {
  font-weight: 600;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  text-transform: v-bind('uppercase ? "uppercase" : "none"');
}

.n-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.n-tag:active {
  transform: translateY(0);
}

/* 特殊协议样式 */
.n-tag[data-protocol="vmess"] {
  border-left: 3px solid v-bind('protocolColor');
}

.n-tag[data-protocol="vless"] {
  border-left: 3px solid v-bind('protocolColor');
}

.n-tag[data-protocol="trojan"] {
  border-left: 3px solid v-bind('protocolColor');
}

/* 最小变体样式 */
.n-tag.n-tag--minimal {
  background-color: transparent !important;
  border: 1px solid v-bind('protocolColor') !important;
}

.n-tag.n-tag--outlined {
  background-color: v-bind('protocolColor + "10"') !important;
  border: 1px solid v-bind('protocolColor') !important;
}

/* 图标动画 */
.n-icon {
  transition: transform 0.2s ease;
}

.n-tag:hover .n-icon {
  transform: scale(1.1);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .n-tag {
    font-size: 11px;
  }
}
</style>