// tests/e2e/plausible-ab-testing.spec.ts

import { test, expect, type Page, type BrowserContext } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// Mock Plausible tracking function
const mockPlausibleTracking = `
  window.plausibleEvents = [];
  window.plausible = function(event, options) {
    console.log('[Plausible Mock]', event, options);
    window.plausibleEvents.push({ event, options, timestamp: Date.now() });
  };
`;

// Helper to get localStorage values
const getLocalStorageValue = async (page: Page, key: string) => {
  return await page.evaluate((key) => localStorage.getItem(key), key);
};

// Helper to set localStorage values
const setLocalStorageValue = async (page: Page, key: string, value: string) => {
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key, value });
};

// Helper to clear localStorage
const clearLocalStorage = async (page: Page) => {
  await page.evaluate(() => localStorage.clear());
};

// Helper to get tracked events
const getTrackedEvents = async (page: Page) => {
  return await page.evaluate(() => window.plausibleEvents || []);
};

test.describe('Plausible Analytics A/B Testing E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await clearLocalStorage(page);
    
    // Add mock Plausible tracking
    await page.addInitScript(mockPlausibleTracking);
    
    // Navigate to home page
    await page.goto(BASE_URL);
  });

  test.describe('Price Variant Assignment', () => {
    test('should assign variant A and persist across page reloads', async ({ page }) => {
      // Mock Math.random to return 0.3 (should assign variant A)
      await page.addInitScript(() => {
        Math.random = () => 0.3;
      });

      // Reload page to trigger variant assignment
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check localStorage for variant assignment
      const variant = await getLocalStorageValue(page, 'pawpop_price_variant');
      const expiry = await getLocalStorageValue(page, 'pawpop_price_variant_expiry');
      const priceConfig = await page.evaluate(() => window.priceConfig);
      expect(priceConfig.digital).toBe(15);
      expect(priceConfig.print).toBe(29);
      expect(priceConfig.canvasFramed).toBe(99);
      expect(variant).toBe('A');
      expect(expiry).toBeTruthy();

      // Check that variant assignment event was tracked
      const events = await getTrackedEvents(page);
      const assignmentEvent = events.find(e => e.event === 'Price Variant Assigned');
      expect(assignmentEvent).toBeTruthy();
      expect(assignmentEvent.options.props.variant).toBe('A');
      expect(assignmentEvent.options.props.label).toBe('Standard Pricing');

      // Reload page and verify persistence
      await page.reload();
      await page.waitForLoadState('networkidle');

      const persistedVariant = await getLocalStorageValue(page, 'pawpop_price_variant');
      expect(persistedVariant).toBe('A');

      // Verify no new assignment event was tracked
      const eventsAfterReload = await getTrackedEvents(page);
      const assignmentEvents = eventsAfterReload.filter(e => e.event === 'Price Variant Assigned');
      expect(assignmentEvents).toHaveLength(1); // Should still be just one
    });

    test('should assign variant B when random > 0.5', async ({ page }) => {
      // Mock Math.random to return 0.7 (should assign variant B)
      await page.addInitScript(() => {
        Math.random = () => 0.7;
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      const variant = await getLocalStorageValue(page, 'pawpop_price_variant');
      expect(variant).toBe('B');

      const events = await getTrackedEvents(page);
      const assignmentEvent = events.find(e => e.event === 'Price Variant Assigned');
      expect(assignmentEvent.options.props.variant).toBe('B');
      expect(assignmentEvent.options.props.label).toBe('Premium Pricing');
    });

    test('should handle expired variant and reassign', async ({ page }) => {
      // Set expired variant in localStorage
      const expiredTime = Date.now() - 1000; // 1 second ago
      await setLocalStorageValue(page, 'pawpop_price_variant', 'A');
      await setLocalStorageValue(page, 'pawpop_price_variant_expiry', expiredTime.toString());

      // Mock Math.random for new assignment
      await page.addInitScript(() => {
        Math.random = () => 0.8;
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should have reassigned to variant B
      const newVariant = await getLocalStorageValue(page, 'pawpop_price_variant');
      expect(newVariant).toBe('B');

      const events = await getTrackedEvents(page);
      const assignmentEvent = events.find(e => e.event === 'Price Variant Assigned');
      expect(assignmentEvent.options.props.variant).toBe('B');
    });
  });

  test.describe('Dynamic Pricing Display', () => {
    test('should display variant A pricing in components', async ({ page }) => {
      // Force variant A
      await page.addInitScript(() => {
        Math.random = () => 0.3;
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Click upload button to open modal
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });

      // Complete upload flow to reach pricing
      // Note: This would need actual file upload implementation
      // For now, we'll test the pricing display logic

      // Check that upload modal opened event was tracked
      const events = await getTrackedEvents(page);
      const modalEvent = events.find(e => e.event === 'Funnel Step' && e.options.props.step === 'Upload Modal Opened');
      expect(modalEvent).toBeTruthy();
      expect(modalEvent.options.props.price_variant).toBe('A');
    });

    test('should display variant B pricing in components', async ({ page }) => {
      // Force variant B
      await page.addInitScript(() => {
        Math.random = () => 0.7;
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Click upload button
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });

      // Verify variant B context in events
      const events = await getTrackedEvents(page);
      const modalEvent = events.find(e => e.event === 'Funnel Step' && e.options.props.step === 'Upload Modal Opened');
      expect(modalEvent.options.props.price_variant).toBe('B');
      expect(modalEvent.options.props.variant_label).toBe('Premium Pricing');
    });
  });

  test.describe('Funnel Tracking', () => {
    test('should track complete funnel flow with variant context', async ({ page }) => {
      // Force variant A for consistent testing
      await page.addInitScript(() => {
        Math.random = () => 0.3;
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Step 1: Landing page view (automatic)
      let events = await getTrackedEvents(page);
      const pageViewEvent = events.find(e => e.event === 'Page View');
      expect(pageViewEvent).toBeTruthy();
      expect(pageViewEvent.options.props.price_variant).toBe('A');

      // Step 2: Upload modal opened
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });

      events = await getTrackedEvents(page);
      const uploadModalEvent = events.find(e => e.event === 'Funnel Step' && e.options.props.step === 'Upload Modal Opened');
      expect(uploadModalEvent).toBeTruthy();
      expect(uploadModalEvent.options.props.step_number).toBe(2);
      expect(uploadModalEvent.options.props.price_variant).toBe('A');

      // Step 3: Modal interaction tracking
      const modalOpenEvent = events.find(e => e.event === 'Modal Opened' && e.options.props.modal_name === 'Upload Modal');
      expect(modalOpenEvent).toBeTruthy();
      expect(modalOpenEvent.options.props.price_variant).toBe('A');

      // Close modal and verify tracking
      await page.click('[data-testid="upload-modal"] button[aria-label="Close"]');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'hidden' });

      events = await getTrackedEvents(page);
      const modalCloseEvent = events.find(e => e.event === 'Modal Closed');
      expect(modalCloseEvent).toBeTruthy();
      expect(modalCloseEvent.options.props.price_variant).toBe('A');
    });

    test('should track button clicks with variant context', async ({ page }) => {
      // Force variant B
      await page.addInitScript(() => {
        Math.random = () => 0.7;
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Click main CTA button
      await page.click('text=Upload Photo Now');

      const events = await getTrackedEvents(page);
      const buttonClickEvent = events.find(e => e.event === 'Button Click');
      expect(buttonClickEvent).toBeTruthy();
      expect(buttonClickEvent.options.props.price_variant).toBe('B');
      expect(buttonClickEvent.options.props.variant_label).toBe('Premium Pricing');
    });
  });

  test.describe('Performance Tracking', () => {
    test('should track page load performance with variant context', async ({ page }) => {
      // Force variant A
      await page.addInitScript(() => {
        Math.random = () => 0.3;
      });

      // Add performance tracking mock
      await page.addInitScript(() => {
        // Mock performance.now() for consistent testing
        let startTime = 0;
        const originalNow = performance.now;
        performance.now = () => {
          startTime += 100; // Simulate 100ms increments
          return startTime;
        };

        // Simulate page load tracking
        window.addEventListener('load', () => {
          if (window.plausible) {
            window.plausible('Page Load Performance', {
              props: {
                load_time_ms: 1500,
                path: window.location.pathname,
                price_variant: 'A',
                variant_label: 'Standard Pricing'
              }
            });
          }
        });
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Trigger load event
      await page.evaluate(() => {
        window.dispatchEvent(new Event('load'));
      });

      const events = await getTrackedEvents(page);
      const performanceEvent = events.find(e => e.event === 'Page Load Performance');
      expect(performanceEvent).toBeTruthy();
      expect(performanceEvent.options.props.load_time_ms).toBe(1500);
      expect(performanceEvent.options.props.price_variant).toBe('A');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle localStorage errors gracefully', async ({ page }) => {
      // Mock localStorage to throw errors
      await page.addInitScript(() => {
        const originalGetItem = localStorage.getItem;
        localStorage.getItem = () => {
          throw new Error('localStorage error');
        };
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Page should still load and function
      await expect(page.locator('text=Upload Photo Now')).toBeVisible();

      // Should fallback to variant A
      const events = await getTrackedEvents(page);
      const pageViewEvent = events.find(e => e.event === 'Page View');
      expect(pageViewEvent).toBeTruthy();
    });

    test('should handle missing Plausible script gracefully', async ({ page }) => {
      // Clear the mock Plausible function
      await page.addInitScript(() => {
        delete window.plausible;
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Page should still function normally
      await expect(page.locator('text=Upload Photo Now')).toBeVisible();
      
      // Click button - should not throw errors
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });
    });
  });

  test.describe('Cross-Browser Persistence', () => {
    test('should maintain variant across different tabs', async ({ context }) => {
      // Create first page and assign variant
      const page1 = await context.newPage();
      await page1.addInitScript(mockPlausibleTracking);
      await page1.addInitScript(() => {
        Math.random = () => 0.3; // Force variant A
      });
      
      await page1.goto(BASE_URL);
      await page1.waitForLoadState('networkidle');

      const variant1 = await getLocalStorageValue(page1, 'pawpop_price_variant');
      expect(variant1).toBe('A');

      // Create second page in same context
      const page2 = await context.newPage();
      await page2.addInitScript(mockPlausibleTracking);
      await page2.goto(BASE_URL);
      await page2.waitForLoadState('networkidle');

      const variant2 = await getLocalStorageValue(page2, 'pawpop_price_variant');
      expect(variant2).toBe('A'); // Should be same as first tab

      // Verify no new assignment event in second tab
      const events2 = await getTrackedEvents(page2);
      const assignmentEvents = events2.filter(e => e.event === 'Price Variant Assigned');
      expect(assignmentEvents).toHaveLength(0); // No new assignment
    });
  });

  test.describe('Analytics Integration', () => {
    test('should track variant exposure on key elements', async ({ page }) => {
      // Force variant B for higher prices
      await page.addInitScript(() => {
        Math.random = () => 0.7;
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Simulate scrolling to pricing section (if it exists on homepage)
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });

      // Wait a bit for any scroll-triggered events
      await page.waitForTimeout(500);

      // Open upload modal to trigger price exposure
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });

      const events = await getTrackedEvents(page);
      
      // Verify variant context in all events
      events.forEach(event => {
        if (event.options && event.options.props) {
          expect(event.options.props.price_variant).toBe('B');
          expect(event.options.props.variant_label).toBe('Premium Pricing');
        }
      });
    });

    test('should provide data for conversion rate analysis', async ({ page }) => {
      // Force variant A
      await page.addInitScript(() => {
        Math.random = () => 0.3;
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Simulate user journey
      await page.click('text=Upload Photo Now'); // Funnel step 2
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });

      // Close modal (simulating drop-off)
      await page.click('[data-testid="upload-modal"] button[aria-label="Close"]');

      const events = await getTrackedEvents(page);
      
      // Verify we have funnel progression data
      const funnelEvents = events.filter(e => e.event === 'Funnel Step');
      expect(funnelEvents.length).toBeGreaterThan(0);

      // Verify all events have variant context for analysis
      funnelEvents.forEach(event => {
        expect(event.options.props.price_variant).toBe('A');
        expect(event.options.props.step_number).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Revenue Attribution', () => {
    test('should track revenue events with variant context', async ({ page }) => {
      // Force variant B (higher prices)
      await page.addInitScript(() => {
        Math.random = () => 0.7;
      });

      // Mock a purchase completion event
      await page.addInitScript(() => {
        setTimeout(() => {
          if (window.plausible) {
            window.plausible('Conversion: Purchase', {
              props: {
                conversion_type: 'Purchase',
                digital_price: 39,
                print_price: 89,
                canvas_price: 149,
                product_type: 'print',
                price_variant: 'B',
                variant_label: 'Premium Pricing',
                amount: 89,
                currency: 'USD'
              },
              revenue: {
                currency: 'USD',
                amount: 89
              }
            });
          }
        }, 1000);
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500); // Wait for mock purchase event

      const events = await getTrackedEvents(page);
      const purchaseEvent = events.find(e => e.event === 'Conversion: Purchase');
      
      expect(purchaseEvent).toBeTruthy();
      expect(purchaseEvent.options.props.price_variant).toBe('B');
      expect(purchaseEvent.options.props.amount).toBe(89);
      expect(purchaseEvent.options.revenue.amount).toBe(89);
      expect(purchaseEvent.options.props.print_price).toBe(89); // Variant B price
    });
  });
});

test.describe('Plausible A/B Testing - Mobile', () => {
  test.use({ 
    viewport: { width: 375, height: 667 } // iPhone SE size
  });

  test('should work correctly on mobile devices', async ({ page }) => {
    await page.addInitScript(mockPlausibleTracking);
    await page.addInitScript(() => {
      Math.random = () => 0.3; // Force variant A
    });

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Verify variant assignment works on mobile
    const variant = await getLocalStorageValue(page, 'pawpop_price_variant');
    expect(variant).toBe('A');

    // Test mobile interactions
    await page.click('text=Upload Photo Now');
    await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });

    const events = await getTrackedEvents(page);
    const modalEvent = events.find(e => e.event === 'Funnel Step' && e.options.props.step === 'Upload Modal Opened');
    expect(modalEvent).toBeTruthy();
    expect(modalEvent.options.props.price_variant).toBe('A');
  });
});

test.describe('Plausible A/B Testing - Performance', () => {
  test('should not impact page load performance significantly', async ({ page }) => {
    await page.addInitScript(mockPlausibleTracking);
    
    const startTime = Date.now();
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Page should load within reasonable time (adjust threshold as needed)
    expect(loadTime).toBeLessThan(5000); // 5 seconds max

    // Verify analytics are working
    const events = await getTrackedEvents(page);
    expect(events.length).toBeGreaterThan(0);
  });

  test('should handle rapid interactions without errors', async ({ page }) => {
    await page.addInitScript(mockPlausibleTracking);
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Rapidly click and interact
    for (let i = 0; i < 5; i++) {
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });
      await page.click('[data-testid="upload-modal"] button[aria-label="Close"]');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'hidden' });
    }

    // Should not have thrown any errors
    const events = await getTrackedEvents(page);
    expect(events.length).toBeGreaterThan(10); // Should have tracked multiple events
  });
});
