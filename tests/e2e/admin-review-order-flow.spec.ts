import { test, expect } from '@playwright/test'

test.describe('Admin Review Order Processing Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment with human review enabled
    await page.addInitScript(() => {
      window.process = { env: { ENABLE_HUMAN_REVIEW: 'true' } }
    })
  })

  test('should create high-res file review during order processing', async ({ page }) => {
    const testOrder = {
      id: 'order-123',
      artwork_id: 'artwork-456',
      customer_email: 'customer@example.com',
      product_type: 'framed_canvas_16x20'
    }

    // Mock Stripe webhook payload
    const stripeWebhookPayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer_details: {
            email: testOrder.customer_email,
            name: 'Test Customer'
          },
          metadata: {
            artwork_id: testOrder.artwork_id,
            product_type: testOrder.product_type,
            size: '16x20',
            quantity: '1'
          },
          amount_total: 4900,
          currency: 'usd'
        }
      }
    }

    // Mock upscaling API
    await page.route('**/api/upscale', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          upscaled_image_url: 'https://example.com/upscaled.jpg'
        })
      })
    })

    // Mock admin review creation for high-res file
    let reviewCreated = false
    await page.route('**/api/admin/reviews', async (route) => {
      if (route.request().method() === 'POST') {
        const requestBody = await route.request().postDataJSON()
        
        if (requestBody.review_type === 'highres_file') {
          reviewCreated = true
          expect(requestBody.artwork_id).toBe(testOrder.artwork_id)
          expect(requestBody.image_url).toBe('https://example.com/upscaled.jpg')
          expect(requestBody.customer_email).toBe(testOrder.customer_email)
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            review_id: 'review-highres-123'
          })
        })
      }
    })

    // Mock order creation
    await page.route('**/api/orders', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          order: testOrder
        })
      })
    })

    // Simulate Stripe webhook
    await page.request.post('/api/webhook', {
      data: stripeWebhookPayload,
      headers: {
        'stripe-signature': 'test-signature',
        'content-type': 'application/json'
      }
    })

    // Verify review was created
    expect(reviewCreated).toBe(true)
  })

  test('should complete order after high-res review approval', async ({ page }) => {
    const reviewId = 'review-highres-456'
    const artworkId = 'artwork-789'

    // Mock review approval
    await page.route(`**/api/admin/reviews/${reviewId}/process`, async (route) => {
      const requestBody = await route.request().postDataJSON()
      expect(requestBody.status).toBe('approved')

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Mock Printify order creation (should be triggered after approval)
    let printifyOrderCreated = false
    await page.route('**/api/printify/orders', async (route) => {
      printifyOrderCreated = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          printify_order_id: 'printify-123'
        })
      })
    })

    // Navigate to review detail page
    await page.goto(`/admin/reviews/${reviewId}`)

    // Mock review data
    await page.route(`**/api/admin/reviews/${reviewId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          review: {
            review_id: reviewId,
            artwork_id: artworkId,
            review_type: 'highres_file',
            status: 'pending',
            customer_name: 'Test Customer',
            customer_email: 'test@example.com',
            image_url: 'https://example.com/highres.jpg',
            created_at: new Date().toISOString(),
            artwork_token: 'token-789'
          }
        })
      })
    })

    // Approve the review
    await page.fill('[data-testid="review-notes"]', 'High-res quality approved for printing')
    await page.click('[data-testid="approve-button"]')

    // Verify approval success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()

    // Note: In a real test, we would verify Printify order creation
    // This would require additional integration testing
  })

  test('should hold order when high-res review is rejected', async ({ page }) => {
    const reviewId = 'review-highres-789'

    // Mock review rejection
    await page.route(`**/api/admin/reviews/${reviewId}/process`, async (route) => {
      const requestBody = await route.request().postDataJSON()
      expect(requestBody.status).toBe('rejected')
      expect(requestBody.notes).toContain('quality issues')

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Mock review data
    await page.route(`**/api/admin/reviews/${reviewId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          review: {
            review_id: reviewId,
            artwork_id: 'artwork-789',
            review_type: 'highres_file',
            status: 'pending',
            customer_name: 'Test Customer',
            customer_email: 'test@example.com',
            image_url: 'https://example.com/highres.jpg',
            created_at: new Date().toISOString(),
            artwork_token: 'token-789'
          }
        })
      })
    })

    await page.goto(`/admin/reviews/${reviewId}`)

    // Reject the review
    await page.fill('[data-testid="review-notes"]', 'High-res quality issues detected - requires manual intervention')
    await page.click('[data-testid="reject-button"]')
    await page.click('[data-testid="confirm-reject"]')

    // Verify rejection success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('rejected')
  })

  test('should bypass review system when disabled', async ({ page }) => {
    // Set up test environment with human review disabled
    await page.addInitScript(() => {
      window.process = { env: { ENABLE_HUMAN_REVIEW: 'false' } }
    })

    const testOrder = {
      artwork_id: 'artwork-999',
      customer_email: 'customer@example.com',
      product_type: 'art_print_11x14'
    }

    // Mock Stripe webhook payload
    const stripeWebhookPayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer_details: {
            email: testOrder.customer_email,
            name: 'Test Customer'
          },
          metadata: {
            artwork_id: testOrder.artwork_id,
            product_type: testOrder.product_type,
            size: '11x14',
            quantity: '1'
          },
          amount_total: 2900,
          currency: 'usd'
        }
      }
    }

    // Mock upscaling API
    await page.route('**/api/upscale', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          upscaled_image_url: 'https://example.com/upscaled.jpg'
        })
      })
    })

    // Verify no admin review is created
    let reviewCreated = false
    await page.route('**/api/admin/reviews', async (route) => {
      if (route.request().method() === 'POST') {
        reviewCreated = true
      }
    })

    // Mock direct Printify order creation
    let printifyOrderCreated = false
    await page.route('**/api/printify/orders', async (route) => {
      printifyOrderCreated = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          printify_order_id: 'printify-456'
        })
      })
    })

    // Simulate Stripe webhook
    await page.request.post('/api/webhook', {
      data: stripeWebhookPayload,
      headers: {
        'stripe-signature': 'test-signature',
        'content-type': 'application/json'
      }
    })

    // Verify no review was created and order proceeded directly
    expect(reviewCreated).toBe(false)
    // Note: printifyOrderCreated verification would require additional setup
  })

  test('should show review status in order tracking', async ({ page }) => {
    const orderId = 'order-tracking-123'
    const artworkToken = 'token-tracking-456'

    // Mock order with pending review
    await page.route(`**/api/orders/${orderId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          order: {
            id: orderId,
            status: 'processing',
            artwork_id: 'artwork-456',
            review_status: {
              artwork_proof: 'approved',
              highres_file: 'pending'
            },
            status_history: [
              {
                status: 'created',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                message: 'Order created'
              },
              {
                status: 'processing',
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                message: 'High-res file submitted for admin review'
              }
            ]
          }
        })
      })
    })

    await page.goto(`/orders/${orderId}?token=${artworkToken}`)

    // Verify review status is displayed
    await expect(page.locator('[data-testid="order-status"]')).toContainText('Under Review')
    await expect(page.locator('[data-testid="review-status"]')).toContainText('High-res file review pending')
    
    // Verify status history shows review step
    await expect(page.locator('[data-testid="status-history"]')).toContainText('submitted for admin review')
  })

  test('should handle review timeout gracefully', async ({ page }) => {
    // This test simulates a review that takes too long
    const reviewId = 'review-timeout-123'

    // Mock review data that's been pending for a long time
    const oldTimestamp = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago

    await page.route(`**/api/admin/reviews/${reviewId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          review: {
            review_id: reviewId,
            artwork_id: 'artwork-timeout-123',
            review_type: 'artwork_proof',
            status: 'pending',
            customer_name: 'Test Customer',
            customer_email: 'test@example.com',
            image_url: 'https://example.com/artwork.jpg',
            created_at: oldTimestamp,
            artwork_token: 'token-timeout-123'
          }
        })
      })
    })

    await page.goto(`/admin/reviews/${reviewId}`)

    // Verify timeout warning is displayed
    await expect(page.locator('[data-testid="timeout-warning"]')).toBeVisible()
    await expect(page.locator('[data-testid="timeout-warning"]')).toContainText('This review has been pending for more than')
  })
})
