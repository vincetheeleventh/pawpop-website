// tests/hooks/usePlausibleTracking.test.tsx

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import usePlausibleTracking from '@/hooks/usePlausibleTracking';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn()
}));

// Mock plausible library
vi.mock('@/lib/plausible', () => ({
  trackEvent: vi.fn(),
  trackRevenue: vi.fn(),
  trackFunnelStep: vi.fn(),
  trackConversion: vi.fn(),
  trackVariantExposure: vi.fn(),
  getPriceVariant: vi.fn(() => 'A'),
  getPriceConfig: vi.fn(() => ({
    variant: 'A',
    digital: 29,
    print: 79,
    canvas: 129,
    label: 'Standard Pricing'
  }))
}));

const mockUsePathname = usePathname as ReturnType<typeof vi.fn>;

describe('usePlausibleTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/test-path');
  });

  it('should track page view on pathname change', () => {
    const { trackEvent } = require('@/lib/plausible');
    
    renderHook(() => usePlausibleTracking());
    
    expect(trackEvent).toHaveBeenCalledWith('Page View', {
      path: '/test-path',
      timestamp: expect.any(String)
    });
  });

  it('should track page view when pathname changes', () => {
    const { trackEvent } = require('@/lib/plausible');
    const { rerender } = renderHook(() => usePlausibleTracking());
    
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/new-path');
    
    rerender();
    
    expect(trackEvent).toHaveBeenCalledWith('Page View', {
      path: '/new-path',
      timestamp: expect.any(String)
    });
  });

  describe('Funnel Tracking', () => {
    it('should provide funnel tracking functions', () => {
      const { result } = renderHook(() => usePlausibleTracking());
      const { trackFunnel } = result.current;
      
      expect(trackFunnel).toBeDefined();
      expect(typeof trackFunnel.landingPageView).toBe('function');
      expect(typeof trackFunnel.uploadModalOpened).toBe('function');
      expect(typeof trackFunnel.photoUploaded).toBe('function');
      expect(typeof trackFunnel.artworkGenerationStarted).toBe('function');
      expect(typeof trackFunnel.artworkCompleted).toBe('function');
      expect(typeof trackFunnel.artworkPageViewed).toBe('function');
      expect(typeof trackFunnel.purchaseModalOpened).toBe('function');
      expect(typeof trackFunnel.productSelected).toBe('function');
      expect(typeof trackFunnel.checkoutInitiated).toBe('function');
      expect(typeof trackFunnel.purchaseCompleted).toBe('function');
    });

    it('should track landing page view', () => {
      const { trackFunnelStep } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackFunnel.landingPageView();
      
      expect(trackFunnelStep).toHaveBeenCalledWith('Landing Page View', 1, {
        path: '/test-path'
      });
    });

    it('should track photo upload with optional parameters', () => {
      const { trackFunnelStep } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackFunnel.photoUploaded(1024, 'image/jpeg');
      
      expect(trackFunnelStep).toHaveBeenCalledWith('Photo Uploaded', 3, {
        file_size: 1024,
        file_type: 'image/jpeg'
      });
    });

    it('should track photo upload without optional parameters', () => {
      const { trackFunnelStep } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackFunnel.photoUploaded();
      
      expect(trackFunnelStep).toHaveBeenCalledWith('Photo Uploaded', 3, {});
    });

    it('should track artwork completion with generation time', () => {
      const { trackFunnelStep } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackFunnel.artworkCompleted(120);
      
      expect(trackFunnelStep).toHaveBeenCalledWith('Artwork Completed', 5, {
        generation_time_seconds: 120
      });
    });

    it('should track purchase completion with conversion', () => {
      const { trackFunnelStep, trackConversion } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackFunnel.purchaseCompleted('canvas', 129, 'order_123');
      
      expect(trackFunnelStep).toHaveBeenCalledWith('Purchase Completed', 10, {
        product_type: 'canvas',
        price: 129,
        order_id: 'order_123'
      });
      
      expect(trackConversion).toHaveBeenCalledWith('Purchase', 129, {
        product_type: 'canvas',
        price: 129,
        order_id: 'order_123'
      });
    });
  });

  describe('Price Exposure Tracking', () => {
    it('should track price exposure with product details', () => {
      const { trackVariantExposure } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackPriceExposure('Purchase Button', 'digital', 29);
      
      expect(trackVariantExposure).toHaveBeenCalledWith('Purchase Button', {
        product_type: 'digital',
        displayed_price: 29,
        variant_digital_price: 29,
        variant_print_price: 79,
        variant_canvas_price: 129
      });
    });

    it('should track price exposure without optional parameters', () => {
      const { trackVariantExposure } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackPriceExposure('Pricing Section');
      
      expect(trackVariantExposure).toHaveBeenCalledWith('Pricing Section', {
        variant_digital_price: 29,
        variant_print_price: 79,
        variant_canvas_price: 129
      });
    });
  });

  describe('Interaction Tracking', () => {
    it('should provide interaction tracking functions', () => {
      const { result } = renderHook(() => usePlausibleTracking());
      const { trackInteraction } = result.current;
      
      expect(trackInteraction).toBeDefined();
      expect(typeof trackInteraction.buttonClick).toBe('function');
      expect(typeof trackInteraction.formStart).toBe('function');
      expect(typeof trackInteraction.formComplete).toBe('function');
      expect(typeof trackInteraction.modalOpen).toBe('function');
      expect(typeof trackInteraction.modalClose).toBe('function');
      expect(typeof trackInteraction.error).toBe('function');
      expect(typeof trackInteraction.featureUsed).toBe('function');
    });

    it('should track button clicks', () => {
      const { trackEvent } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackInteraction.buttonClick('Upload Photo', 'Hero Section');
      
      expect(trackEvent).toHaveBeenCalledWith('Button Click', {
        button_name: 'Upload Photo',
        location: 'Hero Section',
        path: '/test-path'
      });
    });

    it('should track form completion with time spent', () => {
      const { trackEvent } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackInteraction.formComplete('Upload Form', 45);
      
      expect(trackEvent).toHaveBeenCalledWith('Form Completed', {
        form_name: 'Upload Form',
        time_spent_seconds: 45,
        path: '/test-path'
      });
    });

    it('should track errors', () => {
      const { trackEvent } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackInteraction.error('Upload Error', 'File too large');
      
      expect(trackEvent).toHaveBeenCalledWith('Error Occurred', {
        error_type: 'Upload Error',
        error_message: 'File too large',
        path: '/test-path'
      });
    });

    it('should track feature usage with details', () => {
      const { trackEvent } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackInteraction.featureUsed('Photo Upload', {
        file_type: 'image/jpeg',
        file_size_mb: 2.5
      });
      
      expect(trackEvent).toHaveBeenCalledWith('Feature Used', {
        feature_name: 'Photo Upload',
        path: '/test-path',
        file_type: 'image/jpeg',
        file_size_mb: 2.5
      });
    });
  });

  describe('Performance Tracking', () => {
    it('should provide performance tracking functions', () => {
      const { result } = renderHook(() => usePlausibleTracking());
      const { trackPerformance } = result.current;
      
      expect(trackPerformance).toBeDefined();
      expect(typeof trackPerformance.pageLoad).toBe('function');
      expect(typeof trackPerformance.apiCall).toBe('function');
      expect(typeof trackPerformance.imageGeneration).toBe('function');
    });

    it('should track page load performance', () => {
      const { trackEvent } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackPerformance.pageLoad(1500);
      
      expect(trackEvent).toHaveBeenCalledWith('Page Load Performance', {
        load_time_ms: 1500,
        path: '/test-path'
      });
    });

    it('should track API performance', () => {
      const { trackEvent } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackPerformance.apiCall('/api/upload', 2000, true);
      
      expect(trackEvent).toHaveBeenCalledWith('API Performance', {
        endpoint: '/api/upload',
        response_time_ms: 2000,
        success: true,
        path: '/test-path'
      });
    });

    it('should track image generation performance', () => {
      const { trackEvent } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackPerformance.imageGeneration('MonaLisa Generation', 45, true);
      
      expect(trackEvent).toHaveBeenCalledWith('Image Generation Performance', {
        generation_type: 'MonaLisa Generation',
        generation_time_seconds: 45,
        success: true
      });
    });
  });

  describe('A/B Test Tracking', () => {
    it('should provide A/B test tracking functions', () => {
      const { result } = renderHook(() => usePlausibleTracking());
      const { trackABTest } = result.current;
      
      expect(trackABTest).toBeDefined();
      expect(typeof trackABTest.variantAssigned).toBe('function');
      expect(typeof trackABTest.variantExposed).toBe('function');
      expect(typeof trackABTest.variantConversion).toBe('function');
    });

    it('should track variant assignment', () => {
      const { trackEvent } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackABTest.variantAssigned('Price Test', 'A');
      
      expect(trackEvent).toHaveBeenCalledWith('AB Test Variant Assigned', {
        test_name: 'Price Test',
        variant: 'A'
      });
    });

    it('should track variant exposure', () => {
      const { trackEvent } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackABTest.variantExposed('Price Test', 'B', 'Purchase Button');
      
      expect(trackEvent).toHaveBeenCalledWith('AB Test Variant Exposed', {
        test_name: 'Price Test',
        variant: 'B',
        element: 'Purchase Button',
        path: '/test-path'
      });
    });

    it('should track variant conversion with revenue', () => {
      const { trackRevenue } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackABTest.variantConversion('Price Test', 'A', 'Purchase', 79);
      
      expect(trackRevenue).toHaveBeenCalledWith('AB Test Conversion', 79, 'USD', {
        test_name: 'Price Test',
        variant: 'A',
        conversion_type: 'Purchase'
      });
    });

    it('should track variant conversion without revenue', () => {
      const { trackEvent } = require('@/lib/plausible');
      const { result } = renderHook(() => usePlausibleTracking());
      
      result.current.trackABTest.variantConversion('Price Test', 'B', 'Signup');
      
      expect(trackEvent).toHaveBeenCalledWith('AB Test Conversion', {
        test_name: 'Price Test',
        variant: 'B',
        conversion_type: 'Signup'
      });
    });
  });

  describe('Utility Functions', () => {
    it('should provide price variant functions', () => {
      const { result } = renderHook(() => usePlausibleTracking());
      
      expect(result.current.getPriceVariant).toBeDefined();
      expect(result.current.getPriceConfig).toBeDefined();
      expect(result.current.currentPath).toBe('/test-path');
    });

    it('should provide core tracking functions', () => {
      const { result } = renderHook(() => usePlausibleTracking());
      
      expect(result.current.trackEvent).toBeDefined();
      expect(result.current.trackRevenue).toBeDefined();
      expect(result.current.trackConversion).toBeDefined();
    });
  });
});
