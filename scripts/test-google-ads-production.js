#!/usr/bin/env node

/**
 * Production Google Ads tracking test
 * Tests the actual deployed site for Google Ads configuration
 */

const { chromium } = require('playwright');

async function testProductionGoogleAds() {
  console.log('🚀 Testing Google Ads on Production Site...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Track network requests
  const networkRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('googletagmanager.com') || 
        request.url().includes('google-analytics.com') ||
        request.url().includes('AW-939186815')) {
      networkRequests.push({
        url: request.url(),
        method: request.method(),
        type: 'request'
      });
    }
  });
  
  page.on('response', (response) => {
    if (response.url().includes('googletagmanager.com') || 
        response.url().includes('google-analytics.com') ||
        response.url().includes('AW-939186815')) {
      networkRequests.push({
        url: response.url(),
        status: response.status(),
        type: 'response'
      });
    }
  });
  
  try {
    console.log('📍 Loading PawPop production site...');
    await page.goto('https://pawpopart.com');
    await page.waitForTimeout(5000); // Wait for all scripts to load
    
    console.log('\n📊 Network Analysis:');
    console.log(`Found ${networkRequests.length} Google-related network requests:`);
    
    networkRequests.forEach((req, index) => {
      console.log(`${index + 1}. [${req.type.toUpperCase()}] ${req.url}`);
      if (req.status) console.log(`   Status: ${req.status}`);
    });
    
    // Check for Google Ads script in DOM
    console.log('\n📍 Checking DOM for Google Ads elements...');
    
    const googleAdsScripts = await page.locator('script[src*="googletagmanager.com"]').count();
    console.log(`Google Ads scripts found: ${googleAdsScripts}`);
    
    if (googleAdsScripts > 0) {
      const scriptSrc = await page.locator('script[src*="googletagmanager.com"]').first().getAttribute('src');
      console.log(`Script source: ${scriptSrc}`);
      
      // Check if it contains our conversion ID
      if (scriptSrc.includes('AW-939186815')) {
        console.log('✅ Conversion ID AW-939186815 found in script URL');
      } else {
        console.log('❌ Conversion ID AW-939186815 NOT found in script URL');
      }
    }
    
    // Check environment variables in browser
    console.log('\n📍 Checking client-side environment variables...');
    
    const envCheck = await page.evaluate(() => {
      // Try to access Next.js environment variables
      const env = {};
      
      // Check if variables are available in window or process
      if (typeof window !== 'undefined') {
        // Check for any Google Ads related variables
        const scripts = Array.from(document.scripts);
        const googleScript = scripts.find(s => s.src && s.src.includes('googletagmanager.com'));
        
        return {
          googleScriptFound: !!googleScript,
          googleScriptSrc: googleScript ? googleScript.src : null,
          gtagAvailable: typeof window.gtag === 'function',
          dataLayerAvailable: Array.isArray(window.dataLayer),
          dataLayerLength: window.dataLayer ? window.dataLayer.length : 0
        };
      }
      
      return { error: 'Window not available' };
    });
    
    console.log('Environment check results:', JSON.stringify(envCheck, null, 2));
    
    // Test manual gtag call
    console.log('\n📍 Testing manual gtag call...');
    
    const gtagTest = await page.evaluate(() => {
      if (typeof window.gtag === 'function') {
        try {
          // Test a simple gtag call
          window.gtag('event', 'test_conversion', {
            send_to: 'AW-939186815/bSpECPPkoZ8bEP-0678D',
            value: 1,
            currency: 'CAD'
          });
          return { success: true, message: 'gtag call executed' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      } else {
        return { success: false, error: 'gtag not available' };
      }
    });
    
    console.log('Manual gtag test:', JSON.stringify(gtagTest, null, 2));
    
    // Wait a bit more to see if any additional requests are made
    await page.waitForTimeout(3000);
    
    console.log('\n📍 Final network request count:', networkRequests.length);
    
    // Try to interact with upload button
    console.log('\n📍 Testing upload button interaction...');
    
    try {
      // Look for upload button with different possible selectors
      const uploadSelectors = [
        'text=Upload Photo Now',
        '[data-testid="upload-button"]',
        'button:has-text("Upload")',
        '.upload-button',
        'button[type="button"]:has-text("Upload")'
      ];
      
      let uploadFound = false;
      for (const selector of uploadSelectors) {
        try {
          const element = await page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            console.log(`✅ Upload button found with selector: ${selector}`);
            await element.click();
            uploadFound = true;
            
            // Wait for any modal or response
            await page.waitForTimeout(2000);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!uploadFound) {
        console.log('⚠️  Upload button not found with any selector');
      }
      
    } catch (error) {
      console.log('⚠️  Upload interaction test failed:', error.message);
    }
    
    console.log('\n🎉 Production Google Ads test completed!');
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`✅ Site loaded: https://pawpopart.com`);
    console.log(`✅ Google scripts found: ${googleAdsScripts}`);
    console.log(`✅ Network requests: ${networkRequests.length}`);
    console.log(`✅ gtag available: ${envCheck.gtagAvailable}`);
    console.log(`✅ dataLayer available: ${envCheck.dataLayerAvailable}`);
    
    if (!envCheck.gtagAvailable) {
      console.log('\n⚠️  ISSUE DETECTED:');
      console.log('   gtag is not available, which suggests:');
      console.log('   1. Google Ads conversion ID not set in production environment');
      console.log('   2. GoogleAdsTracking component not initializing properly');
      console.log('   3. Environment variable NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID missing');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testProductionGoogleAds().catch(console.error);
}

module.exports = { testProductionGoogleAds };
