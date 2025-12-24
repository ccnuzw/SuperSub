<!--
  节点批量导入对话框组件
  负责提供用户界面和处理用户交互
-->

<template>
  <n-modal
    v-model:show="showModal"
    :mask-closable="false"
    preset="dialog"
    title="批量导入节点"
    style="width: 600px"
  >
    <!-- 导入方式选择 -->
    <n-tabs v-model:value="importMethod" type="segment">
      <n-tab-pane name="text" tab="文本导入">
        <n-space vertical>
          <n-text depth="3">
            粘贴节点链接，每行一个，支持 vmess://, vless://, trojan://, ss://, hysteria2:// 等格式
          </n-text>
          <n-input
            v-model:value="importText"
            type="textarea"
            :rows="8"
            placeholder="请粘贴节点链接，例如：&#10;vmess://...&#10;vless://...&#10;trojan://..."
            @input="handleTextChange"
          />
          <n-space justify="space-between">
            <n-text depth="3">已输入 {{ lineCount }} 行链接</n-text>
            <n-button @click="handleClearText">清空</n-button>
          </n-space>
        </n-space>
      </n-tab-pane>

      <n-tab-pane name="file" tab="文件导入">
        <n-space vertical>
          <n-upload
            ref="uploadRef"
            :file-list="fileList"
            :max="1"
            accept=".txt,.text"
            @change="handleFileChange"
            @remove="handleFileRemove"
          >
            <n-upload-dragger>
              <div style="margin-bottom: 12px">
                <n-icon size="48" :depth="3">
                  <ArchiveOutline />
                </n-icon>
              </div>
              <n-text style="font-size: 16px">
                点击或者拖动文件到该区域来上传
              </n-text>
              <n-p depth="3" style="margin: 8px 0 0 0">
                支持 .txt 格式，文件大小不超过 1MB
              </n-p>
            </n-upload-dragger>
          </n-upload>
        </n-space>
      </n-tab-pane>
    </n-tabs>

    <!-- 分组选择 -->
    <n-divider />
    <n-space vertical>
      <n-text strong>目标分组</n-text>
      <n-select
        v-model:value="selectedGroupId"
        placeholder="选择分组（可选）"
        :options="groupOptions"
        clearable
      />
    </n-space>

    <!-- 导入选项 -->
    <n-divider />
    <n-space vertical>
      <n-text strong>导入选项</n-text>
      <n-checkbox v-model:checked="options.validateLinks">
        验证链接格式（推荐开启）
      </n-checkbox>
      <n-checkbox v-model:checked="options.deduplicate">
        去重处理（移除重复节点）
      </n-checkbox>
    </n-space>

    <!-- 预览区域 -->
    <template v-if="previewData">
      <n-divider />
      <n-alert
        :type="previewData.warnings.length > 0 ? 'warning' : 'success'"
        :title="previewData.summary"
      >
        <div>
          <div v-for="detail in previewData.details" :key="detail">
            {{ detail }}
          </div>
          <div v-if="previewData.warnings.length > 0" style="margin-top: 8px">
            <n-text v-for="warning in previewData.warnings" :key="warning" depth="3">
              • {{ warning }}
            </n-text>
          </div>
        </div>
      </n-alert>
    </template>

    <!-- 操作按钮 -->
    <template #action>
      <n-space>
        <n-button @click="handleClose">取消</n-button>
        <n-button
          type="primary"
          :loading="loading"
          :disabled="!canImport"
          @click="handleImport"
        >
          {{ getImportButtonText() }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NModal,
  NTabs,
  NTabPane,
  NSpace,
  NText,
  NInput,
  NButton,
  NDivider,
  NSelect,
  NCheckbox,
  NAlert,
  NUpload,
  NUploadDragger,
  NIcon,
  NP,
  useMessage
} from 'naive-ui'
import { ArchiveOutline } from '@vicons/ionicons5'

import type { UploadFileInfo } from 'naive-ui'
import { NodeBulkImportService } from '@/services/node/NodeBulkImportService'
import type { BulkImportOptions } from '@/services/node/NodeBulkImportService'

// Props & Emits
interface Props {
  visible: boolean
  groups?: Array<{ label: string; value: string }>
  loading?: boolean
}

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'import', data: { links: string[]; groupId?: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  groups: () => [],
  loading: false
})

const emit = defineEmits<Emits>()

// 组件状态
const message = useMessage()
const uploadRef = ref()

// 导入方式
const importMethod = ref<'text' | 'file'>('text')
const importText = ref('')
const fileList = ref<UploadFileInfo[]>([])

// 分组选择
const selectedGroupId = ref('')

// 导入选项
const options = ref<BulkImportOptions>({
  links: [],
  validateLinks: true,
  deduplicate: true
})

// 预览数据
const previewData = ref<{
  summary: string
  details: string[]
  warnings: string[]
} | null>(null)

// 计算属性
const showModal = computed({
  get: () => props.visible,
  set: (value) => {
    emit('update:visible', value)
    if (!value) {
      handleReset()
    }
  }
})

const groupOptions = computed(() => [
  { label: '默认分组', value: '' },
  ...props.groups
])

const lineCount = computed(() => {
  if (!importText.value) return 0
  return importText.value.split('\n').filter(line => line.trim()).length
})

const canImport = computed(() => {
  if (importMethod.value === 'text') {
    return importText.value.trim().length > 0
  } else {
    return fileList.value.length > 0
  }
})

const currentLinks = computed(() => {
  if (importMethod.value === 'text') {
    return importText.value
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
  } else {
    return []
  }
})

// 监听链接变化，生成预览
let debounceTimer: NodeJS.Timeout | null = null
watch(currentLinks, (links) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  debounceTimer = setTimeout(() => {
    if (links.length > 0) {
      generatePreview(links)
    } else {
      previewData.value = null
    }
  }, 500)
})

// 方法
const handleTextChange = () => {
  // 文本变化时自动更新预览
}

const handleClearText = () => {
  importText.value = ''
  previewData.value = null
}

const handleFileChange = (data: { fileList: UploadFileInfo[] }) => {
  fileList.value = data.fileList

  // 读取文件内容
  if (data.fileList.length > 0) {
    const file = data.fileList[0].file
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        processFileContent(content)
      }
      reader.onerror = () => {
        message.error('文件读取失败')
      }
      reader.readAsText(file)
    }
  }
}

const handleFileRemove = () => {
  fileList.value = []
  importText.value = ''
  previewData.value = null
}

const processFileContent = (content: string) => {
  const lines = content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  importText.value = lines.join('\n')
  importMethod.value = 'text'
}

const generatePreview = (links: string[]) => {
  try {
    const { validationResult } = NodeBulkImportService.prepareImportData(links, options.value)
    previewData.value = NodeBulkImportService.generateImportPreview(validationResult, options.value)
  } catch (error) {
    console.error('Generate preview failed:', error)
    previewData.value = null
  }
}

const getImportButtonText = () => {
  if (!currentLinks.value.length) return '请输入链接'
  return `导入 ${currentLinks.value.length} 个节点`
}

const handleImport = async () => {
  const links = currentLinks.value

  if (links.length === 0) {
    message.warning('请输入节点链接')
    return
  }

  // 预处理导入数据
  const { cleanedLinks, validationResult, canProceed } = NodeBulkImportService.prepareImportData(
    links,
    options.value
  )

  if (!canProceed) {
    message.error('没有有效的节点链接可导入')
    return
  }

  // 显示验证结果
  if (validationResult.invalid.length > 0) {
    message.warning(`发现 ${validationResult.invalid.length} 个无效链接，将被忽略`)
  }

  try {
    emit('import', {
      links: validationResult.valid,
      groupId: selectedGroupId.value || undefined
    })
  } catch (error) {
    console.error('Import failed:', error)
    message.error('导入失败，请稍后重试')
  }
}

const handleClose = () => {
  showModal.value = false
}

const handleReset = () => {
  importText.value = ''
  fileList.value = []
  selectedGroupId.value = ''
  previewData.value = null
  importMethod.value = 'text'
  options.value = {
    links: [],
    validateLinks: true,
    deduplicate: true
  }
}
</script>

<style scoped>
/* 自定义样式 */
</style>