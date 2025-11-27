// 临时禁用这个文件以避免类型错误
// TODO: 修复类型问题后重新启用

/*
import { ref, computed, nextTick, type Ref, h } from 'vue';
import type { BaseEntity, CrudResult, TableColumn, TableAction } from '@/types/common';
import { BaseStore } from '@/stores/base/BaseStore';
import { useMessage, useDialog } from 'naive-ui';
import { api } from '@/utils/api/ApiClient';

// 实体管理通用组合式函数
export function useEntityManagement<T extends BaseEntity>(
  store: BaseStore<T>,
  options: {
    confirmDelete?: boolean;
    deleteMessage?: string;
    successMessage?: string;
  } = {}
) {
  const {
    confirmDelete = true,
    deleteMessage = '确定要删除这个项目吗？',
    successMessage = '操作成功'
  } = options;

  // UI状态
  const editingItem = ref<T | null>(null);
  const showModal = ref(false);
  const loading = ref(false);
  const selectedIds = ref<string[]>([]);

  // Naive UI hooks
  const message = useMessage();
  const dialog = useDialog();

  // 计算属性
  const isEditing = computed(() => !!editingItem.value?.id);

  // 新增项目
  const handleAdd = () => {
    editingItem.value = null;
    showModal.value = true;
  };

  // 编辑项目
  const handleEdit = (item: T) => {
    editingItem.value = { ...item };
    showModal.value = true;
  };

  // 保存项目
  const handleSave = async (itemData: Partial<T>) => {
    loading.value = true;

    try {
      let result: CrudResult<T>;

      if (isEditing.value && editingItem.value?.id) {
        // 更新
        result = await store.updateItem(editingItem.value.id, itemData);
      } else {
        // 新增
        result = await store.addItem(itemData as Omit<T, keyof BaseEntity>);
      }

      if (result.success) {
        message.success(result.message || successMessage);
        showModal.value = false;
        editingItem.value = null;

        // 刷新列表
        await store.fetchItems();
      } else {
        message.error(result.message || '操作失败');
      }

      return result;
    } catch (error) {
      message.error('操作失败');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 删除项目
  const handleDelete = (item: T) => {
    if (!confirmDelete) {
      return performDelete(item);
    }

    dialog.warning({
      title: '确认删除',
      content: deleteMessage,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => performDelete(item)
    });
  };

  const performDelete = async (item: T) => {
    loading.value = true;

    try {
      const result = await store.deleteItem(item.id);

      if (result.success) {
        message.success(result.message || '删除成功');
      } else {
        message.error(result.message || '删除失败');
      }

      return result;
    } catch (error) {
      message.error('删除失败');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 批量删除
  const handleBulkDelete = () => {
    if (selectedIds.value.length === 0) {
      message.warning('请选择要删除的项目');
      return;
    }

    dialog.warning({
      title: '批量删除',
      content: `确定要删除选中的 ${selectedIds.value.length} 个项目吗？`,
      positiveText: '确定',
      negativeText: '取消',
      onPositiveClick: () => performBulkDelete()
    });
  };

  const performBulkDelete = async () => {
    loading.value = true;

    try {
      const result = await store.bulkOperation(selectedIds.value, 'delete');

      if (result.success) {
        message.success(result.message || '批量删除成功');
        selectedIds.value = [];
      } else {
        message.error(result.message || '批量删除失败');
      }

      return result;
    } catch (error) {
      message.error('批量删除失败');
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    await store.fetchItems();
    message.success('刷新成功');
  };

  // 取消操作
  const handleCancel = () => {
    showModal.value = false;
    editingItem.value = null;
  };

  return {
    // 状态
    editingItem,
    showModal,
    loading,
    selectedIds,
    isEditing,

    // 方法
    handleAdd,
    handleEdit,
    handleSave,
    handleDelete,
    handleBulkDelete,
    handleRefresh,
    handleCancel,
    performDelete,
    performBulkDelete
  };
}
*/