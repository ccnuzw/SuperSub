<template>
  <n-modal
    v-model:show="showModal"
    preset="dialog"
    :title="title"
    :type="type"
    :positive-text="positiveText"
    :negative-text="negativeText"
    :loading="loading"
    @positive-click="handlePositiveClick"
    @negative-click="handleNegativeClick"
    @close="handleClose"
  >
    <div class="confirmation-content">
      <div v-if="message" class="message">{{ message }}</div>
      <div v-if="$slots.default" class="custom-content">
        <slot></slot>
      </div>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { NModal, type DialogProps } from 'naive-ui';

interface Props {
  show: boolean;
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  positiveText?: string;
  negativeText?: string;
  loading?: boolean;
}

interface Emits {
  (e: 'update:show', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  message: '',
  type: 'info',
  positiveText: '确认',
  negativeText: '取消',
  loading: false
});

const emit = defineEmits<Emits>();

const showModal = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
});

const handlePositiveClick = () => {
  if (!props.loading) {
    emit('confirm');
  }
  return true;
};

const handleNegativeClick = () => {
  if (!props.loading) {
    emit('cancel');
  }
  return true;
};

const handleClose = () => {
  emit('cancel');
};
</script>

<style scoped>
.confirmation-content {
  padding: 8px 0;
}

.message {
  margin-bottom: 12px;
  line-height: 1.5;
}

.custom-content {
  margin-top: 12px;
}
</style>