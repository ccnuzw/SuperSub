<script setup lang="ts">
import { h, watch, computed, onMounted } from 'vue';
import { useMessage, NDataTable, NSpin, NTag, NEmpty, NButton, NSpace, NSwitch, NTooltip, NSelect, NCard, NCode } from 'naive-ui';
import type { DataTableColumns } from 'naive-ui';
import { Node } from '@/types';
import { useGroupStore } from '@/stores/groups';
import type { INodeGroup } from '@/types';
import { useSubscriptionPreview } from '@/composables/useSubscriptionPreview';

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
const nodeGroupStore = useGroupStore();

const {
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
  initializePreview,
} = useSubscriptionPreview();

// Re-fetch when the modal becomes visible, if it's not the initial load
watch(() => props.show, (newVal, oldVal) => {
    if (newVal && !oldVal) {
        fetchPreview(props.subscriptionUrl, props.subscriptionId, props.profileId);
    }
});

// Re-fetch when applyRules changes
watch(applyRules, () => {
    if (props.show) {
        fetchPreview(props.subscriptionUrl, props.subscriptionId, props.profileId);
    }
});

// Expose the fetch function to the parent component
defineExpose({
  fetchPreview: () => fetchPreview(props.subscriptionUrl, props.subscriptionId, props.profileId),
});

onMounted(() => {
  initializePreview();
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
          :options="nodeGroupStore.groups.map((g: INodeGroup) => ({ label: g.name, value: g.id }))"
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
        <n-button size="small" @click="(event: MouseEvent) => fetchPreview(props.subscriptionUrl, props.subscriptionId, props.profileId)" class="mt-2">重试</n-button>
      </div>
      <div v-else-if="previewData">
        <!-- Remote Mode Preview -->
        <div v-if="previewData.mode === 'remote'">
          <n-card title="远程解析模式预览" :bordered="false" size="small">
            <p>此订阅所属的配置文件为 <strong>远程解析</strong> 模式。预览将显示最终组合并发送给 Subconverter 的链接列表，而不是具体的节点。</p>
            <n-code class="mt-4" language="text" :code="(previewData.urls || []).join('\n')" />
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