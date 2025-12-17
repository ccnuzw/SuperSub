/**
 * URL Utility - URL manipulation, query parameter handling, domain validation
 * Provides comprehensive URL parsing, building, and validation functionality
 */

/**
 * URL parsing options
 */
export interface UrlParseOptions {
  parseQuery?: boolean;
  parseFragment?: boolean;
  decodeComponents?: boolean;
  strictMode?: boolean;
}

/**
 * URL building options
 */
export interface UrlBuildOptions {
  encodeComponents?: boolean;
  includeFragment?: boolean;
  sortQuery?: boolean;
}

/**
 * Query parameter manipulation options
 */
export interface QueryOptions {
  encode?: boolean;
  arrayFormat?: 'bracket' | 'index' | 'comma' | 'separator' | 'none';
  arraySeparator?: string;
  skipNulls?: boolean;
  skipEmpty?: boolean;
}

/**
 * Domain validation options
 */
export interface DomainValidationOptions {
  allowSubdomains?: boolean;
  allowWildcard?: boolean;
  allowedTlds?: string[];
  blacklistedDomains?: string[];
  requireTld?: boolean;
}

/**
 * Parsed URL interface
 */
export interface ParsedUrl {
  protocol?: string;
  auth?: string;
  hostname?: string;
  port?: string;
  pathname?: string;
  query?: Record<string, any>;
  fragment?: string;
  origin?: string;
  search?: string;
  hash?: string;
}

/**
 * URL utility class
 */
export class UrlUtils {
  /**
   * Parse URL into components
   *
   * @param url - URL to parse
   * @param options - Parsing options
   * @returns Parsed URL object
   *
   * @example
   * ```typescript
   * const parsed = UrlUtils.parse('https://user:pass@example.com:8080/path?query=value#fragment');
   * // Returns: {
   * //   protocol: 'https:',
   * //   auth: 'user:pass',
   * //   hostname: 'example.com',
   * //   port: '8080',
   * //   pathname: '/path',
   * //   query: { query: 'value' },
   * //   fragment: 'fragment',
   * //   origin: 'https://example.com:8080',
   * //   search: '?query=value',
   * //   hash: '#fragment'
   * // }
   * ```
   */
  static parse(url: string, options: UrlParseOptions = {}): ParsedUrl {
    const {
      parseQuery = true,
      parseFragment = true,
      decodeComponents = true,
      strictMode = false
    } = options;

    try {
      // Use native URL API if available
      if (typeof URL !== 'undefined') {
        const urlObj = new URL(url, strictMode ? undefined : 'http://example.com');

        const result: ParsedUrl = {
          protocol: urlObj.protocol,
          hostname: urlObj.hostname,
          port: urlObj.port,
          pathname: urlObj.pathname,
          origin: urlObj.origin,
          search: urlObj.search,
          hash: urlObj.hash
        };

        if (urlObj.username || urlObj.password) {
          result.auth = urlObj.username ? (urlObj.password ? `${urlObj.username}:${urlObj.password}` : urlObj.username) : urlObj.password;
        }

        if (parseQuery && urlObj.search) {
          result.query = this.parseQuery(urlObj.search.substring(1));
        }

        if (parseFragment && urlObj.hash) {
          result.fragment = urlObj.hash.substring(1);
        }

        return result;
      }

      // Fallback for environments without URL API
      return this.parseUrlFallback(url, options);
    } catch (error) {
      console.warn('URL parsing failed:', error);
      return {};
    }
  }

  /**
   * Build URL from components
   *
   * @param components - URL components
   * @param options - Building options
   * @returns Built URL string
   *
   * @example
   * ```typescript
   * const url = UrlUtils.build({
   *   protocol: 'https:',
   *   hostname: 'example.com',
   *   pathname: '/path',
   *   query: { param: 'value' }
   * }); // "https://example.com/path?param=value"
   * ```
   */
  static build(components: Partial<ParsedUrl>, options: UrlBuildOptions = {}): string {
    const {
      encodeComponents = true,
      includeFragment = true,
      sortQuery = false
    } = options;

    let url = '';

    // Protocol
    if (components.protocol) {
      url += components.protocol;
      if (!components.protocol.endsWith(':')) {
        url += ':';
      }
      if (!components.protocol.endsWith('//')) {
        url += '//';
      }
    }

    // Auth
    if (components.auth) {
      url += `${components.auth}@`;
    }

    // Hostname
    if (components.hostname) {
      url += components.hostname;
    }

    // Port
    if (components.port) {
      url += `:${components.port}`;
    }

    // Pathname
    if (components.pathname) {
      const pathname = encodeComponents ? encodeURIComponent(components.pathname) : components.pathname;
      url += pathname.startsWith('/') ? pathname : `/${pathname}`;
    }

    // Query
    if (components.query && Object.keys(components.query).length > 0) {
      let queryObj = components.query;
      if (sortQuery) {
        queryObj = this.sortObjectKeys(queryObj);
      }
      url += `?${this.buildQuery(queryObj)}`;
    }

    // Fragment
    if (includeFragment && components.fragment) {
      const fragment = encodeComponents ? encodeURIComponent(components.fragment) : components.fragment;
      url += `#${fragment}`;
    }

    return url;
  }

  /**
   * Parse query string into object
   *
   * @param queryString - Query string to parse
   * @param options - Query parsing options
   * @returns Parsed query object
   *
   * @example
   * ```typescript
   * const query = UrlUtils.parseQuery('name=John&age=30&tags=a&tags=b');
   * // Returns: { name: 'John', age: '30', tags: ['a', 'b'] }
   * ```
   */
  static parseQuery(queryString: string, options: QueryOptions = {}): Record<string, any> {
    const {
      encode = true,
      arrayFormat = 'bracket',
      arraySeparator = ',',
      skipNulls = false,
      skipEmpty = false
    } = options;

    if (!queryString) {
      return {};
    }

    const result: Record<string, any> = {};
    const pairs = queryString.split('&');

    for (const pair of pairs) {
      let [key, value] = pair.split('=', 2);

      if (!key) continue;

      key = encode ? decodeURIComponent(key) : key;
      value = value === undefined ? '' : (encode ? decodeURIComponent(value) : value);

      // Skip nulls and empty values if requested
      if (skipNulls && value === null) continue;
      if (skipEmpty && value === '') continue;

      // Handle array values based on format
      if (arrayFormat !== 'none' && (key.endsWith('[]') || key.endsWith('[0]'))) {
        const baseKey = key.replace(/\[\]|\[0]$/, '');
        if (!result[baseKey]) {
          result[baseKey] = [];
        }
        result[baseKey].push(value);
        continue;
      }

      // Handle bracket notation arrays
      if (arrayFormat === 'bracket' && key.includes('[') && key.includes(']')) {
        const [baseKey, index] = key.split(/\[|\]/).filter(Boolean);
        if (!result[baseKey]) {
          result[baseKey] = [];
        }
        if (index !== undefined) {
          result[baseKey][parseInt(index)] = value;
        } else {
          result[baseKey].push(value);
        }
        continue;
      }

      // Handle comma-separated arrays
      if (arrayFormat === 'comma' && value.includes(arraySeparator)) {
        result[key] = value.split(arraySeparator).map(v => v.trim());
        continue;
      }

      // Handle existing keys
      if (result[key] !== undefined) {
        if (Array.isArray(result[key])) {
          result[key].push(value);
        } else {
          result[key] = [result[key], value];
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Build query string from object
   *
   * @param query - Query object
   * @param options - Query building options
   * @returns Query string
   *
   * @example
   * ```typescript
   * const query = UrlUtils.buildQuery({
   *   name: 'John',
   *   age: 30,
   *   tags: ['a', 'b']
   * }); // "name=John&age=30&tags=a&tags=b"
   * ```
   */
  static buildQuery(query: Record<string, any>, options: QueryOptions = {}): string {
    const {
      encode = true,
      arrayFormat = 'bracket',
      arraySeparator = ',',
      skipNulls = false,
      skipEmpty = false
    } = options;

    const pairs: string[] = [];

    for (const [key, value] of Object.entries(query)) {
      if (skipNulls && (value === null || value === undefined)) continue;
      if (skipEmpty && value === '') continue;

      if (Array.isArray(value)) {
        if (arrayFormat === 'bracket') {
          for (const item of value) {
            const encodedKey = encode ? encodeURIComponent(`${key}[]`) : `${key}[]`;
            const encodedValue = encode ? encodeURIComponent(String(item)) : String(item);
            pairs.push(`${encodedKey}=${encodedValue}`);
          }
        } else if (arrayFormat === 'index') {
          value.forEach((item, index) => {
            const encodedKey = encode ? encodeURIComponent(`${key}[${index}]`) : `${key}[${index}]`;
            const encodedValue = encode ? encodeURIComponent(String(item)) : String(item);
            pairs.push(`${encodedKey}=${encodedValue}`);
          });
        } else if (arrayFormat === 'comma') {
          const encodedKey = encode ? encodeURIComponent(key) : key;
          const encodedValue = encode ? encodeURIComponent(value.join(arraySeparator)) : value.join(arraySeparator);
          pairs.push(`${encodedKey}=${encodedValue}`);
        } else if (arrayFormat === 'separator') {
          const encodedKey = encode ? encodeURIComponent(key) : key;
          const encodedValue = encode ? encodeURIComponent(value.join(arraySeparator)) : value.join(arraySeparator);
          pairs.push(`${encodedKey}=${encodedValue}`);
        } else { // 'none'
          value.forEach(item => {
            const encodedKey = encode ? encodeURIComponent(key) : key;
            const encodedValue = encode ? encodeURIComponent(String(item)) : String(item);
            pairs.push(`${encodedKey}=${encodedValue}`);
          });
        }
      } else if (typeof value === 'object') {
        // Handle nested objects
        const nestedQuery = this.buildNestedQuery(key, value, encode);
        if (nestedQuery) {
          pairs.push(nestedQuery);
        }
      } else {
        const encodedKey = encode ? encodeURIComponent(key) : key;
        const encodedValue = encode ? encodeURIComponent(String(value)) : String(value);
        pairs.push(`${encodedKey}=${encodedValue}`);
      }
    }

    return pairs.join('&');
  }

  /**
   * Update query parameters in URL
   *
   * @param url - Base URL
   * @param updates - Query parameter updates
   * @param options - Update options
   * @returns Updated URL
   *
   * @example
   * ```typescript
   * const updated = UrlUtils.updateQuery(
   *   'https://example.com?name=John',
   *   { age: 30, name: undefined }, // undefined removes the parameter
   *   { removeUndefined: true }
   * ); // "https://example.com?age=30"
   * ```
   */
  static updateQuery(
    url: string,
    updates: Record<string, any>,
    options: {
      removeUndefined?: boolean;
      merge?: boolean;
      encode?: boolean;
    } = {}
  ): string {
    const { removeUndefined = true, merge = true, encode = true } = options;

    const parsed = this.parse(url);
    const existingQuery = parsed.query || {};

    let newQuery: Record<string, any>;

    if (merge) {
      newQuery = { ...existingQuery };
      for (const [key, value] of Object.entries(updates)) {
        if (removeUndefined && value === undefined) {
          delete newQuery[key];
        } else {
          newQuery[key] = value;
        }
      }
    } else {
      newQuery = updates;
    }

    return this.build({ ...parsed, query: newQuery }, { encodeComponents: encode });
  }

  /**
   * Get query parameter from URL
   *
   * @param url - URL to extract from
   * @param key - Parameter key
   * @param defaultValue - Default value if not found
   * @returns Parameter value or default
   *
   * @example
   * ```typescript
   * const name = UrlUtils.getQuery('https://example.com?name=John', 'name');
   * console.log(name); // "John"
   * ```
   */
  static getQuery(url: string, key: string, defaultValue?: any): any {
    const parsed = this.parse(url);
    const query = parsed.query || {};
    return key in query ? query[key] : defaultValue;
  }

  /**
   * Set query parameter in URL
   *
   * @param url - Base URL
   * @param key - Parameter key
   * @param value - Parameter value
   * @returns Updated URL
   *
   * @example
   * ```typescript
   * const updated = UrlUtils.setQuery('https://example.com', 'name', 'John');
   * // "https://example.com?name=John"
   * ```
   */
  static setQuery(url: string, key: string, value: any): string {
    return this.updateQuery(url, { [key]: value });
  }

  /**
   * Remove query parameter from URL
   *
   * @param url - Base URL
   * @param key - Parameter key to remove
   * @returns Updated URL
   *
   * @example
   * ```typescript
   * const updated = UrlUtils.removeQuery('https://example.com?name=John&age=30', 'name');
   * // "https://example.com?age=30"
   * ```
   */
  static removeQuery(url: string, key: string): string {
    return this.updateQuery(url, { [key]: undefined }, { removeUndefined: true });
  }

  /**
   * Validate domain
   *
   * @param domain - Domain to validate
   * @param options - Validation options
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const result = UrlUtils.validateDomain('example.com', {
   *   allowSubdomains: true,
   *   allowedTlds: ['com', 'org']
   * });
   * ```
   */
  static validateDomain(domain: string, options: DomainValidationOptions = {}): {
    isValid: boolean;
    errors: string[];
  } {
    const {
      allowSubdomains = true,
      allowWildcard = false,
      allowedTlds = [],
      blacklistedDomains = [],
      requireTld = true
    } = options;

    const errors: string[] = [];

    if (!domain || typeof domain !== 'string') {
      return { isValid: false, errors: ['Domain is required'] };
    }

    const trimmedDomain = domain.trim().toLowerCase();

    // Check for wildcard
    if (trimmedDomain.startsWith('*.')) {
      if (!allowWildcard) {
        errors.push('Wildcard domains are not allowed');
      }
      const baseDomain = trimmedDomain.substring(2);
      const baseResult = this.validateDomain(baseDomain, { ...options, allowSubdomains: false });
      if (!baseResult.isValid) {
        errors.push(...baseResult.errors.map(e => e.replace('Domain', 'Base domain')));
      }
      return { isValid: errors.length === 0, errors };
    }

    // Basic domain regex
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(trimmedDomain)) {
      errors.push('Invalid domain format');
    }

    // Check if it's an IP address
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (ipRegex.test(trimmedDomain)) {
      errors.push('IP addresses are not allowed');
    }

    // Check TLD
    if (requireTld && !trimmedDomain.includes('.')) {
      errors.push('Domain must have a top-level domain');
    }

    // Check allowed TLDs
    if (allowedTlds.length > 0) {
      const tld = trimmedDomain.split('.').pop();
      if (!tld || !allowedTlds.includes(tld.toLowerCase())) {
        errors.push(`TLD must be one of: ${allowedTlds.join(', ')}`);
      }
    }

    // Check blacklisted domains
    if (blacklistedDomains.length > 0) {
      if (blacklistedDomains.some(blacklisted => trimmedDomain === blacklisted || trimmedDomain.endsWith(`.${blacklisted}`))) {
        errors.push('Domain is blacklisted');
      }
    }

    // Check length
    if (trimmedDomain.length > 253) {
      errors.push('Domain is too long (max 253 characters)');
    }

    // Check each label
    const labels = trimmedDomain.split('.');
    for (const label of labels) {
      if (label.length === 0 || label.length > 63) {
        errors.push('Domain label must be 1-63 characters');
        break;
      }
      if (label.startsWith('-') || label.endsWith('-')) {
        errors.push('Domain labels cannot start or end with hyphens');
        break;
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Get domain from URL
   *
   * @param url - URL to extract domain from
   * @param options - Extraction options
   * @returns Domain string or null
   *
   * @example
   * ```typescript
   * const domain = UrlUtils.getDomain('https://sub.example.com/path');
   * console.log(domain); // "sub.example.com"
   *
   * const rootDomain = UrlUtils.getDomain('https://sub.example.com', {
   *   rootOnly: true
   * }); // "example.com"
   * ```
   */
  static getDomain(url: string, options: { rootOnly?: boolean; includeSubdomains?: boolean } = {}): string | null {
    const { rootOnly = false, includeSubdomains = true } = options;

    try {
      const parsed = this.parse(url);
      if (!parsed.hostname) {
        return null;
      }

      if (rootOnly) {
        const parts = parsed.hostname.split('.');
        if (parts.length >= 2) {
          return parts.slice(-2).join('.');
        }
        return parsed.hostname;
      }

      return includeSubdomains ? parsed.hostname : parsed.hostname;
    } catch (error) {
      console.warn('Domain extraction failed:', error);
      return null;
    }
  }

  /**
   * Check if URL is absolute
   *
   * @param url - URL to check
   * @returns True if absolute URL
   *
   * @example
   * ```typescript
   * UrlUtils.isAbsolute('https://example.com'); // true
   * UrlUtils.isAbsolute('/path/to/page'); // false
   * UrlUtils.isAbsolute('//example.com'); // true (protocol-relative)
   * ```
   */
  static isAbsolute(url: string): boolean {
    if (!url) return false;

    // Protocol-relative URLs
    if (url.startsWith('//')) return true;

    // Absolute URLs with protocol
    return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url);
  }

  /**
   * Resolve relative URL against base URL
   *
   * @param base - Base URL
   * @param relative - Relative URL
   * @returns Resolved absolute URL
   *
   * @example
   * ```typescript
   * const resolved = UrlUtils.resolve(
   *   'https://example.com/path/',
   *   '../other/path?query=value'
   * ); // "https://example.com/other/path?query=value"
   * ```
   */
  static resolve(base: string, relative: string): string {
    try {
      if (typeof URL !== 'undefined') {
        return new URL(relative, base).toString();
      }

      // Fallback implementation
      return this.resolveUrlFallback(base, relative);
    } catch (error) {
      console.warn('URL resolution failed:', error);
      return relative;
    }
  }

  /**
   * Normalize URL
   *
   * @param url - URL to normalize
   * @param options - Normalization options
   * @returns Normalized URL
   *
   * @example
   * ```typescript
   * const normalized = UrlUtils.normalize('HTTPS://EXAMPLE.COM/../path');
   * // "https://example.com/path"
   * ```
   */
  static normalize(url: string, options: {
    lowercaseScheme?: boolean;
    lowercaseHost?: boolean;
    removeDefaultPort?: boolean;
    removeFragment?: boolean;
    sortQuery?: boolean;
  } = {}): string {
    const {
      lowercaseScheme = true,
      lowercaseHost = true,
      removeDefaultPort = true,
      removeFragment = false,
      sortQuery = false
    } = options;

    try {
      const parsed = this.parse(url);

      // Lowercase scheme and host
      if (lowercaseScheme && parsed.protocol) {
        parsed.protocol = parsed.protocol.toLowerCase();
      }

      if (lowercaseHost && parsed.hostname) {
        parsed.hostname = parsed.hostname.toLowerCase();
      }

      // Remove default ports
      if (removeDefaultPort && parsed.port) {
        const defaultPorts = {
          'http:': '80',
          'https:': '443',
          'ftp:': '21'
        };

        if (parsed.protocol && defaultPorts[parsed.protocol as keyof typeof defaultPorts] === parsed.port) {
          parsed.port = undefined;
        }
      }

      // Remove fragment
      if (removeFragment) {
        parsed.fragment = undefined;
      }

      // Sort query parameters
      if (sortQuery && parsed.query) {
        parsed.query = this.sortObjectKeys(parsed.query);
      }

      return this.build(parsed);
    } catch (error) {
      console.warn('URL normalization failed:', error);
      return url;
    }
  }

  /**
   * Compare two URLs for equality
   *
   * @param url1 - First URL
   * @param url2 - Second URL
   * @param options - Comparison options
   * @returns True if URLs are equivalent
   *
   * @example
   * ```typescript
   * const equal = UrlUtils.compare(
   *   'HTTPS://EXAMPLE.COM:80/path',
   *   'http://example.com/path',
   *   { ignoreDefaultPort: true, ignoreCase: true }
   * ); // true
   * ```
   */
  static compare(
    url1: string,
    url2: string,
    options: {
      ignoreCase?: boolean;
      ignoreDefaultPort?: boolean;
      ignoreFragment?: boolean;
      ignoreTrailingSlash?: boolean;
    } = {}
  ): boolean {
    const {
      ignoreCase = false,
      ignoreDefaultPort = true,
      ignoreFragment = false,
      ignoreTrailingSlash = false
    } = options;

    try {
      const normalizedOptions = {
        lowercaseScheme: ignoreCase,
        lowercaseHost: ignoreCase,
        removeDefaultPort: ignoreDefaultPort,
        removeFragment: ignoreFragment,
        sortQuery: true
      };

      let normalized1 = this.normalize(url1, normalizedOptions);
      let normalized2 = this.normalize(url2, normalizedOptions);

      // Handle trailing slash normalization
      if (ignoreTrailingSlash) {
        normalized1 = this.normalizeTrailingSlash(normalized1);
        normalized2 = this.normalizeTrailingSlash(normalized2);
      }

      return normalized1 === normalized2;
    } catch (error) {
      console.warn('URL comparison failed:', error);
      return url1 === url2;
    }
  }

  /**
   * Extract path segments from URL
   *
   * @param url - URL to extract from
   * @returns Array of path segments
   *
   * @example
   * ```typescript
   * const segments = UrlUtils.getPathSegments('https://example.com/a/b/c');
   * // ['a', 'b', 'c']
   * ```
   */
  static getPathSegments(url: string): string[] {
    try {
      const parsed = this.parse(url);
      if (!parsed.pathname) {
        return [];
      }

      return parsed.pathname
        .split('/')
        .filter(segment => segment.length > 0)
        .map(segment => decodeURIComponent(segment));
    } catch (error) {
      console.warn('Path segment extraction failed:', error);
      return [];
    }
  }

  /**
   * Build nested query string
   */
  private static buildNestedQuery(prefix: string, obj: any, encode: boolean): string {
    const pairs: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = `${prefix}[${key}]`;

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const itemKey = `${fullKey}[${index}]`;
          const encodedKey = encode ? encodeURIComponent(itemKey) : itemKey;
          const encodedValue = encode ? encodeURIComponent(String(item)) : String(item);
          pairs.push(`${encodedKey}=${encodedValue}`);
        });
      } else if (typeof value === 'object' && value !== null) {
        const nested = this.buildNestedQuery(fullKey, value, encode);
        if (nested) pairs.push(nested);
      } else {
        const encodedKey = encode ? encodeURIComponent(fullKey) : fullKey;
        const encodedValue = encode ? encodeURIComponent(String(value)) : String(value);
        pairs.push(`${encodedKey}=${encodedValue}`);
      }
    }

    return pairs.join('&');
  }

  /**
   * Fallback URL parsing for environments without URL API
   */
  private static parseUrlFallback(url: string, options: UrlParseOptions): ParsedUrl {
    // Basic fallback implementation
    const result: ParsedUrl = {};

    // Extract protocol
    const protocolMatch = url.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
    if (protocolMatch) {
      result.protocol = protocolMatch[1] + ':';
    }

    // Extract hostname and port
    const hostnameMatch = url.match(/^(?:[a-zA-Z][a-zA-Z0-9+.-]*:)?\/\/([^\/:?#]+)/);
    if (hostnameMatch) {
      const hostParts = hostnameMatch[1].split('@');
      const host = hostParts[hostParts.length - 1];

      if (hostParts.length > 1) {
        result.auth = hostParts[0];
      }

      const portMatch = host.match(/^(.+):(\d+)$/);
      if (portMatch) {
        result.hostname = portMatch[1];
        result.port = portMatch[2];
      } else {
        result.hostname = host;
      }
    }

    // Extract pathname
    const pathnameMatch = url.match(/^[^?#]*([^?#]+)/);
    if (pathnameMatch) {
      result.pathname = pathnameMatch[1];
    }

    // Extract query
    const queryMatch = url.match(/\?([^#]*)/);
    if (queryMatch && options.parseQuery) {
      result.query = this.parseQuery(queryMatch[1]);
      result.search = '?' + queryMatch[1];
    }

    // Extract fragment
    const fragmentMatch = url.match(/#(.+)$/);
    if (fragmentMatch && options.parseFragment) {
      result.fragment = fragmentMatch[1];
      result.hash = '#' + fragmentMatch[1];
    }

    return result;
  }

  /**
   * Fallback URL resolution
   */
  private static resolveUrlFallback(base: string, relative: string): string {
    if (this.isAbsolute(relative)) {
      return relative;
    }

    const baseParsed = this.parse(base);
    if (!baseParsed.hostname) {
      return relative;
    }

    const baseScheme = baseParsed.protocol || 'http:';
    const baseHost = baseParsed.hostname;
    const basePort = baseParsed.port;

    if (relative.startsWith('/')) {
      // Absolute path
      return `${baseScheme}//${baseHost}${basePort ? ':' + basePort : ''}${relative}`;
    }

    // Relative path
    const basePath = baseParsed.pathname || '';
    const basePathParts = basePath.split('/').filter(Boolean);
    const relativeParts = relative.split('/').filter(Boolean);

    // Resolve .. and .
    for (const part of relativeParts) {
      if (part === '..') {
        basePathParts.pop();
      } else if (part !== '.') {
        basePathParts.push(part);
      }
    }

    const resolvedPath = '/' + basePathParts.join('/');
    return `${baseScheme}//${baseHost}${basePort ? ':' + basePort : ''}${resolvedPath}`;
  }

  /**
   * Sort object keys alphabetically
   */
  private static sortObjectKeys<T extends Record<string, any>>(obj: T): T {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = obj[key];
    }
    return sorted as T;
  }

  /**
   * Normalize trailing slash
   */
  private static normalizeTrailingSlash(url: string): string {
    if (url.endsWith('/')) {
      return url.slice(0, -1);
    }
    return url;
  }
}

// Create convenience exports
export const url = {
  parse: UrlUtils.parse,
  build: UrlUtils.build,
  parseQuery: UrlUtils.parseQuery,
  buildQuery: UrlUtils.buildQuery,
  updateQuery: UrlUtils.updateQuery,
  getQuery: UrlUtils.getQuery,
  setQuery: UrlUtils.setQuery,
  removeQuery: UrlUtils.removeQuery,
  validateDomain: UrlUtils.validateDomain,
  getDomain: UrlUtils.getDomain,
  isAbsolute: UrlUtils.isAbsolute,
  resolve: UrlUtils.resolve,
  normalize: UrlUtils.normalize,
  compare: UrlUtils.compare,
  getPathSegments: UrlUtils.getPathSegments
};

// Export default
export default UrlUtils;

/**
 * Example usage:
 *
 * ```typescript
 * import { UrlUtils, url } from '@/utils/url';
 *
 * // Parse and build URLs
 * const parsed = UrlUtils.parse('https://example.com/path?param=value');
 * const built = UrlUtils.build({ protocol: 'https:', hostname: 'example.com' });
 *
 * // Query parameter manipulation
 * const updated = url.updateQuery('https://example.com?name=John', { age: 30 });
 * const queryValue = url.getQuery('https://example.com?name=John', 'name');
 *
 * // URL validation and extraction
 * const domain = url.getDomain('https://sub.example.com/path');
 * const segments = url.getPathSegments('https://example.com/a/b/c');
 *
 * // URL resolution and normalization
 * const resolved = url.resolve('https://example.com/base/', '../other');
 * const normalized = url.normalize('HTTPS://EXAMPLE.COM:80/path');
 * ```
 */