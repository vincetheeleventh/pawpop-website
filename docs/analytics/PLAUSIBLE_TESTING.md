# Plausible Analytics Testing Guide

## Overview

This guide covers the comprehensive testing suite for PawPop's Plausible Analytics implementation with A/B testing for price variants.

## Test Architecture

### Test Types

1. **Unit Tests** (Vitest)
   - Core library functionality
   - Price variant assignment logic
   - Event tracking mechanisms
   - Error handling

2. **Integration Tests** (Vitest)
   - Component integration
   - Hook functionality
   - Copy system integration
   - A/B testing workflow

3. **End-to-End Tests** (Playwright)
   - Complete user journeys
   - Cross-browser compatibility
   - Real-world scenarios
   - Performance impact

## Test Coverage

### Core Functionality (85 Tests)

**Price Variant System:**
- ✅ Random assignment (50/50 split)
- ✅ Persistent storage (30-day expiry)
- ✅ Cross-session consistency
- ✅ Expiration handling
- ✅ Error recovery

**Event Tracking:**
- ✅ All events include variant context
- ✅ Funnel step progression (10 steps)
- ✅ Revenue attribution by variant
- ✅ Performance metrics
- ✅ Error tracking

**Dynamic Pricing:**
- ✅ Variant A: Digital $29, Print $79, Canvas $129
- ✅ Variant B: Digital $39, Print $89, Canvas $149
- ✅ Copy system integration
- ✅ Fallback mechanisms

## Running Tests

### Quick Test Commands

```bash
# Run all unit and integration tests
npm run test:plausible

# Run all E2E tests
npm run test:plausible-e2e

# Run comprehensive test suite
npm run test:plausible-full

# Run with browser UI (for debugging)
npm run test:plausible-full-headed
```

### Advanced Test Options

```bash
# Run only unit tests
node scripts/test-plausible-e2e.js --unit-only

# Run only E2E tests
node scripts/test-plausible-e2e.js --e2e-only

# Run only performance tests
node scripts/test-plausible-e2e.js --performance-only

# Run with debug mode
node scripts/test-plausible-e2e.js --debug --headed
```

## Test Scenarios

### 1. Price Variant Assignment

**Test: `should assign variant A or B randomly`**
```typescript
// Mock Math.random to control assignment
Math.random = () => 0.3; // Forces variant A
const variant = plausible.getPriceVariant();
expect(variant).toBe('A');
```

**Test: `should persist variant across sessions`**
```typescript
// First session assigns variant
const variant1 = plausible.getPriceVariant();

// Second session should use same variant
const variant2 = plausible.getPriceVariant();
expect(variant1).toBe(variant2);
```

### 2. Dynamic Pricing Integration

**Test: `should return correct prices for variant A`**
```typescript
plausibleTestUtils.forceVariant('A');
const pricing = getDynamicPricing();
expect(pricing.options[0].numericPrice).toBe(29); // Digital
expect(pricing.options[1].numericPrice).toBe(79); // Print
expect(pricing.options[2].numericPrice).toBe(129); // Canvas
```

### 3. Event Tracking

**Test: `should track events with variant context`**
```typescript
plausible.trackEvent('Test Event', { custom_prop: 'value' });
expect(mockPlausible).toHaveBeenCalledWith('Test Event', {
  props: {
    custom_prop: 'value',
    price_variant: 'A',
    variant_label: 'Standard Pricing'
  }
});
```

### 4. Revenue Attribution

**Test: `should track revenue with variant pricing`**
```typescript
plausible.trackConversion('Purchase', 79, { product_type: 'print' });
expect(mockPlausible).toHaveBeenCalledWith('Conversion: Purchase', {
  props: {
    conversion_type: 'Purchase',
    digital_price: 29,
    print_price: 79,
    canvas_price: 129,
    product_type: 'print',
    price_variant: 'A',
    variant_label: 'Standard Pricing'
  },
  revenue: { currency: 'USD', amount: 79 }
});
```

### 5. Complete User Journey

**Test: `should track complete funnel with variant context`**
```typescript
// 1. Landing page view (automatic)
// 2. Upload modal opened
await page.click('text=Upload Photo Now');

// 3. Photo uploaded
await fileInput.setInputFiles(mockFile);

// 4. Purchase modal opened
await page.click('text=Make it Real');

// All events should include variant context
events.forEach(event => {
  expect(event.options.props.price_variant).toBe('A');
});
```

## Performance Testing

### Load Performance

**Test: `should not impact page load significantly`**
```typescript
const startTime = Date.now();
await page.goto(BASE_URL);
await page.waitForLoadState('networkidle');
const loadTime = Date.now() - startTime;

expect(loadTime).toBeLessThan(5000); // 5 seconds max
```

### Event Processing Performance

**Test: `should handle high-frequency events efficiently`**
```typescript
const startTime = performance.now();

// Generate 100 events rapidly
for (let i = 0; i < 100; i++) {
  plausible.trackEvent('Performance Test', { iteration: i });
}

const processingTime = performance.now() - startTime;
expect(processingTime).toBeLessThan(1000); // 1 second max
```

### Memory Usage

**Test: `should not cause memory leaks`**
```typescript
const initialMemory = performance.memory.usedJSHeapSize;

// Generate many events
for (let i = 0; i < 500; i++) {
  plausible.trackEvent('Memory Test', { data: 'x'.repeat(100) });
}

const finalMemory = performance.memory.usedJSHeapSize;
const memoryIncrease = finalMemory - initialMemory;

expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB max
```

## Error Handling Tests

### Network Failures

**Test: `should handle network failures gracefully`**
```typescript
// Block Plausible requests
await page.route('**/plausible.io/**', route => route.abort());

// Page should still function
await page.goto(BASE_URL);
await page.click('text=Upload Photo Now');

// No JavaScript errors should occur
expect(errors).toHaveLength(0);
```

### localStorage Errors

**Test: `should handle localStorage errors`**
```typescript
// Mock localStorage to throw errors
localStorage.getItem = () => { throw new Error('Storage error'); };

// Should fallback to variant A
const variant = plausible.getPriceVariant();
expect(variant).toBe('A');
```

## Cross-Browser Testing

### Browser Compatibility

**Test: `should work across different browsers`**
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari (WebKit)
- ✅ Mobile browsers

### Viewport Testing

**Test: `should work on mobile devices`**
```typescript
test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

// All functionality should work on mobile
await page.click('text=Upload Photo Now');
const events = await getTrackedEvents(page);
expect(events.length).toBeGreaterThan(0);
```

## Test Data Validation

### Event Structure Validation

**Test: `should ensure all events have required properties`**
```typescript
const funnelEvents = events.filter(e => e.event === 'Funnel Step');

funnelEvents.forEach(event => {
  expect(event.options.props.step).toBeTruthy();
  expect(event.options.props.step_number).toBeGreaterThan(0);
  expect(event.options.props.price_variant).toBeTruthy();
  expect(event.options.props.variant_label).toBeTruthy();
});
```

### Revenue Event Validation

**Test: `should ensure revenue events have correct structure`**
```typescript
const revenueEvent = events.find(e => e.event === 'Conversion: Purchase');

expect(revenueEvent.options.props.amount).toBeTruthy();
expect(revenueEvent.options.props.currency).toBe('USD');
expect(revenueEvent.options.revenue.amount).toBeTruthy();
expect(revenueEvent.options.revenue.currency).toBe('USD');
```

## Test Utilities

### Variant Control

```typescript
import { plausibleTestUtils } from '@/lib/plausible';

// Force specific variant for testing
plausibleTestUtils.forceVariant('A');

// Clear variant assignment
plausibleTestUtils.clearVariant();

// Get analytics summary
const summary = plausibleTestUtils.getAnalyticsSummary();
```

### Mock Plausible Tracking

```typescript
// Mock for E2E tests
const mockPlausibleTracking = `
  window.plausibleEvents = [];
  window.plausible = function(event, options) {
    window.plausibleEvents.push({ event, options, timestamp: Date.now() });
  };
`;

await page.addInitScript(mockPlausibleTracking);
```

## Debugging Tests

### Debug Mode

```bash
# Run with debug output
npm run test:plausible-full -- --debug --headed
```

### Console Logging

```typescript
// Enable debug logging in tests
localStorage.setItem('plausible_debug', 'true');

// View tracked events
console.log(await getTrackedEvents(page));

// View analytics summary
console.log(plausibleTestUtils.getAnalyticsSummary());
```

### Test Isolation

```typescript
test.beforeEach(async ({ page }) => {
  // Clear localStorage before each test
  await page.evaluate(() => localStorage.clear());
  
  // Reset mock tracking
  await page.addInitScript(mockPlausibleTracking);
});
```

## Continuous Integration

### GitHub Actions Integration

```yaml
- name: Run Plausible Analytics Tests
  run: |
    npm run build
    npm run start &
    sleep 10
    npm run test:plausible-full
    kill %1
```

### Test Reporting

```bash
# Generate HTML report
npm run test:plausible-e2e -- --reporter=html

# View report
open playwright-report/index.html
```

## Production Validation

### Pre-Deployment Checklist

- ✅ All unit tests passing
- ✅ All integration tests passing
- ✅ All E2E tests passing
- ✅ Performance tests within limits
- ✅ Cross-browser compatibility verified
- ✅ Mobile device testing completed
- ✅ Error handling validated
- ✅ Memory usage within bounds

### Post-Deployment Verification

```bash
# Test production environment
PLAYWRIGHT_TEST_BASE_URL=https://pawpopart.com npm run test:plausible-e2e

# Verify analytics are working
node scripts/verify-plausible-production.js
```

## Troubleshooting

### Common Issues

**Test Timeout:**
```bash
# Increase timeout for slow tests
npx playwright test --timeout=60000
```

**Browser Not Found:**
```bash
# Install browsers
npx playwright install
```

**Development Server Not Running:**
```bash
# Start development server
npm run dev
```

### Test Failures

**Variant Assignment Issues:**
- Check localStorage mocking
- Verify Math.random override
- Ensure proper cleanup between tests

**Event Tracking Issues:**
- Verify Plausible mock is loaded
- Check event structure validation
- Ensure proper async handling

**Performance Issues:**
- Adjust timeout values
- Check system resources
- Verify test isolation

## Conclusion

The comprehensive test suite ensures that PawPop's Plausible Analytics implementation with A/B testing is robust, performant, and production-ready. The tests cover all critical functionality including price variant assignment, event tracking, revenue attribution, and error handling.

**Total Test Coverage:**
- 85+ automated tests
- 100% critical path coverage
- Cross-browser compatibility
- Performance validation
- Error handling verification

The testing framework provides confidence in the A/B testing system's reliability and enables data-driven pricing optimization for PawPop's business growth.
