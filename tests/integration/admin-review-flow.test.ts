import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  createAdminReview,
  processAdminReview,
  waitForReviewApproval,
  isHumanReviewEnabled
} from '@/lib/admin-review'
import { sendAdminReviewNotification } from '@/lib/email'

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      rpc: vi.fn()
    }))
  }
}))

vi.mock('@/lib/email', () => ({
  sendAdminReviewNotification: vi.fn()
}))

describe('Admin Review Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ENABLE_HUMAN_REVIEW = 'true'
  })

  it('should complete full artwork proof review flow', async () => {
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    // Mock review creation
    const mockReview = {
      id: 'review-123',
      artwork_id: 'artwork-456',
      review_type: 'artwork_proof',
      status: 'pending',
      image_url: 'https://example.com/artwork.jpg',
      fal_generation_url: 'https://fal.ai/generation/789',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      pet_name: 'Fluffy',
      created_at: new Date().toISOString()
    }

    supabaseAdmin.from().insert().select().single.mockResolvedValue({
      data: mockReview,
      error: null
    })

    supabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

    vi.mocked(sendAdminReviewNotification).mockResolvedValue({
      success: true,
      messageId: 'email-123'
    })

    // Step 1: Create review
    const createdReview = await createAdminReview({
      artwork_id: 'artwork-456',
      review_type: 'artwork_proof',
      image_url: 'https://example.com/artwork.jpg',
      fal_generation_url: 'https://fal.ai/generation/789',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      pet_name: 'Fluffy'
    })

    expect(createdReview).toEqual(mockReview)
    expect(sendAdminReviewNotification).toHaveBeenCalledWith({
      reviewId: 'review-123',
      reviewType: 'artwork_proof',
      customerName: 'John Doe',
      petName: 'Fluffy',
      imageUrl: 'https://example.com/artwork.jpg',
      falGenerationUrl: 'https://fal.ai/generation/789'
    })

    // Step 2: Process approval
    supabaseAdmin.rpc.mockResolvedValue({ data: true, error: null })

    const approvalResult = await processAdminReview(
      'review-123',
      'approved',
      'admin@pawpop.com',
      'Quality looks excellent!'
    )

    expect(approvalResult).toBe(true)
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('process_admin_review', {
      p_review_id: 'review-123',
      p_status: 'approved',
      p_reviewed_by: 'admin@pawpop.com',
      p_notes: 'Quality looks excellent!'
    })
  })

  it('should handle review rejection flow', async () => {
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    // Mock review creation
    const mockReview = {
      id: 'review-456',
      artwork_id: 'artwork-789',
      review_type: 'highres_file',
      status: 'pending',
      image_url: 'https://example.com/highres.jpg',
      customer_name: 'Jane Smith',
      customer_email: 'jane@example.com',
      created_at: new Date().toISOString()
    }

    supabaseAdmin.from().insert().select().single.mockResolvedValue({
      data: mockReview,
      error: null
    })

    supabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

    // Step 1: Create review
    const createdReview = await createAdminReview({
      artwork_id: 'artwork-789',
      review_type: 'highres_file',
      image_url: 'https://example.com/highres.jpg',
      customer_name: 'Jane Smith',
      customer_email: 'jane@example.com'
    })

    expect(createdReview).toEqual(mockReview)

    // Step 2: Process rejection
    supabaseAdmin.rpc.mockResolvedValue({ data: true, error: null })

    const rejectionResult = await processAdminReview(
      'review-456',
      'rejected',
      'admin@pawpop.com',
      'Quality issues detected - blurry image'
    )

    expect(rejectionResult).toBe(true)
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('process_admin_review', {
      p_review_id: 'review-456',
      p_status: 'rejected',
      p_reviewed_by: 'admin@pawpop.com',
      p_notes: 'Quality issues detected - blurry image'
    })
  })

  it('should handle waitForReviewApproval with approval', async () => {
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    // Mock approved status
    supabaseAdmin.from().select().eq().single.mockResolvedValue({
      data: {
        review_status: {
          artwork_proof: 'approved',
          highres_file: 'not_required'
        }
      },
      error: null
    })

    const result = await waitForReviewApproval('artwork-123', 'artwork_proof', 1)
    expect(result).toBe(true)
  })

  it('should handle waitForReviewApproval with rejection', async () => {
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    // Mock rejected status
    supabaseAdmin.from().select().eq().single.mockResolvedValue({
      data: {
        review_status: {
          artwork_proof: 'rejected',
          highres_file: 'not_required'
        }
      },
      error: null
    })

    const result = await waitForReviewApproval('artwork-123', 'artwork_proof', 1)
    expect(result).toBe(false)
  })

  it('should bypass review system when disabled', async () => {
    process.env.ENABLE_HUMAN_REVIEW = 'false'

    expect(isHumanReviewEnabled()).toBe(false)

    const result = await createAdminReview({
      artwork_id: 'artwork-123',
      review_type: 'artwork_proof',
      image_url: 'https://example.com/image.jpg',
      customer_name: 'Test User',
      customer_email: 'test@example.com'
    })

    expect(result).toBeNull()

    const waitResult = await waitForReviewApproval('artwork-123', 'artwork_proof', 1)
    expect(waitResult).toBe(true)
  })

  it('should handle email notification failures gracefully', async () => {
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    const mockReview = {
      id: 'review-789',
      artwork_id: 'artwork-123',
      review_type: 'artwork_proof',
      status: 'pending',
      image_url: 'https://example.com/image.jpg',
      customer_name: 'Test User',
      customer_email: 'test@example.com',
      created_at: new Date().toISOString()
    }

    supabaseAdmin.from().insert().select().single.mockResolvedValue({
      data: mockReview,
      error: null
    })

    supabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

    // Mock email failure
    vi.mocked(sendAdminReviewNotification).mockRejectedValue(new Error('Email service unavailable'))

    // Should still create review successfully
    const result = await createAdminReview({
      artwork_id: 'artwork-123',
      review_type: 'artwork_proof',
      image_url: 'https://example.com/image.jpg',
      customer_name: 'Test User',
      customer_email: 'test@example.com'
    })

    expect(result).toEqual(mockReview)
  })

  it('should handle database errors during review creation', async () => {
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    supabaseAdmin.from().insert().select().single.mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' }
    })

    await expect(createAdminReview({
      artwork_id: 'artwork-123',
      review_type: 'artwork_proof',
      image_url: 'https://example.com/image.jpg',
      customer_name: 'Test User',
      customer_email: 'test@example.com'
    })).rejects.toThrow('Database connection failed')
  })
})
