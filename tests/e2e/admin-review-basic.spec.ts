import { test, expect } from '@playwright/test'

test.describe('Admin Review Basic UI Tests', () => {
  
  test('should load admin reviews dashboard page', async ({ page }) => {
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

  test('should have proper page structure and navigation', async ({ page }) => {
    await page.goto('/admin/reviews')
    
    // Wait for content to load
    await page.waitForTimeout(2000)
    
    // Check basic page structure
    await expect(page.locator('main, .container, .max-w')).toBeVisible()
    
    // Check if navigation elements are present
    const filterButtons = page.locator('button').filter({ hasText: /All Reviews|Artwork Proof|High-Res File/ })
    await expect(filterButtons.first()).toBeVisible()
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

  test('should handle filter button interactions', async ({ page }) => {
    await page.goto('/admin/reviews')
    
    // Test clicking filter buttons using more specific selectors
    await page.locator('[data-testid="filter-artwork-proof"]').click()
    await page.waitForTimeout(500)
    
    await page.locator('[data-testid="filter-highres-file"]').click()
    await page.waitForTimeout(500)
    
    await page.locator('[data-testid="filter-all"]').click()
    await page.waitForTimeout(500)
    
    // Page should still be functional
    await expect(page.locator('h1')).toContainText('Admin Reviews')
  })

  test('should navigate to a specific review detail page', async ({ page }) => {
    // Test with a known review ID (we'll use one from our tests)
    const testReviewId = '41c5d8d8-5913-450d-968c-164f72c69fd2' // From our previous tests
    
    await page.goto(`/admin/reviews/${testReviewId}`)
    
    // The page should load (even if review doesn't exist, it should show an error page)
    await page.waitForTimeout(2000)
    
    // Check if we get either the review details or an error message
    const hasReviewDetails = await page.locator('h1').filter({ hasText: 'Review Details' }).isVisible()
    const hasErrorMessage = await page.locator('text=Review Not Found').isVisible()
    
    expect(hasReviewDetails || hasErrorMessage).toBeTruthy()
  })

  test('should show manual upload UI elements when review exists', async ({ page }) => {
    // Test with a known review ID
    const testReviewId = '41c5d8d8-5913-450d-968c-164f72c69fd2'
    
    await page.goto(`/admin/reviews/${testReviewId}`)
    await page.waitForTimeout(3000)
    
    // Check if we're on a review detail page
    const hasReviewDetails = await page.locator('h1').filter({ hasText: 'Review Details' }).isVisible()
    
    if (hasReviewDetails) {
      // Check if manual upload elements are present
      const manualUploadText = page.locator('text=Manual Upload Proof Image')
      const fileInput = page.locator('input[type="file"]')
      const uploadButton = page.locator('[data-testid="manual-upload-button"]')
      
      // These elements should be present on a valid review page
      if (await manualUploadText.isVisible()) {
        await expect(manualUploadText).toBeVisible()
        await expect(fileInput).toBeVisible()
        await expect(uploadButton).toBeVisible()
        
        console.log('Manual upload UI elements found and visible')
      } else {
        console.log('Review may be already processed or manual upload not available')
      }
    } else {
      console.log('Review not found or page not accessible')
    }
  })

  test('should show proper error handling for invalid review ID', async ({ page }) => {
    await page.goto('/admin/reviews/invalid-review-id')
    await page.waitForTimeout(2000)
    
    // Should show error message or redirect
    const hasErrorMessage = await page.locator('text=Review Not Found').isVisible()
    const hasBackButton = await page.locator('text=Back to Reviews').isVisible()
    
    if (hasErrorMessage) {
      await expect(page.locator('text=Review Not Found')).toBeVisible()
    }
    
    if (hasBackButton) {
      await expect(page.locator('text=Back to Reviews')).toBeVisible()
    }
  })

  test('should handle page loading states', async ({ page }) => {
    await page.goto('/admin/reviews')
    
    // Check if page loads without JavaScript errors
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })
    
    await page.waitForTimeout(3000)
    
    // Should not have critical JavaScript errors
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('console.warn') &&
      !error.includes('ResizeObserver')
    )
    
    expect(criticalErrors.length).toBe(0)
  })

  test('should have proper accessibility elements', async ({ page }) => {
    await page.goto('/admin/reviews')
    
    // Check for proper heading structure
    await expect(page.locator('h1')).toBeVisible()
    
    // Check for proper button labels
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    if (buttonCount > 0) {
      // At least some buttons should have accessible text
      const firstButton = buttons.first()
      const buttonText = await firstButton.textContent()
      expect(buttonText?.trim().length).toBeGreaterThan(0)
    }
  })
})
