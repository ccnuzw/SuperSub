/**
 * @fileoverview Composable for consistent date and time formatting
 * Provides centralized date/time formatting with localization support
 */

import { computed, ComputedRef } from 'vue';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/zh-cn';

// Configure dayjs
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.locale('zh-cn');

/**
 * Date format options
 */
export interface DateFormatOptions {
  /** Custom format string (overrides type) */
  format?: string;
  /** Predefined format type */
  type?: 'date' | 'time' | 'datetime' | 'iso' | 'relative' | 'custom';
  /** Timezone for formatting */
  timezone?: string;
  /** Whether to show timezone information */
  showTimezone?: boolean;
  /** Locale for formatting */
  locale?: string;
}

/**
 * Predefined format templates
 */
export const DATE_FORMATS = {
  /** Date only: 2024-01-15 */
  DATE: 'YYYY-MM-DD',
  /** Date with month name: 2024年1月15日 */
  DATE_CN: 'YYYY年M月D日',
  /** Time only: 14:30:25 */
  TIME: 'HH:mm:ss',
  /** Time without seconds: 14:30 */
  TIME_SHORT: 'HH:mm',
  /** Date and time: 2024-01-15 14:30:25 */
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  /** Date and time with Chinese format: 2024年1月15日 14:30 */
  DATETIME_CN: 'YYYY年M月D日 HH:mm',
  /** ISO format: 2024-01-15T14:30:25.000Z */
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  /** File friendly format: 20240115_143025 */
  FILE: 'YYYYMMDD_HHmmss',
  /** Display format: 2024年1月15日 星期一 14:30 */
  DISPLAY: 'YYYY年M月D日 dddd HH:mm',
  /** Short display: 01-15 14:30 */
  SHORT: 'MM-DD HH:mm',
  /** Month and year: 2024年1月 */
  MONTH_YEAR: 'YYYY年M月',
  /** Week and year: 2024年第3周 */
  WEEK_YEAR: 'YYYY年第w周',
};

/**
 * Date range type
 */
export interface DateRange {
  start: Date | string | number;
  end: Date | string | number;
}

/**
 * Composable for date and time formatting
 *
 * Provides consistent date/time formatting across the application:
 * - Multiple predefined formats
 * - Custom format support
 * - Timezone handling
 * - Relative time support
 * - Duration formatting
 * - Internationalization support
 *
 * @example
 * ```typescript
 * const { formatDate, formatRelative, formatDuration, isToday } = useDateFormatting();
 *
 * // Format current date
 * formatDate(new Date(), { type: 'datetime' });
 *
 * // Format with custom template
 * formatDate(new Date(), { type: 'custom', format: 'YYYY年M月D日 HH:mm' });
 *
 * // Relative time
 * formatRelative(new Date(Date.now() - 3600000)); // "1小时前"
 *
 * // Duration
 * formatDuration(3600); // "1小时"
 * ```
 */
export function useDateFormatting() {
  /**
   * Get the current timezone
   */
  const currentTimezone = computed(() => {
    return dayjs.tz.guess() || 'UTC';
  });

  /**
   * Format a date or time
   */
  const formatDate = (
    date: Date | string | number | null | undefined,
    options: DateFormatOptions = {}
  ): string => {
    if (!date) return '-';

    const {
      type = 'datetime',
      format: customFormat,
      timezone = currentTimezone.value,
      showTimezone = false,
      locale = 'zh-cn',
    } = options;

    try {
      let dayjsInstance = dayjs(date);

      // Apply timezone if specified
      if (timezone && timezone !== 'local') {
        dayjsInstance = dayjsInstance.tz(timezone);
      }

      // Determine format
      let formatString: string;
      if (customFormat) {
        formatString = customFormat;
      } else if (type === 'date') {
        formatString = DATE_FORMATS.DATE_CN;
      } else if (type === 'time') {
        formatString = DATE_FORMATS.TIME_SHORT;
      } else if (type === 'datetime') {
        formatString = DATE_FORMATS.DATETIME_CN;
      } else if (type === 'iso') {
        formatString = DATE_FORMATS.ISO;
      } else if (type === 'custom') {
        formatString = DATE_FORMATS.DATETIME_CN;
      } else {
        formatString = DATE_FORMATS.DATETIME_CN;
      }

      let result = dayjsInstance.locale(locale).format(formatString);

      // Add timezone info if requested
      if (showTimezone && timezone !== 'local') {
        const tzOffset = dayjsInstance.utcOffset();
        const tzSign = tzOffset >= 0 ? '+' : '-';
        const tzHours = Math.floor(Math.abs(tzOffset) / 60);
        const tzMinutes = Math.abs(tzOffset) % 60;
        result += ` (UTC${tzSign}${tzHours.toString().padStart(2, '0')}:${tzMinutes.toString().padStart(2, '0')})`;
      }

      return result;

    } catch (error) {
      console.error('Error formatting date:', error);
      return String(date);
    }
  };

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  const formatRelative = (
    date: Date | string | number | null | undefined,
    baseDate: Date | string | number = new Date()
  ): string => {
    if (!date) return '-';

    try {
      return dayjs(date).from(dayjs(baseDate));
    } catch (error) {
      console.error('Error formatting relative time:', error);
      return String(date);
    }
  };

  /**
   * Format duration in seconds to human readable format
   */
  const formatDuration = (
    seconds: number,
    options: { compact?: boolean; showMs?: boolean } = {}
  ): string => {
    const { compact = false, showMs = false } = options;

    try {
      const duration = dayjs.duration(seconds * 1000);

      if (compact) {
        if (seconds < 60) {
          return showMs ? `${seconds.toFixed(1)}秒` : `${Math.round(seconds)}秒`;
        } else if (seconds < 3600) {
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = Math.round(seconds % 60);
          return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`;
        } else if (seconds < 86400) {
          const hours = Math.floor(seconds / 3600);
          const remainingMinutes = Math.round((seconds % 3600) / 60);
          return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分` : `${hours}小时`;
        } else {
          const days = Math.floor(seconds / 86400);
          const remainingHours = Math.round((seconds % 86400) / 3600);
          return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
        }
      } else {
        return duration.humanize();
      }
    } catch (error) {
      console.error('Error formatting duration:', error);
      return `${seconds}秒`;
    }
  };

  /**
   * Check if a date is today
   */
  const isToday = (date: Date | string | number): boolean => {
    try {
      return dayjs(date).isSame(dayjs(), 'day');
    } catch (error) {
      return false;
    }
  };

  /**
   * Check if a date is yesterday
   */
  const isYesterday = (date: Date | string | number): boolean => {
    try {
      return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day');
    } catch (error) {
      return false;
    }
  };

  /**
   * Check if a date is this week
   */
  const isThisWeek = (date: Date | string | number): boolean => {
    try {
      return dayjs(date).isSame(dayjs(), 'week');
    } catch (error) {
      return false;
    }
  };

  /**
   * Check if a date is this month
   */
  const isThisMonth = (date: Date | string | number): boolean => {
    try {
      return dayjs(date).isSame(dayjs(), 'month');
    } catch (error) {
      return false;
    }
  };

  /**
   * Check if a date is this year
   */
  const isThisYear = (date: Date | string | number): boolean => {
    try {
      return dayjs(date).isSame(dayjs(), 'year');
    } catch (error) {
      return false;
    }
  };

  /**
   * Format date with smart relative display
   * Shows relative time for recent dates, absolute format for older dates
   */
  const formatSmartDate = (
    date: Date | string | number | null | undefined,
    options: {
      relativeThreshold?: number; // hours
      absoluteFormat?: DateFormatOptions;
    } = {}
  ): string => {
    if (!date) return '-';

    const { relativeThreshold = 24, absoluteFormat } = options;

    try {
      const now = dayjs();
      const targetDate = dayjs(date);
      const hoursDiff = now.diff(targetDate, 'hour');

      // Show relative time for recent dates
      if (hoursDiff < relativeThreshold && hoursDiff > -relativeThreshold) {
        return targetDate.fromNow();
      }

      // Show absolute format for older dates
      return formatDate(date, absoluteFormat);
    } catch (error) {
      console.error('Error formatting smart date:', error);
      return String(date);
    }
  };

  /**
   * Format date range
   */
  const formatDateRange = (
    range: DateRange,
    options: {
      separator?: string;
      format?: DateFormatOptions;
      sameFormat?: boolean;
    } = {}
  ): string => {
    const { separator = ' - ', format = {}, sameFormat = false } = options;

    try {
      const startDate = dayjs(range.start);
      const endDate = dayjs(range.end);

      if (sameFormat || !startDate.isSame(endDate, 'day')) {
        return `${formatDate(range.start, format)}${separator}${formatDate(range.end, format)}`;
      } else {
        // Same day, only show time for end date
        return `${formatDate(range.start, { ...format, type: 'date' })} ${formatDate(range.start, { ...format, type: 'time' })}${separator}${formatDate(range.end, { ...format, type: 'time' })}`;
      }
    } catch (error) {
      console.error('Error formatting date range:', error);
      return `${String(range.start)}${separator}${String(range.end)}`;
    }
  };

  /**
   * Get formatted time ago (short version)
   */
  const getTimeAgo = (
    date: Date | string | number | null | undefined,
    options: { compact?: boolean } = { compact: true }
  ): string => {
    if (!date) return '-';

    try {
      const now = dayjs();
      const targetDate = dayjs(date);
      const secondsDiff = now.diff(targetDate, 'second');

      if (options.compact) {
        if (secondsDiff < 60) return '刚刚';
        if (secondsDiff < 3600) return `${Math.floor(secondsDiff / 60)}分钟前`;
        if (secondsDiff < 86400) return `${Math.floor(secondsDiff / 3600)}小时前`;
        if (secondsDiff < 2592000) return `${Math.floor(secondsDiff / 86400)}天前`;
        if (secondsDiff < 31536000) return `${Math.floor(secondsDiff / 2592000)}个月前`;
        return `${Math.floor(secondsDiff / 31536000)}年前`;
      } else {
        return targetDate.fromNow();
      }
    } catch (error) {
      console.error('Error getting time ago:', error);
      return '-';
    }
  };

  /**
   * Get countdown timer
   */
  const getCountdown = (
    targetDate: Date | string | number,
    options: { showDays?: boolean; showHours?: boolean; showMinutes?: boolean; showSeconds?: boolean } = {}
  ): { days: number; hours: number; minutes: number; seconds: number; formatted: string; expired: boolean } => {
    const { showDays = true, showHours = true, showMinutes = true, showSeconds = true } = options;

    try {
      const now = dayjs();
      const target = dayjs(targetDate);
      const diff = target.diff(now);

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, formatted: '已过期', expired: true };
      }

      const duration = dayjs.duration(diff);
      const days = Math.floor(duration.asDays());
      const hours = duration.hours();
      const minutes = duration.minutes();
      const seconds = duration.seconds();

      const parts: string[] = [];
      if (showDays && days > 0) parts.push(`${days}天`);
      if (showHours && (hours > 0 || days > 0)) parts.push(`${hours}小时`);
      if (showMinutes && (minutes > 0 || hours > 0 || days > 0)) parts.push(`${minutes}分钟`);
      if (showSeconds) parts.push(`${seconds}秒`);

      return {
        days,
        hours,
        minutes,
        seconds,
        formatted: parts.join(' ') || '0秒',
        expired: false,
      };
    } catch (error) {
      console.error('Error getting countdown:', error);
      return { days: 0, hours: 0, minutes: 0, seconds: 0, formatted: '-', expired: true };
    }
  };

  return {
    // State
    currentTimezone: currentTimezone as ComputedRef<string>,

    // Core formatting functions
    formatDate,
    formatRelative,
    formatDuration,
    formatSmartDate,
    formatDateRange,

    // Utility functions
    getTimeAgo,
    getCountdown,

    // Date checking functions
    isToday,
    isYesterday,
    isThisWeek,
    isThisMonth,
    isThisYear,

    // Constants
    formats: DATE_FORMATS,
  };
}

/**
 * Default export
 */
export default useDateFormatting;