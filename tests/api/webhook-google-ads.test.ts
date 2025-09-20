// tests/api/webhook-google-ads.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Google Ads server-side tracking
vi.mock('@/lib/google-ads-server', () => ({
  trackServerSideConversion: vi.fn()
}));

// Mock other dependencies
vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn()
    }
  }
}));

vi.mock('@/lib/order-processing', () => ({
  processOrder: vi.fn(),
  parseOrderMetadata: vi.fn()
}));

vi.mock('@/lib/email', () => ({
  sendOrderConfirmationEmail: vi.fn()
}));

import { POST } from '@/app/api/webhook/route';
import { trackServerSideConversion } from '@/lib/google-ads-server';

describe('Webhook Google Ads Integration', () => {
  const mockTrackServerSideConversion = trackServerSideConversion as any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful tracking by default
    mockTrackServerSideConversion.mockResolvedValue({ success: true });
  });

  const createMockStripeEvent = (overrides = {}) => ({
    id: 'evt_test_12345',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_12345',
        amount_total: 9999, // $99.99 in cents
        currency: 'cad',
        customer_details: {
          email: 'test@example.com',
          name: 'Test Customer'
        },
        metadata: {
          productType: 'CANVAS_FRAMED',
          imageUrl: 'https://example.com/image.jpg',
          size: '16x20',
          customerName: 'Test Customer',
          petName: 'Buddy',
          frameUpgrade: 'false'
        },
        ...overrides
      }
    }
  });

  const createMockRequest = (body: any, signature = 'valid_signature') => {
    return {
      text: () => Promise.resolve(JSON.stringify(body)),
      headers: new Map([['stripe-signature', signature]])
    } as any;
  };

  it('should track Google Ads conversion on successful checkout', async () => {
    const mockEvent = createMockStripeEvent();
    const mockRequest = createMockRequest(mockEvent);
    
    // Mock Stripe webhook verification
    const { stripe } = await import('@/lib/stripe');
    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
    
    // Mock order processing
    const { processOrder, parseOrderMetadata } = await import('@/lib/order-processing');
    (parseOrderMetadata as any).mockReturnValue(mockEvent.data.object.metadata);
    (processOrder as any).mockResolvedValue(undefined);
    
    // Mock email sending
    const { sendOrderConfirmationEmail } = await import('@/lib/email');
    (sendOrderConfirmationEmail as any).mockResolvedValue(undefined);
    
    const response = await POST(mockRequest);
    
    expect(response.status).toBe(200);
    
    // Verify Google Ads tracking was called with correct data
    expect(mockTrackServerSideConversion).toHaveBeenCalledWith({
      orderId: 'cs_test_12345',
      value: 99.99, // Converted from cents
      currency: 'CAD',
      productType: 'CANVAS_FRAMED',
      customerEmail: 'test@example.com',
      customParameters: {
        customer_name: 'Test Customer',
        pet_name: 'Buddy',
        frame_upgrade: 'false',
        size: '16x20'
      }
    });
  });

  it('should handle missing customer email gracefully', async () => {
    const mockEvent = createMockStripeEvent({
      customer_details: {
        name: 'Test Customer'
        // email is missing
      }
    });
    const mockRequest = createMockRequest(mockEvent);
    
    const { stripe } = await import('@/lib/stripe');
    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
    
    const { processOrder, parseOrderMetadata } = await import('@/lib/order-processing');
    (parseOrderMetadata as any).mockReturnValue(mockEvent.data.object.metadata);
    (processOrder as any).mockResolvedValue(undefined);
    
    const { sendOrderConfirmationEmail } = await import('@/lib/email');
    (sendOrderConfirmationEmail as any).mockResolvedValue(undefined);
    
    await POST(mockRequest);
    
    expect(mockTrackServerSideConversion).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: undefined
      })
    );
  });

  it('should handle Google Ads tracking failure gracefully', async () => {
    const mockEvent = createMockStripeEvent();
    const mockRequest = createMockRequest(mockEvent);
    
    // Mock tracking failure
    mockTrackServerSideConversion.mockResolvedValue({ 
      success: false, 
      error: 'Tracking configuration missing' 
    });
    
    const { stripe } = await import('@/lib/stripe');
    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
    
    const { processOrder, parseOrderMetadata } = await import('@/lib/order-processing');
    (parseOrderMetadata as any).mockReturnValue(mockEvent.data.object.metadata);
    (processOrder as any).mockResolvedValue(undefined);
    
    const { sendOrderConfirmationEmail } = await import('@/lib/email');
    (sendOrderConfirmationEmail as any).mockResolvedValue(undefined);
    
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const response = await POST(mockRequest);
    
    // Webhook should still succeed even if tracking fails
    expect(response.status).toBe(200);
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '⚠️ Google Ads server-side conversion tracking failed:',
      'Tracking configuration missing'
    );
    
    consoleWarnSpy.mockRestore();
  });

  it('should handle Google Ads tracking exception gracefully', async () => {
    const mockEvent = createMockStripeEvent();
    const mockRequest = createMockRequest(mockEvent);
    
    // Mock tracking exception
    mockTrackServerSideConversion.mockRejectedValue(new Error('Network error'));
    
    const { stripe } = await import('@/lib/stripe');
    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
    
    const { processOrder, parseOrderMetadata } = await import('@/lib/order-processing');
    (parseOrderMetadata as any).mockReturnValue(mockEvent.data.object.metadata);
    (processOrder as any).mockResolvedValue(undefined);
    
    const { sendOrderConfirmationEmail } = await import('@/lib/email');
    (sendOrderConfirmationEmail as any).mockResolvedValue(undefined);
    
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const response = await POST(mockRequest);
    
    // Webhook should still succeed even if tracking throws
    expect(response.status).toBe(200);
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ Failed to track purchase conversion:',
      expect.any(Error)
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('should not track conversion when metadata is missing', async () => {
    const mockEvent = createMockStripeEvent();
    const mockRequest = createMockRequest(mockEvent);
    
    const { stripe } = await import('@/lib/stripe');
    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
    
    const { parseOrderMetadata } = await import('@/lib/order-processing');
    (parseOrderMetadata as any).mockReturnValue(null); // No metadata
    
    await POST(mockRequest);
    
    // Should not call tracking when metadata is missing
    expect(mockTrackServerSideConversion).not.toHaveBeenCalled();
  });

  it('should track conversion with different currencies', async () => {
    const mockEvent = createMockStripeEvent({
      amount_total: 7999, // $79.99 in cents
      currency: 'usd'
    });
    const mockRequest = createMockRequest(mockEvent);
    
    const { stripe } = await import('@/lib/stripe');
    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
    
    const { processOrder, parseOrderMetadata } = await import('@/lib/order-processing');
    (parseOrderMetadata as any).mockReturnValue(mockEvent.data.object.metadata);
    (processOrder as any).mockResolvedValue(undefined);
    
    const { sendOrderConfirmationEmail } = await import('@/lib/email');
    (sendOrderConfirmationEmail as any).mockResolvedValue(undefined);
    
    await POST(mockRequest);
    
    expect(mockTrackServerSideConversion).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 79.99,
        currency: 'USD'
      })
    );
  });

  it('should track conversion with different product types', async () => {
    const productTypes = ['DIGITAL', 'ART_PRINT', 'CANVAS_STRETCHED', 'CANVAS_FRAMED'];
    
    for (const productType of productTypes) {
      vi.clearAllMocks();
      
      const mockEvent = createMockStripeEvent({
        metadata: {
          ...createMockStripeEvent().data.object.metadata,
          productType
        }
      });
      const mockRequest = createMockRequest(mockEvent);
      
      const { stripe } = await import('@/lib/stripe');
      (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
      
      const { processOrder, parseOrderMetadata } = await import('@/lib/order-processing');
      (parseOrderMetadata as any).mockReturnValue(mockEvent.data.object.metadata);
      (processOrder as any).mockResolvedValue(undefined);
      
      const { sendOrderConfirmationEmail } = await import('@/lib/email');
      (sendOrderConfirmationEmail as any).mockResolvedValue(undefined);
      
      await POST(mockRequest);
      
      expect(mockTrackServerSideConversion).toHaveBeenCalledWith(
        expect.objectContaining({
          productType
        })
      );
    }
  });

  it('should handle successful tracking confirmation', async () => {
    const mockEvent = createMockStripeEvent();
    const mockRequest = createMockRequest(mockEvent);
    
    mockTrackServerSideConversion.mockResolvedValue({ success: true });
    
    const { stripe } = await import('@/lib/stripe');
    (stripe.webhooks.constructEvent as any).mockReturnValue(mockEvent);
    
    const { processOrder, parseOrderMetadata } = await import('@/lib/order-processing');
    (parseOrderMetadata as any).mockReturnValue(mockEvent.data.object.metadata);
    (processOrder as any).mockResolvedValue(undefined);
    
    const { sendOrderConfirmationEmail } = await import('@/lib/email');
    (sendOrderConfirmationEmail as any).mockResolvedValue(undefined);
    
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    await POST(mockRequest);
    
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '✅ Google Ads server-side conversion tracked successfully'
    );
    
    consoleLogSpy.mockRestore();
  });
});
