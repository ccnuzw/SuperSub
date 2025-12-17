/**
 * 节点表单模态框组件
 * 用于添加和编辑节点
 */

<template>
  <n-modal
    :show="visible"
    @update:show="$emit('update:visible', $event)"
    preset="card"
    :title="isEditing ? '编辑节点' : '添加节点'"
    class="w-[600px]"
    :mask-closable="false"
  >
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="120px"
    >
      <!-- 基本信息 -->
      <n-grid :cols="2" :x-gap="16">
        <n-gi>
          <n-form-item label="节点名称" path="name">
            <n-input
              v-model:value="formData.name"
              placeholder="请输入节点名称"
              clearable
            />
          </n-form-item>
        </n-gi>

        <n-gi>
          <n-form-item label="协议类型" path="protocol">
            <n-select
              v-model:value="formData.protocol"
              :options="protocolOptions"
              placeholder="选择协议"
              @update:value="handleProtocolChange"
            />
          </n-form-item>
        </n-gi>
      </n-grid>

      <n-grid :cols="2" :x-gap="16">
        <n-gi>
          <n-form-item label="服务器地址" path="server">
            <n-input
              v-model:value="formData.server"
              placeholder="域名或IP地址"
              clearable
            />
          </n-form-item>
        </n-gi>

        <n-gi>
          <n-form-item label="端口" path="port">
            <n-input-number
              v-model:value="formData.port"
              :min="1"
              :max="65535"
              placeholder="端口号"
              style="width: 100%;"
            />
          </n-form-item>
        </n-gi>
      </n-grid>

      <!-- 协议特定配置 -->
      <div v-if="formData.protocol" class="protocol-config">
        <!-- VMess/VLESS 配置 -->
        <template v-if="['vmess', 'vless'].includes(formData.protocol)">
          <n-grid :cols="2" :x-gap="16">
            <n-gi>
              <n-form-item label="UUID" path="uuid">
                <n-input
                  v-model:value="formData.uuid"
                  placeholder="用户UUID"
                  clearable
                />
              </n-form-item>
            </n-gi>

            <n-gi>
              <n-form-item label="加密方式" path="encryption">
                <n-select
                  v-model:value="formData.encryption"
                  :options="encryptionOptions"
                  placeholder="选择加密方式"
                  clearable
                />
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-form-item label="传输协议" path="network">
            <n-select
              v-model:value="formData.network"
              :options="networkOptions"
              placeholder="选择传输协议"
              @update:value="handleNetworkChange"
            />
          </n-form-item>

          <!-- WebSocket 配置 -->
          <template v-if="formData.network === 'ws'">
            <n-grid :cols="2" :x-gap="16">
              <n-gi>
                <n-form-item label="WebSocket路径" path="ws-path">
                  <n-input
                    v-model:value="formData['ws-path']"
                    placeholder="/path"
                    clearable
                  />
                </n-form-item>
              </n-gi>

              <n-gi>
                <n-form-item label="WebSocket域名" path="ws-host">
                  <n-input
                    v-model:value="formData['ws-host']"
                    placeholder="example.com"
                    clearable
                  />
                </n-form-item>
              </n-gi>
            </n-grid>
          </template>

          <!-- gRPC 配置 -->
          <template v-if="formData.network === 'grpc'">
            <n-form-item label="gRPC服务名" path="grpc-service-name">
              <n-input
                v-model:value="formData['grpc-service-name']"
                placeholder="service-name"
                clearable
              />
            </n-form-item>
          </template>
        </template>

        <!-- Trojan 配置 -->
        <template v-else-if="formData.protocol === 'trojan'">
          <n-form-item label="密码" path="password">
            <n-input
              v-model:value="formData.password"
              type="password"
              placeholder="输入密码"
              show-password-on="click"
              clearable
            />
          </n-form-item>
        </template>

        <!-- Shadowsocks 配置 -->
        <template v-else-if="formData.protocol === 'shadowsocks'">
          <n-grid :cols="2" :x-gap="16">
            <n-gi>
              <n-form-item label="加密方式" path="cipher">
                <n-select
                  v-model:value="formData.cipher"
                  :options="shadowsocksCipherOptions"
                  placeholder="选择加密方式"
                />
              </n-form-item>
            </n-gi>

            <n-gi>
              <n-form-item label="密码" path="password">
                <n-input
                  v-model:value="formData.password"
                  type="password"
                  placeholder="输入密码"
                  show-password-on="click"
                  clearable
                />
              </n-form-item>
            </n-gi>
          </n-grid>
        </template>

        <!-- SOCKS5/HTTP 配置 -->
        <template v-else-if="['socks5', 'http', 'https'].includes(formData.protocol)">
          <n-grid :cols="2" :x-gap="16">
            <n-gi>
              <n-form-item label="用户名" path="username">
                <n-input
                  v-model:value="formData.username"
                  placeholder="用户名（可选）"
                  clearable
                />
              </n-form-item>
            </n-gi>

            <n-gi>
              <n-form-item label="密码" path="password">
                <n-input
                  v-model:value="formData.password"
                  type="password"
                  placeholder="密码（可选）"
                  show-password-on="click"
                  clearable
                />
              </n-form-item>
            </n-gi>
          </n-grid>
        </template>

      <!-- TLS 配置 -->
      <n-collapse>
        <n-collapse-item title="TLS 安全配置" name="tls">
          <n-grid :cols="2" :x-gap="16">
            <n-gi>
              <n-form-item label="启用TLS" path="tls">
                <n-switch v-model:value="formData.tls" />
              </n-form-item>
            </n-gi>

            <n-gi v-if="formData.tls">
              <n-form-item label="跳过证书验证" path="skip-cert-verify">
                <n-switch v-model:value="formData['skip-cert-verify']" />
              </n-form-item>
            </n-gi>
          </n-grid>

          <template v-if="formData.tls">
            <n-form-item label="TLS服务器名称" path="servername">
              <n-input
                v-model:value="formData.servername"
                placeholder="SNI（可选）"
                clearable
              />
            </n-form-item>

            <n-form-item label="ALPN" path="alpn">
              <n-dynamic-tags
                v-model:value="formData.alpn"
                :max="3"
                placeholder="添加ALPN协议"
              />
            </n-form-item>
          </template>
        </n-collapse-item>
      </n-collapse>
      </div>

      <!-- 附加信息 -->
      <n-grid :cols="2" :x-gap="16">
        <n-gi>
          <n-form-item label="地区" path="region">
            <n-input
              v-model:value="formData.region"
              placeholder="节点地区"
              clearable
            />
          </n-form-item>
        </n-gi>

        <n-gi>
          <n-form-item label="分组" path="group_id">
            <n-select
              v-model:value="formData.group_id"
              :options="groupOptions"
              placeholder="选择分组"
              clearable
            />
          </n-form-item>
        </n-gi>
      </n-grid>

      <n-form-item label="备注" path="remark">
        <n-input
          v-model:value="formData.remark"
          type="textarea"
          placeholder="备注信息"
          :autosize="{ minRows: 2, maxRows: 4 }"
          clearable
        />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="handleCancel">取消</n-button>
        <n-button
          type="primary"
          @click="handleSave"
          :loading="loading"
        >
          {{ isEditing ? '更新' : '添加' }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NGrid,
  NGi,
  NSwitch,
  NCollapse,
  NCollapseItem,
  NDynamicTags,
  NButton,
  NSpace,
  type FormInst,
  type FormRules
} from 'naive-ui'
import type { INode } from '@/types'
import { businessUtils, BUSINESS_CONSTANTS } from '@/components/business'

interface IProps {
  visible: boolean
  node?: INode | null
  groups?: Array<{ label: string; value: string }>
  loading?: boolean
}

const props = withDefaults(defineProps<IProps>(), {
  groups: () => [],
  loading: false
})

const emit = defineEmits<{
  'update:visible': [visible: boolean]
  save: [data: Partial<INode>]
}>()

// 表单引用
const formRef = ref<FormInst | null>(null)

// 是否为编辑模式
const isEditing = computed(() => !!props.node)

// 表单数据
const formData = reactive<Partial<INode>>({
  name: '',
  protocol: 'vmess',
  server: '',
  port: 443,
  uuid: '',
  password: '',
  encryption: 'auto',
  network: 'tcp',
  tls: false,
  'skip-cert-verify': false,
  servername: '',
  alpn: [],
  region: '',
  group_id: null,
  remark: '',
  username: ''
})

// 协议选项
const protocolOptions = Object.entries(BUSINESS_CONSTANTS.PROTOCOLS).map(([key, value]) => ({
  label: key.toUpperCase(),
  value
}))

// 加密方式选项
const encryptionOptions = [
  { label: '自动', value: 'auto' },
  { label: 'AES-128-GCM', value: 'aes-128-gcm' },
  { label: 'AES-256-GCM', value: 'aes-256-gcm' },
  { label: 'CHACHA20-POLY1305', value: 'chacha20-poly1305' },
  { label: '无', value: 'none' }
]

// 传输协议选项
const networkOptions = [
  { label: 'TCP', value: 'tcp' },
  { label: 'WebSocket', value: 'ws' },
  { label: 'gRPC', value: 'grpc' },
  { label: 'HTTP', value: 'http' },
  { label: 'QUIC', value: 'quic' }
]

// Shadowsocks加密选项
const shadowsocksCipherOptions = [
  { label: 'AES-256-GCM', value: 'aes-256-gcm' },
  { label: 'AES-128-GCM', value: 'aes-128-gcm' },
  { label: 'CHACHA20-POLY1305', value: 'chacha20-poly1305' },
  { label: 'XCHACHA20-POLY1305', value: 'xchacha20-poly1305' },
  { label: 'BLAKE3-AES-128-GCM', value: 'blake3-aes-128-gcm' },
  { label: 'BLAKE3-AES-256-GCM', value: 'blake3-aes-256-gcm' }
]

// 分组选项
const groupOptions = computed(() => [
  { label: '默认分组', value: '' },
  ...props.groups
])

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入节点名称', trigger: 'blur' },
    { min: 2, max: 100, message: '名称长度应在2-100个字符之间', trigger: 'blur' }
  ],
  protocol: [
    { required: true, message: '请选择协议类型', trigger: 'change' }
  ],
  server: [
    { required: true, message: '请输入服务器地址', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9.-]+$/,
      message: '请输入有效的域名或IP地址',
      trigger: 'blur'
    }
  ],
  port: [
    {
      type: 'number',
      min: 1,
      max: 65535,
      message: '端口范围应在1-65535之间',
      trigger: 'blur'
    }
  ]
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    name: '',
    protocol: 'vmess',
    server: '',
    port: 443,
    uuid: '',
    password: '',
    encryption: 'auto',
    network: 'tcp',
    tls: false,
    'skip-cert-verify': false,
    servername: '',
    alpn: [],
    region: '',
    group_id: null,
    remark: '',
    username: ''
  })
  formRef.value?.restoreValidation()
}

// 监听节点变化，填充表单
watch(() => props.node, (node) => {
  if (node) {
    Object.assign(formData, node)
  } else {
    resetForm()
  }
}, { immediate: true })

// 监听显示状态变化
watch(() => props.visible, (visible) => {
  if (!visible) {
    resetForm()
  }
})

// 协议变化处理
const handleProtocolChange = (protocol: string) => {
  // 根据协议类型设置默认值
  switch (protocol) {
    case 'vmess':
    case 'vless':
      formData.port = 443
      formData.network = 'tcp'
      break
    case 'trojan':
      formData.port = 443
      break
    case 'shadowsocks':
      formData.port = 443
      break
    case 'socks5':
      formData.port = 1080
      break
    case 'http':
      formData.port = 8080
      break
    case 'https':
      formData.port = 443
      break
  }
}

// 网络类型变化处理
const handleNetworkChange = (network: string) => {
  // 根据网络类型设置默认值
  switch (network) {
    case 'ws':
      formData['ws-path'] = '/'
      break
    case 'grpc':
      formData['grpc-service-name'] = ''
      break
  }
}

// 取消操作
const handleCancel = () => {
  emit('update:visible', false)
}

// 保存操作
const handleSave = async () => {
  try {
    await formRef.value?.validate()
    emit('save', { ...formData } as Partial<INode>)
  } catch (error) {
    console.log('表单验证失败:', error)
  }
}

// 组件卸载时清理
onBeforeUnmount(() => {
  // 清理表单引用
  formRef.value = null
})
</script>

<style scoped>
.protocol-config {
  @apply space-y-4 p-4 bg-gray-50 rounded-lg;
}

/* 深色模式 */
.dark .protocol-config {
  @apply bg-gray-700/50;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .n-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>