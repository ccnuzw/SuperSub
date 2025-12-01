<template>
  <n-modal
    v-model:show="show"
    :mask-closable="false"
    preset="dialog"
    :title="isEdit ? '编辑节点' : '添加节点'"
    style="width: 600px; max-width: 90vw;"
  >
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="120px"
      require-mark-placement="right-hanging"
    >
      <n-form-item label="节点名称" path="name">
        <n-input
          v-model:value="formData.name"
          placeholder="请输入节点名称"
          clearable
        />
      </n-form-item>

      <n-form-item label="协议类型" path="protocol">
        <n-select
          v-model:value="formData.protocol"
          placeholder="选择协议类型"
          :options="protocolOptions"
          @update:value="handleProtocolChange"
        />
      </n-form-item>

      <n-form-item label="服务器地址" path="server">
        <n-input
          v-model:value="formData.server"
          placeholder="请输入服务器地址或域名"
          clearable
        />
      </n-form-item>

      <n-form-item label="端口" path="port">
        <n-input-number
          v-model:value="formData.port"
          placeholder="请输入端口号"
          :min="1"
          :max="65535"
          style="width: 100%;"
        />
      </n-form-item>

      <!-- 根据协议类型显示不同字段 -->
      <template v-if="formData.protocol === 'vmess'">
        <n-form-item label="UUID" path="id">
          <n-input
            v-model:value="formData.id"
            placeholder="请输入用户UUID"
            clearable
          />
        </n-form-item>
        <n-form-item label="加密方式" path="security">
          <n-select
            v-model:value="formData.security"
            placeholder="选择加密方式"
            :options="securityOptions"
          />
        </n-form-item>
        <n-form-item label="传输协议" path="network">
          <n-select
            v-model:value="formData.network"
            placeholder="选择传输协议"
            :options="networkOptions"
            @update:value="handleNetworkChange"
          />
        </n-form-item>
        <n-form-item v-if="formData.network === 'ws'" label="WebSocket路径" path="path">
          <n-input
            v-model:value="formData.path"
            placeholder="请输入WebSocket路径"
            clearable
          />
        </n-form-item>
        <n-form-item v-if="formData.network === 'ws'" label="Host" path="host">
          <n-input
            v-model:value="formData.host"
            placeholder="请输入WebSocket Host"
            clearable
          />
        </n-form-item>
        <n-form-item v-if="formData.network === 'grpc'" label="ServiceName" path="path">
          <n-input
            v-model:value="formData.path"
            placeholder="请输入gRPC ServiceName"
            clearable
          />
        </n-form-item>
      </template>

      <template v-else-if="formData.protocol === 'vless'">
        <n-form-item label="UUID" path="id">
          <n-input
            v-model:value="formData.id"
            placeholder="请输入用户UUID"
            clearable
          />
        </n-form-item>
        <n-form-item label="传输协议" path="network">
          <n-select
            v-model:value="formData.network"
            placeholder="选择传输协议"
            :options="networkOptions"
            @update:value="handleNetworkChange"
          />
        </n-form-item>
        <n-form-item v-if="formData.network === 'ws'" label="WebSocket路径" path="path">
          <n-input
            v-model:value="formData.path"
            placeholder="请输入WebSocket路径"
            clearable
          />
        </n-form-item>
        <n-form-item v-if="formData.network === 'ws'" label="Host" path="host">
          <n-input
            v-model:value="formData.host"
            placeholder="请输入WebSocket Host"
            clearable
          />
        </n-form-item>
        <n-form-item v-if="formData.network === 'grpc'" label="ServiceName" path="path">
          <n-input
            v-model:value="formData.path"
            placeholder="请输入gRPC ServiceName"
            clearable
          />
        </n-form-item>
      </template>

      <template v-else-if="formData.protocol === 'trojan'">
        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="formData.password"
            placeholder="请输入密码"
            type="password"
            show-password-on="click"
            clearable
          />
        </n-form-item>
        <n-form-item label="传输协议" path="network">
          <n-select
            v-model:value="formData.network"
            placeholder="选择传输协议"
            :options="trojanNetworkOptions"
            @update:value="handleNetworkChange"
          />
        </n-form-item>
        <n-form-item v-if="formData.network === 'ws'" label="WebSocket路径" path="path">
          <n-input
            v-model:value="formData.path"
            placeholder="请输入WebSocket路径"
            clearable
          />
        </n-form-item>
        <n-form-item v-if="formData.network === 'ws'" label="Host" path="host">
          <n-input
            v-model:value="formData.host"
            placeholder="请输入WebSocket Host"
            clearable
          />
        </n-form-item>
      </template>

      <template v-else-if="formData.protocol === 'ss'">
        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="formData.password"
            placeholder="请输入密码"
            type="password"
            show-password-on="click"
            clearable
          />
        </n-form-item>
        <n-form-item label="加密方式" path="method">
          <n-select
            v-model:value="formData.method"
            placeholder="选择加密方式"
            :options="ssMethodOptions"
          />
        </n-form-item>
      </template>

      <template v-else-if="formData.protocol === 'ssr'">
        <n-form-item label="密码" path="password">
          <n-input
            v-model:value="formData.password"
            placeholder="请输入密码"
            type="password"
            show-password-on="click"
            clearable
          />
        </n-form-item>
        <n-form-item label="加密方式" path="method">
          <n-select
            v-model:value="formData.method"
            placeholder="选择加密方式"
            :options="ssrMethodOptions"
          />
        </n-form-item>
        <n-form-item label="协议" path="protocol_param">
          <n-select
            v-model:value="formData.protocol_param"
            placeholder="选择协议"
            :options="ssrProtocolOptions"
          />
        </n-form-item>
        <n-form-item label="混淆" path="obfs">
          <n-select
            v-model:value="formData.obfs"
            placeholder="选择混淆方式"
            :options="ssrObfsOptions"
          />
        </n-form-item>
      </template>

      <!-- 通用字段 -->
      <n-form-item label="TLS" path="tls">
        <n-switch v-model:value="formData.tls" />
      </n-form-item>

      <n-form-item v-if="formData.tls" label="SNI" path="sni">
        <n-input
          v-model:value="formData.sni"
          placeholder="请输入SNI"
          clearable
        />
      </n-form-item>

      <n-form-item label="分组" path="group_id">
        <n-select
          v-model:value="formData.group_id"
          placeholder="选择分组"
          :options="groupSelectOptions"
          clearable
        />
      </n-form-item>

      <n-form-item label="备注">
        <n-input
          v-model:value="formData.remark"
          type="textarea"
          placeholder="请输入备注信息"
          :rows="3"
        />
      </n-form-item>
    </n-form>

    <template #action>
      <n-space>
        <n-button @click="show = false">取消</n-button>
        <n-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '保存' : '添加' }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useMessage, type FormInst, type FormRules } from 'naive-ui';
import type { Node, NodeGroup } from '@/types/entities';

interface Props {
  show: boolean;
  node: Node | null;
  groups: NodeGroup[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:show': [value: boolean];
  'save': [nodeData: any];
}>();

const message = useMessage();
const formRef = ref<FormInst | null>(null);
const submitting = ref(false);

// 计算属性
const isEdit = computed(() => !!props.node);
const show = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
});

// 表单数据
const formData = ref({
  name: '',
  protocol: '',
  server: '',
  port: 443,
  id: '',
  password: '',
  security: 'auto',
  network: 'tcp',
  path: '',
  host: '',
  method: 'aes-256-gcm',
  protocol_param: 'origin',
  obfs: 'plain',
  tls: false,
  sni: '',
  group_id: '',
  remark: ''
});

// 协议选项
const protocolOptions = [
  { label: 'VMess', value: 'vmess' },
  { label: 'VLESS', value: 'vless' },
  { label: 'Trojan', value: 'trojan' },
  { label: 'Shadowsocks', value: 'ss' },
  { label: 'ShadowsocksR', value: 'ssr' },
  { label: 'Hysteria2', value: 'hysteria2' },
  { label: 'TUIC', value: 'tuic' }
];

// 加密选项
const securityOptions = [
  { label: '自动', value: 'auto' },
  { label: 'AES-128-GCM', value: 'aes-128-gcm' },
  { label: 'AES-256-GCM', value: 'aes-256-gcm' },
  { label: 'ChaCha20-Poly1305', value: 'chacha20-poly1305' },
  { label: '无', value: 'none' }
];

// 传输协议选项
const networkOptions = [
  { label: 'TCP', value: 'tcp' },
  { label: 'WebSocket', value: 'ws' },
  { label: 'HTTP/2', value: 'h2' },
  { label: 'gRPC', value: 'grpc' },
  { label: 'QUIC', value: 'quic' }
];

const trojanNetworkOptions = [
  { label: 'TCP', value: 'tcp' },
  { label: 'WebSocket', value: 'ws' },
  { label: 'gRPC', value: 'grpc' }
];

// Shadowsocks 加密选项
const ssMethodOptions = [
  { label: 'AES-256-GCM', value: 'aes-256-gcm' },
  { label: 'AES-128-GCM', value: 'aes-128-gcm' },
  { label: 'ChaCha20-Poly1305', value: 'chacha20-poly1305' },
  { label: 'XChaCha20-Poly1305', value: 'xchacha20-poly1305' },
  { label: 'Blowfish-CFB', value: 'blowfish-cfb' },
  { label: 'AES-256-CTR', value: 'aes-256-ctr' }
];

// ShadowsocksR 加密选项
const ssrMethodOptions = [
  { label: 'aes-128-cfb', value: 'aes-128-cfb' },
  { label: 'aes-192-cfb', value: 'aes-192-cfb' },
  { label: 'aes-256-cfb', value: 'aes-256-cfb' },
  { label: 'aes-128-ctr', value: 'aes-128-ctr' },
  { label: 'aes-192-ctr', value: 'aes-192-ctr' },
  { label: 'aes-256-ctr', value: 'aes-256-ctr' },
  { label: 'chacha20-ietf', value: 'chacha20-ietf' }
];

// SSR 协议选项
const ssrProtocolOptions = [
  { label: 'origin', value: 'origin' },
  { label: 'verify_deflate', value: 'verify_deflate' },
  { label: 'auth_sha1_v4', value: 'auth_sha1_v4' },
  { label: 'auth_aes128_md5', value: 'auth_aes128_md5' },
  { label: 'auth_aes128_sha1', value: 'auth_aes128_sha1' }
];

// SSR 混淆选项
const ssrObfsOptions = [
  { label: 'plain', value: 'plain' },
  { label: 'http_simple', value: 'http_simple' },
  { label: 'http_post', value: 'http_post' },
  { label: 'tls_simple', value: 'tls_simple' },
  { label: 'tls1.2_ticket_auth', value: 'tls1.2_ticket_auth' }
];

// 分组选项
const groupSelectOptions = computed(() => [
  { label: '未分组', value: '' },
  ...props.groups.map(group => ({
    label: group.name,
    value: group.id
  }))
]);

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入节点名称', trigger: 'blur' }
  ],
  protocol: [
    { required: true, message: '请选择协议类型', trigger: 'change' }
  ],
  server: [
    { required: true, message: '请输入服务器地址', trigger: 'blur' },
    { type: 'string', pattern: /^[a-zA-Z0-9.-]+$/, message: '请输入有效的服务器地址', trigger: 'blur' }
  ],
  port: [
    { required: true, message: '请输入端口号', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口号范围: 1-65535', trigger: 'blur' }
  ]
};

// 动态验证规则
watch(() => formData.value.protocol, (protocol) => {
  nextTick(() => {
    if (formRef.value) {
      formRef.value.restoreValidation();
    }
  });

  // 根据协议添加特定验证规则
  if (protocol === 'vmess' || protocol === 'vless') {
    formRules.id = [
      { required: true, message: '请输入UUID', trigger: 'blur' },
      { type: 'string', pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, message: '请输入有效的UUID', trigger: 'blur' }
    ];
  } else if (protocol === 'trojan' || protocol === 'ss' || protocol === 'ssr') {
    formRules.password = [
      { required: true, message: '请输入密码', trigger: 'blur' }
    ];
  }
});

// 事件处理
const handleProtocolChange = () => {
  // 重置相关字段
  formData.value.id = '';
  formData.value.password = '';
  formData.value.security = 'auto';
  formData.value.network = 'tcp';
  formData.value.path = '';
  formData.value.host = '';
  formData.value.method = 'aes-256-gcm';
};

const handleNetworkChange = () => {
  // 重置网络相关字段
  formData.value.path = '';
  formData.value.host = '';
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitting.value = true;

    // 准备提交数据
    const submitData = { ...formData.value };

    // 根据协议类型删除不需要的字段
    if (submitData.protocol !== 'vmess' && submitData.protocol !== 'vless') {
      delete (submitData as any).id;
      delete (submitData as any).security;
    }
    if (submitData.protocol !== 'trojan' && submitData.protocol !== 'ss' && submitData.protocol !== 'ssr') {
      delete (submitData as any).password;
    }
    if (submitData.protocol !== 'ss') {
      delete (submitData as any).method;
    }
    if (submitData.protocol !== 'ssr') {
      delete (submitData as any).protocol_param;
      delete (submitData as any).obfs;
    }

    emit('save', submitData);
  } catch (error) {
    console.error('表单验证失败:', error);
  } finally {
    submitting.value = false;
  }
};

// 监听节点数据变化，用于编辑时填充表单
watch(() => props.node, (node) => {
  if (node) {
    // 填充表单数据
    Object.keys(formData.value).forEach(key => {
      if (node[key as keyof Node] !== undefined) {
        (formData.value as any)[key] = node[key as keyof Node];
      }
    });
  } else {
    // 重置表单
    Object.keys(formData.value).forEach(key => {
      if (key === 'protocol') {
        (formData.value as any)[key] = '';
      } else if (key === 'port') {
        (formData.value as any)[key] = 443;
      } else if (key === 'tls') {
        (formData.value as any)[key] = false;
      } else if (key === 'security') {
        (formData.value as any)[key] = 'auto';
      } else if (key === 'network') {
        (formData.value as any)[key] = 'tcp';
      } else if (key === 'method') {
        (formData.value as any)[key] = 'aes-256-gcm';
      } else {
        (formData.value as any)[key] = '';
      }
    });
  }
}, { immediate: true });
</script>

<style scoped>
/* 样式可以根据需要调整 */
</style>