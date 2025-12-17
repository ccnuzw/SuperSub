/**
 * @fileoverview Common composables index
 * Centralized exports for all common utility composables
 */

export { default as useClipboard } from './useClipboard';
export { default as useNotifications } from './useNotifications';
export { default as useDateFormatting } from './useDateFormatting';
export { default as useTableActions } from './useTableActions';
export { default as useApiErrorHandler } from './useApiErrorHandler';

// Re-export types for convenience
export type {
  ClipboardResult,
  ClipboardOptions,
} from './useClipboard';

export type {
  MessageConfig,
  DialogConfig,
  NotificationConfig,
  BatchOperationResult,
  NotificationType,
} from './useNotifications';

export type {
  DateFormatOptions,
  DateRange,
} from './useDateFormatting';

export type {
  TableItem,
  ActionConfig,
  BatchOperationConfig,
  SelectionState,
  PaginationState,
  SortingState,
  TableOperationResult,
} from './useTableActions';

export type {
  ApiError,
  RetryConfig,
  ErrorHandlerConfig,
  ErrorType,
} from './useApiErrorHandler';

// Re-export constants
export { DATE_FORMATS } from './useDateFormatting';
export { MESSAGE_TEMPLATES } from './useNotifications';
export { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from './useApiErrorHandler';