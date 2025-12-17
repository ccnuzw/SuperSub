/**
 * 配置文件预览模态框组件
 * 显示配置文件的详细信息和操作
 */

<template>
  <NModal
    :show="show"
    @update:show="$emit('update:show', $event)"
    preset="card"
    class="w-[800px] max-w-[90vw]"
    title="配置文件预览"
  >
    <div class="profile-preview-modal">
      <!-- 基本信息 -->
      <div class="preview-section">
        <h4 class="section-title">基本信息</h4>
        <div class="info-grid">
          <div class="info-item">
            <label class="info-label">名称</label>
            <div class="info-value">{{ profile?.name }}</div>
          </div>
          <div class="info-item">
            <label class="info-label">别名</label>
            <div class="info-value">
              <code v-if="profile?.alias" class="alias-code">{{ profile.alias }}</code>
              <span v-else class="text-gray-400">未设置</span>
            </div>
          </div>
          <div class="info-item">
            <label class="info-label">生成模式</label>
            <div class="info-value">
              <SsBadge
                :variant="profile?.generation_mode === 'local' ? 'primary' : 'secondary'"
              >
                {{ profile?.generation_mode === 'local' ? '本地生成' : '远程生成' }}
              </SsBadge>
            </div>
          </div>
          <div class="info-item">
            <label class="info-label">创建时间</label>
            <div class="info-value">{{ formatDate(profile?.created_at) }}</div>
          </div>
        </div>
      </div>

      <!-- 配置链接 -->
      <div v-if="profile?.alias && subToken" class="preview-section">
        <h4 class="section-title">订阅链接</h4>
        <div class="url-section">
          <div class="url-input-wrapper">
            <SsInput
              :model-value="generateProfileUrl()"
              readonly
              class="url-input"
            />
            <SsButton
              variant="outline"
              @click="copyProfileUrl"
            >
              复制链接
            </SsButton>
          </div>
          <div class="url-actions">
            <SsButton
              variant="ghost"
              size="sm"
              @click="generateQRCode"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              生成二维码
            </SsButton>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="preview-section">
        <h4 class="section-title">统计信息</h4>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ nodeCount }}</div>
            <div class="stat-label">总节点数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ subscriptionCount }}</div>
            <div class="stat-label">订阅源</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ manualNodeCount }}</div>
            <div class="stat-label">手动节点</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ protocolCount }}</div>
            <div class="stat-label">协议类型</div>
          </div>
        </div>
      </div>

      <!-- 协议分布 -->
      <div v-if="protocolDistribution.length > 0" class="preview-section">
        <h4 class="section-title">协议分布</h4>
        <div class="protocol-chart">
          <div class="protocol-bars">
            <div
              v-for="item in protocolDistribution"
              :key="item.protocol"
              class="protocol-bar"
            >
              <div class="protocol-info">
                <span class="protocol-name">{{ item.protocol.toUpperCase() }}</span>
                <span class="protocol-count">{{ item.count }}</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${(item.count / nodeCount) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 地区分布 -->
      <div v-if="regionDistribution.length > 0" class="preview-section">
        <h4 class="section-title">地区分布</h4>
        <div class="region-cloud">
          <span
            v-for="item in regionDistribution"
            :key="item.region"
            class="region-tag"
            :style="{ fontSize: `${12 + (item.count / nodeCount) * 8}px` }"
          >
            {{ item.region }} ({{ item.count }})
          </span>
        </div>
      </div>

      <!-- 配置内容预览 -->
      <div class="preview-section">
        <div class="section-header">
          <h4 class="section-title">配置内容预览</h4>
          <div class="section-actions">
            <SsButton
              variant="ghost"
              size="sm"
              @click="refreshPreview"
              :loading="refreshing"
            >
              刷新
            </SsButton>
            <SsButton
              variant="ghost"
              size="sm"
              @click="exportConfig"
            >
              导出
            </SsButton>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="preview-loading">
          <div class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mr-3"></div>
            <span class="text-gray-600">正在加载配置...</span>
          </div>
        </div>

        <!-- 配置内容 -->
        <div v-else-if="previewContent" class="config-content">
          <pre class="content-display">{{ previewContent }}</pre>
        </div>

        <!-- 空状态 -->
        <div v-else class="preview-empty">
          <div class="text-center py-8">
            <div class="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p class="text-gray-500">暂无配置内容</p>
            <SsButton
              variant="primary"
              class="mt-4"
              @click="loadPreview"
            >
              加载预览
            </SsButton>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <div class="footer-left">
          <SsButton
            variant="outline"
            @click="exportFullConfig"
          >
            导出完整配置
          </SsButton>
        </div>
        <div class="footer-right">
          <SsButton
            variant="outline"
            @click="closeModal"
          >
            关闭
          </SsButton>
          <SsButton
            variant="primary"
            @click="editProfile"
          >
            编辑配置
          </SsButton>
        </div>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMessage } from 'naive-ui';
import { NModal } from 'naive-ui';
import { SsButton, SsInput, SsBadge } from '@/components/base';
import { useAuthStore } from '@/stores/auth';
import { useClipboard } from '@/composables/common/useClipboard';
import type { Profile } from '@/types';

interface IProps {
  show: boolean;
  profile?: Profile | null;
}

const props = defineProps<IProps>();

const emit = defineEmits<{
  'update:show': [show: boolean];
  edit: [profile: Profile];
}>();

const router = useRouter();
const message = useMessage();
const authStore = useAuthStore();
const { copyText } = useClipboard();

// 响应式数据
const loading = ref(false);
const refreshing = ref(false);
const previewContent = ref('');

// 模拟数据
const nodeCount = ref(45);
const subscriptionCount = ref(3);
const manualNodeCount = ref(12);
const protocolDistribution = ref([
  { protocol: 'vmess', count: 20 },
  { protocol: 'trojan', count: 15 },
  { protocol: 'vless', count: 10 }
]);
const regionDistribution = ref([
  { region: '香港', count: 15 },
  { region: '美国', count: 12 },
  { region: '日本', count: 10 },
  { region: '新加坡', count: 8 }
]);

// 计算属性
const subToken = computed(() => authStore.user?.sub_token || '');
const protocolCount = computed(() => protocolDistribution.value.length);

// 方法
const generateProfileUrl = (): string => {
  if (!props.profile?.alias || !subToken.value) {
    return '';
  }
  return `${window.location.origin}/api/public/${subToken.value}/${props.profile.alias}`;
};

const copyProfileUrl = async () => {
  const url = generateProfileUrl();
  if (url) {
    await copyText(url);
  }
};

const generateQRCode = () => {
  message.info('二维码生成功能待实现');
};

const loadPreview = async () => {
  if (!props.profile) return;

  loading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    previewContent.value = `proxies:
  - name: "香港-1"
    type: vmess
    server: hk1.example.com
    port: 443
    uuid: "12345678-1234-1234-1234-123456789abc"
    alterId: 0
    cipher: auto
    tls: true
    skip-cert-verify: true
    network: ws
    ws-opts:
      path: "/path"
      headers:
        Host: hk1.example.com

proxy-groups:
  - name: "🚀 节点选择"
    type: select
    proxies:
      - "♻️ 自动选择"
      - "🔰 故障转移"
      - "DIRECT"

rules:
  - DOMAIN-SUFFIX,google.com,🚀 节点选择
  - DOMAIN-SUFFIX,youtube.com,🚀 节点选择
  - GEOIP,CN,DIRECT
  - MATCH,🚀 节点选择`;
  } catch (error) {
    message.error('加载预览失败');
  } finally {
    loading.value = false;
  }
};

const refreshPreview = async () => {
  refreshing.value = true;
  await loadPreview();
  refreshing.value = false;
  message.success('预览已刷新');
};

const exportConfig = () => {
  message.info('导出功能待实现');
};

const exportFullConfig = () => {
  message.info('完整导出功能待实现');
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

const closeModal = () => {
  emit('update:show', false);
};

const editProfile = () => {
  if (props.profile) {
    emit('edit', props.profile);
    closeModal();
  }
};

// 监听器
watch(() => props.show, (show) => {
  if (show && props.profile) {
    loadPreview();
  }
});
</script>

<style scoped>
.profile-preview-modal {
  @apply space-y-6;
}

.preview-section {
  @apply space-y-4;
}

.section-title {
  @apply text-lg font-semibold text-gray-900;
}

.section-header {
  @apply flex justify-between items-center;
}

.section-actions {
  @apply flex space-x-2;
}

.info-grid {
  @apply grid grid-cols-2 gap-4;
}

.info-item {
  @apply space-y-2;
}

.info-label {
  @apply block text-sm font-medium text-gray-700;
}

.info-value {
  @apply text-gray-900;
}

.alias-code {
  @apply bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-600;
}

.url-section {
  @apply space-y-3;
}

.url-input-wrapper {
  @apply flex space-x-2;
}

.url-input {
  @apply flex-1;
}

.url-actions {
  @apply flex space-x-2;
}

.stats-grid {
  @apply grid grid-cols-4 gap-4;
}

.stat-card {
  @apply bg-gray-50 p-4 rounded-lg text-center;
}

.stat-value {
  @apply text-2xl font-bold text-primary-600;
}

.stat-label {
  @apply text-sm text-gray-600 mt-1;
}

.protocol-chart {
  @apply space-y-3;
}

.protocol-bar {
  @apply space-y-2;
}

.protocol-info {
  @apply flex justify-between items-center;
}

.protocol-name {
  @apply font-medium text-gray-900;
}

.protocol-count {
  @apply text-sm text-gray-600;
}

.progress-bar {
  @apply w-full bg-gray-200 rounded-full h-2;
}

.progress-fill {
  @apply bg-primary-500 h-2 rounded-full transition-all duration-300;
}

.region-cloud {
  @apply flex flex-wrap gap-2;
}

.region-tag {
  @apply inline-block px-3 py-1 bg-primary-100 text-primary-800 rounded-full font-medium transition-all duration-200 hover:bg-primary-200;
}

.config-content {
  @apply bg-gray-50 rounded-lg;
}

.content-display {
  @apply p-4 text-sm font-mono text-gray-800 overflow-x-auto max-h-96 overflow-y-auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.preview-loading,
.preview-empty {
  @apply bg-gray-50 rounded-lg;
}

.modal-footer {
  @apply flex justify-between items-center;
}

.footer-left,
.footer-right {
  @apply flex space-x-2;
}

/* 深色模式支持 */
.dark .section-title {
  @apply text-gray-100;
}

.dark .info-label {
  @apply text-gray-300;
}

.dark .info-value {
  @apply text-gray-100;
}

.dark .stat-card {
  @apply bg-gray-700;
}

.dark .stat-value {
  @apply text-primary-400;
}

.dark .stat-label {
  @apply text-gray-400;
}

.dark .config-content,
.dark .preview-loading,
.dark .preview-empty {
  @apply bg-gray-800;
}

.dark .content-display {
  @apply text-gray-200;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .info-grid {
    @apply grid-cols-1;
  }

  .stats-grid {
    @apply grid-cols-2;
  }

  .section-header {
    @apply flex-col items-start space-y-2;
  }

  .modal-footer {
    @apply flex-col space-y-3;
  }

  .footer-left,
  .footer-right {
    @apply w-full justify-center;
  }
}
</style>