/**
 * 节点信息组件
 * 显示节点的主要信息：名称、协议、地区、服务器等
 */

<template>
  <div class="node-card__content">
    <div class="node-card__header">
      <h3 class="node-card__name">{{ node.name }}</h3>
      <div class="node-card__badges">
        <SsBadge
          :variant="getProtocolVariant(node.protocol)"
          size="sm"
        >
          {{ node.protocol.toUpperCase() }}
        </SsBadge>
        <SsBadge
          v-if="node.is_premium"
          variant="warning"
          size="sm"
        >
          高级
        </SsBadge>
      </div>
    </div>

    <div class="node-card__info">
      <div class="node-location">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{{ node.region || node.server }}</span>
      </div>
      <div class="node-server">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
        </svg>
        <span>{{ node.server }}:{{ node.port }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SsBadge } from '@/components/base';
import type { Node } from '@/types';

interface Props {
  node: Node;
}

defineProps<Props>();

const getProtocolVariant = (protocol: string): 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
  const variantMap: Record<string, any> = {
    vmess: 'primary',
    vless: 'secondary',
    trojan: 'success',
    shadowsocks: 'warning',
    socks5: 'error'
  };
  return variantMap[protocol] || 'secondary';
};
</script>

<style scoped>
.node-card__content {
  @apply space-y-3;
}

.node-card__header {
  @apply flex items-center justify-between mb-2;
}

.node-card__name {
  @apply font-semibold text-gray-900 truncate flex-1 mr-3;
}

.node-card__badges {
  @apply flex space-x-2;
}

.node-card__info {
  @apply space-y-2 text-sm;
}

.node-location,
.node-server {
  @apply flex items-center space-x-2 text-gray-600;
}
</style>