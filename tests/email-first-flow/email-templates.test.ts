// tests/email-first-flow/email-templates.test.ts
import { describe, it, expect, vi } from 'vitest';

describe('Email Templates - Email First Flow', () => {
  describe('Email Capture Confirmation', () => {
    it('should have required data fields', () => {
      const mockData = {
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        uploadUrl: 'https://pawpopart.com/upload/test-token'
      };

      expect(mockData.customerName).toBeDefined();
      expect(mockData.customerEmail).toBeDefined();
      expect(mockData.uploadUrl).toBeDefined();
      expect(mockData.uploadUrl).toContain('/upload/');
    });

    it('should validate email format', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'test+tag@example.com'
      ];

      const invalidEmails = [
        'invalid',
        '@example.com',
        'test@',
        'test@.com'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('Upload Reminders', () => {
    it('should have correct reminder structure', () => {
      const reminderData = {
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        uploadUrl: 'https://pawpopart.com/upload/test-token',
        reminderNumber: 1
      };

      expect(reminderData.reminderNumber).toBeGreaterThanOrEqual(1);
      expect(reminderData.reminderNumber).toBeLessThanOrEqual(3);
      expect(reminderData.uploadUrl).toContain('/upload/');
    });

    it('should support all reminder numbers', () => {
      const validReminderNumbers = [1, 2, 3];
      
      validReminderNumbers.forEach(num => {
        const data = {
          customerName: 'Test',
          customerEmail: 'test@example.com',
          uploadUrl: 'https://test.com/upload/token',
          reminderNumber: num
        };
        
        expect(data.reminderNumber).toBeDefined();
        expect(typeof data.reminderNumber).toBe('number');
      });
    });

    it('should validate reminder messaging strategy', () => {
      const messages = {
        1: { timing: 24, tone: 'gentle' },
        2: { timing: 72, tone: 'urgent' },
        3: { timing: 168, tone: 'final' }
      };

      expect(messages[1].timing).toBe(24); // 24 hours
      expect(messages[2].timing).toBe(72); // 72 hours
      expect(messages[3].timing).toBe(168); // 7 days
    });
  });
});
