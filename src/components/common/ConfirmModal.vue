<template>
  <n-modal
    :show="visible"
    @update:show="handleClose"
    :mask-closable="false"
    preset="dialog"
    :style="{ width: width }"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <n-icon :component="getIcon()" :color="getIconColor()" />
        <span>{{ title }}</span>
      </div>
    </template>

    <div class="py-4">
      <p v-if="message" class="text-gray-600 mb-4">{{ message }}</p>

      <!-- 自定义内容插槽 -->
      <slot>
        <div class="flex items-center gap-3">
          <n-icon :component="getIcon()" :size="48" :color="getIconColor()" />
          <span class="text-lg">{{ content || message }}</span>
        </div>
      </slot>

      <!-- 表单输入（如果需要） -->
      <n-input
        v-if="showInput"
        v-model:value="inputValue"
        :placeholder="inputPlaceholder"
        class="mt-4"
        @keydown.enter="handleConfirm"
      />
    </div>

    <template #action>
      <div class="flex justify-end gap-2">
        <n-button
          v-if="showCancel"
          @click="handleCancel"
          :disabled="loading"
        >
          {{ cancelText }}
        </n-button>
        <n-button
          :type="confirmType"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </n-button>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, type PropType } from 'vue';
import {
  NModal, NButton, NIcon, NInput
} from 'naive-ui';
import {
  Warning as WarningIcon, InformationCircle as InfoIcon,
  Warning as ErrorIcon, CheckmarkCircle as SuccessIcon,
  Trash as DeleteIcon, HelpCircle as HelpIcon
} from '@vicons/ionicons5';

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '确认'
  },
  content: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String as PropType<'info' | 'success' | 'warning' | 'error' | 'confirm'>,
    default: 'info'
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  confirmType: {
    type: String as PropType<'default' | 'tertiary' | 'primary' | 'info' | 'success' | 'warning' | 'error'>,
    default: 'primary'
  },
  loading: {
    type: Boolean,
    default: false
  },
  width: {
    type: String,
    default: '460px'
  },
  showInput: {
    type: Boolean,
    default: false
  },
  inputPlaceholder: {
    type: String,
    default: '请输入确认信息'
  },
  requireInput: {
    type: Boolean,
    default: false
  }
});

// Emits
const emit = defineEmits([
  'update:visible',
  'confirm',
  'cancel'
]);

// 响应式状态
const inputValue = ref('');

// 计算属性
const getIcon = () => {
  const iconMap = {
    info: InfoIcon,
    success: SuccessIcon,
    warning: WarningIcon,
    error: ErrorIcon,
    confirm: HelpIcon
  };
  return iconMap[props.type] || InfoIcon;
};

const getIconColor = () => {
  const colorMap = {
    info: '#2080f0',
    success: '#52c41a',
    warning: '#faad14',
    error: '#f5222d',
    confirm: '#faad14'
  };
  return colorMap[props.type] || '#2080f0';
};

// 方法
const handleConfirm = () => {
  if (props.showInput && props.requireInput && !inputValue.value.trim()) {
    return;
  }

  emit('confirm', inputValue.value);
  inputValue.value = '';
};

const handleCancel = () => {
  emit('cancel');
  inputValue.value = '';
};

const handleClose = () => {
  emit('update:visible', false);
  inputValue.value = '';
};

// 重置输入值
watch(() => props.visible, (visible: boolean) => {
  if (!visible) {
    inputValue.value = '';
  }
});
</script>

<style scoped>
:deep(.n-dialog__content) {
  padding: 20px 0;
}

:deep(.n-dialog__action) {
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}
</style>