/**
 * String Utility - Common string operations and transformations
 * Provides comprehensive string manipulation functions with Unicode support
 */

/**
 * String case conversion options
 */
export interface CaseOptions {
  locale?: string;
  titleCase?: boolean;
  preserveNumbers?: boolean;
  preserveSymbols?: boolean;
}

/**
 * Truncation options
 */
export interface TruncateOptions {
  length: number;
  omission?: string;
  separator?: string | RegExp;
  breakWords?: boolean;
}

/**
 * Slugify options
 */
export interface SlugifyOptions {
  separator?: string;
  lowercase?: boolean;
  strict?: boolean;
  remove?: RegExp;
  replacements?: Record<string, string>;
}

/**
 * Pad options
 */
export interface PadOptions {
  length: number;
  padString?: string;
  padType?: 'left' | 'right' | 'both';
}

/**
 * String utility class
 */
export class StringUtils {
  /**
   * Convert string to camelCase
   *
   * @param str - String to convert
   * @returns CamelCase string
   *
   * @example
   * ```typescript
   * StringUtils.camelCase('hello world'); // 'helloWorld'
   * StringUtils.camelCase('Hello-World'); // 'helloWorld'
   * StringUtils.camelCase('hello_world'); // 'helloWorld'
   * ```
   */
  static camelCase(str: string): string {
    if (!str) return '';

    return str
      .replace(/^[^\w]+|[^\w]+$/g, '')
      .replace(/[^\w]+/g, ' ')
      .replace(/\s+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^\w/, char => char.toLowerCase());
  }

  /**
   * Convert string to PascalCase
   *
   * @param str - String to convert
   * @returns PascalCase string
   *
   * @example
   * ```typescript
   * StringUtils.pascalCase('hello world'); // 'HelloWorld'
   * StringUtils.pascalCase('Hello-World'); // 'HelloWorld'
   * StringUtils.pascalCase('hello_world'); // 'HelloWorld'
   * ```
   */
  static pascalCase(str: string): string {
    const camelCase = this.camelCase(str);
    return camelCase ? camelCase[0].toUpperCase() + camelCase.slice(1) : '';
  }

  /**
   * Convert string to snake_case
   *
   * @param str - String to convert
   * @returns snake_case string
   *
   * @example
   * ```typescript
   * StringUtils.snakeCase('helloWorld'); // 'hello_world'
   * StringUtils.snakeCase('Hello-World'); // 'hello_world'
   * StringUtils.snakeCase('Hello World'); // 'hello_world'
   * ```
   */
  static snakeCase(str: string): string {
    if (!str) return '';

    return str
      .replace(/^[^\w]+|[^\w]+$/g, '')
      .replace(/[^\w]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, '_')
      .toLowerCase();
  }

  /**
   * Convert string to kebab-case
   *
   * @param str - String to convert
   * @returns kebab-case string
   *
   * @example
   * ```typescript
   * StringUtils.kebabCase('helloWorld'); // 'hello-world'
   * StringUtils.kebabCase('Hello-World'); // 'hello-world'
   * StringUtils.kebabCase('Hello World'); // 'hello-world'
   * ```
   */
  static kebabCase(str: string): string {
    if (!str) return '';

    return str
      .replace(/^[^\w]+|[^\w]+$/g, '')
      .replace(/[^\w]+/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  /**
   * Convert string to Title Case
   *
   * @param str - String to convert
   * @param options - Title case options
   * @returns Title case string
   *
   * @example
   * ```typescript
   * StringUtils.titleCase('hello world'); // 'Hello World'
   * StringUtils.titleCase('hello-world', { separator: '-' }); // 'Hello-World'
   * ```
   */
  static titleCase(str: string, options: CaseOptions = {}): string {
    const { locale, preserveNumbers = true, preserveSymbols = true } = options;

    if (!str) return '';

    return str.replace(/\b\w+/g, (match) => {
      // Preserve numbers and symbols if requested
      if (preserveNumbers && /^\d+$/.test(match)) {
        return match;
      }
      if (preserveSymbols && !/^[a-zA-Z]$/.test(match)) {
        return match;
      }
      return locale ? match.toLocaleUpperCase(locale) : match.toUpperCase();
    });
  }

  /**
   * Convert string to sentence case
   *
   * @param str - String to convert
   * @param options - Sentence case options
   * @returns Sentence case string
   *
   * @example
   * ```typescript
   * StringUtils.sentenceCase('hello world. how are you?'); // 'Hello world. How are you?'
   * ```
   */
  static sentenceCase(str: string, options: CaseOptions = {}): string {
    const { locale } = options;

    if (!str) return '';

    return str.replace(/(^\w|\.\s*\w)/g, (match) => {
      return locale ? match.toLocaleUpperCase(locale) : match.toUpperCase();
    });
  }

  /**
   * Capitalize first letter of string
   *
   * @param str - String to capitalize
   * @param options - Capitalization options
   * @returns Capitalized string
   *
   * @example
   * ```typescript
   * StringUtils.capitalize('hello'); // 'Hello'
   * StringUtils.capitalize('hello world', { allWords: true }); // 'Hello World'
   * ```
   */
  static capitalize(str: string, options: { allWords?: boolean; locale?: string } = {}): string {
    const { allWords = false, locale } = options;

    if (!str) return '';

    if (allWords) {
      return str.replace(/\b\w/g, (match) => {
        return locale ? match.toLocaleUpperCase(locale) : match.toUpperCase();
      });
    }

    return str[0].toLocaleUpperCase(locale) + str.slice(1);
  }

  /**
   * Truncate string to specified length
   *
   * @param str - String to truncate
   * @param options - Truncation options
   * @returns Truncated string
   *
   * @example
   * ```typescript
   * StringUtils.truncate('Hello world!', { length: 5 }); // 'Hello...'
   * StringUtils.truncate('Hello world!', { length: 5, omission: ' [...]' }); // 'Hello [...]'
   * StringUtils.truncate('Hello world!', { length: 10, separator: ' ' }); // 'Hello...'
   * ```
   */
  static truncate(str: string, options: TruncateOptions | number): string {
    if (!str) return '';

    const opts = typeof options === 'number' ? { length: options } : options;
    const { length, omission = '...', separator, breakWords = false } = opts;

    if (str.length <= length) {
      return str;
    }

    let truncateAt = length - omission.length;
    if (truncateAt < 0) {
      return omission.slice(0, length);
    }

    let result = str.slice(0, truncateAt);

    if (separator) {
      const sepIndex = typeof separator === 'string'
        ? result.lastIndexOf(separator)
        : -1; // RegExp case not supported with lastIndexOf
      if (sepIndex > -1 && (!breakWords || sepIndex > truncateAt - 3)) {
        result = result.slice(0, sepIndex);
      }
    } else if (!breakWords) {
      const spaceIndex = result.lastIndexOf(' ');
      if (spaceIndex > truncateAt - 3) {
        result = result.slice(0, spaceIndex);
      }
    }

    return result + omission;
  }

  /**
   * Pad string to specified length
   *
   * @param str - String to pad
   * @param options - Padding options
   * @returns Padded string
   *
   * @example
   * ```typescript
   * StringUtils.pad('5', { length: 3 }); // '  5'
   * StringUtils.pad('5', { length: 3, padString: '0', padType: 'left' }); // '005'
   * StringUtils.pad('5', { length: 3, padType: 'both' }); // ' 5 '
   * ```
   */
  static pad(str: string, options: PadOptions | number): string {
    if (!str) return '';

    const opts = typeof options === 'number' ? { length: options } : options;
    const { length, padString = ' ', padType = 'right' } = opts;

    if (str.length >= length) {
      return str;
    }

    const padLength = length - str.length;
    const repeatedPad = padString.repeat(Math.ceil(padLength / padString.length)).slice(0, padLength);

    switch (padType) {
      case 'left':
        return repeatedPad + str;
      case 'both':
        const leftPad = repeatedPad.slice(0, Math.ceil(padLength / 2));
        const rightPad = repeatedPad.slice(Math.ceil(padLength / 2));
        return leftPad + str + rightPad;
      case 'right':
      default:
        return str + repeatedPad;
    }
  }

  /**
   * Create URL-friendly slug from string
   *
   * @param str - String to slugify
   * @param options - Slugify options
   * @returns Slugified string
   *
   * @example
   * ```typescript
   * StringUtils.slugify('Hello World!'); // 'hello-world'
   * StringUtils.slugify('Café au lait', { separator: '_' }); // 'cafe_au_lait'
   * StringUtils.slugify('Hello & World', { strict: true }); // 'hello-world'
   * ```
   */
  static slugify(str: string, options: SlugifyOptions = {}): string {
    const {
      separator = '-',
      lowercase = true,
      strict = false,
      remove,
      replacements = {}
    } = options;

    if (!str) return '';

    let result = str;

    // Apply custom replacements
    for (const [search, replace] of Object.entries(replacements)) {
      result = result.replace(new RegExp(search, 'g'), replace);
    }

    // Convert to string and handle Unicode
    result = result.toString().normalize('NFD');

    // Remove diacritics
    result = result.replace(/[\u0300-\u036f]/g, '');

    // Remove unwanted characters
    if (strict) {
      result = result.replace(/[^a-zA-Z0-9\s-]/g, '');
    }

    // Apply custom removal
    if (remove) {
      result = result.replace(remove, '');
    }

    // Convert to lowercase if requested
    if (lowercase) {
      result = result.toLowerCase();
    }

    // Replace spaces and other separators
    result = result.replace(/[\s_]+/g, separator);

    // Remove multiple consecutive separators
    result = result.replace(new RegExp(`${separator}{2,}`, 'g'), separator);

    // Remove leading/trailing separators
    result = result.replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');

    return result;
  }

  /**
   * Escape HTML special characters
   *
   * @param str - String to escape
   * @returns Escaped string
   *
   * @example
   * ```typescript
   * StringUtils.escapeHtml('<script>alert("xss")</script>');
   * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
   * ```
   */
  static escapeHtml(str: string): string {
    if (!str) return '';

    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return str.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
  }

  /**
   * Unescape HTML special characters
   *
   * @param str - String to unescape
   * @returns Unescaped string
   *
   * @example
   * ```typescript
   * StringUtils.unescapeHtml('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
   * // Returns: '<script>alert("xss")</script>'
   * ```
   */
  static unescapeHtml(str: string): string {
    if (!str) return '';

    const htmlUnescapes: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'"
    };

    return str.replace(/&(?:amp|lt|gt|quot|#39);/g, (match) => htmlUnescapes[match]);
  }

  /**
   * Escape regular expression special characters
   *
   * @param str - String to escape
   * @returns Escaped string
   *
   * @example
   * ```typescript
   * const regex = new RegExp(StringUtils.escapeRegex('[a-z]+'));
   * ```
   */
  static escapeRegex(str: string): string {
    if (!str) return '';

    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Check if string is empty or whitespace only
   *
   * @param str - String to check
   * @returns True if string is empty or whitespace
   *
   * @example
   * ```typescript
   * StringUtils.isEmpty(''); // true
   * StringUtils.isEmpty('   '); // true
   * StringUtils.isEmpty('hello'); // false
   * ```
   */
  static isEmpty(str?: string | null): boolean {
    return !str || str.trim().length === 0;
  }

  /**
   * Check if string is not empty and not whitespace only
   *
   * @param str - String to check
   * @returns True if string is not empty
   *
   * @example
   * ```typescript
   * StringUtils.isNotEmpty(''); // false
   * StringUtils.isNotEmpty('   '); // false
   * StringUtils.isNotEmpty('hello'); // true
   * ```
   */
  static isNotEmpty(str?: string | null): boolean {
    return !this.isEmpty(str);
  }

  /**
   * Check if string contains only whitespace
   *
   * @param str - String to check
   * @returns True if string contains only whitespace
   */
  static isBlank(str?: string | null): boolean {
    return !str || /^\s*$/.test(str);
  }

  /**
   * Reverse a string
   *
   * @param str - String to reverse
   * @returns Reversed string
   *
   * @example
   * ```typescript
   * StringUtils.reverse('hello'); // 'olleh'
   * ```
   */
  static reverse(str: string): string {
    if (!str) return '';

    return str.split('').reverse().join('');
  }

  /**
   * Check if string is a palindrome
   *
   * @param str - String to check
   * @param options - Palindrome options
   * @returns True if string is a palindrome
   *
   * @example
   * ```typescript
   * StringUtils.isPalindrome('racecar'); // true
   * StringUtils.isPalindrome('A man, a plan, a canal: Panama', { ignoreCase: true, ignoreNonAlphanumeric: true }); // true
   * ```
   */
  static isPalindrome(str: string, options: { ignoreCase?: boolean; ignoreNonAlphanumeric?: boolean } = {}): boolean {
    const { ignoreCase = false, ignoreNonAlphanumeric = false } = options;

    if (!str) return false;

    let processed = str;

    if (ignoreNonAlphanumeric) {
      processed = processed.replace(/[^a-zA-Z0-9]/g, '');
    }

    if (ignoreCase) {
      processed = processed.toLowerCase();
    }

    return processed === this.reverse(processed);
  }

  /**
   * Count words in a string
   *
   * @param str - String to count words in
   * @returns Number of words
   *
   * @example
   * ```typescript
   * StringUtils.countWords('Hello world!'); // 2
   * StringUtils.countWords('This   is   a   test'); // 4
   * ```
   */
  static countWords(str: string): number {
    if (!str) return 0;

    // Handle different word separators
    const words = str.trim().split(/\s+/);
    return str.trim() === '' ? 0 : words.length;
  }

  /**
   * Count characters in a string (Unicode-aware)
   *
   * @param str - String to count characters in
   * @param options - Counting options
   * @returns Number of characters
   *
   * @example
   * ```typescript
   * StringUtils.countChars('hello'); // 5
   * StringUtils.countChars('café'); // 4
   * StringUtils.countChars('café', { includeSpaces: false }); // 4
   * StringUtils.countChars('hello world', { includeSpaces: false }); // 10
   * ```
   */
  static countChars(str: string, options: { includeSpaces?: boolean } = {}): number {
    const { includeSpaces = true } = options;

    if (!str) return 0;

    const processed = includeSpaces ? str : str.replace(/\s/g, '');
    return [...processed].length; // Use spread operator for Unicode support
  }

  /**
   * Generate random string
   *
   * @param length - Length of string to generate
   * @param charset - Character set to use
   * @returns Random string
   *
   * @example
   * ```typescript
   * StringUtils.random(10); // 'a1b2c3d4e5'
   * StringUtils.random(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'); // 'X7Y2Z9W1'
   * ```
   */
  static random(length: number, charset: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Generate UUID v4
   *
   * @returns UUID string
   *
   * @example
   * ```typescript
   * StringUtils.uuid(); // '550e8400-e29b-41d4-a716-446655440000'
   * ```
   */
  static uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate random hex string
   *
   * @param length - Length of hex string
   * @returns Hex string
   *
   * @example
   * ```typescript
   * StringUtils.randomHex(8); // 'a1b2c3d4'
   * ```
   */
  static randomHex(length: number): string {
    const hexChars = '0123456789abcdef';
    return this.random(length, hexChars);
  }

  /**
   * Extract numbers from string
   *
   * @param str - String to extract numbers from
   * @param options - Extraction options
   * @returns Array of numbers
   *
   * @example
   * ```typescript
   * StringUtils.extractNumbers('The price is $123.45'); // [123.45]
   * StringUtils.extractNumbers('Call 123-456-7890', { asStrings: true }); // ['123', '456', '7890']
   * ```
   */
  static extractNumbers(str: string, options: { asStrings?: boolean; decimal?: boolean } = {}): (number | string)[] {
    const { asStrings = false, decimal = true } = options;

    if (!str) return [];

    const pattern = decimal ? /-?\d+\.?\d*/g : /-?\d+/g;
    const matches = str.match(pattern) || [];

    return asStrings ? matches : matches.map(Number);
  }

  /**
   * Extract URLs from string
   *
   * @param str - String to extract URLs from
   * @returns Array of URLs
   *
   * @example
   * ```typescript
   * StringUtils.extractUrls('Visit https://example.com and http://test.org');
   * // Returns: ['https://example.com', 'http://test.org']
   * ```
   */
  static extractUrls(str: string): string[] {
    if (!str) return [];

    const urlPattern = /https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?/g;
    return str.match(urlPattern) || [];
  }

  /**
   * Extract email addresses from string
   *
   * @param str - String to extract emails from
   * @returns Array of email addresses
   *
   * @example
   * ```typescript
   * StringUtils.extractEmails('Contact john@example.com or jane@test.org');
   * // Returns: ['john@example.com', 'jane@test.org']
   * ```
   */
  static extractEmails(str: string): string[] {
    if (!str) return [];

    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return str.match(emailPattern) || [];
  }

  /**
   * Format template string with values
   *
   * @param template - Template string with placeholders
   * @param values - Values to replace placeholders
   * @returns Formatted string
   *
   * @example
   * ```typescript
   * StringUtils.template('Hello, {name}! You have {count} messages.', { name: 'John', count: 5 });
   * // Returns: 'Hello, John! You have 5 messages.'
   * ```
   */
  static template(template: string, values: Record<string, any>): string {
    if (!template) return '';

    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return values[key] !== undefined ? String(values[key]) : match;
    });
  }

  /**
   * Check if string contains substring (case-sensitive)
   *
   * @param str - String to search in
   * @param search - Substring to search for
   * @param options - Search options
   * @returns True if substring is found
   *
   * @example
   * ```typescript
   * StringUtils.contains('Hello World', 'world'); // false
   * StringUtils.contains('Hello World', 'world', { ignoreCase: true }); // true
   * ```
   */
  static contains(str: string, search: string, options: { ignoreCase?: boolean } = {}): boolean {
    const { ignoreCase = false } = options;

    if (!str || !search) return false;

    const target = ignoreCase ? str.toLowerCase() : str;
    const substring = ignoreCase ? search.toLowerCase() : search;

    return target.includes(substring);
  }

  /**
   * Check if string starts with substring
   *
   * @param str - String to check
   * @param prefix - Prefix to check for
   * @param options - Search options
   * @returns True if string starts with prefix
   *
   * @example
   * ```typescript
   * StringUtils.startsWith('Hello World', 'Hello'); // true
   * StringUtils.startsWith('hello world', 'Hello', { ignoreCase: true }); // true
   * ```
   */
  static startsWith(str: string, prefix: string, options: { ignoreCase?: boolean } = {}): boolean {
    const { ignoreCase = false } = options;

    if (!str || !prefix) return false;

    const target = ignoreCase ? str.toLowerCase() : str;
    const searchPrefix = ignoreCase ? prefix.toLowerCase() : prefix;

    return target.startsWith(searchPrefix);
  }

  /**
   * Check if string ends with substring
   *
   * @param str - String to check
   * @param suffix - Suffix to check for
   * @param options - Search options
   * @returns True if string ends with suffix
   *
   * @example
   * ```typescript
   * StringUtils.endsWith('Hello World', 'World'); // true
   * StringUtils.endsWith('hello world', 'world', { ignoreCase: true }); // true
   * ```
   */
  static endsWith(str: string, suffix: string, options: { ignoreCase?: boolean } = {}): boolean {
    const { ignoreCase = false } = options;

    if (!str || !suffix) return false;

    const target = ignoreCase ? str.toLowerCase() : str;
    const searchSuffix = ignoreCase ? suffix.toLowerCase() : suffix;

    return target.endsWith(searchSuffix);
  }

  /**
   * Remove all occurrences of substring from string
   *
   * @param str - String to remove from
   * @param remove - Substring to remove
   * @param options - Removal options
   * @returns String with substring removed
   *
   * @example
   * ```typescript
   * StringUtils.removeAll('Hello World World', 'World'); // 'Hello  '
   * StringUtils.removeAll('Hello World World', 'world', { ignoreCase: true }); // 'Hello  '
   * ```
   */
  static removeAll(str: string, remove: string, options: { ignoreCase?: boolean } = {}): string {
    const { ignoreCase = false } = options;

    if (!str || !remove) return str;

    if (ignoreCase) {
      const regex = new RegExp(this.escapeRegex(remove), 'gi');
      return str.replace(regex, '');
    }

    return str.split(remove).join('');
  }

  /**
   * Replace all occurrences of substring with replacement
   *
   * @param str - String to replace in
   * @param search - Substring to search for
   * @param replace - Replacement string
   * @param options - Replacement options
   * @returns String with replacements
   *
   * @example
   * ```typescript
   * StringUtils.replaceAll('Hello World', 'World', 'Universe'); // 'Hello Universe'
   * StringUtils.replaceAll('hello world', 'HELLO', 'Hi', { ignoreCase: true }); // 'Hi world'
   * ```
   */
  static replaceAll(
    str: string,
    search: string,
    replace: string,
    options: { ignoreCase?: boolean } = {}
  ): string {
    const { ignoreCase = false } = options;

    if (!str || !search) return str;

    if (ignoreCase) {
      const regex = new RegExp(this.escapeRegex(search), 'gi');
      return str.replace(regex, replace);
    }

    return str.split(search).join(replace);
  }

  /**
   * Limit string to word boundary
   *
   * @param str - String to limit
   * @param maxLength - Maximum length
   * @param options - Limiting options
   * @returns Limited string
   *
   * @example
   * ```typescript
   * StringUtils.limitWords('Hello world, this is a test', 10); // 'Hello'
   * StringUtils.limitWords('Hello world, this is a test', 15); // 'Hello world'
   * ```
   */
  static limitWords(str: string, maxLength: number, options: { omission?: string } = {}): string {
    const { omission = '...' } = options;

    if (!str || str.length <= maxLength) {
      return str;
    }

    let limited = str.slice(0, maxLength);

    // Find last complete word
    const lastSpace = limited.lastIndexOf(' ');
    if (lastSpace > 0) {
      limited = limited.slice(0, lastSpace);
    }

    return limited + omission;
  }

  /**
   * Convert string to URL-safe Base64
   *
   * @param str - String to encode
   * @returns URL-safe Base64 string
   *
   * @example
   * ```typescript
   * const encoded = StringUtils.toBase64Url('Hello World!');
   * ```
   */
  static toBase64Url(str: string): string {
    if (!str) return '';

    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Decode URL-safe Base64 string
   *
   * @param str - Base64 URL string to decode
   * @returns Decoded string
   *
   * @example
   * ```typescript
   * const decoded = StringUtils.fromBase64Url(encoded);
   * ```
   */
  static fromBase64Url(str: string): string {
    if (!str) return '';

    // Add padding if needed
    const padded = str + '='.repeat((4 - str.length % 4) % 4);

    return atob(padded
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    );
  }

  /**
   * Convert string to hash (simple implementation)
   *
   * @param str - String to hash
   * @returns Hash string
   *
   * @example
   * ```typescript
   * const hash = StringUtils.hash('Hello World');
   * ```
   */
  static hash(str: string): string {
    if (!str) return '';

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Create abbreviations for long strings
   *
   * @param str - String to abbreviate
   * @param options - Abbreviation options
   * @returns Abbreviated string
   *
   * @example
   * ```typescript
   * StringUtils.abbreviate('Hello World', { length: 5 }); // 'He...d'
   * StringUtils.abbreviate('United States of America', { type: 'initials' }); // 'US of A'
   * ```
   */
  static abbreviate(str: string, options: { length?: number; type?: 'truncation' | 'initials' } = {}): string {
    const { length = 10, type = 'truncation' } = options;

    if (!str || str.length <= length) {
      return str;
    }

    if (type === 'initials') {
      return str
        .split(' ')
        .map(word => word[0])
        .join('');
    }

    // Truncation type
    const halfLength = Math.floor((length - 3) / 2);
    const start = str.slice(0, halfLength);
    const end = str.slice(-halfLength);

    return `${start}...${end}`;
  }
}

// Create convenience exports
export const string = {
  camelCase: StringUtils.camelCase,
  pascalCase: StringUtils.pascalCase,
  snakeCase: StringUtils.snakeCase,
  kebabCase: StringUtils.kebabCase,
  titleCase: StringUtils.titleCase,
  sentenceCase: StringUtils.sentenceCase,
  capitalize: StringUtils.capitalize,
  truncate: StringUtils.truncate,
  pad: StringUtils.pad,
  slugify: StringUtils.slugify,
  escapeHtml: StringUtils.escapeHtml,
  unescapeHtml: StringUtils.unescapeHtml,
  escapeRegex: StringUtils.escapeRegex,
  isEmpty: StringUtils.isEmpty,
  isNotEmpty: StringUtils.isNotEmpty,
  isBlank: StringUtils.isBlank,
  reverse: StringUtils.reverse,
  isPalindrome: StringUtils.isPalindrome,
  countWords: StringUtils.countWords,
  countChars: StringUtils.countChars,
  random: StringUtils.random,
  uuid: StringUtils.uuid,
  randomHex: StringUtils.randomHex,
  extractNumbers: StringUtils.extractNumbers,
  extractUrls: StringUtils.extractUrls,
  extractEmails: StringUtils.extractEmails,
  template: StringUtils.template,
  contains: StringUtils.contains,
  startsWith: StringUtils.startsWith,
  endsWith: StringUtils.endsWith,
  removeAll: StringUtils.removeAll,
  replaceAll: StringUtils.replaceAll,
  limitWords: StringUtils.limitWords,
  toBase64Url: StringUtils.toBase64Url,
  fromBase64Url: StringUtils.fromBase64Url,
  hash: StringUtils.hash,
  abbreviate: StringUtils.abbreviate
};

// Export default
export default StringUtils;

/**
 * Example usage:
 *
 * ```typescript
 * import { StringUtils, string } from '@/utils/string';
 *
 * // Case conversions
 * const camelCase = string.camelCase('hello world');
 * const snakeCase = string.snakeCase('helloWorld');
 * const titleCase = string.titleCase('hello world');
 *
 * // String manipulation
 * const truncated = string.truncate('This is a very long string', { length: 10 });
 * const slug = string.slugify('Hello World! This is a test');
 * const padded = string.pad('5', { length: 3, padString: '0' });
 *
 * // Search and replace
 * const contains = string.contains('Hello World', 'world', { ignoreCase: true });
 * const replaced = string.replaceAll('Hello World World', 'World', 'Universe');
 *
 * // Extraction
 * const emails = string.extractEmails('Contact john@example.com or jane@test.org');
 * const numbers = string.extractNumbers('Call 123-456-7890');
 *
 * // Utility functions
 * const uuid = string.uuid();
 * const random = string.random(10);
 * const wordCount = string.countWords('This is a test string');
 * ```
 */