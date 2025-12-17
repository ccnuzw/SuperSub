/**
 * @fileoverview Composable for clipboard operations
 * Provides centralized clipboard functionality with error handling and fallback support
 */

import { ref, Ref } from 'vue';
import { useMessage } from 'naive-ui';

/**
 * Clipboard operation result
 */
export interface ClipboardResult {
  success: boolean;
  error?: string;
  data?: string;
}

/**
 * Clipboard options
 */
export interface ClipboardOptions {
  /** Custom success message (overrides default) */
  successMessage?: string;
  /** Custom error message (overrides default) */
  errorMessage?: string;
  /** Duration in milliseconds to show messages */
  messageDuration?: number;
  /** Whether to show notification messages */
  showMessage?: boolean;
}

/**
 * Default clipboard options
 */
const DEFAULT_OPTIONS: Required<ClipboardOptions> = {
  successMessage: '已复制到剪贴板',
  errorMessage: '复制失败',
  messageDuration: 3000,
  showMessage: true,
};

/**
 * Composable for clipboard operations
 *
 * Provides a unified interface for clipboard operations with:
 * - Modern Clipboard API support
 * - Fallback to execCommand for older browsers
 * - Error handling and user feedback
 * - TypeScript support
 *
 * @example
 * ```typescript
 * const { copy, copyText, lastCopied, isLoading } = useClipboard();
 *
 * // Copy text
 * await copyText('Hello World');
 *
 * // Copy with custom options
 * await copy('Custom data', {
 *   successMessage: 'Data copied!',
 *   showMessage: true
 * });
 * ```
 */
export function useClipboard(options: ClipboardOptions = {}) {
  const message = useMessage();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Reactive state
  const isLoading = ref(false);
  const lastCopied = ref<string | null>(null);
  const error = ref<string | null>(null);

  /**
   * Check if clipboard API is available
   */
  const isClipboardSupported = (): boolean => {
    return !!(
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    );
  };

  /**
   * Fallback copy method using execCommand
   * @param text Text to copy
   */
  const fallbackCopy = async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          resolve();
        } else {
          reject(new Error('execCommand failed'));
        }
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   * Copy text to clipboard with modern API or fallback
   * @param text Text to copy
   * @param options Override options for this operation
   */
  const copy = async (text: string, options: ClipboardOptions = {}): Promise<ClipboardResult> => {
    const operationOpts = { ...opts, ...options };
    isLoading.value = true;
    error.value = null;

    try {
      // Validate input
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text to copy');
      }

      // Use modern clipboard API if available
      if (isClipboardSupported()) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        await fallbackCopy(text);
      }

      // Update state
      lastCopied.value = text;
      error.value = null;

      // Show success message
      if (operationOpts.showMessage) {
        message.success(operationOpts.successMessage);
      }

      return {
        success: true,
        data: text,
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      error.value = errorMessage;

      // Show error message
      if (operationOpts.showMessage) {
        message.error(operationOpts.errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
      };

    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Copy text to clipboard (alias for copy)
   * @param text Text to copy
   */
  const copyText = (text: string): Promise<ClipboardResult> => {
    return copy(text);
  };

  /**
   * Copy JSON data as string
   * @param data Data to copy
   * @param options Copy options
   */
  const copyJson = async (data: unknown, options: ClipboardOptions = {}): Promise<ClipboardResult> => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      return await copy(jsonString, {
        ...options,
        successMessage: options.successMessage || 'JSON数据已复制到剪贴板',
      });
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to serialize JSON',
      };
    }
  };

  /**
   * Copy URL to clipboard
   * @param url URL to copy
   * @param options Copy options
   */
  const copyUrl = async (url: string, options: ClipboardOptions = {}): Promise<ClipboardResult> => {
    try {
      // Validate URL
      new URL(url);
      return await copy(url, {
        ...options,
        successMessage: options.successMessage || '链接已复制到剪贴板',
      });
    } catch (err) {
      return {
        success: false,
        error: 'Invalid URL format',
      };
    }
  };

  /**
   * Copy table row data
   * @param data Row data to copy
   * @param fields Fields to copy (if not provided, copies all values)
   * @param options Copy options
   */
  const copyTableRow = async (
    data: Record<string, unknown>,
    fields?: string[],
    options: ClipboardOptions = {}
  ): Promise<ClipboardResult> => {
    try {
      let textToCopy: string;

      if (fields && fields.length > 0) {
        // Copy only specified fields
        const values = fields.map(field => data[field] ?? '').filter(Boolean);
        textToCopy = values.join('\t');
      } else {
        // Copy all values
        const values = Object.values(data).filter(val => val !== null && val !== undefined);
        textToCopy = values.join('\t');
      }

      if (!textToCopy) {
        return {
          success: false,
          error: 'No data to copy',
        };
      }

      return await copy(textToCopy, {
        ...options,
        successMessage: options.successMessage || '行数据已复制到剪贴板',
      });

    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to copy row data',
      };
    }
  };

  /**
   * Clear the clipboard state
   */
  const clear = (): void => {
    lastCopied.value = null;
    error.value = null;
  };

  /**
   * Check if we can read from clipboard
   */
  const canRead = (): boolean => {
    return !!(navigator.clipboard && typeof navigator.clipboard.readText === 'function');
  };

  /**
   * Read text from clipboard
   * Note: Requires user permission and secure context
   */
  const readText = async (): Promise<string> => {
    try {
      if (!canRead()) {
        throw new Error('Clipboard read not supported');
      }
      return await navigator.clipboard.readText();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to read clipboard');
    }
  };

  return {
    // State
    isLoading: isLoading as Readonly<Ref<boolean>>,
    lastCopied: lastCopied as Readonly<Ref<string | null>>,
    error: error as Readonly<Ref<string | null>>,

    // Methods
    copy,
    copyText,
    copyJson,
    copyUrl,
    copyTableRow,
    clear,
    readText,

    // Utilities
    isClipboardSupported,
    canRead,
  };
}

/**
 * Default export
 */
export default useClipboard;