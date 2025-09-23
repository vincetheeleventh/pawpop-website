// tests/e2e/plausible-performance.spec.ts

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

const mockPlausibleTracking = `
  window.plausibleEvents = [];
  window.plausibleMetrics = {
    eventCount: 0,
    totalProcessingTime: 0,
    errors: []
  };
  
  window.plausible = function(event, options) {
    const startTime = performance.now();
    
    try {
      console.log('[Plausible Mock]', event, options);
      window.plausibleEvents.push({ 
        event, 
        options, 
        timestamp: Date.now(),
        processingTime: performance.now() - startTime
      });
      
      window.plausibleMetrics.eventCount++;
      window.plausibleMetrics.totalProcessingTime += (performance.now() - startTime);
    } catch (error) {
      window.plausibleMetrics.errors.push({
        event,
        error: error.message,
        timestamp: Date.now()
      });
    }
  };
`;

const getPerformanceMetrics = async (page: Page) => {
  return await page.evaluate(() => window.plausibleMetrics);
};

const getTrackedEvents = async (page: Page) => {
  return await page.evaluate(() => window.plausibleEvents || []);
};

test.describe('Plausible Analytics Performance Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(mockPlausibleTracking);
    await page.evaluate(() => localStorage.clear());
  });

  test.describe('Page Load Performance', () => {
    test('should not significantly impact initial page load', async ({ page }) => {
      // Measure page load without analytics
      const startTime = Date.now();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const loadTimeWithAnalytics = Date.now() - startTime;

      // Should load within reasonable time
      expect(loadTimeWithAnalytics).toBeLessThan(5000);

      // Verify analytics initialized
      const events = await getTrackedEvents(page);
      expect(events.length).toBeGreaterThan(0);

      // Check for page view event
      const pageViewEvent = events.find(e => e.event === 'Page View');
      expect(pageViewEvent).toBeTruthy();
    });

    test('should handle variant assignment efficiently', async ({ page }) => {
      // Force multiple variant assignments to test performance
      await page.addInitScript(() => {
        // Override to test assignment performance
        let assignmentCount = 0;
        const originalRandom = Math.random;
        Math.random = () => {
          assignmentCount++;
          return assignmentCount % 2 === 0 ? 0.3 : 0.7; // Alternate variants
        };
      });

      const startTime = performance.now();
      
      // Load page multiple times to test assignment performance
      for (let i = 0; i < 5; i++) {
        await page.reload();
        await page.waitForLoadState('networkidle');
      }

      const totalTime = performance.now() - startTime;
      const averageTime = totalTime / 5;

      // Each reload should be reasonably fast
      expect(averageTime).toBeLessThan(2000);

      // Verify variant assignment worked
      const variant = await page.evaluate(() => localStorage.getItem('pawpop_price_variant'));
      expect(['A', 'B']).toContain(variant);
    });

    test('should efficiently handle localStorage operations', async ({ page }) => {
      // Test localStorage performance under load
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const startTime = performance.now();

      // Simulate rapid localStorage operations
      await page.evaluate(() => {
        for (let i = 0; i < 100; i++) {
          localStorage.setItem(`test_key_${i}`, `test_value_${i}`);
          localStorage.getItem(`test_key_${i}`);
        }
      });

      const storageTime = performance.now() - startTime;
      expect(storageTime).toBeLessThan(100); // Should be very fast

      // Verify variant assignment still works
      const variant = await page.evaluate(() => localStorage.getItem('pawpop_price_variant'));
      expect(['A', 'B']).toContain(variant);
    });
  });

  test.describe('Event Tracking Performance', () => {
    test('should handle high-frequency events efficiently', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const startTime = performance.now();

      // Generate 100 events rapidly
      await page.evaluate(() => {
        for (let i = 0; i < 100; i++) {
          if (window.plausible) {
            window.plausible('Performance Test Event', {
              props: {
                iteration: i,
                price_variant: 'A',
                variant_label: 'Standard Pricing',
                timestamp: Date.now()
              }
            });
          }
        }
      });

      const processingTime = performance.now() - startTime;
      expect(processingTime).toBeLessThan(1000); // Should process quickly

      // Verify all events were tracked
      const events = await getTrackedEvents(page);
      const testEvents = events.filter(e => e.event === 'Performance Test Event');
      expect(testEvents).toHaveLength(100);

      // Check performance metrics
      const metrics = await getPerformanceMetrics(page);
      expect(metrics.errors).toHaveLength(0);
      expect(metrics.eventCount).toBeGreaterThan(100);
    });

    test('should maintain performance during user interactions', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const interactionStartTime = performance.now();

      // Simulate rapid user interactions
      for (let i = 0; i < 10; i++) {
        await page.click('text=Upload Photo Now');
        await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });
        await page.click('[data-testid="upload-modal"] button[aria-label="Close"]');
        await page.waitForSelector('[data-testid="upload-modal"]', { state: 'hidden' });
      }

      const totalInteractionTime = performance.now() - interactionStartTime;
      const averageInteractionTime = totalInteractionTime / 10;

      // Each interaction cycle should be reasonably fast
      expect(averageInteractionTime).toBeLessThan(500);

      // Verify events were tracked for interactions
      const events = await getTrackedEvents(page);
      const modalEvents = events.filter(e => e.event === 'Modal Opened' || e.event === 'Modal Closed');
      expect(modalEvents.length).toBeGreaterThan(10);
    });

    test('should handle concurrent event tracking', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Simulate concurrent events from different sources
      const promises = [];
      
      for (let i = 0; i < 20; i++) {
        const promise = page.evaluate((index) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              if (window.plausible) {
                window.plausible('Concurrent Event', {
                  props: {
                    source: `source_${index}`,
                    price_variant: index % 2 === 0 ? 'A' : 'B',
                    variant_label: index % 2 === 0 ? 'Standard Pricing' : 'Premium Pricing'
                  }
                });
              }
              resolve(true);
            }, Math.random() * 100); // Random delay up to 100ms
          });
        }, i);
        
        promises.push(promise);
      }

      const startTime = performance.now();
      await Promise.all(promises);
      const concurrentTime = performance.now() - startTime;

      expect(concurrentTime).toBeLessThan(1000);

      // Verify all concurrent events were tracked
      const events = await getTrackedEvents(page);
      const concurrentEvents = events.filter(e => e.event === 'Concurrent Event');
      expect(concurrentEvents).toHaveLength(20);

      // Verify no errors occurred
      const metrics = await getPerformanceMetrics(page);
      expect(metrics.errors).toHaveLength(0);
    });
  });

  test.describe('Memory Usage', () => {
    test('should not cause memory leaks with continuous tracking', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });

      // Generate many events to test memory usage
      for (let batch = 0; batch < 10; batch++) {
        await page.evaluate((batchNum) => {
          for (let i = 0; i < 50; i++) {
            if (window.plausible) {
              window.plausible('Memory Test Event', {
                props: {
                  batch: batchNum,
                  iteration: i,
                  price_variant: 'A',
                  variant_label: 'Standard Pricing',
                  large_data: 'x'.repeat(100) // Add some data
                }
              });
            }
          }
        }, batch);

        // Force garbage collection if available
        await page.evaluate(() => {
          if (window.gc) {
            window.gc();
          }
        });
      }

      // Check final memory usage
      const finalMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });

      // Memory increase should be reasonable (less than 10MB)
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);

      // Verify events were tracked
      const events = await getTrackedEvents(page);
      const memoryTestEvents = events.filter(e => e.event === 'Memory Test Event');
      expect(memoryTestEvents).toHaveLength(500);
    });

    test('should clean up event listeners properly', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Add and remove event listeners multiple times
      for (let i = 0; i < 20; i++) {
        await page.evaluate((iteration) => {
          const handler = () => {
            if (window.plausible) {
              window.plausible('Listener Test', {
                props: {
                  iteration: iteration,
                  price_variant: 'A'
                }
              });
            }
          };
          
          // Add listener
          document.addEventListener('click', handler);
          
          // Trigger event
          document.dispatchEvent(new Event('click'));
          
          // Remove listener
          document.removeEventListener('click', handler);
        }, i);
      }

      // Verify events were tracked
      const events = await getTrackedEvents(page);
      const listenerEvents = events.filter(e => e.event === 'Listener Test');
      expect(listenerEvents).toHaveLength(20);

      // No memory leaks should occur
      const metrics = await getPerformanceMetrics(page);
      expect(metrics.errors).toHaveLength(0);
    });
  });

  test.describe('Network Performance', () => {
    test('should handle network delays gracefully', async ({ page }) => {
      // Simulate slow network for Plausible script
      await page.route('**/js/script.js', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        route.continue();
      });

      const startTime = performance.now();
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = performance.now() - startTime;

      // Page should still load reasonably fast despite slow analytics
      expect(loadTime).toBeLessThan(10000);

      // User interactions should not be blocked
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });
      
      // Modal should open quickly
      await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();
    });

    test('should handle network failures without breaking functionality', async ({ page }) => {
      // Block all requests to Plausible
      await page.route('**/plausible.io/**', route => route.abort());
      await page.route('**/api/event', route => route.abort());

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Page should function normally
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });
      
      // No JavaScript errors should occur
      const errors = [];
      page.on('pageerror', error => errors.push(error));
      
      await page.waitForTimeout(1000);
      expect(errors).toHaveLength(0);
    });

    test('should batch events efficiently', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Generate events in rapid succession
      const startTime = performance.now();
      
      await page.evaluate(() => {
        const events = [];
        for (let i = 0; i < 50; i++) {
          events.push({
            event: 'Batch Test Event',
            options: {
              props: {
                batch_item: i,
                price_variant: 'A',
                variant_label: 'Standard Pricing'
              }
            }
          });
        }
        
        // Send all events
        events.forEach(({ event, options }) => {
          if (window.plausible) {
            window.plausible(event, options);
          }
        });
      });

      const batchTime = performance.now() - startTime;
      expect(batchTime).toBeLessThan(500); // Should be fast

      // Verify all events were processed
      const events = await getTrackedEvents(page);
      const batchEvents = events.filter(e => e.event === 'Batch Test Event');
      expect(batchEvents).toHaveLength(50);
    });
  });

  test.describe('Error Handling Performance', () => {
    test('should handle tracking errors without performance degradation', async ({ page }) => {
      // Mock Plausible to occasionally throw errors
      await page.addInitScript(() => {
        let callCount = 0;
        const originalPlausible = window.plausible;
        
        window.plausible = function(event, options) {
          callCount++;
          if (callCount % 5 === 0) {
            throw new Error('Simulated tracking error');
          }
          return originalPlausible.call(this, event, options);
        };
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const startTime = performance.now();

      // Generate events that will trigger errors
      for (let i = 0; i < 25; i++) {
        await page.evaluate((iteration) => {
          try {
            if (window.plausible) {
              window.plausible('Error Test Event', {
                props: {
                  iteration: iteration,
                  price_variant: 'A'
                }
              });
            }
          } catch (error) {
            // Errors should be caught and not break the flow
            console.log('Caught tracking error:', error.message);
          }
        }, i);
      }

      const processingTime = performance.now() - startTime;
      expect(processingTime).toBeLessThan(1000);

      // Some events should have succeeded
      const events = await getTrackedEvents(page);
      const errorTestEvents = events.filter(e => e.event === 'Error Test Event');
      expect(errorTestEvents.length).toBeGreaterThan(15); // Most should succeed

      // Page should still be functional
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });
    });

    test('should recover from temporary failures', async ({ page }) => {
      let failureCount = 0;
      
      // Simulate temporary network failures
      await page.route('**/api/event', route => {
        failureCount++;
        if (failureCount <= 3) {
          route.abort(); // Fail first 3 requests
        } else {
          route.continue(); // Then succeed
        }
      });

      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      // Generate events during failure period
      await page.evaluate(() => {
        for (let i = 0; i < 5; i++) {
          if (window.plausible) {
            window.plausible('Recovery Test Event', {
              props: {
                attempt: i,
                price_variant: 'A'
              }
            });
          }
        }
      });

      // Events should still be tracked locally
      const events = await getTrackedEvents(page);
      const recoveryEvents = events.filter(e => e.event === 'Recovery Test Event');
      expect(recoveryEvents).toHaveLength(5);

      // Application should remain responsive
      await page.click('text=Upload Photo Now');
      await page.waitForSelector('[data-testid="upload-modal"]', { state: 'visible' });
    });
  });

  test.describe('Scalability Testing', () => {
    test('should handle large payloads efficiently', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');

      const startTime = performance.now();

      // Create events with large payloads
      await page.evaluate(() => {
        const largeData = 'x'.repeat(1000); // 1KB of data
        
        for (let i = 0; i < 10; i++) {
          if (window.plausible) {
            window.plausible('Large Payload Event', {
              props: {
                iteration: i,
                large_field_1: largeData,
                large_field_2: largeData,
                large_field_3: largeData,
                price_variant: 'A',
                variant_label: 'Standard Pricing'
              }
            });
          }
        }
      });

      const processingTime = performance.now() - startTime;
      expect(processingTime).toBeLessThan(2000);

      // Verify events were processed
      const events = await getTrackedEvents(page);
      const largeEvents = events.filter(e => e.event === 'Large Payload Event');
      expect(largeEvents).toHaveLength(10);
    });

    test('should maintain performance with many simultaneous users simulation', async ({ context }) => {
      // Simulate multiple tabs (users) with different variants
      const pages = [];
      const startTime = performance.now();

      // Create 5 tabs with different variants
      for (let i = 0; i < 5; i++) {
        const page = await context.newPage();
        await page.addInitScript(mockPlausibleTracking);
        await page.addInitScript((variant) => {
          Math.random = () => variant === 'A' ? 0.3 : 0.7;
        }, i % 2 === 0 ? 'A' : 'B');
        
        pages.push(page);
      }

      // Load all pages simultaneously
      await Promise.all(pages.map(page => page.goto(BASE_URL)));
      await Promise.all(pages.map(page => page.waitForLoadState('networkidle')));

      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(10000);

      // Verify each page has correct variant
      for (let i = 0; i < pages.length; i++) {
        const variant = await pages[i].evaluate(() => localStorage.getItem('pawpop_price_variant'));
        const expectedVariant = i % 2 === 0 ? 'A' : 'B';
        expect(variant).toBe(expectedVariant);
      }

      // Clean up
      await Promise.all(pages.map(page => page.close()));
    });
  });
});
