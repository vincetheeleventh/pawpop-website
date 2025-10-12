/**
 * Meta (Facebook) Pixel Client-Side Tracking Tests
 * 
 * Tests the Meta Pixel tracking implementation including:
 * - Lead event (photo upload)
 * - ViewContent events (artwork generation, page views)
 * - InitiateCheckout event
 * - Purchase event
 * - Advanced matching
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock window.fbq
const mockFbq = vi.fn();

describe('Meta Ads Client-Side Tracking', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup window.fbq mock
    global.window = {
      fbq: mockFbq
    } as any;
  });

  describe('initMetaPixel', () => {
    it('should initialize Meta Pixel with correct pixel ID', async () => {
      const { initMetaPixel } = await import('@/lib/meta-ads');
      
      initMetaPixel('123456789012345');
      
      // Verify fbq was called for initialization
      expect(mockFbq).toHaveBeenCalledWith('init', '123456789012345');
      expect(mockFbq).toHaveBeenCalledWith('track', 'PageView');
    });
  });

  describe('trackMetaPhotoUpload', () => {
    it('should track Lead event with correct data', async () => {
      const { trackMetaPhotoUpload } = await import('@/lib/meta-ads');
      
      const eventId = trackMetaPhotoUpload(2, {
        email: 'test@example.com',
        name: 'Test User'
      });
      
      expect(mockFbq).toHaveBeenCalledWith('track', 'Lead', expect.objectContaining({
        value: 2,
        currency: 'CAD',
        content_name: 'Photo Upload',
        content_category: 'engagement'
      }));
      
      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe('string');
    });

    it('should work without user data', async () => {
      const { trackMetaPhotoUpload } = await import('@/lib/meta-ads');
      
      trackMetaPhotoUpload(2);
      
      expect(mockFbq).toHaveBeenCalledWith('track', 'Lead', expect.any(Object));
    });

    it('should generate unique event IDs', async () => {
      const { trackMetaPhotoUpload } = await import('@/lib/meta-ads');
      
      const eventId1 = trackMetaPhotoUpload(2, { email: 'user1@example.com' });
      const eventId2 = trackMetaPhotoUpload(2, { email: 'user2@example.com' });
      
      expect(eventId1).not.toBe(eventId2);
    });
  });

  describe('trackMetaArtworkGeneration', () => {
    it('should track ViewContent event for artwork generation', async () => {
      const { trackMetaArtworkGeneration } = await import('@/lib/meta-ads');
      
      const artworkId = 'artwork_123';
      const eventId = trackMetaArtworkGeneration(artworkId, 8, {
        email: 'test@example.com'
      });
      
      expect(mockFbq).toHaveBeenCalledWith('track', 'ViewContent', expect.objectContaining({
        value: 8,
        currency: 'CAD',
        content_name: 'Artwork Generation',
        content_category: 'artwork',
        content_ids: [artworkId]
      }));
      
      expect(eventId).toBeDefined();
    });

    it('should include artwork ID in content_ids', async () => {
      const { trackMetaArtworkGeneration } = await import('@/lib/meta-ads');
      
      trackMetaArtworkGeneration('artwork_456', 8);
      
      const call = mockFbq.mock.calls.find(call => call[0] === 'track');
      expect(call?.[2].content_ids).toEqual(['artwork_456']);
    });
  });

  describe('trackMetaArtworkView', () => {
    it('should track ViewContent event for artwork page views', async () => {
      const { trackMetaArtworkView } = await import('@/lib/meta-ads');
      
      trackMetaArtworkView('artwork_789', 1);
      
      expect(mockFbq).toHaveBeenCalledWith('track', 'ViewContent', expect.objectContaining({
        value: 1,
        currency: 'CAD',
        content_name: 'Artwork Page View',
        content_category: 'artwork',
        content_ids: ['artwork_789']
      }));
    });
  });

  describe('trackMetaBeginCheckout', () => {
    it('should track InitiateCheckout event', async () => {
      const { trackMetaBeginCheckout } = await import('@/lib/meta-ads');
      
      const eventId = trackMetaBeginCheckout('art_print', 79, 'CAD');
      
      expect(mockFbq).toHaveBeenCalledWith('track', 'InitiateCheckout', expect.objectContaining({
        value: 79,
        currency: 'CAD',
        content_name: 'PawPop art_print',
        content_category: 'pet_art',
        content_ids: ['pawpop_art_print'],
        num_items: 1
      }));
      
      expect(eventId).toBeDefined();
    });

    it('should handle different product types', async () => {
      const { trackMetaBeginCheckout } = await import('@/lib/meta-ads');
      
      trackMetaBeginCheckout('canvas_framed', 129, 'CAD');
      
      const call = mockFbq.mock.calls.find(call => call[0] === 'track');
      expect(call?.[2].content_ids).toEqual(['pawpop_canvas_framed']);
    });
  });

  describe('trackMetaPurchase', () => {
    it('should track Purchase event with order details', async () => {
      const { trackMetaPurchase } = await import('@/lib/meta-ads');
      
      const orderId = 'order_123';
      const eventId = trackMetaPurchase(orderId, 99.99, 'art_print', 'CAD', {
        email: 'customer@example.com',
        name: 'Customer Name'
      });
      
      expect(mockFbq).toHaveBeenCalledWith('track', 'Purchase', expect.objectContaining({
        value: 99.99,
        currency: 'CAD',
        content_name: 'PawPop art_print',
        content_category: 'pet_art',
        content_ids: ['pawpop_art_print'],
        content_type: 'product',
        num_items: 1
      }));
      
      expect(eventId).toBeDefined();
    });

    it('should handle different currencies', async () => {
      const { trackMetaPurchase } = await import('@/lib/meta-ads');
      
      trackMetaPurchase('order_456', 75, 'digital', 'USD');
      
      const call = mockFbq.mock.calls.find(call => call[0] === 'track');
      expect(call?.[2].currency).toBe('USD');
    });
  });

  describe('setMetaAdvancedMatching', () => {
    it('should reinitialize pixel with advanced matching data', async () => {
      const { setMetaAdvancedMatching } = await import('@/lib/meta-ads');
      
      // Set env var for dynamic reading
      process.env.NEXT_PUBLIC_META_PIXEL_ID = '123456789012345';
      
      setMetaAdvancedMatching({
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        city: 'Vancouver',
        state: 'BC',
        zip: 'V6B 5T1',
        country: 'CA'
      });
      
      expect(mockFbq).toHaveBeenCalledWith('init', '123456789012345', expect.objectContaining({
        em: 'user@example.com',
        fn: 'John',
        ln: 'Doe',
        ct: 'Vancouver',
        st: 'BC',
        zp: 'V6B 5T1',
        country: 'CA'
      }));
    });

    it('should handle partial user data', async () => {
      const { setMetaAdvancedMatching } = await import('@/lib/meta-ads');
      
      process.env.NEXT_PUBLIC_META_PIXEL_ID = '123456789012345';
      
      setMetaAdvancedMatching({
        email: 'user@example.com'
      });
      
      expect(mockFbq).toHaveBeenCalledWith('init', '123456789012345', expect.objectContaining({
        em: 'user@example.com'
      }));
    });
  });

  describe('trackMetaCustomEvent', () => {
    it('should track custom events', async () => {
      const { trackMetaCustomEvent } = await import('@/lib/meta-ads');
      
      trackMetaCustomEvent('CustomEventName', {
        custom_param: 'value'
      });
      
      expect(mockFbq).toHaveBeenCalledWith('trackCustom', 'CustomEventName', {
        custom_param: 'value'
      });
    });

    it('should handle custom events without data', async () => {
      const { trackMetaCustomEvent } = await import('@/lib/meta-ads');
      
      trackMetaCustomEvent('SimpleEvent');
      
      expect(mockFbq).toHaveBeenCalledWith('trackCustom', 'SimpleEvent', {});
    });
  });

  describe('Error Handling', () => {
    it('should not crash if fbq is not available', async () => {
      global.window = {} as any;
      
      const { trackMetaPhotoUpload } = await import('@/lib/meta-ads');
      
      expect(() => {
        trackMetaPhotoUpload(2);
      }).not.toThrow();
    });

    it('should handle missing environment variables gracefully', async () => {
      delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
      
      const { META_PIXEL_ID } = await import('@/lib/meta-ads');
      
      expect(META_PIXEL_ID).toBeUndefined();
    });
  });
});
