/**
 * @fileoverview Composable for common table CRUD operations
 * Provides standardized table actions with confirmation dialogs and error handling
 */

import { ref, Ref, computed, ComputedRef, unref } from 'vue';
import { useNotifications } from './useNotifications';

/**
 * Table item type (generic)
 */
export type TableItem = Record<string, unknown>;

/**
 * Action configuration
 */
export interface ActionConfig<T = TableItem> {
  /** Action type */
  type: 'edit' | 'delete' | 'copy' | 'view' | 'refresh' | 'export' | 'import' | 'custom';
  /** Display text */
  label: string;
  /** Icon identifier */
  icon?: string;
  /** Whether to show confirmation dialog */
  confirm?: boolean;
  /** Confirmation dialog title */
  confirmTitle?: string;
  /** Confirmation dialog content */
  confirmContent?: string;
  /** Whether action is disabled */
  disabled?: boolean | ((item: T) => boolean);
  /** Whether operation is destructive */
  destructive?: boolean;
  /** Custom action function */
  action?: (item: T, context?: any) => void | Promise<void>;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
}

/**
 * Batch operation configuration
 */
export interface BatchOperationConfig<T = TableItem> {
  /** Operation type */
  type: 'delete' | 'export' | 'update' | 'custom';
  /** Display text */
  label: string;
  /** Icon identifier */
  icon?: string;
  /** Whether to show confirmation dialog */
  confirm?: boolean;
  /** Confirmation dialog title */
  confirmTitle?: string;
  /** Confirmation dialog content */
  confirmContent?: string;
  /** Batch operation function */
  action: (items: T[]) => Promise<{ success: number; failed: number; errors?: string[] }>;
  /** Whether operation is destructive */
  destructive?: boolean;
}

/**
 * Selection state
 */
export interface SelectionState<T = TableItem> {
  /** Selected items */
  selected: T[];
  /** Whether all items are selected */
  allSelected: boolean;
  /** Whether partially selected */
  indeterminate: boolean;
  /** Selection mode */
  mode: 'single' | 'multiple';
}

/**
 * Pagination state
 */
export interface PaginationState {
  /** Current page */
  page: number;
  /** Page size */
  pageSize: number;
  /** Total items */
  total: number;
  /** Total pages */
  totalPages: number;
}

/**
 * Sorting state
 */
export interface SortingState {
  /** Sort field */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Table operations result
 */
export interface TableOperationResult<T = TableItem> {
  success: boolean;
  action: string;
  item?: T;
  error?: string;
}

/**
 * Default action configurations
 */
export const DEFAULT_ACTIONS: Record<string, Partial<ActionConfig>> = {
  edit: {
    type: 'edit',
    label: '编辑',
    icon: 'edit',
    confirm: false,
  },
  delete: {
    type: 'delete',
    label: '删除',
    icon: 'delete',
    confirm: true,
    confirmTitle: '确认删除',
    confirmContent: '确定要删除此项吗？此操作不可撤销。',
  },
  copy: {
    type: 'copy',
    label: '复制',
    icon: 'copy',
    confirm: false,
  },
  view: {
    type: 'view',
    label: '查看',
    icon: 'eye',
    confirm: false,
  },
  refresh: {
    type: 'refresh',
    label: '刷新',
    icon: 'refresh',
    confirm: false,
  },
  export: {
    type: 'export',
    label: '导出',
    icon: 'download',
    confirm: false,
  },
};

/**
 * Composable for common table CRUD operations
 *
 * Provides standardized table operations including:
 * - Single item actions (edit, delete, copy, view, etc.)
 * - Batch operations (delete multiple, export, etc.)
 * - Selection management
 * - Pagination and sorting
 * - Loading states and error handling
 * - Confirmation dialogs
 *
 * @example
 * ```typescript
 * const {
 *   actions,
 *   handleAction,
 *   selection,
 *   toggleSelection,
 *   clearSelection,
 *   pagination,
 *   setPagination,
 *   loading
 * } = useTableActions();
 *
 * // Define custom actions
 * const customActions = [
 *   {
 *     type: 'delete',
 *     action: async (item) => {
 *       await deleteItem(item.id);
 *     },
 *     successMessage: '删除成功'
 *   }
 * ];
 *
 * // Handle action
 * await handleAction('delete', item);
 * ```
 */
export function useTableActions<T = TableItem>(options: {
  /** Available actions */
  actions?: ActionConfig<T>[];
  /** Data source */
  data?: Ref<T[]>;
  /** Custom success handler */
  onSuccess?: (result: TableOperationResult<T>) => void;
  /** Custom error handler */
  onError?: (error: Error, action: string) => void;
  /** Selection mode */
  selectionMode?: 'single' | 'multiple';
  /** Default page size */
  defaultPageSize?: number;
} = {}) {
  const notifications = useNotifications();

  const {
    actions: customActions = [],
    data,
    onSuccess,
    onError,
    selectionMode = 'multiple',
    defaultPageSize = 20,
  } = options;

  // Reactive state
  const loading = ref(false);
  const actions = ref<ActionConfig<T>[]>(customActions);
  const selection = ref<SelectionState<T>>({
    selected: [] as T[],
    allSelected: false,
    indeterminate: false,
    mode: selectionMode,
  }) as Ref<SelectionState<T>>;
  const pagination = ref<PaginationState>({
    page: 1,
    pageSize: defaultPageSize,
    total: 0,
    totalPages: 0,
  });
  const sorting = ref<SortingState>({
    field: '',
    direction: 'asc',
  });

  // Computed properties
  const hasSelection = computed(() => selection.value.selected.length > 0);
  const selectedCount = computed(() => selection.value.selected.length);
  const isMultipleSelection = computed(() => selection.value.mode === 'multiple');

  /**
   * Get action configuration by type
   */
  const getActionConfig = (type: string): ActionConfig<T> | undefined => {
    return actions.value.find(action => action.type === type);
  };

  /**
   * Add or update action
   */
  const registerAction = (config: ActionConfig<T>): void => {
    const existingIndex = actions.value.findIndex(action => action.type === config.type);
    const defaultConfig = DEFAULT_ACTIONS[config.type] as Partial<ActionConfig<T>> || {};
    const fullConfig: ActionConfig<T> = { ...defaultConfig, ...config };

    if (existingIndex >= 0) {
      actions.value[existingIndex] = fullConfig;
    } else {
      actions.value.push(fullConfig);
    }
  };

  /**
   * Remove action
   */
  const unregisterAction = (type: string): void => {
    const index = actions.value.findIndex(action => action.type === type);
    if (index >= 0) {
      actions.value.splice(index, 1);
    }
  };

  /**
   * Execute single item action
   */
  const handleAction = async (
    actionType: string,
    item: T,
    context?: any
  ): Promise<TableOperationResult<T>> => {
    const actionConfig = getActionConfig(actionType);

    if (!actionConfig) {
      const error = new Error(`Unknown action: ${actionType}`);
      onError?.(error, actionType);
      return { success: false, action: actionType, error: error.message };
    }

    if (typeof actionConfig.disabled === 'function' ? actionConfig.disabled(item) : actionConfig.disabled) {
      return { success: false, action: actionType, error: 'Action is disabled' };
    }

    try {
      // Show confirmation dialog if required
      if (actionConfig.confirm) {
        const confirmed = await notifications.confirm(
          actionConfig.confirmTitle || `确认${actionConfig.label}`,
          actionConfig.confirmContent || `确定要${actionConfig.label}吗？`
        );

        if (!confirmed) {
          return { success: true, action: actionType }; // User cancelled
        }
      }

      // Show loading state
      if (actionConfig.showLoading) {
        loading.value = true;
        notifications.loading(`正在${actionConfig.label}...`);
      }

      // Execute action
      await actionConfig.action?.(item, context);

      // Show success message
      const successMessage = actionConfig.successMessage ||
        (actionType === 'edit' ? '编辑成功' :
         actionType === 'delete' ? '删除成功' :
         actionType === 'copy' ? '复制成功' :
         `${actionConfig.label}成功`);

      notifications.success(successMessage);

      const result: TableOperationResult<T> = { success: true, action: actionType, item };
      onSuccess?.(result);

      return result;

    } catch (error) {
      const errorMessage = actionConfig.errorMessage ||
        (actionType === 'edit' ? '编辑失败' :
         actionType === 'delete' ? '删除失败' :
         actionType === 'copy' ? '复制失败' :
         `${actionConfig.label}失败`);

      notifications.error(errorMessage);

      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err, actionType);

      return { success: false, action: actionType, item, error: err.message };

    } finally {
      if (actionConfig.showLoading) {
        loading.value = false;
      }
    }
  };

  /**
   * Execute batch operation
   */
  const handleBatchAction = async (
    batchConfig: BatchOperationConfig<T>
  ): Promise<void> => {
    if (selection.value.selected.length === 0) {
      notifications.warning('请先选择要操作的项目');
      return;
    }

    try {
      // Show confirmation dialog if required
      if (batchConfig.confirm) {
        const confirmed = await notifications.confirm(
          batchConfig.confirmTitle || `确认${batchConfig.label}`,
          batchConfig.confirmContent || `确定要${batchConfig.label}选中的 ${selection.value.selected.length} 项吗？`
        );

        if (!confirmed) {
          return;
        }
      }

      loading.value = true;
      notifications.loading(`正在${batchConfig.label}...`);

      // Execute batch operation
      const result = await batchConfig.action(selection.value.selected as T[]);

      // Show result
      notifications.showBatchResult({
        total: selection.value.selected.length,
        success: result.success,
        failed: result.failed,
        errors: result.errors || [],
      }, batchConfig.label);

      // Clear selection after successful operation
      if (result.failed === 0) {
        clearSelection();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '批量操作失败';
      notifications.error(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage), 'batch');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Toggle item selection
   */
  const toggleSelection = (item: T, selected?: boolean): void => {
    if (!isMultipleSelection.value) {
      // Single selection mode
      (selection.value.selected as T[]) = selected === undefined || selected ? [item] : [];
      selection.value.allSelected = selected !== false;
      selection.value.indeterminate = false;
      return;
    }

    // Multiple selection mode
    const index = selection.value.selected.findIndex(
      selectedItem => JSON.stringify(selectedItem) === JSON.stringify(item)
    );

    if (selected === undefined) {
      // Toggle current state
      selected = index === -1;
    }

    if (selected && index === -1) {
      (selection.value.selected as T[]).push(item);
    } else if (!selected && index >= 0) {
      (selection.value.selected as T[]).splice(index, 1);
    }

    updateSelectionState();
  };

  /**
   * Toggle all items selection
   */
  const toggleAllSelection = (selected?: boolean): void => {
    const currentData = unref(data);
    if (!currentData) return;

    if (selected === undefined) {
      selected = !selection.value.allSelected;
    }

    if (selected) {
      (selection.value.selected as T[]) = [...currentData] as T[];
    } else {
      (selection.value.selected as T[]) = [] as T[];
    }

    updateSelectionState();
  };

  /**
   * Update selection state indicators
   */
  const updateSelectionState = (): void => {
    const currentData = unref(data);
    if (!currentData) {
      selection.value.allSelected = false;
      selection.value.indeterminate = false;
      return;
    }

    const totalItems = currentData.length;
    const selectedItems = selection.value.selected.length;

    selection.value.allSelected = selectedItems === totalItems && totalItems > 0;
    selection.value.indeterminate = selectedItems > 0 && selectedItems < totalItems;
  };

  /**
   * Clear selection
   */
  const clearSelection = (): void => {
    selection.value.selected = [];
    selection.value.allSelected = false;
    selection.value.indeterminate = false;
  };

  /**
   * Select specific items
   */
  const selectItems = (items: T[]): void => {
    (selection.value.selected as T[]) = [...items] as T[];
    updateSelectionState();
  };

  /**
   * Update pagination
   */
  const setPagination = (updates: Partial<PaginationState>): void => {
    pagination.value = { ...pagination.value, ...updates };
  };

  /**
   * Update sorting
   */
  const setSorting = (field: string, direction?: 'asc' | 'desc'): void => {
    if (sorting.value.field === field && !direction) {
      // Toggle direction if same field
      sorting.value.direction = sorting.value.direction === 'asc' ? 'desc' : 'asc';
    } else {
      sorting.value.field = field;
      sorting.value.direction = direction || 'asc';
    }
  };

  /**
   * Get selected items IDs (assuming items have id field)
   */
  const getSelectedIds = (): (string | number)[] => {
    return selection.value.selected
      .map(item => (item as any).id)
      .filter(Boolean);
  };

  /**
   * Check if item is selected
   */
  const isItemSelected = (item: T): boolean => {
    return selection.value.selected.some(
      selectedItem => JSON.stringify(selectedItem) === JSON.stringify(item)
    );
  };

  /**
   * Get available actions for item
   */
  const getItemActions = (item: T): ActionConfig<T>[] => {
    return actions.value.filter(action => {
      if (typeof action.disabled === 'function') {
        return !action.disabled(item);
      }
      return !action.disabled;
    });
  };

  /**
   * Export selected items to CSV
   */
  const exportToCSV = (
    columns: { key: string; title: string }[],
    filename?: string
  ): void => {
    if (selection.value.selected.length === 0) {
      notifications.warning('请先选择要导出的数据');
      return;
    }

    try {
      const headers = columns.map(col => col.title).join(',');
      const rows = selection.value.selected.map(item =>
        columns.map(col => {
          const value = (item as any)[col.key];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      );

      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename || `export_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        notifications.success('数据导出成功');
      }
    } catch (error) {
      notifications.error('数据导出失败');
    }
  };

  // Watch data changes to update selection state
  if (data) {
    // This would typically be done with a watcher, but we'll call it when data changes
    // The component using this composable should call updateSelectionState() when data changes
  }

  return {
    // State
    loading: loading as Readonly<Ref<boolean>>,
    actions: actions as Readonly<Ref<ActionConfig<T>[]>>,
    selection: selection as Readonly<Ref<SelectionState<T>>>,
    pagination: pagination as Readonly<Ref<PaginationState>>,
    sorting: sorting as Readonly<Ref<SortingState>>,

    // Computed
    hasSelection,
    selectedCount,
    isMultipleSelection,

    // Action management
    getActionConfig,
    registerAction,
    unregisterAction,

    // Single item operations
    handleAction,

    // Batch operations
    handleBatchAction,

    // Selection management
    toggleSelection,
    toggleAllSelection,
    clearSelection,
    selectItems,
    getSelectedIds,
    isItemSelected,
    updateSelectionState,

    // Pagination and sorting
    setPagination,
    setSorting,

    // Utilities
    getItemActions,
    exportToCSV,
  };
}

/**
 * Default export
 */
export default useTableActions;