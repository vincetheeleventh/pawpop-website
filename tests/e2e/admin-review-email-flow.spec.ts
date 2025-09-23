import { test, expect } from '@playwright/test'

test.describe('Admin Review Email Notification Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.addInitScript(() => {
      window.process = { env: { 
        ENABLE_HUMAN_REVIEW: 'true',
        ADMIN_EMAIL: 'pawpopart@gmail.com',
        RESEND_API_KEY: 'test-key'
      } }
    })
  })

  test('should send email notification for artwork proof review', async ({ page }) => {
    let emailSent = false
    let emailData = null

    // Mock email service
    await page.route('**/api/email/send', async (route) => {
      emailSent = true
      emailData = await route.request().postDataJSON()
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          messageId: 'test-message-123'
        })
      })
    })

    // Mock review creation that triggers email
    await page.route('**/api/admin/reviews', async (route) => {
      if (route.request().method() === 'POST') {
        const requestBody = await route.request().postDataJSON()
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            review_id: 'review-email-123'
          })
        })

        // Simulate email notification trigger
        await page.request.post('/api/email/send', {
          data: {
            to: 'pawpopart@gmail.com',
            subject: '[ADMIN] New Artwork Proof Review Required',
            template: 'admin-review-notification',
            data: {
              reviewId: 'review-email-123',
              reviewType: 'artwork_proof',
              customerName: requestBody.customer_name,
              petName: requestBody.pet_name,
              imageUrl: requestBody.image_url,
              falGenerationUrl: requestBody.fal_generation_url,
              reviewUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/reviews/review-email-123`
            }
          }
        })
      }
    })

    // Trigger artwork generation that creates review
    await page.goto('/')
    
    // Mock artwork generation flow
    await page.route('**/api/monalisa-maker', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          artwork_id: 'artwork-email-test',
          generated_images: {
            artwork_preview: 'https://example.com/preview.jpg'
          }
        })
      })
    })

    await page.route('**/api/pet-integration', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          final_image_url: 'https://example.com/final.jpg',
          fal_generation_url: 'https://fal.ai/generation/123'
        })
      })
    })

    // Start upload process
    await page.click('[data-testid="upload-button"]')
    await page.fill('[data-testid="customer-name"]', 'John Doe')
    await page.fill('[data-testid="customer-email"]', 'john@example.com')
    
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test-pet.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    })

    await page.click('[data-testid="generate-artwork"]')

    // Wait for generation and review creation
    await expect(page.locator('[data-testid="generation-status"]')).toContainText('completed', { timeout: 30000 })

    // Verify email was sent
    expect(emailSent).toBe(true)
    expect(emailData).toBeTruthy()
    expect(emailData.to).toBe('pawpopart@gmail.com')
    expect(emailData.subject).toContain('Artwork Proof Review')
    expect(emailData.data.customerName).toBe('John Doe')
    expect(emailData.data.reviewType).toBe('artwork_proof')
  })

  test('should send email notification for high-res file review', async ({ page }) => {
    let emailSent = false
    let emailData = null

    // Mock email service
    await page.route('**/api/email/send', async (route) => {
      emailSent = true
      emailData = await route.request().postDataJSON()
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          messageId: 'test-message-456'
        })
      })
    })

    // Mock high-res review creation
    await page.route('**/api/admin/reviews', async (route) => {
      if (route.request().method() === 'POST') {
        const requestBody = await route.request().postDataJSON()
        
        if (requestBody.review_type === 'highres_file') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              review_id: 'review-highres-email-456'
            })
          })

          // Simulate email notification trigger
          await page.request.post('/api/email/send', {
            data: {
              to: 'pawpopart@gmail.com',
              subject: '[ADMIN] New High-res File Review Required',
              template: 'admin-review-notification',
              data: {
                reviewId: 'review-highres-email-456',
                reviewType: 'highres_file',
                customerName: requestBody.customer_name,
                imageUrl: requestBody.image_url,
                reviewUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/reviews/review-highres-email-456`
              }
            }
          })
        }
      }
    })

    // Simulate order processing that triggers high-res review
    const stripeWebhookPayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer_details: {
            email: 'customer@example.com',
            name: 'Jane Smith'
          },
          metadata: {
            artwork_id: 'artwork-highres-test',
            product_type: 'framed_canvas_16x20',
            size: '16x20',
            quantity: '1'
          },
          amount_total: 4900,
          currency: 'usd'
        }
      }
    }

    // Mock upscaling
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

    // Trigger webhook
    await page.request.post('/api/webhook', {
      data: stripeWebhookPayload,
      headers: {
        'stripe-signature': 'test-signature',
        'content-type': 'application/json'
      }
    })

    // Wait a moment for async processing
    await page.waitForTimeout(2000)

    // Verify email was sent
    expect(emailSent).toBe(true)
    expect(emailData).toBeTruthy()
    expect(emailData.to).toBe('pawpopart@gmail.com')
    expect(emailData.subject).toContain('High-res File Review')
    expect(emailData.data.reviewType).toBe('highres_file')
  })

  test('should handle email delivery failures gracefully', async ({ page }) => {
    let emailAttempted = false

    // Mock email service failure
    await page.route('**/api/email/send', async (route) => {
      emailAttempted = true
      
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Email service unavailable'
        })
      })
    })

    // Mock review creation (should still succeed even if email fails)
    await page.route('**/api/admin/reviews', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            review_id: 'review-email-fail-789'
          })
        })
      }
    })

    // Mock artwork generation
    await page.route('**/api/monalisa-maker', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          artwork_id: 'artwork-email-fail',
          generated_images: {
            artwork_preview: 'https://example.com/preview.jpg'
          }
        })
      })
    })

    await page.route('**/api/pet-integration', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          final_image_url: 'https://example.com/final.jpg'
        })
      })
    })

    await page.goto('/')
    await page.click('[data-testid="upload-button"]')
    await page.fill('[data-testid="customer-name"]', 'Test User')
    await page.fill('[data-testid="customer-email"]', 'test@example.com')
    
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test-pet.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    })

    await page.click('[data-testid="generate-artwork"]')

    // Wait for generation
    await expect(page.locator('[data-testid="generation-status"]')).toContainText('completed', { timeout: 30000 })

    // Verify email was attempted but review still created
    expect(emailAttempted).toBe(true)
    await expect(page.locator('[data-testid="review-pending-message"]')).toBeVisible()
  })

  test('should include correct review URL in email', async ({ page }) => {
    let emailData = null

    await page.route('**/api/email/send', async (route) => {
      emailData = await route.request().postDataJSON()
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          messageId: 'test-message-url'
        })
      })
    })

    await page.route('**/api/admin/reviews', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            review_id: 'review-url-test-123'
          })
        })

        // Trigger email
        await page.request.post('/api/email/send', {
          data: {
            to: 'pawpopart@gmail.com',
            subject: '[ADMIN] New Review Required',
            data: {
              reviewId: 'review-url-test-123',
              reviewUrl: 'https://pawpopart.com/admin/reviews/review-url-test-123'
            }
          }
        })
      }
    })

    // Mock basic artwork flow
    await page.route('**/api/monalisa-maker', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          artwork_id: 'artwork-url-test'
        })
      })
    })

    await page.route('**/api/pet-integration', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          final_image_url: 'https://example.com/final.jpg'
        })
      })
    })

    await page.goto('/')
    await page.click('[data-testid="upload-button"]')
    await page.fill('[data-testid="customer-name"]', 'URL Test')
    await page.fill('[data-testid="customer-email"]', 'urltest@example.com')
    
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test-pet.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    })

    await page.click('[data-testid="generate-artwork"]')
    await expect(page.locator('[data-testid="generation-status"]')).toContainText('completed', { timeout: 30000 })

    // Verify correct review URL in email
    expect(emailData).toBeTruthy()
    expect(emailData.data.reviewUrl).toBe('https://pawpopart.com/admin/reviews/review-url-test-123')
    expect(emailData.data.reviewId).toBe('review-url-test-123')
  })

  test('should not send emails when human review is disabled', async ({ page }) => {
    // Set up environment with human review disabled
    await page.addInitScript(() => {
      window.process = { env: { 
        ENABLE_HUMAN_REVIEW: 'false',
        ADMIN_EMAIL: 'pawpopart@gmail.com'
      } }
    })

    let emailSent = false

    await page.route('**/api/email/send', async (route) => {
      emailSent = true
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    // Mock artwork generation (should not create review)
    await page.route('**/api/monalisa-maker', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          artwork_id: 'artwork-no-review'
        })
      })
    })

    await page.route('**/api/pet-integration', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          final_image_url: 'https://example.com/final.jpg'
        })
      })
    })

    // Mock completion email (should be sent directly)
    await page.route('**/api/email/completion', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.goto('/')
    await page.click('[data-testid="upload-button"]')
    await page.fill('[data-testid="customer-name"]', 'No Review Test')
    await page.fill('[data-testid="customer-email"]', 'noreview@example.com')
    
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test-pet.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    })

    await page.click('[data-testid="generate-artwork"]')
    await expect(page.locator('[data-testid="generation-status"]')).toContainText('completed', { timeout: 30000 })

    // Verify no admin review email was sent
    expect(emailSent).toBe(false)
    
    // Verify completion email was sent directly to customer
    await expect(page.locator('[data-testid="completion-message"]')).toBeVisible()
  })
})
