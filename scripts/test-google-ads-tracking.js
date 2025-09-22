#!/usr/bin/env node

/**
 * Quick test script to verify Google Ads conversion tracking setup
 * Tests the basic configuration and conversion ID setup
 */

const { chromium } = require('playwright');

const CONVERSION_IDS = {
  PHOTO_UPLOAD: 'AW-939186815/bSpECPPkoZ8bEP-0678D',
  ARTWORK_GENERATION: 'AW-939186815/g4XtCJeJnp8bEP-0678D',
  ARTWORK_VIEW: 'AW-939186815/HI_4CMbKop8bEP-0678D',
  PURCHASE: 'AW-939186815/zqMlCO-SoZ8bEP-0678D'
};

async function testGoogleAdsTracking() {
  console.log('🚀 Testing Google Ads Conversion Tracking Setup...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  let gtagCalls = [];
  
  // Intercept gtag calls
  await page.addInitScript(() => {
    window.originalGtag = window.gtag;
    window.gtagCalls = [];
    
    window.gtag = function(...args) {
      window.gtagCalls.push(args);
      console.log('GTAG INTERCEPTED:', JSON.stringify(args));
      
      // Call original gtag if it exists
      if (window.originalGtag) {
        window.originalGtag.apply(this, args);
      }
    };
    
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
  });
  
  // Listen for console messages
  page.on('console', (msg) => {
    if (msg.text().includes('GTAG INTERCEPTED:')) {
      try {
        const data = JSON.parse(msg.text().replace('GTAG INTERCEPTED: ', ''));
        gtagCalls.push(data);
      } catch (e) {
        console.log('Console:', msg.text());
      }
    }
  });
  
  try {
    // Test 1: Homepage loads with Google Ads script
    console.log('📍 Test 1: Loading homepage and checking Google Ads initialization...');
    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawpopart.com';
    console.log(`   Testing site: ${siteUrl}`);
    await page.goto(siteUrl);
    await page.waitForTimeout(3000);
    
    // Check if Google Ads script is loaded
    const googleAdsScript = await page.locator('script[src*="googletagmanager.com/gtag/js"]').count();
    if (googleAdsScript > 0) {
      console.log('✅ Google Ads script loaded successfully');
    } else {
      console.log('❌ Google Ads script not found');
    }
    
    // Check if gtag is available
    const gtagAvailable = await page.evaluate(() => typeof window.gtag === 'function');
    if (gtagAvailable) {
      console.log('✅ gtag function is available');
    } else {
      console.log('❌ gtag function not available');
    }
    
    // Check for config calls
    const configCalls = gtagCalls.filter(call => call[0] === 'config');
    if (configCalls.length > 0) {
      console.log('✅ Google Ads config call found:', configCalls[0][1]);
    } else {
      console.log('❌ No Google Ads config calls detected');
    }
    
    console.log('\n📍 Test 2: Testing manual conversion tracking...');
    
    // Test manual conversion call
    await page.evaluate((conversionId) => {
      if (window.gtag) {
        window.gtag('event', 'conversion', {
          send_to: conversionId,
          value: 2,
          currency: 'CAD',
          custom_parameters: {
            test: 'manual_test'
          }
        });
      }
    }, CONVERSION_IDS.PHOTO_UPLOAD);
    
    await page.waitForTimeout(1000);
    
    // Check for conversion calls
    const conversionCalls = gtagCalls.filter(call => 
      call[0] === 'event' && 
      call[1] === 'conversion' && 
      call[2]?.send_to === CONVERSION_IDS.PHOTO_UPLOAD
    );
    
    if (conversionCalls.length > 0) {
      console.log('✅ Manual conversion tracking test passed');
      console.log('   Conversion data:', JSON.stringify(conversionCalls[0][2], null, 2));
    } else {
      console.log('❌ Manual conversion tracking test failed');
    }
    
    console.log('\n📍 Test 3: Testing upload modal interaction...');
    
    // Try to open upload modal
    try {
      await page.click('text=Upload Photo Now', { timeout: 5000 });
      await page.waitForSelector('[data-testid="upload-modal"]', { timeout: 5000 });
      console.log('✅ Upload modal opened successfully');
      
      // Close modal
      await page.keyboard.press('Escape');
      console.log('✅ Upload modal closed');
    } catch (error) {
      console.log('⚠️  Upload modal test skipped (modal not found or different selector)');
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`Total gtag calls intercepted: ${gtagCalls.length}`);
    console.log('Conversion IDs configured:');
    Object.entries(CONVERSION_IDS).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    console.log('\n🎉 Google Ads tracking test completed!');
    
    if (gtagCalls.length > 0) {
      console.log('\n📋 All intercepted gtag calls:');
      gtagCalls.forEach((call, index) => {
        console.log(`${index + 1}. ${call[0]} - ${call[1]} - ${JSON.stringify(call[2] || {})}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testGoogleAdsTracking().catch(console.error);
}

module.exports = { testGoogleAdsTracking };
