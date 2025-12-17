/**
 * 配置预览逻辑组合式函数
 */

import { ref, computed, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { useAuthStore } from '@/stores/auth';
import type { PreviewData } from '../components/profile/preview/types';

export interface UsePreviewOptions {
  profileId?: string | null;
  profileAlias?: string;
  autoGenerate?: boolean;
  generateInterval?: number;
}

export function usePreview(options: UsePreviewOptions = {}) {
  const message = useMessage();
  const authStore = useAuthStore();

  // 响应式数据
  const generating = ref(false);
  const refreshing = ref(false);
  const previewData = ref<PreviewData | null>(null);

  // 计算属性
  const generatedUrl = computed(() => {
    if (!options.profileAlias || !authStore.user?.sub_token) {
      return '';
    }

    return `${window.location.origin}/api/public/${authStore.user.sub_token}/${options.profileAlias}`;
  });

  // 方法
  const generatePreview = async () => {
    if (!options.profileId) {
      message.error('请先保存配置文件');
      return;
    }

    generating.value = true;
    previewData.value = null;

    try {
      // 这里应该调用API生成预览
      // 暂时使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 2000));

      previewData.value = {
        nodes: [],
        analysis: {
          total: 45,
          protocols: {
            vmess: 20,
            vless: 15,
            trojan: 10
          },
          regions: {
            '香港': 15,
            '美国': 12,
            '日本': 10,
            '新加坡': 8
          }
        },
        mode: 'local',
        content: 'proxies:\n  - name: "香港-1"\n    type: vmess\n    server: hk1.example.com\n    port: 443\n    uuid: "12345678-1234-1234-1234-123456789abc"\n    alterId: 0\n    cipher: auto\n    tls: true\n    skip-cert-verify: true\n    network: ws\n    ws-opts:\n      path: "/path"\n      headers:\n        Host: hk1.example.com',
        logs: [
          {
            level: 'INFO',
            message: '开始生成配置文件',
            timestamp: new Date().toISOString()
          },
          {
            level: 'STEP',
            message: '获取订阅源数据',
            timestamp: new Date().toISOString()
          },
          {
            level: 'SUCCESS',
            message: '配置文件生成成功',
            timestamp: new Date().toISOString()
          }
        ]
      };

      message.success('预览生成成功');
      return previewData.value;
    } catch (error) {
      message.error('生成预览失败');
      throw error;
    } finally {
      generating.value = false;
    }
  };

  const refreshPreview = async () => {
    refreshing.value = true;
    try {
      await generatePreview();
    } finally {
      refreshing.value = false;
    }
  };

  const copyUrl = async () => {
    try {
      if (generatedUrl.value) {
        await navigator.clipboard.writeText(generatedUrl.value);
        message.success('链接已复制到剪贴板');
        return generatedUrl.value;
      }
    } catch (error) {
      message.error('复制失败');
      throw error;
    }
  };

  const clearPreview = () => {
    previewData.value = null;
    clearAutoRefresh();
  };

  // 定时刷新
  let refreshTimer: NodeJS.Timeout | null = null;

  const setupAutoRefresh = () => {
    if (options.autoGenerate && options.profileId) {
      refreshTimer = setInterval(() => {
        refreshPreview();
      }, options.generateInterval || 30000);
    }
  };

  const clearAutoRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  };

  // 监听器
  watch(() => options.profileId, (newProfileId) => {
    clearAutoRefresh();
    if (newProfileId) {
      generatePreview();
      setupAutoRefresh();
    }
  });

  watch(() => options.autoGenerate, (autoGenerate) => {
    clearAutoRefresh();
    if (autoGenerate && options.profileId) {
      setupAutoRefresh();
    }
  });

  // 初始化
  if (options.profileId) {
    generatePreview();
    if (options.autoGenerate) {
      setupAutoRefresh();
    }
  }

  return {
    // 状态
    generating,
    refreshing,
    previewData,
    generatedUrl,

    // 方法
    generatePreview,
    refreshPreview,
    copyUrl,
    clearPreview,
    setupAutoRefresh,
    clearAutoRefresh
  };
}