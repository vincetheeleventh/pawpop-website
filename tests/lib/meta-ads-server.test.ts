/**
 * Meta Conversions API Server-Side Tracking Tests
 * 
 * Tests the server-side Meta Conversions API implementation including:
 * - Purchase event tracking
 * - User data hashing
 * - Event deduplication
 * - Batch conversion processing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  trackMetaServerSideConversion,
  trackMetaBatchConversions,
  type MetaServerConversionData
} from '@/lib/meta-ads-server';

// Mock fetch globally
global.fetch = vi.fn();

describe('Meta Conversions API Server-Side Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment variables
    process.env.NEXT_PUBLIC_META_PIXEL_ID = '123456789012345';
    process.env.META_CONVERSION_API_ACCESS_TOKEN = 'EAAtest_token_123';
    process.env.META_TEST_EVENT_CODE = 'TEST12345';
  });

  describe('trackMetaServerSideConversion', () => {
    it('should send conversion to Meta API successfully', async () => {
      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events_received: 1,
          fbtrace_id: 'trace_123'
        })
      });

      const conversionData: MetaServerConversionData = {
        orderId: 'order_123',
        value: 99.99,
        currency: 'CAD',
        productType: 'art_print',
        customerEmail: 'test@example.com',
        customerName: 'John Doe'
      };

      const result = await trackMetaServerSideConversion(conversionData);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('graph.facebook.com/v18.0/123456789012345/events'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should hash user data before sending', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events_received: 1 })
      });

      const conversionData: MetaServerConversionData = {
        orderId: 'order_456',
        value: 79,
        currency: 'CAD',
        productType: 'canvas_framed',
        customerEmail: 'user@example.com',
        customerName: 'Jane Smith',
        customerPhone: '+1-604-555-0123'
      };

      await trackMetaServerSideConversion(conversionData);

      const callArgs = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      const userData = requestBody.data[0].user_data;

      // Verify email is hashed (SHA-256 produces 64-char hex string)
      expect(userData.em).toBeDefined();
      expect(userData.em).toHaveLength(64);
      expect(userData.em).not.toBe('user@example.com');

      // Verify phone is hashed
      expect(userData.ph).toBeDefined();
      expect(userData.ph).toHaveLength(64);

      // Verify name is split and hashed
      expect(userData.fn).toBeDefined(); // First name
      expect(userData.ln).toBeDefined(); // Last name
    });

    it('should include shipping address if provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events_received: 1 })
      });

      const conversionData: MetaServerConversionData = {
        orderId: 'order_789',
        value: 129,
        currency: 'CAD',
        productType: 'canvas_framed',
        customerEmail: 'customer@example.com',
        customerAddress: {
          city: 'Vancouver',
          state: 'BC',
          zip: 'V6B 5T1',
          country: 'CA'
        }
      };

      await trackMetaServerSideConversion(conversionData);

      const callArgs = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      const userData = requestBody.data[0].user_data;

      // Verify address fields are hashed
      expect(userData.ct).toBeDefined(); // City
      expect(userData.st).toBeDefined(); // State
      expect(userData.zp).toBeDefined(); // Zip
      expect(userData.country).toBeDefined(); // Country
    });

    it('should include event_id for deduplication', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events_received: 1 })
      });

      const conversionData: MetaServerConversionData = {
        orderId: 'order_101',
        value: 49,
        currency: 'CAD',
        productType: 'digital',
        eventId: 'client_generated_event_id_123'
      };

      await trackMetaServerSideConversion(conversionData);

      const callArgs = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      const eventData = requestBody.data[0];

      expect(eventData.event_id).toBe('client_generated_event_id_123');
    });

    it('should generate event_id if not provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events_received: 1 })
      });

      const conversionData: MetaServerConversionData = {
        orderId: 'order_202',
        value: 99,
        currency: 'CAD',
        productType: 'art_print'
      };

      await trackMetaServerSideConversion(conversionData);

      const callArgs = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      const eventData = requestBody.data[0];

      expect(eventData.event_id).toBeDefined();
      expect(typeof eventData.event_id).toBe('string');
    });

    it('should include test_event_code when configured', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events_received: 1 })
      });

      const conversionData: MetaServerConversionData = {
        orderId: 'order_303',
        value: 79,
        currency: 'CAD',
        productType: 'canvas_stretched'
      };

      await trackMetaServerSideConversion(conversionData);

      const callArgs = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.test_event_code).toBe('TEST12345');
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            message: 'Invalid access token'
          }
        })
      });

      const conversionData: MetaServerConversionData = {
        orderId: 'order_404',
        value: 59,
        currency: 'CAD',
        productType: 'art_print'
      };

      const result = await trackMetaServerSideConversion(conversionData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid access token');
    });

    it('should return error when environment variables are missing', async () => {
      delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
      delete process.env.META_CONVERSION_API_ACCESS_TOKEN;

      const conversionData: MetaServerConversionData = {
        orderId: 'order_505',
        value: 99,
        currency: 'CAD',
        productType: 'art_print'
      };

      const result = await trackMetaServerSideConversion(conversionData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const conversionData: MetaServerConversionData = {
        orderId: 'order_606',
        value: 89,
        currency: 'CAD',
        productType: 'canvas_framed'
      };

      const result = await trackMetaServerSideConversion(conversionData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('trackMetaBatchConversions', () => {
    it('should send multiple conversions in a single API call', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events_received: 3,
          fbtrace_id: 'trace_456'
        })
      });

      const conversions: MetaServerConversionData[] = [
        {
          orderId: 'order_1',
          value: 79,
          currency: 'CAD',
          productType: 'art_print',
          customerEmail: 'user1@example.com'
        },
        {
          orderId: 'order_2',
          value: 99,
          currency: 'CAD',
          productType: 'canvas_framed',
          customerEmail: 'user2@example.com'
        },
        {
          orderId: 'order_3',
          value: 49,
          currency: 'CAD',
          productType: 'digital',
          customerEmail: 'user3@example.com'
        }
      ];

      const result = await trackMetaBatchConversions(conversions);

      expect(result.success).toBe(true);
      expect(result.eventsReceived).toBe(3);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      const callArgs = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.data).toHaveLength(3);
    });

    it('should handle batch API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            message: 'Batch processing failed'
          }
        })
      });

      const conversions: MetaServerConversionData[] = [
        {
          orderId: 'order_1',
          value: 79,
          currency: 'CAD',
          productType: 'art_print'
        }
      ];

      const result = await trackMetaBatchConversions(conversions);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Batch processing failed');
    });
  });

  describe('Event Structure Validation', () => {
    it('should include all required custom_data fields', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events_received: 1 })
      });

      const conversionData: MetaServerConversionData = {
        orderId: 'order_valid',
        value: 99.99,
        currency: 'CAD',
        productType: 'art_print'
      };

      await trackMetaServerSideConversion(conversionData);

      const callArgs = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      const customData = requestBody.data[0].custom_data;

      expect(customData.value).toBe(99.99);
      expect(customData.currency).toBe('CAD');
      expect(customData.content_name).toBe('PawPop art_print');
      expect(customData.content_category).toBe('pet_art');
      expect(customData.content_ids).toEqual(['pawpop_art_print']);
      expect(customData.content_type).toBe('product');
      expect(customData.num_items).toBe(1);
      expect(customData.order_id).toBe('order_valid');
    });

    it('should set event_time to current Unix timestamp', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events_received: 1 })
      });

      const beforeTimestamp = Math.floor(Date.now() / 1000);

      const conversionData: MetaServerConversionData = {
        orderId: 'order_time',
        value: 79,
        currency: 'CAD',
        productType: 'canvas_stretched'
      };

      await trackMetaServerSideConversion(conversionData);

      const afterTimestamp = Math.floor(Date.now() / 1000);

      const callArgs = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      const eventTime = requestBody.data[0].event_time;

      expect(eventTime).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(eventTime).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should set action_source to "website"', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ events_received: 1 })
      });

      const conversionData: MetaServerConversionData = {
        orderId: 'order_source',
        value: 99,
        currency: 'CAD',
        productType: 'art_print'
      };

      await trackMetaServerSideConversion(conversionData);

      const callArgs = (global.fetch as any).mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);
      const eventData = requestBody.data[0];

      expect(eventData.action_source).toBe('website');
    });
  });
});
