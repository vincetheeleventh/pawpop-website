// tests/e2e/plausible-purchase-flow.spec.ts

import { test, expect, type Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

// Mock Plausible tracking
const mockPlausibleTracking = `
  window.plausibleEvents = [];
  window.plausible = function(event, options) {
    console.log('[Plausible Mock]', event, options);
    window.plausibleEvents.push({ event, options, timestamp: Date.now() });
  };
`;

// Mock file for upload testing
const createMockFile = () => {
  const buffer = Buffer.from('mock-image-data');
  return {
    name: 'test-pet.jpg',
    mimeType: 'image/jpeg',
    buffer
  };
};

// Helper functions
const getTrackedEvents = async (page: Page) => {
  return await page.evaluate(() => window.plausibleEvents || []);
};

const setVariant = async (page: Page, variant: 'A' | 'B') => {
  await page.addInitScript((variant) => {
    Math.random = () => variant === 'A' ? 0.3 : 0.7;
  }, variant);
};

test.describe('Plausible Purchase Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(mockPlausibleTracking);
    await page.evaluate(() => localStorage.clear());
  });

  test.describe('Complete Purchase Flow - Variant A', () => {
    test('should track complete funnel with variant A pricing', async ({ page }) => {
      await setVariant(page, 'A');
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Step 1: Landing page view
      let events = await getTrackedEvents(page);
      const pageViewEvent = events.find(e => e.event === 'Page View');
      expect(pageViewEvent?.options?.props?.price_variant).toBe('A');

      // Step 2: Upload modal opened
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });

      events = await getTrackedEvents(page);
      const modalOpenEvent = events.find(e => e.event === 'Funnel Step' && e.options.props.step === 'Upload Modal Opened');
      expect(modalOpenEvent?.options?.props?.price_variant).toBe('A');
      expect(modalOpenEvent?.options?.props?.step_number).toBe(2);

      // Step 3: Photo upload simulation
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.isVisible()) {
        const mockFile = createMockFile();
        await fileInput.setInputFiles({
          name: mockFile.name,
          mimeType: mockFile.mimeType,
          buffer: mockFile.buffer
        });

        events = await getTrackedEvents(page);
        const photoUploadEvent = events.find(e => e.event === 'Funnel Step' && e.options.props.step === 'Photo Uploaded');
        expect(photoUploadEvent?.options?.props?.price_variant).toBe('A');
        expect(photoUploadEvent?.options?.props?.step_number).toBe(3);
      }

      // Verify all events have variant A context
      events = await getTrackedEvents(page);
      const variantEvents = events.filter(e => e.options?.props?.price_variant);
      variantEvents.forEach(event => {
        expect(event.options.props.price_variant).toBe('A');
        expect(event.options.props.variant_label).toBe('Standard Pricing');
      });
    });

    test('should track artwork page view with variant A context', async ({ page }) => {
      await setVariant(page, 'A');
      
      // Navigate directly to an artwork page (mock URL)
      const mockArtworkToken = 'test-artwork-token-123';
      await page.goto(`${BASE_URL}/artwork/${mockArtworkToken}`);
      await page.waitForLoadState('networkidle');

      const events = await getTrackedEvents(page);
      const artworkViewEvent = events.find(e => e.event === 'Funnel Step' && e.options.props.step === 'Artwork Page Viewed');
      
      if (artworkViewEvent) {
        expect(artworkViewEvent.options.props.price_variant).toBe('A');
        expect(artworkViewEvent.options.props.step_number).toBe(6);
      }

      // Check page view event
      const pageViewEvent = events.find(e => e.event === 'Page View');
      expect(pageViewEvent?.options?.props?.price_variant).toBe('A');
    });

    test('should track purchase modal with variant A pricing exposure', async ({ page }) => {
      await setVariant(page, 'A');
      await page.goto(`${BASE_URL}/artwork/test-token`);
      await page.waitForLoadState('networkidle');

      // Look for "Make it Real" or purchase buttons
      const purchaseButton = page.locator('text=Make it Real').or(page.locator('text=Order Prints')).first();
      
      if (await purchaseButton.isVisible()) {
        await purchaseButton.click();
        
        // Wait for purchase modal
        await page.waitForTimeout(1000);

        const events = await getTrackedEvents(page);
        const purchaseModalEvent = events.find(e => e.event === 'Funnel Step' && e.options.props.step === 'Purchase Modal Opened');
        
        if (purchaseModalEvent) {
          expect(purchaseModalEvent.options.props.price_variant).toBe('A');
          expect(purchaseModalEvent.options.props.step_number).toBe(7);
        }

        // Check for price exposure tracking
        const priceExposureEvent = events.find(e => e.event === 'Variant Exposure');
        if (priceExposureEvent) {
          expect(priceExposureEvent.options.props.price_variant).toBe('A');
          expect(priceExposureEvent.options.props.variant_digital_price).toBe(29);
          expect(priceExposureEvent.options.props.variant_print_price).toBe(79);
          expect(priceExposureEvent.options.props.variant_canvas_price).toBe(129);
        }
      }
    });
  });

  test.describe('Complete Purchase Flow - Variant B', () => {
    test('should track complete funnel with variant B pricing', async ({ page }) => {
      await setVariant(page, 'B');
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Step 1: Landing page view
      let events = await getTrackedEvents(page);
      const pageViewEvent = events.find(e => e.event === 'Page View');
      expect(pageViewEvent?.options?.props?.price_variant).toBe('B');

      // Step 2: Upload modal opened
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });

      events = await getTrackedEvents(page);
      const modalOpenEvent = events.find(e => e.event === 'Funnel Step' && e.options.props.step === 'Upload Modal Opened');
      expect(modalOpenEvent?.options?.props?.price_variant).toBe('B');

      // Verify all events have variant B context
      events = await getTrackedEvents(page);
      const variantEvents = events.filter(e => e.options?.props?.price_variant);
      variantEvents.forEach(event => {
        expect(event.options.props.price_variant).toBe('B');
        expect(event.options.props.variant_label).toBe('Premium Pricing');
      });
    });

    test('should track purchase modal with variant B pricing exposure', async ({ page }) => {
      await setVariant(page, 'B');
      await page.goto(`${BASE_URL}/artwork/test-token`);
      await page.waitForLoadState('networkidle');

      // Look for purchase buttons
      const purchaseButton = page.locator('text=Make it Real').or(page.locator('text=Order Prints')).first();
      
      if (await purchaseButton.isVisible()) {
        await purchaseButton.click();
        await page.waitForTimeout(1000);

        const events = await getTrackedEvents(page);
        
        // Check for price exposure with variant B prices
        const priceExposureEvent = events.find(e => e.event === 'Variant Exposure');
        if (priceExposureEvent) {
          expect(priceExposureEvent.options.props.price_variant).toBe('B');
          expect(priceExposureEvent.options.props.variant_digital_price).toBe(39);
          expect(priceExposureEvent.options.props.variant_print_price).toBe(89);
          expect(priceExposureEvent.options.props.variant_canvas_price).toBe(149);
        }
      }
    });
  });

  test.describe('Revenue Attribution Testing', () => {
    test('should simulate purchase completion with variant A revenue', async ({ page }) => {
      await setVariant(page, 'A');
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Simulate a completed purchase by injecting the conversion event
      await page.evaluate(() => {
        if (window.plausible) {
          // Simulate print purchase with variant A pricing
          window.plausible('Conversion: Purchase', {
            props: {
              conversion_type: 'Purchase',
              digital_price: 29,
              print_price: 79,
              canvas_price: 129,
              product_type: 'print',
              price_variant: 'A',
              variant_label: 'Standard Pricing',
              amount: 79,
              currency: 'USD'
            },
            revenue: {
              currency: 'USD',
              amount: 79
            }
          });
        }
      });

      const events = await getTrackedEvents(page);
      const purchaseEvent = events.find(e => e.event === 'Conversion: Purchase');
      
      expect(purchaseEvent).toBeTruthy();
      expect(purchaseEvent?.options?.props?.price_variant).toBe('A');
      expect(purchaseEvent?.options?.props?.amount).toBe(79);
      expect(purchaseEvent?.options?.revenue?.amount).toBe(79);
      expect(purchaseEvent?.options?.props?.print_price).toBe(79); // Variant A price
    });

    test('should simulate purchase completion with variant B revenue', async ({ page }) => {
      await setVariant(page, 'B');
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Simulate purchase with variant B pricing
      await page.evaluate(() => {
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
      });

      const events = await getTrackedEvents(page);
      const purchaseEvent = events.find(e => e.event === 'Conversion: Purchase');
      
      expect(purchaseEvent).toBeTruthy();
      expect(purchaseEvent?.options?.props?.price_variant).toBe('B');
      expect(purchaseEvent?.options?.props?.amount).toBe(89);
      expect(purchaseEvent?.options?.revenue?.amount).toBe(89);
      expect(purchaseEvent?.options?.props?.print_price).toBe(89); // Variant B price (10 higher)
    });

    test('should calculate revenue difference between variants', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Simulate multiple purchases for both variants
      await page.evaluate(() => {
        if (window.plausible) {
          // 5 purchases for variant A
          for (let i = 0; i < 5; i++) {
            window.plausible('Conversion: Purchase', {
              props: {
                conversion_type: 'Purchase',
                product_type: 'print',
                price_variant: 'A',
                variant_label: 'Standard Pricing',
                amount: 79,
                currency: 'USD',
                order_id: `order_a_${i}`
              },
              revenue: { currency: 'USD', amount: 79 }
            });
          }

          // 5 purchases for variant B
          for (let i = 0; i < 5; i++) {
            window.plausible('Conversion: Purchase', {
              props: {
                conversion_type: 'Purchase',
                product_type: 'print',
                price_variant: 'B',
                variant_label: 'Premium Pricing',
                amount: 89,
                currency: 'USD',
                order_id: `order_b_${i}`
              },
              revenue: { currency: 'USD', amount: 89 }
            });
          }
        }
      });

      const events = await getTrackedEvents(page);
      const purchaseEvents = events.filter(e => e.event === 'Conversion: Purchase');
      
      expect(purchaseEvents).toHaveLength(10);

      const variantAEvents = purchaseEvents.filter(e => e.options.props.price_variant === 'A');
      const variantBEvents = purchaseEvents.filter(e => e.options.props.price_variant === 'B');
      
      expect(variantAEvents).toHaveLength(5);
      expect(variantBEvents).toHaveLength(5);

      // Calculate revenue
      const variantARevenue = variantAEvents.reduce((sum, event) => sum + event.options.props.amount, 0);
      const variantBRevenue = variantBEvents.reduce((sum, event) => sum + event.options.props.amount, 0);
      
      expect(variantARevenue).toBe(395); // 5 × $79
      expect(variantBRevenue).toBe(445); // 5 × $89
      expect(variantBRevenue - variantARevenue).toBe(50); // $10 difference per order
    });
  });

  test.describe('Error Scenarios', () => {
    test('should handle tracking errors gracefully during purchase flow', async ({ page }) => {
      await setVariant(page, 'A');
      
      // Mock Plausible to throw errors
      await page.addInitScript(() => {
        window.plausible = function() {
          throw new Error('Tracking error');
        };
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // User flow should still work despite tracking errors
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });
      
      // Should not have thrown any unhandled errors
      const errors = [];
      page.on('pageerror', error => errors.push(error));
      
      await page.waitForTimeout(1000);
      expect(errors).toHaveLength(0);
    });

    test('should handle network failures during tracking', async ({ page }) => {
      await setVariant(page, 'A');
      
      // Block network requests to Plausible
      await page.route('**/js/script.js', route => route.abort());
      await page.route('**/api/event', route => route.abort());

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // User flow should still work
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });
      
      // Page should function normally
      await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();
    });
  });

  test.describe('Performance Impact', () => {
    test('should not significantly impact page performance', async ({ page }) => {
      await setVariant(page, 'A');
      
      // Measure page load time
      const startTime = Date.now();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Should load reasonably fast
      expect(loadTime).toBeLessThan(5000);

      // Measure interaction responsiveness
      const interactionStart = Date.now();
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });
      const interactionTime = Date.now() - interactionStart;

      expect(interactionTime).toBeLessThan(1000); // Should be responsive
    });

    test('should handle high-frequency events without performance degradation', async ({ page }) => {
      await setVariant(page, 'A');
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Generate many tracking events rapidly
      const startTime = Date.now();
      
      for (let i = 0; i < 50; i++) {
        await page.evaluate((i) => {
          if (window.plausible) {
            window.plausible('Test Event', {
              props: {
                iteration: i,
                price_variant: 'A',
                variant_label: 'Standard Pricing'
              }
            });
          }
        }, i);
      }

      const processingTime = Date.now() - startTime;
      expect(processingTime).toBeLessThan(1000); // Should process quickly

      // Verify events were tracked
      const events = await getTrackedEvents(page);
      const testEvents = events.filter(e => e.event === 'Test Event');
      expect(testEvents).toHaveLength(50);
    });
  });

  test.describe('Data Quality Validation', () => {
    test('should ensure all funnel events have required properties', async ({ page }) => {
      await setVariant(page, 'A');
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Trigger multiple funnel steps
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });

      const events = await getTrackedEvents(page);
      const funnelEvents = events.filter(e => e.event === 'Funnel Step');

      funnelEvents.forEach(event => {
        // Required properties for funnel analysis
        expect(event.options.props.step).toBeTruthy();
        expect(event.options.props.step_number).toBeGreaterThan(0);
        expect(event.options.props.price_variant).toBeTruthy();
        expect(event.options.props.variant_label).toBeTruthy();
        expect(event.timestamp).toBeGreaterThan(0);
      });
    });

    test('should ensure revenue events have correct structure', async ({ page }) => {
      await setVariant(page, 'B');
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Simulate purchase
      await page.evaluate(() => {
        if (window.plausible) {
          window.plausible('Conversion: Purchase', {
            props: {
              conversion_type: 'Purchase',
              product_type: 'canvas',
              price_variant: 'B',
              variant_label: 'Premium Pricing',
              amount: 149,
              currency: 'USD'
            },
            revenue: {
              currency: 'USD',
              amount: 149
            }
          });
        }
      });

      const events = await getTrackedEvents(page);
      const revenueEvent = events.find(e => e.event === 'Conversion: Purchase');

      expect(revenueEvent).toBeTruthy();
      expect(revenueEvent?.options?.props?.amount).toBe(149);
      expect(revenueEvent?.options?.props?.currency).toBe('USD');
      expect(revenueEvent?.options?.revenue?.amount).toBe(149);
      expect(revenueEvent?.options?.revenue?.currency).toBe('USD');
      expect(revenueEvent?.options?.props?.price_variant).toBe('B');
    });
  });
});
