/**
 * Validation Utility - Common validation functions for form inputs and data validation
 * Provides comprehensive validation with detailed error messages
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Email validation options
 */
export interface EmailOptions {
  allowDisplayName?: boolean;
  requireDisplayName?: boolean;
  allowUtf8?: boolean;
  domainWhitelist?: string[];
  domainBlacklist?: string[];
}

/**
 * Password validation options
 */
export interface PasswordOptions {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  forbiddenPatterns?: RegExp[];
  customValidation?: (password: string) => boolean;
}

/**
 * URL validation options
 */
export interface UrlOptions {
  protocols?: string[];
  requireProtocol?: boolean;
  allowRelative?: boolean;
  allowHash?: boolean;
  allowQuery?: boolean;
  domainWhitelist?: string[];
  domainBlacklist?: string[];
}

/**
 * Phone number validation options
 */
export interface PhoneOptions {
  countryCode?: string;
  formats?: 'E164' | 'INTERNATIONAL' | 'NATIONAL' | 'RFC3966';
  allowExtensions?: boolean;
}

/**
 * Validation utility class
 */
export class ValidationUtils {
  /**
   * Validate email address
   *
   * @param email - Email address to validate
   * @param options - Validation options
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const result = ValidationUtils.validateEmail('user@example.com');
   * if (result.isValid) {
   *   console.log('Valid email');
   * } else {
   *   console.log(result.errors);
   * }
   * ```
   */
  static validateEmail(email: string, options: EmailOptions = {}): ValidationResult {
    const errors: string[] = [];
    const {
      allowDisplayName = false,
      requireDisplayName = false,
      allowUtf8 = true,
      domainWhitelist = [],
      domainBlacklist = []
    } = options;

    if (!email || typeof email !== 'string') {
      return { isValid: false, errors: ['Email is required'] };
    }

    const trimmedEmail = email.trim();

    // Basic email regex
    const emailRegex = allowUtf8
      ? /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      : /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Check for display name format
    if (requireDisplayName && !trimmedEmail.includes('<')) {
      errors.push('Display name is required');
    }

    // Extract email address if display name is present
    const emailAddress = trimmedEmail.includes('<')
      ? trimmedEmail.match(/<(.+)>/)?.[1]?.trim() || trimmedEmail
      : trimmedEmail;

    if (!emailRegex.test(emailAddress)) {
      errors.push('Invalid email format');
    }

    // Check domain whitelist
    if (domainWhitelist.length > 0) {
      const domain = emailAddress.split('@')[1]?.toLowerCase();
      if (!domain || !domainWhitelist.some(allowed => domain.includes(allowed.toLowerCase()))) {
        errors.push('Email domain is not allowed');
      }
    }

    // Check domain blacklist
    if (domainBlacklist.length > 0) {
      const domain = emailAddress.split('@')[1]?.toLowerCase();
      if (domain && domainBlacklist.some(blocked => domain.includes(blocked.toLowerCase()))) {
        errors.push('Email domain is blocked');
      }
    }

    // Additional checks
    if (emailAddress.startsWith('.') || emailAddress.endsWith('.')) {
      errors.push('Email cannot start or end with a dot');
    }

    if (emailAddress.includes('..')) {
      errors.push('Email cannot contain consecutive dots');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate password strength
   *
   * @param password - Password to validate
   * @param options - Validation options
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const result = ValidationUtils.validatePassword('MyP@ssw0rd', {
   *   minLength: 8,
   *   requireUppercase: true,
   *   requireNumbers: true,
   *   requireSpecialChars: true
   * });
   * ```
   */
  static validatePassword(password: string, options: PasswordOptions = {}): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const {
      minLength = 8,
      maxLength = 128,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecialChars = true,
      forbiddenPatterns = [],
      customValidation
    } = options;

    if (!password || typeof password !== 'string') {
      return { isValid: false, errors: ['Password is required'] };
    }

    // Length validation
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (password.length > maxLength) {
      errors.push(`Password must be no more than ${maxLength} characters long`);
    }

    // Character type validation
    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Forbidden patterns
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(password)) {
        errors.push(`Password contains forbidden pattern: ${pattern.source}`);
      }
    }

    // Common weak passwords
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and not secure');
    }

    // Sequential characters
    if (/(.)\1{2,}/.test(password)) {
      warnings.push('Password contains repeated characters');
    }

    // Custom validation
    if (customValidation && !customValidation(password)) {
      errors.push('Password does not meet custom requirements');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate URL
   *
   * @param url - URL to validate
   * @param options - Validation options
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const result = ValidationUtils.validateUrl('https://example.com', {
   *   protocols: ['https', 'http'],
   *   requireProtocol: true
   * });
   * ```
   */
  static validateUrl(url: string, options: UrlOptions = {}): ValidationResult {
    const errors: string[] = [];
    const {
      protocols = ['http', 'https', 'ftp'],
      requireProtocol = true,
      allowRelative = false,
      allowHash = true,
      allowQuery = true,
      domainWhitelist = [],
      domainBlacklist = []
    } = options;

    if (!url || typeof url !== 'string') {
      return { isValid: false, errors: ['URL is required'] };
    }

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      return { isValid: false, errors: ['URL cannot be empty'] };
    }

    // Relative URL check
    if (allowRelative && !trimmedUrl.includes('://')) {
      return { isValid: true, errors: [] };
    }

    try {
      const urlObj = new URL(trimmedUrl);

      // Protocol validation
      if (requireProtocol && !urlObj.protocol) {
        errors.push('URL must include a protocol');
      }

      if (protocols.length > 0 && !protocols.includes(urlObj.protocol.replace(':', ''))) {
        errors.push(`Protocol must be one of: ${protocols.join(', ')}`);
      }

      // Domain validation
      if (!urlObj.hostname) {
        errors.push('URL must include a valid hostname');
      }

      // Domain whitelist
      if (domainWhitelist.length > 0) {
        if (!domainWhitelist.some(allowed => urlObj.hostname?.includes(allowed))) {
          errors.push('URL domain is not allowed');
        }
      }

      // Domain blacklist
      if (domainBlacklist.length > 0) {
        if (domainBlacklist.some(blocked => urlObj.hostname?.includes(blocked))) {
          errors.push('URL domain is blocked');
        }
      }

      // Hash and query validation
      if (!allowHash && urlObj.hash) {
        errors.push('URL hash fragments are not allowed');
      }

      if (!allowQuery && urlObj.search) {
        errors.push('URL query parameters are not allowed');
      }

    } catch (error) {
      errors.push('Invalid URL format');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate phone number
   *
   * @param phone - Phone number to validate
   * @param options - Validation options
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const result = ValidationUtils.validatePhone('+1234567890', {
   *   countryCode: 'US',
   *   formats: ['E164', 'INTERNATIONAL']
   * });
   * ```
   */
  static validatePhone(phone: string, options: PhoneOptions = {}): ValidationResult {
    const errors: string[] = [];
    const { countryCode, formats = ['E164', 'INTERNATIONAL'], allowExtensions = false } = options;

    if (!phone || typeof phone !== 'string') {
      return { isValid: false, errors: ['Phone number is required'] };
    }

    const trimmedPhone = phone.trim();

    if (!trimmedPhone) {
      return { isValid: false, errors: ['Phone number cannot be empty'] };
    }

    // Basic phone number regex (international format)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    // Check for extensions
    const phoneWithoutExtension = trimmedPhone.split(/ext|x|extension/i)[0].trim();

    if (!phoneRegex.test(phoneWithoutExtension.replace(/[^\d+]/g, ''))) {
      errors.push('Invalid phone number format');
    }

    // Country code specific validation
    if (countryCode) {
      switch (countryCode.toUpperCase()) {
        case 'US':
        case 'CA':
          const usPhoneRegex = /^\+?1?\d{10}$/;
          if (!usPhoneRegex.test(phoneWithoutExtension.replace(/[^\d+]/g, ''))) {
            errors.push('Invalid North American phone number format');
          }
          break;
        // Add more country-specific validations as needed
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate required field
   *
   * @param value - Value to validate
   * @param fieldName - Name of the field for error messages
   * @param options - Additional options
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const result = ValidationUtils.validateRequired('', 'Name');
   * // Returns: { isValid: false, errors: ['Name is required'] }
   * ```
   */
  static validateRequired(
    value: any,
    fieldName: string = 'Field',
    options: { allowWhitespace?: boolean; trim?: boolean } = {}
  ): ValidationResult {
    const { allowWhitespace = false, trim = true } = options;
    const errors: string[] = [];

    // Check for null/undefined
    if (value === null || value === undefined) {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors };
    }

    // Handle strings
    if (typeof value === 'string') {
      const processedValue = trim ? value.trim() : value;
      if (!processedValue || (!allowWhitespace && /^\s*$/.test(processedValue))) {
        errors.push(`${fieldName} is required`);
      }
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      if (value.length === 0) {
        errors.push(`${fieldName} must contain at least one item`);
      }
    }
    // Handle objects
    else if (typeof value === 'object' && Object.keys(value).length === 0) {
      errors.push(`${fieldName} is required`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate numeric value
   *
   * @param value - Value to validate
   * @param fieldName - Name of the field
   * @param options - Validation options
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const result = ValidationUtils.validateNumber('25', 'Age', {
   *   min: 0,
   *   max: 120,
   *   integer: true
   * });
   * ```
   */
  static validateNumber(
    value: any,
    fieldName: string = 'Number',
    options: {
      min?: number;
      max?: number;
      integer?: boolean;
      positive?: boolean;
      allowZero?: boolean;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];
    const { min, max, integer = false, positive = false, allowZero = true } = options;

    if (value === null || value === undefined || value === '') {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors };
    }

    const numValue = typeof value === 'number' ? value : parseFloat(value);

    if (isNaN(numValue)) {
      errors.push(`${fieldName} must be a valid number`);
      return { isValid: false, errors };
    }

    if (integer && !Number.isInteger(numValue)) {
      errors.push(`${fieldName} must be an integer`);
    }

    if (positive && numValue <= 0) {
      errors.push(`${fieldName} must be positive`);
    }

    if (!allowZero && numValue === 0) {
      errors.push(`${fieldName} cannot be zero`);
    }

    if (min !== undefined && numValue < min) {
      errors.push(`${fieldName} must be at least ${min}`);
    }

    if (max !== undefined && numValue > max) {
      errors.push(`${fieldName} must be no more than ${max}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate date
   *
   * @param value - Date value to validate
   * @param fieldName - Name of the field
   * @param options - Validation options
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const result = ValidationUtils.validateDate('2023-12-25', 'Birth Date', {
   *   min: new Date('1900-01-01'),
   *   max: new Date(),
   *   format: 'YYYY-MM-DD'
   * });
   * ```
   */
  static validateDate(
    value: any,
    fieldName: string = 'Date',
    options: {
      min?: Date;
      max?: Date;
      format?: string;
      allowFuture?: boolean;
      allowPast?: boolean;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];
    const { min, max, format, allowFuture = true, allowPast = true } = options;

    if (!value) {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors };
    }

    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      date = new Date(value);
      if (isNaN(date.getTime())) {
        errors.push(`${fieldName} must be a valid date`);
        return { isValid: false, errors };
      }
    } else {
      errors.push(`${fieldName} must be a valid date`);
      return { isValid: false, errors };
    }

    // Date range validation
    if (min && date < min) {
      errors.push(`${fieldName} must be after ${min.toDateString()}`);
    }

    if (max && date > max) {
      errors.push(`${fieldName} must be before ${max.toDateString()}`);
    }

    // Future/past validation
    const now = new Date();
    if (!allowFuture && date > now) {
      errors.push(`${fieldName} cannot be in the future`);
    }

    if (!allowPast && date < now) {
      errors.push(`${fieldName} cannot be in the past`);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate file
   *
   * @param file - File to validate
   * @param options - Validation options
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const result = ValidationUtils.validateFile(file, {
   *   maxSize: 5 * 1024 * 1024, // 5MB
   *   allowedTypes: ['image/jpeg', 'image/png'],
   *   allowedExtensions: ['.jpg', '.png']
   * });
   * ```
   */
  static validateFile(
    file: File,
    options: {
      maxSize?: number;
      minSize?: number;
      allowedTypes?: string[];
      allowedExtensions?: string[];
      maxNameLength?: number;
    } = {}
  ): ValidationResult {
    const errors: string[] = [];
    const {
      maxSize,
      minSize,
      allowedTypes = [],
      allowedExtensions = [],
      maxNameLength = 255
    } = options;

    if (!file) {
      errors.push('File is required');
      return { isValid: false, errors };
    }

    // File name validation
    if (!file.name) {
      errors.push('File must have a name');
    } else if (file.name.length > maxNameLength) {
      errors.push(`File name must be ${maxNameLength} characters or less`);
    }

    // File size validation
    if (minSize !== undefined && file.size < minSize) {
      errors.push(`File must be at least ${this.formatFileSize(minSize)}`);
    }

    if (maxSize !== undefined && file.size > maxSize) {
      errors.push(`File must be ${this.formatFileSize(maxSize)} or smaller`);
    }

    // File type validation
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // File extension validation
    if (allowedExtensions.length > 0) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.some(ext => ext.toLowerCase() === fileExtension)) {
        errors.push(`File extension ${fileExtension} is not allowed`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate object against schema
   *
   * @param obj - Object to validate
   * @param schema - Validation schema
   * @returns Validation result
   *
   * @example
   * ```typescript
   * const schema = {
   *   name: { type: 'string', required: true, minLength: 2 },
   *   email: { type: 'email', required: true },
   *   age: { type: 'number', min: 0, max: 120 }
   * };
   * const result = ValidationUtils.validateObject(data, schema);
   * ```
   */
  static validateObject(
    obj: any,
    schema: Record<string, {
      type: 'string' | 'number' | 'integer' | 'email' | 'url' | 'date' | 'boolean' | 'array' | 'object';
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: RegExp;
      enum?: any[];
      properties?: Record<string, any>;
    }>
  ): ValidationResult {
    const errors: string[] = [];

    if (!obj || typeof obj !== 'object') {
      return { isValid: false, errors: ['Invalid object'] };
    }

    for (const [key, rules] of Object.entries(schema)) {
      const value = obj[key];

      // Required field validation
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`${key} is required`);
        continue;
      }

      // Skip validation if field is not required and empty
      if (!rules.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      switch (rules.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${key} must be a string`);
          } else {
            if (rules.minLength && value.length < rules.minLength) {
              errors.push(`${key} must be at least ${rules.minLength} characters`);
            }
            if (rules.maxLength && value.length > rules.maxLength) {
              errors.push(`${key} must be ${rules.maxLength} characters or less`);
            }
            if (rules.pattern && !rules.pattern.test(value)) {
              errors.push(`${key} format is invalid`);
            }
          }
          break;

        case 'number':
        case 'integer':
          const numResult = this.validateNumber(value, key, {
            min: rules.min,
            max: rules.max,
            integer: rules.type === 'integer'
          });
          if (!numResult.isValid) {
            errors.push(...numResult.errors);
          }
          break;

        case 'email':
          const emailResult = this.validateEmail(value);
          if (!emailResult.isValid) {
            errors.push(`${key} ${emailResult.errors[0]}`);
          }
          break;

        case 'url':
          const urlResult = this.validateUrl(value);
          if (!urlResult.isValid) {
            errors.push(`${key} ${urlResult.errors[0]}`);
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${key} must be a boolean`);
          }
          break;

        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`${key} must be an array`);
          } else if (rules.minLength && value.length < rules.minLength) {
            errors.push(`${key} must have at least ${rules.minLength} items`);
          } else if (rules.maxLength && value.length > rules.maxLength) {
            errors.push(`${key} must have ${rules.maxLength} items or less`);
          }
          break;

        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            errors.push(`${key} must be an object`);
          } else if (rules.properties) {
            const nestedResult = this.validateObject(value, rules.properties);
            if (!nestedResult.isValid) {
              errors.push(...nestedResult.errors.map(err => `${key}.${err}`));
            }
          }
          break;
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${key} must be one of: ${rules.enum.join(', ')}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Format file size for display
   *
   * @param bytes - Size in bytes
   * @returns Formatted file size
   */
  private static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

// Create instance with convenience methods
export const validate = {
  email: ValidationUtils.validateEmail,
  password: ValidationUtils.validatePassword,
  url: ValidationUtils.validateUrl,
  phone: ValidationUtils.validatePhone,
  required: ValidationUtils.validateRequired,
  number: ValidationUtils.validateNumber,
  date: ValidationUtils.validateDate,
  file: ValidationUtils.validateFile,
  object: ValidationUtils.validateObject
};

// Export default
export default ValidationUtils;

/**
 * Example usage:
 *
 * ```typescript
 * import { ValidationUtils, validate } from '@/utils/validation';
 *
 * // Direct usage
 * const emailResult = ValidationUtils.validateEmail('user@example.com');
 * const passwordResult = ValidationUtils.validatePassword('MyP@ssw0rd', {
 *   minLength: 8,
 *   requireUppercase: true,
 *   requireNumbers: true
 * });
 *
 * // Using convenience object
 * const urlResult = validate.url('https://example.com');
 * const requiredResult = validate.required('', 'Name');
 *
 * // Object validation with schema
 * const userSchema = {
 *   name: { type: 'string', required: true, minLength: 2 },
 *   email: { type: 'email', required: true },
 *   age: { type: 'number', min: 0, max: 120 },
 *   active: { type: 'boolean', required: true }
 * };
 * const validationResult = ValidationUtils.validateObject(userData, userSchema);
 *
 * if (!validationResult.isValid) {
 *   console.log('Validation errors:', validationResult.errors);
 * }
 * ```
 */