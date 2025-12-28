<script setup lang="ts">
import { ref, onMounted, h, watch, computed } from 'vue';
import { useMessage, NDataTable, NSpin, NTag, NEmpty, NButton, NSpace, NSwitch, NTooltip, NSelect, NCard, NCode } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { Node, ApiResponse } from '@/types';
import { useGroupStore as useNodeGroupStore } from '@/stores/groups';
import { regenerateLink, type ParsedNode } from '@/utils/nodeParser';
import { subscriptionsApi } from '@/api/subscriptions';
import { profilesApi } from '@/api/profiles';
import { nodesApi } from '@/api/nodes';
import { getNaiveTagColor } from '@/utils/colors';

const props = defineProps({
  subscriptionId: {
    type: String,
    required: true,
  },
  subscriptionUrl: {
    type: String,
    required: true,
  },
  profileId: {
    type: String,
    default: null,
  },
  show: {
    type: Boolean,
    required: true,
  }
});

const message = useMessage();
const nodeGroupStore = useNodeGroupStore();

type PreviewData = 
  | { mode: 'local'; nodes: Node[]; analysis: any; urls?: never }
  | { mode: 'remote'; urls: string[]; analysis: any; nodes?: never };

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

const columns: DataTableColumns<Partial<Node>> = [
    { title: '名称', key: 'name', ellipsis: { tooltip: true }, fixed: 'left', width: 200 },
    {
        title: '类型',
        key: 'protocol',
        width: 100,
        align: 'center',
        render(row) {
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
        render(row) {
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

const fetchPreview = async () => {
  if (!props.subscriptionUrl) {
    previewData.value = null;
    return;
  }
  loading.value = true;
  previewData.value = null;
  error.value = null;

  try {
    // If there's a profileId, it means this subscription is part of a profile.
    if (props.profileId) {
      const response = await profilesApi.previewNodes(props.profileId);
      // Ensure response.data is treated as ApiResponse object
      const data = response.data as ApiResponse<PreviewData>;
      if (typeof data !== 'string' && data.success && data.data) {
        previewData.value = data.data;
      } else {
        throw new Error(typeof data !== 'string' ? data.message : 'Invalid response format');
      }
    } else {
      // Fallback to old logic if not part of a profile
      const payload = {
        url: props.subscriptionUrl,
        subscription_id: props.subscriptionId,
        apply_rules: applyRules.value,
      };
      
      const response = await subscriptionsApi.preview(payload);
      if (response.data.success && response.data.data?.nodes) {
        previewData.value = { mode: 'local', nodes: response.data.data.nodes, analysis: response.data.data.analysis || {} };
      } else {
        throw new Error(response.data.message || '获取节点预览失败');
      }
    }
  } catch (err: unknown) {
    const errorMessage = (err instanceof Error ? err.message : String(err)) || '请求失败，请检查网络连接或订阅地址。';
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
        const response = await nodesApi.importNodes(nodes.value, selectedGroupId.value);
        if (response.data.success) {
            message.success(response.data.message || '节点导入成功');
        } else {
            message.error(response.data.message || '导入失败');
        }
    } catch (err) {
        message.error('导入请求失败');
    } finally {
        importLoading.value = false;
    }
};

defineExpose({
  fetchPreview,
});

watch(applyRules, () => {
    fetchPreview();
});

watch(() => props.show, (newVal, oldVal) => {
    if (newVal && !oldVal) {
        fetchPreview();
    }
});

onMounted(() => {
  nodeGroupStore.fetchGroups();
});
</script>

<template>
  <div>
    <n-space v-if="!profileId" justify="space-between" class="mb-4" align="center">
      <n-space align="center">
        <n-switch v-model:value="applyRules" />
        <label>应用处理规则</label>
        <n-tooltip trigger="hover">
          <template #trigger>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1-8h-2V7h2v2z"/></svg>
          </template>
          启用后，将加载并应用您在此订阅上配置的所有规则（如过滤、重命名等）。
        </n-tooltip>
      </n-space>
      <n-space>
        <n-select
          v-model:value="selectedGroupId"
          placeholder="导入到分组 (可选)"
          :options="nodeGroupStore.groups.map(g => ({ label: g.name, value: g.id }))"
          clearable
          style="width: 200px;"
        />
        <n-button
          type="primary"
          @click="handleImport"
          :loading="importLoading"
          :disabled="loading || nodes.length === 0"
        >
          导入 {{ nodes.length }} 个节点
        </n-button>
      </n-space>
    </n-space>
    <n-spin :show="loading">
      <div v-if="error" class="py-8 text-center">
        <p class="text-red-500">{{ error }}</p>
        <n-button size="small" @click="fetchPreview" class="mt-2">重试</n-button>
      </div>
      <div v-else-if="previewData">
        <!-- Remote Mode Preview -->
        <div v-if="previewData.mode === 'remote'">
          <n-card title="远程解析模式预览" :bordered="false" size="small">
            <p>此订阅所属的配置文件为 <strong>远程解析</strong> 模式。预览将显示最终组合并发送给 Subconverter 的链接列表，而不是具体的节点。</p>
            <n-code class="mt-4" language="text" :code="previewData.urls.join('\n')" />
            <template #footer>
              总计链接数量: {{ previewData.analysis.total }}
            </template>
          </n-card>
        </div>
        <!-- Local Mode Preview -->
        <div v-else-if="previewData.mode === 'local'">
          <n-data-table
            :columns="columns"
            :data="nodes"
            :pagination="{ pageSize: 10 }"
            :bordered="false"
            :max-height="400"
            :scroll-x="660"
          />
          <n-empty v-if="nodes.length === 0" description="订阅为空或无有效节点" class="py-8" />
        </div>
      </div>
      <n-empty v-if="!loading && !error && !previewData" description="点击预览按钮获取节点信息" class="py-8" />
    </n-spin>
  </div>
</template>