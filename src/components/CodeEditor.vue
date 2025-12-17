<template>
  <div class="code-editor-wrapper">
    <codemirror
      v-model="code"
      placeholder="Enter your template content here..."
      class="h-[400px]"
      :autofocus="true"
      :indent-with-tab="true"
      :tab-size="2"
      :extensions="extensions"
      @update:modelValue="handleUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { IStandardProps, IStandardEmits } from '@/utils/componentApiStandards';
import { Codemirror } from 'vue-codemirror';
import { yaml } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';

interface Props extends IStandardProps {
  modelValue: string;
  language?: 'yaml' | 'json' | 'text';
}

const props = withDefaults(defineProps<Props>(), {
  language: 'text'
});

const emit = defineEmits<IStandardEmits & {
  'update:modelValue': [value: string];
}>();

const code = ref(props.modelValue);

// Watch for external changes to the modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue !== code.value) {
    code.value = newValue;
  }
});

const handleUpdate = (value: string) => {
  emit('update:modelValue', value);
};

const extensions = computed(() => {
  const langExt = [];
  if (props.language === 'yaml') {
    langExt.push(yaml());
  }
  // Add other languages here if needed, e.g., json()

  return [
    ...langExt,
    oneDark,
    EditorView.lineWrapping, // Enable line wrapping
  ];
});
</script>

<style scoped>
.code-editor-wrapper {
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
  width: 100%;
}
</style>