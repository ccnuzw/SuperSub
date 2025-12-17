/**
 * Utils Index - Central export point for all utility functions
 * Provides clean imports and tree-shakable exports
 */

// Import the classes for re-export
import Logger from './logger';
import ValidationUtils from './validation';
import StorageUtils from './storage';
import FormatUtils from './format';
import UrlUtils from './urlUtils';
import ArrayUtils from './arrayUtils';
import ObjectUtils from './objectUtils';
import StringUtils from './stringUtils';
import TimeUtils from './timeUtils';
import AsyncUtils from './asyncUtils';

// Core utilities
export { default as Logger, logger, log, LogLevel } from './logger';
export { default as ValidationUtils, validate } from './validation';
export { default as StorageUtils, storage, store } from './storage';
export { default as FormatUtils, format } from './format';
export { default as UrlUtils, url } from './urlUtils';

// Data manipulation utilities
export { default as ArrayUtils, array } from './arrayUtils';
export { default as ObjectUtils, object } from './objectUtils';
export { default as StringUtils, string } from './stringUtils';

// Performance and async utilities
export { default as TimeUtils, time } from './timeUtils';
export { default as AsyncUtils, async } from './asyncUtils';

// Type exports
export type { LogEntry, LoggerConfig } from './logger';
export type { ValidationResult } from './validation';
export type { StorageOptions, StorageConfig } from './storage';
export type { ParsedUrl, QueryOptions } from './urlUtils';
export type { DebounceOptions, ThrottleOptions } from './timeUtils';
export type { QueueOptions, ParallelOptions } from './asyncUtils';

// Default export with all utilities
const utils = {
  Logger,
  ValidationUtils,
  StorageUtils,
  FormatUtils,
  UrlUtils,
  ArrayUtils,
  ObjectUtils,
  StringUtils,
  TimeUtils,
  AsyncUtils
};

export default utils;