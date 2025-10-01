// scripts/test-user-artwork-flow.js
// Comprehensive test for new user/artwork creation flow

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = 'http://localhost:3000';

async function testUserArtworkFlow() {
  console.log('\n🧪 Testing User/Artwork Creation Flow\n');
  console.log('='.repeat(70));
  
  const testEmail = `test-flow-${Date.now()}@example.com`;
  const testName = 'Test User';
  
  try {
    // ========================================
    // TEST 1: Email Capture Creates User ONLY
    // ========================================
    console.log('\n📧 TEST 1: Email Capture (Should create user, NOT artwork)');
    console.log('-'.repeat(70));
    
    const userCreateResponse = await fetch(`${BASE_URL}/api/user/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        customerName: testName,
        userType: 'self_purchaser'
      })
    });

    if (!userCreateResponse.ok) {
      throw new Error('User creation failed');
    }

    const { userId } = await userCreateResponse.json();
    console.log('✅ User created:', userId);

    // Verify user exists in database
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) {
      console.log('⚠️  Could not verify user (auth.users may need service role)');
    } else {
      console.log('✅ User verified in database');
    }

    // Verify NO artwork was created yet
    const { data: artworks, error: artworkError } = await supabase
      .from('artworks')
      .select('*')
      .eq('customer_email', testEmail);

    if (artworkError) {
      throw new Error(`Artwork query failed: ${artworkError.message}`);
    }

    console.log(`✅ Artworks for ${testEmail}: ${artworks.length} (should be 0)`);
    
    if (artworks.length > 0) {
      console.error('❌ FAIL: Artwork was created during email capture!');
      return false;
    }

    console.log('✅ PASS: No artwork created at email capture stage');

    // ========================================
    // TEST 2: Upload Now Creates Artwork
    // ========================================
    console.log('\n\n🚀 TEST 2: "Upload Now" Flow (Should create artwork with user_id)');
    console.log('-'.repeat(70));

    const createArtworkResponse = await fetch(`${BASE_URL}/api/artwork/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: testName,
        customer_email: testEmail,
        user_id: userId,
        email_captured_at: new Date().toISOString(),
        upload_deferred: false,
        user_type: 'self_purchaser'
      })
    });

    if (!createArtworkResponse.ok) {
      const error = await createArtworkResponse.json();
      throw new Error(`Artwork creation failed: ${JSON.stringify(error)}`);
    }

    const { artwork: artwork1 } = await createArtworkResponse.json();
    console.log('✅ Artwork created:', artwork1.id);
    console.log('   user_id:', artwork1.user_id);
    console.log('   upload_deferred:', artwork1.upload_deferred);

    if (artwork1.user_id !== userId) {
      console.error('❌ FAIL: Artwork user_id does not match!');
      return false;
    }

    if (artwork1.upload_deferred !== false) {
      console.error('❌ FAIL: upload_deferred should be false!');
      return false;
    }

    console.log('✅ PASS: Artwork created with correct user_id and upload_deferred=false');

    // ========================================
    // TEST 3: Upload Later Creates Deferred Artwork
    // ========================================
    console.log('\n\n🕒 TEST 3: "Upload Later" Flow (Should create deferred artwork)');
    console.log('-'.repeat(70));

    const createDeferredResponse = await fetch(`${BASE_URL}/api/artwork/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: testName,
        customer_email: testEmail,
        user_id: userId,
        email_captured_at: new Date().toISOString(),
        upload_deferred: true,
        user_type: 'gifter'
      })
    });

    if (!createDeferredResponse.ok) {
      const error = await createDeferredResponse.json();
      throw new Error(`Deferred artwork creation failed: ${JSON.stringify(error)}`);
    }

    const { artwork: artwork2 } = await createDeferredResponse.json();
    console.log('✅ Deferred artwork created:', artwork2.id);
    console.log('   user_id:', artwork2.user_id);
    console.log('   upload_deferred:', artwork2.upload_deferred);
    console.log('   user_type:', artwork2.user_type);

    if (artwork2.user_id !== userId) {
      console.error('❌ FAIL: Deferred artwork user_id does not match!');
      return false;
    }

    if (artwork2.upload_deferred !== true) {
      console.error('❌ FAIL: upload_deferred should be true!');
      return false;
    }

    console.log('✅ PASS: Deferred artwork created with upload_deferred=true');

    // ========================================
    // TEST 4: Verify No Duplicate Users
    // ========================================
    console.log('\n\n👥 TEST 4: Duplicate User Prevention');
    console.log('-'.repeat(70));

    const duplicateUserResponse = await fetch(`${BASE_URL}/api/user/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        customerName: 'Different Name',
        userType: 'gifter'
      })
    });

    if (!duplicateUserResponse.ok) {
      throw new Error('Duplicate user test failed');
    }

    const { userId: sameUserId } = await duplicateUserResponse.json();
    console.log('✅ Same user ID returned:', sameUserId);

    if (userId !== sameUserId) {
      console.error('❌ FAIL: Different user ID returned for same email!');
      return false;
    }

    console.log('✅ PASS: Same user returned for duplicate email');

    // ========================================
    // TEST 5: Verify Artwork Count
    // ========================================
    console.log('\n\n📊 TEST 5: Final Verification');
    console.log('-'.repeat(70));

    const { data: finalArtworks } = await supabase
      .from('artworks')
      .select('*')
      .eq('customer_email', testEmail);

    console.log(`✅ Total artworks for ${testEmail}: ${finalArtworks.length}`);
    console.log(`   Expected: 2 (one immediate, one deferred)`);

    if (finalArtworks.length !== 2) {
      console.error(`❌ FAIL: Expected 2 artworks, got ${finalArtworks.length}`);
      return false;
    }

    // Verify both are linked to same user
    const allLinked = finalArtworks.every(a => a.user_id === userId);
    if (!allLinked) {
      console.error('❌ FAIL: Not all artworks linked to user!');
      return false;
    }

    console.log('✅ PASS: All artworks linked to same user');

    // ========================================
    // CLEANUP
    // ========================================
    console.log('\n\n🧹 Cleanup');
    console.log('-'.repeat(70));

    await supabase
      .from('artworks')
      .delete()
      .eq('customer_email', testEmail);

    console.log('✅ Test artworks deleted');

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n\n' + '='.repeat(70));
    console.log('✨ ALL TESTS PASSED! ✨');
    console.log('='.repeat(70));
    console.log('\n✅ Email capture creates user ONLY');
    console.log('✅ "Upload Now" creates artwork with user_id');
    console.log('✅ "Upload Later" creates deferred artwork');
    console.log('✅ No duplicate users created');
    console.log('✅ All artworks properly linked to user');
    console.log('\n🎉 User/Artwork flow working correctly!\n');

    return true;

  } catch (error) {
    console.error('\n\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Run tests
testUserArtworkFlow()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
