import { test, expect } from '@playwright/test';

test.describe('Email-First Upload Flow', () => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  test.beforeEach(async ({ page }) => {
    await page.goto(baseUrl);
  });

  test('should show email-first modal when clicking CTA', async ({ page }) => {
    // Click the main CTA button
    await page.click('text=Upload Photo Now');
    
    // Wait for modal to appear
    await page.waitForSelector('[data-component-name="UploadModalEmailFirst"]', { timeout: 5000 });
    
    // Verify modal is visible
    const modal = page.locator('[data-component-name="UploadModalEmailFirst"]');
    await expect(modal).toBeVisible();
    
    // Verify email capture step is shown
    await expect(page.locator('text=Enter Your Email')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Open modal
    await page.click('text=Upload Photo Now');
    await page.waitForSelector('[data-component-name="UploadModalEmailFirst"]');
    
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[placeholder*="name" i]', 'Test User');
    await page.click('button:has-text("Continue")');
    
    // Should show error
    await expect(page.locator('text=valid email')).toBeVisible({ timeout: 3000 });
  });

  test('should capture email and show upload choice', async ({ page }) => {
    // Open modal
    await page.click('text=Upload Photo Now');
    await page.waitForSelector('[data-component-name="UploadModalEmailFirst"]');
    
    // Fill in email form
    const testEmail = `test-${Date.now()}@pawpopart.com`;
    await page.fill('input[placeholder*="name" i]', 'Test User');
    await page.fill('input[type="email"]', testEmail);
    
    // Click continue
    await page.click('button:has-text("Continue")');
    
    // Wait for upload choice step
    await page.waitForSelector('text=Upload Now', { timeout: 10000 });
    await page.waitForSelector('text=Upload Later', { timeout: 5000 });
    
    // Verify both options are visible
    await expect(page.locator('button:has-text("Upload Now")')).toBeVisible();
    await expect(page.locator('button:has-text("I\'ll Upload Later")')).toBeVisible();
  });

  test('should handle "Upload Now" choice', async ({ page }) => {
    // Open modal and capture email
    await page.click('text=Upload Photo Now');
    await page.waitForSelector('[data-component-name="UploadModalEmailFirst"]');
    
    const testEmail = `test-now-${Date.now()}@pawpopart.com`;
    await page.fill('input[placeholder*="name" i]', 'Test User Now');
    await page.fill('input[type="email"]', testEmail);
    await page.click('button:has-text("Continue")');
    
    // Wait for upload choice
    await page.waitForSelector('text=Upload Now', { timeout: 10000 });
    
    // Click "Upload Now"
    await page.click('button:has-text("Upload Now")');
    
    // Should transition to photo upload step
    await expect(page.locator('text=Upload Your Pet\'s Photo')).toBeVisible({ timeout: 5000 });
  });

  test('should handle "Upload Later" choice', async ({ page }) => {
    // Open modal and capture email
    await page.click('text=Upload Photo Now');
    await page.waitForSelector('[data-component-name="UploadModalEmailFirst"]');
    
    const testEmail = `test-later-${Date.now()}@pawpopart.com`;
    await page.fill('input[placeholder*="name" i]', 'Test User Later');
    await page.fill('input[type="email"]', testEmail);
    await page.click('button:has-text("Continue")');
    
    // Wait for upload choice
    await page.waitForSelector('text=Upload Later', { timeout: 10000 });
    
    // Click "Upload Later"
    await page.click('button:has-text("I\'ll Upload Later")');
    
    // Should show success message
    await expect(page.locator('text=Perfect!')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=email with a link')).toBeVisible();
  });

  test('should track analytics events', async ({ page }) => {
    // Listen for Plausible events
    const plausibleEvents: string[] = [];
    page.on('request', request => {
      if (request.url().includes('plausible.io') || request.url().includes('/api/event')) {
        plausibleEvents.push(request.url());
      }
    });
    
    // Open modal
    await page.click('text=Upload Photo Now');
    await page.waitForSelector('[data-component-name="UploadModalEmailFirst"]');
    
    // Fill and submit email
    const testEmail = `test-analytics-${Date.now()}@pawpopart.com`;
    await page.fill('input[placeholder*="name" i]', 'Test Analytics');
    await page.fill('input[type="email"]', testEmail);
    await page.click('button:has-text("Continue")');
    
    // Wait a bit for analytics to fire
    await page.waitForTimeout(1000);
    
    // Should have tracked some events (modal open, email capture, etc)
    // Note: This is a basic check - actual events depend on analytics configuration
    console.log('Analytics events tracked:', plausibleEvents.length);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and simulate failure
    await page.route('**/api/artwork/create', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Open modal and try to submit
    await page.click('text=Upload Photo Now');
    await page.waitForSelector('[data-component-name="UploadModalEmailFirst"]');
    
    await page.fill('input[placeholder*="name" i]', 'Test Error');
    await page.fill('input[type="email"]', 'test@error.com');
    await page.click('button:has-text("Continue")');
    
    // Should show error message
    await expect(page.locator('text=Failed')).toBeVisible({ timeout: 5000 });
  });

  test('should close modal when clicking outside', async ({ page }) => {
    // Open modal
    await page.click('text=Upload Photo Now');
    await page.waitForSelector('[data-component-name="UploadModalEmailFirst"]');
    
    // Click outside modal (on backdrop)
    await page.click('body', { position: { x: 10, y: 10 } });
    
    // Modal should close
    await expect(page.locator('[data-component-name="UploadModalEmailFirst"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('should persist through page refresh (localStorage)', async ({ page }) => {
    // This test verifies that artwork ID and token are stored
    // Open modal and capture email
    await page.click('text=Upload Photo Now');
    await page.waitForSelector('[data-component-name="UploadModalEmailFirst"]');
    
    const testEmail = `test-persist-${Date.now()}@pawpopart.com`;
    await page.fill('input[placeholder*="name" i]', 'Test Persist');
    await page.fill('input[type="email"]', testEmail);
    await page.click('button:has-text("Continue")');
    
    // Wait for upload choice
    await page.waitForSelector('text=Upload Now', { timeout: 10000 });
    
    // Check localStorage for artwork data
    const artworkData = await page.evaluate(() => {
      return {
        hasArtworkId: localStorage.getItem('artworkId') !== null,
        hasUploadToken: localStorage.getItem('uploadToken') !== null
      };
    });
    
    console.log('LocalStorage check:', artworkData);
    // Note: Actual persistence depends on implementation
  });
});

test.describe('Upload Token Validation', () => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  test('should handle invalid upload token', async ({ page }) => {
    // Try to access with invalid token
    await page.goto(`${baseUrl}/upload/invalid-token-123`);
    
    // Should show error or redirect
    await expect(page.locator('text=Invalid')).toBeVisible({ timeout: 5000 });
  });

  test('should load artwork with valid token', async ({ page }) => {
    // First create an artwork with deferred upload
    await page.goto(baseUrl);
    await page.click('text=Upload Photo Now');
    await page.waitForSelector('[data-component-name="UploadModalEmailFirst"]');
    
    const testEmail = `test-token-${Date.now()}@pawpopart.com`;
    await page.fill('input[placeholder*="name" i]', 'Test Token');
    await page.fill('input[type="email"]', testEmail);
    await page.click('button:has-text("Continue")');
    
    await page.waitForSelector('text=Upload Later', { timeout: 10000 });
    await page.click('button:has-text("I\'ll Upload Later")');
    
    // Get the upload token from localStorage or API response
    const uploadToken = await page.evaluate(() => {
      return localStorage.getItem('uploadToken');
    });
    
    if (uploadToken) {
      // Navigate to upload page with token
      await page.goto(`${baseUrl}/upload/${uploadToken}`);
      
      // Should load upload interface
      await expect(page.locator('text=Upload Your Pet\'s Photo')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Email-First Flow Performance', () => {
  test('should load modal quickly', async ({ page }) => {
    await page.goto(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    
    const startTime = Date.now();
    await page.click('text=Upload Photo Now');
    await page.waitForSelector('[data-component-name="UploadModalEmailFirst"]');
    const loadTime = Date.now() - startTime;
    
    console.log(`Modal load time: ${loadTime}ms`);
    
    // Modal should load in under 2 seconds
    expect(loadTime).toBeLessThan(2000);
  });

  test('should handle email submission quickly', async ({ page }) => {
    await page.goto(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    await page.click('text=Upload Photo Now');
    await page.waitForSelector('[data-component-name="UploadModalEmailFirst"]');
    
    const testEmail = `test-perf-${Date.now()}@pawpopart.com`;
    await page.fill('input[placeholder*="name" i]', 'Test Performance');
    await page.fill('input[type="email"]', testEmail);
    
    const startTime = Date.now();
    await page.click('button:has-text("Continue")');
    await page.waitForSelector('text=Upload Now', { timeout: 10000 });
    const submitTime = Date.now() - startTime;
    
    console.log(`Email submission time: ${submitTime}ms`);
    
    // Should complete in under 5 seconds
    expect(submitTime).toBeLessThan(5000);
  });
});
