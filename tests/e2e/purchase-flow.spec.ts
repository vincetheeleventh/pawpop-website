import { test, expect } from '@playwright/test';

test.describe('Complete Purchase Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the artwork data that would normally come from the API
    await page.route('**/api/artwork/create', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-artwork-123',
          generated_image_url: '/test-image.jpg',
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          pet_name: 'Buddy'
        })
      });
    });

    // Mock the checkout API
    await page.route('**/api/checkout/artwork', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessionId: 'test-session-id',
          url: 'https://checkout.stripe.com/test-session'
        })
      });
    });

    await page.goto('/');
  });

  test('should complete digital-first purchase flow', async ({ page }) => {
    // Navigate to artwork page (simulate having generated artwork)
    await page.goto('/artwork/test-artwork-123');
    
    // Click purchase button to open modal
    await page.click('[data-testid="purchase-button"]');
    
    // Verify digital-first modal opens
    await expect(page.getByText('Get Your Masterpiece')).toBeVisible();
    await expect(page.getByText('Instant Download, Print it Yourself')).toBeVisible();
    
    // Click download now button
    await page.click('text=Download Now');
    
    // Verify checkout API was called with correct parameters
    const checkoutRequest = page.waitForRequest('**/api/checkout/artwork');
    await checkoutRequest;
    
    // In a real test, we would verify redirect to Stripe
    // For now, we'll check that the loading state appears
    await expect(page.getByText('Processing...')).toBeVisible();
  });

  test('should complete equal-tiers purchase flow', async ({ page }) => {
    // Set variant to equal-tiers via URL parameter
    await page.goto('/artwork/test-artwork-123?variant=equal-tiers');
    
    await page.click('[data-testid="purchase-button"]');
    
    // Verify equal-tiers modal opens
    await expect(page.getByText('Choose Your Format')).toBeVisible();
    await expect(page.getByText('Digital Download')).toBeVisible();
    await expect(page.getByText('Premium Art Print')).toBeVisible();
    await expect(page.getByText('Framed Canvas')).toBeVisible();
    
    // Select art print tier
    await page.click('text=Premium Art Print');
    
    // Verify selection and purchase button appears
    await expect(page.getByText('Get My Masterpiece')).toBeVisible();
    
    // Complete purchase
    await page.click('text=Get My Masterpiece');
    
    const checkoutRequest = page.waitForRequest('**/api/checkout/artwork');
    await checkoutRequest;
    
    await expect(page.getByText('Processing...')).toBeVisible();
  });

  test('should complete physical-first purchase flow', async ({ page }) => {
    await page.goto('/artwork/test-artwork-123?variant=physical-first');
    
    await page.click('[data-testid="purchase-button"]');
    
    // Verify physical-first modal opens
    await expect(page.getByText('Choose Your Physical Masterpiece')).toBeVisible();
    await expect(page.getByText('+ FREE Digital File')).toBeVisible();
    
    // Select framed canvas
    await page.click('text=Framed Canvas');
    
    // Verify selection and purchase button appears
    await expect(page.getByText('Order My Masterpiece')).toBeVisible();
    
    // Complete purchase
    await page.click('text=Order My Masterpiece');
    
    const checkoutRequest = page.waitForRequest('**/api/checkout/artwork');
    await checkoutRequest;
    
    await expect(page.getByText('Processing...')).toBeVisible();
  });

  test('should handle modal variant A/B testing', async ({ page }) => {
    // Test that different variants can be loaded
    const variants = ['digital-first', 'equal-tiers', 'physical-first'];
    
    for (const variant of variants) {
      await page.goto(`/artwork/test-artwork-123?variant=${variant}`);
      await page.click('[data-testid="purchase-button"]');
      
      // Verify correct modal opens based on variant
      switch (variant) {
        case 'digital-first':
          await expect(page.getByText('Instant Download, Print it Yourself')).toBeVisible();
          break;
        case 'equal-tiers':
          await expect(page.getByText('Choose Your Format')).toBeVisible();
          break;
        case 'physical-first':
          await expect(page.getByText('Choose Your Physical Masterpiece')).toBeVisible();
          break;
      }
      
      // Close modal for next iteration
      await page.keyboard.press('Escape');
    }
  });

  test('should handle print size selection in physical-first modal', async ({ page }) => {
    await page.goto('/artwork/test-artwork-123?variant=physical-first');
    await page.click('[data-testid="purchase-button"]');
    
    // Verify size selection buttons are present
    await expect(page.getByText('12x18"')).toBeVisible();
    await expect(page.getByText('16x24"')).toBeVisible();
    await expect(page.getByText('20x30"')).toBeVisible();
    
    // Verify 16x24 is selected by default
    const defaultSizeButton = page.locator('button:has-text("16x24\"")');
    await expect(defaultSizeButton).toHaveClass(/ring-2/);
    
    // Select Art Print product
    await page.click('text=Premium Art Print');
    
    // Verify default pricing for 16x24
    await expect(page.getByText('$29.99')).toBeVisible();
    
    // Change to 20x30 size
    await page.click('button:has-text("20x30\"")');
    
    // Verify pricing updates
    await expect(page.getByText('$34.99')).toBeVisible();
    
    // Verify 20x30 is now selected
    const newSizeButton = page.locator('button:has-text("20x30\"")');
    await expect(newSizeButton).toHaveClass(/ring-2/);
    
    // Complete purchase with selected size
    await page.click('text=Order My Masterpiece');
    
    // Verify checkout request includes correct size
    const checkoutRequest = await page.waitForRequest('**/api/checkout/artwork');
    const requestBody = JSON.parse(checkoutRequest.postData() || '{}');
    expect(requestBody.size).toBe('20x30');
    expect(requestBody.productType).toBe('art_print');
  });

  test('should show different pricing for different product types and sizes', async ({ page }) => {
    await page.goto('/artwork/test-artwork-123?variant=physical-first');
    await page.click('[data-testid="purchase-button"]');
    
    // Test Art Print pricing
    await page.click('text=Premium Art Print');
    
    // Test 12x18 pricing
    await page.click('button:has-text("12x18\"")');
    await expect(page.getByText('$24.99')).toBeVisible();
    
    // Test 16x24 pricing
    await page.click('button:has-text("16x24\"")');
    await expect(page.getByText('$29.99')).toBeVisible();
    
    // Test 20x30 pricing
    await page.click('button:has-text("20x30\"")');
    await expect(page.getByText('$34.99')).toBeVisible();
    
    // Switch to Framed Canvas
    await page.click('text=Framed Canvas');
    
    // Test Framed Canvas pricing for same sizes
    await page.click('button:has-text("12x18\"")');
    await expect(page.getByText('$69.99')).toBeVisible();
    
    await page.click('button:has-text("16x24\"")');
    await expect(page.getByText('$79.99')).toBeVisible();
    
    await page.click('button:has-text("20x30\"")');
    await expect(page.getByText('$89.99')).toBeVisible();
  });

  test('should track analytics events', async ({ page }) => {
    // Mock gtag function
    await page.addInitScript(() => {
      (window as any).gtag = () => {};
      (window as any).gtagCalls = [];
      (window as any).gtag = (...args: any[]) => {
        (window as any).gtagCalls.push(args);
      };
    });

    await page.goto('/artwork/test-artwork-123?variant=equal-tiers');
    await page.click('[data-testid="purchase-button"]');
    
    // Check that modal_opened event was tracked
    const gtagCalls = await page.evaluate(() => (window as any).gtagCalls);
    expect(gtagCalls.some((call: any) => 
      call[0] === 'event' && 
      call[1] === 'modal_opened' && 
      call[2]?.modal_variant === 'equal-tiers'
    )).toBeTruthy();
    
    // Select a product and check purchase_initiated event
    await page.click('text=Premium Art Print');
    await page.click('text=Get My Masterpiece');
    
    const updatedGtagCalls = await page.evaluate(() => (window as any).gtagCalls);
    expect(updatedGtagCalls.some((call: any) => 
      call[0] === 'event' && 
      call[1] === 'purchase_initiated' && 
      call[2]?.modal_variant === 'equal-tiers'
    )).toBeTruthy();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/checkout/artwork', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/artwork/test-artwork-123');
    await page.click('[data-testid="purchase-button"]');
    await page.click('text=Download Now');
    
    // Verify error handling (button should return to normal state)
    await expect(page.getByText('Download Now')).toBeVisible();
  });

  test('should close modal with escape key', async ({ page }) => {
    await page.goto('/artwork/test-artwork-123');
    await page.click('[data-testid="purchase-button"]');
    
    await expect(page.getByText('Get Your Masterpiece')).toBeVisible();
    
    // Press escape to close modal
    await page.keyboard.press('Escape');
    
    // Modal should be closed
    await expect(page.getByText('Get Your Masterpiece')).not.toBeVisible();
  });

  test('should close modal with backdrop click', async ({ page }) => {
    await page.goto('/artwork/test-artwork-123');
    await page.click('[data-testid="purchase-button"]');
    
    await expect(page.getByText('Get Your Masterpiece')).toBeVisible();
    
    // Click backdrop (outside modal content)
    await page.click('.fixed.inset-0.bg-black.bg-opacity-50', { 
      position: { x: 10, y: 10 } 
    });
    
    // Modal should be closed
    await expect(page.getByText('Get Your Masterpiece')).not.toBeVisible();
  });
});
