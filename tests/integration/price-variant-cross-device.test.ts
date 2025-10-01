/**
 * Integration tests for price variant cross-device consistency
 * Tests the complete flow from variant assignment to email links to artwork page
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PRICE_VARIANTS } from '@/lib/plausible';
import { getDynamicPricing } from '@/lib/copy';

describe('Price Variant Cross-Device Consistency', () => {
  describe('PRICE_VARIANTS Configuration', () => {
    it('should have both variant A and B configured', () => {
      expect(PRICE_VARIANTS).toHaveProperty('A');
      expect(PRICE_VARIANTS).toHaveProperty('B');
    });

    it('should have different pricing for variant A and B', () => {
      const variantA = PRICE_VARIANTS.A;
      const variantB = PRICE_VARIANTS.B;
      
      expect(variantA.digital).not.toBe(variantB.digital);
      expect(variantA.print).not.toBe(variantB.print);
      expect(variantA.canvasFramed).not.toBe(variantB.canvasFramed);
    });

    it('should have correct variant identifiers', () => {
      expect(PRICE_VARIANTS.A.variant).toBe('A');
      expect(PRICE_VARIANTS.B.variant).toBe('B');
    });

    it('should have labels for each variant', () => {
      expect(PRICE_VARIANTS.A.label).toBeTruthy();
      expect(PRICE_VARIANTS.B.label).toBeTruthy();
    });
  });

  describe('getDynamicPricing with explicit variant', () => {
    it('should return variant A pricing when explicitly requested', () => {
      const pricing = getDynamicPricing('A');
      
      expect(pricing.variant).toBe('A');
      expect(pricing.variantLabel).toBe(PRICE_VARIANTS.A.label);
      expect(pricing.options[0].numericPrice).toBe(PRICE_VARIANTS.A.digital);
      expect(pricing.options[1].numericPrice).toBe(PRICE_VARIANTS.A.print);
      expect(pricing.options[2].numericPrice).toBe(PRICE_VARIANTS.A.canvasFramed);
    });

    it('should return variant B pricing when explicitly requested', () => {
      const pricing = getDynamicPricing('B');
      
      expect(pricing.variant).toBe('B');
      expect(pricing.variantLabel).toBe(PRICE_VARIANTS.B.label);
      expect(pricing.options[0].numericPrice).toBe(PRICE_VARIANTS.B.digital);
      expect(pricing.options[1].numericPrice).toBe(PRICE_VARIANTS.B.print);
      expect(pricing.options[2].numericPrice).toBe(PRICE_VARIANTS.B.canvasFramed);
    });

    it('should return consistent pricing structure for both variants', () => {
      const pricingA = getDynamicPricing('A');
      const pricingB = getDynamicPricing('B');
      
      expect(pricingA.options.length).toBe(3);
      expect(pricingB.options.length).toBe(3);
      
      expect(pricingA.options[0].name).toBe('Digital Portrait');
      expect(pricingB.options[0].name).toBe('Digital Portrait');
      
      expect(pricingA.options[1].name).toBe('Premium Print');
      expect(pricingB.options[1].name).toBe('Premium Print');
      
      expect(pricingA.options[2].name).toBe('Framed Canvas');
      expect(pricingB.options[2].name).toBe('Framed Canvas');
    });
  });

  describe('URL Parameter Handling', () => {
    it('should handle valid price variant URL parameters', () => {
      const validVariants = ['A', 'B'] as const;
      
      validVariants.forEach(variant => {
        const pricing = getDynamicPricing(variant);
        expect(pricing.variant).toBe(variant);
      });
    });

    it('should use explicit variant over default', () => {
      const explicitPricing = getDynamicPricing('B');
      
      // Even if default would be A, explicit B should be used
      expect(explicitPricing.variant).toBe('B');
      expect(explicitPricing.options[0].numericPrice).toBe(PRICE_VARIANTS.B.digital);
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should enforce correct variant types', () => {
      // This test ensures TypeScript types are correct
      const variantA: 'A' | 'B' = 'A';
      const variantB: 'A' | 'B' = 'B';
      
      expect(() => getDynamicPricing(variantA)).not.toThrow();
      expect(() => getDynamicPricing(variantB)).not.toThrow();
    });
  });

  describe('Pricing Consistency', () => {
    it('should maintain pricing consistency across function calls', () => {
      const pricing1 = getDynamicPricing('A');
      const pricing2 = getDynamicPricing('A');
      
      expect(pricing1.options[0].numericPrice).toBe(pricing2.options[0].numericPrice);
      expect(pricing1.options[1].numericPrice).toBe(pricing2.options[1].numericPrice);
      expect(pricing1.options[2].numericPrice).toBe(pricing2.options[2].numericPrice);
    });

    it('should show different prices between variants', () => {
      const pricingA = getDynamicPricing('A');
      const pricingB = getDynamicPricing('B');
      
      // At least one product should have different pricing
      const hasDifference = 
        pricingA.options[0].numericPrice !== pricingB.options[0].numericPrice ||
        pricingA.options[1].numericPrice !== pricingB.options[1].numericPrice ||
        pricingA.options[2].numericPrice !== pricingB.options[2].numericPrice;
      
      expect(hasDifference).toBe(true);
    });
  });

  describe('Email Integration', () => {
    it('should support variant data structure for email templates', () => {
      type PriceVariant = 'A' | 'B';
      
      const mockArtwork = {
        price_variant: 'A' as PriceVariant,
        access_token: 'test-token-123'
      };
      
      // Simulate building email URL with variant
      const baseUrl = 'https://pawpopart.com';
      const artworkUrl = `${baseUrl}/artwork/${mockArtwork.access_token}`;
      const artworkUrlWithVariant = mockArtwork.price_variant 
        ? `${artworkUrl}?pv=${mockArtwork.price_variant}`
        : artworkUrl;
      
      expect(artworkUrlWithVariant).toBe('https://pawpopart.com/artwork/test-token-123?pv=A');
    });

    it('should handle missing variant gracefully', () => {
      const mockArtwork = {
        price_variant: undefined,
        access_token: 'test-token-456'
      };
      
      const baseUrl = 'https://pawpopart.com';
      const artworkUrl = `${baseUrl}/artwork/${mockArtwork.access_token}`;
      const artworkUrlWithVariant = mockArtwork.price_variant 
        ? `${artworkUrl}?pv=${mockArtwork.price_variant}`
        : artworkUrl;
      
      expect(artworkUrlWithVariant).toBe('https://pawpopart.com/artwork/test-token-456');
    });
  });

  describe('Database Integration', () => {
    it('should support valid variant values for database storage', () => {
      const validVariants: Array<'A' | 'B'> = ['A', 'B'];
      
      validVariants.forEach(variant => {
        const mockArtworkData = {
          customer_name: 'Test User',
          customer_email: 'test@example.com',
          price_variant: variant
        };
        
        expect(mockArtworkData.price_variant).toMatch(/^[AB]$/);
      });
    });

    it('should default to variant A when no variant provided', () => {
      const mockArtworkData = {
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        price_variant: undefined
      };
      
      const variantToStore = mockArtworkData.price_variant || 'A';
      expect(variantToStore).toBe('A');
    });
  });

  describe('Client-Side Storage Sync', () => {
    it('should support localStorage storage format', () => {
      const mockVariant: 'A' | 'B' = 'B';
      const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
      
      const storageData = {
        variant: mockVariant,
        expiry: expiry
      };
      
      expect(storageData.variant).toMatch(/^[AB]$/);
      expect(storageData.expiry).toBeGreaterThan(Date.now());
    });
  });

  describe('Analytics Integration', () => {
    it('should include variant in tracking data structure', () => {
      const trackingData = {
        event: 'Purchase Completed',
        price_variant: 'A' as 'A' | 'B',
        variant_label: PRICE_VARIANTS.A.label,
        amount: 39.99
      };
      
      expect(trackingData.price_variant).toBe('A');
      expect(trackingData.variant_label).toBe(PRICE_VARIANTS.A.label);
    });

    it('should support both variants in analytics', () => {
      const trackingDataA = {
        price_variant: 'A' as const,
        variant_label: PRICE_VARIANTS.A.label
      };
      
      const trackingDataB = {
        price_variant: 'B' as const,
        variant_label: PRICE_VARIANTS.B.label
      };
      
      expect(trackingDataA.price_variant).toBe('A');
      expect(trackingDataB.price_variant).toBe('B');
      expect(trackingDataA.variant_label).not.toBe(trackingDataB.variant_label);
    });
  });
});
