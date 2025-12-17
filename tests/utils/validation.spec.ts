/**
 * Validation Utility Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationUtils, validate } from '@/utils/validation';

describe('ValidationUtils', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user@example-domain.com'
      ];

      validEmails.forEach(email => {
        const result = ValidationUtils.validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user@.com'
      ];

      invalidEmails.forEach(email => {
        const result = ValidationUtils.validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should handle domain whitelist', () => {
      const result = ValidationUtils.validateEmail('user@allowed.com', {
        domainWhitelist: ['allowed.com', 'example.com']
      });
      expect(result.isValid).toBe(true);

      const result2 = ValidationUtils.validateEmail('user@blocked.com', {
        domainWhitelist: ['allowed.com', 'example.com']
      });
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Email domain is not allowed');
    });

    it('should handle domain blacklist', () => {
      const result = ValidationUtils.validateEmail('user@allowed.com', {
        domainBlacklist: ['blocked.com', 'spam.com']
      });
      expect(result.isValid).toBe(true);

      const result2 = ValidationUtils.validateEmail('user@blocked.com', {
        domainBlacklist: ['blocked.com', 'spam.com']
      });
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Email domain is blocked');
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = ValidationUtils.validatePassword('MyStr0ngP@ss!', {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = ValidationUtils.validatePassword('weak', {
        minLength: 8,
        requireUppercase: true,
        requireNumbers: true
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject common passwords', () => {
      const result = ValidationUtils.validatePassword('password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is too common and not secure');
    });

    it('should provide warnings for repeated characters', () => {
      const result = ValidationUtils.validatePassword('MyyyP@ssword123');
      expect(result.warnings).toContain('Password contains repeated characters');
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com/path',
        'https://example.com:8080/path?query=value',
        'ftp://example.com/file.txt'
      ];

      validUrls.forEach(url => {
        const result = ValidationUtils.validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'http://',
        'https://',
        'example.com' // missing protocol when requireProtocol is true
      ];

      invalidUrls.forEach(url => {
        const result = ValidationUtils.validateUrl(url, { requireProtocol: true });
        expect(result.isValid).toBe(false);
      });
    });

    it('should allow relative URLs', () => {
      const result = ValidationUtils.validateUrl('/relative/path', {
        allowRelative: true,
        requireProtocol: false
      });
      expect(result.isValid).toBe(true);
    });

    it('should validate protocol whitelist', () => {
      const result = ValidationUtils.validateUrl('https://example.com', {
        protocols: ['https', 'http']
      });
      expect(result.isValid).toBe(true);

      const result2 = ValidationUtils.validateUrl('ftp://example.com', {
        protocols: ['https', 'http']
      });
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Protocol must be one of: https, http');
    });
  });

  describe('validateNumber', () => {
    it('should validate correct numbers', () => {
      const result = ValidationUtils.validateNumber('123.45', 'Amount', {
        min: 0,
        max: 1000
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject numbers outside range', () => {
      const result = ValidationUtils.validateNumber('1500', 'Amount', {
        min: 0,
        max: 1000
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be no more than 1000');
    });

    it('should validate integers', () => {
      const result = ValidationUtils.validateNumber('123', 'Count', {
        integer: true,
        min: 0
      });
      expect(result.isValid).toBe(true);

      const result2 = ValidationUtils.validateNumber('123.45', 'Count', {
        integer: true
      });
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Count must be an integer');
    });

    it('should require positive numbers', () => {
      const result = ValidationUtils.validateNumber('-5', 'Value', {
        positive: true
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Value must be positive');
    });
  });

  describe('validateDate', () => {
    it('should validate valid dates', () => {
      const result = ValidationUtils.validateDate('2023-12-25', 'Birth Date');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid dates', () => {
      const result = ValidationUtils.validateDate('invalid-date', 'Birth Date');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Birth Date must be a valid date');
    });

    it('should validate date ranges', () => {
      const minDate = new Date('2023-01-01');
      const maxDate = new Date('2023-12-31');

      const result = ValidationUtils.validateDate('2023-06-15', 'Date', {
        min: minDate,
        max: maxDate
      });
      expect(result.isValid).toBe(true);

      const result2 = ValidationUtils.validateDate('2024-01-01', 'Date', {
        max: maxDate
      });
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Date must be before Dec 31, 2023');
    });

    it('should prevent future dates', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const result = ValidationUtils.validateDate(futureDate, 'Event Date', {
        allowFuture: false
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event Date cannot be in the future');
    });
  });

  describe('validateRequired', () => {
    it('should validate required fields', () => {
      const result = ValidationUtils.validateRequired('John', 'Name');
      expect(result.isValid).toBe(true);

      const result2 = ValidationUtils.validateRequired('', 'Name');
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Name is required');

      const result3 = ValidationUtils.validateRequired('   ', 'Name');
      expect(result3.isValid).toBe(true); // whitespace is allowed by default

      const result4 = ValidationUtils.validateRequired('   ', 'Name', { allowWhitespace: false });
      expect(result4.isValid).toBe(false);
      expect(result4.errors).toContain('Name is required');
    });

    it('should validate arrays', () => {
      const result = ValidationUtils.validateRequired([1, 2, 3], 'Items');
      expect(result.isValid).toBe(true);

      const result2 = ValidationUtils.validateRequired([], 'Items');
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Items must contain at least one item');
    });

    it('should validate objects', () => {
      const result = ValidationUtils.validateRequired({ key: 'value' }, 'Data');
      expect(result.isValid).toBe(true);

      const result2 = ValidationUtils.validateRequired({}, 'Data');
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Data is required');
    });
  });

  describe('validateObject', () => {
    const schema = {
      name: { type: 'string', required: true, minLength: 2 },
      email: { type: 'email', required: true },
      age: { type: 'number', min: 0, max: 120 },
      active: { type: 'boolean', required: true },
      tags: { type: 'array', minLength: 1 }
    };

    it('should validate valid objects', () => {
      const validObject = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        active: true,
        tags: ['user', 'premium']
      };

      const result = ValidationUtils.validateObject(validObject, schema);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid objects', () => {
      const invalidObject = {
        name: 'J', // too short
        email: 'invalid-email',
        age: -5, // negative
        active: 'true', // not boolean
        tags: [] // empty array
      };

      const result = ValidationUtils.validateObject(invalidObject, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing required fields', () => {
      const incompleteObject = {
        name: 'John Doe'
        // missing required email, active
      };

      const result = ValidationUtils.validateObject(incompleteObject, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('email is required');
      expect(result.errors).toContain('active is required');
    });
  });

  describe('validateFile', () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

    it('should validate file size', () => {
      // Mock a larger file
      Object.defineProperty(mockFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB

      const result = ValidationUtils.validateFile(mockFile, {
        maxSize: 5 * 1024 * 1024 // 5MB
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File must be 5.0 MB or smaller');
    });

    it('should validate file types', () => {
      const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      const result = ValidationUtils.validateFile(imageFile, {
        allowedTypes: ['image/png', 'image/gif']
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File type image/jpeg is not allowed');
    });

    it('should validate file extensions', () => {
      const result = ValidationUtils.validateFile(mockFile, {
        allowedExtensions: ['.jpg', '.png']
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File extension .txt is not allowed');
    });
  });

  describe('validatePhone', () => {
    it('should validate valid phone numbers', () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+1-234-567-8901',
        '(234) 567-8901'
      ];

      validPhones.forEach(phone => {
        const result = ValidationUtils.validatePhone(phone);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        'abc123',
        '+12345678901234567890'
      ];

      invalidPhones.forEach(phone => {
        const result = ValidationUtils.validatePhone(phone);
        expect(result.isValid).toBe(false);
      });
    });

    it('should validate country-specific formats', () => {
      const result = ValidationUtils.validatePhone('1234567890', {
        countryCode: 'US'
      });
      expect(result.isValid).toBe(true);

      const result2 = ValidationUtils.validatePhone('12345', {
        countryCode: 'US'
      });
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Invalid North American phone number format');
    });
  });

  describe('convenience exports', () => {
    it('should work with convenience exports', () => {
      expect(validate.email('test@example.com').isValid).toBe(true);
      expect(validate.password('MyP@ssw0rd123', { minLength: 8 }).isValid).toBe(true);
      expect(validate.url('https://example.com').isValid).toBe(true);
      expect(validate.required('test', 'Field').isValid).toBe(true);
      expect(validate.number('123').isValid).toBe(true);
      expect(validate.date('2023-01-01').isValid).toBe(true);
    });
  });
});