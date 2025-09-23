import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import AdminReviewsPage from '@/app/admin/reviews/page'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

// Mock fetch
global.fetch = vi.fn()

describe('Admin Reviews Dashboard', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn()
    })
  })

  it('should render loading state initially', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<AdminReviewsPage />)
    
    expect(screen.getByText('Loading reviews...')).toBeInTheDocument()
  })

  it('should display pending reviews', async () => {
    const mockReviews = [
      {
        review_id: 'review-1',
        artwork_id: 'artwork-1',
        review_type: 'artwork_proof',
        status: 'pending',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        created_at: '2024-01-01T00:00:00Z',
        artwork_token: 'token-123'
      },
      {
        review_id: 'review-2',
        artwork_id: 'artwork-2',
        review_type: 'highres_file',
        status: 'pending',
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        created_at: '2024-01-02T00:00:00Z',
        artwork_token: 'token-456'
      }
    ]

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reviews: mockReviews })
    } as Response)

    render(<AdminReviewsPage />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('Artwork Proof')).toBeInTheDocument()
      expect(screen.getByText('High-res File')).toBeInTheDocument()
    })
  })

  it('should filter reviews by type', async () => {
    const mockReviews = [
      {
        review_id: 'review-1',
        artwork_id: 'artwork-1',
        review_type: 'artwork_proof',
        status: 'pending',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        created_at: '2024-01-01T00:00:00Z',
        artwork_token: 'token-123'
      }
    ]

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reviews: mockReviews })
    } as Response)

    render(<AdminReviewsPage />)

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Click artwork proof filter
    const artworkProofFilter = screen.getByText('Artwork Proofs')
    fireEvent.click(artworkProofFilter)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/admin/reviews?type=artwork_proof')
    })
  })

  it('should navigate to review detail on click', async () => {
    const mockReviews = [
      {
        review_id: 'review-1',
        artwork_id: 'artwork-1',
        review_type: 'artwork_proof',
        status: 'pending',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        created_at: '2024-01-01T00:00:00Z',
        artwork_token: 'token-123'
      }
    ]

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reviews: mockReviews })
    } as Response)

    render(<AdminReviewsPage />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Click on the review row
    const reviewRow = screen.getByText('John Doe').closest('tr')
    fireEvent.click(reviewRow!)

    expect(mockPush).toHaveBeenCalledWith('/admin/reviews/review-1')
  })

  it('should handle API errors gracefully', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('API Error'))

    render(<AdminReviewsPage />)

    await waitFor(() => {
      expect(screen.getByText(/error loading reviews/i)).toBeInTheDocument()
    })
  })

  it('should display empty state when no reviews', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reviews: [] })
    } as Response)

    render(<AdminReviewsPage />)

    await waitFor(() => {
      expect(screen.getByText(/no pending reviews/i)).toBeInTheDocument()
    })
  })

  it('should refresh reviews when refresh button is clicked', async () => {
    const mockReviews = [
      {
        review_id: 'review-1',
        artwork_id: 'artwork-1',
        review_type: 'artwork_proof',
        status: 'pending',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        created_at: '2024-01-01T00:00:00Z',
        artwork_token: 'token-123'
      }
    ]

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reviews: mockReviews })
    } as Response)

    render(<AdminReviewsPage />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    // Click refresh button
    const refreshButton = screen.getByText(/refresh/i)
    fireEvent.click(refreshButton)

    // Should call API again
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2)
    })
  })
})
