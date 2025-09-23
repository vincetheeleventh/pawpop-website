import { test, expect } from '@playwright/test'
import { supabaseAdmin } from '@/lib/supabase'

// Test data
const testCustomer = {
  name: 'Test Customer',
  email: 'test@example.com',
  petName: 'Fluffy'
}

const testArtwork = {
  id: 'test-artwork-' + Date.now(),
  access_token: 'test-token-' + Date.now()
}

test.describe('Admin Review System E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('/')
    
    // Mock environment to enable human review
    await page.addInitScript(() => {
      window.process = { env: { ENABLE_HUMAN_REVIEW: 'true' } }
    })
  })

  test.afterEach(async () => {
    // Cleanup test data
    try {
      await supabaseAdmin
        .from('admin_reviews')
        .delete()
        .like('customer_email', 'test@%')
    } catch (error) {
      console.log('Cleanup error (expected in test environment):', error)
    }
  })

  test('should create artwork proof review during upload flow', async ({ page }) => {
    // Mock successful artwork generation
    await page.route('**/api/monalisa-maker', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          artwork_id: testArtwork.id,
          generated_images: {
            artwork_preview: 'https://example.com/preview.jpg',
            artwork_full_res: 'https://example.com/fullres.jpg'
          },
          fal_generation_url: 'https://fal.ai/generation/123'
        })
      })
    })

    // Mock pet integration
    await page.route('**/api/pet-integration', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          final_image_url: 'https://example.com/final.jpg',
          fal_generation_url: 'https://fal.ai/generation/456'
        })
      })
    })

    // Mock admin review creation
    await page.route('**/api/admin/reviews', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            review_id: 'test-review-123'
          })
        })
      }
    })

    // Start upload flow
    await page.click('[data-testid="upload-button"]')
    
    // Fill form
    await page.fill('[data-testid="customer-name"]', testCustomer.name)
    await page.fill('[data-testid="customer-email"]', testCustomer.email)
    
    // Upload file (mock)
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test-pet.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    })

    // Submit form
    await page.click('[data-testid="generate-artwork"]')

    // Wait for generation to complete
    await expect(page.locator('[data-testid="generation-status"]')).toContainText('completed', { timeout: 30000 })

    // Verify review was created (check for human review message)
    await expect(page.locator('[data-testid="review-pending-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="review-pending-message"]')).toContainText('admin review')
  })

  test('should display pending reviews in admin dashboard', async ({ page }) => {
    // Create test review data
    const mockReviews = [
      {
        review_id: 'review-1',
        artwork_id: 'artwork-1',
        review_type: 'artwork_proof',
        status: 'pending',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        pet_name: 'Buddy',
        created_at: new Date().toISOString(),
        artwork_token: 'token-123',
        image_url: 'https://example.com/artwork1.jpg'
      },
      {
        review_id: 'review-2',
        artwork_id: 'artwork-2',
        review_type: 'highres_file',
        status: 'pending',
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        pet_name: 'Max',
        created_at: new Date().toISOString(),
        artwork_token: 'token-456',
        image_url: 'https://example.com/artwork2.jpg'
      }
    ]

    // Mock API response
    await page.route('**/api/admin/reviews', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reviews: mockReviews })
      })
    })

    // Navigate to admin dashboard
    await page.goto('/admin/reviews')

    // Verify page loads
    await expect(page.locator('h1')).toContainText('Admin Reviews')

    // Verify reviews are displayed
    await expect(page.locator('[data-testid="review-item"]')).toHaveCount(2)
    
    // Check first review details
    const firstReview = page.locator('[data-testid="review-item"]').first()
    await expect(firstReview).toContainText('John Doe')
    await expect(firstReview).toContainText('Artwork Proof')
    await expect(firstReview).toContainText('Buddy')

    // Check second review details
    const secondReview = page.locator('[data-testid="review-item"]').nth(1)
    await expect(secondReview).toContainText('Jane Smith')
    await expect(secondReview).toContainText('High-res File')
    await expect(secondReview).toContainText('Max')
  })

  test('should filter reviews by type', async ({ page }) => {
    const mockArtworkProofReviews = [
      {
        review_id: 'review-1',
        artwork_id: 'artwork-1',
        review_type: 'artwork_proof',
        status: 'pending',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        created_at: new Date().toISOString(),
        artwork_token: 'token-123'
      }
    ]

    // Mock filtered API response
    await page.route('**/api/admin/reviews?type=artwork_proof', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reviews: mockArtworkProofReviews })
      })
    })

    // Mock all reviews response
    await page.route('**/api/admin/reviews', async (route) => {
      if (!route.request().url().includes('type=')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ reviews: [] })
        })
      }
    })

    await page.goto('/admin/reviews')

    // Click artwork proof filter
    await page.click('[data-testid="filter-artwork-proof"]')

    // Verify filtered results
    await expect(page.locator('[data-testid="review-item"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="review-item"]')).toContainText('Artwork Proof')
  })

  test('should navigate to review detail page', async ({ page }) => {
    const mockReview = {
      review_id: 'review-123',
      artwork_id: 'artwork-123',
      review_type: 'artwork_proof',
      status: 'pending',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      pet_name: 'Buddy',
      image_url: 'https://example.com/artwork.jpg',
      fal_generation_url: 'https://fal.ai/generation/789',
      created_at: new Date().toISOString(),
      artwork_token: 'token-123'
    }

    // Mock reviews list
    await page.route('**/api/admin/reviews', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reviews: [mockReview] })
      })
    })

    // Mock review detail
    await page.route('**/api/admin/reviews/review-123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ review: mockReview })
      })
    })

    await page.goto('/admin/reviews')

    // Click on review item
    await page.click('[data-testid="review-item"]')

    // Verify navigation to detail page
    await expect(page).toHaveURL('/admin/reviews/review-123')
    
    // Verify review details are displayed
    await expect(page.locator('h1')).toContainText('Review Details')
    await expect(page.locator('[data-testid="customer-name"]')).toContainText('John Doe')
    await expect(page.locator('[data-testid="customer-email"]')).toContainText('john@example.com')
    await expect(page.locator('[data-testid="pet-name"]')).toContainText('Buddy')
    await expect(page.locator('[data-testid="review-type"]')).toContainText('Artwork Proof')
    
    // Verify artwork image is displayed
    await expect(page.locator('[data-testid="artwork-image"]')).toBeVisible()
    await expect(page.locator('[data-testid="artwork-image"]')).toHaveAttribute('src', mockReview.image_url)
    
    // Verify fal.ai link is present
    await expect(page.locator('[data-testid="fal-generation-link"]')).toHaveAttribute('href', mockReview.fal_generation_url)
  })

  test('should approve review successfully', async ({ page }) => {
    const mockReview = {
      review_id: 'review-123',
      artwork_id: 'artwork-123',
      review_type: 'artwork_proof',
      status: 'pending',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      image_url: 'https://example.com/artwork.jpg',
      created_at: new Date().toISOString(),
      artwork_token: 'token-123'
    }

    // Mock review detail
    await page.route('**/api/admin/reviews/review-123', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ review: mockReview })
        })
      }
    })

    // Mock approval process
    await page.route('**/api/admin/reviews/review-123/process', async (route) => {
      const requestBody = await route.request().postDataJSON()
      expect(requestBody.status).toBe('approved')
      expect(requestBody.reviewedBy).toBeTruthy()
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.goto('/admin/reviews/review-123')

    // Fill review notes
    await page.fill('[data-testid="review-notes"]', 'Quality looks excellent!')

    // Click approve button
    await page.click('[data-testid="approve-button"]')

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('approved successfully')
  })

  test('should reject review with notes', async ({ page }) => {
    const mockReview = {
      review_id: 'review-456',
      artwork_id: 'artwork-456',
      review_type: 'highres_file',
      status: 'pending',
      customer_name: 'Jane Smith',
      customer_email: 'jane@example.com',
      image_url: 'https://example.com/highres.jpg',
      created_at: new Date().toISOString(),
      artwork_token: 'token-456'
    }

    // Mock review detail
    await page.route('**/api/admin/reviews/review-456', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ review: mockReview })
        })
      }
    })

    // Mock rejection process
    await page.route('**/api/admin/reviews/review-456/process', async (route) => {
      const requestBody = await route.request().postDataJSON()
      expect(requestBody.status).toBe('rejected')
      expect(requestBody.notes).toBe('Quality issues detected - image is blurry')
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.goto('/admin/reviews/review-456')

    // Fill rejection notes
    await page.fill('[data-testid="review-notes"]', 'Quality issues detected - image is blurry')

    // Click reject button
    await page.click('[data-testid="reject-button"]')

    // Confirm rejection in dialog
    await page.click('[data-testid="confirm-reject"]')

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('rejected successfully')
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/admin/reviews', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })

    await page.goto('/admin/reviews')

    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Error loading reviews')
  })

  test('should refresh reviews when refresh button is clicked', async ({ page }) => {
    let requestCount = 0
    
    await page.route('**/api/admin/reviews', async (route) => {
      requestCount++
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          reviews: [{
            review_id: `review-${requestCount}`,
            customer_name: `Customer ${requestCount}`,
            review_type: 'artwork_proof',
            status: 'pending',
            created_at: new Date().toISOString(),
            artwork_token: 'token-123'
          }]
        })
      })
    })

    await page.goto('/admin/reviews')

    // Verify initial load
    await expect(page.locator('[data-testid="review-item"]')).toContainText('Customer 1')

    // Click refresh button
    await page.click('[data-testid="refresh-button"]')

    // Verify data refreshed
    await expect(page.locator('[data-testid="review-item"]')).toContainText('Customer 2')
    expect(requestCount).toBe(2)
  })

  test('should show empty state when no reviews', async ({ page }) => {
    await page.route('**/api/admin/reviews', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ reviews: [] })
      })
    })

    await page.goto('/admin/reviews')

    // Verify empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
    await expect(page.locator('[data-testid="empty-state"]')).toContainText('No pending reviews')
  })
})
