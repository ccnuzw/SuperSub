/**
 * 模态框组件索引文件
 * 统一导出所有模态框组件
 */

// 主要模态框组件
import ProfilePreviewModal from './ProfilePreviewModal.vue';
import ImportConfigModal from './ImportConfigModal.vue';

export { ProfilePreviewModal, ImportConfigModal };

// 类型定义
export interface ModalProps {
  show: boolean;
  title?: string;
  width?: string | number;
  closable?: boolean;
  maskClosable?: boolean;
}

export interface ModalEmits {
  'update:show': [show: boolean];
  close: [];
  confirm?: [];
  cancel?: [];
}

// 模态框工具函数
export const modalUtils = {
  /**
   * 显示确认对话框
   */
  showConfirm(options: {
    title?: string;
    content: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
  }): Promise<boolean> {
    return new Promise((resolve) => {
      // 这里应该实现具体的确认对话框逻辑
      // 暂时使用原生确认框
      const confirmed = window.confirm(options.content);
      resolve(confirmed);
    });
  },

  /**
   * 显示警告对话框
   */
  showWarning(content: string, title = '警告'): void {
    // 这里应该实现具体的警告对话框逻辑
    // 暂时使用原生警告框
    window.alert(`${title}\n\n${content}`);
  },

  /**
   * 显示成功提示
   */
  showSuccess(content: string, duration = 3000): void {
    // 这里应该实现具体的成功提示逻辑
    console.log('Success:', content);
  },

  /**
   * 显示错误提示
   */
  showError(content: string, duration = 5000): void {
    // 这里应该实现具体的错误提示逻辑
    console.error('Error:', content);
  },

  /**
   * 显示信息提示
   */
  showInfo(content: string, duration = 3000): void {
    // 这里应该实现具体的信息提示逻辑
    console.info('Info:', content);
  }
};

// 模态框管理器
export class ModalManager {
  private static instance: ModalManager;
  private modals: Map<string, any> = new Map();

  static getInstance(): ModalManager {
    if (!ModalManager.instance) {
      ModalManager.instance = new ModalManager();
    }
    return ModalManager.instance;
  }

  /**
   * 注册模态框
   */
  register(key: string, modal: any): void {
    this.modals.set(key, modal);
  }

  /**
   * 显示模态框
   */
  show(key: string): void {
    const modal = this.modals.get(key);
    if (modal) {
      modal.show = true;
    }
  }

  /**
   * 隐藏模态框
   */
  hide(key: string): void {
    const modal = this.modals.get(key);
    if (modal) {
      modal.show = false;
    }
  }

  /**
   * 切换模态框显示状态
   */
  toggle(key: string): void {
    const modal = this.modals.get(key);
    if (modal) {
      modal.show = !modal.show;
    }
  }

  /**
   * 关闭所有模态框
   */
  hideAll(): void {
    this.modals.forEach(modal => {
      modal.show = false;
    });
  }

  /**
   * 获取当前显示的模态框数量
   */
  getVisibleCount(): number {
    let count = 0;
    this.modals.forEach(modal => {
      if (modal.show) count++;
    });
    return count;
  }
}

// 常量定义
export const MODAL_CONSTANTS = {
  DEFAULT_WIDTH: 520,
  LARGE_WIDTH: 800,
  SMALL_WIDTH: 400,
  ANIMATION_DURATION: 300,
  Z_INDEX_BASE: 1000
} as const;

// 默认导出
export default {
  ProfilePreviewModal,
  ImportConfigModal,
  modalUtils,
  ModalManager,
  MODAL_CONSTANTS
};