<template>
  <div class="node-forms">
    <!-- 新增/编辑节点模态框 -->
    <n-modal
      :show="modalStates.addNode || modalStates.editNode"
      :title="modalTitle"
      preset="dialog"
      style="width: 600px; max-width: 90vw;"
      @close="closeModal('node')"
    >
      <n-form
        ref="nodeFormRef"
        :model="nodeFormState"
        :rules="nodeFormRules"
        label-placement="left"
        label-width="120px"
        require-mark-placement="right-hanging"
      >
        <n-form-item label="节点名称" path="name">
          <n-input
            :model-value="nodeFormState.name"
            @update:value="(value: string) => emit('update:nodeFormState', { ...nodeFormState, name: value })"
            placeholder="请输入节点名称"
          />
        </n-form-item>

        <n-form-item label="链接" path="link">
          <n-input
            :model-value="nodeFormState.link"
            @update:value="(value: string) => emit('update:nodeFormState', { ...nodeFormState, link: value })"
            type="textarea"
            :rows="4"
            placeholder="请输入节点链接（可选）"
          />
        </n-form-item>

        <n-form-item label="协议类型" path="protocol">
          <n-select
            :model-value="nodeFormState.protocol"
            @update:value="(value: string) => emit('update:nodeFormState', { ...nodeFormState, protocol: value })"
            :options="protocolOptions"
            placeholder="请选择协议类型"
          />
        </n-form-item>

        <n-form-item label="服务器地址" path="server">
          <n-input
            :model-value="nodeFormState.server"
            @update:value="(value: string) => emit('update:nodeFormState', { ...nodeFormState, server: value })"
            placeholder="请输入服务器地址"
          />
        </n-form-item>

        <n-form-item label="端口" path="port">
          <n-input-number
            :model-value="nodeFormState.port"
            @update:value="(value: number) => emit('update:nodeFormState', { ...nodeFormState, port: value })"
            :min="1"
            :max="65535"
            placeholder="请输入端口号"
          />
        </n-form-item>

        <n-form-item label="密码/密钥" path="password">
          <n-input
            :model-value="nodeFormState.password"
            @update:value="(value: string) => emit('update:nodeFormState', { ...nodeFormState, password: value })"
            type="password"
            show-password-on="click"
            placeholder="请输入密码或密钥"
          />
        </n-form-item>

        <n-form-item label="分组" path="group_id">
          <n-select
            :model-value="nodeFormState.group_id"
            @update:value="(value: string) => emit('update:nodeFormState', { ...nodeFormState, group_id: value })"
            :options="groupOptions"
            placeholder="请选择分组（可选）"
            clearable
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-space>
          <n-button @click="closeModal('node')">取消</n-button>
          <n-button
            type="primary"
            :loading="saveLoading"
            @click="handleSaveNode"
          >
            保存
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 批量导入模态框 -->
    <n-modal
      :show="modalStates.batchImport"
      title="批量导入节点"
      preset="dialog"
      style="width: 800px; max-width: 95vw;"
      @close="closeModal('batchImport')"
    >
      <n-space vertical>
        <n-form-item label="链接地址">
          <n-input
            :model-value="linkInput"
            @update:value="(value: string) => { linkInput = value; emit('update:addLink', value) }"
            type="textarea"
            :rows="6"
            placeholder="请输入节点链接，每行一个链接"
          />
        </n-form-item>

        <n-form-item label="导入到分组">
          <n-select
            :model-value="importGroupId"
            @update:value="$emit('update:importGroupId', $event)"
            :options="importGroupOptions"
            placeholder="请选择分组（可选）"
            clearable
          />
        </n-form-item>

        <n-form-item>
          <n-space>
            <n-button @click="handlePreviewLinks">
              预览解析
            </n-button>
            <n-button
              type="primary"
              :loading="importLoading"
              @click="handleBatchImport"
            >
              确认导入
            </n-button>
          </n-space>
        </n-form-item>

        <!-- 预览结果 -->
        <div v-if="previewNodes.length > 0" class="preview-section">
          <n-divider>预览结果</n-divider>
          <n-scrollbar style="max-height: 300px;">
            <div class="preview-list">
              <div
                v-for="(node, index) in previewNodes"
                :key="index"
                class="preview-item"
              >
                <n-space align="center">
                  <n-tag :type="node.isValid ? 'success' : 'error'">
                    {{ node.name }}
                  </n-tag>
                  <n-text depth="3">{{ node.protocol }}</n-text>
                  <n-text v-if="!node.isValid" type="error">
                    {{ node.errorMessage }}
                  </n-text>
                </n-space>
              </div>
            </div>
          </n-scrollbar>
        </div>
      </n-space>

      <template #action>
        <n-space>
          <n-button @click="closeModal('batchImport')">取消</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 新增分组模态框 -->
    <n-modal
      :show="modalStates.addGroup"
      title="新增分组"
      preset="dialog"
      @close="closeModal('addGroup')"
    >
      <n-form
        ref="addGroupFormRef"
        :model="{ groupName: newGroupName }"
        :rules="{ groupName: groupNameRules }"
      >
        <n-form-item label="分组名称" path="groupName">
          <n-input
            :model-value="newGroupName"
            @update:value="$emit('update:newGroupName', $event)"
            placeholder="请输入分组名称"
            @keydown.enter="handleSaveGroup"
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-space>
          <n-button @click="closeModal('addGroup')">取消</n-button>
          <n-button
            type="primary"
            :loading="saveLoading"
            @click="handleSaveGroup"
          >
            保存
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 重命名分组模态框 -->
    <n-modal
      :show="modalStates.renameGroup"
      title="重命名分组"
      preset="dialog"
      @close="closeModal('renameGroup')"
    >
      <n-form
        ref="renameGroupFormRef"
        :model="{ groupName: editingGroupName }"
        :rules="{ groupName: groupNameRules }"
      >
        <n-form-item label="分组名称" path="groupName">
          <n-input
            :model-value="editingGroupName"
            @update:value="$emit('update:editingGroupName', $event)"
            placeholder="请输入新的分组名称"
            @keydown.enter="handleRenameGroup"
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-space>
          <n-button @click="closeModal('renameGroup')">取消</n-button>
          <n-button
            type="primary"
            :loading="saveLoading"
            @click="handleRenameGroup"
          >
            保存
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 移动到分组模态框 -->
    <n-modal
      :show="modalStates.moveToGroup"
      title="移动到分组"
      preset="dialog"
      @close="closeModal('moveToGroup')"
    >
      <n-form>
        <n-form-item label="目标分组">
          <n-select
            :model-value="moveToGroupId"
            @update:value="$emit('update:moveToGroupId', $event)"
            :options="moveGroupOptions"
            placeholder="请选择目标分组"
          />
        </n-form-item>
      </n-form>

      <template #action>
        <n-space>
          <n-button @click="closeModal('moveToGroup')">取消</n-button>
          <n-button
            type="primary"
            :loading="saveLoading"
            @click="handleSaveMoveToGroup"
          >
            确认移动
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useMessage } from 'naive-ui';
import type { FormRules } from 'naive-ui';
import { NodeImportService } from '@/services/nodeImportService';
import type { ModalStates, NodeFormState } from '@/composables/useNodeManagement';
import type { TabConfig } from '@/composables/useNodeGroups';

// Props
interface Props {
  modalStates: ModalStates;
  modalTitle: string;
  nodeFormState: NodeFormState;
  editingNode: any;
  addLink: string;
  importPreview: any[];
  importGroupId: string;
  editingGroup: any;
  editingGroupName?: string;
  newGroupName?: string;
  moveToGroupId: string;
  groups: TabConfig[];
}

const props = withDefaults(defineProps<Props>(), {
  editingGroupName: '',
  newGroupName: '',
});

// Emits
const emit = defineEmits<{
  'update:nodeFormState': [value: NodeFormState];
  'update:addLink': [value: string];
  'update:importPreview': [value: any[]];
  'update:importGroupId': [value: string];
  'update:editingGroupName': [value: string];
  'update:newGroupName': [value: string];
  'update:moveToGroupId': [value: string];
  closeModal: [modal: string];
  saveNode: [];
  batchImport: [];
  saveGroup: [];
  saveMoveToGroup: [];
}>();

// 响应式数据
const message = useMessage();
const nodeImportService = new NodeImportService();
const saveLoading = ref(false);
const importLoading = ref(false);
const linkInput = ref(props.addLink);
const previewNodes = ref(props.importPreview);

// 表单引用
const nodeFormRef = ref();
const addGroupFormRef = ref();
const renameGroupFormRef = ref();

// 协议选项
const protocolOptions = [
  { label: 'VMess', value: 'vmess' },
  { label: 'VLESS', value: 'vless' },
  { label: 'Trojan', value: 'trojan' },
  { label: 'Shadowsocks', value: 'ss' },
  { label: 'ShadowsocksR', value: 'ssr' },
  { label: 'Hysteria2', value: 'hysteria2' },
  { label: 'TUIC', value: 'tuic' },
  { label: 'AnyTLS', value: 'anytls' },
];

// 分组选项
const groupOptions = computed(() => [
  { label: '未分组', value: '' },
  ...props.groups
    .filter(g => g.id !== 'all' && g.id !== 'ungrouped')
    .map(g => ({ label: g.name, value: g.id })),
]);

const importGroupOptions = computed(() => [
  { label: '未分组', value: '' },
  ...props.groups
    .filter(g => g.id !== 'all' && g.id !== 'ungrouped')
    .map(g => ({ label: g.name, value: g.id })),
]);

const moveGroupOptions = computed(() => [
  { label: '未分组', value: '' },
  ...props.groups
    .filter(g => g.id !== 'all' && g.id !== 'ungrouped')
    .map(g => ({ label: g.name, value: g.id })),
]);

// 表单验证规则
const nodeFormRules: FormRules = {
  name: [
    { required: true, message: '请输入节点名称', trigger: 'blur' },
    { min: 1, max: 100, message: '节点名称长度应在1-100个字符之间', trigger: 'blur' },
  ],
  protocol: [
    { required: true, message: '请选择协议类型', trigger: 'change' },
  ],
  server: [
    { required: true, message: '请输入服务器地址', trigger: 'blur' },
  ],
  port: [
    { required: true, type: 'number', message: '请输入端口号', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口号应在1-65535之间', trigger: 'blur' },
  ],
};

const groupNameRules = [
  { required: true, message: '请输入分组名称', trigger: 'blur' },
  { min: 1, max: 20, message: '分组名称长度应在1-20个字符之间', trigger: 'blur' },
];

// 方法
const closeModal = (modal: string) => {
  emit('closeModal', modal);
};

const handleSaveNode = async () => {
  try {
    saveLoading.value = true;
    await nodeFormRef.value?.validate();
    emit('saveNode');
  } catch (error) {
    // 表单验证失败
  } finally {
    saveLoading.value = false;
  }
};

const handlePreviewLinks = () => {
  if (!linkInput.value.trim()) {
    message.warning('请输入节点链接');
    return;
  }

  try {
    const parsed = nodeImportService.parseNodeLinks(linkInput.value);
    const validated = parsed.map(node => {
      const validation = nodeImportService.validateNodeData(node);
      return {
        ...node,
        isValid: validation.isValid,
        errorMessage: validation.error,
      };
    });

    previewNodes.value = validated;
    emit('update:importPreview', validated);
    message.success(`成功解析 ${validated.length} 个节点`);
  } catch (error: any) {
    message.error(error.message || '解析失败');
  }
};

const handleBatchImport = async () => {
  if (!linkInput.value.trim()) {
    message.warning('请输入节点链接');
    return;
  }

  try {
    importLoading.value = true;
    emit('update:addLink', linkInput.value);
    emit('batchImport');
  } catch (error: any) {
    message.error(error.message || '导入失败');
  } finally {
    importLoading.value = false;
  }
};

const handleSaveGroup = async () => {
  if (!props.newGroupName.trim()) {
    message.warning('请输入分组名称');
    return;
  }

  try {
    saveLoading.value = true;
    emit('saveGroup');
  } catch (error) {
    // 错误已在父组件处理
  } finally {
    saveLoading.value = false;
  }
};

const handleRenameGroup = async () => {
  if (!props.editingGroupName || !props.editingGroupName.trim()) {
    message.warning('请输入分组名称');
    return;
  }

  try {
    saveLoading.value = true;
    emit('saveGroup');
  } catch (error) {
    // 错误已在父组件处理
  } finally {
    saveLoading.value = false;
  }
};

const handleSaveMoveToGroup = async () => {
  try {
    saveLoading.value = true;
    emit('saveMoveToGroup');
  } catch (error) {
    // 错误已在父组件处理
  } finally {
    saveLoading.value = false;
  }
};

// 监听器
watch(
  () => props.addLink,
  (newValue) => {
    linkInput.value = newValue;
  }
);

watch(
  () => props.importPreview,
  (newValue) => {
    previewNodes.value = newValue;
  }
);
</script>

<style scoped>
.node-forms {
  /* 组件样式 */
}

.preview-section {
  margin-top: 16px;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-item {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  border-left: 3px solid #d9d9d9;
}

.preview-item :deep(.n-tag--success) {
  border-left-color: #52c41a;
}

.preview-item :deep(.n-tag--error) {
  border-left-color: #ff4d4f;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .preview-section {
    margin-top: 12px;
  }

  .preview-item {
    padding: 6px 8px;
  }
}
</style>