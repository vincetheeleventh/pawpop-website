import { test, expect } from '@playwright/test';

test.describe('Purchase Modal A/B Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-modals');
    await expect(page.locator('h1')).toContainText('A/B Test Modal Variants');
  });

  test.describe('Digital-First Modal', () => {
    test('should display digital-first modal with correct layout', async ({ page }) => {
      // Open Digital-First modal
      await page.click('text=View Modal >> nth=0');
      
      // Check modal is visible
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=Get My Masterpiece')).toBeVisible();
      
      // Check digital-first specific elements
      await expect(page.locator('text=Instant Download, Print it Yourself')).toBeVisible();
      await expect(page.locator('text=Download Now')).toBeVisible();
      await expect(page.locator('text=Prefer a physical print?')).toBeVisible();
      
      // Check pricing display
      await expect(page.locator('text=$9.99')).toBeVisible();
    });

    test('should show physical options when clicked', async ({ page }) => {
      await page.click('text=View Modal >> nth=0');
      
      // Click "View Print Options"
      await page.click('text=View Print Options');
      
      // Check physical options are shown
      await expect(page.locator('text=Premium Art Print')).toBeVisible();
      await expect(page.locator('text=Framed Canvas')).toBeVisible();
      await expect(page.locator('text=Back to Digital Download')).toBeVisible();
    });

    test('should handle purchase flow', async ({ page }) => {
      await page.click('text=View Modal >> nth=0');
      
      // Test digital purchase
      await page.click('text=Download Now');
      
      // Should show demo alert
      await expect(page.locator('text=Processing...')).toBeVisible();
      
      // Wait for demo alert
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Demo: Would purchase DIGITAL');
        expect(dialog.message()).toContain('Variant: Digital-First');
        await dialog.accept();
      });
    });
  });

  test.describe('Equal Tiers Modal', () => {
    test('should display equal tiers modal with 3-column layout', async ({ page }) => {
      await page.click('text=View Modal >> nth=1');
      
      // Check modal structure
      await expect(page.locator('text=Choose Your Format')).toBeVisible();
      
      // Check all three tiers are visible
      await expect(page.locator('text=Digital Download')).toBeVisible();
      await expect(page.locator('text=Premium Art Print')).toBeVisible();
      await expect(page.locator('text=Framed Canvas')).toBeVisible();
      
      // Check "Best Value" badge
      await expect(page.locator('text=Best Value')).toBeVisible();
      
      // Check feature lists with checkmarks
      await expect(page.locator('text=Instant delivery')).toBeVisible();
      await expect(page.locator('text=Museum-quality paper')).toBeVisible();
      await expect(page.locator('text=Gallery-wrapped canvas')).toBeVisible();
    });

    test('should allow tier selection and purchase', async ({ page }) => {
      await page.click('text=View Modal >> nth=1');
      
      // Select Art Print tier
      await page.click('[data-testid="art-print-tier"], .border-2:has-text("Premium Art Print")');
      
      // Check selection indicator
      await expect(page.locator('.bg-mona-gold')).toBeVisible();
      
      // Purchase button should be enabled
      await expect(page.locator('text=Get My Masterpiece')).toBeVisible();
      await page.click('text=Get My Masterpiece');
      
      // Check demo flow
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Equal-Tiers');
        await dialog.accept();
      });
    });
  });

  test.describe('Physical-First Modal', () => {
    test('should display physical-first modal with gift context', async ({ page }) => {
      await page.click('text=View Modal >> nth=2');
      
      // Check gift-focused messaging
      await expect(page.locator('text=The Perfect Gift')).toBeVisible();
      await expect(page.locator('text=A gift that will be treasured forever')).toBeVisible();
      
      // Check main physical options
      await expect(page.locator('text=Premium Art Print')).toBeVisible();
      await expect(page.locator('text=Framed Canvas')).toBeVisible();
      
      // Check "Free digital copy included" messaging
      await expect(page.locator('text=Free digital copy included')).toHaveCount(2);
      
      // Check digital-only option at bottom
      await expect(page.locator('text=Just want the digital file?')).toBeVisible();
    });

    test('should show popular badge and savings', async ({ page }) => {
      await page.click('text=View Modal >> nth=2');
      
      // Check "Most Popular" badge
      await expect(page.locator('text=Most Popular')).toBeVisible();
      
      // Check savings display
      await expect(page.locator('text=Save')).toBeVisible();
      await expect(page.locator('.line-through')).toBeVisible();
    });

    test('should handle physical product selection', async ({ page }) => {
      await page.click('text=View Modal >> nth=2');
      
      // Select Framed Canvas
      await page.click('.border-2:has-text("Framed Canvas")');
      
      // Check selection styling
      await expect(page.locator('.border-mona-gold')).toBeVisible();
      
      // Purchase
      await page.click('text=Order My Masterpiece');
      
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Physical-First');
        await dialog.accept();
      });
    });
  });

  test.describe('Modal Router Functionality', () => {
    test('should close modals when clicking X button', async ({ page }) => {
      await page.click('text=View Modal >> nth=0');
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Click close button
      await page.click('[aria-label="Close"], button:has-text("×")');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });

    test('should close modals when clicking outside', async ({ page }) => {
      await page.click('text=View Modal >> nth=0');
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      
      // Click backdrop
      await page.click('.fixed.inset-0.bg-black.bg-opacity-50');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });

    test('should handle keyboard navigation', async ({ page }) => {
      await page.click('text=View Modal >> nth=0');
      
      // Test Escape key
      await page.keyboard.press('Escape');
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.click('text=View Modal >> nth=0');
      
      // Check modal is responsive
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=Download Now')).toBeVisible();
      
      // Check button is touch-friendly
      const button = page.locator('text=Download Now');
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThan(44); // Minimum touch target
    });
  });

  test.describe('Analytics Tracking', () => {
    test('should track modal variant in console', async ({ page }) => {
      const consoleLogs: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'log') {
          consoleLogs.push(msg.text());
        }
      });

      await page.click('text=View Modal >> nth=0');
      
      // Check for analytics tracking
      await page.waitForTimeout(100);
      expect(consoleLogs.some(log => 
        log.includes('Modal A/B Test') && log.includes('modal_opened')
      )).toBeTruthy();
    });
  });
});
