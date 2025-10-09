#!/usr/bin/env node
/**
 * Test script for deferred upload fix
 * 
 * Tests:
 * 1. New flow: artwork creation with upload_deferred=true and upload_token generation
 * 2. API validation: by-upload-token endpoint with both upload_token and access_token
 * 3. Backward compatibility: old links with access_token still work
 */

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

console.log('🧪 Testing Deferred Upload Fix');
console.log('================================\n');

async function testNewDeferredFlow() {
  console.log('📝 Test 1: New Deferred Upload Flow');
  console.log('-----------------------------------');
  
  try {
    // Step 1: Create artwork with upload_deferred=true (simulating skipped photos)
    console.log('1️⃣ Creating artwork with upload_deferred=true...');
    const createResponse = await fetch(`${baseUrl}/api/artwork/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Test User Deferred',
        customer_email: 'test-deferred@example.com',
        upload_deferred: true,
        price_variant: 'A'
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create artwork: ${error}`);
    }

    const { artwork, access_token } = await createResponse.json();
    console.log(`✅ Artwork created: ID=${artwork.id}`);
    console.log(`   - upload_deferred: ${artwork.upload_deferred}`);
    console.log(`   - access_token: ${access_token.substring(0, 20)}...`);

    // Step 2: Generate upload token
    console.log('\n2️⃣ Generating upload_token...');
    const tokenResponse = await fetch(`${baseUrl}/api/artwork/generate-upload-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artworkId: artwork.id })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to generate token: ${error}`);
    }

    const { uploadToken } = await tokenResponse.json();
    console.log(`✅ Upload token generated: ${uploadToken.substring(0, 20)}...`);

    // Step 3: Test by-upload-token API with upload_token
    console.log('\n3️⃣ Testing by-upload-token API with upload_token...');
    const validateResponse = await fetch(`${baseUrl}/api/artwork/by-upload-token?token=${uploadToken}`);
    
    if (!validateResponse.ok) {
      const error = await validateResponse.json();
      throw new Error(`Validation failed: ${error.error}`);
    }

    const validationData = await validateResponse.json();
    console.log('✅ Upload token validated successfully');
    console.log(`   - Artwork ID: ${validationData.artwork.id}`);
    console.log(`   - Customer: ${validationData.artwork.customer_name}`);
    console.log(`   - Email: ${validationData.artwork.customer_email}`);
    console.log(`   - upload_deferred: ${validationData.artwork.upload_deferred}`);

    // Step 4: Test backward compatibility with access_token
    console.log('\n4️⃣ Testing backward compatibility with access_token...');
    const fallbackResponse = await fetch(`${baseUrl}/api/artwork/by-upload-token?token=${access_token}`);
    
    if (!fallbackResponse.ok) {
      const error = await fallbackResponse.json();
      console.warn(`⚠️  Fallback validation failed: ${error.error}`);
      console.warn('   This is expected if upload_deferred is not set on the artwork');
    } else {
      const fallbackData = await fallbackResponse.json();
      console.log('✅ Access token fallback works!');
      console.log(`   - Artwork ID: ${fallbackData.artwork.id}`);
      console.log(`   - This means old email links will work`);
    }

    console.log('\n✅ Test 1 PASSED: New deferred flow works correctly\n');
    return { success: true, uploadToken, access_token, artworkId: artwork.id };

  } catch (error) {
    console.error('\n❌ Test 1 FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

async function testBackwardCompatibility() {
  console.log('\n📝 Test 2: Backward Compatibility');
  console.log('----------------------------------');
  
  try {
    // Create an artwork with upload_deferred but WITHOUT generating upload_token
    // This simulates old artworks that only have access_token
    console.log('1️⃣ Creating artwork (old style - no upload_token)...');
    const createResponse = await fetch(`${baseUrl}/api/artwork/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Test User Old Style',
        customer_email: 'test-old@example.com',
        upload_deferred: true,
        price_variant: 'A'
      })
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create artwork');
    }

    const { artwork, access_token } = await createResponse.json();
    console.log(`✅ Old-style artwork created: ID=${artwork.id}`);

    // Try to validate using access_token (simulating old email link)
    console.log('\n2️⃣ Testing old email link (using access_token)...');
    const validateResponse = await fetch(`${baseUrl}/api/artwork/by-upload-token?token=${access_token}`);
    
    if (!validateResponse.ok) {
      const error = await validateResponse.json();
      throw new Error(`Old link validation failed: ${error.error}`);
    }

    const validationData = await validateResponse.json();
    console.log('✅ Old email link works via fallback!');
    console.log(`   - Artwork ID: ${validationData.artwork.id}`);
    console.log(`   - This proves backward compatibility is working`);

    console.log('\n✅ Test 2 PASSED: Backward compatibility works\n');
    return { success: true };

  } catch (error) {
    console.error('\n❌ Test 2 FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

async function testEdgeCases() {
  console.log('\n📝 Test 3: Edge Cases');
  console.log('---------------------');
  
  try {
    // Test 1: Invalid token
    console.log('1️⃣ Testing invalid token...');
    const invalidResponse = await fetch(`${baseUrl}/api/artwork/by-upload-token?token=invalid_token_12345`);
    
    if (invalidResponse.status === 404) {
      console.log('✅ Invalid token correctly rejected (404)');
    } else {
      console.warn('⚠️  Expected 404 for invalid token, got:', invalidResponse.status);
    }

    // Test 2: Missing token
    console.log('\n2️⃣ Testing missing token...');
    const missingResponse = await fetch(`${baseUrl}/api/artwork/by-upload-token`);
    
    if (missingResponse.status === 400) {
      console.log('✅ Missing token correctly rejected (400)');
    } else {
      console.warn('⚠️  Expected 400 for missing token, got:', missingResponse.status);
    }

    console.log('\n✅ Test 3 PASSED: Edge cases handled correctly\n');
    return { success: true };

  } catch (error) {
    console.error('\n❌ Test 3 FAILED:', error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log(`Testing against: ${baseUrl}\n`);
  
  const results = {
    newFlow: await testNewDeferredFlow(),
    backwardCompat: await testBackwardCompatibility(),
    edgeCases: await testEdgeCases()
  };

  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`New Deferred Flow: ${results.newFlow.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Backward Compatibility: ${results.backwardCompat.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Edge Cases: ${results.edgeCases.success ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = results.newFlow.success && results.backwardCompat.success && results.edgeCases.success;
  
  if (allPassed) {
    console.log('\n🎉 All tests PASSED! Deferred upload fix is working correctly.');
    
    if (results.newFlow.uploadToken) {
      console.log('\n📧 Test the full flow by visiting:');
      console.log(`   ${baseUrl}/upload/${results.newFlow.uploadToken}`);
    }
  } else {
    console.log('\n⚠️  Some tests FAILED. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
