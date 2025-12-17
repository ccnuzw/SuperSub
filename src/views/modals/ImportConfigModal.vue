/**
 * 导入配置模态框组件
 * 支持从URL、文件、或剪贴板导入配置
 */

<template>
  <NModal
    :show="show"
    @update:show="$emit('update:show', $event)"
    preset="card"
    class="w-[600px] max-w-[90vw]"
    title="导入配置"
  >
    <div class="import-modal">
      <!-- 导入方式选择 -->
      <div class="import-methods">
        <h4 class="section-title">选择导入方式</h4>
        <div class="method-tabs">
          <SsButton
            v-for="method in importMethods"
            :key="method.key"
            :variant="currentMethod === method.key ? 'primary' : 'outline'"
            @click="() => { currentMethod = method.key }"
          >
            <component :is="method.icon" class="w-4 h-4" />
            {{ method.label }}
          </SsButton>
        </div>
      </div>

      <!-- URL导入 -->
      <div v-if="currentMethod === 'url'" class="import-section">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">订阅链接</label>
            <SsInput
              v-model="urlForm.url"
              placeholder="https://example.com/subscribe/..."
              clearable
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">备注名称</label>
            <SsInput
              v-model="urlForm.name"
              placeholder="为这个订阅源起个名字"
              clearable
            />
          </div>
          <div v-if="urlForm.url" class="url-preview">
            <div class="preview-label">链接预览</div>
            <div class="preview-url">{{ urlForm.url }}</div>
          </div>
        </div>
      </div>

      <!-- 文件导入 -->
      <div v-if="currentMethod === 'file'" class="import-section">
        <div class="upload-area" :class="{ 'upload-area--dragover': isDragOver }">
          <input
            ref="fileInputRef"
            type="file"
            accept=".txt,.yaml,.yml,.json"
            class="file-input"
            @change="handleFileChange"
          />
          <div
            class="upload-content"
            @drop="handleDrop"
            @dragover.prevent="isDragOver = true"
            @dragleave="isDragOver = false"
            @click="handleFileClick"
          >
            <div class="upload-icon">
              <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div class="upload-text">
              <div class="upload-title">点击或拖拽文件到此处上传</div>
              <div class="upload-subtitle">支持 .txt, .yaml, .yml, .json 格式</div>
            </div>
            <div v-if="fileForm.file" class="file-info">
              <div class="file-name">{{ fileForm.file.name }}</div>
              <div class="file-size">{{ formatFileSize(fileForm.file.size) }}</div>
            </div>
          </div>
        </div>
        <div v-if="fileForm.file" class="file-options">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">配置名称</label>
            <SsInput
              v-model="fileForm.name"
              placeholder="为导入的配置命名"
              clearable
            />
          </div>
        </div>
      </div>

      <!-- 文本导入 -->
      <div v-if="currentMethod === 'text'" class="import-section">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">配置文本</label>
            <textarea
              v-model="textForm.content"
              class="text-input"
              rows="8"
              placeholder="粘贴配置文件内容..."
            ></textarea>
            <div class="text-info">
              <span class="char-count">{{ textForm.content.length }} 个字符</span>
              <SsButton
                variant="ghost"
                size="sm"
                @click="formatText"
              >
                格式化
              </SsButton>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">配置名称</label>
            <SsInput
              v-model="textForm.name"
              placeholder="为这个配置命名"
              clearable
            />
          </div>
        </div>
      </div>

      <!-- 导入选项 -->
      <div class="import-options">
        <h4 class="section-title">导入选项</h4>
        <div class="options-grid">
          <label class="option-item">
            <input
              v-model="options.parseNodes"
              type="checkbox"
              class="option-checkbox"
            />
            <span class="option-label">解析节点信息</span>
          </label>
          <label class="option-item">
            <input
              v-model="options.overwrite"
              type="checkbox"
              class="option-checkbox"
            />
            <span class="option-label">覆盖同名配置</span>
          </label>
          <label class="option-item">
            <input
              v-model="options.autoTest"
              type="checkbox"
              class="option-checkbox"
            />
            <span class="option-label">导入后测试连接</span>
          </label>
          <label class="option-item">
            <input
              v-model="options.createProfile"
              type="checkbox"
              class="option-checkbox"
            />
            <span class="option-label">创建配置文件</span>
          </label>
        </div>
      </div>

      <!-- 预览区域 -->
      <div v-if="previewData" class="preview-section">
        <h4 class="section-title">导入预览</h4>
        <div class="preview-stats">
          <div class="stat-item">
            <div class="stat-value">{{ previewData.nodeCount }}</div>
            <div class="stat-label">节点</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ previewData.subscriptionCount }}</div>
            <div class="stat-label">订阅</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ previewData.protocolCount }}</div>
            <div class="stat-label">协议</div>
          </div>
        </div>
        <div v-if="previewData.nodes?.length" class="node-preview">
          <div class="node-list">
            <div
              v-for="node in previewData.nodes.slice(0, 5)"
              :key="node.id"
              class="node-item"
            >
              <SsBadge variant="outline" size="sm">{{ node.protocol }}</SsBadge>
              <span class="node-name">{{ node.name }}</span>
            </div>
          </div>
          <div v-if="previewData.nodes.length > 5" class="more-nodes">
            还有 {{ previewData.nodes.length - 5 }} 个节点...
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <SsButton
          variant="outline"
          @click="closeModal"
        >
          取消
        </SsButton>
        <SsButton
          variant="primary"
          @click="handleImport"
          :loading="importing"
          :disabled="!canImport"
        >
          {{ previewData ? '确认导入' : '预览导入' }}
        </SsButton>
      </div>
    </template>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { NModal } from 'naive-ui';
import { SsButton, SsInput, SsBadge } from '@/components/base';
import {
  LinkOutline as UrlIcon,
  DocumentTextOutline as FileIcon,
  ClipboardOutline as TextIcon,
} from '@vicons/ionicons5';

interface IProps {
  show: boolean;
}

const props = defineProps<IProps>();

const emit = defineEmits<{
  'update:show': [show: boolean];
  success: [];
}>();

const message = useMessage();

// 响应式数据
const currentMethod = ref<'url' | 'file' | 'text'>('url');
const importing = ref(false);
const isDragOver = ref(false);
const previewData = ref<any>(null);
const fileInputRef = ref<HTMLInputElement>();

// 表单数据
const urlForm = ref({
  url: '',
  name: ''
});

const fileForm = ref({
  file: null as File | null,
  name: ''
});

const textForm = ref({
  content: '',
  name: ''
});

// 导入选项
const options = ref({
  parseNodes: true,
  overwrite: false,
  autoTest: true,
  createProfile: false
});

// 导入方法配置
const importMethods = [
  { key: 'url' as const, label: 'URL导入', icon: UrlIcon },
  { key: 'file' as const, label: '文件导入', icon: FileIcon },
  { key: 'text' as const, label: '文本导入', icon: TextIcon }
];

// 计算属性
const canImport = computed(() => {
  switch (currentMethod.value) {
    case 'url':
      return urlForm.value.url.trim() !== '';
    case 'file':
      return fileForm.value.file !== null;
    case 'text':
      return textForm.value.content.trim() !== '';
    default:
      return false;
  }
});

// 方法
const handleFileClick = () => {
  fileInputRef.value?.click();
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    fileForm.value.file = file;
    fileForm.value.name = fileForm.value.name || file.name.replace(/\.[^/.]+$/, '');
  }
};

const handleDrop = (event: DragEvent) => {
  event.preventDefault();
  isDragOver.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    fileForm.value.file = file;
    fileForm.value.name = fileForm.value.name || file.name.replace(/\.[^/.]+$/, '');
  }
};

const formatText = () => {
  try {
    // 尝试格式化JSON
    const parsed = JSON.parse(textForm.value.content);
    textForm.value.content = JSON.stringify(parsed, null, 2);
    message.success('文本已格式化');
  } catch {
    // 如果不是JSON，尝试其他格式化
    textForm.value.content = textForm.value.content.trim();
    message.info('文本已清理');
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const generatePreview = async () => {
  try {
    // 模拟预览API调用
    await new Promise(resolve => setTimeout(resolve, 1000));

    previewData.value = {
      nodeCount: 25,
      subscriptionCount: 1,
      protocolCount: 3,
      nodes: [
        { id: '1', name: '香港节点-1', protocol: 'vmess' },
        { id: '2', name: '美国节点-1', protocol: 'trojan' },
        { id: '3', name: '日本节点-1', protocol: 'vless' },
        { id: '4', name: '新加坡节点-1', protocol: 'vmess' },
        { id: '5', name: '台湾节点-1', protocol: 'shadowsocks' }
      ]
    };
  } catch (error) {
    message.error('生成预览失败');
  }
};

const handleImport = async () => {
  importing.value = true;

  try {
    if (!previewData.value) {
      await generatePreview();
      return;
    }

    // 模拟导入API调用
    await new Promise(resolve => setTimeout(resolve, 2000));

    message.success('配置导入成功');
    emit('success');
    closeModal();
  } catch (error) {
    message.error('导入失败，请重试');
  } finally {
    importing.value = false;
  }
};

const closeModal = () => {
  emit('update:show', false);
  resetForms();
};

const resetForms = () => {
  urlForm.value = { url: '', name: '' };
  fileForm.value = { file: null, name: '' };
  textForm.value = { content: '', name: '' };
  previewData.value = null;
  importing.value = false;
};

// 监听器
watch(() => props.show, (show) => {
  if (!show) {
    resetForms();
  }
});

watch(currentMethod, () => {
  previewData.value = null;
});

// 自动预览
watch([urlForm, fileForm, textForm], () => {
  if (canImport.value) {
    // 延迟预览，避免频繁请求
    setTimeout(() => {
      if (canImport.value && !previewData.value) {
        generatePreview();
      }
    }, 1000);
  }
}, { deep: true });
</script>

<style scoped>
.import-modal {
  @apply space-y-6;
}

.import-methods {
  @apply space-y-4;
}

.section-title {
  @apply text-lg font-semibold text-gray-900;
}

.method-tabs {
  @apply flex space-x-2;
}

.import-section {
  @apply space-y-4;
}

.url-preview {
  @apply bg-gray-50 p-3 rounded-lg space-y-2;
}

.preview-label {
  @apply text-sm font-medium text-gray-700;
}

.preview-url {
  @apply text-sm font-mono text-gray-600 break-all;
}

.upload-area {
  @apply border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors duration-200;
}

.upload-area:hover {
  @apply border-gray-400 bg-gray-50;
}

.upload-area--dragover {
  @apply border-primary-400 bg-primary-50;
}

.file-input {
  @apply hidden;
}

.upload-content {
  @apply space-y-3;
}

.upload-icon {
  @apply mx-auto text-gray-400;
}

.upload-text {
  @apply space-y-1;
}

.upload-title {
  @apply font-medium text-gray-900;
}

.upload-subtitle {
  @apply text-sm text-gray-500;
}

.file-info {
  @apply bg-white p-3 rounded-lg border border-gray-200 space-y-1;
}

.file-name {
  @apply font-medium text-gray-900;
}

.file-size {
  @apply text-sm text-gray-500;
}

.file-options {
  @apply space-y-4;
}

.text-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  font-family: monospace;
  resize: vertical;
}

.text-info {
  @apply flex justify-between items-center;
}

.char-count {
  @apply text-sm text-gray-500;
}

.import-options {
  @apply space-y-4;
}

.options-grid {
  @apply grid grid-cols-2 gap-3;
}

.option-item {
  @apply flex items-center space-x-2 cursor-pointer;
}

.option-checkbox {
  @apply rounded border-gray-300 text-primary-600 focus:ring-primary-500;
}

.option-label {
  @apply text-sm font-medium text-gray-700;
}

.preview-section {
  @apply space-y-4;
}

.preview-stats {
  @apply grid grid-cols-3 gap-4;
}

.stat-item {
  @apply bg-gray-50 p-3 rounded-lg text-center;
}

.stat-value {
  @apply text-xl font-semibold text-primary-600;
}

.stat-label {
  @apply text-sm text-gray-600;
}

.node-preview {
  @apply space-y-3;
}

.node-list {
  @apply space-y-2;
}

.node-item {
  @apply flex items-center space-x-2 p-2 bg-gray-50 rounded;
}

.node-name {
  @apply text-sm font-medium text-gray-900;
}

.more-nodes {
  @apply text-sm text-gray-500 text-center;
}

.modal-footer {
  @apply flex justify-end space-x-3;
}

/* 深色模式支持 */
.dark .section-title {
  @apply text-gray-100;
}

.dark .upload-area {
  @apply border-gray-600;
}

.dark .upload-area:hover {
  @apply border-gray-500 bg-gray-700;
}

.dark .upload-icon {
  @apply text-gray-500;
}

.dark .upload-title {
  @apply text-gray-100;
}

.dark .upload-subtitle {
  @apply text-gray-400;
}

.dark .file-info {
  @apply bg-gray-700 border-gray-600;
}

.dark .file-name {
  @apply text-gray-100;
}

.dark .file-size {
  @apply text-gray-400;
}

.dark .text-input {
  @apply bg-gray-700 border-gray-600 text-gray-100;
}

.dark .option-label {
  @apply text-gray-300;
}

.dark .stat-item {
  @apply bg-gray-700;
}

.dark .stat-value {
  @apply text-primary-400;
}

.dark .stat-label {
  @apply text-gray-400;
}

.dark .node-item {
  @apply bg-gray-700;
}

.dark .node-name {
  @apply text-gray-100;
}

.dark .more-nodes {
  @apply text-gray-400;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .method-tabs {
    @apply flex-col space-x-0 space-y-2;
  }

  .options-grid {
    @apply grid-cols-1;
  }

  .preview-stats {
    @apply grid-cols-1;
  }
}
</style>