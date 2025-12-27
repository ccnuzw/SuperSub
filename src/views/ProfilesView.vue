<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useMessage, useDialog, NButton, NSpace, NDataTable, NPageHeader, NModal, NSpin, NIcon, NTag, NStatistic, NCard, NGrid, NGi, NScrollbar, NLog, NSteps, NStep, NCode, NList, NListItem, NThing, NDropdown } from 'naive-ui';
import type { DataTableColumns, DropdownOption } from 'naive-ui';
import { Pencil as EditIcon, TrashBinOutline as DeleteIcon, CopyOutline as CopyIcon, EyeOutline as PreviewIcon, DocumentTextOutline as LogIcon, EllipsisVertical as MoreIcon } from '@vicons/ionicons5';
import { useIsMobile } from '@/composables/useMediaQuery';
import { profilesApi } from '@/api/profiles';
import { useAuthStore } from '@/stores/auth';
import { LogoutInProgressError } from '@/utils/errors';
import type { ApiResponse, Profile, Subscription, Node, LogEntry, LogLevel } from '@/types';
import { regenerateLink, type ParsedNode } from '@/utils/nodeParser';
import { getNaiveTagColor } from '@/utils/colors';
import SubscriptionLogModal from '@/components/SubscriptionLogModal.vue';

const router = useRouter();
const message = useMessage();
const dialog = useDialog();
const isMobile = useIsMobile();

const profiles = ref<Profile[]>([]);
const loading = ref(true);
const authStore = useAuthStore();
const subToken = computed(() => authStore.user?.sub_token || '');

// For Nodes Preview Modal
const showNodesPreviewModal = ref(false);
const showLogsModal = ref(false);
const loadingNodesPreview = ref(false);
const currentProfileForPreview = ref<Profile | null>(null);
const nodesPreviewData = ref<{
  nodes: Partial<Node>[];
  analysis: {
    total: number;
    protocols: Record<string, number>;
    regions: Record<string, number>;
  };
  mode: 'local' | 'remote';
  logs: LogEntry[];
} | null>(null);

// For Subscription Logs Modal
const showSubLogsModal = ref(false);
const currentProfileForLogs = ref<Profile | null>(null);

const getStepStatus = (level: LogLevel) => {
  switch (level) {
    case 'ERROR':
      return 'error';
    case 'WARN':
      return 'error'; // Naive UI doesn't have 'warning', map to 'error' to highlight
    case 'SUCCESS':
      return 'finish';
    case 'INFO':
    case 'STEP':
    case 'DEBUG':
    default:
      return 'process';
  }
};

const nodes = computed(() => nodesPreviewData.value?.nodes || []);

const previewNodeColumns: DataTableColumns<Partial<Node>> = [
  { title: '节点名称', key: 'name', width: 300, ellipsis: { tooltip: true } },
  {
    title: '类型',
    key: 'type',
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
  { title: '服务器', key: 'server', width: 200, ellipsis: { tooltip: true } },
  { title: '端口', key: 'port', width: 80, align: 'center' },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    align: 'center',
    render(row) {
      return h(NButton, {
        size: 'tiny',
        ghost: true,
        type: 'primary',
        onClick: () => {
          // The row object from preview is a ParsedNode.
          const link = regenerateLink(row as ParsedNode);
          if (link) {
            navigator.clipboard.writeText(link);
            message.success('已复制完整链接');
          } else {
            message.error('无法生成链接');
          }
        }
      }, { default: () => '复制链接' });
    }
  }
];


const createColumns = ({ onCopy, onPreview, onLogs, onEdit, onDelete }: {
    onCopy: (row: Profile) => void,
    onPreview: (row: Profile) => void,
    onLogs: (row: Profile) => void,
    onEdit: (row: Profile) => void,
    onDelete: (row: Profile) => void,
}): DataTableColumns<Profile> => {
  return [
    { title: '名称', key: 'name', sorter: 'default', width: 200 },
    {
      title: '订阅链接',
      key: 'alias',
      render(row) {
        if (!subToken.value || !row.alias) {
          return h('span', '请设置链接别名');
        }
        const url = `${window.location.origin}/api/public/${subToken.value}/${row.alias}`;
        return h(NButton, { text: true, tag: 'a', href: url, target: '_blank', type: 'primary' }, { default: () => url });
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      render(row) {
        return h(NSpace, null, {
          default: () => [
            h(NButton, { size: 'small', circle: true, title: '复制链接', onClick: () => onCopy(row) }, { icon: () => h(NIcon, null, { default: () => h(CopyIcon) }) }),
            h(NButton, { size: 'small', circle: true, title: '预览', onClick: () => onPreview(row) }, { icon: () => h(NIcon, null, { default: () => h(PreviewIcon) }) }),
            h(NButton, { size: 'small', circle: true, title: '日志', onClick: () => onLogs(row) }, { icon: () => h(NIcon, null, { default: () => h(LogIcon) }) }),
            h(NButton, { size: 'small', circle: true, type: 'primary', title: '编辑', onClick: () => onEdit(row) }, { icon: () => h(NIcon, null, { default: () => h(EditIcon) }) }),
            h(NButton, { size: 'small', circle: true, type: 'error', title: '删除', onClick: () => onDelete(row) }, { icon: () => h(NIcon, null, { default: () => h(DeleteIcon) }) }),
          ]
        });
      }
    }
  ];
};


const fetchProfiles = async () => {
  const authStore = useAuthStore();
  if (!authStore.isAuthenticated) return;
  loading.value = true;
  try {
    const response = await profilesApi.fetchProfiles();
    if (response.data.success) {
      profiles.value = response.data.data || [];
    } else {
      message.error(response.data.message || '获取配置列表失败');
    }
  } catch (err: any) {
    if (!axios.isCancel(err)) message.error(err.message || '请求失败');
  } finally {
    loading.value = false;
  }
};



const handleDelete = (row: Profile) => {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除配置 "${row.name}" 吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const response = await profilesApi.deleteProfile(row.id);
        if (response.data.success) {
          message.success('配置删除成功');
          fetchProfiles();
        } else {
          message.error(response.data.message || '删除失败');
        }
      } catch (err: any) {
        if (!axios.isCancel(err)) message.error(err.message || '请求失败');
      }
    },
  });
};

const handleCopyLink = (row: Profile) => {
  if (!subToken.value || !row.alias) {
    message.error('无法复制链接：缺少订阅令牌或链接别名。');
    return;
  }
  const url = `${window.location.origin}/api/public/${subToken.value}/${row.alias}`;
  navigator.clipboard.writeText(url).then(() => message.success('链接已复制'), () => message.error('复制失败'));
};

const onPreview = async (row: Profile) => {
  currentProfileForPreview.value = row;
  nodesPreviewData.value = null;
  loadingNodesPreview.value = true;
  showNodesPreviewModal.value = true;
  try {
    const response = await profilesApi.previewNodes(row.id);
    const responseData = response.data as ApiResponse<any>;
    if (typeof responseData !== 'string' && responseData.success) {
      if (responseData.data) {
        nodesPreviewData.value = responseData.data;
      }
    } else {
      const msg = typeof responseData === 'string' ? responseData : responseData.message;
      message.error(msg || '加载预览失败');
      showNodesPreviewModal.value = false;
    }
  } catch (err: any) {
    if (!axios.isCancel(err)) {
      message.error(err.message || '请求预览失败');
      showNodesPreviewModal.value = false;
    }
  } finally {
    loadingNodesPreview.value = false;
  }
};

const onLogs = (row: Profile) => {
  currentProfileForLogs.value = row;
  showSubLogsModal.value = true;
};

const columns = createColumns({
  onCopy: handleCopyLink,
  onPreview,
  onLogs,
  onEdit: (row) => router.push({ name: 'edit-profile', params: { id: row.id } }),
  onDelete: handleDelete
});

onMounted(() => {
  fetchProfiles();
});

</script>

<template>
  <div>
    <n-page-header>
      <template #title>配置管理</template>
      <template #extra>
        <n-space>
          <n-button type="primary" @click="() => router.push({ name: 'new-profile' })">新增配置</n-button>
        </n-space>
      </template>
    </n-page-header>

    <n-data-table v-if="!isMobile" :columns="columns" :data="profiles" :loading="loading" :pagination="{ pageSize: 10 }" :bordered="false" class="mt-4" />

    <n-list v-else bordered class="mt-4">
      <n-list-item v-for="profile in profiles" :key="profile.id">
        <n-thing :title="profile.name" />
        <template #suffix>
          <n-dropdown
            trigger="click"
            :options="[
              { label: '复制链接', key: 'copy' },
              { label: '预览', key: 'preview' },
              { label: '日志', key: 'logs' },
              { label: '编辑', key: 'edit' },
              { label: '删除', key: 'delete' },
            ]"
            @select="key => {
              if (key === 'copy') handleCopyLink(profile);
              if (key === 'preview') onPreview(profile);
              if (key === 'logs') onLogs(profile);
              if (key === 'edit') router.push({ name: 'edit-profile', params: { id: profile.id } });
              if (key === 'delete') handleDelete(profile);
            }"
          >
            <n-button text>
              <n-icon :component="MoreIcon" size="24" />
            </n-button>
          </n-dropdown>
        </template>
      </n-list-item>
    </n-list>

    <!-- Nodes Preview Modal -->
    <n-modal v-model:show="showNodesPreviewModal" preset="card" :title="`节点预览 - ${currentProfileForPreview?.name}`" :style="{ width: isMobile ? '95vw' : '1200px' }" :mask-closable="true" :trap-focus="false">
      <n-spin :show="loadingNodesPreview">
        <div v-if="nodesPreviewData">
          <n-grid :cols="1">
            <n-gi>
              <n-card title="订阅分析" :bordered="false">
                <template #header-extra>
                  <n-button v-if="nodesPreviewData.logs && nodesPreviewData.logs.length > 0" text @click="showLogsModal = true">
                    <template #icon>
                      <n-icon><log-icon /></n-icon>
                    </template>
                    查看日志
                  </n-button>
                </template>
                <n-grid :cols="3" :x-gap="12">
                  <n-gi><n-statistic label="节点总数" :value="nodesPreviewData.analysis.total" /></n-gi>
                  <n-gi>
                    <n-statistic label="协议分布">
                      <n-space>
                      <n-tag v-for="(count, protocol) in nodesPreviewData.analysis.protocols" :key="protocol" :color="getNaiveTagColor(protocol, 'protocol')" round>{{ protocol.toUpperCase() }}: {{ count }}</n-tag>
                      </n-space>
                    </n-statistic>
                  </n-gi>
                  <n-gi>
                    <n-statistic label="地区分布">
                      <n-space :size="'small'" style="flex-wrap: wrap;">
                        <n-tag v-for="(count, region) in nodesPreviewData.analysis.regions" :key="region" :color="getNaiveTagColor(region, 'region')" round>{{ region }}: {{ count }}</n-tag>
                      </n-space>
                    </n-statistic>
                  </n-gi>
                </n-grid>
              </n-card>
              <n-data-table :columns="previewNodeColumns" :data="nodes" :pagination="{ pageSize: 10 }" :max-height="400" class="mt-4" />
            </n-gi>
          </n-grid>
        </div>
        <div v-else-if="!loadingNodesPreview" style="text-align: center; padding: 20px;">没有获取到节点数据。</div>
      </n-spin>
    </n-modal>

    <!-- Logs Modal -->
    <n-modal v-model:show="showLogsModal" preset="card" title="上帝视角日志" :style="{ width: isMobile ? '95vw' : '900px', maxHeight: '80vh' }" :mask-closable="true" :trap-focus="false">
      <n-scrollbar style="max-height: 70vh; padding-right: 16px;">
        <n-steps vertical>
          <template v-for="log in nodesPreviewData?.logs" :key="log.timestamp">
            <n-step :title="log.message" :status="getStepStatus(log.level)">
              <p style="font-size: 12px; color: #999; margin-top: 4px; margin-bottom: 8px;">{{ new Date(log.timestamp).toLocaleString() }}</p>
              <div v-if="log.data">
                <n-card size="small" :bordered="true">
                  <n-code :code="JSON.stringify(log.data, null, 2)" language="json" word-wrap />
                </n-card>
              </div>
            </n-step>
          </template>
        </n-steps>
      </n-scrollbar>
    </n-modal>
    <subscription-log-modal
      v-model:show="showSubLogsModal"
      :profile-id="currentProfileForLogs?.id || null"
      :profile-name="currentProfileForLogs?.name || null"
    />
  </div>
</template>