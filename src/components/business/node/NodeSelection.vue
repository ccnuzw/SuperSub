/**
 * 节点选择组件
 * 提供多选模式下的复选框功能
 */

<template>
  <div v-if="selectable" class="node-card__select">
    <input
      type="checkbox"
      :checked="selected"
      :disabled="disabled"
      @change="handleChange"
      class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  selected?: boolean;
  selectable?: boolean;
  disabled?: boolean;
  nodeId: string;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  selectable: false,
  disabled: false
});

const emit = defineEmits<{
  select: [nodeId: string, selected: boolean];
}>();

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('select', props.nodeId, target.checked);
};
</script>

<style scoped>
.node-card__select {
  @apply absolute top-4 left-4 z-10;
}
</style>