import { ref, computed, watch, h } from 'vue';
import { useMessage, NButton, NTag } from 'naive-ui';
import { Node, ApiResponse, INode } from '@/types';
import { useGroupStore } from '@/stores/groups';
import { regenerateLink, type ParsedNode } from '@/utils/nodeParser';
import httpClient from '@/services/http/HttpClient';
import { getNaiveTagColor } from '@/utils/colors';
import type { DataTableColumns } from 'naive-ui'
import type { VNodeChild } from 'vue';

interface PreviewData {
  mode: 'local' | 'remote';
  nodes?: Partial<Node>[];
  urls?: string[];
  analysis?: any;
}

export function useSubscriptionPreview() {
  const message = useMessage();
  const nodeGroupStore = useGroupStore();
  const previewData = ref<PreviewData | null>(null);
  const loading = ref(false);
  const importLoading = ref(false);
  const applyRules = ref(true);
  const selectedGroupId = ref<string | undefined>(undefined);
  const error = ref<string | null>(null);

  const nodes = computed(() => {
    if (previewData.value?.mode === 'local') {
      return previewData.value.nodes || [];
    }
    return [];
  });

  const columns: DataTableColumns<Partial<INode>> = [
    { title: '名称', key: 'name', ellipsis: { tooltip: true }, fixed: 'left', width: 200 },
    {
      title: '类型',
      key: 'protocol',
      width: 100,
      align: 'center',
      render(row: Partial<INode>, rowIndex: number): VNodeChild {
        const protocol = row.protocol || row.type || 'N/A';
        return h(NTag, {
          size: 'small',
          round: true,
          color: getNaiveTagColor(protocol, 'protocol')
        }, { default: () => protocol.toUpperCase() });
      }
    },
    { title: '服务器', key: 'server', ellipsis: { tooltip: true }, width: 180 },
    { title: '端口', key: 'port', width: 80, align: 'center' },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      align: 'center',
      fixed: 'right',
      render(row: Partial<INode>, rowIndex: number): VNodeChild {
        return h(NButton, {
          size: 'tiny',
          ghost: true,
          type: 'primary',
          onClick: () => {
            const link = regenerateLink(row as ParsedNode);
            if (link) {
              navigator.clipboard.writeText(link);
              message.success('已复制完整链接');
            } else {
              navigator.clipboard.writeText(row.raw || '');
              message.success('已复制原始链接 (回退)');
            }
          }
        }, { default: () => '复制链接' });
      }
    }
  ];

  const fetchPreview = async (subscriptionUrl: string, subscriptionId: string, profileId?: string | null) => {
    if (!subscriptionUrl) {
      previewData.value = null;
      return;
    }
    loading.value = true;
    previewData.value = null;
    error.value = null;

    try {
      // If there's a profileId, it means this subscription is part of a profile.
      // We should use the profile's preview logic.
      if (profileId) {
        const response = await httpClient.get<ApiResponse<PreviewData>>(`/profiles/${profileId}/preview-nodes`);
        if (response.data.success) {
          previewData.value = response.data.data;
        } else {
          throw new Error(response.data.message || '获取配置文件预览失败');
        }
      } else {
        // Fallback to old logic if not part of a profile
        const payload = {
          url: subscriptionUrl,
          subscription_id: subscriptionId,
          apply_rules: applyRules.value,
        };
        const response = await httpClient.post<ApiResponse<{ nodes: Partial<Node>[], analysis: any }>>('/subscriptions/preview', payload, { timeout: 15000 });
        if (response.data?.success && response.data.data?.nodes) {
          // Adapt to the new data structure for consistency
          previewData.value = { mode: 'local', nodes: response.data.data.nodes, analysis: response.data.data.analysis };
        } else {
          throw new Error(response.data?.message || '获取节点预览失败');
        }
      }
    } catch (err: any) {
      const errorMessage = err.message || '请求失败，请检查网络连接或订阅地址。';
      error.value = errorMessage;
      message.error(errorMessage);
    } finally {
      loading.value = false;
    }
  };

  const handleImport = async () => {
    if (previewData.value?.mode !== 'local' || !nodes.value || nodes.value.length === 0) {
      message.warning('没有可导入的本地节点');
      return;
    }
    importLoading.value = true;
    try {
      // Send the array of parsed node objects directly
      const response = await httpClient.post<ApiResponse>('/nodes/batch-import', {
        nodes: nodes.value,
        groupId: selectedGroupId.value,
      });
      if (response.data?.success && response.data?.data?.nodes) {
        message.success(response.data?.message || '节点导入成功');
      } else {
        message.error(response.data?.message || '导入失败');
      }
    } catch (err) {
      message.error('导入请求失败');
    } finally {
      importLoading.value = false;
    }
  };

  const resetPreview = () => {
    previewData.value = null;
    error.value = null;
  };

  const initializePreview = async () => {
    await nodeGroupStore.fetchGroups();
  };

  // Watch for applyRules changes
  watch(applyRules, () => {
    // This will trigger a refetch if called from component
  });

  return {
    previewData,
    loading,
    importLoading,
    applyRules,
    selectedGroupId,
    error,
    nodes,
    columns,
    fetchPreview,
    handleImport,
    resetPreview,
    initializePreview,
  };
}