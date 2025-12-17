/**
 * 节点卡片逻辑组合式函数
 */

import { ref, computed } from 'vue';
import { useMessage } from 'naive-ui';
import type { Node } from '@/types';

export interface UseNodeCardOptions {
  node: Node;
  selectable?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

export function useNodeCard(options: UseNodeCardOptions) {
  const message = useMessage();

  // 响应式数据
  const testing = ref(false);

  // 计算属性
  const cardClasses = computed(() => ({
    'node-card--selected': options.selected,
    'node-card--disabled': options.disabled
  }));

  // 方法
  const handleTest = async (callback?: (node: Node) => Promise<void>) => {
    testing.value = true;
    try {
      if (callback) {
        await callback(options.node);
      }
      message.success('节点测试完成');
    } catch (error) {
      message.error('节点测试失败');
    } finally {
      testing.value = false;
    }
  };

  const handleAction = async (action: string, callbacks?: Record<string, (node: Node) => void>) => {
    const actionMap: Record<string, string> = {
      edit: '编辑节点',
      copy: '复制节点',
      export: '导出配置',
      duplicate: '复制节点',
      delete: '删除节点'
    };

    const actionMessages: Record<string, { success: string; error: string }> = {
      edit: { success: '节点编辑成功', error: '节点编辑失败' },
      copy: { success: '节点已复制', error: '节点复制失败' },
      export: { success: '配置已导出', error: '配置导出失败' },
      duplicate: { success: '节点已复制', error: '节点复制失败' },
      delete: { success: '节点删除成功', error: '节点删除失败' }
    };

    try {
      if (callbacks && callbacks[action]) {
        callbacks[action](options.node);
      }

      if (actionMessages[action]) {
        message.success(actionMessages[action].success);
      }
    } catch (error) {
      if (actionMessages[action]) {
        message.error(actionMessages[action].error);
      }
    }
  };

  return {
    // 状态
    testing,
    cardClasses,

    // 方法
    handleTest,
    handleAction
  };
}