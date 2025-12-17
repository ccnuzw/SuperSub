/**
 * Format Utility - Common formatting functions for currency, numbers, dates, file sizes, etc.
 * Provides consistent and localized formatting for various data types
 */

/**
 * Currency formatting options
 */
export interface CurrencyOptions {
  locale?: string;
  currency?: string;
  style?: 'currency' | 'decimal' | 'percent';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
  currencyDisplay?: 'symbol' | 'code' | 'name';
  compact?: boolean;
}

/**
 * Number formatting options
 */
export interface NumberOptions {
  locale?: string;
  style?: 'decimal' | 'currency' | 'percent' | 'unit';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  minimumIntegerDigits?: number;
  useGrouping?: boolean;
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
  compactDisplay?: 'short' | 'long';
  unit?: string;
  unitDisplay?: 'short' | 'long' | 'narrow';
}

/**
 * Date formatting options
 */
export interface DateOptions {
  locale?: string;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  timeZone?: string;
  hour12?: boolean;
  weekday?: 'long' | 'short' | 'narrow';
  era?: 'long' | 'short' | 'narrow';
  timeZoneName?: 'long' | 'short';
  formatString?: string;
}

/**
 * File size formatting options
 */
export interface FileSizeOptions {
  locale?: string;
  decimalPlaces?: number;
  separator?: string;
  useBinary?: boolean;
  unit?: 'auto' | 'B' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB';
}

/**
 * Duration formatting options
 */
export interface DurationOptions {
  format?: 'short' | 'long' | 'full';
  units?: ('years' | 'months' | 'weeks' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds')[];
  maxUnits?: number;
  separator?: string;
  conjunction?: string;
  locale?: string;
}

/**
 * Relative time formatting options
 */
export interface RelativeTimeOptions {
  locale?: string;
  style?: 'long' | 'short' | 'narrow';
  numeric?: 'always' | 'auto';
  roundThreshold?: number; // seconds
}

/**
 * Phone number formatting options
 */
export interface PhoneOptions {
  locale?: string;
  format?: 'E164' | 'INTERNATIONAL' | 'NATIONAL' | 'RFC3966';
  includeCountryCode?: boolean;
}

/**
 * Format utility class
 */
export class FormatUtils {
  /**
   * Format currency value
   *
   * @param value - Numeric value to format
   * @param options - Formatting options
   * @returns Formatted currency string
   *
   * @example
   * ```typescript
   * FormatUtils.currency(1234.56); // "$1,234.56"
   * FormatUtils.currency(1234.56, { locale: 'en-GB', currency: 'GBP' }); // "£1,234.56"
   * FormatUtils.currency(1234.56, { compact: true }); // "$1.2K"
   * ```
   */
  static currency(value: number, options: CurrencyOptions = {}): string {
    const {
      locale = 'en-US',
      currency = 'USD',
      style = 'currency',
      minimumFractionDigits = 2,
      maximumFractionDigits = 2,
      useGrouping = true,
      currencyDisplay = 'symbol',
      compact = false
    } = options;

    if (isNaN(value) || !isFinite(value)) {
      return 'Invalid number';
    }

    try {
      // Handle compact notation
      if (compact && Math.abs(value) >= 1000) {
        const compactValue = value / 1000;
        const formatter = new Intl.NumberFormat(locale, {
          style,
          currency,
          minimumFractionDigits: compactValue % 1 === 0 ? 0 : 1,
          maximumFractionDigits: 1,
          useGrouping,
          currencyDisplay,
          notation: 'compact',
          compactDisplay: 'short'
        });
        return formatter.format(value);
      }

      const formatter = new Intl.NumberFormat(locale, {
        style,
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping,
        currencyDisplay
      });

      return formatter.format(value);
    } catch (error) {
      console.warn('Currency formatting failed:', error);
      // Fallback
      return `${currency === 'USD' ? '$' : currency} ${value.toFixed(minimumFractionDigits)}`;
    }
  }

  /**
   * Format number with locale-specific formatting
   *
   * @param value - Numeric value to format
   * @param options - Formatting options
   * @returns Formatted number string
   *
   * @example
   * ```typescript
   * FormatUtils.number(1234.567); // "1,234.567"
   * FormatUtils.number(1234.567, { locale: 'de-DE' }); // "1.234,567"
   * FormatUtils.number(0.75, { style: 'percent' }); // "75%"
   * FormatUtils.number(1234, { notation: 'compact' }); // "1.2K"
   * ```
   */
  static number(value: number, options: NumberOptions = {}): string {
    const {
      locale = 'en-US',
      style = 'decimal',
      minimumFractionDigits,
      maximumFractionDigits,
      minimumIntegerDigits,
      useGrouping = true,
      notation = 'standard',
      compactDisplay = 'short',
      unit,
      unitDisplay = 'short'
    } = options;

    if (isNaN(value) || !isFinite(value)) {
      return 'Invalid number';
    }

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style,
        minimumFractionDigits,
        maximumFractionDigits,
        minimumIntegerDigits,
        useGrouping,
        notation,
        compactDisplay,
        unit,
        unitDisplay
      });

      return formatter.format(value);
    } catch (error) {
      console.warn('Number formatting failed:', error);
      // Fallback
      return value.toString();
    }
  }

  /**
   * Format date with various styles
   *
   * @param date - Date to format
   * @param options - Formatting options
   * @returns Formatted date string
   *
   * @example
   * ```typescript
   * FormatUtils.date(new Date()); // "12/17/2023"
   * FormatUtils.date(new Date(), { dateStyle: 'long' }); // "December 17, 2023"
   * FormatUtils.date(new Date(), {
   *   dateStyle: 'medium',
   *   timeStyle: 'short'
   * }); // "Dec 17, 2023, 2:30 PM"
   * FormatUtils.date(new Date(), {
   *   formatString: 'yyyy-MM-dd HH:mm:ss'
   * }); // "2023-12-17 14:30:00"
   * ```
   */
  static date(date: Date | string | number, options: DateOptions = {}): string {
    const {
      locale = 'en-US',
      dateStyle,
      timeStyle,
      formatString,
      ...intlOptions
    } = options;

    try {
      // Convert to Date object
      const dateObj = typeof date === 'string' || typeof date === 'number'
        ? new Date(date)
        : date;

      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }

      // Custom format string
      if (formatString) {
        return this.formatDateWithPattern(dateObj, formatString);
      }

      // Use Intl.DateTimeFormat
      if (dateStyle || timeStyle || Object.keys(intlOptions).length > 0) {
        const formatter = new Intl.DateTimeFormat(locale, {
          dateStyle,
          timeStyle,
          ...intlOptions
        });
        return formatter.format(dateObj);
      }

      // Default formatting
      const formatter = new Intl.DateTimeFormat(locale);
      return formatter.format(dateObj);
    } catch (error) {
      console.warn('Date formatting failed:', error);
      // Fallback
      return date.toString();
    }
  }

  /**
   * Format file size in human-readable format
   *
   * @param bytes - Size in bytes
   * @param options - Formatting options
   * @returns Formatted file size string
   *
   * @example
   * ```typescript
   * FormatUtils.fileSize(1024); // "1 KB"
   * FormatUtils.fileSize(1536, { decimalPlaces: 2 }); // "1.5 KB"
   * FormatUtils.fileSize(1073741824, { useBinary: true }); // "1 GiB"
   * FormatUtils.fileSize(1024, { unit: 'MB' }); // "0 MB"
   * ```
   */
  static fileSize(bytes: number, options: FileSizeOptions = {}): string {
    const {
      locale = 'en-US',
      decimalPlaces = 1,
      separator = ' ',
      useBinary = false,
      unit = 'auto'
    } = options;

    if (isNaN(bytes) || bytes < 0) {
      return 'Invalid size';
    }

    const units = useBinary
      ? ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
      : ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

    const threshold = useBinary ? 1024 : 1000;
    let size = bytes;
    let unitIndex = 0;

    if (unit !== 'auto') {
      unitIndex = units.indexOf(unit);
      if (unitIndex === -1) {
        unitIndex = 0;
      }
      size = bytes / Math.pow(threshold, unitIndex);
    } else {
      while (size >= threshold && unitIndex < units.length - 1) {
        size /= threshold;
        unitIndex++;
      }
    }

    try {
      const formatter = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimalPlaces
      });

      const formattedSize = formatter.format(size);
      return `${formattedSize}${separator}${units[unitIndex]}`;
    } catch (error) {
      console.warn('File size formatting failed:', error);
      // Fallback
      return `${size.toFixed(decimalPlaces)} ${units[unitIndex]}`;
    }
  }

  /**
   * Format duration in human-readable format
   *
   * @param milliseconds - Duration in milliseconds
   * @param options - Formatting options
   * @returns Formatted duration string
   *
   * @example
   * ```typescript
   * FormatUtils.duration(90000); // "1m 30s"
   * FormatUtils.duration(90000, { format: 'long' }); // "1 minute, 30 seconds"
   * FormatUtils.duration(90000, { format: 'full' }); // "1 minute, 30 seconds"
   * FormatUtils.duration(90000, { maxUnits: 1 }); // "1m"
   * ```
   */
  static duration(milliseconds: number, options: DurationOptions = {}): string {
    const {
      format = 'short',
      units = ['days', 'hours', 'minutes', 'seconds'],
      maxUnits = 2,
      separator = format === 'short' ? ' ' : ', ',
      conjunction = format === 'full' ? ' and ' : '',
      locale = 'en-US'
    } = options;

    if (isNaN(milliseconds) || milliseconds < 0) {
      return 'Invalid duration';
    }

    const duration: Record<string, number> = {
      years: Math.floor(milliseconds / (365 * 24 * 60 * 60 * 1000)),
      months: Math.floor(milliseconds / (30 * 24 * 60 * 60 * 1000)),
      weeks: Math.floor(milliseconds / (7 * 24 * 60 * 60 * 1000)),
      days: Math.floor(milliseconds / (24 * 60 * 60 * 1000)),
      hours: Math.floor(milliseconds / (60 * 60 * 1000) % 24),
      minutes: Math.floor(milliseconds / (60 * 1000) % 60),
      seconds: Math.floor(milliseconds / 1000 % 60),
      milliseconds: milliseconds % 1000
    };

    const unitFormatters: Record<string, Record<string, string>> = {
      short: {
        years: 'y', months: 'mo', weeks: 'w', days: 'd',
        hours: 'h', minutes: 'm', seconds: 's', milliseconds: 'ms'
      },
      long: {
        years: ' year', months: ' month', weeks: ' week', days: ' day',
        hours: ' hour', minutes: ' minute', seconds: ' second', milliseconds: ' millisecond'
      },
      full: {
        years: ' year', months: ' month', weeks: ' week', days: ' day',
        hours: ' hour', minutes: ' minute', seconds: ' second', milliseconds: ' millisecond'
      }
    };

    const parts: string[] = [];
    let addedUnits = 0;

    for (const unit of units) {
      const value = duration[unit];
      if (value > 0 && addedUnits < maxUnits) {
        const suffix = unitFormatters[format][unit];
        const pluralizedSuffix = format !== 'short' && value !== 1 ? suffix + 's' : suffix;
        parts.push(`${value}${format === 'short' ? suffix : separator + pluralizedSuffix}`);
        addedUnits++;
      }
    }

    if (parts.length === 0) {
      return `0${format === 'short' ? 's' : ' seconds'}`;
    }

    if (format === 'full' && parts.length > 1) {
      const last = parts.pop()!;
      return parts.join(separator) + conjunction + last;
    }

    return parts.join(separator);
  }

  /**
   * Format relative time (e.g., "2 hours ago", "in 3 days")
   *
   * @param date - Date to format relative to now
   * @param options - Formatting options
   * @returns Formatted relative time string
   *
   * @example
   * ```typescript
   * FormatUtils.relativeTime(new Date(Date.now() - 3600000)); // "1 hour ago"
   * FormatUtils.relativeTime(new Date(Date.now() + 86400000)); // "in 1 day"
   * FormatUtils.relativeTime(new Date(), { style: 'short' }); // "now"
   * ```
   */
  static relativeTime(date: Date | string | number, options: RelativeTimeOptions = {}): string {
    const {
      locale = 'en-US',
      style = 'long',
      numeric = 'auto',
      roundThreshold = 30
    } = options;

    try {
      const dateObj = typeof date === 'string' || typeof date === 'number'
        ? new Date(date)
        : date;

      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }

      const now = new Date();
      const diffMs = dateObj.getTime() - now.getTime();
      const diffSeconds = Math.round(diffMs / 1000);
      const diffMinutes = Math.round(diffSeconds / 60);
      const diffHours = Math.round(diffMinutes / 60);
      const diffDays = Math.round(diffHours / 24);
      const diffWeeks = Math.round(diffDays / 7);
      const diffMonths = Math.round(diffDays / 30);
      const diffYears = Math.round(diffDays / 365);

      // Use Intl.RelativeTimeFormat for proper localization
      const rtf = new Intl.RelativeTimeFormat(locale, { style, numeric });

      // Handle "now" case
      if (Math.abs(diffSeconds) < roundThreshold) {
        return numeric === 'always' ? rtf.format(0, 'second') : 'now';
      }

      // Choose appropriate unit and value
      let unit: Intl.RelativeTimeFormatUnit;
      let value: number;

      if (Math.abs(diffSeconds) < 60) {
        unit = 'second';
        value = diffSeconds;
      } else if (Math.abs(diffMinutes) < 60) {
        unit = 'minute';
        value = diffMinutes;
      } else if (Math.abs(diffHours) < 24) {
        unit = 'hour';
        value = diffHours;
      } else if (Math.abs(diffDays) < 7) {
        unit = 'day';
        value = diffDays;
      } else if (Math.abs(diffWeeks) < 4) {
        unit = 'week';
        value = diffWeeks;
      } else if (Math.abs(diffMonths) < 12) {
        unit = 'month';
        value = diffMonths;
      } else {
        unit = 'year';
        value = diffYears;
      }

      return rtf.format(value, unit);
    } catch (error) {
      console.warn('Relative time formatting failed:', error);
      // Fallback
      return date.toString();
    }
  }

  /**
   * Format percentage
   *
   * @param value - Value between 0 and 1
   * @param options - Formatting options
   * @returns Formatted percentage string
   *
   * @example
   * ```typescript
   * FormatUtils.percentage(0.75); // "75%"
   * FormatUtils.percentage(0.7567, { decimalPlaces: 1 }); // "75.7%"
   * FormatUtils.percentage(-0.25, { showSign: true }); // "-25%"
   * ```
   */
  static percentage(
    value: number,
    options: {
      locale?: string;
      decimalPlaces?: number;
      showSign?: boolean;
      style?: 'percent' | 'fraction';
    } = {}
  ): string {
    const {
      locale = 'en-US',
      decimalPlaces,
      showSign = false,
      style = 'percent'
    } = options;

    if (isNaN(value) || !isFinite(value)) {
      return 'Invalid value';
    }

    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: style as any,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
        signDisplay: showSign ? 'always' : 'auto'
      });

      return formatter.format(value);
    } catch (error) {
      console.warn('Percentage formatting failed:', error);
      // Fallback
      const percentage = (value * 100).toFixed(decimalPlaces || 0);
      const sign = showSign && value >= 0 ? '+' : '';
      return `${sign}${percentage}%`;
    }
  }

  /**
   * Format phone number
   *
   * @param phoneNumber - Phone number string
   * @param options - Formatting options
   * @returns Formatted phone number
   *
   * @example
   * ```typescript
   * FormatUtils.phone('1234567890', { format: 'E164' }); // "+11234567890"
   * FormatUtils.phone('1234567890', { format: 'INTERNATIONAL' }); // "+1 123-456-7890"
   * FormatUtils.phone('1234567890', { format: 'NATIONAL' }); // "(123) 456-7890"
   * ```
   */
  static phone(phoneNumber: string, options: PhoneOptions = {}): string {
    const { format = 'NATIONAL', includeCountryCode = false } = options;

    if (!phoneNumber) {
      return '';
    }

    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');

    try {
      switch (format) {
        case 'E164':
          // E.164 format: +[countrycode][number]
          return `+${digits}`;

        case 'RFC3966':
          // RFC3966 format: tel:+[countrycode][number]
          return `tel:+${digits}`;

        case 'INTERNATIONAL':
          // International format: +[countrycode] [area] [number]
          if (digits.length === 11 && digits.startsWith('1')) {
            const country = digits.slice(0, 1);
            const area = digits.slice(1, 4);
            const prefix = digits.slice(4, 7);
            const line = digits.slice(7);
            return `+${country} ${area}-${prefix}-${line}`;
          }
          return `+${digits}`;

        case 'NATIONAL':
        default:
          // National format: (area) prefix-number
          if (digits.length === 10) {
            const area = digits.slice(0, 3);
            const prefix = digits.slice(3, 6);
            const line = digits.slice(6);
            return `(${area}) ${prefix}-${line}`;
          } else if (digits.length === 11 && digits.startsWith('1')) {
            const area = digits.slice(1, 4);
            const prefix = digits.slice(4, 7);
            const line = digits.slice(7);
            return `(${area}) ${prefix}-${line}`;
          }
          return digits;
      }
    } catch (error) {
      console.warn('Phone formatting failed:', error);
      return phoneNumber;
    }
  }

  /**
   * Format text with template variables
   *
   * @param template - Template string with variables
   * @param variables - Object with variable values
   * @returns Formatted string
   *
   * @example
   * ```typescript
   * FormatUtils.template('Hello, {name}! Today is {day}.', {
   *   name: 'John',
   *   day: 'Monday'
   * }); // "Hello, John! Today is Monday."
   * ```
   */
  static template(template: string, variables: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      const value = variables[key];
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Format list of items
   *
   * @param items - Array of items to format
   * @param options - Formatting options
   * @returns Formatted list string
   *
   * @example
   * ```typescript
   * FormatUtils.list(['apple', 'banana', 'orange']); // "apple, banana, and orange"
   * FormatUtils.list(['apple', 'banana'], { type: 'or' }); // "apple or banana"
   * FormatUtils.list(['apple'], { length: 1 }); // "apple"
   * ```
   */
  static list(
    items: string[],
    options: {
      type?: 'and' | 'or';
      length?: 'short' | 'long' | 'narrow';
      locale?: string;
    } = {}
  ): string {
    const { type = 'and', length = 'long', locale = 'en-US' } = options;

    if (items.length === 0) {
      return '';
    }

    if (items.length === 1) {
      return items[0];
    }

    try {
      // Use Intl.ListFormat for proper localization
      const listFormat = new Intl.ListFormat(locale, {
        style: length,
        type: type === 'or' ? 'disjunction' : 'conjunction'
      });
      return listFormat.format(items);
    } catch (error) {
      console.warn('List formatting failed:', error);
      // Fallback
      if (items.length === 2) {
        return `${items[0]} ${type === 'or' ? 'or' : 'and'} ${items[1]}`;
      }
      return items.slice(0, -1).join(', ') + `, ${type === 'or' ? 'or' : 'and'} ${items[items.length - 1]}`;
    }
  }

  /**
   * Format date with custom pattern
   *
   * @param date - Date object
   * @param pattern - Format pattern
   * @returns Formatted date string
   */
  private static formatDateWithPattern(date: Date, pattern: string): string {
    const map: Record<string, string> = {
      'yyyy': date.getFullYear().toString(),
      'yy': date.getFullYear().toString().slice(-2),
      'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
      'M': (date.getMonth() + 1).toString(),
      'dd': date.getDate().toString().padStart(2, '0'),
      'd': date.getDate().toString(),
      'HH': date.getHours().toString().padStart(2, '0'),
      'H': date.getHours().toString(),
      'mm': date.getMinutes().toString().padStart(2, '0'),
      'm': date.getMinutes().toString(),
      'ss': date.getSeconds().toString().padStart(2, '0'),
      's': date.getSeconds().toString(),
      'SSS': date.getMilliseconds().toString().padStart(3, '0'),
    };

    let result = pattern;
    for (const [key, value] of Object.entries(map)) {
      result = result.replace(new RegExp(key, 'g'), value);
    }

    return result;
  }
}

// Create convenience exports
export const format = {
  currency: FormatUtils.currency,
  number: FormatUtils.number,
  date: FormatUtils.date,
  fileSize: FormatUtils.fileSize,
  duration: FormatUtils.duration,
  relativeTime: FormatUtils.relativeTime,
  percentage: FormatUtils.percentage,
  phone: FormatUtils.phone,
  template: FormatUtils.template,
  list: FormatUtils.list
};

// Export default
export default FormatUtils;

/**
 * Example usage:
 *
 * ```typescript
 * import { FormatUtils, format } from '@/utils/format';
 *
 * // Direct usage
 * const price = FormatUtils.currency(1234.56, { currency: 'EUR' });
 * const fileSize = FormatUtils.fileSize(1024 * 1024 * 2.5);
 * const relativeTime = FormatUtils.relativeTime(new Date(Date.now() - 3600000));
 *
 * // Using convenience object
 * const formattedDate = format.date(new Date(), { dateStyle: 'long' });
 * const formattedNumber = format.number(1234567, { notation: 'compact' });
 * const formattedDuration = format.duration(90000, { format: 'long' });
 *
 * // Advanced usage
 * const template = format.template('Hello, {name}!', { name: 'John' });
 * const list = format.list(['apple', 'banana', 'orange'], { type: 'or' });
 * const percentage = format.percentage(0.75, { decimalPlaces: 1 });
 * ```
 */