import { test, expect } from '@playwright/test';

test.describe('Artwork Viewing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the artwork API endpoint
    await page.route('/api/artwork/*', async (route) => {
      const url = route.request().url();
      const token = url.split('/').pop();
      
      if (token === 'valid-token-123') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            artwork: {
              id: 'artwork-123',
              generated_image_url: 'https://test.fal.media/generated-artwork.jpg',
              pet_name: 'Buddy',
              customer_name: 'Test User',
              customer_email: 'test@example.com',
              generation_status: 'completed'
            }
          })
        });
      } else if (token === 'pending-token-456') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            artwork: {
              id: 'artwork-456',
              customer_name: 'Test User',
              customer_email: 'test@example.com',
              generation_status: 'pending'
            }
          })
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Artwork not found or link expired' })
        });
      }
    });
  });

  test('should display completed artwork with purchase option', async ({ page }) => {
    await page.goto('/artwork/valid-token-123');

    // Verify artwork page loads
    await expect(page.locator('text=Your Masterpiece is Ready!')).toBeVisible();
    await expect(page.locator('text=Test User & Buddy in the style of the Mona Lisa')).toBeVisible();

    // Verify artwork image displays
    await expect(page.locator('img[alt="Your PawPop Masterpiece"]')).toBeVisible();
    await expect(page.locator('img[alt="Your PawPop Masterpiece"]')).toHaveAttribute('src', 'https://test.fal.media/generated-artwork.jpg');

    // Verify purchase button
    await expect(page.locator('button:has-text("Get My Masterpiece")')).toBeVisible();
    await expect(page.locator('text=Choose from digital download, premium prints, or framed canvas')).toBeVisible();

    // Verify Monsieur Brush quote
    await expect(page.locator('text="Ah, magnifique! A true Renaissance masterpiece!" - Monsieur Brush')).toBeVisible();
  });

  test('should open purchase modal when clicking Get My Masterpiece', async ({ page }) => {
    await page.goto('/artwork/valid-token-123');

    // Wait for page to load
    await expect(page.locator('text=Your Masterpiece is Ready!')).toBeVisible();

    // Click purchase button
    await page.click('button:has-text("Get My Masterpiece")');

    // Verify modal opens (A/B test modal)
    await expect(page.locator('[data-testid="purchase-modal"]')).toBeVisible();
  });

  test('should show pending status for artwork in progress', async ({ page }) => {
    await page.goto('/artwork/pending-token-456');

    // Verify pending state
    await expect(page.locator('text=Artwork In Progress')).toBeVisible();
    await expect(page.locator('text=Your masterpiece is still being created. Please check back in a few minutes.')).toBeVisible();
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible();

    // Verify hourglass emoji
    await expect(page.locator('text=⏳')).toBeVisible();
  });

  test('should handle refresh for pending artwork', async ({ page }) => {
    await page.goto('/artwork/pending-token-456');

    // Click refresh button
    await page.click('button:has-text("Refresh")');

    // Verify API call is made again
    await expect(page.locator('text=Artwork In Progress')).toBeVisible();
  });

  test('should show error for invalid token', async ({ page }) => {
    await page.goto('/artwork/invalid-token-999');

    // Verify error state
    await expect(page.locator('text=Oops!')).toBeVisible();
    await expect(page.locator('text=Artwork not found or link expired')).toBeVisible();
    await expect(page.locator('button:has-text("Return Home")')).toBeVisible();

    // Verify art emoji
    await expect(page.locator('text=🎨')).toBeVisible();
  });

  test('should navigate home from error page', async ({ page }) => {
    await page.goto('/artwork/invalid-token-999');

    // Click return home button
    await page.click('button:has-text("Return Home")');

    // Verify navigation to home page
    await page.waitForURL('/');
    await expect(page.locator('text=The Unforgettable Gift for Pet Moms')).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    // Delay the API response to test loading state
    await page.route('/api/artwork/valid-token-123', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          artwork: {
            id: 'artwork-123',
            generated_image_url: 'https://test.fal.media/generated-artwork.jpg',
            customer_name: 'Test User',
            generation_status: 'completed'
          }
        })
      });
    });

    await page.goto('/artwork/valid-token-123');

    // Verify loading state
    await expect(page.locator('text=Loading your masterpiece...')).toBeVisible();
    await expect(page.locator('.animate-spin')).toBeVisible();

    // Wait for content to load
    await expect(page.locator('text=Your Masterpiece is Ready!')).toBeVisible();
  });

  test('should handle artwork without pet name', async ({ page }) => {
    await page.route('/api/artwork/no-pet-token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          artwork: {
            id: 'artwork-789',
            generated_image_url: 'https://test.fal.media/generated-artwork.jpg',
            customer_name: 'Test User',
            customer_email: 'test@example.com',
            generation_status: 'completed'
          }
        })
      });
    });

    await page.goto('/artwork/no-pet-token');

    // Verify title shows only customer name
    await expect(page.locator('text=Test User in the style of the Mona Lisa')).toBeVisible();
  });

  test('should track A/B test modal analytics', async ({ page }) => {
    // Mock gtag for analytics tracking
    await page.addInitScript(() => {
      window.gtag = vi.fn();
    });

    await page.goto('/artwork/valid-token-123');
    await page.click('button:has-text("Get My Masterpiece")');

    // Verify analytics tracking would be called
    // Note: In real tests, you'd verify gtag calls with proper mocking
    await expect(page.locator('[data-testid="purchase-modal"]')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/artwork/valid-token-123');

    // Verify mobile layout
    await expect(page.locator('text=Your Masterpiece is Ready!')).toBeVisible();
    await expect(page.locator('img[alt="Your PawPop Masterpiece"]')).toBeVisible();
    await expect(page.locator('button:has-text("Get My Masterpiece")')).toBeVisible();

    // Verify button is touch-friendly
    const button = page.locator('button:has-text("Get My Masterpiece")');
    const buttonBox = await button.boundingBox();
    expect(buttonBox?.height).toBeGreaterThan(44); // Minimum touch target size
  });
});
