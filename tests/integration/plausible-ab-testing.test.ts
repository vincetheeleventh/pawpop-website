// tests/integration/plausible-ab-testing.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDynamicPricing } from '@/lib/copy';
import { plausible, plausibleTestUtils, PRICE_VARIANTS } from '@/lib/plausible';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock Plausible script
const mockPlausible = vi.fn();
Object.defineProperty(window, 'plausible', {
  value: mockPlausible,
  writable: true,
});

describe('Plausible A/B Testing Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    Date.now = vi.fn(() => 1640995200000);
  });

  afterEach(() => {
    plausibleTestUtils.clearVariant();
  });

  describe('Price Variant Assignment Flow', () => {
    it('should assign variant and track assignment event', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.3);
      
      const variant = plausible.getPriceVariant();
      
      expect(variant).toBe('A');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pawpop_price_variant',
        'A'
      );
      expect(mockPlausible).toHaveBeenCalledWith('Price Variant Assigned', {
        props: {
          variant: 'A',
          label: 'Standard Pricing',
          price_variant: 'A',
          variant_label: 'Standard Pricing'
        }
      });
    });

    it('should persist variant across sessions', () => {
      // First session - assign variant A
      vi.spyOn(Math, 'random').mockReturnValue(0.3);
      plausible.getPriceVariant();
      
      // Clear mocks to simulate new session
      vi.clearAllMocks();
      
      // Mock stored variant
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'pawpop_price_variant') return 'A';
        if (key === 'pawpop_price_variant_expiry') return (Date.now() + 1000000).toString();
        return null;
      });
      
      // Second session - should use stored variant
      const variant = plausible.getPriceVariant();
      
      expect(variant).toBe('A');
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      expect(mockPlausible).not.toHaveBeenCalled();
    });

    it('should handle variant expiration correctly', () => {
      // Set up expired variant
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'pawpop_price_variant') return 'A';
        if (key === 'pawpop_price_variant_expiry') return (Date.now() - 1000).toString();
        return null;
      });
      
      vi.spyOn(Math, 'random').mockReturnValue(0.8);
      
      const variant = plausible.getPriceVariant();
      
      expect(variant).toBe('B');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'pawpop_price_variant',
        'B'
      );
    });
  });

  describe('Dynamic Pricing Integration', () => {
    it('should return variant A pricing', () => {
      plausibleTestUtils.forceVariant('A');
      
      const pricing = getDynamicPricing();
      
      expect(pricing.variant).toBe('A');
      expect(pricing.variantLabel).toBe('Standard Pricing');
      expect(pricing.options).toHaveLength(3);
      
      const digitalOption = pricing.options.find(opt => opt.name === 'Digital Portrait');
      const printOption = pricing.options.find(opt => opt.name === 'Premium Print');
      const canvasOption = pricing.options.find(opt => opt.name === 'Framed Canvas');
      
      expect(digitalOption?.price).toBe('$29');
      expect(digitalOption?.numericPrice).toBe(29);
      expect(printOption?.price).toBe('$79');
      expect(printOption?.numericPrice).toBe(79);
      expect(canvasOption?.price).toBe('$129');
      expect(canvasOption?.numericPrice).toBe(129);
    });

    it('should return variant B pricing', () => {
      plausibleTestUtils.forceVariant('B');
      
      const pricing = getDynamicPricing();
      
      expect(pricing.variant).toBe('B');
      expect(pricing.variantLabel).toBe('Premium Pricing');
      
      const digitalOption = pricing.options.find(opt => opt.name === 'Digital Portrait');
      const printOption = pricing.options.find(opt => opt.name === 'Premium Print');
      const canvasOption = pricing.options.find(opt => opt.name === 'Framed Canvas');
      
      expect(digitalOption?.price).toBe('$39');
      expect(digitalOption?.numericPrice).toBe(39);
      expect(printOption?.price).toBe('$89');
      expect(printOption?.numericPrice).toBe(89);
      expect(canvasOption?.price).toBe('$149');
      expect(canvasOption?.numericPrice).toBe(149);
    });

    it('should handle errors gracefully with fallback pricing', () => {
      // Force an error in getPriceConfig
      vi.spyOn(plausible, 'getPriceConfig').mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const pricing = getDynamicPricing();
      
      expect(pricing.variant).toBe('A');
      expect(pricing.variantLabel).toBe('Standard Pricing');
      expect(pricing.options[0].numericPrice).toBe(29); // Fallback to static pricing
    });
  });

  describe('Conversion Tracking by Variant', () => {
    it('should track conversions with variant context for variant A', () => {
      plausibleTestUtils.forceVariant('A');
      
      plausible.trackConversion('Purchase', 79, { product_type: 'print' });
      
      expect(mockPlausible).toHaveBeenCalledWith('Conversion: Purchase', {
        props: {
          conversion_type: 'Purchase',
          digital_price: 29,
          print_price: 79,
          canvas_price: 129,
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

    it('should track conversions with variant context for variant B', () => {
      plausibleTestUtils.forceVariant('B');
      
      plausible.trackConversion('Purchase', 89, { product_type: 'print' });
      
      expect(mockPlausible).toHaveBeenCalledWith('Conversion: Purchase', {
        props: {
          conversion_type: 'Purchase',
          digital_price: 39,
          print_price: 89,
          canvas_price: 149,
          product_type: 'print',
          price_variant: 'B',
          variant_label: 'Premium Pricing',
          amount: 89,
          currency: 'USD'
        },
        revenue: {
          currency: 'USD',
          amount: 89
        }
      });
    });
  });

  describe('Funnel Analysis by Variant', () => {
    it('should track complete funnel for variant A', () => {
      plausibleTestUtils.forceVariant('A');
      
      // Step 1: Landing page
      plausible.trackFunnelStep('Landing Page View', 1);
      
      // Step 2: Upload modal
      plausible.trackFunnelStep('Upload Modal Opened', 2);
      
      // Step 3: Photo upload
      plausible.trackFunnelStep('Photo Uploaded', 3, { file_type: 'image/jpeg' });
      
      // Step 4: Artwork generation
      plausible.trackFunnelStep('Artwork Generation Started', 4);
      
      // Step 5: Artwork completed
      plausible.trackFunnelStep('Artwork Completed', 5, { generation_time_seconds: 120 });
      
      // Step 6: Purchase modal
      plausible.trackFunnelStep('Purchase Modal Opened', 7, { product_type: 'print' });
      
      // Step 7: Purchase completed
      plausible.trackConversion('Purchase', 79, { product_type: 'print' });
      
      // Verify all events have variant context
      expect(mockPlausible).toHaveBeenCalledTimes(7);
      
      mockPlausible.mock.calls.forEach(call => {
        expect(call[1].props.price_variant).toBe('A');
        expect(call[1].props.variant_label).toBe('Standard Pricing');
      });
    });

    it('should track variant exposure at key decision points', () => {
      plausibleTestUtils.forceVariant('B');
      
      // Track exposure when user sees pricing
      plausible.trackVariantExposure('Pricing Section', { 
        displayed_prices: 'digital:39,print:89,canvas:149' 
      });
      
      // Track exposure when user opens purchase modal
      plausible.trackVariantExposure('Purchase Modal', { 
        product_type: 'print',
        displayed_price: 89
      });
      
      expect(mockPlausible).toHaveBeenCalledWith('Variant Exposure', {
        props: {
          element: 'Pricing Section',
          displayed_prices: 'digital:39,print:89,canvas:149',
          price_variant: 'B',
          variant_label: 'Premium Pricing'
        }
      });
      
      expect(mockPlausible).toHaveBeenCalledWith('Variant Exposure', {
        props: {
          element: 'Purchase Modal',
          product_type: 'print',
          displayed_price: 89,
          price_variant: 'B',
          variant_label: 'Premium Pricing'
        }
      });
    });
  });

  describe('Performance Comparison by Variant', () => {
    it('should enable conversion rate analysis by variant', () => {
      const testScenarios = [
        { variant: 'A', conversions: 5, exposures: 100 },
        { variant: 'B', conversions: 7, exposures: 100 }
      ];
      
      testScenarios.forEach(scenario => {
        plausibleTestUtils.forceVariant(scenario.variant as 'A' | 'B');
        
        // Track exposures
        for (let i = 0; i < scenario.exposures; i++) {
          plausible.trackVariantExposure('Purchase Button', { 
            session_id: `session_${i}` 
          });
        }
        
        // Track conversions
        for (let i = 0; i < scenario.conversions; i++) {
          const price = scenario.variant === 'A' ? 79 : 89;
          plausible.trackConversion('Purchase', price, { 
            session_id: `session_${i}`,
            product_type: 'print'
          });
        }
      });
      
      // Verify tracking calls include variant context for analysis
      const variantACalls = mockPlausible.mock.calls.filter(
        call => call[1].props.price_variant === 'A'
      );
      const variantBCalls = mockPlausible.mock.calls.filter(
        call => call[1].props.price_variant === 'B'
      );
      
      expect(variantACalls).toHaveLength(105); // 100 exposures + 5 conversions
      expect(variantBCalls).toHaveLength(107); // 100 exposures + 7 conversions
    });
  });

  describe('Revenue Analysis by Variant', () => {
    it('should track revenue differences between variants', () => {
      const variantARevenue = [];
      const variantBRevenue = [];
      
      // Simulate 10 purchases for each variant
      for (let i = 0; i < 10; i++) {
        // Variant A purchases
        plausibleTestUtils.forceVariant('A');
        const priceA = 79; // Print price for variant A
        plausible.trackConversion('Purchase', priceA, { product_type: 'print' });
        variantARevenue.push(priceA);
        
        // Variant B purchases
        plausibleTestUtils.forceVariant('B');
        const priceB = 89; // Print price for variant B
        plausible.trackConversion('Purchase', priceB, { product_type: 'print' });
        variantBRevenue.push(priceB);
      }
      
      // Calculate expected revenue
      const totalRevenueA = variantARevenue.reduce((sum, price) => sum + price, 0);
      const totalRevenueB = variantBRevenue.reduce((sum, price) => sum + price, 0);
      
      expect(totalRevenueA).toBe(790); // 10 × $79
      expect(totalRevenueB).toBe(890); // 10 × $89
      expect(totalRevenueB - totalRevenueA).toBe(100); // $10 difference per purchase
      
      // Verify revenue tracking calls
      const revenueCalls = mockPlausible.mock.calls.filter(
        call => call[1].revenue
      );
      
      expect(revenueCalls).toHaveLength(20); // 10 for each variant
    });
  });

  describe('Statistical Significance Helpers', () => {
    it('should provide data structure for statistical analysis', () => {
      const testData = {
        variantA: { exposures: 1000, conversions: 50, revenue: 3950 },
        variantB: { exposures: 1000, conversions: 65, revenue: 5785 }
      };
      
      // Simulate the test data
      (['A', 'B'] as const).forEach(variant => {
        plausibleTestUtils.forceVariant(variant);
        const data = testData[`variant${variant}` as keyof typeof testData];
        const price = variant === 'A' ? 79 : 89;
        
        // Track test assignment
        plausible.trackEvent('AB Test Variant Assigned', {
          test_name: 'Price Test',
          variant: variant,
          sample_size: data.exposures
        });
        
        // Track summary metrics
        plausible.trackEvent('AB Test Results', {
          test_name: 'Price Test',
          variant: variant,
          exposures: data.exposures,
          conversions: data.conversions,
          conversion_rate: (data.conversions / data.exposures * 100).toFixed(2),
          revenue: data.revenue,
          average_order_value: (data.revenue / data.conversions).toFixed(2)
        });
      });
      
      // Verify test result tracking
      const testResultCalls = mockPlausible.mock.calls.filter(
        call => call[0] === 'AB Test Results'
      );
      
      expect(testResultCalls).toHaveLength(2);
      
      const variantAResults = testResultCalls.find(
        call => call[1].props.variant === 'A'
      );
      const variantBResults = testResultCalls.find(
        call => call[1].props.variant === 'B'
      );
      
      expect(variantAResults?.[1].props.conversion_rate).toBe('5.00');
      expect(variantBResults?.[1].props.conversion_rate).toBe('6.50');
      expect(variantBResults?.[1].props.average_order_value).toBe('89.00');
    });
  });
});
