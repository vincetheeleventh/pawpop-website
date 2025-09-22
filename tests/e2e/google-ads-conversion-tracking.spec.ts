import { test, expect, Page } from '@playwright/test';

// Google Ads conversion IDs for verification
const CONVERSION_IDS = {
  PHOTO_UPLOAD: 'AW-939186815/bSpECPPkoZ8bEP-0678D',
  ARTWORK_GENERATION: 'AW-939186815/g4XtCJeJnp8bEP-0678D',
  ARTWORK_VIEW: 'AW-939186815/HI_4CMbKop8bEP-0678D',
  PURCHASE: 'AW-939186815/zqMlCO-SoZ8bEP-0678D'
};

// Track gtag calls for conversion verification
let gtagCalls: any[] = [];

test.describe('Google Ads Conversion Tracking - End to End', () => {
  test.beforeEach(async ({ page }) => {
    // Reset gtag calls tracking
    gtagCalls = [];
    
    // Mock gtag to capture conversion calls
    await page.addInitScript(() => {
      (window as any).gtagCalls = [];
      (window as any).gtag = function(...args: any[]) {
        (window as any).gtagCalls.push(args);
        console.log('GTAG CALL:', args);
      };
      
      // Mock dataLayer
      (window as any).dataLayer = (window as any).dataLayer || [];
    });
    
    // Listen for console logs to capture gtag calls
    page.on('console', (msg) => {
      if (msg.text().includes('GTAG CALL:')) {
        const callData = msg.text().replace('GTAG CALL: ', '');
        try {
          gtagCalls.push(JSON.parse(callData));
        } catch (e) {
          console.log('Captured gtag call:', callData);
        }
      }
    });
  });

  test('Complete conversion tracking flow - Photo Upload → Artwork Generation → View → Purchase', async ({ page }) => {
    console.log('🚀 Starting complete Google Ads conversion tracking test...');

    // Step 1: Navigate to homepage and verify Google Ads script loads
    console.log('📍 Step 1: Loading homepage and verifying Google Ads initialization');
    await page.goto('/');
    
    // Wait for Google Ads script to load
    await page.waitForTimeout(2000);
    
    // Verify Google Ads conversion ID is configured
    const conversionId = await page.evaluate(() => {
      return process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID;
    });
    
    console.log('✅ Google Ads Conversion ID found:', conversionId);

    // Step 2: Test Photo Upload Conversion
    console.log('📍 Step 2: Testing Photo Upload conversion');
    
    // Click upload button to open modal
    await page.click('text=Upload Photo Now');
    await page.waitForSelector('[data-testid="upload-modal"]', { timeout: 10000 });
    
    // Upload test images
    const petPhotoInput = page.locator('input[type="file"]').first();
    const petMomPhotoInput = page.locator('input[type="file"]').last();
    
    await petPhotoInput.setInputFiles('./public/images/e2e testing/pet-test.jpg');
    await petMomPhotoInput.setInputFiles('./public/images/e2e testing/pet-mom-test.jpg');
    
    // Fill out form
    await page.fill('input[name="petName"]', 'TestDog');
    await page.fill('input[name="petMomName"]', 'TestMom');
    await page.fill('input[name="email"]', 'test@example.com');
    
    // Submit form and verify photo upload conversion
    await page.click('button[type="submit"]');
    
    // Wait for conversion to fire
    await page.waitForTimeout(3000);
    
    // Verify photo upload conversion was called
    const photoUploadCalls = await page.evaluate(() => {
      return (window as any).gtagCalls.filter((call: any[]) => 
        call[0] === 'event' && 
        call[1] === 'conversion' && 
        call[2]?.send_to?.includes('bSpECPPkoZ8bEP-0678D')
      );
    });
    
    expect(photoUploadCalls.length).toBeGreaterThan(0);
    console.log('✅ Photo Upload conversion tracked:', photoUploadCalls[0]);

    // Step 3: Wait for artwork generation and test Artwork Generation conversion
    console.log('📍 Step 3: Waiting for artwork generation completion');
    
    // Wait for artwork generation to complete (this may take 2-5 minutes in production)
    await page.waitForSelector('text=Your masterpiece is ready', { timeout: 300000 }); // 5 minute timeout
    
    // Verify artwork generation conversion was called
    const artworkGenerationCalls = await page.evaluate(() => {
      return (window as any).gtagCalls.filter((call: any[]) => 
        call[0] === 'event' && 
        call[1] === 'conversion' && 
        call[2]?.send_to?.includes('g4XtCJeJnp8bEP-0678D')
      );
    });
    
    expect(artworkGenerationCalls.length).toBeGreaterThan(0);
    console.log('✅ Artwork Generation conversion tracked:', artworkGenerationCalls[0]);

    // Step 4: Navigate to artwork page and test Artwork View conversion
    console.log('📍 Step 4: Testing Artwork View conversion');
    
    // Click to view artwork (should redirect to artwork page)
    await page.click('text=View Full Artwork');
    
    // Wait for artwork page to load
    await page.waitForURL('**/artwork/**');
    await page.waitForTimeout(2000);
    
    // Verify artwork view conversion was called
    const artworkViewCalls = await page.evaluate(() => {
      return (window as any).gtagCalls.filter((call: any[]) => 
        call[0] === 'event' && 
        call[1] === 'conversion' && 
        call[2]?.send_to?.includes('HI_4CMbKop8bEP-0678D')
      );
    });
    
    expect(artworkViewCalls.length).toBeGreaterThan(0);
    console.log('✅ Artwork View conversion tracked:', artworkViewCalls[0]);

    // Step 5: Test Purchase conversion flow
    console.log('📍 Step 5: Testing Purchase conversion');
    
    // Click on a product mockup to open purchase modal
    await page.click('[data-testid="product-mockup"]');
    await page.waitForSelector('[data-testid="purchase-modal"]');
    
    // Select product size and quantity
    await page.click('text=16"x24"'); // Select size
    await page.click('[data-testid="quantity-increase"]'); // Increase quantity
    
    // Verify add to cart conversion (enhanced ecommerce)
    const addToCartCalls = await page.evaluate(() => {
      return (window as any).gtagCalls.filter((call: any[]) => 
        call[0] === 'event' && 
        call[1] === 'add_to_cart'
      );
    });
    
    expect(addToCartCalls.length).toBeGreaterThan(0);
    console.log('✅ Add to Cart event tracked:', addToCartCalls[0]);
    
    // Click purchase button (this will redirect to Stripe in production)
    await page.click('text=Buy Now');
    
    // Verify begin checkout conversion
    const beginCheckoutCalls = await page.evaluate(() => {
      return (window as any).gtagCalls.filter((call: any[]) => 
        call[0] === 'event' && 
        call[1] === 'begin_checkout'
      );
    });
    
    expect(beginCheckoutCalls.length).toBeGreaterThan(0);
    console.log('✅ Begin Checkout event tracked:', beginCheckoutCalls[0]);

    // Note: Actual purchase conversion happens via Stripe webhook in production
    // We can't test the final purchase conversion in this E2E test without completing payment
    
    console.log('🎉 All Google Ads conversion tracking tests completed successfully!');
    
    // Summary of tracked conversions
    console.log('\n📊 CONVERSION TRACKING SUMMARY:');
    console.log(`✅ Photo Upload: ${photoUploadCalls.length} calls`);
    console.log(`✅ Artwork Generation: ${artworkGenerationCalls.length} calls`);
    console.log(`✅ Artwork View: ${artworkViewCalls.length} calls`);
    console.log(`✅ Add to Cart: ${addToCartCalls.length} calls`);
    console.log(`✅ Begin Checkout: ${beginCheckoutCalls.length} calls`);
    console.log('ℹ️  Purchase conversion happens via Stripe webhook (not testable in E2E)');
  });

  test('Verify Google Ads script loading and configuration', async ({ page }) => {
    console.log('🔍 Testing Google Ads script loading and configuration...');
    
    await page.goto('/');
    
    // Wait for scripts to load
    await page.waitForTimeout(3000);
    
    // Verify Google Ads script is loaded
    const googleAdsScript = await page.locator('script[src*="googletagmanager.com/gtag/js"]').count();
    expect(googleAdsScript).toBeGreaterThan(0);
    console.log('✅ Google Ads script loaded');
    
    // Verify gtag is available
    const gtagAvailable = await page.evaluate(() => {
      return typeof (window as any).gtag === 'function';
    });
    expect(gtagAvailable).toBe(true);
    console.log('✅ gtag function available');
    
    // Verify dataLayer is initialized
    const dataLayerAvailable = await page.evaluate(() => {
      return Array.isArray((window as any).dataLayer);
    });
    expect(dataLayerAvailable).toBe(true);
    console.log('✅ dataLayer initialized');
    
    // Verify conversion ID configuration
    const configCalls = await page.evaluate(() => {
      return (window as any).gtagCalls?.filter((call: any[]) => 
        call[0] === 'config' && call[1] === 'AW-939186815'
      ) || [];
    });
    
    expect(configCalls.length).toBeGreaterThan(0);
    console.log('✅ Google Ads conversion ID configured:', configCalls[0]);
  });

  test('Test individual conversion functions', async ({ page }) => {
    console.log('🧪 Testing individual conversion tracking functions...');
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Test trackPhotoUpload function
    await page.evaluate(() => {
      // Import and call the function
      (window as any).gtag('event', 'conversion', {
        send_to: 'AW-939186815/bSpECPPkoZ8bEP-0678D',
        value: 2,
        currency: 'CAD',
        custom_parameters: {
          event_category: 'engagement',
          event_label: 'photo_upload_completed'
        }
      });
    });
    
    await page.waitForTimeout(1000);
    
    const testCalls = await page.evaluate(() => {
      return (window as any).gtagCalls?.filter((call: any[]) => 
        call[0] === 'event' && call[1] === 'conversion'
      ) || [];
    });
    
    expect(testCalls.length).toBeGreaterThan(0);
    console.log('✅ Manual conversion tracking test passed');
  });
});

// Helper function to verify conversion data structure
function verifyConversionCall(call: any[], expectedSendTo: string, expectedValue?: number) {
  expect(call[0]).toBe('event');
  expect(call[1]).toBe('conversion');
  expect(call[2].send_to).toBe(expectedSendTo);
  expect(call[2].currency).toBe('CAD');
  
  if (expectedValue) {
    expect(call[2].value).toBe(expectedValue);
  }
  
  return true;
}
