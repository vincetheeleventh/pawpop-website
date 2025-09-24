import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Admin Review UI Tests', () => {
  
  test('should load admin reviews dashboard', async ({ page }) => {
    await page.goto('/admin/reviews')
    
    // Check if the page loads correctly
    await expect(page.locator('h1')).toContainText('Admin Reviews')
    
    // Check if filter buttons are present
    await expect(page.locator('text=All Reviews')).toBeVisible()
    await expect(page.locator('text=Artwork Proof')).toBeVisible()
    await expect(page.locator('text=High-Res File')).toBeVisible()
    
    // Check if the page has the expected structure
    await expect(page.locator('.bg-gray-50')).toBeVisible() // Main container
  })

  test('should display review items if any exist', async ({ page }) => {
    await page.goto('/admin/reviews')
    
    // Wait for content to load
    await page.waitForTimeout(2000)
    
    // Check if reviews are displayed or if empty state is shown
    const reviewItems = page.locator('[data-testid="review-item"]')
    const emptyState = page.locator('text=No reviews found')
    
    // Either reviews should be visible or empty state should be shown
    const hasReviews = await reviewItems.count() > 0
    const hasEmptyState = await emptyState.isVisible()
    
    expect(hasReviews || hasEmptyState).toBeTruthy()
  })

  test('should navigate to review detail page when review exists', async ({ page }) => {
    await page.goto('/admin/reviews')
    
    // Wait for content to load
    await page.waitForTimeout(2000)
    
    // Check if there are any review detail links
    const reviewLinks = page.locator('[data-testid="review-detail-link"]')
    const linkCount = await reviewLinks.count()
    
    if (linkCount > 0) {
      // Click on the first review link
      await reviewLinks.first().click()
      
      // Should navigate to review detail page
      await expect(page.locator('h1')).toContainText('Review Details')
      
      // Check if basic elements are present
      await expect(page.locator('[data-testid="customer-name"]')).toBeVisible()
    } else {
      console.log('No reviews available for navigation test')
    }
  })

  test('should show manual upload interface on review detail page', async ({ page }) => {
    // First, let's create a test review by going through the API
    const response = await page.request.get('/api/admin/reviews')
    
    // Check if response is successful
    if (!response.ok()) {
      console.log('API request failed:', response.status(), await response.text())
      test.skip('API not available for this test')
    }
    
    const data = await response.json()
    
    if (data.success && data.reviews && data.reviews.length > 0) {
      const pendingReview = data.reviews.find((r: any) => r.status === 'pending')
      
      if (pendingReview) {
        await page.goto(`/admin/reviews/${pendingReview.review_id}`)
        
        // Check if manual upload section is visible
        await expect(page.locator('text=Manual Upload Proof Image')).toBeVisible()
        
        // Check if file input is present
        await expect(page.locator('input[type="file"]')).toBeVisible()
        
        // Check if upload button is present
        const uploadButton = page.locator('[data-testid="manual-upload-button"]')
        await expect(uploadButton).toBeVisible()
        
        // Button should be disabled initially (no file selected)
        await expect(uploadButton).toBeDisabled()
        
        // Check if approve/reject buttons are present
        await expect(page.locator('[data-testid="approve-button"]')).toBeVisible()
        await expect(page.locator('[data-testid="reject-button"]')).toBeVisible()
      }
    }
  })

  test('should enable upload button when file is selected', async ({ page }) => {
    const response = await page.request.get('/api/admin/reviews')
    const data = await response.json()
    
    if (data.reviews && data.reviews.length > 0) {
      const pendingReview = data.reviews.find((r: any) => r.status === 'pending')
      
      if (pendingReview) {
        await page.goto(`/admin/reviews/${pendingReview.review_id}`)
        
        // Select a test file
        const testImagePath = path.join(process.cwd(), 'public/images/flux-test.png')
        const fileInput = page.locator('input[type="file"]')
        
        await fileInput.setInputFiles(testImagePath)
        
        // Check if file name is displayed
        await expect(page.locator('text=flux-test.png')).toBeVisible()
        
        // Check if upload button is now enabled
        const uploadButton = page.locator('[data-testid="manual-upload-button"]')
        await expect(uploadButton).toBeEnabled()
        
        // Check button text
        await expect(uploadButton).toContainText('Manual Upload Proof Image')
      }
    }
  })

  test('should display source images when available', async ({ page }) => {
    const response = await page.request.get('/api/admin/reviews')
    const data = await response.json()
    
    if (data.reviews && data.reviews.length > 0) {
      const review = data.reviews[0]
      
      await page.goto(`/admin/reviews/${review.review_id}`)
      
      // Check if artwork image is displayed
      await expect(page.locator('[data-testid="artwork-image"]')).toBeVisible()
      
      // Check if source images section exists (conditional)
      const sourceImagesSection = page.locator('text=Original Photos')
      if (await sourceImagesSection.isVisible()) {
        await expect(sourceImagesSection).toBeVisible()
        console.log('Source images section found and visible')
      } else {
        console.log('No source images available for this review')
      }
    }
  })

  test('should show customer information correctly', async ({ page }) => {
    const response = await page.request.get('/api/admin/reviews')
    const data = await response.json()
    
    if (data.reviews && data.reviews.length > 0) {
      const review = data.reviews[0]
      
      await page.goto(`/admin/reviews/${review.review_id}`)
      
      // Check customer information section
      await expect(page.locator('text=Customer Information')).toBeVisible()
      await expect(page.locator('[data-testid="customer-name"]')).toBeVisible()
      await expect(page.locator('[data-testid="customer-email"]')).toBeVisible()
      
      // Verify customer name matches API data
      await expect(page.locator('[data-testid="customer-name"]')).toContainText(review.customer_name)
    }
  })

  test('should handle review notes interaction', async ({ page }) => {
    const response = await page.request.get('/api/admin/reviews')
    const data = await response.json()
    
    if (data.reviews && data.reviews.length > 0) {
      const pendingReview = data.reviews.find((r: any) => r.status === 'pending')
      
      if (pendingReview) {
        await page.goto(`/admin/reviews/${pendingReview.review_id}`)
        
        // Check review notes section
        await expect(page.locator('text=Review Notes')).toBeVisible()
        
        const notesTextarea = page.locator('[data-testid="review-notes"]')
        await expect(notesTextarea).toBeVisible()
        await expect(notesTextarea).toBeEditable()
        
        // Test typing in notes
        await notesTextarea.fill('E2E test notes for review')
        await expect(notesTextarea).toHaveValue('E2E test notes for review')
      }
    }
  })

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.goto('/admin/reviews')
    await expect(page.locator('h1')).toBeVisible()
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/admin/reviews')
    await expect(page.locator('h1')).toBeVisible()
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/admin/reviews')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should handle navigation correctly', async ({ page }) => {
    await page.goto('/admin/reviews')
    
    const response = await page.request.get('/api/admin/reviews')
    const data = await response.json()
    
    if (data.reviews && data.reviews.length > 0) {
      const review = data.reviews[0]
      
      // Navigate to review detail
      await page.goto(`/admin/reviews/${review.review_id}`)
      await expect(page.locator('h1')).toContainText('Review Details')
      
      // Check if back button exists and works
      const backButton = page.locator('button').filter({ hasText: /back/i }).first()
      if (await backButton.isVisible()) {
        await backButton.click()
        await expect(page.locator('h1')).toContainText('Admin Reviews')
      }
    }
  })

  test('should filter reviews by type', async ({ page }) => {
    await page.goto('/admin/reviews')
    
    // Test artwork proof filter
    await page.locator('text=Artwork Proof').click()
    await page.waitForTimeout(1000)
    
    // Test high-res file filter
    await page.locator('text=High-Res File').click()
    await page.waitForTimeout(1000)
    
    // Return to all reviews
    await page.locator('text=All Reviews').click()
    await page.waitForTimeout(1000)
    
    // Page should still be functional
    await expect(page.locator('h1')).toContainText('Admin Reviews')
  })
})
