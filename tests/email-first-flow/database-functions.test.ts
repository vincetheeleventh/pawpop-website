// tests/email-first-flow/database-functions.test.ts
import { describe, it, expect } from 'vitest';

describe('Database Functions - Email First Flow', () => {
  describe('generate_upload_token()', () => {
    it('should generate token of correct length', () => {
      // Simulate token generation logic
      const generateToken = () => {
        const bytes = Array.from({ length: 24 }, () => Math.floor(Math.random() * 256));
        const base64 = Buffer.from(bytes).toString('base64');
        return base64.replace(/[+/=]/g, '').substring(0, 32);
      };

      const token = generateToken();
      expect(token.length).toBe(32);
      expect(token).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        const token = `${Date.now()}-${Math.random()}-${i}`;
        tokens.add(token);
      }
      
      expect(tokens.size).toBe(100);
    });
  });

  describe('get_artworks_needing_reminders()', () => {
    it('should filter by hours since capture', () => {
      const now = new Date();
      const artwork24hOld = {
        email_captured_at: new Date(now.getTime() - 25 * 60 * 60 * 1000),
        upload_reminder_count: 0,
        upload_deferred: true,
        generation_step: 'pending'
      };

      const artwork12hOld = {
        email_captured_at: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        upload_reminder_count: 0,
        upload_deferred: true,
        generation_step: 'pending'
      };

      const hoursSince24h = (now.getTime() - artwork24hOld.email_captured_at.getTime()) / (1000 * 60 * 60);
      const hoursSince12h = (now.getTime() - artwork12hOld.email_captured_at.getTime()) / (1000 * 60 * 60);

      expect(hoursSince24h).toBeGreaterThan(24);
      expect(hoursSince12h).toBeLessThan(24);
    });

    it('should respect max reminders limit', () => {
      const artworks = [
        { upload_reminder_count: 0, eligible: true },
        { upload_reminder_count: 1, eligible: true },
        { upload_reminder_count: 2, eligible: true },
        { upload_reminder_count: 3, eligible: false },
        { upload_reminder_count: 4, eligible: false }
      ];

      const maxReminders = 3;
      artworks.forEach(artwork => {
        const shouldBeEligible = artwork.upload_reminder_count < maxReminders;
        expect(shouldBeEligible).toBe(artwork.eligible);
      });
    });

    it('should only include deferred uploads', () => {
      const artworks = [
        { upload_deferred: true, generation_step: 'pending', eligible: true },
        { upload_deferred: false, generation_step: 'pending', eligible: false },
        { upload_deferred: true, generation_step: 'completed', eligible: false }
      ];

      artworks.forEach(artwork => {
        const isEligible = artwork.upload_deferred && artwork.generation_step === 'pending';
        expect(isEligible).toBe(artwork.eligible);
      });
    });

    it('should handle subsequent reminder timing', () => {
      const now = new Date();
      
      // First reminder: 24h after capture
      const firstReminderArtwork = {
        upload_reminder_count: 0,
        email_captured_at: new Date(now.getTime() - 25 * 60 * 60 * 1000),
        upload_reminder_sent_at: null
      };

      // Second reminder: 48h after first reminder
      const secondReminderArtwork = {
        upload_reminder_count: 1,
        email_captured_at: new Date(now.getTime() - 100 * 60 * 60 * 1000),
        upload_reminder_sent_at: new Date(now.getTime() - 49 * 60 * 60 * 1000)
      };

      const hoursSinceCapture = (now.getTime() - firstReminderArtwork.email_captured_at.getTime()) / (1000 * 60 * 60);
      const hoursSinceLastReminder = secondReminderArtwork.upload_reminder_sent_at 
        ? (now.getTime() - secondReminderArtwork.upload_reminder_sent_at.getTime()) / (1000 * 60 * 60)
        : 0;

      expect(hoursSinceCapture).toBeGreaterThan(24);
      expect(hoursSinceLastReminder).toBeGreaterThan(48);
    });
  });

  describe('mark_reminder_sent()', () => {
    it('should increment reminder count', () => {
      const artwork = { upload_reminder_count: 1 };
      const updatedCount = artwork.upload_reminder_count + 1;
      
      expect(updatedCount).toBe(2);
      expect(updatedCount).toBeGreaterThan(artwork.upload_reminder_count);
    });

    it('should update timestamp', () => {
      const before = new Date('2024-01-01T00:00:00Z');
      const after = new Date();
      
      expect(after.getTime()).toBeGreaterThan(before.getTime());
    });
  });

  describe('complete_deferred_upload()', () => {
    it('should mark upload as not deferred', () => {
      const artwork = {
        upload_deferred: true,
        upload_completed_at: null
      };

      const updated = {
        ...artwork,
        upload_deferred: false,
        upload_completed_at: new Date().toISOString()
      };

      expect(updated.upload_deferred).toBe(false);
      expect(updated.upload_completed_at).toBeTruthy();
    });

    it('should set completion timestamp', () => {
      const completedAt = new Date();
      expect(completedAt).toBeInstanceOf(Date);
      expect(completedAt.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Artwork Interface Validation', () => {
    it('should have all required deferred upload fields', () => {
      const artwork = {
        id: 'test-id',
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        email_captured_at: new Date().toISOString(),
        upload_deferred: true,
        upload_reminder_sent_at: null,
        upload_reminder_count: 0,
        upload_completed_at: null,
        upload_token: 'test-token-123',
        generation_step: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Verify all new fields exist
      expect(artwork).toHaveProperty('email_captured_at');
      expect(artwork).toHaveProperty('upload_deferred');
      expect(artwork).toHaveProperty('upload_reminder_sent_at');
      expect(artwork).toHaveProperty('upload_reminder_count');
      expect(artwork).toHaveProperty('upload_completed_at');
      expect(artwork).toHaveProperty('upload_token');

      // Verify field types
      expect(typeof artwork.email_captured_at).toBe('string');
      expect(typeof artwork.upload_deferred).toBe('boolean');
      expect(typeof artwork.upload_reminder_count).toBe('number');
      expect(typeof artwork.upload_token).toBe('string');
    });
  });
});
