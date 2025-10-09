#!/usr/bin/env node
/**
 * Test that old artwork records (without upload_deferred field) work
 */

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function testOldArtworkWithoutDeferredField() {
  console.log('🧪 Testing Old Artwork Without upload_deferred Field');
  console.log('====================================================\n');
  
  try {
    // Step 1: Create artwork WITHOUT upload_deferred (simulating old record)
    console.log('1️⃣ Creating old-style artwork (no upload_deferred)...');
    const createResponse = await fetch(`${baseUrl}/api/artwork/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Old User',
        customer_email: 'old-user@example.com',
        price_variant: 'A'
        // NOTE: NOT setting upload_deferred at all
      })
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create artwork');
    }

    const { artwork, access_token } = await createResponse.json();
    console.log(`✅ Old artwork created: ID=${artwork.id}`);
    console.log(`   - upload_deferred: ${artwork.upload_deferred} (should be false or undefined)`);
    console.log(`   - access_token: ${access_token.substring(0, 20)}...`);

    // Step 2: Test that access_token works as upload link
    console.log('\n2️⃣ Testing old email link (using access_token from old system)...');
    const validateResponse = await fetch(`${baseUrl}/api/artwork/by-upload-token?token=${access_token}`);
    
    if (!validateResponse.ok) {
      const error = await validateResponse.json();
      throw new Error(`Validation failed: ${error.error}`);
    }

    const validationData = await validateResponse.json();
    console.log('✅ Old email link WORKS!');
    console.log(`   - Artwork ID: ${validationData.artwork.id}`);
    console.log(`   - Customer: ${validationData.artwork.customer_name}`);
    console.log(`   - upload_deferred: ${validationData.artwork.upload_deferred}`);
    console.log('\n🎉 SUCCESS! Old production email links will work!');
    console.log(`\n📧 Test the page by visiting:`);
    console.log(`   ${baseUrl}/upload/${access_token}`);
    
    return { success: true };

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\n⚠️  This means existing production email links will NOT work!');
    return { success: false };
  }
}

testOldArtworkWithoutDeferredField().then(result => {
  if (!result.success) {
    process.exit(1);
  }
});
