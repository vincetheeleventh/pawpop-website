import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processOrder, parseOrderMetadata } from '@/lib/order-processing';
import { ProductType } from '@/lib/printify';
import * as supabaseOrders from '@/lib/supabase-orders';
import * as supabaseArtworks from '@/lib/supabase-artworks';
import * as printifyProducts from '@/lib/printify-products';
import * as printify from '@/lib/printify';

// Mock dependencies
vi.mock('@/lib/supabase-orders');
vi.mock('@/lib/supabase-artworks');
vi.mock('@/lib/printify-products');
vi.mock('@/lib/printify');

const mockSupabaseOrders = vi.mocked(supabaseOrders);
const mockSupabaseArtworks = vi.mocked(supabaseArtworks);
const mockPrintifyProducts = vi.mocked(printifyProducts);
const mockPrintify = vi.mocked(printify);

// Mock fetch for upscaling API calls
global.fetch = vi.fn();

describe('Order Processing with Upscaling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up environment variables
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
    process.env.PRINTIFY_SHOP_ID = 'test-shop-123';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockStripeSession = {
    id: 'cs_test_123',
    payment_intent: 'pi_test_123',
    customer_details: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    shipping_details: {
      name: 'John Doe',
      address: {
        line1: '123 Main St',
        line2: null,
        city: 'Anytown',
        state: 'CA',
        postal_code: '12345',
        country: 'US'
      }
    },
    metadata: {
      productType: 'framed_canvas',
      imageUrl: 'https://example.com/artwork.jpg',
      size: '16x20',
      customerName: 'John Doe',
      petName: 'Buddy'
    }
  } as any;

  const mockOrder = {
    id: 'order-123',
    artwork_id: 'artwork-123',
    stripe_session_id: 'cs_test_123',
    product_type: 'framed_canvas',
    customer_name: 'John Doe'
  };

  const mockArtwork = {
    id: 'artwork-123',
    generated_image_url: 'https://example.com/artwork.jpg',
    upscale_status: 'pending' as const,
    upscaled_image_url: null,
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    original_image_url: 'https://example.com/original.jpg',
    generation_status: 'completed' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  describe('processOrder with physical products', () => {
    beforeEach(() => {
      // Mock Supabase operations
      mockSupabaseOrders.updateOrderAfterPayment.mockResolvedValue(undefined);
      mockSupabaseOrders.getOrderByStripeSession.mockResolvedValue(mockOrder);
      mockSupabaseOrders.addOrderStatusHistory.mockResolvedValue(undefined);
      mockSupabaseOrders.updateOrderWithPrintify.mockResolvedValue(undefined);

      // Mock artwork operations
      mockSupabaseArtworks.getArtworkById.mockResolvedValue(mockArtwork);
      mockSupabaseArtworks.updateArtworkUpscaleStatus.mockResolvedValue(mockArtwork);

      // Mock Printify operations
      mockPrintifyProducts.validateOrderData.mockReturnValue({ isValid: true });
      mockPrintifyProducts.getOrCreatePrintifyProduct.mockResolvedValue({
        productId: 'printify-product-123',
        variantId: 456
      });
      mockPrintify.createPrintifyOrder.mockResolvedValue({
        id: 'printify-order-123',
        status: 'pending'
      });
    });

    it('should successfully process order with upscaling for framed canvas', async () => {
      // Mock successful upscaling
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          upscaled_image_url: 'https://example.com/upscaled.jpg',
          request_id: 'fal-123'
        })
      } as Response);

      const metadata = parseOrderMetadata(mockStripeSession);
      await processOrder({ session: mockStripeSession, metadata: metadata! });

      // Verify upscaling was triggered
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: 'artwork-123' })
      });

      // Verify Printify product creation used upscaled image
      expect(mockPrintifyProducts.getOrCreatePrintifyProduct).toHaveBeenCalledWith(
        ProductType.FRAMED_CANVAS,
        '16x20',
        'https://example.com/upscaled.jpg', // Should use upscaled URL
        'US',
        'John Doe',
        'Buddy'
      );

      // Verify order status updates
      expect(mockSupabaseOrders.addOrderStatusHistory).toHaveBeenCalledWith(
        'order-123',
        'processing',
        'Image upscaled successfully, creating Printify order'
      );
    });

    it('should fallback to original image if upscaling fails', async () => {
      // Mock failed upscaling
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);

      const metadata = parseOrderMetadata(mockStripeSession);
      await processOrder({ session: mockStripeSession, metadata: metadata! });

      // Verify upscaling was attempted
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/upscale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: 'artwork-123' })
      });

      // Verify Printify product creation used original image as fallback
      expect(mockPrintifyProducts.getOrCreatePrintifyProduct).toHaveBeenCalledWith(
        ProductType.FRAMED_CANVAS,
        '16x20',
        'https://example.com/artwork.jpg', // Should fallback to original URL
        'US',
        'John Doe',
        'Buddy'
      );

      // Verify failure was logged
      expect(mockSupabaseOrders.addOrderStatusHistory).toHaveBeenCalledWith(
        'order-123',
        'processing',
        'Upscaling failed, using original image for Printify order'
      );

      // Verify upscale status was marked as failed
      expect(mockSupabaseArtworks.updateArtworkUpscaleStatus).toHaveBeenCalledWith(
        'artwork-123',
        'failed'
      );
    });

    it('should skip upscaling for digital products', async () => {
      const digitalSession = {
        ...mockStripeSession,
        metadata: {
          ...mockStripeSession.metadata,
          productType: 'digital'
        }
      };

      const metadata = parseOrderMetadata(digitalSession);
      await processOrder({ session: digitalSession, metadata: metadata! });

      // Verify upscaling was not triggered
      expect(fetch).not.toHaveBeenCalled();

      // Verify upscale status was marked as not required
      expect(mockSupabaseArtworks.updateArtworkUpscaleStatus).toHaveBeenCalledWith(
        'artwork-123',
        'not_required'
      );

      // Verify no Printify operations for digital products
      expect(mockPrintifyProducts.getOrCreatePrintifyProduct).not.toHaveBeenCalled();
      expect(mockPrintify.createPrintifyOrder).not.toHaveBeenCalled();
    });

    it('should handle missing artwork gracefully', async () => {
      const orderWithoutArtwork = { ...mockOrder, artwork_id: null };
      mockSupabaseOrders.getOrderByStripeSession.mockResolvedValue(orderWithoutArtwork);

      const metadata = parseOrderMetadata(mockStripeSession);
      await processOrder({ session: mockStripeSession, metadata: metadata! });

      // Should not attempt upscaling without artwork ID
      expect(fetch).not.toHaveBeenCalled();

      // Should still proceed with Printify order using original image
      expect(mockPrintifyProducts.getOrCreatePrintifyProduct).toHaveBeenCalledWith(
        ProductType.FRAMED_CANVAS,
        '16x20',
        'https://example.com/artwork.jpg', // Original image from metadata
        'US',
        'John Doe',
        'Buddy'
      );
    });

    it('should use existing upscaled image if already available', async () => {
      // Mock upscaling API returning existing upscaled image
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          upscaled_image_url: 'https://example.com/existing-upscaled.jpg',
          message: 'Already upscaled'
        })
      } as Response);

      const metadata = parseOrderMetadata(mockStripeSession);
      await processOrder({ session: mockStripeSession, metadata: metadata! });

      // Verify Printify product creation used existing upscaled image
      expect(mockPrintifyProducts.getOrCreatePrintifyProduct).toHaveBeenCalledWith(
        ProductType.FRAMED_CANVAS,
        '16x20',
        'https://example.com/existing-upscaled.jpg',
        'US',
        'John Doe',
        'Buddy'
      );
    });
  });

  describe('parseOrderMetadata', () => {
    it('should correctly parse order metadata from Stripe session', () => {
      const metadata = parseOrderMetadata(mockStripeSession);

      expect(metadata).toEqual({
        productType: ProductType.FRAMED_CANVAS,
        imageUrl: 'https://example.com/artwork.jpg',
        size: '16x20',
        customerName: 'John Doe',
        petName: 'Buddy'
      });
    });

    it('should return null for session without metadata', () => {
      const sessionWithoutMetadata = { ...mockStripeSession, metadata: null };
      const metadata = parseOrderMetadata(sessionWithoutMetadata);

      expect(metadata).toBeNull();
    });
  });
});
