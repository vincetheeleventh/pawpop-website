// tests/integration/email-integration.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as uploadCompleteHandler } from '@/app/api/upload/complete/route'
import { PATCH as artworkUpdateHandler } from '@/app/api/artwork/update/route'
import { POST as stripeWebhookHandler } from '@/app/api/webhook/route'
import { POST as printifyWebhookHandler } from '@/app/api/webhook/printify/route'

// Mock all email functions
vi.mock('@/lib/email', () => ({
  sendMasterpieceCreatingEmail: vi.fn().mockResolvedValue({ success: true }),
  sendMasterpieceReadyEmail: vi.fn().mockResolvedValue({ success: true }),
  sendOrderConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
  sendShippingNotificationEmail: vi.fn().mockResolvedValue({ success: true })
}))

// Mock Supabase functions
vi.mock('@/lib/supabase-artworks', () => ({
  createArtwork: vi.fn().mockResolvedValue({
    artwork: { id: 'artwork-123', customer_name: 'Jane Doe', customer_email: 'jane@example.com' },
    access_token: 'token-123'
  }),
  getArtworkById: vi.fn().mockResolvedValue({
    id: 'artwork-123',
    customer_name: 'Jane Doe',
    customer_email: 'jane@example.com',
    access_token: 'token-123',
    generation_status: 'pending'
  }),
  updateArtwork: vi.fn().mockResolvedValue({
    id: 'artwork-123',
    generation_status: 'completed',
    generated_image_url: 'https://example.com/generated.jpg'
  })
}))

vi.mock('@/lib/supabase-orders', () => ({
  updateOrderFromPrintify: vi.fn().mockResolvedValue({
    id: 'order-123',
    artwork_id: 'artwork-123',
    stripe_session_id: 'cs_test_123',
    product_type: 'art_print'
  })
}))

vi.mock('@/lib/order-processing', () => ({
  processOrder: vi.fn().mockResolvedValue({}),
  parseOrderMetadata: vi.fn().mockReturnValue({
    productType: 'art_print',
    customerName: 'Jane Doe',
    size: '12x16',
    petName: 'Fluffy'
  }),
  handleOrderStatusUpdate: vi.fn().mockResolvedValue({})
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn().mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_123',
            customer_details: {
              name: 'Jane Doe',
              email: 'jane@example.com'
            },
            amount_total: 2999,
            currency: 'usd'
          }
        }
      })
    }
  }
}))

vi.mock('@/lib/utils', () => ({
  isValidEmail: vi.fn().mockReturnValue(true),
  isValidUUID: vi.fn().mockReturnValue(true)
}))

describe('Email Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_BASE_URL = 'https://pawpopart.com'
    process.env.RESEND_API_KEY = 'test-key'
  })

  describe('Upload Complete Email Flow', () => {
    it('should send masterpiece creating email after upload completion', async () => {
      const { sendMasterpieceCreatingEmail } = await import('@/lib/email')
      
      const request = new NextRequest('http://localhost/api/upload/complete', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: 'Jane Doe',
          customer_email: 'jane@example.com',
          pet_name: 'Fluffy',
          uploaded_file_url: 'https://example.com/upload.jpg'
        })
      })

      const response = await uploadCompleteHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(sendMasterpieceCreatingEmail).toHaveBeenCalledWith({
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        petName: 'Fluffy',
        artworkUrl: 'https://pawpopart.com/artwork/token-123'
      })
    })
  })

  describe('Artwork Ready Email Flow', () => {
    it('should send masterpiece ready email when artwork generation completes', async () => {
      const { sendMasterpieceReadyEmail } = await import('@/lib/email')
      
      const request = new NextRequest('http://localhost/api/artwork/update', {
        method: 'PATCH',
        body: JSON.stringify({
          artwork_id: 'artwork-123',
          generated_image_url: 'https://example.com/generated.jpg',
          generation_status: 'completed'
        })
      })

      const response = await artworkUpdateHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(sendMasterpieceReadyEmail).toHaveBeenCalledWith({
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        petName: undefined,
        artworkUrl: 'https://pawpopart.com/artwork/token-123',
        generatedImageUrl: 'https://example.com/generated.jpg'
      })
    })
  })

  describe('Order Confirmation Email Flow', () => {
    it('should send order confirmation email after successful Stripe payment', async () => {
      const { sendOrderConfirmationEmail } = await import('@/lib/email')
      
      const request = new NextRequest('http://localhost/api/webhook', {
        method: 'POST',
        body: 'webhook-body',
        headers: {
          'stripe-signature': 'test-signature'
        }
      })

      const response = await stripeWebhookHandler(request)

      expect(response.status).toBe(200)
      expect(sendOrderConfirmationEmail).toHaveBeenCalledWith({
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        orderNumber: 'cs_test_123',
        productType: 'art_print',
        productSize: '12x16',
        amount: 2999,
        currency: 'usd',
        petName: 'Fluffy'
      })
    })
  })

  describe('Shipping Notification Email Flow', () => {
    it('should send shipping notification email when Printify order ships', async () => {
      const { sendShippingNotificationEmail } = await import('@/lib/email')
      
      const request = new NextRequest('http://localhost/api/webhook/printify', {
        method: 'POST',
        body: JSON.stringify({
          type: 'order:shipment:created',
          data: {
            id: 'printify-123',
            tracking_number: 'TRK123456',
            tracking_url: 'https://tracking.example.com/TRK123456',
            carrier: 'UPS'
          }
        })
      })

      const response = await printifyWebhookHandler(request)

      expect(response.status).toBe(200)
      expect(sendShippingNotificationEmail).toHaveBeenCalledWith({
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        orderNumber: 'cs_test_123',
        trackingNumber: 'TRK123456',
        trackingUrl: 'https://tracking.example.com/TRK123456',
        carrier: 'UPS',
        productType: 'art_print'
      })
    })
  })

  describe('Error Handling', () => {
    it('should not fail upload completion if email fails', async () => {
      const { sendMasterpieceCreatingEmail } = await import('@/lib/email')
      vi.mocked(sendMasterpieceCreatingEmail).mockRejectedValue(new Error('Email failed'))
      
      const request = new NextRequest('http://localhost/api/upload/complete', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: 'Jane Doe',
          customer_email: 'jane@example.com',
          uploaded_file_url: 'https://example.com/upload.jpg'
        })
      })

      const response = await uploadCompleteHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should not fail artwork update if email fails', async () => {
      const { sendMasterpieceReadyEmail } = await import('@/lib/email')
      vi.mocked(sendMasterpieceReadyEmail).mockRejectedValue(new Error('Email failed'))
      
      const request = new NextRequest('http://localhost/api/artwork/update', {
        method: 'PATCH',
        body: JSON.stringify({
          artwork_id: 'artwork-123',
          generated_image_url: 'https://example.com/generated.jpg',
          generation_status: 'completed'
        })
      })

      const response = await artworkUpdateHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})
