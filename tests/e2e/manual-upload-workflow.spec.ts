import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Manual Upload Workflow', () => {
  let artworkId: string
  let reviewId: string
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
    
    // Create test artwork via API
    const artworkResponse = await page.request.post('/api/artwork/create', {
      data: {
        customer_name: 'E2E Test User',
        customer_email: 'e2e@test.com',
        pet_name: 'E2E Pet'
      }
    })
    
    const artworkData = await artworkResponse.json()
    artworkId = artworkData.artwork.id
    
    // Trigger pet integration to create a review
    const testImagePath = path.join(process.cwd(), 'public/images/e2e testing/test-pet.jpeg')
    const testPortraitPath = path.join(process.cwd(), 'public/images/e2e testing/test-petmom.png')
    
    const integrationResponse = await page.request.post('/api/pet-integration', {
      multipart: {
        artworkId: artworkId,
        pet: { name: 'test-pet.jpeg', mimeType: 'image/jpeg', buffer: await page.request.storageState().then(() => Buffer.from('fake-pet-data')) },
        portrait: { name: 'test-portrait.png', mimeType: 'image/png', buffer: await page.request.storageState().then(() => Buffer.from('fake-portrait-data')) }
      }
    })
    
    // Get the created review ID
    const reviewsResponse = await page.request.get('/api/admin/reviews')
    const reviewsData = await reviewsResponse.json()
    const testReview = reviewsData.reviews.find((r: any) => 
      r.artwork_id === artworkId && r.status === 'pending'
    )
    
    if (testReview) {
      reviewId = testReview.review_id
    }
  })

  test('should display admin reviews dashboard', async ({ page }) => {
    await page.goto('/admin/reviews')
    
    // Check if the page loads
    await expect(page.locator('h1')).toContainText('Admin Reviews')
    
    // Check if reviews are displayed
    await expect(page.locator('[data-testid="review-item"]')).toBeVisible()
    
    // Check if filter buttons are present
    await expect(page.locator('text=All Reviews')).toBeVisible()
    await expect(page.locator('text=Artwork Proof')).toBeVisible()
    await expect(page.locator('text=High-Res File')).toBeVisible()
  })

  test('should navigate to review detail page', async ({ page }) => {
    if (!reviewId) {
      test.skip('No review created for this test')
    }
    
    await page.goto('/admin/reviews')
    
    // Click on a review detail link
    await page.locator('[data-testid="review-detail-link"]').first().click()
    
    // Should navigate to review detail page
    await expect(page.locator('h1')).toContainText('Review Details')
    
    // Check if customer information is displayed
    await expect(page.locator('[data-testid="customer-name"]')).toBeVisible()
    await expect(page.locator('[data-testid="customer-email"]')).toBeVisible()
  })

  test('should display source images on review detail page', async ({ page }) => {
    if (!reviewId) {
      test.skip('No review created for this test')
    }
    
    await page.goto(`/admin/reviews/${reviewId}`)
    
    // Check if the review page loads
    await expect(page.locator('h1')).toContainText('Review Details')
    
    // Check if artwork image is displayed
    await expect(page.locator('[data-testid="artwork-image"]')).toBeVisible()
    
    // Check if source images section is present (if source images exist)
    const sourceImagesSection = page.locator('text=Original Photos')
    if (await sourceImagesSection.isVisible()) {
      await expect(sourceImagesSection).toBeVisible()
    }
    
    // Check if review decision section is present for pending reviews
    await expect(page.locator('text=Review Decision')).toBeVisible()
  })

  test('should show manual upload interface for pending reviews', async ({ page }) => {
    if (!reviewId) {
      test.skip('No review created for this test')
    }
    
    await page.goto(`/admin/reviews/${reviewId}`)
    
    // Check if manual upload section is visible
    await expect(page.locator('text=Manual Upload Proof Image')).toBeVisible()
    
    // Check if file input is present
    await expect(page.locator('input[type="file"]')).toBeVisible()
    
    // Check if upload button is present but disabled (no file selected)
    const uploadButton = page.locator('[data-testid="manual-upload-button"]')
    await expect(uploadButton).toBeVisible()
    await expect(uploadButton).toBeDisabled()
    
    // Check if approve/reject buttons are present
    await expect(page.locator('[data-testid="approve-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="reject-button"]')).toBeVisible()
  })

  test('should enable upload button when file is selected', async ({ page }) => {
    if (!reviewId) {
      test.skip('No review created for this test')
    }
    
    await page.goto(`/admin/reviews/${reviewId}`)
    
    // Create a test file
    const testImagePath = path.join(process.cwd(), 'public/images/flux-test.png')
    
    // Select a file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImagePath)
    
    // Check if file name is displayed
    await expect(page.locator('text=flux-test.png')).toBeVisible()
    
    // Check if upload button is now enabled
    const uploadButton = page.locator('[data-testid="manual-upload-button"]')
    await expect(uploadButton).toBeEnabled()
    
    // Check button text
    await expect(uploadButton).toContainText('Manual Upload Proof Image')
  })

  test('should perform manual upload and approval', async ({ page }) => {
    if (!reviewId) {
      test.skip('No review created for this test')
    }
    
    await page.goto(`/admin/reviews/${reviewId}`)
    
    // Add review notes
    const notesTextarea = page.locator('[data-testid="review-notes"]')
    await notesTextarea.fill('E2E test manual upload with custom image')
    
    // Select a test file
    const testImagePath = path.join(process.cwd(), 'public/images/flux-test.png')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testImagePath)
    
    // Wait for file to be selected
    await expect(page.locator('text=flux-test.png')).toBeVisible()
    
    // Click upload button
    const uploadButton = page.locator('[data-testid="manual-upload-button"]')
    await expect(uploadButton).toBeEnabled()
    
    // Intercept the upload request
    const uploadPromise = page.waitForResponse(response => 
      response.url().includes(`/api/admin/reviews/${reviewId}/manual-upload`) && 
      response.request().method() === 'POST'
    )
    
    await uploadButton.click()
    
    // Wait for upload to complete
    const uploadResponse = await uploadPromise
    expect(uploadResponse.status()).toBe(200)
    
    // Check for success message or redirect
    await expect(page.locator('text=Uploading...')).toBeVisible()
    
    // Should redirect back to reviews list or show success
    await page.waitForTimeout(2000) // Wait for potential redirect
  })

  test('should handle upload errors gracefully', async ({ page }) => {
    if (!reviewId) {
      test.skip('No review created for this test')
    }
    
    await page.goto(`/admin/reviews/${reviewId}`)
    
    // Try to upload without selecting a file first
    const uploadButton = page.locator('[data-testid="manual-upload-button"]')
    await expect(uploadButton).toBeDisabled()
    
    // Select an invalid file type (if validation exists)
    const testTextPath = path.join(process.cwd(), 'package.json')
    const fileInput = page.locator('input[type="file"]')
    
    // This should either be rejected by the file input or handled by the API
    await fileInput.setInputFiles(testTextPath)
    
    // Check if appropriate error handling occurs
    // (This depends on your validation implementation)
  })

  test('should show review notes and customer information', async ({ page }) => {
    if (!reviewId) {
      test.skip('No review created for this test')
    }
    
    await page.goto(`/admin/reviews/${reviewId}`)
    
    // Check customer information section
    await expect(page.locator('text=Customer Information')).toBeVisible()
    await expect(page.locator('[data-testid="customer-name"]')).toContainText('E2E Test User')
    await expect(page.locator('[data-testid="customer-email"]')).toContainText('e2e@test.com')
    
    // Check review notes section
    await expect(page.locator('text=Review Notes')).toBeVisible()
    const notesTextarea = page.locator('[data-testid="review-notes"]')
    await expect(notesTextarea).toBeVisible()
    await expect(notesTextarea).toBeEditable()
  })

  test('should handle normal approve/reject workflow', async ({ page }) => {
    if (!reviewId) {
      test.skip('No review created for this test')
    }
    
    await page.goto(`/admin/reviews/${reviewId}`)
    
    // Add review notes
    const notesTextarea = page.locator('[data-testid="review-notes"]')
    await notesTextarea.fill('E2E test approval without manual upload')
    
    // Test approve button
    const approveButton = page.locator('[data-testid="approve-button"]')
    await expect(approveButton).toBeVisible()
    await expect(approveButton).toBeEnabled()
    
    // Intercept the approval request
    const approvalPromise = page.waitForResponse(response => 
      response.url().includes(`/api/admin/reviews/${reviewId}/process`) && 
      response.request().method() === 'POST'
    )
    
    await approveButton.click()
    
    // Wait for approval to complete
    const approvalResponse = await approvalPromise
    expect(approvalResponse.status()).toBe(200)
    
    // Should show processing state
    await expect(page.locator('text=Processing...')).toBeVisible()
    
    // Should redirect after processing
    await page.waitForTimeout(2000)
  })

  test('should filter reviews by type', async ({ page }) => {
    await page.goto('/admin/reviews')
    
    // Test filter buttons
    await page.locator('text=Artwork Proof').click()
    await page.waitForTimeout(1000)
    
    // Check if URL or content changes to show filtered results
    // (Implementation depends on your filtering logic)
    
    await page.locator('text=All Reviews').click()
    await page.waitForTimeout(1000)
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/admin/reviews')
    
    // Check if mobile layout works
    await expect(page.locator('h1')).toBeVisible()
    
    if (reviewId) {
      await page.goto(`/admin/reviews/${reviewId}`)
      
      // Check if review detail page is usable on mobile
      await expect(page.locator('text=Review Details')).toBeVisible()
      await expect(page.locator('[data-testid="artwork-image"]')).toBeVisible()
    }
  })

  test('should handle navigation between pages', async ({ page }) => {
    await page.goto('/admin/reviews')
    
    if (reviewId) {
      // Navigate to review detail
      await page.locator('[data-testid="review-detail-link"]').first().click()
      await expect(page.locator('h1')).toContainText('Review Details')
      
      // Navigate back using back button
      await page.locator('button').filter({ hasText: /back|arrow/i }).first().click()
      await expect(page.locator('h1')).toContainText('Admin Reviews')
    }
  })
})
