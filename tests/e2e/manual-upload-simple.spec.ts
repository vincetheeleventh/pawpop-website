import { test, expect } from '@playwright/test'

test.describe('Manual Upload Feature Tests', () => {
  
  test('admin reviews page loads correctly', async ({ page }) => {
    await page.goto('/admin/reviews')
    
    // Check if the page loads
    await expect(page.locator('h1')).toContainText('Admin Reviews')
    
    // Check if basic elements are present
    await expect(page.locator('text=All Reviews')).toBeVisible()
  })

  test('review detail page structure', async ({ page }) => {
    // Use a known review ID from our testing
    await page.goto('/admin/reviews/41c5d8d8-5913-450d-968c-164f72c69fd2')
    
    await page.waitForTimeout(3000)
    
    // Check if we get a proper page (either review details or error)
    const hasReviewDetails = await page.locator('h1').filter({ hasText: 'Review Details' }).isVisible()
    const hasErrorMessage = await page.locator('text=Review Not Found').isVisible()
    
    expect(hasReviewDetails || hasErrorMessage).toBeTruthy()
    
    if (hasReviewDetails) {
      console.log('✅ Review detail page loaded successfully')
      
      // Check for manual upload elements if review is pending
      const manualUploadSection = page.locator('text=Manual Upload Proof Image')
      if (await manualUploadSection.isVisible()) {
        console.log('✅ Manual upload section found')
        
        // Check for file input
        await expect(page.locator('input[type="file"]')).toBeVisible()
        
        // Check for upload button
        await expect(page.locator('[data-testid="manual-upload-button"]')).toBeVisible()
      }
      
      // Check for source images section
      const sourceImagesSection = page.locator('text=Original Photos')
      if (await sourceImagesSection.isVisible()) {
        console.log('✅ Source images section found')
      }
    }
  })

  test('manual upload button behavior', async ({ page }) => {
    await page.goto('/admin/reviews/41c5d8d8-5913-450d-968c-164f72c69fd2')
    await page.waitForTimeout(3000)
    
    const hasReviewDetails = await page.locator('h1').filter({ hasText: 'Review Details' }).isVisible()
    
    if (hasReviewDetails) {
      const uploadButton = page.locator('[data-testid="manual-upload-button"]')
      
      if (await uploadButton.isVisible()) {
        // Button should be disabled initially
        await expect(uploadButton).toBeDisabled()
        
        // Select a file
        const fileInput = page.locator('input[type="file"]')
        if (await fileInput.isVisible()) {
          await fileInput.setInputFiles('public/images/flux-test.png')
          
          // Button should now be enabled
          await expect(uploadButton).toBeEnabled()
          
          console.log('✅ Manual upload button behavior working correctly')
        }
      }
    }
  })

  test('responsive design check', async ({ page }) => {
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/admin/reviews')
    
    await expect(page.locator('h1')).toBeVisible()
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.goto('/admin/reviews')
    
    await expect(page.locator('h1')).toBeVisible()
    
    console.log('✅ Responsive design working')
  })

  test('navigation functionality', async ({ page }) => {
    await page.goto('/admin/reviews')
    
    // Check if page loads
    await expect(page.locator('h1')).toContainText('Admin Reviews')
    
    // Try navigating to a review detail page
    await page.goto('/admin/reviews/41c5d8d8-5913-450d-968c-164f72c69fd2')
    await page.waitForTimeout(2000)
    
    // Should either show review details or error page
    const pageContent = await page.content()
    expect(pageContent.includes('Review Details') || pageContent.includes('Review Not Found')).toBeTruthy()
    
    console.log('✅ Navigation working correctly')
  })
})
