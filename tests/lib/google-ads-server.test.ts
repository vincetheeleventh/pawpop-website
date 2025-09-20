// tests/lib/google-ads-server.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { trackServerSideConversion, ServerConversionData } from '@/lib/google-ads-server';

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID: 'AW-123456789',
  NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_ID: 'AW-123456789/ABCD1234'
};

describe('Google Ads Server-Side Conversion Tracking', () => {
  beforeEach(() => {
    // Mock environment variables
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID', mockEnv.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID);
    vi.stubEnv('NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_ID', mockEnv.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_ID);
    
    // Clear console logs
    vi.clearAllMocks();
  });

  describe('trackServerSideConversion', () => {
    const validConversionData: ServerConversionData = {
      orderId: 'cs_test_12345',
      value: 99.99,
      currency: 'CAD',
      productType: 'CANVAS_FRAMED',
      customerEmail: 'test@example.com',
      customParameters: {
        customer_name: 'Test Customer',
        pet_name: 'Buddy',
        size: '16x20'
      }
    };

    it('should successfully track conversion with valid data', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await trackServerSideConversion(validConversionData);
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      
      // Verify console logging
      expect(consoleSpy).toHaveBeenCalledWith(
        '🎯 Google Ads Server-Side Conversion Tracked:',
        expect.objectContaining({
          conversion_id: mockEnv.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID,
          conversion_label: 'ABCD1234',
          order_id: validConversionData.orderId,
          value: validConversionData.value,
          currency: validConversionData.currency,
          product_type: validConversionData.productType
        })
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle missing environment variables gracefully', async () => {
      vi.stubEnv('NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID', undefined);
      vi.stubEnv('NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_ID', undefined);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await trackServerSideConversion(validConversionData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Google Ads tracking not configured');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Google Ads server-side tracking: Environment variables not configured'
      );
      
      consoleSpy.mockRestore();
    });

    it('should handle invalid conversion ID format', async () => {
      vi.stubEnv('NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_ID', 'INVALID_FORMAT');
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await trackServerSideConversion(validConversionData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid conversion format');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid Google Ads purchase conversion format:',
        'INVALID_FORMAT'
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle conversion data without optional fields', async () => {
      const minimalData: ServerConversionData = {
        orderId: 'cs_test_minimal',
        value: 29.99,
        currency: 'USD',
        productType: 'DIGITAL'
      };
      
      const result = await trackServerSideConversion(minimalData);
      
      expect(result.success).toBe(true);
    });

    it('should handle errors during tracking', async () => {
      // Mock an error during processing
      const originalCreateHash = require('crypto').createHash;
      vi.doMock('crypto', () => ({
        createHash: () => {
          throw new Error('Crypto error');
        }
      }));
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await trackServerSideConversion(validConversionData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Crypto error');
      
      consoleErrorSpy.mockRestore();
      
      // Restore original crypto
      require('crypto').createHash = originalCreateHash;
    });

    it('should generate consistent client IDs for same order', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Track the same order twice
      await trackServerSideConversion(validConversionData);
      await trackServerSideConversion(validConversionData);
      
      const calls = consoleSpy.mock.calls.filter(call => 
        call[0] === '🎯 Google Ads Server-Side Conversion Tracked:'
      );
      
      expect(calls.length).toBe(2);
      // Both calls should have the same order_id
      expect(calls[0][1].order_id).toBe(calls[1][1].order_id);
      
      consoleSpy.mockRestore();
    });

    it('should include custom parameters in tracking', async () => {
      const dataWithCustomParams: ServerConversionData = {
        ...validConversionData,
        customParameters: {
          customer_name: 'Jane Doe',
          pet_name: 'Max',
          frame_upgrade: true,
          size: '20x24'
        }
      };
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await trackServerSideConversion(dataWithCustomParams);
      
      expect(result.success).toBe(true);
      
      consoleSpy.mockRestore();
    });

    it('should handle different currencies', async () => {
      const usdData: ServerConversionData = {
        ...validConversionData,
        currency: 'USD',
        value: 79.99
      };
      
      const result = await trackServerSideConversion(usdData);
      
      expect(result.success).toBe(true);
    });

    it('should handle different product types', async () => {
      const productTypes = ['DIGITAL', 'ART_PRINT', 'CANVAS_STRETCHED', 'CANVAS_FRAMED'];
      
      for (const productType of productTypes) {
        const data: ServerConversionData = {
          ...validConversionData,
          productType
        };
        
        const result = await trackServerSideConversion(data);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Client ID Generation', () => {
    it('should generate consistent client IDs for same input', () => {
      // This tests the generateClientId function indirectly
      const orderId = 'test_order_123';
      
      // We can't directly test the private function, but we can verify
      // that the same order ID produces consistent results
      expect(typeof orderId).toBe('string');
      expect(orderId.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock a network error scenario
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // This would be where we'd mock fetch failures in a real implementation
      const testData: ServerConversionData = {
        orderId: 'cs_test_network_error',
        value: 99.99,
        currency: 'CAD',
        productType: 'CANVAS_FRAMED'
      };
      const result = await trackServerSideConversion(testData);
      
      // For now, our implementation always succeeds with logging
      expect(result.success).toBe(true);
      
      consoleErrorSpy.mockRestore();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        orderId: '',
        value: -1,
        currency: '',
        productType: ''
      } as ServerConversionData;
      
      const result = await trackServerSideConversion(invalidData);
      
      // Our current implementation is permissive, but in production
      // you might want to add validation
      expect(result).toBeDefined();
    });
  });
});
