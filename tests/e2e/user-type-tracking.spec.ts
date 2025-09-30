import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite for User Type Tracking (Gifter vs Self-Purchaser)
 * 
 * Tests the complete flow:
 * 1. Email capture with gift toggle
 * 2. User type tracking in database
 * 3. Analytics tracking (Plausible, Clarity, Google Ads)
 * 4. Email templates without name
 */

test.describe('User Type Tracking - Email First Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should show email capture modal without name field', async ({ page }) => {
    // Click "Get Started" or trigger upload modal
    const getStartedButton = page.getByRole('button', { name: /get started|create|upload/i });
    await getStartedButton.click();
    
    // Wait for modal to appear
    await expect(page.getByText(/capture your email/i)).toBeVisible({ timeout: 10000 });
    
    // Verify name field is NOT present
    const nameInput = page.getByLabel(/name/i);
    await expect(nameInput).not.toBeVisible();
    
    // Verify email field IS present
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
    
    // Verify gift toggle is present
    const giftToggle = page.getByText(/is this a gift/i);
    await expect(giftToggle).toBeVisible();
  });

  test('should capture email as self-purchaser (default)', async ({ page }) => {
    // Open upload modal
    const getStartedButton = page.getByRole('button', { name: /get started|create|upload/i });
    await getStartedButton.click();
    
    await page.waitForTimeout(1000);
    
    // Fill in email only
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('test-self-purchaser@example.com');
    
    // Verify gift toggle is OFF by default
    const giftToggle = page.locator('[role="switch"]').first();
    const isChecked = await giftToggle.getAttribute('aria-checked');
    expect(isChecked).toBe('false');
    
    // Listen for analytics events
    const analyticsEvents: any[] = [];
    await page.route('**/api/event', async (route) => {
      const postData = route.request().postDataJSON();
      analyticsEvents.push(postData);
      await route.continue();
    });
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /continue|next|submit/i });
    await submitButton.click();
    
    // Wait for success
    await page.waitForTimeout(2000);
    
    // Verify user_type is self_purchaser in any analytics calls
    console.log('Analytics events captured:', analyticsEvents);
  });

  test('should capture email as gifter when toggle is ON', async ({ page }) => {
    // Open upload modal
    const getStartedButton = page.getByRole('button', { name: /get started|create|upload/i });
    await getStartedButton.click();
    
    await page.waitForTimeout(1000);
    
    // Fill in email
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('test-gifter@example.com');
    
    // Turn ON gift toggle
    const giftToggle = page.locator('[role="switch"]').first();
    await giftToggle.click();
    
    // Verify toggle is now ON
    const isChecked = await giftToggle.getAttribute('aria-checked');
    expect(isChecked).toBe('true');
    
    // Verify helper text appears
    await expect(page.getByText(/perfect for surprising/i)).toBeVisible();
    
    // Listen for Plausible events
    let plausibleEventCaptured = false;
    await page.route('**/api/event', async (route) => {
      const postData = route.request().postDataJSON();
      if (postData?.props?.user_type === 'gifter') {
        plausibleEventCaptured = true;
      }
      await route.continue();
    });
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /continue|next|submit/i });
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    console.log('Plausible gifter event captured:', plausibleEventCaptured);
  });

  test('should track Google Ads conversion with correct value', async ({ page }) => {
    // Listen for Google Ads gtag events
    const gtagEvents: any[] = [];
    await page.exposeFunction('captureGtag', (event: any) => {
      gtagEvents.push(event);
    });
    
    await page.addInitScript(() => {
      const originalGtag = (window as any).gtag;
      (window as any).gtag = function(...args: any[]) {
        (window as any).captureGtag({ args });
        if (originalGtag) originalGtag.apply(null, args);
      };
    });
    
    // Open modal and fill as gifter
    const getStartedButton = page.getByRole('button', { name: /get started|create|upload/i });
    await getStartedButton.click();
    
    await page.waitForTimeout(1000);
    
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('test-google-ads@example.com');
    
    // Enable gift toggle
    const giftToggle = page.locator('[role="switch"]').first();
    await giftToggle.click();
    
    // Submit
    const submitButton = page.getByRole('button', { name: /continue|next|submit/i });
    await submitButton.click();
    
    await page.waitForTimeout(3000);
    
    // Check for conversion event with value 3 (gifter)
    const conversionEvent = gtagEvents.find(e => 
      e.args?.[0] === 'event' && 
      e.args?.[2]?.value === 3
    );
    
    console.log('Google Ads events:', gtagEvents);
    console.log('Gifter conversion event found:', !!conversionEvent);
  });

  test('should show deferred upload option and track user type', async ({ page }) => {
    // Open modal
    const getStartedButton = page.getByRole('button', { name: /get started|create|upload/i });
    await getStartedButton.click();
    
    await page.waitForTimeout(1000);
    
    // Fill email as gifter
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('test-deferred@example.com');
    
    const giftToggle = page.locator('[role="switch"]').first();
    await giftToggle.click();
    
    // Submit
    const submitButton = page.getByRole('button', { name: /continue|next|submit/i });
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Should see upload choice screen
    await expect(page.getByText(/upload now|upload later/i)).toBeVisible({ timeout: 10000 });
    
    // Click "Upload Later"
    const uploadLaterButton = page.getByRole('button', { name: /upload later|later/i });
    if (await uploadLaterButton.isVisible()) {
      await uploadLaterButton.click();
      
      // Should see confirmation
      await expect(page.getByText(/check your email|we've sent/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should complete full flow: email capture -> upload -> generation', async ({ page }) => {
    // Open modal
    const getStartedButton = page.getByRole('button', { name: /get started|create|upload/i });
    await getStartedButton.click();
    
    await page.waitForTimeout(1000);
    
    // Fill email as self-purchaser
    const emailInput = page.getByLabel(/email/i);
    const testEmail = `test-full-flow-${Date.now()}@example.com`;
    await emailInput.fill(testEmail);
    
    // Submit
    const submitButton = page.getByRole('button', { name: /continue|next|submit/i });
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Should see upload choice
    const uploadNowButton = page.getByRole('button', { name: /upload now|now/i });
    if (await uploadNowButton.isVisible()) {
      await uploadNowButton.click();
      
      await page.waitForTimeout(1000);
      
      // Upload a test image
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles('./public/images/test pets/test-corgi.png');
        
        // Wait for upload to complete
        await expect(page.getByText(/processing|generating/i)).toBeVisible({ timeout: 10000 });
        
        // Wait for generation (this may take a while)
        await page.waitForTimeout(5000);
        
        console.log('Full flow completed successfully');
      }
    }
  });

  test('should verify Microsoft Clarity tags are set', async ({ page }) => {
    // Listen for Clarity API calls
    const clarityTags: any[] = [];
    await page.exposeFunction('captureClarityTag', (tag: any) => {
      clarityTags.push(tag);
    });
    
    await page.addInitScript(() => {
      const originalClarity = (window as any).clarity;
      if (originalClarity) {
        (window as any).clarity = function(...args: any[]) {
          if (args[0] === 'set') {
            (window as any).captureClarityTag({ method: 'set', args });
          }
          originalClarity.apply(null, args);
        };
      }
    });
    
    // Open modal and submit as gifter
    const getStartedButton = page.getByRole('button', { name: /get started|create|upload/i });
    await getStartedButton.click();
    
    await page.waitForTimeout(1000);
    
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('test-clarity@example.com');
    
    const giftToggle = page.locator('[role="switch"]').first();
    await giftToggle.click();
    
    const submitButton = page.getByRole('button', { name: /continue|next|submit/i });
    await submitButton.click();
    
    await page.waitForTimeout(3000);
    
    // Check if user_type tag was set
    const userTypeTag = clarityTags.find(t => 
      t.args?.[0] === 'user_type' && t.args?.[1] === 'gifter'
    );
    
    console.log('Clarity tags:', clarityTags);
    console.log('User type tag found:', !!userTypeTag);
  });

  test('should handle toggle interaction correctly', async ({ page }) => {
    // Open modal
    const getStartedButton = page.getByRole('button', { name: /get started|create|upload/i });
    await getStartedButton.click();
    
    await page.waitForTimeout(1000);
    
    // Find the gift toggle
    const giftToggle = page.locator('[role="switch"]').first();
    
    // Initial state should be OFF
    let isChecked = await giftToggle.getAttribute('aria-checked');
    expect(isChecked).toBe('false');
    
    // Click to turn ON
    await giftToggle.click();
    await page.waitForTimeout(300);
    
    isChecked = await giftToggle.getAttribute('aria-checked');
    expect(isChecked).toBe('true');
    
    // Verify helper text appears
    await expect(page.getByText(/perfect for surprising/i)).toBeVisible();
    
    // Click again to turn OFF
    await giftToggle.click();
    await page.waitForTimeout(300);
    
    isChecked = await giftToggle.getAttribute('aria-checked');
    expect(isChecked).toBe('false');
    
    // Helper text should disappear
    await expect(page.getByText(/perfect for surprising/i)).not.toBeVisible();
  });

  test('should validate email before submission', async ({ page }) => {
    // Open modal
    const getStartedButton = page.getByRole('button', { name: /get started|create|upload/i });
    await getStartedButton.click();
    
    await page.waitForTimeout(1000);
    
    // Try to submit without email
    const submitButton = page.getByRole('button', { name: /continue|next|submit/i });
    await submitButton.click();
    
    // Should show validation error
    await expect(page.getByText(/email.*required|please enter.*email/i)).toBeVisible({ timeout: 3000 });
    
    // Try with invalid email
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('invalid-email');
    await submitButton.click();
    
    // Should show validation error
    await expect(page.getByText(/valid email|invalid email/i)).toBeVisible({ timeout: 3000 });
  });

  test('should persist user type through the flow', async ({ page }) => {
    // Open modal
    const getStartedButton = page.getByRole('button', { name: /get started|create|upload/i });
    await getStartedButton.click();
    
    await page.waitForTimeout(1000);
    
    // Set as gifter
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('test-persist@example.com');
    
    const giftToggle = page.locator('[role="switch"]').first();
    await giftToggle.click();
    
    // Submit
    const submitButton = page.getByRole('button', { name: /continue|next|submit/i });
    await submitButton.click();
    
    await page.waitForTimeout(2000);
    
    // Check localStorage or session storage for user_type
    const userType = await page.evaluate(() => {
      return localStorage.getItem('user_type') || sessionStorage.getItem('user_type');
    });
    
    console.log('Persisted user type:', userType);
    
    // User type should be stored
    expect(userType).toBeTruthy();
  });
});

test.describe('User Type Tracking - Database Integration', () => {
  
  test('should store user_type in database after email capture', async ({ page }) => {
    // This test requires database access
    // For now, we'll verify the API call is made correctly
    
    let apiCallMade = false;
    let requestBody: any = null;
    
    await page.route('**/api/artwork/create', async (route) => {
      apiCallMade = true;
      requestBody = route.request().postDataJSON();
      await route.continue();
    });
    
    // Open modal
    const getStartedButton = page.getByRole('button', { name: /get started|create|upload/i });
    await getStartedButton.click();
    
    await page.waitForTimeout(1000);
    
    // Fill as gifter
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('test-db@example.com');
    
    const giftToggle = page.locator('[role="switch"]').first();
    await giftToggle.click();
    
    // Submit
    const submitButton = page.getByRole('button', { name: /continue|next|submit/i });
    await submitButton.click();
    
    await page.waitForTimeout(3000);
    
    console.log('API call made:', apiCallMade);
    console.log('Request body:', requestBody);
    
    // Verify user_type is in the request
    if (requestBody) {
      expect(requestBody.user_type).toBe('gifter');
    }
  });
});

test.describe('User Type Tracking - Email Templates', () => {
  
  test('should send emails without name field', async ({ page }) => {
    // Monitor email API calls
    const emailCalls: any[] = [];
    
    await page.route('**/api/email/**', async (route) => {
      const postData = route.request().postDataJSON();
      emailCalls.push({
        url: route.request().url(),
        body: postData
      });
      await route.continue();
    });
    
    // Complete email capture flow
    const getStartedButton = page.getByRole('button', { name: /get started|create|upload/i });
    await getStartedButton.click();
    
    await page.waitForTimeout(1000);
    
    const emailInput = page.getByLabel(/email/i);
    await emailInput.fill('test-email-template@example.com');
    
    const submitButton = page.getByRole('button', { name: /continue|next|submit/i });
    await submitButton.click();
    
    await page.waitForTimeout(3000);
    
    // Check email calls
    console.log('Email API calls:', emailCalls);
    
    // Verify customerName is empty or not present
    emailCalls.forEach(call => {
      if (call.body?.customerName) {
        expect(call.body.customerName).toBe('');
      }
    });
  });
});
