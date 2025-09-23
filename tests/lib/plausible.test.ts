// tests/lib/plausible.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { plausible, plausibleTestUtils, PRICE_VARIANTS } from '@/lib/plausible';

// Mock window and localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

const mockPlausible = vi.fn();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

Object.defineProperty(window, 'plausible', {
  value: mockPlausible,
  writable: true,
});

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: 'pawpopart.com'
  }
}));

describe('Plausible Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    Date.now = vi.fn(() => 1640995200000); // Fixed timestamp
    
    // Initialize Plausible for testing
    plausibleTestUtils.initializeForTesting('pawpopart.com');
  });

  afterEach(() => {
    plausibleTestUtils.clearVariant();
  });

  describe('Price Variant Assignment', () => {
    it('should assign variant A or B randomly', () => {
      // Mock Math.random to return 0.3 (should assign variant A)
      vi.spyOn(Math, 'random').mockReturnValue(0.3);
      
      const variant = plausible.getPriceVariant();
      expect(variant).toBe('A');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pawpop_price_variant',
        'A'
      );
    });

    it('should assign variant B when random > 0.5', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.7);
      
      const variant = plausible.getPriceVariant();
      expect(variant).toBe('B');
    });

    it('should persist variant assignment', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'pawpop_price_variant') return 'B';
        if (key === 'pawpop_price_variant_expiry') return (Date.now() + 1000000).toString();
        return null;
      });

      const variant = plausible.getPriceVariant();
      expect(variant).toBe('B');
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should reassign expired variant', () => {
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'pawpop_price_variant') return 'A';
        if (key === 'pawpop_price_variant_expiry') return (Date.now() - 1000).toString();
        return null;
      });

      vi.spyOn(Math, 'random').mockReturnValue(0.8);
      
      const variant = plausible.getPriceVariant();
      expect(variant).toBe('B');
    });
  });

  describe('Price Configuration', () => {
    it('should return correct prices for variant A', () => {
      plausibleTestUtils.forceVariant('A');
      
      const config = plausible.getPriceConfig();
      expect(config).toEqual({
        variant: 'A',
        digital: 29,
        print: 79,
        canvas: 129,
        label: 'Standard Pricing'
      });
    });

    it('should return correct prices for variant B', () => {
      plausibleTestUtils.forceVariant('B');
      
      const config = plausible.getPriceConfig();
      expect(config).toEqual({
        variant: 'B',
        digital: 39,
        print: 89,
        canvas: 149,
        label: 'Premium Pricing'
      });
    });
  });

  describe('Event Tracking', () => {
    beforeEach(() => {
      plausibleTestUtils.forceVariant('A');
    });

    it('should track events with price variant context', () => {
      plausible.trackEvent('Test Event', { custom_prop: 'value' });

      expect(mockPlausible).toHaveBeenCalledWith('Test Event', {
        props: {
          custom_prop: 'value',
          price_variant: 'A',
          variant_label: 'Standard Pricing'
        }
      });
    });

    it('should track revenue events', () => {
      plausible.trackRevenue('Purchase', 79, 'USD', { product_type: 'print' });

      expect(mockPlausible).toHaveBeenCalledWith('Purchase', {
        props: {
          product_type: 'print',
          price_variant: 'A',
          variant_label: 'Standard Pricing',
          amount: 79,
          currency: 'USD'
        },
        revenue: {
          currency: 'USD',
          amount: 79
        }
      });
    });

    it('should track conversions with price context', () => {
      plausible.trackConversion('Purchase', 129, { product_type: 'canvas' });

      expect(mockPlausible).toHaveBeenCalledWith('Conversion: Purchase', {
        props: {
          conversion_type: 'Purchase',
          digital_price: 29,
          print_price: 79,
          canvas_price: 129,
          product_type: 'canvas',
          price_variant: 'A',
          variant_label: 'Standard Pricing',
          amount: 129,
          currency: 'USD'
        },
        revenue: {
          currency: 'USD',
          amount: 129
        }
      });
    });

    it('should track funnel steps', () => {
      plausible.trackFunnelStep('Upload Photo', 1, { file_size: 1024 });

      expect(mockPlausible).toHaveBeenCalledWith('Funnel Step', {
        props: {
          step: 'Upload Photo',
          step_number: 1,
          file_size: 1024,
          price_variant: 'A',
          variant_label: 'Standard Pricing'
        }
      });
    });

    it('should track variant exposure', () => {
      plausible.trackVariantExposure('Purchase Button', { product_type: 'digital' });

      expect(mockPlausible).toHaveBeenCalledWith('Variant Exposure', {
        props: {
          element: 'Purchase Button',
          product_type: 'digital',
          price_variant: 'A',
          variant_label: 'Standard Pricing'
        }
      });
    });
  });

  describe('Fallback Behavior', () => {
    it('should handle missing Plausible script gracefully', () => {
      window.plausible = undefined;
      
      expect(() => {
        plausible.trackEvent('Test Event');
      }).not.toThrow();
    });

    it('should handle localStorage errors', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const variant = plausible.getPriceVariant();
      expect(variant).toBe('A'); // Should fallback to variant A
    });

    it('should work without environment variables', () => {
      // Test without NEXT_PUBLIC_PLAUSIBLE_DOMAIN
      vi.doUnmock('process');
      vi.mock('process', () => ({
        env: {}
      }));

      expect(() => {
        plausible.trackEvent('Test Event');
      }).not.toThrow();
    });
  });

  describe('Test Utilities', () => {
    it('should force variant assignment', () => {
      plausibleTestUtils.forceVariant('B');
      
      const variant = plausible.getPriceVariant();
      expect(variant).toBe('B');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pawpop_price_variant',
        'B'
      );
    });

    it('should clear variant assignment', () => {
      plausibleTestUtils.clearVariant();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('pawpop_price_variant');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('pawpop_price_variant_expiry');
    });

    it('should provide analytics summary', () => {
      plausibleTestUtils.forceVariant('A');
      
      const summary = plausibleTestUtils.getAnalyticsSummary();
      expect(summary).toEqual({
        isEnabled: true,
        domain: 'pawpopart.com',
        currentVariant: 'A',
        priceConfig: {
          variant: 'A',
          digital: 15,
          print: 29,
          printMid: 39,
          printLarge: 48,
          canvas: 59,
          canvasMid: 79,
          canvasLarge: 99,
          canvasFramed: 99,
          canvasFramedMid: 119,
          canvasFramedLarge: 149,
          label: 'Standard Pricing'
        }
      });
    });
  });

  describe('Price Variants Configuration', () => {
    it('should have correct variant A configuration', () => {
      expect(PRICE_VARIANTS.A).toEqual({
        variant: 'A',
        digital: 15,
        print: 29,
        printMid: 39,
        printLarge: 48,
        canvas: 59,
        canvasMid: 79,
        canvasLarge: 99,
        canvasFramed: 99,
        canvasFramedMid: 119,
        canvasFramedLarge: 149,
        label: 'Standard Pricing'
      });
    });

    it('should have correct variant B configuration', () => {
      expect(PRICE_VARIANTS.B).toEqual({
        variant: 'B',
        digital: 45,
        print: 79,
        printMid: 95,
        printLarge: 115,
        canvas: 95,
        canvasMid: 135,
        canvasLarge: 175,
        canvasFramed: 145,
        canvasFramedMid: 185,
        canvasFramedLarge: 225,
        label: 'Premium Pricing'
      });
    });
  });

  describe('Integration with Copy System', () => {
    it('should work with getDynamicPricing function', async () => {
      plausibleTestUtils.forceVariant('B');
      
      // Import getDynamicPricing to test integration
      const { getDynamicPricing } = await import('@/lib/copy');
      const pricing = getDynamicPricing();
      
      expect(pricing.variant).toBe('B');
      expect(pricing.variantLabel).toBe('Premium Pricing');
      expect(pricing.options[0].numericPrice).toBe(45); // Digital
      expect(pricing.options[1].numericPrice).toBe(79); // Print
      expect(pricing.options[2].numericPrice).toBe(145); // Canvas Framed
    });
  });
});

describe('Plausible Analytics Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle concurrent variant assignments', () => {
    // Simulate multiple rapid calls
    const variants = [];
    for (let i = 0; i < 10; i++) {
      variants.push(plausible.getPriceVariant());
    }
    
    // All should return the same variant
    const uniqueVariants = Array.from(new Set(variants));
    expect(uniqueVariants).toHaveLength(1);
  });

  it('should handle large event payloads', () => {
    const largeProps: Record<string, string> = {};
    for (let i = 0; i < 100; i++) {
      largeProps[`prop_${i}`] = `value_${i}`;
    }
    
    expect(() => {
      plausible.trackEvent('Large Event', largeProps);
    }).not.toThrow();
  });

  it('should handle special characters in event names', () => {
    const specialEventName = 'Test Event 🎨 with émojis & spëcial chars!';
    
    expect(() => {
      plausible.trackEvent(specialEventName, { test: true });
    }).not.toThrow();
  });
});
