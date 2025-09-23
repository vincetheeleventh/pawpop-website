import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock modules first
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}))

vi.mock('@/lib/email', () => ({
  sendAdminReviewNotification: vi.fn()
}))

import { 
  isHumanReviewEnabled,
  createAdminReview,
  getPendingReviews,
  processAdminReview,
  updateArtworkReviewStatus,
  checkArtworkReviewStatus,
  getAdminReview,
  shouldCreateReview,
  waitForReviewApproval
} from '@/lib/admin-review'

describe('Admin Review System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variable
    delete process.env.ENABLE_HUMAN_REVIEW
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('isHumanReviewEnabled', () => {
    it('should return true when ENABLE_HUMAN_REVIEW is "true"', () => {
      process.env.ENABLE_HUMAN_REVIEW = 'true'
      expect(isHumanReviewEnabled()).toBe(true)
    })

    it('should return false when ENABLE_HUMAN_REVIEW is "false"', () => {
      process.env.ENABLE_HUMAN_REVIEW = 'false'
      expect(isHumanReviewEnabled()).toBe(false)
    })

    it('should return false when ENABLE_HUMAN_REVIEW is not set', () => {
      expect(isHumanReviewEnabled()).toBe(false)
    })

    it('should return false when ENABLE_HUMAN_REVIEW is any other value', () => {
      process.env.ENABLE_HUMAN_REVIEW = 'maybe'
      expect(isHumanReviewEnabled()).toBe(false)
    })
  })

  describe('shouldCreateReview', () => {
    it('should return false when human review is disabled', () => {
      process.env.ENABLE_HUMAN_REVIEW = 'false'
      expect(shouldCreateReview('artwork_proof')).toBe(false)
      expect(shouldCreateReview('highres_file')).toBe(false)
    })

    it('should return true when human review is enabled', () => {
      process.env.ENABLE_HUMAN_REVIEW = 'true'
      expect(shouldCreateReview('artwork_proof')).toBe(true)
      expect(shouldCreateReview('highres_file')).toBe(true)
    })
  })

  describe('createAdminReview', () => {
    const mockReviewData = {
      artwork_id: 'test-artwork-id',
      review_type: 'artwork_proof' as const,
      image_url: 'https://example.com/image.jpg',
      fal_generation_url: 'https://fal.ai/generation/123',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      pet_name: 'Fluffy'
    }

    it('should return null when human review is disabled', async () => {
      process.env.ENABLE_HUMAN_REVIEW = 'false'
      const result = await createAdminReview(mockReviewData)
      expect(result).toBeNull()
    })

    it('should create review and send email when human review is enabled', async () => {
      process.env.ENABLE_HUMAN_REVIEW = 'true'
      
      const mockReview = {
        id: 'test-review-id',
        ...mockReviewData,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      mockSupabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: mockReview,
        error: null
      })

      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

      const result = await createAdminReview(mockReviewData)
      
      expect(result).toEqual(mockReview)
      
      const { supabaseAdmin } = await import('@/lib/supabase')
      expect(supabaseAdmin.from).toHaveBeenCalledWith('admin_reviews')
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('update_artwork_review_status', {
        p_artwork_id: mockReviewData.artwork_id,
        p_review_type: mockReviewData.review_type,
        p_status: 'pending'
      })
    })

    it('should handle database errors gracefully', async () => {
      process.env.ENABLE_HUMAN_REVIEW = 'true'
      
      mockSupabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      await expect(createAdminReview(mockReviewData)).rejects.toThrow('Database error')
    })

    it('should continue if email sending fails', async () => {
      process.env.ENABLE_HUMAN_REVIEW = 'true'
      
      const mockReview = {
        id: 'test-review-id',
        ...mockReviewData,
        status: 'pending',
        created_at: new Date().toISOString()
      }

      mockSupabaseAdmin.from().insert().select().single.mockResolvedValue({
        data: mockReview,
        error: null
      })

      mockSupabaseAdmin.rpc.mockResolvedValue({ data: null, error: null })

      // Mock email failure
      const { sendAdminReviewNotification } = await import('@/lib/email')
      vi.mocked(sendAdminReviewNotification).mockRejectedValue(new Error('Email failed'))

      const result = await createAdminReview(mockReviewData)
      expect(result).toEqual(mockReview)
    })
  })

  describe('getPendingReviews', () => {
    it('should fetch all pending reviews when no type specified', async () => {
      const mockReviews = [
        {
          review_id: 'review-1',
          artwork_id: 'artwork-1',
          review_type: 'artwork_proof',
          image_url: 'https://example.com/image1.jpg',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          created_at: new Date().toISOString(),
          artwork_token: 'token-1'
        }
      ]

      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: mockReviews,
        error: null
      })

      const result = await getPendingReviews()
      
      expect(result).toEqual(mockReviews)
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('get_pending_reviews', {
        p_review_type: null
      })
    })

    it('should fetch reviews filtered by type', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: [],
        error: null
      })

      await getPendingReviews('artwork_proof')
      
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('get_pending_reviews', {
        p_review_type: 'artwork_proof'
      })
    })

    it('should handle database errors', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      await expect(getPendingReviews()).rejects.toThrow('Database error')
    })
  })

  describe('processAdminReview', () => {
    it('should process review approval successfully', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: true,
        error: null
      })

      const result = await processAdminReview(
        'review-id',
        'approved',
        'admin@example.com',
        'Looks good!'
      )

      expect(result).toBe(true)
      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('process_admin_review', {
        p_review_id: 'review-id',
        p_status: 'approved',
        p_reviewed_by: 'admin@example.com',
        p_notes: 'Looks good!'
      })
    })

    it('should process review rejection successfully', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: true,
        error: null
      })

      const result = await processAdminReview(
        'review-id',
        'rejected',
        'admin@example.com',
        'Quality issues detected'
      )

      expect(result).toBe(true)
    })

    it('should handle review not found', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: false,
        error: null
      })

      const result = await processAdminReview(
        'nonexistent-review',
        'approved',
        'admin@example.com'
      )

      expect(result).toBe(false)
    })

    it('should handle database errors', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      await expect(processAdminReview(
        'review-id',
        'approved',
        'admin@example.com'
      )).rejects.toThrow('Database error')
    })
  })

  describe('updateArtworkReviewStatus', () => {
    it('should update artwork review status successfully', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: null,
        error: null
      })

      await updateArtworkReviewStatus('artwork-id', 'artwork_proof', 'approved')

      expect(mockSupabaseAdmin.rpc).toHaveBeenCalledWith('update_artwork_review_status', {
        p_artwork_id: 'artwork-id',
        p_review_type: 'artwork_proof',
        p_status: 'approved'
      })
    })

    it('should handle database errors', async () => {
      mockSupabaseAdmin.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      })

      await expect(updateArtworkReviewStatus(
        'artwork-id',
        'artwork_proof',
        'approved'
      )).rejects.toThrow('Update failed')
    })
  })

  describe('checkArtworkReviewStatus', () => {
    it('should return artwork review status', async () => {
      const mockStatus = {
        artwork_proof: 'approved',
        highres_file: 'pending'
      }

      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: { review_status: mockStatus },
        error: null
      })

      const result = await checkArtworkReviewStatus('artwork-id')
      
      expect(result).toEqual(mockStatus)
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('artworks')
    })

    it('should return default status when no review_status exists', async () => {
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: { review_status: null },
        error: null
      })

      const result = await checkArtworkReviewStatus('artwork-id')
      
      expect(result).toEqual({
        artwork_proof: 'not_required',
        highres_file: 'not_required'
      })
    })

    it('should handle database errors', async () => {
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Artwork not found' }
      })

      await expect(checkArtworkReviewStatus('artwork-id')).rejects.toThrow('Artwork not found')
    })
  })

  describe('getAdminReview', () => {
    it('should fetch review by ID successfully', async () => {
      const mockReview = {
        id: 'review-id',
        artwork_id: 'artwork-id',
        review_type: 'artwork_proof',
        status: 'pending',
        image_url: 'https://example.com/image.jpg',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        created_at: new Date().toISOString(),
        artworks: { access_token: 'token-123' }
      }

      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: mockReview,
        error: null
      })

      const result = await getAdminReview('review-id')
      
      expect(result).toEqual({
        ...mockReview,
        artwork_token: 'token-123'
      })
    })

    it('should handle review not found', async () => {
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Review not found' }
      })

      await expect(getAdminReview('nonexistent-id')).rejects.toThrow('Review not found')
    })
  })

  describe('waitForReviewApproval', () => {
    it('should return true immediately when human review is disabled', async () => {
      process.env.ENABLE_HUMAN_REVIEW = 'false'
      
      const result = await waitForReviewApproval('artwork-id', 'artwork_proof', 1)
      expect(result).toBe(true)
    })

    it('should return true when review is approved', async () => {
      process.env.ENABLE_HUMAN_REVIEW = 'true'
      
      // Mock approved status
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: { 
          review_status: { 
            artwork_proof: 'approved',
            highres_file: 'not_required'
          } 
        },
        error: null
      })

      const result = await waitForReviewApproval('artwork-id', 'artwork_proof', 1)
      expect(result).toBe(true)
    })

    it('should return false when review is rejected', async () => {
      process.env.ENABLE_HUMAN_REVIEW = 'true'
      
      // Mock rejected status
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: { 
          review_status: { 
            artwork_proof: 'rejected',
            highres_file: 'not_required'
          } 
        },
        error: null
      })

      const result = await waitForReviewApproval('artwork-id', 'artwork_proof', 1)
      expect(result).toBe(false)
    })

    it('should timeout and return true after max wait time', async () => {
      process.env.ENABLE_HUMAN_REVIEW = 'true'
      
      // Mock pending status (never changes)
      mockSupabaseAdmin.from().select().eq().single.mockResolvedValue({
        data: { 
          review_status: { 
            artwork_proof: 'pending',
            highres_file: 'not_required'
          } 
        },
        error: null
      })

      // Use very short timeout for test
      const startTime = Date.now()
      const result = await waitForReviewApproval('artwork-id', 'artwork_proof', 0.01) // 0.6 seconds
      const elapsed = Date.now() - startTime
      
      expect(result).toBe(true) // Should timeout and allow process to continue
      expect(elapsed).toBeGreaterThan(500) // Should have waited at least 0.5 seconds
    }, 10000) // 10 second test timeout
  })
})
