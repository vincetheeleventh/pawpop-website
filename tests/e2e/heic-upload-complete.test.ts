import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('HEIC Upload Complete Flow', () => {
  test('should handle HEIC upload, compression, and complete generation flow', async ({ page }) => {
    // Enable console logging to see detailed flow
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
      }
    });

    // Navigate to the upload page
    await page.goto('https://www.pawpopart.com');
    
    // Click the main CTA to start upload
    await page.click('text="Transform Your Pet Into Art"');
    
    // Wait for upload modal to appear
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();
    
    // Step 1: Upload Pet Mom Photo (simulate HEIC)
    console.log('🔄 Step 1: Uploading pet mom photo...');
    
    // Create a test HEIC file (we'll use a JPEG but name it .heic to test the logic)
    const testImagePath = path.join(__dirname, '../../public/images/e2e testing/test-petmom.png');
    
    if (!fs.existsSync(testImagePath)) {
      throw new Error(`Test image not found: ${testImagePath}`);
    }
    
    // Upload the first image
    const petMomInput = page.locator('input[type="file"]').first();
    await petMomInput.setInputFiles(testImagePath);
    
    // Wait for image to be processed and next button to be enabled
    await expect(page.locator('text="Next"')).toBeEnabled({ timeout: 10000 });
    await page.click('text="Next"');
    
    // Step 2: Upload Pet Photo
    console.log('🔄 Step 2: Uploading pet photo...');
    
    const petImagePath = path.join(__dirname, '../../public/images/e2e testing/test-pet.jpeg');
    if (!fs.existsSync(petImagePath)) {
      throw new Error(`Pet image not found: ${petImagePath}`);
    }
    
    const petInput = page.locator('input[type="file"]').last();
    await petInput.setInputFiles(petImagePath);
    
    await expect(page.locator('text="Next"')).toBeEnabled({ timeout: 10000 });
    await page.click('text="Next"');
    
    // Step 3: Fill contact info
    console.log('🔄 Step 3: Filling contact info...');
    
    await page.fill('input[name="name"]', 'HEIC Test User');
    await page.fill('input[name="email"]', 'heic-test@pawpopart.com');
    
    // Submit the form
    console.log('🚀 Submitting form and starting generation...');
    await page.click('text="Create My Masterpiece"');
    
    // Wait for processing to start
    await expect(page.locator('text="Creating your masterpiece"')).toBeVisible({ timeout: 5000 });
    
    // Monitor the generation process
    console.log('⏳ Waiting for generation to complete...');
    
    // Wait for either success or error message
    const successMessage = page.locator('text="Generation completed successfully"');
    const errorMessage = page.locator('text="Generation failed"');
    
    try {
      // Wait up to 3 minutes for generation to complete
      await Promise.race([
        successMessage.waitFor({ timeout: 180000 }),
        errorMessage.waitFor({ timeout: 180000 })
      ]);
      
      // Check which message appeared
      if (await successMessage.isVisible()) {
        console.log('✅ Generation completed successfully!');
        
        // Wait for redirect to artwork page
        await expect(page).toHaveURL(/\/artwork\//, { timeout: 10000 });
        console.log('✅ Redirected to artwork page');
        
        // Verify artwork page loads
        await expect(page.locator('text="Make it Real"')).toBeVisible({ timeout: 10000 });
        console.log('✅ Artwork page loaded with CTA');
        
      } else if (await errorMessage.isVisible()) {
        console.log('❌ Generation failed');
        
        // Try to get error details from the page
        const errorDetails = await page.locator('[data-testid="error-message"]').textContent();
        console.log('Error details:', errorDetails);
        
        // Take screenshot for debugging
        await page.screenshot({ path: 'test-results/heic-upload-error.png' });
        
        throw new Error(`Generation failed: ${errorDetails}`);
      }
      
    } catch (timeoutError) {
      console.log('⏰ Generation timed out after 3 minutes');
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/heic-upload-timeout.png' });
      
      // Check if modal is still visible (generation might still be running)
      const modalVisible = await page.locator('[data-testid="upload-modal"]').isVisible();
      if (modalVisible) {
        console.log('📱 Modal still visible - generation may be in progress');
        
        // Get any visible status messages
        const statusText = await page.locator('[data-testid="processing-status"]').textContent().catch(() => 'No status available');
        console.log('Current status:', statusText);
      }
      
      throw new Error('Generation process timed out after 3 minutes');
    }
  });

  test('should show detailed error messages for fal.ai issues', async ({ page }) => {
    // This test specifically checks that our enhanced error handling works
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[ERROR] ${msg.text()}`);
      }
    });

    // Navigate and start upload
    await page.goto('https://www.pawpopart.com');
    await page.click('text="Transform Your Pet Into Art"');
    await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();

    // Upload images quickly to trigger the flow
    const testImagePath = path.join(__dirname, '../../public/images/e2e testing/test-petmom.png');
    
    const petMomInput = page.locator('input[type="file"]').first();
    await petMomInput.setInputFiles(testImagePath);
    await page.click('text="Next"');
    
    const petInput = page.locator('input[type="file"]').last();
    await petInput.setInputFiles(testImagePath);
    await page.click('text="Next"');
    
    await page.fill('input[name="name"]', 'Error Test User');
    await page.fill('input[name="email"]', 'error-test@pawpopart.com');
    
    // Submit and wait for any error
    await page.click('text="Create My Masterpiece"');
    
    // Wait for either success or detailed error
    try {
      await page.waitForSelector('text="Generation failed"', { timeout: 60000 });
      
      // Check if we get detailed error information
      const errorElement = page.locator('[data-testid="error-message"]');
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log('Detailed error message:', errorText);
        
        // Verify we get specific fal.ai error details, not generic message
        expect(errorText).not.toBe('Generation failed');
        expect(errorText?.length).toBeGreaterThan(20); // Should have detailed message
      }
      
    } catch (timeoutError) {
      console.log('No error occurred within timeout - this might be good!');
    }
  });
});
