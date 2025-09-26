#!/usr/bin/env node

// Test the actual production checkout flow on pawpopart.com

async function testProductionCheckout() {
  console.log('🧪 Testing Production Checkout on pawpopart.com\n');

  try {
    // Test 1: Create session via production API
    console.log('1️⃣ Creating checkout session via production API...');
    
    const response = await fetch('https://www.pawpopart.com/api/checkout/artwork', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        artworkId: 'test-production-123',
        productType: 'digital',
        size: 'digital',
        customerEmail: 'test@example.com',
        customerName: 'Production Test',
        petName: 'TestPet',
        imageUrl: 'https://example.com/test-image.jpg',
        frameUpgrade: false,
        quantity: 1
      })
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API Error Response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Session Created:', data.sessionId);

    // Test 2: Check if the session URL is accessible
    console.log('\n2️⃣ Testing session URL accessibility...');
    const sessionUrl = `https://checkout.stripe.com/c/pay/${data.sessionId}`;
    console.log('Session URL:', sessionUrl);

    // Use curl to test the session URL
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    try {
      const { stdout } = await execPromise(`curl -s -I "${sessionUrl}"`);
      
      if (stdout.includes('HTTP/2 200') || stdout.includes('HTTP/1.1 200')) {
        console.log('✅ Session URL returns 200 OK');
      } else if (stdout.includes('401')) {
        console.log('❌ 401 Unauthorized - Session validation failed');
        console.log('This suggests the session was created with mismatched keys or domain');
      } else if (stdout.includes('404')) {
        console.log('❌ 404 Not Found - Session does not exist');
      } else {
        console.log('⚠️ Unexpected response:', stdout.split('\n')[0]);
      }
    } catch (curlError) {
      console.log('❌ Cannot access session URL:', curlError.message);
    }

    // Test 3: Check environment consistency
    console.log('\n3️⃣ Checking production environment...');
    
    // Test if the production environment has the right base URL
    const testResponse = await fetch('https://www.pawpopart.com/api/test-env', {
      method: 'GET'
    });
    
    if (testResponse.status === 404) {
      console.log('⚠️ No test endpoint available - this is normal');
    }

    console.log('\n🎯 Next Steps:');
    console.log('1. Try the session URL directly in your browser:');
    console.log(`   ${sessionUrl}`);
    console.log('2. If it fails with base64 errors, the issue is in Stripe\'s frontend');
    console.log('3. If it works, the issue is in your site\'s Stripe.js integration');
    console.log('4. Check browser console for specific error messages');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testProductionCheckout();
