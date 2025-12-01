<template>
  <n-modal
    v-model:show="show"
    :mask-closable="false"
    preset="dialog"
    title="批量导入节点"
    style="width: 800px; max-width: 95vw;"
  >
    <n-tabs v-model:value="activeTab" type="segment">
      <!-- 文本导入 -->
      <n-tab-pane name="text" tab="文本导入">
        <div class="import-section">
          <n-alert type="info" style="margin-bottom: 16px;">
            支持多种格式：单个节点每行、base64编码、订阅链接等
          </n-alert>

          <n-form-item label="导入内容" required>
            <n-input
              v-model:value="textContent"
              type="textarea"
              placeholder="请粘贴节点内容或订阅链接，支持以下格式：
• vmess://, vless://, trojan://, ss:// 等协议链接
• Base64编码的节点列表
• 订阅链接
• 每行一个节点的原始配置"
              :rows="8"
              clearable
            />
          </n-form-item>

          <n-form-item label="目标分组">
            <n-select
              v-model:value="targetGroupId"
              placeholder="选择导入目标分组"
              :options="groupOptions"
              clearable
            />
          </n-form-item>

          <n-form-item>
            <n-space>
              <n-button @click="previewTextImport" :loading="previewing" type="primary">
                <template #icon><EyeIcon /></template>
                预览导入
              </n-button>
              <n-button @click="parseTextLinks" :loading="parsing">
                <template #icon><LinkIcon /></template>
                解析链接
              </n-button>
            </n-space>
          </n-form-item>
        </div>
      </n-tab-pane>

      <!-- 文件导入 -->
      <n-tab-pane name="file" tab="文件导入">
        <div class="import-section">
          <n-alert type="info" style="margin-bottom: 16px;">
            支持 JSON、YAML、TXT 等格式的配置文件
          </n-alert>

          <n-upload
            v-model:file-list="fileList"
            :max="1"
            :default-upload="false"
            @change="handleFileChange"
            @remove="handleFileRemove"
            accept=".json,.yaml,.yml,.txt,.conf"
          >
            <n-upload-dragger>
              <div style="margin-bottom: 12px">
                <n-icon size="48" :depth="3">
                  <ArchiveIcon />
                </n-icon>
              </div>
              <n-text style="font-size: 16px">
                点击或者拖动文件到该区域来上传
              </n-text>
              <n-p depth="3" style="margin: 8px 0 0 0">
                支持 JSON、YAML、TXT 等格式，单次最多导入 1000 个节点
              </n-p>
            </n-upload-dragger>
          </n-upload>

          <div v-if="fileContent" style="margin-top: 16px;">
            <n-form-item label="文件内容预览">
              <n-input
                :value="fileContent.slice(0, 500) + (fileContent.length > 500 ? '...' : '')"
                type="textarea"
                readonly
                :rows="6"
              />
            </n-form-item>
          </div>
        </div>
      </n-tab-pane>

      <!-- 订阅导入 -->
      <n-tab-pane name="subscription" tab="订阅导入">
        <div class="import-section">
          <n-alert type="info" style="margin-bottom: 16px;">
            通过订阅链接自动获取和解析节点信息
          </n-alert>

          <n-form-item label="订阅链接" required>
            <n-input
              v-model:value="subscriptionUrl"
              placeholder="请输入订阅链接，例如: https://example.com/sub"
              clearable
            />
          </n-form-item>

          <n-form-item label="目标分组">
            <n-select
              v-model:value="targetGroupId"
              placeholder="选择导入目标分组"
              :options="groupOptions"
              clearable
            />
          </n-form-item>

          <n-form-item label="高级选项">
            <n-space vertical>
              <n-checkbox v-model:checked="autoResolve">
                自动解析域名
              </n-checkbox>
              <n-checkbox v-model:checked="deduplicate">
                自动去重
              </n-checkbox>
              <n-checkbox v-model:checked="healthCheck">
                导入后进行健康检查
              </n-checkbox>
            </n-space>
          </n-form-item>

          <n-form-item>
            <n-button @click="fetchSubscription" :loading="fetching" type="primary">
              <template #icon><DownloadIcon /></template>
              获取订阅
            </n-button>
          </n-form-item>
        </div>
      </n-tab-pane>
    </n-tabs>

    <!-- 导入预览 -->
    <div v-if="previewNodes.length > 0" style="margin-top: 20px;">
      <n-divider>导入预览 (共 {{ previewNodes.length }} 个节点)</n-divider>

      <div class="preview-section">
        <div class="preview-header">
          <n-space>
            <span>找到 {{ previewNodes.length }} 个有效节点</span>
            <n-button size="small" @click="selectAllPreview">
              {{ allSelected ? '取消全选' : '全选' }}
            </n-button>
            <n-button size="small" @click="clearSelection">
              清空选择
            </n-button>
          </n-space>
        </div>

        <div class="preview-list">
          <div
            v-for="(node, index) in previewNodes"
            :key="index"
            class="preview-item"
            :class="{ selected: selectedPreviewIndices.has(index) }"
            @click="togglePreviewSelection(index)"
          >
            <div class="preview-node-info">
              <div class="node-name">{{ node.name || `节点${index + 1}` }}</div>
              <div class="node-details">
                <n-tag size="small" :color="{ color: getProtocolColor(node.protocol) }">
                  {{ node.protocol?.toUpperCase() }}
                </n-tag>
                <span class="node-server">{{ node.server }}:{{ node.port }}</span>
              </div>
            </div>
            <div class="preview-actions">
              <n-button size="small" @click.stop="editPreviewNode(index)">
                <template #icon><EditIcon /></template>
              </n-button>
            </div>
          </div>
        </div>

        <div class="preview-footer">
          <n-space>
            <span>已选择 {{ selectedPreviewIndices.size }} 个节点</span>
            <n-button @click="confirmImport" type="primary" :loading="importing" :disabled="selectedPreviewIndices.size === 0">
              确认导入 ({{ selectedPreviewIndices.size }} 个)
            </n-button>
          </n-space>
        </div>
      </div>
    </div>

    <template #action>
      <n-space>
        <n-button @click="show = false">取消</n-button>
        <n-button v-if="previewNodes.length > 0" @click="resetImport">
          重新导入
        </n-button>
      </n-space>
    </template>
  </n-modal>

  <!-- 预览节点编辑对话框 -->
  <n-modal
    v-model:show="showPreviewEdit"
    preset="dialog"
    title="编辑节点"
    style="width: 500px;"
  >
    <n-form
      v-if="editingPreviewNode"
      :model="editingPreviewNode"
      label-placement="left"
      label-width="100px"
    >
      <n-form-item label="节点名称">
        <n-input v-model:value="editingPreviewNode.name" placeholder="请输入节点名称" />
      </n-form-item>
      <n-form-item label="服务器">
        <n-input v-model:value="editingPreviewNode.server" placeholder="请输入服务器地址" />
      </n-form-item>
      <n-form-item label="端口">
        <n-input-number v-model:value="editingPreviewNode.port" :min="1" :max="65535" style="width: 100%;" />
      </n-form-item>
    </n-form>

    <template #action>
      <n-space>
        <n-button @click="showPreviewEdit = false">取消</n-button>
        <n-button type="primary" @click="savePreviewEdit">保存</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMessage } from 'naive-ui';
import {
  Eye as EyeIcon,
  Link as LinkIcon,
  Archive as ArchiveIcon,
  Download as DownloadIcon,
  Pencil as EditIcon
} from '@vicons/ionicons5';
import type { NodeGroup } from '@/types/entities';
import type { UploadFileInfo } from 'naive-ui';

interface Props {
  show: boolean;
  groups: NodeGroup[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:show': [value: boolean];
  'import': [data: { nodes: any[], groupId?: string }];
}>();

const message = useMessage();

// 基础状态
const show = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
});

const activeTab = ref('text');
const importing = ref(false);
const previewing = ref(false);
const parsing = ref(false);
const fetching = ref(false);

// 文本导入状态
const textContent = ref('');
const targetGroupId = ref('');

// 文件导入状态
const fileList = ref<UploadFileInfo[]>([]);
const fileContent = ref('');

// 订阅导入状态
const subscriptionUrl = ref('');
const autoResolve = ref(true);
const deduplicate = ref(true);
const healthCheck = ref(false);

// 预览状态
const previewNodes = ref<any[]>([]);
const selectedPreviewIndices = ref(new Set<number>());
const showPreviewEdit = ref(false);
const editingPreviewNode = ref<any>(null);
const editingPreviewIndex = ref(-1);

// 计算属性
const groupOptions = computed(() => [
  { label: '未分组', value: '' },
  ...props.groups.map(group => ({
    label: group.name,
    value: group.id
  }))
]);

const allSelected = computed(() =>
  previewNodes.value.length > 0 && selectedPreviewIndices.value.size === previewNodes.value.length
);

// 方法
const previewTextImport = async () => {
  if (!textContent.value.trim()) {
    message.warning('请输入要导入的内容');
    return;
  }

  previewing.value = true;
  try {
    // 这里应该调用实际的解析服务
    // const nodes = await NodeImportService.parseText(textContent.value);

    // 模拟解析结果
    const nodes = mockParseNodes(textContent.value);
    previewNodes.value = nodes;
    selectedPreviewIndices.value = new Set(nodes.map((_, index) => index));

    message.success(`解析成功，找到 ${nodes.length} 个节点`);
  } catch (error) {
    message.error('解析失败，请检查内容格式');
    console.error('Parse error:', error);
  } finally {
    previewing.value = false;
  }
};

const parseTextLinks = async () => {
  // 解析链接的特定逻辑
  await previewTextImport();
};

const handleFileChange = async ({ file }: { file: UploadFileInfo }) => {
  if (!file.file) return;

  try {
    const text = await file.file.text();
    fileContent.value = text;

    // 尝试解析文件内容
    const nodes = mockParseNodes(text);
    previewNodes.value = nodes;
    selectedPreviewIndices.value = new Set(nodes.map((_, index) => index));

    message.success(`文件解析成功，找到 ${nodes.length} 个节点`);
  } catch (error) {
    message.error('文件解析失败');
    console.error('File parse error:', error);
  }
};

const handleFileRemove = () => {
  fileContent.value = '';
  previewNodes.value = [];
  selectedPreviewIndices.value.clear();
};

const fetchSubscription = async () => {
  if (!subscriptionUrl.value.trim()) {
    message.warning('请输入订阅链接');
    return;
  }

  fetching.value = true;
  try {
    // 这里应该调用实际的订阅获取服务
    // const content = await SubscriptionService.fetch(subscriptionUrl.value);
    // const nodes = await NodeImportService.parseText(content);

    // 模拟获取结果
    const nodes = mockParseNodes(subscriptionUrl.value);
    previewNodes.value = nodes;
    selectedPreviewIndices.value = new Set(nodes.map((_, index) => index));

    message.success(`订阅获取成功，找到 ${nodes.length} 个节点`);
  } catch (error) {
    message.error('获取订阅失败');
    console.error('Subscription fetch error:', error);
  } finally {
    fetching.value = false;
  }
};

const selectAllPreview = () => {
  if (allSelected.value) {
    selectedPreviewIndices.value.clear();
  } else {
    selectedPreviewIndices.value = new Set(previewNodes.value.map((_, index) => index));
  }
};

const clearSelection = () => {
  selectedPreviewIndices.value.clear();
};

const togglePreviewSelection = (index: number) => {
  if (selectedPreviewIndices.value.has(index)) {
    selectedPreviewIndices.value.delete(index);
  } else {
    selectedPreviewIndices.value.add(index);
  }
};

const editPreviewNode = (index: number) => {
  editingPreviewNode.value = { ...previewNodes.value[index] };
  editingPreviewIndex.value = index;
  showPreviewEdit.value = true;
};

const savePreviewEdit = () => {
  if (editingPreviewNode.value && editingPreviewIndex.value >= 0) {
    previewNodes.value[editingPreviewIndex.value] = editingPreviewNode.value;
    showPreviewEdit.value = false;
    editingPreviewNode.value = null;
    editingPreviewIndex.value = -1;
    message.success('节点信息已更新');
  }
};

const confirmImport = async () => {
  if (selectedPreviewIndices.value.size === 0) {
    message.warning('请选择要导入的节点');
    return;
  }

  importing.value = true;
  try {
    const selectedNodes = Array.from(selectedPreviewIndices.value).map(index => ({
      ...previewNodes.value[index],
      group_id: targetGroupId.value
    }));

    emit('import', {
      nodes: selectedNodes,
      groupId: targetGroupId.value
    });

    message.success(`成功导入 ${selectedNodes.length} 个节点`);
    resetImport();
    show.value = false;
  } catch (error) {
    message.error('导入失败');
    console.error('Import error:', error);
  } finally {
    importing.value = false;
  }
};

const resetImport = () => {
  textContent.value = '';
  fileContent.value = '';
  fileList.value = [];
  subscriptionUrl.value = '';
  previewNodes.value = [];
  selectedPreviewIndices.value.clear();
  targetGroupId.value = '';
  activeTab.value = 'text';
};

// 工具方法
const getProtocolColor = (protocol?: string) => {
  const colors: Record<string, string> = {
    vmess: '#1890ff',
    vless: '#52c41a',
    trojan: '#faad14',
    ss: '#722ed1',
    ssr: '#eb2f96',
    hysteria2: '#13c2c2',
    tuic: '#fa8c16'
  };
  return colors[protocol || ''] || '#d9d9d9';
};

// 模拟节点解析（实际项目中应该移到服务层）
const mockParseNodes = (content: string): any[] => {
  // 这里只是模拟，实际应该有完整的解析逻辑
  const nodes = [];

  // 模拟解析几个节点
  for (let i = 1; i <= Math.min(5, content.length / 10); i++) {
    nodes.push({
      name: `解析节点${i}`,
      protocol: 'vmess',
      server: `node${i}.example.com`,
      port: 443 + i,
      id: '00000000-0000-0000-0000-000000000000',
      security: 'auto',
      network: 'ws'
    });
  }

  return nodes;
};

// 监听 modal 关闭，重置状态
watch(show, (newValue) => {
  if (!newValue) {
    resetImport();
  }
});
</script>

<style scoped>
.import-section {
  min-height: 300px;
}

.preview-section {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  background-color: #fafafa;
}

.preview-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8e8e8;
}

.preview-list {
  max-height: 400px;
  overflow-y: auto;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.preview-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.preview-item.selected {
  border-color: #1890ff;
  background-color: #f6ffed;
}

.preview-node-info {
  flex: 1;
}

.node-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.node-details {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.node-server {
  font-family: monospace;
}

.preview-actions {
  flex-shrink: 0;
}

.preview-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .preview-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .preview-actions {
    align-self: flex-end;
  }

  .preview-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>