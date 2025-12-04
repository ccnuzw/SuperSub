import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type LayoutMode = 'horizontal' | 'vertical';

export const useLayoutStore = defineStore('layout', () => {
  const layoutMode = ref<LayoutMode>((localStorage.getItem('layoutMode') as LayoutMode) || 'vertical');

  const toggleLayoutMode = () => {
    layoutMode.value = layoutMode.value === 'vertical' ? 'horizontal' : 'vertical';
  };

  const setLayoutMode = (mode: LayoutMode) => {
    layoutMode.value = mode;
  };

  watch(layoutMode, (newMode) => {
    localStorage.setItem('layoutMode', newMode);
  }, { immediate: true });

  return {
    layoutMode,
    toggleLayoutMode,
    setLayoutMode,
  };
});