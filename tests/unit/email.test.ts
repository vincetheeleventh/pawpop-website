// tests/unit/email.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  sendEmail, 
  sendMasterpieceCreatingEmail,
  sendMasterpieceReadyEmail,
  sendOrderConfirmationEmail,
  sendShippingNotificationEmail
} from '@/lib/email'

// Mock Resend
const mockResendSend = vi.fn()
vi.mock('resend', () => {
  return {
    Resend: vi.fn(() => ({
      emails: {
        send: mockResendSend
      }
    }))
  }
})

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResendSend.mockClear()
    
    // Mock environment variable
    process.env.RESEND_API_KEY = 'test-api-key'
  })

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      })

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('email-123')
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'PawPop <noreply@pawpopart.com>',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      })
    })

    it('should handle Resend API errors', async () => {
      mockResendSend.mockResolvedValue({
        data: null,
        error: { message: 'API Error' }
      })

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('API Error')
    })

    it('should handle missing API key', async () => {
      delete process.env.RESEND_API_KEY

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email service not configured')
    })

    it('should use custom from address', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      })

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>',
        from: 'Custom <custom@example.com>'
      })

      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'Custom <custom@example.com>',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content</p>'
      })
    })
  })

  describe('sendMasterpieceCreatingEmail', () => {
    it('should send masterpiece creating email with pet name', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      })

      const result = await sendMasterpieceCreatingEmail({
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        petName: 'Fluffy',
        artworkUrl: 'https://pawpopart.com/artwork/token123'
      })

      expect(result.success).toBe(true)
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'PawPop <noreply@pawpopart.com>',
        to: 'jane@example.com',
        subject: 'Your masterpiece is being created! 🎨',
        html: expect.stringContaining('Hi Jane Doe!')
      })
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'PawPop <noreply@pawpopart.com>',
        to: 'jane@example.com',
        subject: 'Your masterpiece is being created! 🎨',
        html: expect.stringContaining('for Fluffy')
      })
    })

    it('should send masterpiece creating email without pet name', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      })

      const result = await sendMasterpieceCreatingEmail({
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        artworkUrl: 'https://pawpopart.com/artwork/token123'
      })

      expect(result.success).toBe(true)
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'PawPop <noreply@pawpopart.com>',
        to: 'jane@example.com',
        subject: 'Your masterpiece is being created! 🎨',
        html: expect.not.stringContaining('for ')
      })
    })
  })

  describe('sendMasterpieceReadyEmail', () => {
    it('should send masterpiece ready email', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      })

      const result = await sendMasterpieceReadyEmail({
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        petName: 'Fluffy',
        artworkUrl: 'https://pawpopart.com/artwork/token123',
        generatedImageUrl: 'https://example.com/generated.jpg'
      })

      expect(result.success).toBe(true)
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'PawPop <noreply@pawpopart.com>',
        to: 'jane@example.com',
        subject: 'Your masterpiece is ready! 🎉',
        html: expect.stringContaining('Hi Jane Doe!')
      })
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'PawPop <noreply@pawpopart.com>',
        to: 'jane@example.com',
        subject: 'Your masterpiece is ready! 🎉',
        html: expect.stringContaining('https://example.com/generated.jpg')
      })
    })
  })

  describe('sendOrderConfirmationEmail', () => {
    it('should send order confirmation email', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      })

      const result = await sendOrderConfirmationEmail({
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        orderNumber: 'cs_test_123',
        productType: 'art_print',
        productSize: '12x16',
        amount: 2999,
        currency: 'usd',
        petName: 'Fluffy'
      })

      expect(result.success).toBe(true)
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'PawPop <noreply@pawpopart.com>',
        to: 'jane@example.com',
        subject: 'Order Confirmation #cs_test_123 - PawPop',
        html: expect.stringContaining('Thank you for your order, Jane Doe!')
      })
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'PawPop <noreply@pawpopart.com>',
        to: 'jane@example.com',
        subject: 'Order Confirmation #cs_test_123 - PawPop',
        html: expect.stringContaining('USD $29.99')
      })
    })

    it('should format amount correctly', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      })

      await sendOrderConfirmationEmail({
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        orderNumber: 'cs_test_123',
        productType: 'art_print',
        amount: 1500,
        currency: 'usd'
      })

      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'PawPop <noreply@pawpopart.com>',
        to: 'jane@example.com',
        subject: 'Order Confirmation #cs_test_123 - PawPop',
        html: expect.stringContaining('USD $15.00')
      })
    })
  })

  describe('sendShippingNotificationEmail', () => {
    it('should send shipping notification with tracking info', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      })

      const result = await sendShippingNotificationEmail({
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        orderNumber: 'cs_test_123',
        trackingNumber: 'TRK123456',
        trackingUrl: 'https://tracking.example.com/TRK123456',
        carrier: 'UPS',
        productType: 'art_print'
      })

      expect(result.success).toBe(true)
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'PawPop <noreply@pawpopart.com>',
        to: 'jane@example.com',
        subject: 'Your PawPop order #cs_test_123 has shipped! 📦',
        html: expect.stringContaining('Great news, Jane Doe!')
      })
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'PawPop <noreply@pawpopart.com>',
        to: 'jane@example.com',
        subject: 'Your PawPop order #cs_test_123 has shipped! 📦',
        html: expect.stringContaining('TRK123456')
      })
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'PawPop <noreply@pawpopart.com>',
        to: 'jane@example.com',
        subject: 'Your PawPop order #cs_test_123 has shipped! 📦',
        html: expect.stringContaining('UPS')
      })
    })

    it('should send shipping notification without tracking info', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'email-123' },
        error: null
      })

      const result = await sendShippingNotificationEmail({
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        orderNumber: 'cs_test_123',
        productType: 'art_print'
      })

      expect(result.success).toBe(true)
      expect(mockResendSend).toHaveBeenCalledWith({
        from: 'PawPop <noreply@pawpopart.com>',
        to: 'jane@example.com',
        subject: 'Your PawPop order #cs_test_123 has shipped! 📦',
        html: expect.not.stringContaining('Tracking Number:')
      })
    })
  })
})
