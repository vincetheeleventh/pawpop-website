// tests/lib/google-ads.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock window.gtag and dataLayer
const mockGtag = vi.fn();
const mockDataLayer: any[] = [];

Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
});

Object.defineProperty(window, 'dataLayer', {
  value: mockDataLayer,
  writable: true,
});

// Import the functions to test
import {
  initGoogleAds,
  trackPhotoUpload,
  trackArtworkGeneration,
  trackPurchase,
  trackArtworkView,
  trackAddToCart,
  trackBeginCheckout,
  GOOGLE_ADS_CONVERSIONS
} from '@/lib/google-ads';

describe('Google Ads Conversion Tracking', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
    mockDataLayer.length = 0;
    
    // Reset DOM
    document.head.innerHTML = '';
  });

  describe('initGoogleAds', () => {
    it('should initialize Google Ads tracking with correct script', () => {
      const conversionId = 'AW-123456789';
      
      initGoogleAds(conversionId);
      
      // Check if script was added to head
      const scripts = document.head.querySelectorAll('script');
      expect(scripts.length).toBe(1);
      expect(scripts[0].src).toBe(`https://www.googletagmanager.com/gtag/js?id=${conversionId}`);
      expect(scripts[0].async).toBe(true);
    });

    it('should initialize gtag function and dataLayer', () => {
      const conversionId = 'AW-123456789';
      
      initGoogleAds(conversionId);
      
      expect(window.dataLayer).toBeDefined();
      expect(window.gtag).toBeDefined();
    });

    it('should call gtag config with conversion ID', () => {
      const conversionId = 'AW-123456789';
      
      initGoogleAds(conversionId);
      
      expect(mockGtag).toHaveBeenCalledWith('js', expect.any(Date));
      expect(mockGtag).toHaveBeenCalledWith('config', conversionId);
    });

    it('should not run on server side', () => {
      // Mock server environment
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      initGoogleAds('AW-123456789');
      
      expect(document.head.querySelectorAll('script').length).toBe(0);
      
      // Restore window
      global.window = originalWindow;
    });
  });

  describe('trackPhotoUpload', () => {
    it('should track photo upload conversion with correct data', () => {
      trackPhotoUpload(5);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
        send_to: GOOGLE_ADS_CONVERSIONS.PHOTO_UPLOAD,
        value: 5,
        currency: 'CAD',
        custom_parameters: {
          event_category: 'engagement',
          event_label: 'photo_upload_completed'
        }
      });
    });

    it('should track GA4 event for photo upload', () => {
      trackPhotoUpload(5);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'photo_upload_completed', {
        event_category: 'engagement',
        event_label: 'lead_generation',
        value: 5,
        currency: 'CAD'
      });
    });

    it('should use default value when not provided', () => {
      trackPhotoUpload();
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', 
        expect.objectContaining({ value: 5 })
      );
    });

    it('should not run on server side', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      trackPhotoUpload(5);
      
      expect(mockGtag).not.toHaveBeenCalled();
      
      global.window = originalWindow;
    });
  });

  describe('trackArtworkGeneration', () => {
    it('should track artwork generation conversion with artwork ID', () => {
      const artworkId = 'artwork_123';
      
      trackArtworkGeneration(artworkId, 15);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
        send_to: GOOGLE_ADS_CONVERSIONS.ARTWORK_GENERATION,
        value: 15,
        currency: 'CAD',
        custom_parameters: {
          event_category: 'engagement',
          event_label: 'artwork_generation_completed',
          artwork_id: artworkId
        }
      });
    });

    it('should track GA4 event with artwork ID', () => {
      const artworkId = 'artwork_123';
      
      trackArtworkGeneration(artworkId, 15);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'artwork_generation_completed', {
        event_category: 'engagement',
        event_label: 'qualified_lead',
        value: 15,
        currency: 'CAD',
        artwork_id: artworkId
      });
    });
  });

  describe('trackPurchase', () => {
    it('should track purchase conversion with order details', () => {
      const orderId = 'order_123';
      const value = 99.99;
      const productType = 'CANVAS_FRAMED';
      
      trackPurchase(orderId, value, productType, 'CAD');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
        send_to: GOOGLE_ADS_CONVERSIONS.PURCHASE,
        value: value,
        currency: 'CAD',
        transaction_id: orderId,
        custom_parameters: {
          event_category: 'ecommerce',
          event_label: 'purchase_completed',
          product_type: productType
        }
      });
    });

    it('should track enhanced ecommerce purchase event', () => {
      const orderId = 'order_123';
      const value = 99.99;
      const productType = 'CANVAS_FRAMED';
      
      trackPurchase(orderId, value, productType, 'CAD');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'purchase', {
        transaction_id: orderId,
        value: value,
        currency: 'CAD',
        items: [{
          item_id: `pawpop_${productType}`,
          item_name: `PawPop ${productType}`,
          category: 'pet_art',
          quantity: 1,
          price: value
        }]
      });
    });

    it('should use default currency when not provided', () => {
      trackPurchase('order_123', 99.99, 'CANVAS_FRAMED');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', 
        expect.objectContaining({ currency: 'CAD' })
      );
    });
  });

  describe('trackArtworkView', () => {
    it('should track artwork view conversion', () => {
      const artworkId = 'artwork_123';
      
      trackArtworkView(artworkId, 2);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
        send_to: GOOGLE_ADS_CONVERSIONS.ARTWORK_VIEW,
        value: 2,
        currency: 'CAD',
        custom_parameters: {
          event_category: 'engagement',
          event_label: 'artwork_page_viewed',
          artwork_id: artworkId
        }
      });
    });
  });

  describe('trackAddToCart', () => {
    it('should track add to cart event', () => {
      const productType = 'CANVAS_FRAMED';
      const value = 99.99;
      
      trackAddToCart(productType, value, 'CAD');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'add_to_cart', {
        currency: 'CAD',
        value: value,
        items: [{
          item_id: `pawpop_${productType}`,
          item_name: `PawPop ${productType}`,
          category: 'pet_art',
          quantity: 1,
          price: value
        }]
      });
    });
  });

  describe('trackBeginCheckout', () => {
    it('should track begin checkout event', () => {
      const productType = 'CANVAS_FRAMED';
      const value = 99.99;
      
      trackBeginCheckout(productType, value, 'CAD');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'begin_checkout', {
        currency: 'CAD',
        value: value,
        items: [{
          item_id: `pawpop_${productType}`,
          item_name: `PawPop ${productType}`,
          category: 'pet_art',
          quantity: 1,
          price: value
        }]
      });
    });
  });

  describe('Environment Variables', () => {
    it('should use environment variables for conversion IDs', () => {
      expect(GOOGLE_ADS_CONVERSIONS.PHOTO_UPLOAD).toBeDefined();
      expect(GOOGLE_ADS_CONVERSIONS.ARTWORK_GENERATION).toBeDefined();
      expect(GOOGLE_ADS_CONVERSIONS.PURCHASE).toBeDefined();
      expect(GOOGLE_ADS_CONVERSIONS.ARTWORK_VIEW).toBeDefined();
    });

    it('should fallback to placeholder when env vars not set', () => {
      // These should be placeholder values when env vars aren't set
      expect(GOOGLE_ADS_CONVERSIONS.PHOTO_UPLOAD).toContain('AW-CONVERSION_ID');
    });
  });
});
