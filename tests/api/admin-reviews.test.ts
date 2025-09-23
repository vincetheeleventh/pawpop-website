import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/admin/reviews/route'
import { GET as GetReview } from '@/app/api/admin/reviews/[reviewId]/route'
import { POST as ProcessReview } from '@/app/api/admin/reviews/[reviewId]/process/route'

// Mock admin-review lib
const mockGetPendingReviews = vi.fn()
const mockGetAdminReview = vi.fn()
const mockProcessAdminReview = vi.fn()

vi.mock('@/lib/admin-review', () => ({
  getPendingReviews: mockGetPendingReviews,
  getAdminReview: mockGetAdminReview,
  processAdminReview: mockProcessAdminReview
}))

describe('Admin Reviews API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/reviews', () => {
    it('should fetch all pending reviews', async () => {
      const mockReviews = [
        {
          review_id: 'review-1',
          artwork_id: 'artwork-1',
          review_type: 'artwork_proof',
          status: 'pending',
          customer_name: 'John Doe',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      mockGetPendingReviews.mockResolvedValue(mockReviews)

      const request = new Request('http://localhost/api/admin/reviews')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.reviews).toEqual(mockReviews)
      expect(mockGetPendingReviews).toHaveBeenCalledWith(undefined)
    })

    it('should filter reviews by type', async () => {
      mockGetPendingReviews.mockResolvedValue([])

      const request = new Request('http://localhost/api/admin/reviews?type=artwork_proof')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockGetPendingReviews).toHaveBeenCalledWith('artwork_proof')
    })

    it('should handle database errors', async () => {
      mockGetPendingReviews.mockRejectedValue(new Error('Database error'))

      const request = new Request('http://localhost/api/admin/reviews')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('GET /api/admin/reviews/[reviewId]', () => {
    it('should fetch review by ID', async () => {
      const mockReview = {
        id: 'review-1',
        artwork_id: 'artwork-1',
        review_type: 'artwork_proof',
        status: 'pending',
        image_url: 'https://example.com/image.jpg',
        customer_name: 'John Doe'
      }

      mockGetAdminReview.mockResolvedValue(mockReview)

      const request = new Request('http://localhost/api/admin/reviews/review-1')
      const response = await GetReview(request, { params: { reviewId: 'review-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.review).toEqual(mockReview)
      expect(mockGetAdminReview).toHaveBeenCalledWith('review-1')
    })

    it('should return 404 for non-existent review', async () => {
      mockGetAdminReview.mockResolvedValue(null)

      const request = new Request('http://localhost/api/admin/reviews/nonexistent')
      const response = await GetReview(request, { params: { reviewId: 'nonexistent' } })

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/admin/reviews/[reviewId]/process', () => {
    it('should process review approval', async () => {
      mockProcessAdminReview.mockResolvedValue(true)

      const request = new Request('http://localhost/api/admin/reviews/review-1/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          reviewedBy: 'admin@example.com',
          notes: 'Looks good!'
        })
      })

      const response = await ProcessReview(request, { params: { reviewId: 'review-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockProcessAdminReview).toHaveBeenCalledWith(
        'review-1',
        'approved',
        'admin@example.com',
        'Looks good!'
      )
    })

    it('should handle invalid request body', async () => {
      const request = new Request('http://localhost/api/admin/reviews/review-1/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'invalid_status'
        })
      })

      const response = await ProcessReview(request, { params: { reviewId: 'review-1' } })

      expect(response.status).toBe(400)
    })

    it('should return 404 for non-existent review', async () => {
      mockProcessAdminReview.mockResolvedValue(false)

      const request = new Request('http://localhost/api/admin/reviews/nonexistent/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'approved',
          reviewedBy: 'admin@example.com'
        })
      })

      const response = await ProcessReview(request, { params: { reviewId: 'nonexistent' } })

      expect(response.status).toBe(404)
    })
  })
})
