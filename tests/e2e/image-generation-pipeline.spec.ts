import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Image Generation Pipeline', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
  });

  test('complete upload flow - pet mom and pet photos to artwork generation', async ({ page }) => {
    // Test files - create mock images for testing
    const petMomImagePath = path.join(__dirname, '../fixtures/test-pet-mom.jpg');
    const petImagePath = path.join(__dirname, '../fixtures/test-pet.jpg');

    // Step 1: Click upload button to open modal
    await page.click('button:has-text("Upload Photo Now")');
    
    // Verify modal opens
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();
    
    // Step 2: Upload pet mom photo
    await expect(page.locator('text=Upload Your Photo')).toBeVisible();
    
    // Upload file via file input
    const petMomInput = page.locator('input[type="file"]').first();
    await petMomInput.setInputFiles(petMomImagePath);
    
    // Verify file uploaded and next button enabled
    await expect(page.locator('text=Click to change photo')).toBeVisible();
    await expect(page.locator('button:has-text("Next")')).toBeEnabled();
    
    // Click next
    await page.click('button:has-text("Next")');
    
    // Step 3: Upload pet photo
    await expect(page.locator('text=Upload Your Pet\'s Photo')).toBeVisible();
    
    const petInput = page.locator('input[type="file"]').nth(1);
    await petInput.setInputFiles(petImagePath);
    
    // Verify pet file uploaded
    await expect(page.locator('text=Click to change photo')).toBeVisible();
    await page.click('button:has-text("Next")');
    
    // Step 4: Fill contact info
    await expect(page.locator('text=Almost Ready!')).toBeVisible();
    
    await page.fill('input[placeholder="Enter your name"]', 'Test User');
    await page.fill('input[placeholder="Enter your email"]', 'test@example.com');
    
    // Verify submit button enabled
    await expect(page.locator('button:has-text("Create My Masterpiece")')).toBeEnabled();
    
    // Mock the API responses for testing
    await page.route('/api/artwork/create', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          artwork: {
            id: 'test-artwork-id',
            customer_name: 'Test User',
            customer_email: 'test@example.com',
            generation_status: 'pending'
          },
          access_token: 'test-access-token-123'
        })
      });
    });

    await page.route('/api/monalisa-complete', async (route) => {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'X-Generated-Image-URL': 'https://test.fal.media/generated-image.jpg',
          'X-Request-ID': 'test-request-123'
        },
        body: Buffer.from('fake-image-data')
      });
    });

    await page.route('/api/artwork/update', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    // Step 5: Submit and watch processing
    await page.click('button:has-text("Create My Masterpiece")');
    
    // Verify processing states appear
    await expect(page.locator('text=Creating Your Masterpiece')).toBeVisible();
    await expect(page.locator('text=Creating your artwork...')).toBeVisible();
    
    // Wait for processing to complete and redirect
    await expect(page.locator('text=Transforming you into Mona Lisa...')).toBeVisible();
    await expect(page.locator('text=Adding your pet to the masterpiece...')).toBeVisible();
    await expect(page.locator('text=Saving your masterpiece...')).toBeVisible();
    
    // Should redirect to artwork page
    await page.waitForURL('/artwork/test-access-token-123', { timeout: 10000 });
    
    // Verify artwork page loads
    await expect(page.locator('text=Your Masterpiece is Ready!')).toBeVisible();
  });

  test('handles upload errors gracefully', async ({ page }) => {
    await page.click('button:has-text("Upload Photo Now")');
    
    // Mock API failure
    await page.route('/api/artwork/create', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Database connection failed' })
      });
    });

    // Fill form
    const petMomImagePath = path.join(__dirname, '../fixtures/test-pet-mom.jpg');
    const petImagePath = path.join(__dirname, '../fixtures/test-pet.jpg');
    
    const petMomInput = page.locator('input[type="file"]').first();
    await petMomInput.setInputFiles(petMomImagePath);
    await page.click('button:has-text("Next")');
    
    const petInput = page.locator('input[type="file"]').nth(1);
    await petInput.setInputFiles(petImagePath);
    await page.click('button:has-text("Next")');
    
    await page.fill('input[placeholder="Enter your name"]', 'Test User');
    await page.fill('input[placeholder="Enter your email"]', 'test@example.com');
    
    // Submit and expect error
    await page.click('button:has-text("Create My Masterpiece")');
    
    // Verify error handling
    await expect(page.locator('text=Oops!')).toBeVisible();
    await expect(page.locator('text=Database connection failed')).toBeVisible();
    await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
  });

  test('validates required fields', async ({ page }) => {
    await page.click('button:has-text("Upload Photo Now")');
    
    // Try to proceed without uploading pet mom photo
    await expect(page.locator('button:has-text("Next")')).toBeDisabled();
    
    // Upload pet mom photo
    const petMomImagePath = path.join(__dirname, '../fixtures/test-pet-mom.jpg');
    const petMomInput = page.locator('input[type="file"]').first();
    await petMomInput.setInputFiles(petMomImagePath);
    
    // Now next should be enabled
    await expect(page.locator('button:has-text("Next")')).toBeEnabled();
    await page.click('button:has-text("Next")');
    
    // Try to proceed without pet photo
    await expect(page.locator('button:has-text("Next")')).toBeDisabled();
    
    // Upload pet photo
    const petImagePath = path.join(__dirname, '../fixtures/test-pet.jpg');
    const petInput = page.locator('input[type="file"]').nth(1);
    await petInput.setInputFiles(petImagePath);
    
    await page.click('button:has-text("Next")');
    
    // Try to submit without contact info
    await expect(page.locator('button:has-text("Create My Masterpiece")')).toBeDisabled();
    
    // Fill name only
    await page.fill('input[placeholder="Enter your name"]', 'Test User');
    await expect(page.locator('button:has-text("Create My Masterpiece")')).toBeDisabled();
    
    // Fill email - now should be enabled
    await page.fill('input[placeholder="Enter your email"]', 'test@example.com');
    await expect(page.locator('button:has-text("Create My Masterpiece")')).toBeEnabled();
  });
});
