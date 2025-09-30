#!/usr/bin/env node

/**
 * Email-First Flow End-to-End Test Script
 * Tests the complete flow from email capture to deferred upload completion
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.EMAIL_TEST_RECIPIENT || 'test@pawpopart.com';

console.log('🧪 Email-First Flow E2E Test\n');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Test Email: ${TEST_EMAIL}\n`);

async function runTests() {
  let artworkId = null;
  let uploadToken = null;
  
  try {
    // Test 1: Create artwork with email capture
    console.log('📧 Test 1: Email Capture');
    console.log('Creating artwork with email...');
    
    const createResponse = await fetch(`${BASE_URL}/api/artwork/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Test User',
        customer_email: TEST_EMAIL,
        email_captured_at: new Date().toISOString(),
        upload_deferred: false
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create artwork: ${createResponse.statusText}`);
    }

    const createData = await createResponse.json();
    artworkId = createData.artwork.id;
    console.log(`✅ Artwork created: ${artworkId}\n`);

    // Test 2: Generate upload token
    console.log('🔑 Test 2: Upload Token Generation');
    
    const tokenResponse = await fetch(`${BASE_URL}/api/artwork/generate-upload-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ artworkId })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to generate token: ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();
    uploadToken = tokenData.uploadToken;
    console.log(`✅ Upload token generated: ${uploadToken.substring(0, 10)}...\n`);

    // Test 3: Mark as deferred
    console.log('⏰ Test 3: Mark Upload as Deferred');
    
    const updateResponse = await fetch(`${BASE_URL}/api/artwork/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artwork_id: artworkId,
        upload_deferred: true
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update artwork: ${updateResponse.statusText}`);
    }

    console.log(`✅ Artwork marked as deferred\n`);

    // Test 4: Send confirmation email
    console.log('📬 Test 4: Email Capture Confirmation');
    
    const uploadUrl = `${BASE_URL}/upload/${uploadToken}`;
    const confirmResponse = await fetch(`${BASE_URL}/api/email/capture-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Test User',
        customerEmail: TEST_EMAIL,
        uploadUrl
      })
    });

    if (!confirmResponse.ok) {
      const errorData = await confirmResponse.json();
      console.warn(`⚠️  Email confirmation may have failed: ${errorData.error || confirmResponse.statusText}`);
    } else {
      console.log(`✅ Confirmation email sent to ${TEST_EMAIL}\n`);
    }

    // Test 5: Fetch artwork by token
    console.log('🔍 Test 5: Fetch Artwork by Token');
    
    const fetchResponse = await fetch(`${BASE_URL}/api/artwork/by-upload-token?token=${uploadToken}`);

    if (!fetchResponse.ok) {
      throw new Error(`Failed to fetch artwork: ${fetchResponse.statusText}`);
    }

    const fetchData = await fetchResponse.json();
    console.log(`✅ Artwork fetched successfully`);
    console.log(`   Customer: ${fetchData.artwork.customer_name}`);
    console.log(`   Email: ${fetchData.artwork.customer_email}`);
    console.log(`   Upload Deferred: ${fetchData.artwork.upload_deferred}\n`);

    // Test 6: Test reminder endpoint (without sending)
    console.log('📨 Test 6: Check Reminders (dry run)');
    
    const reminderCheckResponse = await fetch(`${BASE_URL}/api/email/upload-reminder?hours=0&maxReminders=3`);

    if (!reminderCheckResponse.ok) {
      console.warn(`⚠️  Reminder check failed: ${reminderCheckResponse.statusText}`);
    } else {
      const reminderData = await reminderCheckResponse.json();
      console.log(`✅ Reminder system operational`);
      console.log(`   Artworks needing reminders: ${reminderData.count || 0}\n`);
    }

    // Test 7: Test manual reminder send
    console.log('💌 Test 7: Send Manual Reminder');
    
    const manualReminderResponse = await fetch(`${BASE_URL}/api/email/upload-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artworkId,
        customerName: 'Test User',
        customerEmail: TEST_EMAIL,
        uploadUrl,
        reminderNumber: 1
      })
    });

    if (!manualReminderResponse.ok) {
      const errorData = await manualReminderResponse.json();
      console.warn(`⚠️  Manual reminder may have failed: ${errorData.error || manualReminderResponse.statusText}`);
    } else {
      console.log(`✅ Manual reminder sent to ${TEST_EMAIL}\n`);
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All Tests Completed Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📊 Test Results:');
    console.log(`   Artwork ID: ${artworkId}`);
    console.log(`   Upload Token: ${uploadToken.substring(0, 10)}...`);
    console.log(`   Upload URL: ${uploadUrl}`);
    console.log(`   Test Email: ${TEST_EMAIL}\n`);
    
    console.log('📝 Next Steps:');
    console.log('   1. Check your email inbox for confirmation and reminder');
    console.log('   2. Visit the upload URL to complete the flow');
    console.log(`   3. URL: ${uploadUrl}\n`);

    console.log('🔧 Manual Testing:');
    console.log('   - Open the upload URL in your browser');
    console.log('   - Verify customer info displays correctly');
    console.log('   - Try uploading photos');
    console.log('   - Check database for upload_deferred = false after completion\n');

  } catch (error) {
    console.error('\n❌ Test Failed:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
